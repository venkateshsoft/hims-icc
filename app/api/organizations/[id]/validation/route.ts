import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildValidationReport, evaluateGoLiveGates } from "@/lib/validation";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [organization, requirements, testPlans, defects, latestAssessment, latestGoLive, incidents, approvals] = await Promise.all([
    prisma.organization.findUnique({ where: { id } }),
    prisma.requirement.findMany({ where: { organizationId: id }, include: { testCases: { include: { executions: true } }, evidence: true }, orderBy: { key: "asc" } }),
    prisma.testPlan.findMany({ where: { project: { organizationId: id } }, include: { testCases: { include: { executions: true } } } }),
    prisma.defect.findMany({ where: { organizationId: id }, orderBy: { severity: "asc" } }),
    prisma.organizationAssessment.findFirst({ where: { organizationId: id }, orderBy: { id: "desc" } }),
    prisma.goLiveAssessment.findFirst({ where: { organizationId: id }, orderBy: { evaluatedAt: "desc" }, include: { gates: true, exceptions: true, approvals: true } }),
    prisma.hypercareIncident.findMany({ where: { organizationId: id }, orderBy: { severity: "asc" } }),
    prisma.approval.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const tests = testPlans.flatMap(p => p.testCases.flatMap(tc => tc.executions.map(ex => ({ key: `${tc.key}-${ex.id.slice(0, 6)}`, title: tc.title, result: ex.result }))));
  const readiness = evaluateGoLiveGates({
    mandatoryRequirementsApproved: requirements.filter(r => r.priority === "CRITICAL" || r.priority === "HIGH").every(r => r.status === "APPROVED"),
    mandatoryTestsPassed: tests.length > 0 && tests.every(t => t.result === "PASSED"),
    criticalDefectsClosed: defects.filter(d => d.severity === "CRITICAL" || d.severity === "HIGH").every(d => d.status === "CLOSED"),
    migrationReconciled: latestGoLive?.migrationReconciled ?? false,
    uatApproved: approvals.some(a => a.type === "UAT" && a.status === "APPROVED"),
    securityApproved: approvals.some(a => a.type === "SECURITY" && a.status === "APPROVED"),
    cutoverPlanApproved: latestGoLive?.cutoverPlanApproved ?? false,
    operationalSupportReady: approvals.some(a => a.type === "OPERATIONS" && a.status === "APPROVED"),
  });
  return NextResponse.json({ organization, requirements, testPlans, defects, tests, incidents, approvals, latestAssessment, latestGoLive, readiness });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as { action?: string; migrationReconciled?: boolean; cutoverPlanApproved?: boolean; approver?: string; reason?: string };
  if (body.action !== "EVALUATE" && body.action !== "APPROVE") return NextResponse.json({ error: "action must be EVALUATE or APPROVE" }, { status: 400 });
  const summary = await fetch(new URL(`/api/organizations/${id}/validation`, request.url)).then(r => r.json());
  const readiness = summary.readiness as ReturnType<typeof evaluateGoLiveGates>;
  if (body.action === "APPROVE" && readiness.decision !== "READY") return NextResponse.json({ error: "Go-live approval blocked", blockers: readiness.blockers, readiness }, { status: 409 });
  const assessment = await prisma.goLiveAssessment.create({ data: { organizationId: id, decision: readiness.decision, migrationReconciled: body.migrationReconciled ?? false, cutoverPlanApproved: body.cutoverPlanApproved ?? false, gates: { create: readiness.gates }, approvals: body.action === "APPROVE" ? { create: { organizationId: id, type: "GO_LIVE", status: "APPROVED", approver: body.approver ?? "Authorized approver", decisionReason: body.reason ?? "All mandatory gates passed." } } : undefined } });
  return NextResponse.json({ assessment, readiness }, { status: body.action === "APPROVE" ? 201 : 200 });
}

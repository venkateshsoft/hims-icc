import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildValidationReport, evaluateGoLiveGates } from "@/lib/validation";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [organization, requirements, plans, defects, incidents, approvals, latestGoLive] = await Promise.all([
    prisma.organization.findUnique({ where: { id } }),
    prisma.requirement.findMany({ where: { organizationId: id }, include: { testCases: { include: { executions: true } } }, orderBy: { key: "asc" } }),
    prisma.testPlan.findMany({ where: { project: { organizationId: id } }, include: { testCases: { include: { executions: true } } } }),
    prisma.defect.findMany({ where: { organizationId: id } }),
    prisma.hypercareIncident.findMany({ where: { organizationId: id } }),
    prisma.approval.findMany({ where: { organizationId: id } }),
    prisma.goLiveAssessment.findFirst({ where: { organizationId: id }, orderBy: { evaluatedAt: "desc" }, include: { exceptions: true } }),
  ]);
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const tests = plans.flatMap(p => p.testCases.flatMap(tc => tc.executions.map(ex => ({ key: tc.key, title: tc.title, result: ex.result }))));
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
  const report = buildValidationReport({ organizationName: organization.name, requirements, tests, defects, incidents, readiness, exceptions: latestGoLive?.exceptions ?? [] });
  const markdown = `# HIMS-ICC Implementation Validation Report\n\n**Organization:** ${report.organizationName}\n**Generated:** ${report.generatedAt}\n**Executive decision:** ${report.executiveDecision}\n\n## Conclusion\n\n${report.conclusion}\n\n## Requirements traceability\n\n- Total requirements: ${report.requirements.total}\n- Approved: ${report.requirements.approved}\n- Uncovered or unapproved: ${report.requirements.uncovered.join(", ") || "None"}\n\n## Test execution\n\n- Total executions: ${report.testing.total}\n- Passed: ${report.testing.passed}\n- Failed: ${report.testing.failed}\n- Blocked: ${report.testing.blocked}\n\n## Mandatory gate blockers\n\n${report.readiness.blockers.map(b => `- **${b.label}:** ${b.detail}`).join("\n") || "None"}\n\n## Unresolved risks and exceptions\n\n${report.unresolvedRisks.map(r => `- **${r.key} — ${r.title}** (${r.severity}, ${r.status})`).join("\n") || "No unresolved defects or hypercare incidents recorded."}\n\n${report.exceptions.map(e => `- **${e.title}** (${e.status}): ${e.justification}`).join("\n") || "No exceptions recorded."}\n\n## Governance note\n\nGo-live approval is only available when every mandatory gate passes. This report is evidence-backed but does not replace authorized clinical, security, regulatory or executive sign-off.`;
  return new NextResponse(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${organization.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-validation-report.md"` } });
}

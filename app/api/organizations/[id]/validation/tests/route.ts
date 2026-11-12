import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executionSchema } from "@/lib/validation";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const plans = await prisma.testPlan.findMany({ where: { project: { organizationId: id } }, include: { testCases: { include: { executions: true, requirement: true } } } }); return NextResponse.json({ plans });
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const parsed = executionSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid test execution", details: parsed.error.flatten() }, { status: 400 });
  const testCase = await prisma.testCase.findFirst({ where: { id: parsed.data.testCaseId, testPlan: { project: { organizationId: id } } } }); if (!testCase) return NextResponse.json({ error: "Test case not found" }, { status: 404 });
  const execution = await prisma.testExecution.create({ data: { testCaseId: testCase.id, result: parsed.data.result, tester: parsed.data.tester }, include: { testCase: true } });
  if (parsed.data.evidenceTitle) await prisma.evidence.create({ data: { organizationId: id, entityType: "TEST_EXECUTION", entityId: execution.id, title: parsed.data.evidenceTitle, notes: parsed.data.evidenceNotes, uploadedBy: parsed.data.tester, testExecutionId: execution.id } });
  return NextResponse.json({ execution }, { status: 201 });
}

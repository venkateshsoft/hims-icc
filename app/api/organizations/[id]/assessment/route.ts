import { NextResponse } from "next/server";
import { assessmentInputSchema, calculateReadiness, gapFromResponse } from "@/lib/assessment";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const assessment = await prisma.organizationAssessment.findFirst({ where: { organizationId: id }, orderBy: { id: "desc" }, include: { responses: { include: { question: true } } } });
  if (!assessment) return NextResponse.json({ assessment: null, message: "No assessment has been submitted." });
  return NextResponse.json({ assessment });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = await request.json();
  const parsed = assessmentInputSchema.safeParse({ ...payload, organizationId: id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid assessment payload", details: parsed.error.flatten() }, { status: 400 });
  const questions = await prisma.assessmentQuestion.findMany({ where: { id: { in: parsed.data.responses.map(r => r.questionId) } } });
  if (questions.length !== parsed.data.responses.length) return NextResponse.json({ error: "One or more question IDs are invalid" }, { status: 400 });
  const byId = new Map(questions.map(q => [q.id, q]));
  const scoringResponses = parsed.data.responses.map(r => ({ questionKey: byId.get(r.questionId)!.key, answer: r.answer }));
  const score = calculateReadiness(questions, scoringResponses);
  const saved = await prisma.$transaction(async tx => {
    const assessment = await tx.organizationAssessment.create({ data: { organizationId: id, version: parsed.data.version, score: score.score, criticalBlockers: score.criticalBlockers, responses: { create: parsed.data.responses.map(r => ({ questionId: r.questionId, questionKey: byId.get(r.questionId)!.key, answer: r.answer, comment: r.comment, evidenceRef: r.evidenceRef })) } }, include: { responses: true } });
    await tx.gap.deleteMany({ where: { organizationId: id, status: "OPEN" } });
    const gaps = parsed.data.responses.map(r => { const q = byId.get(r.questionId)!; return gapFromResponse(q, r.answer, r.comment); }).filter(Boolean).map(gap => ({ ...gap!, organizationId: id }));
    if (gaps.length) await tx.gap.createMany({ data: gaps });
    await tx.auditLog.create({ data: { organizationId: id, action: "ASSESSMENT_SUBMITTED", entityType: "OrganizationAssessment", entityId: assessment.id, metadata: { score: score.score, criticalBlockers: score.criticalBlockers, gapCount: gaps.length } } });
    return assessment;
  });
  return NextResponse.json({ assessment: saved, score }, { status: 201 });
}

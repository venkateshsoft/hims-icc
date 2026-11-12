import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirementSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const parsed = requirementSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid requirement", details: parsed.error.flatten() }, { status: 400 });
  const requirement = await prisma.requirement.create({ data: { organizationId: id, ...parsed.data } });
  return NextResponse.json({ requirement }, { status: 201 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const body = await request.json() as { requirementId?: string; status?: string; designReference?: string; configurationReference?: string };
  if (!body.requirementId || !["DRAFT", "IN_PROGRESS", "APPROVED", "REJECTED"].includes(body.status ?? "")) return NextResponse.json({ error: "requirementId and valid status are required" }, { status: 400 });
  const requirement = await prisma.requirement.update({ where: { id: body.requirementId, organizationId: id }, data: { status: body.status, designReference: body.designReference, configurationReference: body.configurationReference } });
  return NextResponse.json({ requirement });
}

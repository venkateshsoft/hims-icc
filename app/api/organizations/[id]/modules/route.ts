import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const scopes = await prisma.moduleScope.findMany({ where: { organizationId: id }, include: { module: true }, orderBy: { module: { name: "asc" } } });
  return NextResponse.json({ scopes });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as { moduleId?: string; state?: string };
  if (!body.moduleId || !["IN_SCOPE", "OUT_OF_SCOPE", "RETAIN", "REPLACE", "FUTURE_PHASE"].includes(body.state ?? "")) return NextResponse.json({ error: "moduleId and valid state are required" }, { status: 400 });
  const state = body.state!;
  const scope = await prisma.moduleScope.upsert({ where: { organizationId_moduleId: { organizationId: id, moduleId: body.moduleId } }, update: { state }, create: { organizationId: id, moduleId: body.moduleId, state } });
  return NextResponse.json({ scope });
}

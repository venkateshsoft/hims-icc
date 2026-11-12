import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hypercareSchema } from "@/lib/validation";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return NextResponse.json({ incidents: await prisma.hypercareIncident.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" } }) }); }
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; const parsed = hypercareSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid hypercare incident", details: parsed.error.flatten() }, { status: 400 }); const incident = await prisma.hypercareIncident.create({ data: { organizationId: id, ...parsed.data, slaDueAt: parsed.data.slaDueAt ? new Date(parsed.data.slaDueAt) : undefined } }); return NextResponse.json({ incident }, { status: 201 }); }

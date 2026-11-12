import { NextResponse } from "next/server";
import { organizationInputSchema } from "@/lib/assessment";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const organizations = await prisma.organization.findMany({ include: { hospitals: { include: { facilities: { include: { departments: true } } } }, assessments: { orderBy: { id: "desc" }, take: 1 }, gaps: { where: { status: "OPEN" } } }, orderBy: { name: "asc" } });
  return NextResponse.json({ organizations });
}

export async function POST(request: Request) {
  const parsed = organizationInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid organization profile", details: parsed.error.flatten() }, { status: 400 });
  const organization = await prisma.organization.create({ data: parsed.data });
  return NextResponse.json({ organization }, { status: 201 });
}

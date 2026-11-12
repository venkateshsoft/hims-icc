import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gaps = await prisma.gap.findMany({ where: { organizationId: id }, orderBy: [{ severity: "asc" }, { title: "asc" }] });
  const counts = gaps.reduce<Record<string, number>>((acc, gap) => { acc[gap.severity] = (acc[gap.severity] ?? 0) + 1; return acc; }, {});
  return NextResponse.json({ gaps, counts });
}

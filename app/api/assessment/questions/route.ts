import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const questions = await prisma.assessmentQuestion.findMany({ include: { module: true }, orderBy: [{ category: "asc" }, { key: "asc" }] });
  return NextResponse.json({ questions });
}

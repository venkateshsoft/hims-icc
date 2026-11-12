import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const modules = await prisma.hIMSModule.findMany({ orderBy: [{ domain: "asc" }, { name: "asc" }] });
  return NextResponse.json({ modules });
}

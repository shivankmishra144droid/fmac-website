import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
  });
  return NextResponse.json({ achievements });
}

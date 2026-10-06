import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncSource } from "@/lib/events";

// Lo llama el cron de Vercel una vez por día con "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  if (secret.length < 16 || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const sources = await prisma.calendarSource.findMany({ where: { kind: "subscription" }, select: { id: true } });
  const results = await Promise.allSettled(sources.map((s) => syncSource(s.id)));
  return NextResponse.json({ synced: results.filter((r) => r.status === "fulfilled").length, failed: results.filter((r) => r.status === "rejected").length });
}

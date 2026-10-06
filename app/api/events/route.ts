import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureManualSource } from "@/lib/events";
import { parseEventInput } from "@/lib/eventInput";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = parseEventInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  let sourceId = typeof body.sourceId === "string" ? body.sourceId : (await ensureManualSource()).id;
  const src = await prisma.calendarSource.findUnique({ where: { id: sourceId } });
  if (!src || src.kind !== "manual") return NextResponse.json({ error: "Calendario inválido" }, { status: 400 });
  sourceId = src.id;
  return NextResponse.json(await prisma.event.create({ data: { ...(parsed.data as object), sourceId } as never }));
}

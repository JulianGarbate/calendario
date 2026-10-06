import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseEventInput } from "@/lib/eventInput";

type P = { params: Promise<{ id: string }> };

async function manualEvent(id: string) {
  const ev = await prisma.event.findUnique({ where: { id }, include: { source: true } });
  return ev && ev.source.kind === "manual" ? ev : null; // los eventos importados son de solo lectura
}

export async function PATCH(req: Request, { params }: P) {
  const { id } = await params;
  if (!(await manualEvent(id))) return NextResponse.json({ error: "No editable" }, { status: 403 });
  const parsed = parseEventInput(await req.json());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(await prisma.event.update({ where: { id }, data: parsed.data as never }));
}

export async function DELETE(_: Request, { params }: P) {
  const { id } = await params;
  if (!(await manualEvent(id))) return NextResponse.json({ error: "No editable" }, { status: 403 });
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

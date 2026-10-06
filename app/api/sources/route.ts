import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureManualSource, syncSource } from "@/lib/events";

const COLOR = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  await ensureManualSource();
  const rows = await prisma.calendarSource.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { events: true } } } });
  // la URL de una suscripción puede contener un token privado: nunca sale del servidor
  return NextResponse.json(rows.map(({ url, _count, ...r }) => ({ ...r, subscription: !!url, eventCount: _count.events })));
}

export async function POST(req: Request) {
  const { name, color, url } = await req.json();
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  const data = {
    name: name.trim().slice(0, 80),
    color: COLOR.test(color) ? color : "#0071e3",
    kind: url ? "subscription" : "manual",
    url: url ? String(url).trim() : null,
  };
  const src = await prisma.calendarSource.create({ data });
  if (src.url) {
    try {
      const n = await syncSource(src.id);
      return NextResponse.json({ id: src.id, imported: n });
    } catch (e) {
      await prisma.calendarSource.delete({ where: { id: src.id } });
      return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo importar" }, { status: 400 });
    }
  }
  return NextResponse.json({ id: src.id });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDays } from "@/lib/days";
import { ensureManualSource, eventsByDate } from "@/lib/events";
import { isDate } from "@/lib/dates";

type P = { params: Promise<{ date: string }> };

export async function GET(_: Request, { params }: P) {
  const { date } = await params;
  if (!isDate(date)) return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
  await ensureManualSource();
  const [[day], evs, calendars, log, metrics] = await Promise.all([
    generateDays(date, date),
    eventsByDate(date, date),
    prisma.calendarSource.findMany({ where: { kind: "manual" }, select: { id: true, name: true, color: true } }),
    prisma.dayLog.findUnique({ where: { date }, include: { entries: true } }),
    prisma.metricTemplate.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { entries: { where: { date }, orderBy: { createdAt: "asc" } } },
    }),
  ]);
  const done = new Set(log?.entries.filter((e) => e.completed).map((e) => e.habitTemplateId));
  return NextResponse.json({
    date,
    rules: day.rules,
    events: evs.get(date) ?? [],
    calendars,
    habits: day.habits.map((h) => ({ ...h, completed: done.has(h.id) })),
    metrics: metrics.map((m) => ({ id: m.id, name: m.name, unit: m.unit, entries: m.entries })),
  });
}

/** Marca/desmarca un hábito: { habitTemplateId, completed } */
export async function PUT(req: Request, { params }: P) {
  const { date } = await params;
  if (!isDate(date)) return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
  const { habitTemplateId, completed } = await req.json();
  const log = await prisma.dayLog.upsert({ where: { date }, update: {}, create: { date } });
  await prisma.habitEntry.upsert({
    where: { dayLogId_habitTemplateId: { dayLogId: log.id, habitTemplateId } },
    update: { completed: !!completed },
    create: { dayLogId: log.id, habitTemplateId, completed: !!completed },
  });
  return NextResponse.json({ ok: true });
}

/** Agrega un registro de métrica: { metricTemplateId, value } */
export async function POST(req: Request, { params }: P) {
  const { date } = await params;
  if (!isDate(date)) return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
  const { metricTemplateId, value } = await req.json();
  const v = Number(value);
  if (!Number.isFinite(v)) return NextResponse.json({ error: "valor inválido" }, { status: 400 });
  return NextResponse.json(await prisma.metricEntry.create({ data: { metricTemplateId, date, value: v } }));
}

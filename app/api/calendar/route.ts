import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDays } from "@/lib/days";
import { eventsByDate } from "@/lib/events";
import { isDate, parse } from "@/lib/dates";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "";
  if (!isDate(from) || !isDate(to) || to < from || parse(to).getTime() - parse(from).getTime() > 400 * 86400000) {
    return NextResponse.json({ error: "from/to=YYYY-MM-DD (máx 400 días)" }, { status: 400 });
  }
  const [days, evs, entries] = await Promise.all([
    generateDays(from, to),
    eventsByDate(from, to),
    prisma.habitEntry.findMany({
      where: { completed: true, dayLog: { date: { gte: from, lte: to } }, habitTemplate: { active: true } },
      include: { dayLog: true },
    }),
  ]);
  const count = new Map<string, number>();
  for (const e of entries) count.set(e.dayLog.date, (count.get(e.dayLog.date) ?? 0) + 1);
  return NextResponse.json(
    days.map((d) => ({ date: d.date, rules: d.rules, habitsTotal: d.habits.length, habitsDone: count.get(d.date) ?? 0, events: evs.get(d.date) ?? [] })),
  );
}

import { prisma } from "./db";
import { addDays, monthRange, todayStr } from "./dates";

export async function habitStats(month: string) {
  const today = todayStr();
  const habits = await prisma.habitTemplate.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const entries = await prisma.habitEntry.findMany({
    where: { completed: true },
    include: { dayLog: true },
  });
  const done = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!done.has(e.habitTemplateId)) done.set(e.habitTemplateId, new Set());
    done.get(e.habitTemplateId)!.add(e.dayLog.date);
  }
  const { from, to } = monthRange(month);
  const monthEnd = to < today ? to : today; // no penalizar días futuros
  const monthDays = monthEnd >= from ? daysBetween(from, monthEnd) : 0;
  const weekFrom = addDays(today, -6);

  return habits.map((h) => {
    const set = done.get(h.id) ?? new Set<string>();
    // racha actual: hacia atrás desde hoy (si hoy no está marcado, se parte de ayer)
    let cur = 0;
    let d = set.has(today) ? today : addDays(today, -1);
    while (set.has(d)) { cur++; d = addDays(d, -1); }
    // mejor racha
    let best = 0, run = 0, prev: string | null = null;
    for (const day of [...set].sort()) {
      run = prev && addDays(prev, 1) === day ? run + 1 : 1;
      best = Math.max(best, run);
      prev = day;
    }
    const inMonth = [...set].filter((x) => x >= from && x <= monthEnd).length;
    const inWeek = [...set].filter((x) => x >= weekFrom && x <= today).length;
    return {
      id: h.id,
      name: h.name,
      currentStreak: cur,
      bestStreak: best,
      monthPct: monthDays ? Math.round((inMonth / monthDays) * 100) : 0,
      weekPct: Math.round((inWeek / 7) * 100),
      monthDone: inMonth,
      monthDays,
    };
  });
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;
}

export async function metricSeries() {
  const metrics = await prisma.metricTemplate.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { entries: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] } },
  });
  return metrics.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    points: m.entries.map((e) => ({ date: e.date, value: e.value })),
  }));
}

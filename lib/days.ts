import { prisma } from "./db";
import { dateRange, weekday } from "./dates";

export type DayRule = { id: string; title: string; emoji: string };
export type DayHabit = { id: string; name: string };
export type GeneratedDay = { date: string; rules: DayRule[]; habits: DayHabit[] };

export const parseDays = (csv: string): number[] =>
  csv ? csv.split(",").map(Number).filter((n) => n >= 0 && n <= 6) : [];

/** Para cada día del rango: reglas activas que aplican + todos los hábitos activos. */
export async function generateDays(from: string, to: string): Promise<GeneratedDay[]> {
  const [rules, habits] = await Promise.all([
    prisma.recurringRule.findMany({ where: { active: true }, orderBy: { title: "asc" } }),
    prisma.habitTemplate.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const parsed = rules.map((r) => ({ id: r.id, title: r.title, emoji: r.emoji, days: parseDays(r.daysOfWeek) }));
  const hs = habits.map((h) => ({ id: h.id, name: h.name }));
  return dateRange(from, to).map((date) => {
    const wd = weekday(date);
    return {
      date,
      rules: parsed.filter((r) => r.days.includes(wd)).map(({ id, title, emoji }) => ({ id, title, emoji })),
      habits: hs,
    };
  });
}

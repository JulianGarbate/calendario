import { prisma } from "./db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function model(kind: string): any {
  if (kind === "rules") return prisma.recurringRule;
  if (kind === "habits") return prisma.habitTemplate;
  if (kind === "metrics") return prisma.metricTemplate;
  return null;
}

const FIELDS: Record<string, string[]> = {
  rules: ["title", "emoji", "daysOfWeek", "active"],
  habits: ["name", "active"],
  metrics: ["name", "unit", "active"],
};

export function pick(kind: string, body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of FIELDS[kind]) if (f in body) out[f] = body[f];
  return out;
}

import { localParts } from "./tz";

// Todas las fechas son strings "YYYY-MM-DD" (sin timezone) para evitar desfasajes.
export const pad = (n: number) => String(n).padStart(2, "0");

export function todayStr(): string {
  return localParts(new Date()).date;
}

export function parse(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fmt(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(date: string, n: number): string {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

/** 0 = domingo ... 6 = sábado */
export function weekday(date: string): number {
  return parse(date).getUTCDay();
}

export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` };
}

export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isMonth = (s: string) => /^\d{4}-\d{2}$/.test(s);

/** Lunes de la semana de `date`. */
export function startOfWeek(date: string): string {
  return addDays(date, -((weekday(date) + 6) % 7));
}

export function addMonths(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return fmt(new Date(Date.UTC(y, m - 1 + n, Math.min(d, last))));
}

export const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
export const WEEKDAYS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

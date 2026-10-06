import { isDate } from "./dates";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const str = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

/** Valida el cuerpo de un evento manual. Devuelve datos o un mensaje de error. */
export function parseEventInput(b: Record<string, unknown>): { data: Record<string, unknown> } | { error: string } {
  const title = str(b.title, 200);
  if (!title) return { error: "Falta el título" };
  if (typeof b.date !== "string" || !isDate(b.date)) return { error: "Fecha inválida" };
  const endDate = typeof b.endDate === "string" && isDate(b.endDate) && b.endDate >= b.date ? b.endDate : b.date;
  const allDay = b.allDay === true;
  const startTime = !allDay && typeof b.startTime === "string" && TIME.test(b.startTime) ? b.startTime : null;
  const endTime = !allDay && startTime && typeof b.endTime === "string" && TIME.test(b.endTime) ? b.endTime : null;
  return { data: { title, date: b.date, endDate, allDay, startTime, endTime, location: str(b.location, 200), notes: str(b.notes, 2000) } };
}

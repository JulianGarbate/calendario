import { prisma } from "./db";
import { dateRange } from "./dates";
import { fetchIcs } from "./safeFetch";
import { parseIcs } from "./ics";

export type DayEvent = {
  id: string; title: string; color: string; allDay: boolean; startTime: string | null; endTime: string | null;
  location: string | null; notes: string | null; sourceId: string; sourceName: string; readOnly: boolean;
  date: string; endDate: string;
};

/** Eventos visibles agrupados por día (los multi-día aparecen en cada día). */
export async function eventsByDate(from: string, to: string): Promise<Map<string, DayEvent[]>> {
  const rows = await prisma.event.findMany({
    where: { date: { lte: to }, endDate: { gte: from }, source: { visible: true } },
    include: { source: true },
  });
  const map = new Map<string, DayEvent[]>();
  for (const r of rows) {
    const ev: DayEvent = {
      id: r.id, title: r.title, color: r.source.color, allDay: r.allDay, startTime: r.startTime, endTime: r.endTime,
      location: r.location, notes: r.notes, sourceId: r.sourceId, sourceName: r.source.name,
      readOnly: r.source.kind !== "manual", date: r.date, endDate: r.endDate,
    };
    for (const d of dateRange(r.date < from ? from : r.date, r.endDate > to ? to : r.endDate)) {
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(ev);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  }
  return map;
}

export async function ensureManualSource() {
  const existing = await prisma.calendarSource.findFirst({ where: { kind: "manual" } });
  return existing ?? prisma.calendarSource.create({ data: { name: "Personal", kind: "manual", color: "#ff9f0a" } });
}

/** Re-descarga la suscripción y reemplaza sus eventos (ventana: -90 días a +400 días). */
export async function syncSource(id: string): Promise<number> {
  const src = await prisma.calendarSource.findUniqueOrThrow({ where: { id } });
  if (!src.url) throw new Error("Este calendario no es una suscripción");
  try {
    const now = Date.now();
    const events = parseIcs(await fetchIcs(src.url), new Date(now - 90 * 864e5), new Date(now + 400 * 864e5));
    await prisma.$transaction([
      prisma.event.deleteMany({ where: { sourceId: id } }),
      prisma.event.createMany({ data: events.map((e) => ({ ...e, sourceId: id })) }),
      prisma.calendarSource.update({ where: { id }, data: { lastSyncedAt: new Date(), lastError: null } }),
    ]);
    return events.length;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    await prisma.calendarSource.update({ where: { id }, data: { lastError: msg } });
    throw new Error(msg);
  }
}

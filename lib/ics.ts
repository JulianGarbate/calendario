import ical, { type VEvent } from "node-ical";
import { addDays } from "./dates";
import { localParts } from "./tz";

export type ParsedEvent = {
  title: string; date: string; endDate: string; allDay: boolean;
  startTime: string | null; endTime: string | null; location: string | null; notes: string | null; uid: string;
};

const MAX_EVENTS = 5000;
const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "") || null;
const utcDate = (d: Date) => d.toISOString().slice(0, 10);

/** Convierte un .ics en eventos planos, expandiendo repeticiones dentro de [winStart, winEnd]. */
export function parseIcs(text: string, winStart: Date, winEnd: Date): ParsedEvent[] {
  const data = ical.sync.parseICS(text);
  const out: ParsedEvent[] = [];

  const push = (ev: VEvent, start: Date, end: Date | undefined, key: string) => {
    if (out.length >= MAX_EVENTS) return;
    const allDay = ev.datetype === "date" || (ev.start as { dateOnly?: boolean }).dateOnly === true;
    const base = {
      title: clip(typeof ev.summary === "string" ? ev.summary : (ev.summary as { val?: string })?.val, 200) ?? "(sin título)",
      location: clip(ev.location, 200),
      notes: clip(typeof ev.description === "string" ? ev.description : (ev.description as { val?: string })?.val, 2000),
      uid: `${ev.uid}|${key}`,
    };
    if (allDay) {
      const date = utcDate(start);
      // DTEND de un evento de día completo es exclusivo
      const endDate = end && utcDate(end) > date ? addDays(utcDate(end), -1) : date;
      out.push({ ...base, date, endDate: endDate < date ? date : endDate, allDay: true, startTime: null, endTime: null });
    } else {
      const s = localParts(start);
      const e = localParts(end ?? start);
      out.push({ ...base, date: s.date, endDate: e.date < s.date ? s.date : e.date, allDay: false, startTime: s.time, endTime: end ? e.time : null });
    }
  };

  for (const item of Object.values(data)) {
    if (!item || item.type !== "VEVENT") continue;
    const ev = item as VEvent;
    if (!ev.start || (ev.status as string | undefined) === "CANCELLED") continue;
    const duration = ev.end ? ev.end.getTime() - ev.start.getTime() : 0;

    if (ev.rrule) {
      for (const occ of ev.rrule.between(winStart, winEnd, true)) {
        const key = utcDate(occ);
        if (ev.exdate && Object.values(ev.exdate).some((x) => x && utcDate(x as Date) === key)) continue;
        const over = ev.recurrences?.[key] as VEvent | undefined;
        if (over?.start) push(over, over.start, over.end, key);
        else push(ev, occ, ev.end ? new Date(occ.getTime() + duration) : undefined, key);
      }
    } else if (ev.start <= winEnd && (ev.end ?? ev.start) >= winStart) {
      push(ev, ev.start, ev.end, "0");
    }
  }
  return out;
}

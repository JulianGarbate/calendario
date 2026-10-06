"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ClientEvent } from "@/lib/client";
import EventChip from "./EventChip";
import { MONTHS, addDays, addMonths, dateRange, monthRange, startOfWeek, todayStr, weekday } from "@/lib/dates";
import DayDetail, { longDate } from "./DayDetail";
import DayModal from "./DayModal";
import RuleIcon from "./RuleIcon";

type Cell = {
  date: string;
  rules: { id: string; title: string; emoji: string }[];
  habitsTotal: number;
  habitsDone: number;
  events: ClientEvent[];
};
type View = "day" | "week" | "month" | "year";

const VIEWS: { id: View; label: string }[] = [
  { id: "day", label: "Día" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "year", label: "Año" },
];
const HEAD = ["L", "M", "X", "J", "V", "S", "D"];
const SHORT = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function rangeFor(view: View, a: string): { from: string; to: string } {
  if (view === "day") return { from: a, to: a };
  if (view === "week") { const s = startOfWeek(a); return { from: s, to: addDays(s, 6) }; }
  if (view === "month") {
    const { from, to } = monthRange(a.slice(0, 7));
    return { from: startOfWeek(from), to: addDays(startOfWeek(to), 6) };
  }
  return { from: `${a.slice(0, 4)}-01-01`, to: `${a.slice(0, 4)}-12-31` };
}

function titleFor(view: View, a: string): string {
  const y = a.slice(0, 4), m = Number(a.slice(5, 7)) - 1;
  if (view === "year") return y;
  if (view === "month") return `${cap(MONTHS[m])} ${y}`;
  if (view === "day") return longDate(a);
  const s = startOfWeek(a), e = addDays(s, 6);
  const sm = Number(s.slice(5, 7)) - 1, em = Number(e.slice(5, 7)) - 1;
  return sm === em
    ? `${Number(s.slice(8))}–${Number(e.slice(8))} ${MONTHS[sm]} ${e.slice(0, 4)}`
    : `${Number(s.slice(8))} ${MONTHS[sm].slice(0, 3)} – ${Number(e.slice(8))} ${MONTHS[em].slice(0, 3)} ${e.slice(0, 4)}`;
}

function step(view: View, a: string, n: number): string {
  if (view === "day") return addDays(a, n);
  if (view === "week") return addDays(a, 7 * n);
  if (view === "month") return addMonths(a, n);
  return addMonths(a, 12 * n);
}

const Chevron = ({ dir }: { dir: "l" | "r" }) => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === "l" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
  </svg>
);

function Progress({ done, total }: { done: number; total: number }) {
  if (!total) return null;
  const full = done === total;
  return (
    <div className="mt-auto w-full" title={`${done} de ${total} hábitos`}>
      <div className="h-1 overflow-hidden rounded-full bg-fill">
        <div className={`h-full rounded-full ${full ? "bg-ok" : "bg-accent"}`} style={{ width: `${(done / total) * 100}%` }} />
      </div>
    </div>
  );
}

function DayNumber({ date, today, dim }: { date: string; today: string; dim?: boolean }) {
  const isToday = date === today;
  return (
    <span
      className={`grid size-7 place-items-center rounded-full text-sm font-medium ${
        isToday ? "bg-accent text-white" : dim ? "text-muted/60" : ""
      }`}
    >
      {Number(date.slice(8))}
    </span>
  );
}

export default function Calendar() {
  const today = todayStr();
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(today);
  const [cells, setCells] = useState<Cell[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const { from, to } = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const load = useCallback(async () => setCells(await api<Cell[]>(`/api/calendar?from=${from}&to=${to}`)), [from, to]);
  useEffect(() => { load(); }, [load]);

  const inRange = today >= from && today <= to;

  const byDate = useMemo(() => new Map(cells.map((c) => [c.date, c])), [cells]);
  const get = (d: string): Cell => byDate.get(d) ?? { date: d, rules: [], habitsTotal: 0, habitsDone: 0, events: [] };

  function monthGrid(monthAnchor: string, compact: boolean) {
    const mr = monthRange(monthAnchor.slice(0, 7));
    const days = compact
      ? [...Array((weekday(mr.from) + 6) % 7).fill(null), ...dateRange(mr.from, mr.to)]
      : dateRange(rangeFor("month", monthAnchor).from, rangeFor("month", monthAnchor).to);
    return { mr, days: days as (string | null)[] };
  }

  const MonthView = () => {
    const { mr, days } = monthGrid(anchor, false);
    return (
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-line">
        <div className="grid grid-cols-7 border-b border-line py-2 text-center text-xs font-medium text-muted">
          {SHORT.map((h) => <div key={h}>{h}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const c = get(d!);
            const inMonth = d! >= mr.from && d! <= mr.to;
            const full = c.habitsTotal > 0 && c.habitsDone === c.habitsTotal;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                aria-label={longDate(d!)}
                className={`flex min-h-[72px] flex-col items-stretch gap-1 border-b border-r border-line p-1.5 text-left transition-colors hover:bg-fill sm:min-h-28 ${
                  full && inMonth ? "bg-ok-soft" : ""
                } ${inMonth ? "" : "opacity-45"}`}
              >
                <DayNumber date={d!} today={today} />
                <div className="flex flex-wrap items-center gap-0.5 sm:hidden">
                  {c.rules.map((r) => <span key={r.id} className="text-accent" title={r.title}><RuleIcon value={r.emoji} className="size-4" /></span>)}
                  {c.events.slice(0, 4).map((e) => <span key={e.id} className="size-1.5 rounded-full" style={{ backgroundColor: e.color }} />)}
                </div>
                <div className="hidden flex-col gap-0.5 sm:flex">
                  {c.rules.map((r) => (
                    <span key={r.id} className="flex items-center gap-1 truncate rounded-md bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                      <RuleIcon value={r.emoji} /> <span className="truncate">{r.title}</span>
                    </span>
                  ))}
                  {c.events.slice(0, 3).map((e) => <EventChip key={e.id} e={e} day={d!} />)}
                  {c.events.length > 3 && <span className="px-1 text-xs text-muted">+{c.events.length - 3} más</span>}
                </div>
                <Progress done={c.habitsDone} total={c.habitsTotal} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const WeekView = () => (
    <div className="grid gap-2 sm:grid-cols-7">
      {dateRange(from, to).map((d, i) => {
        const c = get(d);
        return (
          <button
            key={d}
            onClick={() => setSelected(d)}
            aria-label={longDate(d)}
            className={`flex min-h-24 flex-row items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 transition-colors hover:bg-fill sm:min-h-64 sm:flex-col sm:items-stretch sm:gap-2 ${
              d === today ? "ring-accent" : "ring-line"
            }`}
          >
            <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0.5">
              <span className="w-8 text-xs font-medium uppercase text-muted sm:w-auto">{SHORT[i]}</span>
              <DayNumber date={d} today={today} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none">
              {c.rules.map((r) => (
                <span key={r.id} className="flex items-center gap-1.5 truncate rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                  <RuleIcon value={r.emoji} /> <span className="truncate">{r.title}</span>
                </span>
              ))}
              {c.events.map((e) => <EventChip key={e.id} e={e} day={d} />)}
            </div>
            {c.habitsTotal > 0 && (
              <div className="w-20 shrink-0 sm:mt-auto sm:w-full">
                <p className="mb-1 text-xs text-muted">{c.habitsDone} de {c.habitsTotal}</p>
                <Progress done={c.habitsDone} total={c.habitsTotal} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  const YearView = () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, m) => {
        const first = `${anchor.slice(0, 4)}-${String(m + 1).padStart(2, "0")}-01`;
        const { days } = monthGrid(first, true);
        return (
          <section key={m} className="rounded-2xl bg-card p-3 ring-1 ring-line">
            <button
              onClick={() => { setAnchor(first); setView("month"); }}
              className={`mb-2 text-sm font-semibold hover:underline ${first.slice(0, 7) === today.slice(0, 7) ? "text-accent" : ""}`}
            >
              {cap(MONTHS[m])}
            </button>
            <div className="mb-1 grid grid-cols-7 text-center text-[10px] text-muted">{HEAD.map((h, i) => <span key={i}>{h}</span>)}</div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {days.map((d, i) => {
                if (!d) return <span key={`b${i}`} />;
                const c = get(d);
                const pct = c.habitsTotal ? c.habitsDone / c.habitsTotal : 0;
                return (
                  <button
                    key={d}
                    onClick={() => setSelected(d)}
                    aria-label={`${longDate(d)}, ${c.habitsDone} de ${c.habitsTotal} hábitos`}
                    className="relative mx-auto grid size-7 place-items-center rounded-full text-xs"
                    style={pct > 0 ? { backgroundColor: `color-mix(in srgb, var(--ok) ${Math.round(25 + pct * 75)}%, transparent)` } : undefined}
                  >
                    <span className={`${d === today ? "font-bold text-accent" : ""} ${pct === 1 ? "font-semibold" : ""}`}>{Number(d.slice(8))}</span>
                    {c.rules.length > 0 && <span className="absolute bottom-0 size-1 rounded-full bg-accent" />}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <button onClick={() => setAnchor(step(view, anchor, -1))} className="btn !px-2.5" aria-label="Anterior"><Chevron dir="l" /></button>
          <h1 className="min-w-0">
            <button
              onClick={() => setAnchor(today)}
              disabled={inRange}
              aria-label={inRange ? titleFor(view, anchor) : `${titleFor(view, anchor)}. Volver a hoy`}
              className="flex min-h-9 items-center gap-2 rounded-[10px] px-2 text-xl font-bold tracking-tight text-fg enabled:hover:bg-fill disabled:cursor-default sm:text-2xl"
            >
              <span className="truncate">{titleFor(view, anchor)}</span>
            </button>
          </h1>
          <button onClick={() => setAnchor(step(view, anchor, 1))} className="btn !px-2.5" aria-label="Siguiente"><Chevron dir="r" /></button>
        </div>
        <div className="flex gap-1 rounded-[10px] bg-fill p-0.5" role="group" aria-label="Vista">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${view === v.id ? "bg-card shadow-sm" : "text-muted hover:text-fg"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "day" && (
        <div className="mx-auto max-w-md rounded-3xl bg-bg">
          <DayDetail date={anchor} onChange={load} />
        </div>
      )}
      {view === "week" && WeekView()}
      {view === "month" && MonthView()}
      {view === "year" && YearView()}

      {selected && (
        <DayModal
          date={selected}
          onClose={() => setSelected(null)}
          onNav={setSelected}
          onChange={load}
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type ClientEvent } from "@/lib/client";
import RuleIcon from "./RuleIcon";
import EventsSection from "./EventsSection";
import { WEEKDAYS, MONTHS, parse } from "@/lib/dates";

type Day = {
  date: string;
  rules: { id: string; title: string; emoji: string }[];
  events: ClientEvent[];
  calendars: { id: string; name: string; color: string }[];
  habits: { id: string; name: string; completed: boolean }[];
  metrics: { id: string; name: string; unit: string; entries: { id: string; value: number }[] }[];
};

export function longDate(date: string) {
  const d = parse(date);
  const w = WEEKDAYS[d.getUTCDay()];
  return `${w[0].toUpperCase()}${w.slice(1)} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}

export default function DayDetail({ date, onChange }: { date: string; onChange?: () => void }) {
  const [day, setDay] = useState<Day | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => setDay(await api<Day>(`/api/day/${date}`)), [date]);
  useEffect(() => { setDay(null); load(); }, [load]);

  async function toggle(id: string, completed: boolean) {
    setDay((d) => d && { ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, completed } : h)) });
    await api(`/api/day/${date}`, "PUT", { habitTemplateId: id, completed });
    onChange?.();
  }

  async function addMetric(id: string) {
    const value = inputs[id]?.replace(",", ".");
    if (!value || isNaN(Number(value))) return;
    await api(`/api/day/${date}`, "POST", { metricTemplateId: id, value: Number(value) });
    setInputs((i) => ({ ...i, [id]: "" }));
    load();
  }

  async function removeMetric(id: string) {
    await api(`/api/metric-entry/${id}`, "DELETE");
    load();
  }

  if (!day) return <p className="py-6 text-center text-sm text-muted">Cargando…</p>;
  const done = day.habits.filter((h) => h.completed).length;

  return (
    <div className="space-y-5">
      {day.rules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {day.rules.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              <RuleIcon value={r.emoji} className="size-4" />{r.title}
            </span>
          ))}
        </div>
      )}

      <EventsSection date={date} events={day.events} calendars={day.calendars} onChange={() => { load(); onChange?.(); }} />

      <section>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Hábitos</h3>
          {day.habits.length > 0 && <span className="text-xs text-muted">{done} de {day.habits.length}</span>}
        </div>
        {day.habits.length === 0 ? (
          <p className="px-1 text-sm text-muted">Sin hábitos. Agregalos en Ajustes.</p>
        ) : (
          <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-line">
            {day.habits.map((h) => (
              <li key={h.id} className="border-b border-line last:border-0">
                <button
                  role="checkbox"
                  aria-checked={h.completed}
                  onClick={() => toggle(h.id, !h.completed)}
                  className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left"
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      h.completed ? "border-ok bg-ok text-white" : "border-muted/60"
                    }`}
                  >
                    {h.completed && (
                      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3L13 4.5" /></svg>
                    )}
                  </span>
                  <span className={h.completed ? "text-muted line-through" : ""}>{h.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Métricas</h3>
        {day.metrics.length === 0 ? (
          <p className="px-1 text-sm text-muted">Sin métricas. Agregalas en Ajustes.</p>
        ) : (
          <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-line">
            {day.metrics.map((m) => (
              <li key={m.id} className="border-b border-line px-4 py-2.5 last:border-0">
                <div className="flex items-center gap-2">
                  <label htmlFor={`m-${m.id}`} className="min-w-0 flex-1 truncate">{m.name}</label>
                  <input
                    id={`m-${m.id}`}
                    inputMode="decimal"
                    placeholder="0"
                    value={inputs[m.id] ?? ""}
                    onChange={(e) => setInputs((i) => ({ ...i, [m.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addMetric(m.id)}
                    className="field w-20 text-right"
                  />
                  <span className="w-8 text-sm text-muted">{m.unit}</span>
                  <button onClick={() => addMetric(m.id)} className="btn btn-primary !px-3" aria-label={`Agregar ${m.name}`}>＋</button>
                </div>
                {m.entries.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.entries.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => removeMetric(e.id)}
                        aria-label={`Borrar registro ${e.value} ${m.unit}`}
                        className="rounded-full bg-fill px-2.5 py-1 text-xs hover:text-danger"
                      >
                        {e.value} {m.unit} ✕
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

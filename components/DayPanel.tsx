"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";

type Day = {
  date: string;
  rules: { id: string; title: string; emoji: string }[];
  habits: { id: string; name: string; completed: boolean }[];
  metrics: { id: string; name: string; unit: string; entries: { id: string; value: number }[] }[];
};

export default function DayPanel({ date, onClose, onNav }: { date: string; onClose: () => void; onNav: (n: number) => void }) {
  const [day, setDay] = useState<Day | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => setDay(await api<Day>(`/api/day/${date}`)), [date]);
  useEffect(() => { load(); }, [load]);

  async function toggle(id: string, completed: boolean) {
    setDay((d) => d && { ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, completed } : h)) });
    await api(`/api/day/${date}`, "PUT", { habitTemplateId: id, completed });
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

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => onNav(-1)} className="px-2">←</button>
          <h2 className="font-semibold">{date}</h2>
          <button onClick={() => onNav(1)} className="px-2">→</button>
        </div>
        {!day ? <p>Cargando…</p> : (
          <>
            {day.rules.length > 0 && (
              <p className="mb-3 text-sm">Hoy toca: {day.rules.map((r) => `${r.emoji} ${r.title}`).join(" · ")}</p>
            )}
            <h3 className="mb-1 text-sm font-semibold text-neutral-500">Hábitos</h3>
            {day.habits.length === 0 && <p className="text-sm text-neutral-500">Sin hábitos. Agregalos en Configuración.</p>}
            <ul className="mb-4 space-y-1">
              {day.habits.map((h) => (
                <li key={h.id}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={h.completed} onChange={(e) => toggle(h.id, e.target.checked)} />
                    <span className={h.completed ? "line-through opacity-60" : ""}>{h.name}</span>
                  </label>
                </li>
              ))}
            </ul>
            <h3 className="mb-1 text-sm font-semibold text-neutral-500">Métricas</h3>
            {day.metrics.length === 0 && <p className="text-sm text-neutral-500">Sin métricas. Agregalas en Configuración.</p>}
            <div className="space-y-3">
              {day.metrics.map((m) => (
                <div key={m.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-sm">{m.name}</span>
                    <input
                      inputMode="decimal"
                      value={inputs[m.id] ?? ""}
                      onChange={(e) => setInputs((i) => ({ ...i, [m.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addMetric(m.id)}
                      className="w-24 rounded border bg-transparent px-2 py-1"
                    />
                    <span className="text-sm text-neutral-500">{m.unit}</span>
                    <button onClick={() => addMetric(m.id)} className="rounded border px-2 py-1 text-sm">+</button>
                  </div>
                  {m.entries.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 pl-28 text-xs">
                      {m.entries.map((e) => (
                        <button key={e.id} onClick={() => removeMetric(e.id)} title="Borrar" className="rounded bg-neutral-200 px-2 py-0.5 dark:bg-neutral-800">
                          {e.value} {m.unit} ✕
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        <button onClick={onClose} className="mt-5 w-full rounded border py-1.5 text-sm">Cerrar</button>
      </div>
    </div>
  );
}

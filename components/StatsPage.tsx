"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/client";
import { todayStr } from "@/lib/dates";

type Stats = {
  habits: { id: string; name: string; currentStreak: number; bestStreak: number; monthPct: number; weekPct: number; monthDone: number; monthDays: number }[];
  metrics: { id: string; name: string; unit: string; points: { date: string; value: number }[] }[];
};

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-fill" role="img" aria-label={`${pct}%`}>
      <div className={`h-full rounded-full ${pct >= 80 ? "bg-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function StatsPage() {
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { api<Stats>(`/api/stats?month=${month}`).then(setStats); }, [month]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
        <input type="month" aria-label="Mes" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="field" />
      </div>
      {!stats ? <p className="text-muted">Cargando…</p> : (
        <>
          <h2 className="mb-2 px-1 text-lg font-semibold">Hábitos</h2>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.habits.map((h) => (
              <article key={h.id} className="rounded-2xl bg-card p-4 ring-1 ring-line">
                <h3 className="mb-3 font-semibold">{h.name}</h3>
                <div className="mb-4 flex gap-6">
                  <div>
                    <p className="text-3xl font-bold leading-none tabular-nums">{h.currentStreak}<span className="ml-1 text-sm font-medium text-muted">días</span></p>
                    <p className="mt-1 text-xs text-muted">Racha actual</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold leading-none tabular-nums">{h.bestStreak}</p>
                    <p className="mt-1 text-xs text-muted">Mejor racha</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs text-muted">
                  <div>
                    <div className="mb-1 flex justify-between"><span>Últimos 7 días</span><span className="tabular-nums text-fg">{h.weekPct}%</span></div>
                    <Bar pct={h.weekPct} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between"><span>Mes ({h.monthDone}/{h.monthDays})</span><span className="tabular-nums text-fg">{h.monthPct}%</span></div>
                    <Bar pct={h.monthPct} />
                  </div>
                </div>
              </article>
            ))}
            {stats.habits.length === 0 && <p className="px-1 text-sm text-muted">Sin hábitos activos.</p>}
          </div>

          <h2 className="mb-2 px-1 text-lg font-semibold">Métricas</h2>
          {stats.metrics.length === 0 && <p className="px-1 text-sm text-muted">Sin métricas activas.</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {stats.metrics.map((m) => {
              const last = m.points[m.points.length - 1];
              return (
                <article key={m.id} className="rounded-2xl bg-card p-4 ring-1 ring-line">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="font-semibold">{m.name}</h3>
                    {last && <p className="text-2xl font-bold tabular-nums">{last.value}<span className="ml-1 text-sm font-medium text-muted">{m.unit}</span></p>}
                  </div>
                  {m.points.length === 0 ? <p className="text-sm text-muted">Sin datos todavía.</p> : (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={m.points} margin={{ left: -16, right: 8, top: 4 }}>
                          <CartesianGrid stroke="var(--line)" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(d: string) => d.slice(5)} axisLine={false} tickLine={false} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--fg)" }} />
                          <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--accent)" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

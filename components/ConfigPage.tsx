"use client";

import { useCallback, useEffect, useState } from "react";
import RuleIcon, { ICONS } from "./RuleIcon";
import { COLORS, DAY_NAMES, api } from "@/lib/client";

type Item = { id: string; active: boolean; title?: string; emoji?: string; daysOfWeek?: string; name?: string; unit?: string };
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // semana desde el lunes

function Section({ kind, title, hint, fields }: { kind: string; title: string; hint: string; fields: ("title" | "emoji" | "days" | "name" | "unit")[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [days, setDays] = useState<number[]>([]);

  const load = useCallback(async () => setItems(await api<Item[]>(`/api/config/${kind}`)), [kind]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    for (const f of fields) if (f !== "days") body[f] = form[f]?.trim() ?? "";
    if (fields.includes("days")) body.daysOfWeek = [...days].sort().join(",");
    const key = fields.includes("title") ? "title" : "name";
    if (!body[key]) return;
    if (kind === "rules" && !body.emoji) body.emoji = "Pin";
    await api(`/api/config/${kind}`, "POST", body);
    setForm({}); setDays([]); load();
  }

  const patch = async (id: string, data: object) => { await api(`/api/config/${kind}/${id}`, "PATCH", data); load(); };
  const remove = async (id: string) => {
    if (confirm("¿Borrar? También se borra su historial.")) { await api(`/api/config/${kind}/${id}`, "DELETE"); load(); }
  };

  return (
    <section className="mb-8">
      <h2 className="px-1 text-lg font-semibold">{title}</h2>
      <p className="mb-2 px-1 text-sm text-muted">{hint}</p>
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-line">
        <ul>
          {items.map((it) => (
            <li key={it.id} className="flex min-h-12 items-center gap-3 border-b border-line px-4 py-2 last:border-0">
              <span className={`min-w-0 flex-1 ${it.active ? "" : "text-muted line-through"}`}>
                {it.emoji && <span className="mr-2 inline-flex align-middle text-accent"><RuleIcon value={it.emoji} className="size-4" /></span>}
                {it.title ?? it.name}
                {it.unit && <span className="text-muted"> · {it.unit}</span>}
                {it.daysOfWeek !== undefined && (
                  <span className="block text-xs text-muted">
                    {it.daysOfWeek.split(",").filter(Boolean).map((d) => DAY_NAMES[+d]).join(" · ") || "sin días"}
                  </span>
                )}
              </span>
              <button
                role="switch"
                aria-checked={it.active}
                aria-label={`${it.active ? "Desactivar" : "Activar"} ${it.title ?? it.name}`}
                onClick={() => patch(it.id, { active: !it.active })}
                className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${it.active ? "bg-ok" : "bg-fill"}`}
              >
                <span className={`absolute top-[2px] size-[22px] rounded-full bg-white shadow transition-all ${it.active ? "left-[20px]" : "left-[2px]"}`} />
              </button>
              <button onClick={() => remove(it.id)} className="text-sm text-danger hover:underline" aria-label={`Borrar ${it.title ?? it.name}`}>Borrar</button>
            </li>
          ))}
          {items.length === 0 && <li className="px-4 py-3 text-sm text-muted">Nada todavía.</li>}
        </ul>
        <form onSubmit={add} className="flex flex-wrap items-center gap-2 border-t border-line bg-bg/50 p-3">
          {fields.includes("emoji") && (
            <div className="flex w-full flex-wrap gap-1" role="group" aria-label="Ícono">
              {Object.entries(ICONS).map(([key, { Icon, label }]) => (
                <button
                  type="button"
                  key={key}
                  title={label}
                  aria-label={label}
                  aria-pressed={(form.emoji ?? "Pin") === key}
                  onClick={() => setForm({ ...form, emoji: key })}
                  className={`grid size-9 place-items-center rounded-lg transition-colors ${(form.emoji ?? "Pin") === key ? "bg-accent text-white" : "bg-fill text-muted hover:text-fg"}`}
                >
                  <Icon className="size-[18px]" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
          {(["title", "name"] as const).filter((f) => fields.includes(f)).map((f) => (
            <input key={f} aria-label="Nombre" placeholder="Nombre" className="field min-w-32 flex-1" value={form[f] ?? ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
          ))}
          {fields.includes("unit") && (
            <input aria-label="Unidad" placeholder="kg" className="field w-24" value={form.unit ?? ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          )}
          {fields.includes("days") && (
            <div className="flex w-full gap-1" role="group" aria-label="Días de la semana">
              {ORDER.map((i) => (
                <button
                  type="button"
                  key={i}
                  aria-pressed={days.includes(i)}
                  onClick={() => setDays(days.includes(i) ? days.filter((d) => d !== i) : [...days, i])}
                  className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${days.includes(i) ? "bg-accent text-white" : "bg-fill text-muted hover:text-fg"}`}
                >
                  {DAY_NAMES[i]}
                </button>
              ))}
            </div>
          )}
          <button type="submit" className="btn btn-primary">Agregar</button>
        </form>
      </div>
    </section>
  );
}

type Source = { id: string; name: string; color: string; kind: string; visible: boolean; subscription: boolean; eventCount: number; lastSyncedAt: string | null; lastError: string | null };

function CalendarsSection() {
  const [items, setItems] = useState<Source[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => setItems(await api<Source[]>("/api/sources")), []);
  useEffect(() => { load(); }, [load]);

  async function call(path: string, method: string, body?: object) {
    const res = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Error");
    return json;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy("add"); setMsg("");
    try {
      const r = await call("/api/sources", "POST", { name, color, url: url.trim() || undefined });
      setMsg(r.imported !== undefined ? `Importados ${r.imported} eventos.` : "Calendario creado.");
      setName(""); setUrl(""); load();
    } catch (err) { setMsg(err instanceof Error ? err.message : "Error"); }
    setBusy(null);
  }

  async function sync(id: string) {
    setBusy(id); setMsg("");
    try { const r = await call(`/api/sources/${id}/sync`, "POST"); setMsg(`Actualizado: ${r.imported} eventos.`); }
    catch (err) { setMsg(err instanceof Error ? err.message : "Error"); }
    setBusy(null); load();
  }

  const patch = async (id: string, data: object) => { await call(`/api/sources/${id}`, "PATCH", data); load(); };
  const remove = async (s: Source) => {
    if (confirm(`¿Borrar "${s.name}" y sus ${s.eventCount} eventos?`)) { await call(`/api/sources/${s.id}`, "DELETE"); load(); }
  };

  return (
    <section className="mb-8">
      <h2 className="px-1 text-lg font-semibold">Calendarios</h2>
      <p className="mb-2 px-1 text-sm text-muted">Suscribite a un link .ics (facultad, Google Calendar…) o creá calendarios propios. Los importados son de solo lectura.</p>
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-line">
        <ul>
          {items.map((s) => (
            <li key={s.id} className="flex min-h-12 flex-wrap items-center gap-3 border-b border-line px-4 py-2 last:border-0">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className={`min-w-0 flex-1 ${s.visible ? "" : "text-muted"}`}>
                {s.name}
                <span className="block text-xs text-muted">
                  {s.subscription ? `Suscripción · ${s.eventCount} eventos` : `Manual · ${s.eventCount} eventos`}
                  {s.lastSyncedAt && ` · sync ${new Date(s.lastSyncedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`}
                </span>
                {s.lastError && <span className="block text-xs text-danger">Error: {s.lastError}</span>}
              </span>
              {s.subscription && (
                <button onClick={() => sync(s.id)} disabled={busy === s.id} className="text-sm text-accent hover:underline disabled:opacity-50">
                  {busy === s.id ? "Actualizando…" : "Actualizar"}
                </button>
              )}
              <button
                role="switch" aria-checked={s.visible} aria-label={`${s.visible ? "Ocultar" : "Mostrar"} ${s.name}`}
                onClick={() => patch(s.id, { visible: !s.visible })}
                className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${s.visible ? "bg-ok" : "bg-fill"}`}
              >
                <span className={`absolute top-[2px] size-[22px] rounded-full bg-white shadow transition-all ${s.visible ? "left-[20px]" : "left-[2px]"}`} />
              </button>
              <button onClick={() => remove(s)} className="text-sm text-danger hover:underline" aria-label={`Borrar ${s.name}`}>Borrar</button>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="flex flex-wrap items-center gap-2 border-t border-line bg-bg/50 p-3">
          <input aria-label="Nombre" placeholder="Nombre (ej: Facultad)" className="field min-w-32 flex-1" value={name} onChange={(e) => setName(e.target.value)} />
          <input aria-label="Link .ics" placeholder="Link .ics o webcal:// (vacío = calendario manual)" className="field w-full" value={url} onChange={(e) => setUrl(e.target.value)} autoComplete="off" />
          <div className="flex w-full gap-1.5" role="group" aria-label="Color">
            {COLORS.map((c) => (
              <button
                type="button" key={c} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)}
                className={`size-7 rounded-full ring-offset-2 ring-offset-card ${color === c ? "ring-2 ring-fg" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="submit" disabled={busy === "add"} className="btn btn-primary disabled:opacity-60">{busy === "add" ? "Importando…" : "Agregar"}</button>
          {msg && <p role="status" className="w-full text-sm text-muted">{msg}</p>}
        </form>
      </div>
    </section>
  );
}

export default function ConfigPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Ajustes</h1>
      <CalendarsSection />
      <Section kind="rules" title="Actividades recurrentes" hint="Lo que toca cada día de la semana. Se muestra como etiqueta en el calendario." fields={["emoji", "title", "days"]} />
      <Section kind="habits" title="Hábitos diarios" hint="Checklist de cumplido / no cumplido, todos los días." fields={["name"]} />
      <Section kind="metrics" title="Métricas" hint="Valores numéricos que seguís en el tiempo." fields={["name", "unit"]} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { api, timeLabel, type ClientEvent } from "@/lib/client";

type Calendar = { id: string; name: string; color: string };
type Form = { title: string; allDay: boolean; startTime: string; endTime: string; endDate: string; location: string; notes: string; sourceId: string };

export default function EventsSection({
  date, events, calendars, onChange,
}: { date: string; events: ClientEvent[]; calendars: Calendar[]; onChange: () => void }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [error, setError] = useState("");
  const [f, setF] = useState<Form>(blank());

  function blank(): Form {
    return { title: "", allDay: false, startTime: "", endTime: "", endDate: date, location: "", notes: "", sourceId: calendars[0]?.id ?? "" };
  }

  function open(ev?: ClientEvent) {
    setError("");
    if (ev) {
      setF({ title: ev.title, allDay: ev.allDay, startTime: ev.startTime ?? "", endTime: ev.endTime ?? "", endDate: ev.endDate, location: ev.location ?? "", notes: ev.notes ?? "", sourceId: ev.sourceId });
      setEditing(ev.id);
    } else {
      setF(blank());
      setEditing("new");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...f, date: editing === "new" ? date : events.find((x) => x.id === editing)?.date ?? date };
    try {
      if (editing === "new") await api("/api/events", "POST", body);
      else await api(`/api/events/${editing}`, "PATCH", body);
      setEditing(null);
      onChange();
    } catch {
      setError("No se pudo guardar. Revisá el título y las horas.");
    }
  }

  async function remove(id: string) {
    await api(`/api/events/${id}`, "DELETE");
    setEditing(null);
    onChange();
  }

  const set = (k: keyof Form, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Eventos</h3>
        {!editing && <button onClick={() => open()} className="text-sm font-medium text-accent hover:underline">＋ Nuevo</button>}
      </div>

      {events.length === 0 && !editing && <p className="px-1 text-sm text-muted">Nada agendado.</p>}
      {events.length > 0 && (
        <ul className="mb-2 overflow-hidden rounded-xl bg-card ring-1 ring-line">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-start gap-3 border-b border-line px-4 py-2.5 last:border-0">
              <span className="mt-1 h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs text-muted">
                  {timeLabel(ev) || "Sin hora"} · {ev.sourceName}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
                {ev.notes && <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted">{ev.notes}</p>}
              </div>
              {!ev.readOnly && (
                <button onClick={() => open(ev)} className="text-sm text-accent hover:underline" aria-label={`Editar ${ev.title}`}>Editar</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <form onSubmit={save} className="space-y-2 rounded-xl bg-card p-3 ring-1 ring-line">
          <input autoFocus aria-label="Título" placeholder="Título" className="field w-full" value={f.title} onChange={(e) => set("title", e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.allDay} onChange={(e) => set("allDay", e.target.checked)} /> Todo el día
          </label>
          {!f.allDay && (
            <div className="flex items-center gap-2 text-sm">
              <input type="time" aria-label="Desde" className="field" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} />
              <span className="text-muted">a</span>
              <input type="time" aria-label="Hasta" className="field" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} />
            </div>
          )}
          {f.allDay && (
            <label className="flex items-center gap-2 text-sm">Hasta
              <input type="date" className="field" min={date} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </label>
          )}
          {calendars.length > 1 && (
            <select aria-label="Calendario" className="field w-full" value={f.sourceId} onChange={(e) => set("sourceId", e.target.value)} disabled={editing !== "new"}>
              {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <input aria-label="Lugar" placeholder="Lugar (opcional)" className="field w-full" value={f.location} onChange={(e) => set("location", e.target.value)} />
          <textarea aria-label="Notas" placeholder="Notas (opcional)" rows={2} className="field w-full" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">Guardar</button>
            <button type="button" onClick={() => setEditing(null)} className="btn">Cancelar</button>
            {editing !== "new" && <button type="button" onClick={() => remove(editing)} className="btn !text-danger">Borrar</button>}
          </div>
        </form>
      )}
    </section>
  );
}

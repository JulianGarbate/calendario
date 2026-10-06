import type { ClientEvent } from "@/lib/client";

/** Etiqueta compacta de evento: barra de color del calendario + hora + título. */
export default function EventChip({ e, day }: { e: ClientEvent; day?: string }) {
  const continues = day && day !== e.date;
  return (
    <span
      className="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-xs"
      style={{ backgroundColor: `color-mix(in srgb, ${e.color} 18%, transparent)`, borderLeft: `3px solid ${e.color}` }}
      title={`${e.title}${e.startTime ? ` · ${e.startTime}` : ""}`}
    >
      {!e.allDay && e.startTime && !continues && <span className="shrink-0 tabular-nums text-muted">{e.startTime}</span>}
      <span className="truncate font-medium">{e.title}</span>
    </span>
  );
}

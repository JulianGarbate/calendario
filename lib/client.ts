export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}`);
  return res.json();
}

export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type ClientEvent = {
  id: string; title: string; color: string; allDay: boolean; startTime: string | null; endTime: string | null;
  location: string | null; notes: string | null; sourceId: string; sourceName: string; readOnly: boolean;
  date: string; endDate: string;
};

export const COLORS = ["#0071e3", "#34c759", "#ff9f0a", "#ff375f", "#af52de", "#5ac8fa", "#8e8e93", "#ffd60a"];

export const timeLabel = (e: Pick<ClientEvent, "allDay" | "startTime" | "endTime">) =>
  e.allDay ? "Todo el día" : e.startTime ? (e.endTime ? `${e.startTime}–${e.endTime}` : e.startTime) : "";

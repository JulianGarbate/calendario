import { NextResponse } from "next/server";
import { habitStats, metricSeries } from "@/lib/stats";
import { isMonth, todayStr } from "@/lib/dates";

export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get("month") ?? todayStr().slice(0, 7);
  if (!isMonth(month)) return NextResponse.json({ error: "month=YYYY-MM" }, { status: 400 });
  const [habits, metrics] = await Promise.all([habitStats(month), metricSeries()]);
  return NextResponse.json({ habits, metrics });
}

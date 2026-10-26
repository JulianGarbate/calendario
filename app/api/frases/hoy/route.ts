import { NextResponse } from "next/server";
import { FRASES } from "@/lib/frases";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Una frase distinta por día, estable durante todo el día
export async function GET() {
  const dia = Math.floor(Date.parse(`${todayStr()}T00:00:00Z`) / 86_400_000);
  return NextResponse.json(FRASES[dia % FRASES.length]);
}

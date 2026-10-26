import { NextResponse } from "next/server";
import { FRASES } from "@/lib/frases";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(FRASES[Math.floor(Math.random() * FRASES.length)]);
}

import { NextResponse } from "next/server";
import { FRASES } from "@/lib/frases";

export async function GET() {
  return NextResponse.json(FRASES);
}

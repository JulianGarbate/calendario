import { NextResponse } from "next/server";
import { FRASES } from "@/lib/frases";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const frase = FRASES.find((f) => f.id === Number(id));
  if (!frase) return NextResponse.json({ error: "Frase no encontrada" }, { status: 404 });
  return NextResponse.json(frase);
}

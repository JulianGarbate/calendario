import { NextResponse } from "next/server";
import { model, pick } from "@/lib/config";

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const m = model(kind);
  if (!m) return NextResponse.json({ error: "kind inválido" }, { status: 404 });
  return NextResponse.json(await m.findMany({ orderBy: { id: "asc" } }));
}

export async function POST(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const m = model(kind);
  if (!m) return NextResponse.json({ error: "kind inválido" }, { status: 404 });
  return NextResponse.json(await m.create({ data: pick(kind, await req.json()) }));
}

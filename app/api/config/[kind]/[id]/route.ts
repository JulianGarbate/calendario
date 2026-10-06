import { NextResponse } from "next/server";
import { model, pick } from "@/lib/config";

type P = { params: Promise<{ kind: string; id: string }> };

export async function PATCH(req: Request, { params }: P) {
  const { kind, id } = await params;
  const m = model(kind);
  if (!m) return NextResponse.json({ error: "kind inválido" }, { status: 404 });
  return NextResponse.json(await m.update({ where: { id }, data: pick(kind, await req.json()) }));
}

export async function DELETE(_: Request, { params }: P) {
  const { kind, id } = await params;
  const m = model(kind);
  if (!m) return NextResponse.json({ error: "kind inválido" }, { status: 404 });
  await m.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

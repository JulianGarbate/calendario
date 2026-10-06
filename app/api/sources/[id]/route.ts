import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type P = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: P) {
  const { id } = await params;
  const b = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim().slice(0, 80);
  if (typeof b.color === "string" && /^#[0-9a-fA-F]{6}$/.test(b.color)) data.color = b.color;
  if (typeof b.visible === "boolean") data.visible = b.visible;
  await prisma.calendarSource.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: P) {
  const { id } = await params;
  await prisma.calendarSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

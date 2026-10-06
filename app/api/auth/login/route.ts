import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, SESSION_DAYS, createSession } from "@/lib/session";

// Límite de intentos por IP, guardado en la base (compartido entre instancias serverless).
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  if (!process.env.APP_PASSWORD_HASH || (process.env.SESSION_SECRET ?? "").length < 32) {
    return NextResponse.json({ error: "El servidor no tiene contraseña configurada" }, { status: 500 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const rec = await prisma.loginThrottle.findUnique({ where: { ip } });
  const active = rec && rec.until.getTime() > Date.now() ? rec : null;
  if (active && active.count >= MAX_FAILS) {
    return NextResponse.json({ error: "Demasiados intentos. Probá en unos minutos." }, { status: 429 });
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  const ok = typeof password === "string" && password.length <= 200 && (await verifyPassword(password, process.env.APP_PASSWORD_HASH));
  if (!ok) {
    const until = new Date(Date.now() + LOCK_MS);
    await prisma.loginThrottle.upsert({ where: { ip }, update: { count: (active?.count ?? 0) + 1, until }, create: { ip, count: 1, until } });
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  await prisma.loginThrottle.deleteMany({ where: { ip } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, (await createSession())!, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return res;
}

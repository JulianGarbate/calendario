import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// /api/cron/sync se protege solo con CRON_SECRET (no tiene cookie de sesión)
const PUBLIC = ["/login", "/api/auth/login", "/api/cron/sync"];
// Frases motivadoras: rutas públicas de solo lectura
const isPublic = (p: string) => PUBLIC.includes(p) || p === "/api/frases" || p.startsWith("/api/frases/");

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Defensa CSRF extra: las escrituras solo se aceptan desde el mismo origen.
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.nextUrl.host) {
      return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
    }
  }

  if (isPublic(pathname)) return NextResponse.next();
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (isApi) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|manifest|disponibilidad/).*)"] };

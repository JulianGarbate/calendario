import dns from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 5 * 1024 * 1024;

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivate(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateV4(ip);
  const l = ip.toLowerCase();
  if (l.startsWith("::ffff:")) return isPrivate(l.slice(7));
  return l === "::" || l === "::1" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe8") || l.startsWith("fe9") || l.startsWith("fea") || l.startsWith("feb");
}

async function assertPublic(url: URL) {
  if (url.protocol !== "https:") throw new Error("El link debe ser https:// (o webcal://)");
  if (url.username || url.password) throw new Error("El link no puede tener usuario/contraseña");
  const addrs = net.isIP(url.hostname) ? [{ address: url.hostname }] : await dns.lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivate(a.address))) throw new Error("Dirección no permitida");
}

/** Descarga un .ics evitando SSRF: solo https, solo IPs públicas (también en redirects), 10s y 5 MB máx. */
export async function fetchIcs(raw: string): Promise<string> {
  let url: URL;
  try { url = new URL(raw.trim().replace(/^webcal/i, "https")); } catch { throw new Error("Link inválido"); }
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000), headers: { Accept: "text/calendar, */*" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Respuesta vacía");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error("El calendario es demasiado grande (máx 5 MB)"); }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("Eso no parece un calendario .ics");
    return text;
  }
  throw new Error("Demasiadas redirecciones");
}

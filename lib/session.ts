// Sesión = "<expira>.<firma HMAC>" en una cookie HttpOnly. Usa Web Crypto: funciona en proxy y en rutas.
export const SESSION_COOKIE = "tracker_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => new Uint8Array((s.match(/../g) ?? []).map((h) => parseInt(h, 16)));

async function key(): Promise<CryptoKey | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null; // sin secreto válido, nada se autentica
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSession(): Promise<string | null> {
  const k = await key();
  if (!k) return null;
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  return `${exp}.${hex(await crypto.subtle.sign("HMAC", k, enc.encode(exp)))}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const k = await key();
  if (!k) return false;
  try {
    return await crypto.subtle.verify("HMAC", k, unhex(sig), enc.encode(exp)); // comparación en tiempo constante
  } catch {
    return false;
  }
}

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** Formato guardado: "scrypt:<salt hex>:<hash hex>" */
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${(await scryptAsync(pw, salt, 64)).toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string | undefined): Promise<boolean> {
  const [kind, salt, hash] = (stored ?? "").split(":");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(pw, Buffer.from(salt, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

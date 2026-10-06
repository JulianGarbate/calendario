// Uso: npm run set-password   → pide la contraseña, genera el hash y el secreto de sesión.
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import readline from "node:readline";
import { hashPassword } from "../lib/password";

function ask(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  // oculta lo que se escribe
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); };
  return new Promise((res) => rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); res(a); }));
}

async function main() {
  const pw = await ask("Nueva contraseña (mín. 10 caracteres): ");
  if (pw.length < 10) { console.error("Muy corta."); process.exit(1); }
  if (pw !== (await ask("Repetila: "))) { console.error("No coinciden."); process.exit(1); }

  const hash = await hashPassword(pw);
  const secret = randomBytes(32).toString("hex");
  const file = ".env.local";
  const keep = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").filter((l) => l && !/^(APP_PASSWORD_HASH|SESSION_SECRET)=/.test(l)) : [];
  // las comillas simples evitan que Next expanda los "$" del hash
  fs.writeFileSync(file, [...keep, `APP_PASSWORD_HASH='${hash}'`, `SESSION_SECRET='${secret}'`, ""].join("\n"), { mode: 0o600 });

  console.log(`\nListo: guardado en ${file} (solo local, no se sube a git).`);
  console.log("\nPara la nube, cargá estas dos variables de entorno en el panel del proveedor:");
  console.log(`APP_PASSWORD_HASH=${hash}`);
  console.log(`SESSION_SECRET=${secret}\n`);
}

main();

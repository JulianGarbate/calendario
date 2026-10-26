// Servidor local de frases (JSON y fondos PNG): node local.js. En Vercel se usan las funciones de api/
const http = require("node:http");
const { todas, azar, hoy, porId, elegir, enviar, enviarPng, soloGet } = require("./rutas");
const { fondo } = require("./fondo");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  if (!soloGet(req, res)) return;
  const { pathname, searchParams } = new URL(req.url, "http://localhost");

  if (pathname === "/frases") return enviar(res, 200, todas());
  if (pathname === "/frases/random") return enviar(res, 200, azar());
  if (pathname === "/frases/hoy") return enviar(res, 200, hoy());
  if (pathname === "/frases/fondo") {
    const frase = elegir(Object.fromEntries(searchParams));
    return frase ? enviarPng(res, await fondo(frase)) : enviar(res, 404, { error: "Frase no encontrada" });
  }
  const m = pathname.match(/^\/frases\/(\d+)$/);
  if (m) {
    const f = porId(m[1]);
    return f ? enviar(res, 200, f) : enviar(res, 404, { error: "Frase no encontrada" });
  }
  enviar(res, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => console.log(`Servidor de frases en http://localhost:${PORT}`));

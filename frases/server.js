// Servidor JSON de frases motivadoras. Sin dependencias: node server.js
const http = require("node:http");
const { todas, azar, hoy, porId, enviar, soloGet } = require("./rutas");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (!soloGet(req, res)) return;
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname === "/frases") return enviar(res, 200, todas());
  if (pathname === "/frases/random") return enviar(res, 200, azar());
  if (pathname === "/frases/hoy") return enviar(res, 200, hoy());
  const m = pathname.match(/^\/frases\/(\d+)$/);
  if (m) {
    const f = porId(m[1]);
    return f ? enviar(res, 200, f) : enviar(res, 404, { error: "Frase no encontrada" });
  }
  enviar(res, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => console.log(`Servidor de frases en http://localhost:${PORT}`));

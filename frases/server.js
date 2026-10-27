// Servidor de frases motivadoras (JSON y fondos de pantalla PNG): node server.js
const http = require("node:http");
const { todas, azar, hoy, porId, elegir, enviar, enviarPng, soloGet } = require("./rutas");
const { fondo } = require("./fondo");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  if (!soloGet(req, res)) return;
  const { pathname, searchParams } = new URL(req.url, "http://localhost");

  if (pathname === "/")
    return enviar(res, 200, {
      rutas: ["/frases", "/frases/random", "/frases/hoy", "/frases/:id", "/frases/fondo", "/frases/:id/fondo", "/frases/fondo?n=N"],
      commit: (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7),
    });
  if (pathname === "/frases") return enviar(res, 200, todas());
  if (pathname === "/frases/random") return enviar(res, 200, azar());
  if (pathname === "/frases/hoy") return enviar(res, 200, hoy());
  // Fondo: /frases/fondo (al azar), /frases/fondo?id=N, /frases/fondo/N o /frases/N/fondo
  const f = pathname.match(/^\/frases\/(?:fondo|(\d+)\/fondo)(?:\/(\d+))?$/);
  if (f) {
    const id = f[1] ?? f[2] ?? searchParams.get("id") ?? undefined;
    const frase = elegir({ ...Object.fromEntries(searchParams), ...(id !== undefined && { id }) });
    if (!frase) return enviar(res, 404, { error: "Frase no encontrada" });
    try {
      return enviarPng(res, await fondo(frase));
    } catch (e) {
      return enviar(res, 500, { error: "No se pudo generar la imagen", detalle: e.message });
    }
  }
  const m = pathname.match(/^\/frases\/(\d+)$/);
  if (m) {
    const f = porId(m[1]);
    return f ? enviar(res, 200, f) : enviar(res, 404, { error: "Frase no encontrada" });
  }
  enviar(res, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => console.log(`Servidor de frases en http://localhost:${PORT}`));

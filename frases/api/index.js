const { enviar, soloGet } = require("../rutas");

// Raíz del servidor: lista las rutas e indica qué commit está desplegado
module.exports = (req, res) =>
  soloGet(req, res) &&
  enviar(res, 200, {
    rutas: ["/frases", "/frases/random", "/frases/hoy", "/frases/:id", "/frases/fondo"],
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7),
    rama: process.env.VERCEL_GIT_COMMIT_REF || "local",
  });

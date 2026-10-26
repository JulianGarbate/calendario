// Servidor JSON de frases motivadoras. Sin dependencias: node server.js
const http = require("node:http");
const frases = require("./frases.json");

const PORT = process.env.PORT || 3000;

const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "Método no permitido" });
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname === "/frases") return send(res, 200, frases);
  if (pathname === "/frases/random") return send(res, 200, frases[Math.floor(Math.random() * frases.length)]);
  if (pathname === "/frases/hoy") {
    const dia = Math.floor(Date.now() / 86_400_000);
    return send(res, 200, frases[dia % frases.length]);
  }
  const m = pathname.match(/^\/frases\/(\d+)$/);
  if (m) {
    const f = frases.find((x) => x.id === Number(m[1]));
    return f ? send(res, 200, f) : send(res, 404, { error: "Frase no encontrada" });
  }
  send(res, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => console.log(`Servidor de frases en http://localhost:${PORT}`));

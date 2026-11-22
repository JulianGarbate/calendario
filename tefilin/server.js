// Servidor "¿puedo ponerme tefilín?" (responde sí o no): node server.js
const http = require("node:http");
const { puedo } = require("./calculo");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { allow: "GET, HEAD" });
    return res.end();
  }
  const { pathname, searchParams } = new URL(req.url, "http://localhost");
  if (pathname !== "/" && pathname !== "/tefilin") {
    res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "Ruta no encontrada" }));
  }
  const r = puedo();
  const respuesta = r.puedo ? "sí" : "no";
  const headers = { "access-control-allow-origin": "*", "cache-control": "no-store" };
  if (searchParams.has("detalle")) {
    res.writeHead(200, { ...headers, "content-type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ puedo: r.puedo, respuesta, motivo: r.motivo }));
  }
  res.writeHead(200, { ...headers, "content-type": "text/plain; charset=utf-8" });
  res.end(respuesta);
});

server.listen(PORT, () => console.log(`Servidor de tefilín en http://localhost:${PORT}`));

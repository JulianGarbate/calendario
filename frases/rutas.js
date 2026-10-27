// Lógica compartida por el servidor local (server.js) y las funciones de Vercel (api/)
const frases = require("./frases.json");

const todas = () => frases;
const azar = () => frases[Math.floor(Math.random() * frases.length)];
const hoy = () => frases[Math.floor(Date.now() / 86_400_000) % frases.length];
const porId = (id) => frases.find((f) => f.id === Number(id));

// Responde en JSON con CORS abierto
const enviar = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
};

// Orden fijo y mezclado de todas las frases (mismo orden en cada pedido): la posición n recorre
// las frases de a una sin repetir hasta completarlas y después vuelve a empezar.
const mezclado = (() => {
  const orden = [...frases];
  let semilla = 20261027;
  const azarFijo = () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(azarFijo() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
})();
const enPosicion = (n) => (/^[1-9]\d*$/.test(n) ? mezclado[(Number(n) - 1) % mezclado.length] : undefined);

// Elige la frase para el fondo: ?id=N, ?n=N (secuencia), ?hoy=1 o, sin parámetros, una al azar
const elegir = ({ id, n, hoy: esHoy } = {}) => {
  if (id !== undefined) return /^\d+$/.test(id) ? porId(id) : undefined;
  if (n !== undefined) return enPosicion(n);
  return esHoy === "1" || esHoy === "true" ? hoy() : azar();
};

// Responde con una imagen PNG; no-store para que cada pedido traiga una frase nueva
const enviarPng = (res, png) => {
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(png);
};

const soloGet = (req, res) => {
  if (req.method === "GET") return true;
  enviar(res, 405, { error: "Método no permitido" });
  return false;
};

module.exports = { todas, azar, hoy, porId, elegir, enviar, enviarPng, soloGet };

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

// Elige la frase para el fondo: ?id=N, ?hoy=1 o, sin parámetros, una al azar
const elegir = ({ id, hoy: esHoy } = {}) => {
  if (id !== undefined) return /^\d+$/.test(id) ? porId(id) : undefined;
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

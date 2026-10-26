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

const soloGet = (req, res) => {
  if (req.method === "GET") return true;
  enviar(res, 405, { error: "Método no permitido" });
  return false;
};

module.exports = { todas, azar, hoy, porId, enviar, soloGet };

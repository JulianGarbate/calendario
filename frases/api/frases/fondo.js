const { elegir, enviar, enviarPng, soloGet } = require("../../rutas");
const { fondo } = require("../../fondo");

module.exports = async (req, res) => {
  if (!soloGet(req, res)) return;
  const frase = elegir(req.query);
  return frase ? enviarPng(res, await fondo(frase)) : enviar(res, 404, { error: "Frase no encontrada" });
};

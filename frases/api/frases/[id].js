const { porId, enviar, soloGet } = require("../../rutas");

module.exports = (req, res) => {
  if (!soloGet(req, res)) return;
  const f = /^\d+$/.test(req.query.id) ? porId(req.query.id) : undefined;
  return f ? enviar(res, 200, f) : enviar(res, 404, { error: "Frase no encontrada" });
};

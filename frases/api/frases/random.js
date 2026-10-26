const { azar, enviar, soloGet } = require("../../rutas");

module.exports = (req, res) => soloGet(req, res) && enviar(res, 200, azar());

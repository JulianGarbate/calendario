// Dibuja el fondo de pantalla (PNG para iPhone 13) con una frase y su autor
const fs = require("node:fs");
const path = require("node:path");
const satori = require("satori").default || require("satori");
const { Resvg } = require("@resvg/resvg-js");

const ANCHO = 1170;
const ALTO = 2532;
const COL = 950; // ancho útil del texto
const ALTO_TEXTO = 640; // alto máximo para la frase (el resto es la línea y el autor)

const fuentes = [
  { name: "Serif", data: fs.readFileSync(path.join(__dirname, "fonts/DejaVuSerif.ttf")), weight: 400 },
  { name: "Sans", data: fs.readFileSync(path.join(__dirname, "fonts/DejaVuSans.ttf")), weight: 400 },
];

// Satori no mide el texto como un navegador: simulo el corte de líneas con un ancho
// medio por letra (conservador para DejaVu Serif) y uso el tamaño más grande que entre.
const lineas = (texto, tam) => {
  const porLinea = Math.floor(COL / (0.6 * tam));
  let n = 1;
  let actual = 0;
  for (const palabra of texto.split(" ")) {
    const largo = palabra.length + (actual ? 1 : 0);
    if (actual + largo > porLinea && actual) {
      n++;
      actual = palabra.length;
    } else actual += largo;
  }
  return n;
};
const tamanoFrase = (texto) => {
  for (let t = 96; t > 44; t -= 2) if (lineas(texto, t) * t * 1.22 <= ALTO_TEXTO) return t;
  return 44;
};

const div = (style, children) => ({ type: "div", props: { style, children } });

const diseno = ({ texto, autor }) =>
  div(
    {
      width: ANCHO,
      height: ALTO,
      display: "flex",
      background: "radial-gradient(circle at 50% 0%, #252932 0%, #0c0d10 72%)",
    },
    [
      div(
        {
          position: "absolute",
          left: 110,
          top: 1230,
          width: COL,
          height: 800,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        },
        [
          div(
            { fontFamily: "Serif", fontSize: tamanoFrase(texto), lineHeight: 1.22, color: "#f4f1ea" },
            `“${texto}”`,
          ),
          div({ width: 90, height: 4, background: "#c9a96a", margin: "56px 0 30px" }, ""),
          div(
            { fontFamily: "Sans", fontSize: 36, letterSpacing: "0.22em", textTransform: "uppercase", color: "#c9a96a" },
            autor,
          ),
        ],
      ),
    ],
  );

// Devuelve un Buffer con el PNG
const fondo = async (frase) => {
  const svg = await satori(diseno(frase), { width: ANCHO, height: ALTO, fonts: fuentes });
  return new Resvg(svg).render().asPng();
};

module.exports = { fondo, tamanoFrase };

// Dibuja el fondo de pantalla (PNG para iPhone 13) con una frase y su autor
const ANCHO = 1170;
const ALTO = 2532;
const COL = 950; // ancho útil del texto
const ALTO_TEXTO = 560; // alto máximo para la frase (el resto es la línea y el autor)
const BASE = 1450; // y donde termina el bloque: arriba de las notificaciones y bajo el reloj
const MARCA_Y = 1250; // y donde empieza el trébol de fondo: debajo de la frase, para no cruzarla

const fuentes = () => {
  const dejavu = require("./fonts/dejavu");
  return [
    { name: "Serif", data: dejavu.serif, weight: 400 },
    { name: "Sans", data: dejavu.sans, weight: 400 },
  ];
};

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
const img = (src, style) => ({ type: "img", props: { src, style } });

// Trébol como imagen SVG: contorno grande y tenue de fondo, y uno dorado chico junto al autor
const trebolSvg = (cuerpo) => {
  const { ANCHO: w, ALTO: h } = require("./trebol");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 ${w + 20} ${h + 20}">${cuerpo}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
};
const trebolContorno = () =>
  trebolSvg(`<path d="${require("./trebol").D}" fill="none" stroke="#c9a96a" stroke-width="9" stroke-linejoin="round" fill-rule="evenodd"/>`);
const trebolDorado = () => trebolSvg(`<path d="${require("./trebol").D}" fill="#c9a96a" fill-rule="evenodd"/>`);

const diseno = ({ texto, autor }) =>
  div(
    {
      width: ANCHO,
      height: ALTO,
      display: "flex",
      background: "radial-gradient(circle at 50% 0%, #252932 0%, #0c0d10 72%)",
    },
    [
      img(trebolContorno(), { position: "absolute", left: 540, top: MARCA_Y, width: 840, height: 807, opacity: 0.2, transform: "rotate(10deg)" }),
      div(
        {
          position: "absolute",
          left: 110,
          top: BASE - 800,
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
          div({ display: "flex", alignItems: "center", margin: "56px 0 30px" }, [
            div({ width: 90, height: 4, background: "#c9a96a", marginRight: 22 }, ""),
            img(trebolDorado(), { width: 52, height: 50 }),
          ]),
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
  const satori = require("satori").default || require("satori");
  const { Resvg } = require("@resvg/resvg-js");
  const svg = await satori(diseno(frase), { width: ANCHO, height: ALTO, fonts: fuentes() });
  return new Resvg(svg).render().asPng();
};

module.exports = { fondo, tamanoFrase };

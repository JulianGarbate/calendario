// ¿Puedo ponerme tefilín ahora? Shabat, Yom Tov, antes de Mishéyakir o después de la puesta del sol: no.
const TZ = process.env.TZ_APP || "America/Argentina/Buenos_Aires";
// Ubicación para calcular amanecer/atardecer (por defecto Buenos Aires)
const LAT = Number(process.env.TEFILIN_LAT ?? -34.6037);
const LON = Number(process.env.TEFILIN_LON ?? -58.3816);
// En Jol HaMoed (días intermedios de Pésaj/Sucot) muchos se los ponen y otros no: TEFILIN_JOL_HAMOED=no para no.
const JOL_HAMOED = (process.env.TEFILIN_JOL_HAMOED ?? "si") !== "no";

const RAD = Math.PI / 180;

// Instante (ms UTC) en que el sol cruza `alt` grados de altura el día y-m-d. Algoritmo NOAA.
function sunTime(y, m, d, alt, subida) {
  const jd = Date.UTC(y, m - 1, d, 12) / 86400000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const mm = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const c =
    Math.sin(mm * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * mm * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * mm * RAD) * 0.000289;
  const lam = l0 + c - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * t) * RAD);
  const eps =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 +
    0.00256 * Math.cos((125.04 - 1934.136 * t) * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lam * RAD));
  const y2 = Math.tan((eps * RAD) / 2) ** 2;
  const eqTime =
    (4 *
      (y2 * Math.sin(2 * l0 * RAD) - 2 * e * Math.sin(mm * RAD) + 4 * e * y2 * Math.sin(mm * RAD) * Math.cos(2 * l0 * RAD) -
        0.5 * y2 * y2 * Math.sin(4 * l0 * RAD) - 1.25 * e * e * Math.sin(2 * mm * RAD))) / RAD;
  const cosH = (Math.sin(alt * RAD) - Math.sin(LAT * RAD) * Math.sin(decl)) / (Math.cos(LAT * RAD) * Math.cos(decl));
  if (cosH < -1 || cosH > 1) return null;
  const h = Math.acos(cosH) / RAD;
  const minutos = 720 - 4 * (LON + (subida ? h : -h)) - eqTime;
  return Date.UTC(y, m - 1, d) + minutos * 60000;
}

const hebreo = new Intl.DateTimeFormat("en-u-ca-hebrew", { timeZone: TZ, day: "numeric", month: "long" });
const diaSemana = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
const fecha = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// Nombre de la fiesta (diáspora, dos días) o null; "Jol HaMoed" para los días intermedios
function fiesta(ahora) {
  const p = Object.fromEntries(hebreo.formatToParts(ahora).map((x) => [x.type, x.value]));
  const dia = Number(p.day);
  if (p.month === "Tishri") {
    if (dia === 1 || dia === 2) return "Rosh Hashaná";
    if (dia === 10) return "Yom Kipur";
    if (dia === 15 || dia === 16) return "Sucot";
    if (dia === 22) return "Shemini Atzeret";
    if (dia === 23) return "Simjat Torá";
    if (dia >= 17 && dia <= 21) return "Jol HaMoed";
  } else if (p.month === "Nisan") {
    if (dia === 15 || dia === 16 || dia === 21 || dia === 22) return "Pésaj";
    if (dia >= 17 && dia <= 20) return "Jol HaMoed";
  } else if (p.month === "Sivan" && (dia === 6 || dia === 7)) return "Shavuot";
  return null;
}

function puedo(ahora = new Date()) {
  if (diaSemana.format(ahora) === "Sat") return { puedo: false, motivo: "Es Shabat" };
  const f = fiesta(ahora);
  if (f === "Jol HaMoed" ? !JOL_HAMOED : f) return { puedo: false, motivo: `Es ${f}` };

  const [y, m, d] = fecha.format(ahora).split("-").map(Number);
  const desde = sunTime(y, m, d, -11.5, true); // Mishéyakir
  const hasta = sunTime(y, m, d, -0.833, false); // puesta del sol
  if (desde == null || hasta == null) return { puedo: true, motivo: "Sin datos solares" };
  const t = ahora.getTime();
  if (t < desde) return { puedo: false, motivo: "Todavía no es la hora (antes de Mishéyakir)" };
  if (t > hasta) return { puedo: false, motivo: "Ya se puso el sol" };
  return { puedo: true, motivo: "Es de día" };
}

module.exports = { puedo };

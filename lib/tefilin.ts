import { APP_TZ, localParts } from "@/lib/tz";

// Ubicación para calcular amanecer/atardecer (por defecto Buenos Aires).
const LAT = Number(process.env.TEFILIN_LAT ?? -34.6037);
const LON = Number(process.env.TEFILIN_LON ?? -58.3816);
// En Jol HaMoed (días intermedios de Pésaj/Sucot) muchos se ponen tefilín (diáspora asquenazí) y otros no.
const JOL_HAMOED = (process.env.TEFILIN_JOL_HAMOED ?? "si") !== "no";

export type TefilinResult = { puedo: boolean; motivo: string };

const RAD = Math.PI / 180;

/** Hora (UTC, ms) en que el sol cruza `alt` grados de altura el día `y-m-d` (am = subida, !am = bajada). Algoritmo NOAA. */
function sunTime(y: number, m: number, d: number, alt: number, am: boolean): number | null {
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
    4 *
    (y2 * Math.sin(2 * l0 * RAD) - 2 * e * Math.sin(mm * RAD) + 4 * e * y2 * Math.sin(mm * RAD) * Math.cos(2 * l0 * RAD) -
      0.5 * y2 * y2 * Math.sin(4 * l0 * RAD) - 1.25 * e * e * Math.sin(2 * mm * RAD)) / RAD;
  const cosH = (Math.sin(alt * RAD) - Math.sin(LAT * RAD) * Math.sin(decl)) / (Math.cos(LAT * RAD) * Math.cos(decl));
  if (cosH < -1 || cosH > 1) return null;
  const h = Math.acos(cosH) / RAD;
  const minutes = 720 - 4 * (LON + (am ? h : -h)) - eqTime; // minutos UTC desde 00:00
  return Date.UTC(y, m - 1, d) + minutes * 60000;
}

const hebFmt = new Intl.DateTimeFormat("en-u-ca-hebrew", { timeZone: APP_TZ, day: "numeric", month: "long" });
const wdFmt = new Intl.DateTimeFormat("en-US", { timeZone: APP_TZ, weekday: "short" });

/** Nombre del día festivo (Yom Tov, diáspora) o null; "Jol HaMoed" para días intermedios. */
function festivo(now: Date): string | null {
  const p = Object.fromEntries(hebFmt.formatToParts(now).map((x) => [x.type, x.value]));
  const day = Number(p.day);
  const month = p.month;
  if (month === "Tishri") {
    if (day === 1 || day === 2) return "Rosh Hashaná";
    if (day === 10) return "Yom Kipur";
    if (day === 15 || day === 16) return "Sucot";
    if (day === 22) return "Shemini Atzeret";
    if (day === 23) return "Simjat Torá";
    if (day >= 17 && day <= 21) return "Jol HaMoed";
  } else if (month === "Nisan") {
    if (day === 15 || day === 16 || day === 21 || day === 22) return "Pésaj";
    if (day >= 17 && day <= 20) return "Jol HaMoed";
  } else if (month === "Sivan" && (day === 6 || day === 7)) return "Shavuot";
  return null;
}

export function puedoPonermeTefilin(now: Date = new Date()): TefilinResult {
  if (wdFmt.format(now) === "Sat") return { puedo: false, motivo: "Es Shabat" };
  const fest = festivo(now);
  if (fest === "Jol HaMoed" ? !JOL_HAMOED : fest) return { puedo: false, motivo: `Es ${fest}` };

  const [y, m, d] = localParts(now).date.split("-").map(Number);
  const desde = sunTime(y, m, d, -11.5, true); // Mishéyakir
  const hasta = sunTime(y, m, d, -0.833, false); // Puesta del sol
  if (desde == null || hasta == null) return { puedo: true, motivo: "Sin datos solares" };
  const t = now.getTime();
  if (t < desde) return { puedo: false, motivo: "Todavía no es la hora (antes de Mishéyakir)" };
  if (t > hasta) return { puedo: false, motivo: "Ya se puso el sol" };
  return { puedo: true, motivo: "Es de día" };
}

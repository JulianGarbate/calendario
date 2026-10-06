// Zona horaria de la app. Configurable con NEXT_PUBLIC_APP_TZ (el servidor en la nube suele estar en UTC).
export const APP_TZ = process.env.NEXT_PUBLIC_APP_TZ || "America/Argentina/Buenos_Aires";

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

/** Fecha y hora de pared de un instante, en la zona de la app. */
export function localParts(d: Date): { date: string; time: string } {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

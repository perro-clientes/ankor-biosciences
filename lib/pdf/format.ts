/** Formatos de fecha del COA (en inglés, sin depender de la zona del servidor). */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

/** "2026-03-16" → "16 March 2026" */
export function formatLongDate(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2028-03-30" → "March 2028" (pie de página) */
export function formatMonthYear(iso: string): string {
  const { y, m } = parts(iso);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2026-03-19T14:37:00" + "PDT" → "Mar 19, 2026 14:37:00 PDT" */
export function formatAssayDate(local: string, timeZone: string): string {
  const { y, m, d } = parts(local);
  const time = local.slice(11);
  const hms = time.length === 5 ? `${time}:00` : time;
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y} ${hms} ${timeZone}`.trim();
}

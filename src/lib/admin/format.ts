export const ARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const fmtARS = (n: number) => ARS.format(n);

const RTF = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });
export function relTime(iso: string | Date | number): string {
  const t = new Date(iso).getTime();
  const diff = t - Date.now();
  const abs = Math.abs(diff);
  const sec = Math.round(diff / 1000);
  if (abs < 60_000) return RTF.format(sec, "second");
  const min = Math.round(diff / 60_000);
  if (abs < 3_600_000) return RTF.format(min, "minute");
  const hr = Math.round(diff / 3_600_000);
  if (abs < 86_400_000) return RTF.format(hr, "hour");
  const day = Math.round(diff / 86_400_000);
  return RTF.format(day, "day");
}

export function shortId(id: string, n = 8) {
  const clean = id.replace(/^tx_/, "");
  return clean.slice(0, n);
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

export function fmtHourLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

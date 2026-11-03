// Utilidades de hora por zona horaria, sin librerías externas.
const formatters = {};

function getFormatter(tz) {
  if (!formatters[tz]) {
    formatters[tz] = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return formatters[tz];
}

// Hora, minuto y segundo de `date` en la zona `tz`
export function zonedParts(date, tz) {
  const parts = {};
  for (const p of getFormatter(tz).formatToParts(date)) parts[p.type] = Number(p.value);
  return parts;
}

// Minutos de diferencia de la zona `tz` respecto a UTC en este momento
export function utcOffsetMinutes(date, tz) {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

// Diferencia legible con la hora del visitante, por ejemplo "+14h" o "-1h 30m"
export function offsetFromLocal(date, tz) {
  const diff = utcOffsetMinutes(date, tz) + date.getTimezoneOffset();
  if (diff === 0) return "same time as you";
  const sign = diff > 0 ? "+" : "-";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${m ? ` ${m}m` : ""} from you`;
}

// Los formateadores de Intl son costosos de crear, así que se guardan por zona y formato
const cached = {};
function fmt(key, tz, options) {
  const k = `${key}|${tz}`;
  if (!cached[k]) cached[k] = new Intl.DateTimeFormat("en-US", { timeZone: tz, ...options });
  return cached[k];
}

export function formatTime(date, tz, withSeconds = false) {
  return fmt(withSeconds ? "hms" : "hm", tz, {
    hour: "numeric",
    minute: "2-digit",
    ...(withSeconds && { second: "2-digit" }),
  }).format(date);
}

export function formatDate(date, tz) {
  return fmt("date", tz, { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export function isDaytime(date, tz) {
  const { hour } = zonedParts(date, tz);
  return hour >= 6 && hour < 18;
}

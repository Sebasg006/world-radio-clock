// Emisoras en vivo desde Radio Browser (https://www.radio-browser.info), API abierta y gratuita.
const SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];

const cache = {};

async function request(path) {
  let lastError;
  for (const server of SERVERS) {
    try {
      // Si un servidor tarda más de 5 s, se prueba el siguiente
      const res = await fetch(server + path, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// Las emisoras más escuchadas del país, solo HTTPS y en formatos que el navegador reproduce
export async function getStations(countryCode) {
  if (cache[countryCode]) return cache[countryCode];

  const params = new URLSearchParams({
    countrycode: countryCode,
    order: "clickcount",
    reverse: "true",
    hidebroken: "true",
    is_https: "true",
    limit: "40",
  });
  const data = await request(`/json/stations/search?${params}`);

  const seen = new Set();
  const stations = data
    .filter((s) => ["MP3", "AAC", "AAC+"].includes(s.codec) && s.url_resolved?.startsWith("https"))
    .filter((s) => {
      const key = s.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 15)
    .map((s) => ({
      id: s.stationuuid,
      name: s.name.trim(),
      url: s.url_resolved,
      favicon: s.favicon?.startsWith("https") ? s.favicon : null,
      tags: s.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3),
    }));

  cache[countryCode] = stations;
  return stations;
}

// Radio Browser pide registrar cada reproducción para mantener sus estadísticas
export function reportClick(stationId) {
  request(`/json/url/${stationId}`).catch(() => {});
}

import cfg from "./config.digitalid.js";
import { init as mapInit, draw as mapDraw } from "./map.js";
import {
  toCsvUrl,
  normalizeCountry,
  splitCountries,
  titleCase,
  normalizeUrl,
  centroidInside,
} from "./utils.js";

// Kick everything off
export async function start(userCfg = cfg) {
  const map = mapInit();

  // 1) Load world polygons (with fallbacks)
  const world = await loadWorld(userCfg.worldSources);

  // Precompute centroids keyed by normalized country name
  const centroids = {};
  L.geoJSON(world).eachLayer((l) => {
    const p = (l.feature && l.feature.properties) || {};
    const nmRaw = p.name || p.NAME || p.NAME_EN || p.ADMIN || p.SOVEREIGNT;
    if (!nmRaw) return;
    const key = normalizeCountry(nmRaw);
    const override = userCfg.centroidOverrides[key];
    centroids[key] = override ? L.latLng(override[0], override[1]) : centroidInside(l.feature);
    if (l.feature.properties) l.feature.properties._key = key;
  });

  // 2) Load CSV (with fallback) + show Updated: header (date script in index.html will format)
  const csvUrl = toCsvUrl(userCfg.sheetPublishedLink);
  const csvText = await fetchCsvOrFallback(`${csvUrl}${csvUrl.includes("?") ? "&" : "?"}cb=${Date.now()}`, userCfg);
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data || [];

  // 3) Normalize rows into “entries”
  const entries = [];
  for (const row of rows) {
    const title = String(row["Title"] || "").trim();
    const status = String(row["Status"] || "").trim();
    const notes = String(row["Description"] || "").trim();
    const year =
      /^\d{4}$/.test(String(row["Year"] || "").trim())
        ? parseInt(row["Year"])
        : null;
    const sourceRaw = String(row["Source"] || row["URL"] || row["Link"] || "").trim();
    const sourceUrl = normalizeUrl(sourceRaw);
    const countriesCell = String(row["Countries"] || "").trim();
    if (!countriesCell) continue;

    for (const raw of splitCountries(countriesCell)) {
      const key = normalizeCountry(raw);
      const alt = key.replace(/^(republic|kingdom)\sof\s/, "").trim();
      const pt = centroids[key] || centroids[alt];
      if (!pt) continue;
      const isImplemented = /implement/i.test(status);
      const isDev = /develop|discussion|pilot|trial|poc|concept/i.test(status);
      entries.push({
        key,
        country: titleCase(key),
        lat: pt.lat,
        lng: pt.lng,
        status,
        isImplemented,
        isDev,
        title,
        notes,
        year,
        sourceUrl,
      });
    }
  }

  // 4) Draw
  mapDraw({ world, entries, centroids, cfg: userCfg, map });
}

async function loadWorld(sources) {
  for (const src of sources) {
    try {
      const r = await fetch(src, { mode: "cors" });
      if (!r.ok) throw 0;
      const j = await r.json();
      if (j && j.features && j.features.length > 100) return j;
    } catch {}
  }
  throw new Error("World polygons failed to load");
}

async function fetchCsvOrFallback(url, userCfg, timeoutMs = 7000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { cache: "no-store", mode: "cors", signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error("Bad status " + res.status);
    const dateHdr = res.headers.get("Date") || new Date().toUTCString();
    const el = document.getElementById("updatedTop");
    if (el) el.textContent = "Updated: " + dateHdr;
    return await res.text();
  } catch (err) {
    console.warn("[CSV] Falling back to embedded sample data:", err);
    const el = document.getElementById("updatedTop");
    if (el) el.textContent = "Updated: " + new Date().toUTCString();
    return userCfg.fallbackCsv;
  }
}

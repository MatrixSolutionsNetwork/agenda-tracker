// Helpers shared across modules

export function toCsvUrl(u) {
  if (!u) return u;
  if (/output=csv/i.test(u)) return u;
  if (/\/pubhtml/i.test(u)) {
    const url = new URL(u);
    url.pathname = url.pathname.replace(/\/pubhtml/i, "/pub");
    url.searchParams.set("output", "csv");
    if (!url.searchParams.has("single")) url.searchParams.set("single", "true");
    return url.toString();
  }
  if (/\/spreadsheets\/d\//i.test(u)) {
    const m = u.match(/\/spreadsheets\/d\/([^/]+)/i);
    if (m) {
      const id = m[1];
      const url = new URL(`https://docs.google.com/spreadsheets/d/${id}/export`);
      url.searchParams.set("format", "csv");
      return url.toString();
    }
  }
  return u;
}

const COUNTRY_ALIASES = new Map([
  ["usa", "united states"],
  ["u.s.a.", "united states"],
  ["u.s.", "united states"],
  ["us", "united states"],
  ["united states of america", "united states"],
  ["uk", "united kingdom"],
  ["england", "united kingdom"],
  ["scotland", "united kingdom"],
  ["wales", "united kingdom"],
  ["northern ireland", "united kingdom"],
  ["uae", "united arab emirates"],
  ["u.a.e.", "united arab emirates"],
  ["türkiye", "turkey"],
  ["turkiye", "turkey"],
  ["republic of korea", "south korea"],
  ["korea (republic of)", "south korea"],
  ["ivory coast", "cote d ivoire"],
  ["côte d’ivoire", "cote d ivoire"],
  ["cote d'ivoire", "cote d ivoire"],
  ["czech republic", "czechia"],
  ["swaziland", "eswatini"],
  ["burma", "myanmar"],
  ["macedonia", "north macedonia"],
  ["lao pdr", "laos"],
  ["democratic republic of congo", "democratic republic of the congo"],
  ["drc", "democratic republic of the congo"],
  ["russian federation", "russia"],
  ["viet nam", "vietnam"],
  ["iran (islamic republic of)", "iran"],
  ["bolivia (plurinational state of)", "bolivia"],
  ["brunei darussalam", "brunei"],
  ["republic of serbia", "serbia"],
  ["canada (ca)", "canada"],
  ["united states (us)", "united states"],
]);

export function normalizeCountry(s = "") {
  const k = String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
  return COUNTRY_ALIASES.get(k) || k;
}

export function splitCountries(cell) {
  return String(cell)
    .replace(/・/g, ",")
    .split(/\s*(?:,|;|\/|&|\band\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function titleCase(s = "") {
  return String(s)
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
}

export function getCSS(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function darken(hex, amt) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  let r = (n >> 16) - amt,
    g = ((n >> 8) & 255) - amt,
    b = (n & 255) - amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0");
}

export function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180,
    R = 6371;
  const dLat = toRad(b[0] - a[0]),
    dLng = toRad(b[1] - a[1]);
  const s1 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1));
}

export function centroidInside(feature) {
  try {
    const c = turf.centerOfMass(feature).geometry.coordinates;
    return L.latLng(c[1], c[0]);
  } catch {
    return L.geoJSON(feature).getBounds().getCenter();
  }
}

export function normalizeUrl(input = "") {
  let u = String(input || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (/^www\./i.test(u)) return "https://" + u;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(u)) return "https://" + u;
  return "";
}

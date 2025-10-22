import { escapeHtml, getCSS, darken, haversine } from "./utils.js";

let _map, _dotsLayer, _linesImpLayer, _linesDevLayer, _shadeLayer;
let _entries = [], _centroids = {};

export function init() {
  const map = L.map("map", { zoomControl: true, preferCanvas: true }).setView([20, 0], 2);

  // Panes: dots/lines below, countries above; popup/tooltip panes are raised via CSS
  map.createPane("labelsPane");   map.getPane("labelsPane").style.zIndex = 450; map.getPane("labelsPane").style.pointerEvents = "none";
  map.createPane("linesPane");    map.getPane("linesPane").style.zIndex  = 600;
  map.createPane("dotsPane");     map.getPane("dotsPane").style.zIndex   = 650;
  map.createPane("countryPane");  map.getPane("countryPane").style.zIndex= 900; // below popup/tooltip panes

  const TILE_OPTS = { subdomains: "abcd", maxZoom: 8, errorTileUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" };
  const baseNoLabels = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png",
    { ...TILE_OPTS, attribution: "&copy; OpenStreetMap &copy; CARTO" }
  ).addTo(map);
  const labelsOnly = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png",
    { ...TILE_OPTS, pane: "labelsPane" }
  ).addTo(map);
  installTileFallback(map, baseNoLabels, labelsOnly);

  const dotsRenderer  = L.canvas({ pane: "dotsPane",  padding: 0.25 });
  const linesRenderer = L.canvas({ pane: "linesPane", padding: 0.25 });

  _linesImpLayer = L.layerGroup([], { pane: "linesPane" }).addTo(map);
  _linesDevLayer = L.layerGroup([], { pane: "linesPane" }).addTo(map);
  _dotsLayer     = L.layerGroup([], { pane: "dotsPane"  }).addTo(map);

  // keep map sized under topbar
  const topbar = document.getElementById("topbar");
  const placeMap = () => {
    const h = topbar.offsetHeight;
    document.documentElement.style.setProperty("--dynBarH", h + "px");
    setTimeout(() => map.invalidateSize(), 0);
  };
  window.addEventListener("load", placeMap);
  window.addEventListener("resize", placeMap);
  if (document.fonts) document.fonts.ready.then(placeMap);
  new ResizeObserver(placeMap).observe(topbar);
  window.addEventListener("orientationchange", () => setTimeout(placeMap, 250), { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(placeMap, 150); });

  _map = map;
  _dotsLayer._renderer      = dotsRenderer;
  _linesImpLayer._renderer  = linesRenderer;
  _linesDevLayer._renderer  = linesRenderer;

  const linesPane = map.getPane("linesPane");
  map.on("zoomstart", () => { if (linesPane) linesPane.style.opacity = "0.05"; });
  map.on("zoomend",   () => { if (linesPane) linesPane.style.opacity = "1";    });

  return map;
}

export function draw({ world, entries, centroids, cfg, map }) {
  _entries = entries;
  _centroids = centroids;

  // outlines (non-interactive)
  L.geoJSON(world, {
    pane: "countryPane",
    interactive: false,
    style: { color: getCSS("--mint"), weight: 0.6, opacity: 0.35, fill: false }
  }).addTo(map);

  // implemented shading (non-interactive)
  _shadeLayer = L.geoJSON(world, {
    pane: "countryPane",
    interactive: false,
    style: () => ({ color: "#0000", weight: 0, fillColor: getCSS("--red"), fillOpacity: 0 })
  }).addTo(map);

  // country hover + click targets
  const defaultStyle = { className: "country-hit", stroke: false, fill: true, fillColor: "#21ff9d", fillOpacity: 0.00 };
  const hoverStyle   = { stroke: true, color: getCSS("--mint"), weight: 1.2, opacity: .85, fillOpacity: 0.16 };

  L.geoJSON(world, {
    pane: "countryPane",
    style: () => defaultStyle,
    interactive: true,
    bubblingMouseEvents: false,
    onEachFeature: (f, layer) => {
      const key = (f.properties && f.properties._key) || "";
      const label = (f.properties && (f.properties.name || f.properties.NAME || f.properties.ADMIN)) || "";

      layer.bindTooltip(`${String(label || "").toUpperCase()} — click to view`, {
        direction: "top", sticky: true, opacity: 0.98, className: "country-tip", pane: "tooltipPane"
      });

      const open = () => openCountryPopup(key);
      layer.on("click", (e) => { L.DomEvent.stopPropagation(e); open(); });
      layer.on("touchstart", (e) => { e.originalEvent.preventDefault(); open(); });

      let hovered = false;
      layer.on("mouseover", () => { if (hovered) return; hovered = true; try { layer.setStyle(hoverStyle); layer.bringToFront(); } catch {} });
      layer.on("mouseout",  () => { hovered = false; try { layer.setStyle(defaultStyle); } catch {} });
    }
  }).addTo(map);

  redraw(cfg);
}

function redraw(cfg) {
  _dotsLayer.clearLayers();
  _linesImpLayer.clearLayers();
  _linesDevLayer.clearLayers();

  const red    = cfg.colors.implemented;
  const orange = cfg.colors.inDev;

  const bestByKey = new Map();
  for (const e of _entries) {
    const prev = bestByKey.get(e.key);
    if (!prev || (e.isImplemented && !prev.isImplemented)) bestByKey.set(e.key, e);
  }

  const impPts = [], devPts = [];
  const implementedShown = new Set();

  for (const [key, e] of bestByKey) {
    const color = e.isImplemented ? red : orange;
    L.circleMarker([e.lat, e.lng], {
      renderer: _dotsLayer._renderer, pane: "dotsPane",
      radius: 6.5, color: darken(color, 30), weight: 1.2, fillColor: color, fillOpacity: .95
    })
      .bindTooltip(`${e.country} — click to view`, { direction: "top", offset: [0, -6], className: "dot-tip", pane: "tooltipPane" })
      .on("click", () => openCountryPopup(key))
      .addTo(_dotsLayer);

    if (e.isImplemented) { impPts.push([e.lat, e.lng]); implementedShown.add(key); }
    else                 { devPts.push([e.lat, e.lng]); }
  }

  if (_shadeLayer) {
    const fill = cfg.colors.shadeFill;
    _shadeLayer.setStyle((f) => {
      const k = (f.properties && f.properties._key) || "";
      return implementedShown.has(k)
        ? { fillColor: fill, fillOpacity: 0.14, color: "#0000", weight: 0 }
        : { fillOpacity: 0, color: "#0000", weight: 0 };
    });
  }

  const K_IMP = 3, K_DEV = 2;
  buildLocalNetwork(impPts, red,   _linesImpLayer, K_IMP, .32, 1.1);
  buildLocalNetwork(devPts, orange,_linesDevLayer, K_DEV, .28, 1.0);
}

export function openCountryPopup(countryKey) {
  if (!countryKey) return;
  const rows = _entries.filter((e) => e.key === countryKey);
  const pt = _centroids[countryKey];
  if (!pt) return;
  const html = rows.length ? popupHTML(rows[0].country, rows) : `<div style="min-width:240px;">No record in dataset.</div>`;
  // Popup pane is the highest z-index in CSS, and pointer-events are enabled, so no click-through
  L.popup({ autoClose: true, closeOnClick: true }).setLatLng(pt).setContent(html).openOn(_map);
}

function popupHTML(country, rows) {
  const list = rows
    .map((r) => {
      const b = [];
      if (r.title) b.push(`<strong>Program:</strong> ${escapeHtml(r.title)}`);
      if (r.status) b.push(`<strong>Status:</strong> ${escapeHtml(r.status)}`);
      if (Number.isInteger(r.year)) b.push(`<strong>Year:</strong> ${r.year}`);
      if (r.notes) b.push(`<span style="opacity:.8">${escapeHtml(r.notes)}</span>`);
      if (r.sourceUrl) {
        const safe = escapeHtml(r.sourceUrl);
        b.push(`<strong>Source:</strong> <a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`);
      }
      return `<div style="margin-bottom:8px">${b.join("<br>")}</div>`;
    })
    .join("");
  return `<div style="min-width:260px">
    <h3 style="margin:0 0 6px 0; font-size:16px; color:${getCSS("--popupTitle")}">${escapeHtml(country)}</h3>
    ${list}
  </div>`;
}

function buildLocalNetwork(coords, color, layer, k = 3, opacity = .35, weight = 1.2) {
  const n = coords.length; if (n < 2) return;
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const dists = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      dists.push({ j, d: haversine(coords[i], coords[j]) });
    }
    dists.sort((a, b) => a.d - b.d);
    const limit = Math.min(k, dists.length);
    for (let t = 0; t < limit; t++) {
      const j = dists[t].j, key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue; seen.add(key);
      L.polyline([coords[i], coords[j]], {
        pane: "linesPane", renderer: layer._renderer, interactive: false,
        color, weight, opacity, smoothFactor: 0.7
      }).addTo(layer);
    }
  }
}

function installTileFallback(map, primary, overlay) {
  let switched = false;
  function switchToFallback() {
    if (switched) return;
    switched = true;
    try {
      if (map.hasLayer(primary)) map.removeLayer(primary);
      if (overlay && map.hasLayer(overlay)) map.removeLayer(overlay);
    } catch {}
    const fallback1 = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 8, attribution: "&copy; OpenStreetMap &copy; CARTO" }
    ).addTo(map);
    let switched2 = false;
    fallback1.on("tileerror", () => {
      if (switched2) return;
      switched2 = true;
      try { if (map.hasLayer(fallback1)) map.removeLayer(fallback1); } catch {}
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 8, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    });
    setTimeout(() => { if (!switched2 && Object.keys(fallback1._tiles || {}).length === 0) fallback1.fire("tileerror"); }, 3000);
  }
  primary.on("tileerror", switchToFallback);
  if (overlay) overlay.on("tileerror", switchToFallback);
  setTimeout(() => {
    const loaded =
      Object.keys(primary._tiles || {}).length +
      (overlay ? Object.keys(overlay._tiles || {}).length : 0);
    if (!switched && loaded === 0) switchToFallback();
  }, 3500);
}

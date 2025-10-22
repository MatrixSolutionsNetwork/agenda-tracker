// Digital ID tracker config
export default {
  sheetPublishedLink:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsoZwmLz701G4Q5zFjGsL_RO8yjfxe4jY0woh-YL_-ATX6Mc4Rzxf3cSP7LzLN9OCt5Is_s1FHHAWs/pub?gid=0&single=true&output=csv",

  // minimal sample for offline fallback
  fallbackCsv: `Title,Status,Description,Year,Countries,Source
UK GOV.UK Wallet,In Development,App launches summer 2025; full wallet by 2027,2025,United Kingdom,https://www.gov.uk/guidance/digital-identity
Turkey e-Devlet,Implemented,National e-Government portal with ID auth services,2012,Turkey,https://www.turkiye.gov.tr/
France EUDI Wallet,In Development,National wallet pilot underway; full wallet by 2026,2026,France,https://france-identite.gouv.fr/`,

  colors: {
    implemented: "#ff3333",
    inDev: "#ff9900",
    shadeFill: "#ff3333",
  },

  worldSources: [
    "https://cdn.jsdelivr.net/npm/world-countries@4/countries.geo.json",
    "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
    "https://unpkg.com/@geo-maps/countries-land-1m@1.0.2/countries-land-1m.geo.json",
  ],

  // Optional overrides for “center of mass” if it feels off
  centroidOverrides: {
    "united kingdom": [52.3555, -1.1743],
    "united states": [39.8283, -98.5795],
    canada: [56.1304, -106.3468],
    spain: [40.4168, -3.7038],
    italy: [42.5, 12.5],
    denmark: [56.2639, 9.5019],
    norway: [60.472, 8.4689],
    russia: [61.524, 105.3188],
    "new zealand": [-41, 172],
    chile: [-35.6751, -71.543],
    "costa rica": [9.7489, -83.7534],
    japan: [36.2048, 138.2529],
    malaysia: [4.2105, 101.9758],
  },
};

export const COUNTRY_ALIASES = new Map([
  ["usa","united states"],["u.s.a.","united states"],["u.s.","united states"],["us","united states"],["united states of america","united states"],
  ["uk","united kingdom"],["england","united kingdom"],["scotland","united kingdom"],["wales","united kingdom"],["northern ireland","united kingdom"],
  ["uae","united arab emirates"],["u.a.e.","united arab emirates"],
  ["türkiye","turkey"],["turkiye","turkey"],
  ["republic of korea","south korea"],["korea (republic of)","south korea"],
  ["ivory coast","cote d ivoire"],["côte d’ivoire","cote d ivoire"],["cote d'ivoire","cote d ivoire"],
  ["czech republic","czechia"],["swaziland","eswatini"],["burma","myanmar"],
  ["macedonia","north macedonia"],["lao pdr","laos"],
  ["democratic republic of congo","democratic republic of the congo"],["drc","democratic republic of the congo"],
  ["russian federation","russia"],["viet nam","vietnam"],["iran (islamic republic of)","iran"],
  ["bolivia (plurinational state of)","bolivia"],["brunei darussalam","brunei"],
  ["republic of serbia","serbia"],["canada (ca)","canada"],["united states (us)","united states"]
])

export const CENTROID_OVERRIDES = new Map([
  ["norway",[60.4720,8.4689]],["russia",[61.5240,105.3188]],["new zealand",[-41,172]],
  ["chile",[-35.6751,-71.5430]],["mauritius",[-20.2,57.5]],["spain",[40.4168,-3.7038]],
  ["italy",[42.5,12.5]],["denmark",[56.2639,9.5019]],["united kingdom",[52.3555,-1.1743]],
  ["serbia",[44.0165,21.0059]],["united states",[39.8283,-98.5795]],["canada",[56.1304,-106.3468]],
  ["costa rica",[9.7489,-83.7534]],["japan",[36.2048,138.2529]],["malaysia",[4.2105,101.9758]]
])

export function normalizeCountry(s){
  const k=String(s||"").normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/gi,' ').replace(/\s+/g,' ').toLowerCase().trim()
  return COUNTRY_ALIASES.get(k)||k
}

export async function loadWorld(){
  const sources=[
    'https://cdn.jsdelivr.net/npm/world-countries@4/countries.geo.json',
    'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
    'https://unpkg.com/@geo-maps/countries-land-1m@1.0.2/countries-land-1m.geo.json'
  ]
  for(const src of sources){
    try{
      const r = await fetch(src,{mode:'cors'})
      if(!r.ok) throw 0
      const j = await r.json()
      if(j && j.features && j.features.length>100) return j
    }catch(e){}
  }
  return null
}

export function centroidInside(feature){
  try{
    const c = turf.centerOfMass(feature).geometry.coordinates
    return L.latLng(c[1],c[0])
  }catch(e){
    return L.geoJSON(feature).getBounds().getCenter()
  }
}

export function buildCentroids(worldGeo){
  const out={}
  L.geoJSON(worldGeo).eachLayer(l=>{
    const p=l.feature&&l.feature.properties||{}
    const nmRaw=p.name||p.NAME||p.NAME_EN||p.ADMIN||p.SOVEREIGNT
    if(!nmRaw) return
    const nm=normalizeCountry(nmRaw)
    out[nm]=CENTROID_OVERRIDES.has(nm)?L.latLng(...CENTROID_OVERRIDES.get(nm)):centroidInside(l.feature)
    if(l.feature.properties) l.feature.properties._key=nm
  })
  return out
}

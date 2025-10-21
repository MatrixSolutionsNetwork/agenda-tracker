import { splitCountries, normalizeUrl, titleCase } from './utils.js'

let _updatedAt = 'Local sample data'

const FALLBACK_CSV = `Title,Status,Description,Year,Countries,Source
National eID,Implemented,Live national digital identity,2023,United Kingdom,https://www.gov.uk/government/collections/digital-identity
Digital ID Pilot,In development,Phase 2 pilot,2025,United States,https://www.nist.gov/topics/identity-access-management
MyKad,Implemented,Malaysia ID,2012,Malaysia,https://www.jpn.gov.my/mykad
DNIe,Implemented,Spain smart ID,2016,Spain,https://www.dnielectronico.es`

export function updatedAt(){ return _updatedAt }

export async function fetchCsvOrFallback(url, timeoutMs=7000){
  try{
    const ctrl = new AbortController()
    const t = setTimeout(()=>ctrl.abort(), timeoutMs)
    const res = await fetch(url.includes('output=csv')? url : toCsvUrl(url), { cache:'no-store', mode:'cors', signal: ctrl.signal })
    clearTimeout(t)
    if(!res.ok) throw new Error('Bad status '+res.status)
    _updatedAt = res.headers.get('Date') || new Date().toUTCString()
    return await res.text()
  }catch(err){
    console.warn('[CSV] fallback due to fetch fail:', err)
    _updatedAt = 'Local sample data'
    return FALLBACK_CSV
  }
}

export function toCsvUrl(u){
  if(!u) return u
  if(/output=csv/i.test(u)) return u
  if(/\/pubhtml/i.test(u)){
    const url=new URL(u)
    url.pathname=url.pathname.replace(/\/pubhtml/i,"/pub")
    url.searchParams.set("output","csv")
    if(!url.searchParams.has("single")) url.searchParams.set("single","true")
    return url.toString()
  }
  if(/\/spreadsheets\/d\//i.test(u)){
    const m=u.match(/\/spreadsheets\/d\/([^/]+)/i)
    if(m){
      const id=m[1]
      const url=new URL(`https://docs.google.com/spreadsheets/d/${id}/export`)
      url.searchParams.set("format","csv")
      return url.toString()
    }
  }
  return u
}

export function parseCsv(text){
  const parsed = Papa.parse(text,{header:true,skipEmptyLines:true})
  return parsed.data || []
}

export function normalize(rows, centroids, cfg, normalizeCountry){
  const out=[]
  for(const row of rows){
    const title = String(row[cfg.fields.title]||"").trim()
    const status = String(row[cfg.fields.status]||"").trim()
    const notes  = String(row[cfg.fields.desc]||"").trim()
    const ycell  = String(row[cfg.fields.year]||"").trim()
    const year   = /^\d{4}$/.test(ycell)? parseInt(ycell) : null
    const sourceRaw = String(row[cfg.fields.source]||row.URL||row.Link||"").trim()
    const sourceUrl = normalizeUrl(sourceRaw)
    const countriesCell = String(row[cfg.fields.countries]||"").trim()
    if(!countriesCell) continue

    for(const raw of splitCountries(countriesCell)){
      const key = normalizeCountry(raw)
      const alt = key.replace(/^(republic|kingdom)\sof\s/,'').trim()
      const pt  = centroids[key]||centroids[alt]
      if(!pt) continue
      const isImplemented = cfg.regex.impl.test(status)
      const isDev = cfg.regex.dev.test(status)
      out.push({
        key,
        country: titleCase(key),
        lat: pt.lat, lng: pt.lng,
        status, isImplemented, isDev,
        title, notes, year, sourceUrl
      })
    }
  }
  return out
}


export function splitCountries(cell){
  return String(cell).replace(/・/g,',').split(/\s*(?:,|;|\/|&|\band\b)\s*/i).map(s=>s.trim()).filter(Boolean)
}
export function titleCase(s){
  return String(s).split(' ').map(w=>w? w[0].toUpperCase()+w.slice(1):'').join(' ')
}
export function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]))
}
export function getCSS(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
export function darken(hex,amt){
  const n=parseInt(String(hex).replace('#',''),16)
  let r=(n>>16)-amt,g=((n>>8)&255)-amt,b=(n&255)-amt
  r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b))
  return '#'+(b|(g<<8)|(r<<16)).toString(16).padStart(6,'0')
}
export function haversine(a,b){
  const toRad=d=>d*Math.PI/180, R=6371
  const dLat=toRad(b[0]-a[0]), dLng=toRad(b[1]-a[1])
  const s1=Math.sin(dLat/2)**2+Math.cos(toRad(a[0]))*Math.cos(toRad(b[0]))*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.sqrt(s1))
}
// clickable safe url
export function normalizeUrl(input){
  let u = String(input||"").trim()
  if(!u) return ""
  if(/^https?:\/\//i.test(u)) return u
  if(/^www\./i.test(u)) return "https://" + u
  if(/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(u)) return "https://" + u
  return ""
}

export function initTopbar(titleText){
  const topbar=document.getElementById('topbar')
  const pageTitle=document.getElementById('pageTitle')
  pageTitle.textContent = titleText || ''
  const placeMap=()=>{ const h=topbar.offsetHeight; document.documentElement.style.setProperty('--dynBarH', h+'px') }
  window.addEventListener('load',placeMap)
  window.addEventListener('resize',placeMap)
  if(document.fonts){document.fonts.ready.then(placeMap)}
}

export function setUpdated(text){
  const el=document.getElementById('updatedTop')
  if(el) el.textContent = 'Updated: ' + (text||'')
}

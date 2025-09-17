const state = { rows: [], filtered: [], q: "", sort: "date_desc", page: 1, pageSize: 20 };
const $ = s => document.querySelector(s);

async function load() {
  const res = await fetch("data.json");
  state.rows = await res.json();
  bind();
  apply();
}

function bind() {
  $("#q").addEventListener("input", e => { state.q = e.target.value.toLowerCase().trim(); state.page = 1; apply(); });
  $("#sort").addEventListener("change", e => { state.sort = e.target.value; apply(); });
  $("#pageSize").addEventListener("change", e => { state.pageSize = parseInt(e.target.value,10); state.page = 1; apply(); });
}

function apply() {
  let rows = state.rows.filter(r => {
    const t = (r.title + " " + r.summary).toLowerCase();
    return state.q ? t.includes(state.q) : true;
  });
  rows.sort((a,b) => {
    if (state.sort === "date_desc") return (b.date || "").localeCompare(a.date || "");
    if (state.sort === "date_asc") return (a.date || "").localeCompare(b.date || "");
    if (state.sort === "title_asc") return a.title.localeCompare(b.title);
    if (state.sort === "title_desc") return b.title.localeCompare(a.title);
    return 0;
  });
  state.filtered = rows;
  render();
}

function render() {
  const start = (state.page - 1) * state.pageSize;
  const pageRows = state.filtered.slice(start, start + state.pageSize);
  const list = $("#list"); list.innerHTML = "";
  for (const r of pageRows) {
    const li = document.createElement("li");
    li.className = "card";
    li.innerHTML = `
      <h4><a href="${r.source_url}" target="_blank" rel="noopener">${escapeHTML(r.title)}</a></h4>
      <div class="meta">${escapeHTML(r.date || "")}</div>
      <p>${escapeHTML(r.summary || "")}</p>
    `;
    list.appendChild(li);
  }
  const pager = $("#pager"); pager.innerHTML = "";
  const pages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  const mk = (label, page, active=false) => {
    const b = document.createElement("button");
    b.textContent = label;
    if (active) b.classList.add("active");
    b.onclick = () => { state.page = page; render(); window.scrollTo({top:0, behavior:"smooth"}); };
    return b;
  };
  pager.appendChild(mk("First", 1, state.page === 1));
  for (let p = Math.max(1, state.page - 2); p <= Math.min(pages, state.page + 2); p++) pager.appendChild(mk(String(p), p, p === state.page));
  pager.appendChild(mk("Last", pages, state.page === pages));
}

function escapeHTML(s){return String(s||"").replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

load();

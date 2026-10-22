"use strict";
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const PALETA = ["#38bdf8", "#22c55e", "#f97316", "#a855f7", "#eab308", "#f43f5e", "#14b8a6", "#ec4899", "#94a3b8"];
const EMOJIS = ["🏫", "⚽", "🏋️", "📚", "🎸", "🎮", "👨‍👩‍👧", "💼", "🍽️", "😴", "🚌", "🎨", "🏊", "🥋", "🧑‍🏫", "🎉", "💊", "🐶", "📌", "🏀", "🚴", "🎬"];
const CLAVE = "disponibilidad-v1";
const PX_HORA = 16;

const base = () => ({
  cats: [
    { id: "colegio", nombre: "Colegio", emoji: "🏫", color: "#38bdf8" },
    { id: "futbol", nombre: "Fútbol", emoji: "⚽", color: "#22c55e" },
    { id: "gym", nombre: "Gym", emoji: "🏋️", color: "#f97316" },
    { id: "estudio", nombre: "Estudio", emoji: "📚", color: "#a855f7" },
  ],
  eventos: [],
  rango: { ini: 7 * 60, fin: 23 * 60 },
});

let S = cargar();
let sel = (new Date().getDay() + 6) % 7; // 0 = lunes

function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (d && d.cats && d.eventos && d.rango) return d;
  } catch (e) {}
  return base();
}
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) {} }
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const aMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const dur = m => { const h = Math.floor(m / 60), r = m % 60; return h && r ? `${h} h ${r} min` : h ? `${h} h` : `${r} min`; };
const cat = id => S.cats.find(c => c.id === id) || { nombre: "Sin categoría", emoji: "📌", color: "#94a3b8" };
const delDia = d => S.eventos.filter(e => e.dias.includes(d)).sort((a, b) => a.ini - b.ini);

// Huecos libres dentro del rango del día, descontando eventos (fusionando solapados).
function huecos(d) {
  const { ini, fin } = S.rango;
  let cur = ini; const out = [];
  for (const e of delDia(d)) {
    if (e.fin <= cur) continue;
    if (e.ini > cur) out.push([cur, Math.min(e.ini, fin)]);
    cur = Math.max(cur, e.fin);
    if (cur >= fin) break;
  }
  if (cur < fin) out.push([cur, fin]);
  return out.filter(([a, b]) => b > a);
}

function render() {
  const { ini, fin } = S.rango;
  const alto = Math.round(((fin - ini) / 60) * PX_HORA);
  const hoy = (new Date().getDay() + 6) % 7;
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();

  let horas = "";
  for (let h = Math.ceil(ini / 60); h * 60 <= fin; h += 2) horas += `<span style="top:${((h * 60 - ini) / 60) * PX_HORA}px">${h}</span>`;

  let cols = "";
  for (let d = 0; d < 7; d++) {
    let bloques = "";
    for (const e of delDia(d)) {
      const a = Math.max(e.ini, ini), b = Math.min(e.fin, fin);
      if (b <= a) continue;
      const c = cat(e.cat);
      bloques += `<div class="blq" style="top:${((a - ini) / 60) * PX_HORA}px;height:${Math.max(((b - a) / 60) * PX_HORA - 1, 3)}px;left:${solape(d, e).l}%;width:${solape(d, e).w}%;background:${c.color}">${b - a >= 45 ? c.emoji : ""}</div>`;
    }
    const linea = d === hoy && ahoraMin >= ini && ahoraMin <= fin ? `<div class="ahora" style="top:${((ahoraMin - ini) / 60) * PX_HORA}px"></div>` : "";
    cols += `<div class="dia${d === sel ? " sel" : ""}${d === hoy ? " hoy" : ""}" data-d="${d}">
      <div class="cab">${DIAS[d]}<b>${hhmmLibre(d)}</b></div><div class="col">${bloques}${linea}</div></div>`;
  }

  const usadas = [...new Set(S.eventos.map(e => e.cat))].map(cat);
  const leyenda = usadas.map(c => `<span><i style="background:${c.color}"></i>${esc(c.nombre)}</span>`).join("");

  const evs = delDia(sel), hs = huecos(sel);
  const libreTot = hs.reduce((t, [a, b]) => t + b - a, 0);
  const lineas = [
    ...evs.map(e => ({ t: e.ini, html: filaEvento(e) })),
    ...hs.map(([a, b]) => ({ t: a - 0.5, html: `<div class="hueco">🟢 Libre ${hhmm(a)}–${hhmm(b)} · ${dur(b - a)}</div>` })),
  ].sort((x, y) => x.t - y.t).map(x => x.html).join("");

  document.getElementById("app").innerHTML = `
    <header>
      <div><h1>Mi semana</h1><div class="sub">Verde = disponible · tocá un día para ver el detalle</div></div>
      <button class="ico" id="aj" aria-label="Ajustes">⚙️</button>
    </header>
    <div class="semana" style="--alto:${alto}px;--hora:${PX_HORA}px">
      <div class="horas">${horas}</div><div class="dias">${cols}</div>
    </div>
    <div class="leyenda">${leyenda}</div>
    <div class="dettit"><h2>${DIAS_LARGO[sel]}${sel === hoy ? " · hoy" : ""}</h2><span class="libre-tot">${dur(libreTot)} libres</span></div>
    ${lineas || '<div class="vacio">Sin eventos. Tocá + para agregar uno.</div>'}`;
}

function hhmmLibre(d) { return Math.round(huecos(d).reduce((t, [a, b]) => t + b - a, 0) / 60) + "h"; }

// Carriles para eventos solapados dentro del mismo día.
function solape(d, e) {
  const evs = delDia(d), grupo = evs.filter(x => x.ini < e.fin && x.fin > e.ini);
  const i = grupo.indexOf(e), n = grupo.length;
  return { l: (i / n) * 100, w: 100 / n };
}

function filaEvento(e) {
  const c = cat(e.cat);
  const rep = e.dias.length === 7 ? "Todos los días" : e.dias.length > 1 ? e.dias.map(d => DIAS[d]).join(" ") : "";
  return `<button class="fila" style="--c:${c.color}" data-e="${e.id}">
    <span class="em">${c.emoji}</span>
    <span><div class="t">${esc(e.titulo || c.nombre)}</div><div class="h">${hhmm(e.ini)} – ${hhmm(e.fin)} · ${dur(e.fin - e.ini)}</div></span>
    <span class="rep">${rep}</span></button>`;
}

/* ---------- Hoja modal ---------- */
const vel = document.getElementById("vel"), hoja = document.getElementById("hoja");
function abrir(html) { hoja.innerHTML = html; vel.classList.add("on"); hoja.scrollTop = 0; }
function cerrar() { vel.classList.remove("on"); }
vel.addEventListener("click", e => { if (e.target === vel) cerrar(); });

function formEvento(id) {
  const ex = S.eventos.find(e => e.id === id);
  const ev = ex ? { ...ex, dias: [...ex.dias] } : { id: uid(), titulo: "", cat: S.cats[0] ? S.cats[0].id : "", dias: [sel], ini: 16 * 60, fin: 17 * 60 + 30 };
  const pintar = () => {
    hoja.innerHTML = `<h3>${ex ? "Editar evento" : "Nuevo evento"}</h3>
      <label>Categoría</label>
      <div class="chips">${S.cats.map(c => `<button class="chip${c.id === ev.cat ? " on" : ""}" style="--c:${c.color}" data-c="${c.id}">${c.emoji} ${esc(c.nombre)}</button>`).join("")}
        <button class="chip" id="nc">＋ Nueva</button></div>
      <label>Título (opcional)</label>
      <input type="text" id="tt" value="${esc(ev.titulo)}" placeholder="Ej: Entrenamiento con el club" maxlength="40">
      <label>Días</label>
      <div class="dchips">${DIAS.map((n, i) => `<button class="chip${ev.dias.includes(i) ? " on" : ""}" data-d="${i}">${n[0]}</button>`).join("")}</div>
      <div class="par"><div><label>Desde</label><input type="time" id="hi" value="${hhmm(ev.ini)}"></div>
      <div><label>Hasta</label><input type="time" id="hf" value="${hhmm(ev.fin)}"></div></div>
      <div class="acciones">${ex ? '<button class="btn peli" id="bo">Borrar</button>' : ""}<button class="btn" id="bc">Cancelar</button><button class="btn pri" id="bg">Guardar</button></div>`;
    const sync = () => { ev.titulo = hoja.querySelector("#tt").value; ev.ini = aMin(hoja.querySelector("#hi").value || "00:00"); ev.fin = aMin(hoja.querySelector("#hf").value || "00:00"); };
    hoja.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { sync(); ev.cat = b.dataset.c; pintar(); });
    hoja.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { sync(); const d = +b.dataset.d; ev.dias = ev.dias.includes(d) ? ev.dias.filter(x => x !== d) : [...ev.dias, d]; pintar(); });
    hoja.querySelector("#nc").onclick = () => { sync(); formCategoria(null, nueva => { if (nueva) ev.cat = nueva; pintar(); }); };
    hoja.querySelector("#bc").onclick = cerrar;
    if (ex) hoja.querySelector("#bo").onclick = () => { if (confirm("¿Borrar este evento?")) { S.eventos = S.eventos.filter(e => e.id !== id); guardar(); cerrar(); render(); } };
    hoja.querySelector("#bg").onclick = () => {
      sync();
      if (!ev.dias.length) return alert("Elegí al menos un día.");
      if (ev.fin <= ev.ini) return alert("La hora de fin tiene que ser posterior a la de inicio.");
      if (ex) S.eventos = S.eventos.map(e => e.id === id ? ev : e); else S.eventos.push(ev);
      guardar(); cerrar(); render();
    };
  };
  abrir(""); pintar();
}

function formCategoria(id, alTerminar) {
  const ex = S.cats.find(c => c.id === id);
  const c = ex ? { ...ex } : { id: uid(), nombre: "", emoji: EMOJIS[0], color: PALETA[S.cats.length % PALETA.length] };
  hoja.innerHTML = `<h3>${ex ? "Editar categoría" : "Nueva categoría"}</h3>
    <label>Nombre</label><input type="text" id="cn" value="${esc(c.nombre)}" placeholder="Ej: Inglés, Guitarra, Amigos…" maxlength="24">
    <label>Ícono</label><div class="emojis">${EMOJIS.map(e => `<button data-e="${e}" class="${e === c.emoji ? "on" : ""}">${e}</button>`).join("")}</div>
    <label>Color</label><div class="colores">${PALETA.map(p => `<button data-p="${p}" style="--c:${p}" class="${p === c.color ? "on" : ""}"></button>`).join("")}</div>
    <div class="acciones"><button class="btn" id="bc">Cancelar</button><button class="btn pri" id="bg">Guardar</button></div>`;
  const marca = (sel, attr, val) => hoja.querySelectorAll(sel).forEach(b => b.classList.toggle("on", b.dataset[attr] === val));
  hoja.querySelectorAll("[data-e]").forEach(b => b.onclick = () => { c.emoji = b.dataset.e; marca("[data-e]", "e", c.emoji); });
  hoja.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { c.color = b.dataset.p; marca("[data-p]", "p", c.color); });
  hoja.querySelector("#bc").onclick = () => alTerminar(null);
  hoja.querySelector("#bg").onclick = () => {
    c.nombre = hoja.querySelector("#cn").value.trim();
    if (!c.nombre) return alert("Poné un nombre.");
    if (ex) S.cats = S.cats.map(x => x.id === c.id ? c : x); else S.cats.push(c);
    guardar(); alTerminar(c.id);
  };
}

function ajustes() {
  const pintar = () => {
    hoja.innerHTML = `<h3>Ajustes</h3>
      <label>Categorías</label>
      ${S.cats.map(c => `<div class="catfila" style="--c:${c.color}"><span class="pt"></span><span class="n">${c.emoji} ${esc(c.nombre)}</span><button class="mini" data-ed="${c.id}">Editar</button><button class="mini" data-bo="${c.id}">✕</button></div>`).join("")}
      <div class="acciones"><button class="btn" id="nc">＋ Nueva categoría</button></div>
      <label>Horario que cuenta como "día" (para calcular lo libre)</label>
      <div class="par"><input type="time" id="ri" value="${hhmm(S.rango.ini)}"><input type="time" id="rf" value="${hhmm(S.rango.fin === 1440 ? 1439 : S.rango.fin)}"></div>
      <div class="acciones"><button class="btn pri" id="ok">Listo</button></div>`;
    hoja.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formCategoria(b.dataset.ed, () => { ajustes(); render(); }));
    hoja.querySelectorAll("[data-bo]").forEach(b => b.onclick = () => {
      const n = S.eventos.filter(e => e.cat === b.dataset.bo).length;
      if (!confirm(n ? `Esta categoría tiene ${n} evento(s) y también se borrarán. ¿Seguir?` : "¿Borrar categoría?")) return;
      S.cats = S.cats.filter(c => c.id !== b.dataset.bo); S.eventos = S.eventos.filter(e => e.cat !== b.dataset.bo);
      guardar(); pintar(); render();
    });
    hoja.querySelector("#nc").onclick = () => formCategoria(null, () => { ajustes(); render(); });
    hoja.querySelector("#ok").onclick = () => {
      const i = aMin(hoja.querySelector("#ri").value || "07:00"), f = aMin(hoja.querySelector("#rf").value || "23:00");
      if (f - i >= 180) { S.rango = { ini: i, fin: f }; guardar(); }
      cerrar(); render();
    };
  };
  abrir(""); pintar();
}

document.getElementById("fab").onclick = () => formEvento(null);
document.getElementById("app").addEventListener("click", e => {
  const dia = e.target.closest("[data-d]"), fila = e.target.closest("[data-e]"), aj = e.target.closest("#aj");
  if (aj) return ajustes();
  if (fila) return formEvento(fila.dataset.e);
  if (dia) { sel = +dia.dataset.d; render(); }
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
render();

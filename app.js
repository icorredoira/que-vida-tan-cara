'use strict';

const KEY = 'nuestras-cuentas-v1';
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const PALETTE = ['#e57373','#f06292','#ba68c8','#9575cd','#7986cb','#64b5f6','#4fc3f7','#4db6ac','#81c784','#aed581','#ffd54f','#ffb74d','#ff8a65','#a1887f','#90a4ae'];

const DEFAULTS = {
  names: { joint: 'Cuenta conjunta', a: 'Persona 1', b: 'Persona 2' },
  categories: {
    expense: [
      { emoji: '🛒', name: 'Supermercado', color: '#e57373' },
      { emoji: '🍽️', name: 'Restaurantes', color: '#ffb74d' },
      { emoji: '🏠', name: 'Casa / Alquiler', color: '#9575cd' },
      { emoji: '💡', name: 'Facturas', color: '#ffd54f' },
      { emoji: '🚌', name: 'Transporte', color: '#64b5f6' },
      { emoji: '🚗', name: 'Coche', color: '#4fc3f7' },
      { emoji: '💊', name: 'Salud', color: '#4db6ac' },
      { emoji: '🎬', name: 'Ocio', color: '#f06292' },
      { emoji: '👕', name: 'Ropa', color: '#ba68c8' },
      { emoji: '🎁', name: 'Regalos', color: '#ff8a65' },
      { emoji: '✈️', name: 'Viajes', color: '#7986cb' },
      { emoji: '🐾', name: 'Mascotas', color: '#a1887f' },
      { emoji: '📚', name: 'Educación', color: '#81c784' },
      { emoji: '📦', name: 'Otros', color: '#90a4ae' }
    ],
    income: [
      { emoji: '💼', name: 'Nómina', color: '#2e9e6b' },
      { emoji: '💸', name: 'Extra', color: '#81c784' },
      { emoji: '🎁', name: 'Regalo', color: '#aed581' },
      { emoji: '🔁', name: 'Transferencia', color: '#4db6ac' },
      { emoji: '📦', name: 'Otros', color: '#90a4ae' }
    ]
  },
  tx: [] // { id, acc, type:'expense'|'income', amount, cat, date:'YYYY-MM-DD', note }
};

/* ---------- estado ---------- */
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.tx) && s.names && s.categories) return s;
  } catch (e) { /* ignorar */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}
let S = load();
const save = () => localStorage.setItem(KEY, JSON.stringify(S));

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const now = new Date();
const ui = {
  tab: 'joint',
  year: now.getFullYear(),
  month: now.getMonth() + 1, // 0 = todo el año
  form: { type: 'expense', cat: '', date: today(), amount: '', note: '' }
};

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const accName = k => k === 'summary' ? 'Resumen' : S.names[k];
const findCat = (type, name) => S.categories[type].find(c => c.name === name) || { emoji: '❓', name, color: '#90a4ae' };

function yearTx(acc, year) {
  return S.tx.filter(t => t.acc === acc && t.date.startsWith(String(year)));
}
function monthly(acc, year) {
  const m = Array.from({ length: 12 }, () => ({ inc: 0, exp: 0 }));
  yearTx(acc, year).forEach(t => {
    const i = parseInt(t.date.slice(5, 7), 10) - 1;
    m[i][t.type === 'income' ? 'inc' : 'exp'] += t.amount;
  });
  return m;
}
function periodTx(acc) {
  const mm = String(ui.month).padStart(2, '0');
  return yearTx(acc, ui.year).filter(t => ui.month === 0 || t.date.slice(5, 7) === mm);
}
function availableYears() {
  const ys = new Set([now.getFullYear(), now.getFullYear() - 1, ui.year]);
  S.tx.forEach(t => ys.add(parseInt(t.date.slice(0, 4), 10)));
  return [...ys].sort((a, b) => b - a);
}

/* ---------- vistas ---------- */
function render() {
  const tabs = ['joint', 'a', 'b', 'summary'];
  $('#tabs').innerHTML = tabs.map(k =>
    `<button class="tab ${ui.tab === k ? 'active' : ''}" data-action="tab" data-v="${k}">${k === 'summary' ? '📊 ' : ''}${esc(accName(k))}</button>`).join('');
  $('#main').innerHTML = ui.tab === 'summary' ? viewSummary() : viewAccount(ui.tab);
}

function filters(withMonth) {
  const years = availableYears().map(y => `<option value="${y}" ${y === ui.year ? 'selected' : ''}>${y}</option>`).join('');
  const months = [`<option value="0" ${ui.month === 0 ? 'selected' : ''}>Todo el año</option>`]
    .concat(MONTHS.map((m, i) => `<option value="${i + 1}" ${ui.month === i + 1 ? 'selected' : ''}>${m}</option>`)).join('');
  return `<select data-field="year">${years}</select>` + (withMonth ? `<select data-field="month">${months}</select>` : '');
}

function viewAccount(acc) {
  const list = periodTx(acc);
  const inc = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const mdata = monthly(acc, ui.year);
  const yInc = mdata.reduce((s, m) => s + m.inc, 0);
  const yExp = mdata.reduce((s, m) => s + m.exp, 0);
  const label = ui.month === 0 ? String(ui.year) : `${MONTHS[ui.month - 1].toLowerCase()}`;

  // tabla anual con ahorro acumulado
  let acc$ = 0;
  const rows = mdata.map((m, i) => {
    const saved = m.inc - m.exp;
    acc$ += saved;
    const has = m.inc || m.exp;
    return `<tr class="click ${ui.month === i + 1 ? 'sel' : ''}" data-action="month" data-v="${i + 1}">
      <td>${MONTHS[i]}</td><td class="inc">${has ? money(m.inc) : '–'}</td><td class="exp">${has ? money(m.exp) : '–'}</td>
      <td>${has ? money(saved) : '–'}</td><td>${money(acc$)}</td></tr>`;
  }).join('');

  const maxAbs = Math.max(1, ...mdata.map(m => Math.abs(m.inc - m.exp)));
  const bars = mdata.map((m, i) => {
    const s = m.inc - m.exp;
    return `<div class="bar" title="${MONTHS[i]}: ${money(s)}"><i class="${s < 0 ? 'neg' : ''}" style="height:${Math.round(Math.abs(s) / maxAbs * 100)}%"></i>${MONTHS[i].slice(0, 1)}</div>`;
  }).join('');

  return `
  <div class="row">
    <h2>${esc(accName(acc))}</h2>
    ${filters(true)}
    <button class="btn ghost small" data-action="rename" data-v="${acc}">✏️ Renombrar</button>
  </div>

  <div class="cards">
    <div class="card"><div class="lbl">Ingresos (${label})</div><div class="val inc">${money(inc)}</div></div>
    <div class="card"><div class="lbl">Gastos (${label})</div><div class="val exp">${money(exp)}</div></div>
    <div class="card"><div class="lbl">Ahorro (${label})</div><div class="val">${money(inc - exp)}</div></div>
    <div class="card"><div class="lbl">🐷 Ahorrado en ${ui.year}</div><div class="val">${money(yInc - yExp)}</div></div>
  </div>

  <div class="grid">
    <div>
      <div class="panel">
        <h3>Añadir movimiento</h3>${formHtml()}
      </div>
      <div class="panel">
        <h3>Gastos por categoría (${label})</h3>${donutHtml(list)}
      </div>
    </div>
    <div>
      <div class="panel">
        <h3>Ahorro mes a mes · ${ui.year}</h3>
        <div class="bars">${bars}</div>
        <table style="margin-top:12px">
          <thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Ahorro</th><th>Acumulado</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td>Total</td><td class="inc">${money(yInc)}</td><td class="exp">${money(yExp)}</td><td>${money(yInc - yExp)}</td><td></td></tr></tfoot>
        </table>
      </div>
      <div class="panel">
        <h3>Movimientos (${label})</h3>${listHtml(list)}
      </div>
    </div>
  </div>`;
}

function formHtml() {
  const f = ui.form;
  const cats = S.categories[f.type];
  if (!cats.some(c => c.name === f.cat)) f.cat = cats[0].name;
  const opts = cats.map(c => `<option value="${esc(c.name)}" ${c.name === f.cat ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')
    + `<option value="__new">➕ Nueva categoría…</option>`;
  return `<div class="seg">
      <button class="e ${f.type === 'expense' ? 'on' : ''}" data-action="type" data-v="expense">Gasto</button>
      <button class="i ${f.type === 'income' ? 'on' : ''}" data-action="type" data-v="income">Ingreso</button>
    </div>
    <div class="form">
      <input type="text" inputmode="decimal" placeholder="Importe (€)" data-form="amount" value="${esc(f.amount)}">
      <select data-form="cat">${opts}</select>
      <input type="date" data-form="date" value="${esc(f.date)}">
      <input type="text" placeholder="Nota (opcional)" data-form="note" value="${esc(f.note)}">
      <button class="btn" data-action="add">Guardar</button>
    </div>`;
}

function donutHtml(list) {
  const exps = list.filter(t => t.type === 'expense');
  const total = exps.reduce((s, t) => s + t.amount, 0);
  if (!total) return `<div class="empty">Todavía no hay gastos en este periodo.</div>`;
  const by = {};
  exps.forEach(t => { by[t.cat] = (by[t.cat] || 0) + t.amount; });
  const items = Object.entries(by).sort((a, b) => b[1] - a[1]);
  let from = 0;
  const stops = items.map(([name, v]) => {
    const to = from + v / total * 100;
    const s = `${findCat('expense', name).color} ${from}% ${to}%`;
    from = to;
    return s;
  }).join(',');
  const legend = items.map(([name, v]) => {
    const c = findCat('expense', name);
    return `<li><span class="dot" style="background:${c.color}"></span>${c.emoji} ${esc(name)}<span class="amt">${money(v)}</span><span class="pct">${Math.round(v / total * 100)}%</span></li>`;
  }).join('');
  return `<div class="donutwrap"><div class="donut" style="background:conic-gradient(${stops})"><span>${money(total)}</span></div><ul class="legend">${legend}</ul></div>`;
}

function listHtml(list) {
  if (!list.length) return `<div class="empty">Sin movimientos en este periodo.</div>`;
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return `<ul class="tx">${sorted.map(t => {
    const c = findCat(t.type, t.cat);
    const [y, m, d] = t.date.split('-');
    return `<li>
      <span class="ico" style="background:${c.color}33">${c.emoji}</span>
      <span class="meta"><b>${esc(t.cat)}</b><small>${d}/${m}/${y}${t.note ? ' · ' + esc(t.note) : ''}</small></span>
      <b class="${t.type === 'income' ? 'inc' : 'exp'}">${t.type === 'income' ? '+' : '−'}${money(t.amount)}</b>
      <button class="x" title="Eliminar" data-action="del" data-v="${t.id}">✕</button></li>`;
  }).join('')}</ul>`;
}

function viewSummary() {
  const keys = ['joint', 'a', 'b'];
  const data = keys.map(k => monthly(k, ui.year));
  const rows = MONTHS.map((mn, i) => {
    const vals = data.map(d => d[i].inc - d[i].exp);
    const any = data.some(d => d[i].inc || d[i].exp);
    return `<tr><td>${mn}</td>${vals.map(v => `<td>${any ? money(v) : '–'}</td>`).join('')}<td><b>${any ? money(vals.reduce((a, b) => a + b, 0)) : '–'}</b></td></tr>`;
  }).join('');
  const totals = data.map(d => d.reduce((s, m) => s + m.inc - m.exp, 0));
  const cards = keys.map((k, i) => `<div class="card"><div class="lbl">🐷 ${esc(S.names[k])}</div><div class="val">${money(totals[i])}</div></div>`).join('')
    + `<div class="card"><div class="lbl">Total ahorrado ${ui.year}</div><div class="val">${money(totals.reduce((a, b) => a + b, 0))}</div></div>`;
  return `
  <div class="row"><h2>Resumen de ahorro</h2>${filters(false)}</div>
  <div class="cards">${cards}</div>
  <div class="panel">
    <h3>Ahorro por mes · ${ui.year}</h3>
    <table>
      <thead><tr><th>Mes</th>${keys.map(k => `<th>${esc(S.names[k])}</th>`).join('')}<th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>Año</td>${totals.map(t => `<td>${money(t)}</td>`).join('')}<td>${money(totals.reduce((a, b) => a + b, 0))}</td></tr></tfoot>
    </table>
  </div>`;
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const v = el.dataset.v;
  switch (el.dataset.action) {
    case 'tab': ui.tab = v; render(); break;
    case 'month': ui.month = ui.month === +v ? 0 : +v; render(); break;
    case 'type': ui.form.type = v; render(); break;
    case 'rename': {
      const n = prompt('Nuevo nombre:', S.names[v]);
      if (n && n.trim()) { S.names[v] = n.trim(); save(); render(); }
      break;
    }
    case 'add': addTx(); break;
    case 'del':
      if (confirm('¿Eliminar este movimiento?')) { S.tx = S.tx.filter(t => t.id !== v); save(); render(); }
      break;
    case 'export': exportData(); break;
    case 'wipe':
      if (confirm('Se borrarán TODOS los movimientos de este navegador. ¿Seguro?')) {
        S = JSON.parse(JSON.stringify(DEFAULTS)); save(); render();
      }
      break;
  }
});

document.addEventListener('input', e => {
  const k = e.target.dataset.form;
  if (k && k !== 'cat') ui.form[k] = e.target.value;
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.field === 'year') { ui.year = +t.value; render(); }
  else if (t.dataset.field === 'month') { ui.month = +t.value; render(); }
  else if (t.dataset.form === 'cat') {
    if (t.value === '__new') {
      const name = prompt('Nombre de la nueva categoría:');
      if (name && name.trim()) {
        const emoji = (prompt('Emoji (opcional):', '🔖') || '🔖').trim() || '🔖';
        const list = S.categories[ui.form.type];
        const color = PALETTE[list.length % PALETTE.length];
        list.splice(list.length - 1, 0, { emoji, name: name.trim(), color });
        ui.form.cat = name.trim();
        save();
      }
    } else {
      ui.form.cat = t.value;
    }
    render();
  }
  else if (t.id === 'importFile') importData(t.files[0]);
});

function addTx() {
  const f = ui.form;
  const amount = parseFloat(String(f.amount).replace(/\s/g, '').replace(',', '.'));
  if (!(amount > 0)) { alert('Introduce un importe mayor que 0.'); return; }
  if (!f.date) { alert('Elige una fecha.'); return; }
  S.tx.push({ id: uid(), acc: ui.tab, type: f.type, amount: Math.round(amount * 100) / 100, cat: f.cat, date: f.date, note: f.note.trim() });
  save();
  ui.year = parseInt(f.date.slice(0, 4), 10);
  if (ui.month !== 0) ui.month = parseInt(f.date.slice(5, 7), 10);
  ui.form.amount = ''; ui.form.note = '';
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nuestras-cuentas-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.tx) || !d.names || !d.categories) throw new Error('formato');
      if (!confirm('Esto reemplazará los datos actuales de este navegador. ¿Continuar?')) return;
      S = d; save(); render();
    } catch (err) {
      alert('El archivo no es una copia válida.');
    }
    $('#importFile').value = '';
  };
  r.readAsText(file);
}

render();

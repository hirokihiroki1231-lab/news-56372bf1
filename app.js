'use strict';

const content = document.getElementById('content');
const dateTabs = document.getElementById('dateTabs');
const updatedAtEl = document.getElementById('updatedAt');
const refreshBtn = document.getElementById('refreshBtn');

let DATA = null;
let activeId = null;

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function fmtDate(iso) {
  // iso: "2026-06-12"
  const [y, m, d] = iso.split('-').map(Number);
  const wd = ['日','月','火','水','木','金','土'][new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${wd})`;
}

function fmtUpdated(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (isNaN(dt)) return iso;
  const p = (n) => String(n).padStart(2, '0');
  return `最終更新 ${dt.getFullYear()}/${p(dt.getMonth() + 1)}/${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

function isUnverified(text) {
  return /未確認|不確実|確度が低い/.test(text);
}

async function load() {
  try {
    const res = await fetch('data.json?_=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    DATA = await res.json();
    activeId = DATA.entries?.[0]?.id ?? null;
    render();
  } catch (err) {
    content.innerHTML = `<div class="error">データを読み込めませんでした。<br><small>${esc(err.message)}</small></div>`;
  }
}

function render() {
  if (!DATA || !DATA.entries?.length) {
    content.innerHTML = '<div class="error">まだ要約がありません。</div>';
    return;
  }
  updatedAtEl.textContent = fmtUpdated(DATA.meta?.updatedAt);

  // tabs
  dateTabs.innerHTML = DATA.entries.map((e) => {
    const label = `${fmtDate(e.date)}${e.runLabel ? ' ' + esc(e.runLabel) : ''}`;
    return `<button class="date-tab ${e.id === activeId ? 'active' : ''}" data-id="${esc(e.id)}">${label}</button>`;
  }).join('');

  const entry = DATA.entries.find((e) => e.id === activeId) || DATA.entries[0];
  renderEntry(entry);
}

function renderEntry(entry) {
  const themesHtml = entry.themes.map((t, i) => {
    const points = t.points.map((p) =>
      `<li class="${isUnverified(p) ? 'unverified' : ''}">${esc(p)}</li>`
    ).join('');
    return `
      <section class="theme tc${i % 6}" data-theme="${i}">
        <div class="theme-head">
          <span class="theme-num">${CIRCLED[i] || (i + 1)}</span>
          <span class="theme-title">${esc(t.title)}</span>
          <span class="theme-caret">▾</span>
        </div>
        <div class="theme-body"><ul class="points">${points}</ul></div>
      </section>`;
  }).join('');

  const nikkei = entry.nikkei;
  const nikkeiHtml = (nikkei && (nikkei.points?.length || nikkei.market?.length)) ? `
    <section class="nikkei">
      <div class="nikkei-head"><span class="nikkei-badge">日経</span><h3>日経新聞まとめ</h3></div>
      ${nikkei.market?.length ? `<div class="market-grid">${nikkei.market.map((m) => `
        <div class="market-cell">
          <div class="market-label">${esc(m.label)}</div>
          <div class="market-value">${esc(m.value)}</div>
          ${m.note ? `<div class="market-note ${isUnverified(m.note) ? 'unverified-text' : ''}">${esc(m.note)}</div>` : ''}
        </div>`).join('')}</div>` : ''}
      ${nikkei.points?.length ? `<ul class="points nikkei-points">${nikkei.points.map((p) => `<li class="${isUnverified(p) ? 'unverified' : ''}">${esc(p)}</li>`).join('')}</ul>` : ''}
    </section>` : '';

  const impactHtml = entry.impact?.length ? `
    <div class="impact">
      <h3>📊 市場・生活への影響まとめ</h3>
      <ol>${entry.impact.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
    </div>` : '';

  const sourcesHtml = entry.sources?.length ? `
    <details class="sources">
      <summary>情報源（${entry.sources.length}件）</summary>
      ${entry.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title || s.url)}</a>`).join('')}
    </details>` : '';

  const notesHtml = entry.notes ? `<div class="notes">${esc(entry.notes)}</div>` : '';

  content.innerHTML = `
    <p class="entry-meta">${fmtDate(entry.date)}${entry.runLabel ? ' ・ ' + esc(entry.runLabel) : ''} 版</p>
    ${themesHtml}
    ${nikkeiHtml}
    ${impactHtml}
    ${sourcesHtml}
    ${notesHtml}`;
}

// Event delegation
dateTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.date-tab');
  if (!btn) return;
  activeId = btn.dataset.id;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

content.addEventListener('click', (e) => {
  const head = e.target.closest('.theme-head');
  if (!head) return;
  head.parentElement.classList.toggle('collapsed');
});

refreshBtn.addEventListener('click', load);

load();

// Service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

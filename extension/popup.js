// Megascans Claimer — popup.
const CATALOG_URL = 'https://www.fab.com/sellers/Quixel%20Megascans?is_free=1&lang=en';
const STALE_MS = 15000;
const { t, tm, num } = I18N;
const $ = id => document.getElementById(id);

let run = null;
let tab = null;
let tabState = 'other';   // 'other' | 'fab' | 'catalog' | 'catalog-unready'

function isCatalogUrl(href) {
  try {
    const url = new URL(href);
    return url.origin === 'https://www.fab.com' &&
      decodeURIComponent(url.pathname).replace(/\/$/, '') === '/sellers/Quixel Megascans' &&
      url.searchParams.get('is_free') === '1';
  } catch { return false; }
}

const fmtTime = ms => I18N.duration(ms);

function effectiveStatus() {
  if (!run) return 'idle';
  if (run.status === 'running' && Date.now() - (run.heartbeat || 0) > STALE_MS) return 'paused';
  return run.status;
}
const isRunning = () => effectiveStatus() === 'running';

// ------------------------------------------------------------ static text --

function paintIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    el.innerHTML = ICONS.svg(el.dataset.icon, el.classList.contains('chev') ? 14 : 15);
  }
}

function applyLanguage() {
  const info = I18N.info();
  document.documentElement.lang = info.code;
  document.documentElement.dir = info.dir;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml); // trusted, bundled strings
  $('langFlag').innerHTML = FLAGS[info.code];
  $('langBtn').title = t('language');
  buildLangMenu();
  render();
}

function buildLangMenu() {
  const menu = $('langMenu');
  menu.replaceChildren();
  for (const lang of I18N.LANGS) {
    const item = document.createElement('button');
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(lang.code === I18N.lang));
    item.innerHTML = `<span class="flag-box">${FLAGS[lang.code]}</span><span></span>${lang.code === I18N.lang ? `<span class="check">${ICONS.svg('check', 14)}</span>` : ''}`;
    item.children[1].textContent = lang.name;
    item.children[1].lang = lang.code;
    item.children[1].dir = lang.dir;
    item.addEventListener('click', async () => {
      toggleMenu(false);
      await I18N.set(lang.code);
      applyLanguage();
    });
    menu.append(item);
  }
}

function toggleMenu(open) {
  const menu = $('langMenu');
  const show = open ?? menu.hidden;
  menu.hidden = !show;
  $('langBtn').setAttribute('aria-expanded', String(show));
}

// ---------------------------------------------------------------- actions --

function button(label, icon, onClick, cls = '') {
  const b = document.createElement('button');
  b.className = `btn ${cls}`.trim();
  b.innerHTML = ICONS.svg(icon, 16);
  b.append(document.createTextNode(label));
  b.addEventListener('click', onClick);
  return b;
}
function hint(text) {
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = text;
  return p;
}

async function send(tabId, cmd, extra = {}) {
  try { return await chrome.tabs.sendMessage(tabId, { cmd, ...extra }); } catch { return null; }
}

async function openCatalogAndStart(fresh = false) {
  await chrome.storage.local.set({ autostart: { at: Date.now(), fresh } });
  const usable = tab?.url && /^https?:/.test(tab.url);
  if (usable) await chrome.tabs.update(tab.id, { url: CATALOG_URL });
  else await chrome.tabs.create({ url: CATALOG_URL });
  window.close();
}

async function startHere(fresh = false) {
  const reply = await send(tab.id, 'start', { fresh });
  if (!reply) {
    // Content script not ready (page opened before the extension was installed): reload and auto-start.
    await chrome.storage.local.set({ autostart: { at: Date.now(), fresh } });
    await chrome.tabs.reload(tab.id);
    window.close();
    return;
  }
  if (!reply.ok && reply.error === 'wrong-page') return openCatalogAndStart(fresh);
  window.close();
}

function renderActions() {
  const box = $('actions');
  box.replaceChildren();
  const status = effectiveStatus();
  const runTab = run?.tabId;

  if (isRunning()) {
    if (tab && runTab === tab.id) {
      box.append(button(t('btn_pause'), 'pause', () => send(runTab, 'pause'), 'primary'));
      box.append(button(t('btn_show_progress'), 'eye', async () => { await send(runTab, 'show'); window.close(); }));
    } else {
      box.append(button(t('btn_go_tab'), 'external', async () => {
        const target = await chrome.tabs.update(runTab, { active: true }).catch(() => null);
        if (target) await chrome.windows.update(target.windowId, { focused: true }).catch(() => {});
        window.close();
      }, 'primary'));
      box.append(button(t('btn_pause'), 'pause', () => send(runTab, 'pause')));
    }
    return;
  }

  const hasProgress = run && (run.confirmed + run.alreadyOwned + run.failed.length) > 0;
  let label = t('btn_start'), icon = 'play';
  if (status === 'finished') {
    [label, icon] = run.failed.length ? [t('btn_retry', { n: num(run.failed.length) }), 'rotateCcw'] : [t('btn_check_again'), 'refresh'];
  } else if (hasProgress) {
    label = t('btn_resume');
  }

  if (tabState === 'catalog' || tabState === 'catalog-unready') {
    box.append(button(label, icon, () => startHere(false), 'primary'));
  } else {
    box.append(button(hasProgress ? t('btn_open_resume') : t('btn_open_start'), 'arrowRight', () => openCatalogAndStart(false), 'primary'));
    box.append(hint(tabState === 'fab' ? t('hint_open_fab') : t('hint_open_other')));
  }
}

// ----------------------------------------------------------------- render --

function render() {
  const status = effectiveStatus();
  const r = run || { confirmed: 0, alreadyOwned: 0, failed: [], elapsedMs: 0, sessionStart: 0, sessionDone: 0, total: null };

  $('pill').className = `pill ${status}`;
  $('pill').innerHTML = '<span class="dot"></span>';
  $('pill').append(document.createTextNode(t(`status_${status}`)));

  $('confirmed').textContent = num(r.confirmed);
  $('owned').textContent = num(r.alreadyOwned);
  $('failed').textContent = num(r.failed.length);

  const live = status === 'running' && r.sessionStart;
  $('time').textContent = fmtTime(r.elapsedMs + (live ? Date.now() - r.sessionStart : 0));

  const done = r.confirmed + r.alreadyOwned + r.failed.length;
  const bar = $('bar').parentElement;
  bar.classList.toggle('indeterminate', !!live && !r.total);
  $('bar').style.width = r.total ? `${Math.min(100, done / r.total * 100).toFixed(1)}%` : (status === 'finished' ? '100%' : '');

  let eta = '—';
  if (live && r.total && r.sessionDone >= 5) {
    const perItem = (Date.now() - r.sessionStart) / r.sessionDone;
    eta = fmtTime(Math.max(0, r.total - done) * perItem);
  }
  $('eta').textContent = eta;

  let message;
  if (!run) message = t('intro');
  else if (run.status === 'running' && status !== 'running') message = t('m_interrupted');
  else message = tm(run.msg) || t('m_intro');
  $('msgText').textContent = message;

  const warn = $('warn');
  let warning = '';
  if (status === 'running' && r.hidden) warning = t('warn_hidden');
  else if (tabState === 'catalog-unready' && status !== 'running') warning = t('warn_unready');
  warn.hidden = !warning;
  $('warnText').textContent = warning;

  $('copy').disabled = !r.failed.length;
  $('reset').disabled = status === 'running' || !run;
  renderActions();
}

// ------------------------------------------------------------------- init --

async function init() {
  await I18N.load();
  paintIcons();
  $('langChevron').innerHTML = ICONS.svg('chevronDown', 14);

  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  if (isCatalogUrl(url)) tabState = (await send(tab.id, 'ping')) ? 'catalog' : 'catalog-unready';
  else if (url.startsWith('https://www.fab.com/')) tabState = 'fab';

  ({ run } = await chrome.storage.local.get('run'));
  applyLanguage();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.run) { run = changes.run.newValue; render(); }
  });
  setInterval(render, 1000);

  $('langBtn').addEventListener('click', event => { event.stopPropagation(); toggleMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.lang')) toggleMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') toggleMenu(false); });

  $('reset').addEventListener('click', async () => {
    if (!confirm(t('reset_confirm'))) return;
    await chrome.storage.local.remove(['run', 'seen', 'autostart']);
    run = null;
    render();
  });

  $('copy').addEventListener('click', async () => {
    const lines = (run?.failed || []).map(item => `${item.title}\t${item.url}\t${item.reason}`);
    await navigator.clipboard.writeText(lines.join('\n'));
    $('copyText').textContent = t('copied');
    setTimeout(() => { $('copyText').textContent = t('copy_failed'); }, 1500);
  });
}

init();

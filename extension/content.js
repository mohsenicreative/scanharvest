/*
 * Megascans Claimer — claim engine and on-page panel (runs on www.fab.com).
 *
 * How it behaves:
 *  - Works only on the Free "Quixel Megascans" seller page, inside the
 *    student's own signed-in session. It never reads or sends passwords/tokens.
 *  - Opens the catalog in a visible workspace frame and, one listing at a
 *    time, presses Fab's own "Add to My Library" button, then waits until Fab
 *    shows the item as saved before moving on.
 *  - Skips anything already in the library, keeps a gap between claims, and
 *    backs off (then stops) when Fab says it is receiving too many requests.
 *
 * Status messages are stored as { k: translationKey, p: params } and
 * translated where they are shown (see i18n.js).
 */
(() => {
  if (window.top !== window || globalThis.__mscContentLoaded) return;
  globalThis.__mscContentLoaded = true;

  const M = globalThis.MSC;
  const { t, tm, num } = globalThis.I18N;
  const BASE_GAP_MS = 1200;       // minimum time between two claims
  const MAX_GAP_MS = 5000;
  const RELOAD_EVERY = 96;        // refresh the catalog after this many items
  const MAX_RATE_HITS = 3;        // stop after this many "slow down" signals in a row
  const MAX_FAIL_STREAK = 4;      // stop after this many unconfirmed claims in a row

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function isCatalogUrl(href) {
    try {
      const url = new URL(href);
      return url.origin === M.origin &&
        decodeURIComponent(url.pathname).replace(/\/$/, '') === M.sellerPath &&
        url.searchParams.get('is_free') === '1';
    } catch { return false; }
  }

  class UserFacingError extends Error {
    constructor(key, status = 'error') { super(key); this.key = key; this.status = status; }
  }

  // ---------------------------------------------------------------- state --

  const freshRun = () => ({
    status: 'idle', confirmed: 0, alreadyOwned: 0, failed: [], total: null,
    elapsedMs: 0, sessionStart: 0, sessionDone: 0, msg: null, lastTitle: '',
    heartbeat: 0, tabId: null, hidden: false
  });

  let run = freshRun();
  let seen = new Set();
  let job = null;          // { stopped, gap, rateHits, failStreak, goodStreak, retry }
  let myTabId = null;

  let saveTimer = null;
  function save(immediate = false) {
    const write = () => {
      saveTimer = null;
      run.heartbeat = Date.now();
      run.hidden = document.hidden;
      return chrome.storage.local.set({ run }).catch(() => {});
    };
    ui.update();
    if (immediate) { clearTimeout(saveTimer); return write(); }
    if (!saveTimer) saveTimer = setTimeout(write, 600);
  }
  const saveSeen = () => chrome.storage.local.set({ seen: [...seen] }).catch(() => {});

  function say(k, p = {}) { run.msg = { k, p }; save(); }

  const alive = () => !!job && !job.stopped;

  async function waitFor(check, timeoutMs, stepMs = 100) {
    const deadline = Date.now() + timeoutMs;
    while (alive() && Date.now() < deadline) {
      const value = check();
      if (value) return value;
      await sleep(stepMs);
    }
    return null;
  }

  async function countdown(ms, key) {
    const end = Date.now() + ms;
    while (alive() && Date.now() < end) {
      say(key, { s: Math.ceil((end - Date.now()) / 1000) });
      await sleep(1000);
    }
  }

  // ------------------------------------------------------- page helpers --

  const textOf = el => (el?.textContent || '').trim();
  const listingLink = card => card.querySelector(M.listingLink);
  const isOwned = card => M.text.owned.test(card.textContent);
  const enabled = button => button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' ? button : null;

  function cardsIn(doc) {
    const styled = [...doc.querySelectorAll(M.card)];
    if (styled.length) return styled;
    // Fallback: walk up from each product link to the largest ancestor that
    // still contains only that one product.
    const result = new Set();
    for (const link of doc.querySelectorAll(M.productLink)) {
      const href = link.getAttribute('href');
      let node = link;
      while (node.parentElement && node.parentElement !== doc.body) {
        const parent = node.parentElement;
        const others = [...parent.querySelectorAll(M.productLink)].some(a => a.getAttribute('href') !== href);
        if (others) break;
        node = parent;
      }
      result.add(node);
    }
    return [...result];
  }
  const productCards = doc => cardsIn(doc).filter(card => card.querySelector(M.productLink));

  // Only consulted after a claim fails, so a stray "Sign up" link can never block a working run.
  function signedOut(doc) {
    return [...doc.querySelectorAll('a, button')].some(el => M.text.signIn.test(textOf(el)));
  }
  function signInNeeded() { throw new UserFacingError('e_sign_in'); }

  function readTotal(doc) {
    for (const el of doc.querySelectorAll('h1, h2, h3, p, span, div')) {
      if (el.children.length > 2) continue;
      const text = textOf(el);
      if (/available/i.test(text)) continue;        // "24 results available" = loaded so far, not the total
      const match = M.text.resultCount.exec(text);
      if (match && text.length < 40) {
        const n = parseInt(match[1].replace(/[^\d]/g, ''), 10);
        if (n >= 50) return n;
      }
    }
    return null;
  }

  function hover(doc, el) {
    const W = doc.defaultView;
    const opts = { bubbles: true, cancelable: true, view: W };
    for (const type of ['pointerover', 'pointerenter']) el.dispatchEvent(new W.PointerEvent(type, { ...opts, pointerType: 'mouse' }));
    for (const type of ['mouseover', 'mouseenter', 'mousemove']) el.dispatchEvent(new W.MouseEvent(type, opts));
  }

  const rateLimited = doc => [...doc.querySelectorAll(M.alerts)].some(a => M.text.rateLimited.test(a.textContent));

  // ----------------------------------------------------- workspace frame --

  async function load(url) {
    const target = new URL(url);
    if (target.origin !== M.origin) throw new UserFacingError('e_address');
    const listingId = /^\/listings\/([^/]+)/.exec(target.pathname)?.[1];

    for (let attempt = 1; attempt <= 3 && alive(); attempt++) {
      const frame = ui.frame();
      const previous = frame.contentDocument;
      frame.src = target.href;
      const doc = await waitFor(() => {
        const next = frame.contentDocument;
        if (!next || next === previous || next.readyState === 'loading') return null;
        let actual;
        try { actual = new URL(next.URL); } catch { return null; }
        if (actual.origin !== M.origin) return null;
        if (listingId) return /^\/listings\/([^/]+)/.exec(actual.pathname)?.[1] === listingId ? next : null;
        return isCatalogUrl(actual.href) ? next : null;
      }, 25000);
      if (doc) return doc;
      if (attempt < 3) await countdown(attempt * 3000, 'm_retry_in');
    }
    return null;
  }

  async function openCatalog() {
    say('m_opening');
    const doc = await load(M.catalogUrl);
    if (!alive()) return null;
    if (!doc) throw new UserFacingError('e_catalog', 'paused');
    const filtered = await waitFor(() => doc.querySelector(M.freeFilterChip), 8000);
    if (!alive()) return null;
    if (!filtered) throw new UserFacingError('e_filter', 'paused');
    const ready = await waitFor(() => productCards(doc).length || M.text.noResults.test(doc.body.innerText), 10000);
    if (!alive()) return null;
    if (!ready) throw new UserFacingError('e_results', 'paused');
    const total = readTotal(doc);
    if (total) run.total = total;
    return doc;
  }

  async function loadMore(doc) {
    const before = productCards(doc).length;
    const cards = cardsIn(doc);
    // Fab loads the next page while its placeholder card is on screen, so keep
    // that card in view (scrolling past it to the footer does not trigger loading).
    const placeholder = cards.find(card => !card.querySelector(M.productLink));
    const reveal = () => placeholder?.isConnected
      ? placeholder.scrollIntoView({ block: 'center' })
      : doc.scrollingElement?.scrollTo(0, doc.scrollingElement.scrollHeight);
    reveal();
    if (await waitFor(() => productCards(doc).length > before, 10000)) return true;
    if (!alive()) return false;
    // Nudge: move away and back so the page notices the card again, then retry.
    doc.scrollingElement?.scrollBy(0, -800);
    await sleep(600);
    reveal();
    if (await waitFor(() => productCards(doc).length > before, 14000)) return true;
    if (alive() && placeholder?.isConnected) throw new UserFacingError('e_load_more', 'paused');
    return false;
  }

  async function clickAndConfirm(doc, button, isSaved) {
    const clickedAt = Date.now();
    button.click();
    const leftFab = () => {
      const current = ui.frame().contentDocument;   // null once the frame is on another site
      try { return !current || new URL(current.URL).origin !== M.origin; } catch { return true; }
    };
    const result = await waitFor(() => (isSaved() && 'added') || (rateLimited(doc) && 'rate-limited') ||
      (leftFab() && 'left fab'), 8000);
    if (result === 'left fab') signInNeeded();
    const wait = job.gap - (Date.now() - clickedAt);
    if (wait > 0) await sleep(wait);
    return result || 'not confirmed';
  }

  async function claimFromCard(doc, card, url) {
    if (isOwned(card)) return 'owned';
    card.scrollIntoView({ block: 'center' });
    hover(doc, card);
    const button = await waitFor(() => card.isConnected && enabled(card.querySelector(M.cardAddButton)), 2500);
    if (!button) return 'no button on card';
    return clickAndConfirm(doc, button, () => isOwned(card) ||
      productCards(doc).some(c => listingLink(c)?.href === url && isOwned(c)));
  }

  async function claimFromListing(url) {
    const doc = await load(url);
    if (!alive()) return 'stopped';
    if (!doc) return 'listing did not load';
    const inLibrary = () => [...doc.querySelectorAll('a[href^="/library"]')].some(a => textOf(a) === M.text.viewInLibrary);
    const addButton = () => [...doc.querySelectorAll('button')].find(b => textOf(b) === M.text.addButton);
    await waitFor(() => inLibrary() || addButton(), 8000);
    if (inLibrary()) return 'owned';
    const isFree = [...doc.querySelectorAll('h2')].some(h => textOf(h) === M.text.freePriceHeading);
    const sellerHref = new URL(M.sellerPath, M.origin).href;
    const byQuixel = [...doc.querySelectorAll('a[href]')].some(a => decodeURIComponent(a.href) === decodeURIComponent(sellerHref));
    const button = enabled(addButton());
    if (!isFree) return 'not listed as free';
    if (!byQuixel) return 'not a Quixel listing';
    if (!button) return signedOut(doc) ? signInNeeded() : 'no claim button';
    const result = await clickAndConfirm(doc, button, inLibrary);
    if (result === 'not confirmed' && signedOut(doc)) signInNeeded();
    return result;
  }

  // ------------------------------------------------------------- engine --

  function nextCard(doc) {
    for (const card of productCards(doc)) {
      const link = listingLink(card);
      if (!link || seen.has(link.href)) continue;
      if (isOwned(card)) {             // already in the library: count it and move on
        seen.add(link.href);
        run.alreadyOwned++;
        run.sessionDone++;
        continue;
      }
      if (M.text.free.test(card.innerText)) return card;
    }
    return null;
  }

  function record(url, title, result) {
    seen.add(url);
    run.sessionDone++;
    if (job.retry.has(url)) run.failed = run.failed.filter(item => item.url !== url);
    if (result === 'added' || result === 'owned') {
      if (result === 'added') { run.confirmed++; run.lastTitle = title; } else run.alreadyOwned++;
      job.failStreak = 0;
      if (++job.goodStreak >= 25) { job.goodStreak = 0; job.rateHits = 0; job.gap = Math.max(BASE_GAP_MS, Math.round(job.gap / 1.5)); }
    } else {
      run.failed.push({ title, url, reason: result });
      job.goodStreak = 0;
      job.gap = Math.min(MAX_GAP_MS, Math.round(job.gap * 1.5));
      if (++job.failStreak >= MAX_FAIL_STREAK) throw new UserFacingError('e_fail_streak', 'paused');
    }
    if (run.sessionDone % 10 === 0) saveSeen();
    save();
  }

  async function engine() {
    let doc = await openCatalog();
    let sinceReload = 0;
    let checkedEnd = false;

    while (alive() && doc) {
      const card = nextCard(doc);
      if (!card) {
        say('m_loading_more');
        if (await loadMore(doc)) continue;
        if (!alive()) break;
        if (checkedEnd) {
          run.status = 'finished';
          run.msg = run.failed.length ? { k: 'm_done_some', p: { n: run.failed.length } } : { k: 'm_done_all' };
          return;
        }
        checkedEnd = true;           // reload once to be sure nothing was missed
        doc = await openCatalog();
        sinceReload = 0;
        continue;
      }
      checkedEnd = false;

      const link = listingLink(card);
      const url = link.href;
      const title = link.getAttribute('aria-label') || textOf(link) || url;
      if (new URL(url).origin !== M.origin) throw new UserFacingError('e_address');
      say('m_adding', { title });

      let result = await claimFromCard(doc, card, url);
      let navigatedAway = false;
      if (alive() && !['added', 'owned', 'rate-limited'].includes(result)) {
        result = await claimFromListing(url);   // fall back to the listing page
        navigatedAway = true;
      }
      if (!alive()) break;

      if (result === 'rate-limited') {
        job.rateHits++;
        job.goodStreak = 0;
        job.gap = Math.min(MAX_GAP_MS, job.gap * 2);
        if (job.rateHits >= MAX_RATE_HITS) throw new UserFacingError('e_rate_limit', 'paused');
        await countdown(60000 * job.rateHits, 'm_slow_down');
        doc = await openCatalog();
        sinceReload = 0;
        continue;                    // not marked as seen: it will be retried
      }

      record(url, title, result);
      if (navigatedAway || ++sinceReload >= RELOAD_EVERY) {
        doc = await openCatalog();
        sinceReload = 0;
      }
    }
  }

  async function start({ fresh = false } = {}) {
    if (job) { ui.show(); return { ok: true, already: true }; }
    if (!isCatalogUrl(location.href)) return { ok: false, error: 'wrong-page' };

    if (myTabId == null) myTabId = await chrome.runtime.sendMessage({ cmd: 'whoami' }).catch(() => null);
    const stored = await chrome.storage.local.get(['run', 'seen']);
    const elsewhere = stored.run?.status === 'running' && stored.run.tabId !== myTabId &&
      Date.now() - (stored.run.heartbeat || 0) < 15000;
    if (elsewhere) return { ok: false, error: 'running-elsewhere' };   // never run two tabs at once
    if (fresh || !stored.run) {
      run = freshRun();
      seen = new Set();
    } else {
      run = { ...freshRun(), ...stored.run };
      seen = new Set(stored.seen || []);
    }
    const retry = new Set(run.failed.map(item => item.url));
    for (const url of retry) seen.delete(url);   // failed listings get another try

    Object.assign(run, {
      status: 'running', tabId: myTabId, sessionStart: Date.now(), sessionDone: 0, msg: { k: 'm_starting' }
    });
    job = { stopped: false, gap: BASE_GAP_MS, rateHits: 0, failStreak: 0, goodStreak: 0, retry };
    ui.show();
    await save(true);

    const heartbeat = setInterval(() => save(), 3000);
    engine()
      .catch(error => {
        console.warn('[Megascans Claimer]', error);
        run.status = error instanceof UserFacingError ? error.status : 'paused';
        run.msg = { k: error instanceof UserFacingError ? error.key : 'e_unknown' };
      })
      .finally(async () => {
        clearInterval(heartbeat);
        if (run.status === 'running') {
          run.status = 'paused';
          run.msg = { k: 'm_paused_user' };
        }
        run.elapsedMs += Date.now() - run.sessionStart;
        run.sessionStart = 0;
        job = null;
        await saveSeen();
        await save(true);
      });
    return { ok: true };
  }

  function pauseRun() {
    if (!job) return;
    job.stopped = true;
    say('m_pausing');
  }

  // ------------------------------------------------------------ overlay --

  const ui = (() => {
    let host, root, frameEl, wrap, els = {};
    const icon = (name, size = 16) => globalThis.ICONS.svg(name, size);

    const css = `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .wrap {
        --bg: #05060a; --surface: #0d1019; --surface-2: #131726; --line: rgba(148,163,255,.10);
        --line-strong: rgba(148,163,255,.18); --text: #eef0fa; --muted: #8b92ab; --accent: #3d6bff;
        --periwinkle: #8b9cff; --ok: #4ade80; --warn: #fbbf24; --danger: #f87171;
        font-family: "Inter", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
        position: fixed; inset: 0; z-index: 2147483646; display: flex; flex-direction: column; gap: 14px;
        padding: 18px 22px; color: var(--text); -webkit-font-smoothing: antialiased;
        background:
          radial-gradient(60% 45% at 50% -5%, rgba(61,107,255,.35), transparent 70%),
          rgba(5, 6, 10, .94);
        backdrop-filter: blur(8px); transition: opacity .2s;
      }
      .wrap[lang="fa"] { font-family: "Vazirmatn", "Segoe UI", Tahoma, system-ui, sans-serif; }
      .wrap[lang="zh"] { font-family: "Inter", "Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif; }
      .wrap.min { opacity: 0; pointer-events: none; }
      .icon { display: block; flex: none; }
      header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .logo { width: 34px; height: 34px; border-radius: 10px; flex: none; display: grid; place-items: center; color: #fff;
        background: linear-gradient(135deg, #5eead4, #3d6bff); box-shadow: 0 6px 20px rgba(61,107,255,.4); }
      h1 { font-size: 16px; font-weight: 700; margin: 0; letter-spacing: -.1px; }
      .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 4px 10px 4px 8px;
        border-radius: 999px; background: rgba(139,146,171,.14); color: #c9cee0; }
      .pill .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
      .pill.running { background: rgba(61,107,255,.16); color: #9db4ff; }
      .pill.running .dot { animation: pulse 1.6s infinite; }
      .pill.paused { background: rgba(251,191,36,.13); color: var(--warn); }
      .pill.finished { background: rgba(74,222,128,.13); color: var(--ok); }
      .pill.error { background: rgba(248,113,113,.14); color: var(--danger); }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(157,180,255,.6); } 70% { box-shadow: 0 0 0 7px rgba(157,180,255,0); } 100% { box-shadow: 0 0 0 0 rgba(157,180,255,0); } }
      .spacer { flex: 1; }
      button { font: inherit; font-size: 13px; font-weight: 600; border-radius: 10px; padding: 8px 14px; cursor: pointer;
        display: inline-flex; align-items: center; gap: 7px; background: var(--surface-2); color: var(--text);
        border: 1px solid var(--line-strong); transition: background .15s; }
      button:hover { background: #1a1f33; }
      button.primary { color: #fff; border-color: transparent; background: linear-gradient(135deg, #3d6bff, #6a7dff);
        box-shadow: 0 6px 20px rgba(61,107,255,.35), inset 0 1px 0 rgba(255,255,255,.2); }
      button.primary:hover { background: linear-gradient(135deg, #5b82ff, #7b8cff); }
      .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .stat { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px;
        background: linear-gradient(180deg, var(--surface-2), var(--surface)); border: 1px solid var(--line); }
      .stat .ico { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; flex: none;
        color: var(--periwinkle); background: rgba(61,107,255,.13); }
      .stat .ico.ok { color: var(--ok); background: rgba(74,222,128,.1); }
      .stat .ico.warn { color: var(--warn); background: rgba(251,191,36,.1); }
      .stat b { display: block; font-size: 22px; font-weight: 800; letter-spacing: -.5px; font-variant-numeric: tabular-nums; line-height: 1.15; }
      .stat span { font-size: 12px; color: var(--muted); }
      .bar { height: 5px; border-radius: 99px; background: rgba(148,163,255,.12); overflow: hidden; }
      .bar i { display: block; height: 100%; width: 0; border-radius: inherit; background: linear-gradient(90deg, #3d6bff, #8b9cff); transition: width .4s; }
      .bar.indeterminate i { width: 30%; animation: slide 1.6s ease-in-out infinite; }
      @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(340%); } }
      .wrap[dir="rtl"] .bar.indeterminate i { animation-name: slide-rtl; }
      @keyframes slide-rtl { 0% { transform: translateX(100%); } 100% { transform: translateX(-340%); } }
      .msg { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #c9cee0; min-height: 20px; }
      .msg .icon { color: var(--periwinkle); }
      .msg span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .frame { flex: 1; min-height: 200px; border-radius: 16px; overflow: hidden; border: 1px solid var(--line-strong);
        background: #111; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
      iframe { width: 100%; height: 100%; border: 0; display: block; }
      .note { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
      .chip { position: fixed; inset-inline-end: 18px; bottom: 18px; z-index: 2147483647; display: none; align-items: center; gap: 8px;
        padding: 10px 16px; border-radius: 999px; background: #0d1019; color: var(--text); border: 1px solid var(--line-strong);
        box-shadow: 0 10px 34px rgba(0,0,0,.5), 0 0 0 1px rgba(61,107,255,.15); cursor: pointer;
        font: 600 13px/1 "Inter", "Segoe UI", "Microsoft YaHei UI", Tahoma, system-ui, sans-serif; }
      .chip.show { display: flex; }
      .chip .dot { width: 8px; height: 8px; border-radius: 50%; background: #3d6bff; box-shadow: 0 0 10px #3d6bff; }
      @media (max-width: 760px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    `;

    function build() {
      host = document.createElement('div');
      host.id = 'megascans-claimer-root';
      root = host.attachShadow({ mode: 'closed' });
      root.innerHTML = `
        <style>${css}</style>
        <div class="wrap">
          <header>
            <div class="logo">${icon('download', 18)}</div>
            <h1 data-t="appName"></h1>
            <span class="pill" data-k="pill"></span>
            <div class="spacer"></div>
            <button data-k="toggle" class="primary"></button>
            <button data-k="min"></button>
            <button data-k="close"></button>
          </header>
          <div class="stats">
            <div class="stat"><div class="ico ok">${icon('circleCheck', 18)}</div><div><b data-k="confirmed">0</b><span data-t="ov_added"></span></div></div>
            <div class="stat"><div class="ico">${icon('library', 18)}</div><div><b data-k="owned">0</b><span data-t="ov_owned"></span></div></div>
            <div class="stat"><div class="ico warn">${icon('rotateCcw', 18)}</div><div><b data-k="failed">0</b><span data-t="ov_failed"></span></div></div>
            <div class="stat"><div class="ico">${icon('clock', 18)}</div><div><b data-k="time">0:00</b><span data-t="ov_time"></span></div></div>
          </div>
          <div class="bar" data-k="barBox"><i data-k="bar"></i></div>
          <div class="msg">${icon('info', 15)}<span data-k="msg"></span></div>
          <div class="frame"><iframe data-k="frame"></iframe></div>
          <div class="note">${icon('monitor', 14)}<span data-t="ov_note"></span></div>
        </div>
        <div class="chip" data-k="chip"><span class="dot"></span><span data-k="chipText"></span></div>
      `;
      for (const el of root.querySelectorAll('[data-k]')) els[el.dataset.k] = el;
      wrap = root.querySelector('.wrap');
      frameEl = els.frame;
      els.toggle.addEventListener('click', () => job ? pauseRun() : start());
      els.min.addEventListener('click', () => setMin(true));
      els.chip.addEventListener('click', () => setMin(false));
      els.close.addEventListener('click', () => {
        if (job && !confirm(t('ov_close_confirm'))) return;
        pauseRun();
        host.remove();
      });
      document.documentElement.append(host);
      translate();
    }

    function translate() {
      if (!root) return;
      const info = globalThis.I18N.info();
      wrap.lang = info.code;
      wrap.dir = info.dir;
      els.chip.dir = info.dir;
      for (const el of root.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
      els.min.innerHTML = `${icon('eyeOff', 15)}<span>${escapeHtml(t('ov_hide'))}</span>`;
      els.min.title = t('ov_hide_title');
      els.close.innerHTML = `${icon('x', 15)}<span>${escapeHtml(t('ov_close'))}</span>`;
      frameEl.title = t('ov_workspace');
      update();
    }

    function setMin(value) {
      wrap.classList.toggle('min', value);
      els.chip.classList.toggle('show', value);
    }

    const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmtTime = ms => globalThis.I18N.duration(ms);

    function update() {
      if (!host?.isConnected) return;
      const status = run.status;
      els.pill.className = `pill ${status}`;
      els.pill.innerHTML = `<span class="dot"></span>${escapeHtml(t(`status_${status}`))}`;
      els.confirmed.textContent = num(run.confirmed);
      els.owned.textContent = num(run.alreadyOwned);
      els.failed.textContent = num(run.failed.length);
      const elapsed = run.elapsedMs + (run.sessionStart ? Date.now() - run.sessionStart : 0);
      els.time.textContent = fmtTime(elapsed);
      const done = run.confirmed + run.alreadyOwned + run.failed.length;
      els.barBox.classList.toggle('indeterminate', !!job && !run.total);
      els.bar.style.width = run.total ? `${Math.min(100, (done / run.total) * 100).toFixed(1)}%` : (status === 'finished' ? '100%' : '');
      els.msg.textContent = tm(run.msg);

      let label, name;
      if (job) [label, name] = [t('btn_pause'), 'pause'];
      else if (status === 'finished') [label, name] = run.failed.length ? [t('ov_retry'), 'rotateCcw'] : [t('ov_run_again'), 'refresh'];
      else [label, name] = [t('btn_resume'), 'play'];
      els.toggle.innerHTML = `${icon(name, 15)}<span>${escapeHtml(label)}</span>`;
      els.chipText.textContent = t('ov_chip', { status: t(`status_${status}`), n: num(run.confirmed) });
    }

    return {
      show() { if (!host?.isConnected) build(); setMin(false); update(); },
      frame() { if (!host?.isConnected) build(); return frameEl; },
      translate,
      update
    };
  })();

  // ---------------------------------------------------------- messaging --

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    switch (msg?.cmd) {
      case 'ping':
        reply({ ok: true, onCatalog: isCatalogUrl(location.href), running: !!job });
        return;
      case 'start':
        start({ fresh: !!msg.fresh }).then(reply);
        return true;
      case 'pause':
        pauseRun();
        reply({ ok: true });
        return;
      case 'show':
        (async () => {
          if (!job) {                // not running here: show the last saved progress
            const { run: stored } = await chrome.storage.local.get('run');
            if (stored) run = { ...freshRun(), ...stored };
          }
          ui.show();
          reply({ ok: true });
        })();
        return true;
    }
  });

  document.addEventListener('visibilitychange', () => { if (job) save(); });
  globalThis.I18N.load().then(() => ui.translate());
  globalThis.I18N.onChange(() => ui.translate());

  // Started from the popup on another page: pick up the request after navigation.
  (async () => {
    if (!isCatalogUrl(location.href)) return;
    const { autostart } = await chrome.storage.local.get('autostart');
    if (!autostart || Date.now() - autostart.at > 120000) return;
    await chrome.storage.local.remove('autostart');
    await sleep(1500);
    start({ fresh: !!autostart.fresh });
  })();
})();

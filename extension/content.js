/*
 * Megascans Claimer — content script for www.fab.com.
 *
 * Architecture
 *   Workspace  an iframe inside our panel; navigates with load events.
 *   fab        read-only helpers that understand Fab's markup (see selectors.js).
 *   Pacer      adaptive spacing between clicks; slows down on trouble, eases back when calm.
 *   Session    harvests unclaimed free listings into a queue and works through it.
 *   panel      the on-page UI (shadow DOM).
 *
 * Waiting is event-driven (MutationObserver), so it keeps working when the tab is
 * in the background, and every wait can be cancelled through an AbortSignal.
 * Nothing here reads or sends credentials; it only presses Fab's own buttons.
 */
(() => {
  if (window.top !== window || globalThis.__megascansClaimer) return;
  globalThis.__megascansClaimer = true;

  const M = globalThis.MSC;
  const I18N = globalThis.I18N;

  const PACE = { minGapMs: 600, maxGapMs: 5000 };
  const LIMITS = { throttles: 3, misses: 4, cardsBeforeRefresh: 480 };
  const OFFSITE = Symbol('offsite');

  // ------------------------------------------------------------- helpers --

  class Problem extends Error {
    constructor(key, status = 'error') { super(key); this.key = key; this.status = status; }
  }

  function delay(ms, signal) {
    return new Promise(resolve => {
      if (signal?.aborted) return resolve();
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
  }

  /** Resolve with test()'s first truthy value, re-checking whenever the document changes. */
  function until(doc, test, timeoutMs, signal) {
    return new Promise(resolve => {
      let settled = false;
      const observer = new MutationObserver(() => probe());
      const finish = value => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(timer);
        clearInterval(safety);
        resolve(value || null);
      };
      const probe = () => {
        let value = null;
        try { value = test(); } catch { /* element vanished mid-check */ }
        if (value) finish(value);
      };
      if (signal?.aborted) return finish(null);
      observer.observe(doc.documentElement || doc, { subtree: true, childList: true, attributes: true, characterData: true });
      const safety = setInterval(probe, 500);           // in case a change is not a DOM mutation
      const timer = setTimeout(() => finish(null), timeoutMs);
      signal?.addEventListener('abort', () => finish(null), { once: true });
      probe();
    });
  }

  const textOf = el => (el?.textContent || '').trim();
  const usable = el => (el && !el.disabled && el.getAttribute('aria-disabled') !== 'true' ? el : null);
  const samePath = (a, b) => a.replace(/\/+$/, '') === b.replace(/\/+$/, '');

  function hoverOver(el) {
    const view = el.ownerDocument.defaultView;
    const init = { bubbles: true, cancelable: true, view };
    el.dispatchEvent(new view.PointerEvent('pointerover', { ...init, pointerType: 'mouse' }));
    el.dispatchEvent(new view.PointerEvent('pointerenter', { ...init, pointerType: 'mouse' }));
    el.dispatchEvent(new view.MouseEvent('mouseover', init));
    el.dispatchEvent(new view.MouseEvent('mouseenter', init));
    el.dispatchEvent(new view.MouseEvent('mousemove', init));
  }

  // ------------------------------------------------- Fab page knowledge --

  const fab = {
    isCatalog(href) {
      try {
        const u = new URL(href);
        return u.origin === M.origin && samePath(decodeURIComponent(u.pathname), M.sellerPath) && u.searchParams.get('is_free') === '1';
      } catch { return false; }
    },
    tiles(doc) {
      const styled = doc.querySelectorAll(M.card);
      if (styled.length) return [...styled];
      // Fallback when Fab renames its classes: the widest ancestor of a product
      // link that does not also contain a different product.
      const found = new Set();
      for (const link of doc.querySelectorAll(M.productLink)) {
        const href = link.getAttribute('href');
        let box = link;
        for (let up = box.parentElement; up && up !== doc.body; up = up.parentElement) {
          if ([...up.querySelectorAll(M.productLink)].some(a => a.getAttribute('href') !== href)) break;
          box = up;
        }
        found.add(box);
      }
      return [...found];
    },
    products: doc => fab.tiles(doc).filter(tile => tile.querySelector(M.productLink)),
    placeholder: doc => fab.tiles(doc).find(tile => !tile.querySelector(M.productLink)),
    link: tile => tile.querySelector(M.listingLink),
    owned: tile => M.text.owned.test(tile.textContent),
    free: tile => M.text.free.test(tile.innerText),
    tileFor: (doc, url) => fab.products(doc).find(tile => fab.link(tile)?.href === url),
    throttled: doc => [...doc.querySelectorAll(M.alerts)].some(alert => M.text.rateLimited.test(alert.textContent)),
    signedOut: doc => [...doc.querySelectorAll('a, button')].some(el => M.text.signIn.test(textOf(el))),
    total(doc) {
      for (const el of doc.querySelectorAll('h1, h2, h3, p, span, div')) {
        const text = textOf(el);
        if (el.children.length > 2 || text.length >= 40 || /available/i.test(text)) continue;
        const hit = M.text.resultCount.exec(text);
        const n = hit ? Number(hit[1].replace(/\D/g, '')) : 0;
        if (n >= 50) return n;
      }
      return null;
    }
  };

  // ---------------------------------------------------------- workspace --

  class Workspace {
    constructor(frame, signal) { this.frame = frame; this.signal = signal; }

    get document() {
      try { return this.frame.contentDocument; } catch { return null; }
    }

    /** True once the frame has been sent to another site (for example a sign-in page). */
    get offsite() {
      const doc = this.document;
      try { return !doc || new URL(doc.URL).origin !== M.origin; } catch { return true; }
    }

    navigate(url, accept) {
      return new Promise(resolve => {
        const { frame, signal } = this;
        const done = value => {
          frame.removeEventListener('load', onLoad);
          signal.removeEventListener('abort', onAbort);
          clearTimeout(timer);
          resolve(value);
        };
        const onLoad = () => {
          const doc = this.document;
          if (doc === null) return done(OFFSITE);        // cross-origin page, e.g. Epic sign-in
          if (doc.URL === 'about:blank') return;
          let here;
          try { here = new URL(doc.URL); } catch { return; }
          if (here.origin !== M.origin) return done(OFFSITE);
          if (accept(here)) done(doc);
        };
        const onAbort = () => done(null);
        const timer = setTimeout(() => done(null), 30000);
        frame.addEventListener('load', onLoad);
        signal.addEventListener('abort', onAbort, { once: true });
        frame.src = url;
      });
    }

    async open(url, accept, onRetry) {
      for (let tries = 1; tries < 4; tries++) {
        const doc = await this.navigate(url, accept);
        if (doc || this.signal.aborted) return doc;
        if (tries < 3) await onRetry(tries * 4000);
      }
      return null;
    }
  }

  // -------------------------------------------------------------- pacer --

  class Pacer {
    constructor() { this.gap = PACE.minGapMs; this.lastClick = 0; this.calm = 0; }
    async beforeClick(signal) {
      const wait = this.lastClick + this.gap - Date.now();
      if (wait > 0) await delay(wait, signal);
      this.lastClick = Date.now();
    }
    good() {
      if (++this.calm < 20) return false;
      this.calm = 0;
      this.gap = Math.max(PACE.minGapMs, Math.round(this.gap * 0.75));
      return true;
    }
    bad(factor = 1.6) {
      this.calm = 0;
      this.gap = Math.min(PACE.maxGapMs, Math.round(this.gap * factor));
    }
  }

  // ------------------------------------------------------------ session --

  class Session {
    constructor(progress, done, frame) {
      this.progress = progress;
      this.done = done;
      this.controller = new AbortController();
      this.signal = this.controller.signal;
      this.space = new Workspace(frame, this.signal);
      this.pacer = new Pacer();
      this.queue = [];
      this.queued = new Set();
      this.retrying = new Set(progress.retry.map(item => item.url));
      this.throttles = 0;
      this.misses = 0;
      this.stale = false;
    }

    get live() { return !this.signal.aborted; }
    stop() { this.controller.abort(); }

    async countdown(ms, key) {
      const end = Date.now() + ms;
      while (this.live && Date.now() < end) {
        report(key, { s: Math.ceil((end - Date.now()) / 1000) });
        await delay(Math.min(1000, end - Date.now()), this.signal);
      }
    }

    async catalog() {
      report('m_opening');
      this.queue = [];
      this.queued.clear();
      const doc = await this.space.open(M.catalogUrl, url => fab.isCatalog(url.href), ms => this.countdown(ms, 'm_retry_in'));
      if (!this.live) return null;
      if (doc === OFFSITE) throw new Problem('e_sign_in');
      if (!doc) throw new Problem('e_catalog', 'paused');
      if (!await until(doc, () => doc.querySelector(M.freeFilterChip), 10000, this.signal)) {
        if (!this.live) return null;
        throw new Problem('e_filter', 'paused');
      }
      const listed = await until(doc, () => fab.products(doc).length || M.text.noResults.test(doc.body?.innerText || ''), 12000, this.signal);
      if (!this.live) return null;
      if (!listed) throw new Problem('e_results', 'paused');
      this.progress.total = fab.total(doc) || this.progress.total;
      return doc;
    }

    /** Move every visible, unhandled free listing into the queue; count owned ones. */
    harvest(doc) {
      for (const tile of fab.products(doc)) {
        const url = fab.link(tile)?.href;
        if (!url || this.done.has(url) || this.queued.has(url)) continue;
        if (fab.owned(tile)) {
          this.done.add(url);
          this.progress.owned++;
          this.progress.sessionCount++;
        } else if (fab.free(tile)) {
          const link = fab.link(tile);
          this.queue.push({ url, title: link.getAttribute('aria-label') || textOf(link) || url });
          this.queued.add(url);
        }
      }
    }

    /** Ask Fab's infinite scroll for the next page. Resolves true when new listings arrived. */
    async loadMore(doc) {
      const count = fab.products(doc).length;
      const marker = fab.placeholder(doc);
      const scroller = doc.scrollingElement;
      // Fab loads more while its placeholder tile is on screen; scrolling past it does not.
      const show = () => (marker?.isConnected ? marker.scrollIntoView({ block: 'center' }) : scroller?.scrollTo(0, scroller.scrollHeight));
      const grew = () => fab.products(doc).length > count;
      // Fab only shows placeholder tiles while more pages exist; without one, give it a brief chance.
      for (const wait of marker ? [10000, 14000] : [2500]) {
        show();
        if (await until(doc, grew, wait, this.signal)) return true;
        if (!this.live) return false;
        scroller?.scrollBy(0, -800);
        await delay(600, this.signal);
      }
      if (marker?.isConnected) throw new Problem('e_load_more', 'paused');
      return false;
    }

    async press(doc, button, confirmed) {
      await this.pacer.beforeClick(this.signal);
      if (!this.live) return 'stopped';
      button.click();
      const outcome = await until(doc, () =>
        (confirmed() && 'added') || (fab.throttled(doc) && 'throttled') || (this.space.offsite && 'offsite'), 8000, this.signal);
      if (outcome === 'offsite') throw new Problem('e_sign_in');
      return outcome || 'not confirmed';
    }

    async fromTile(doc, tile, url) {
      if (fab.owned(tile)) return 'owned';
      tile.scrollIntoView({ block: 'center' });
      hoverOver(tile);
      const button = await until(doc, () => tile.isConnected && usable(tile.querySelector(M.cardAddButton)), 2500, this.signal);
      if (!button) return 'no button on card';
      return this.press(doc, button, () => fab.owned(tile) || fab.owned(fab.tileFor(doc, url) || tile));
    }

    async fromListing(url) {
      this.stale = true;   // the workspace leaves the catalog
      const target = new URL(url);
      const doc = await this.space.open(url, here => here.pathname.startsWith(target.pathname.replace(/\/+$/, '')),
        ms => this.countdown(ms, 'm_retry_in'));
      if (!this.live) return 'stopped';
      if (doc === OFFSITE) throw new Problem('e_sign_in');
      if (!doc) return 'listing did not load';

      const viewLink = () => [...doc.querySelectorAll('a[href^="/library"]')].find(a => textOf(a) === M.text.viewInLibrary);
      const claimButton = () => Array.from(doc.getElementsByTagName('button')).find(b => textOf(b) === M.text.addButton);
      await until(doc, () => viewLink() || claimButton(), 8000, this.signal);
      if (viewLink()) return 'owned';

      const priceIsFree = Array.from(doc.getElementsByTagName('h2')).some(h => textOf(h) === M.text.freePriceHeading);
      const seller = decodeURIComponent(new URL(M.sellerPath, M.origin).href);
      const byQuixel = Array.from(doc.links).some(anchor => decodeURIComponent(anchor.href) === seller);
      if (!priceIsFree) return 'not listed as free';
      if (!byQuixel) return 'not a Quixel listing';
      const button = usable(claimButton());
      if (!button) {
        if (fab.signedOut(doc)) throw new Problem('e_sign_in');
        return 'no claim button';
      }
      const outcome = await this.press(doc, button, viewLink);
      if (outcome === 'not confirmed' && fab.signedOut(doc)) throw new Problem('e_sign_in');
      return outcome;
    }

    async coolDown() {
      this.throttles++;
      this.pacer.bad(2);
      if (this.throttles >= LIMITS.throttles) throw new Problem('e_rate_limit', 'paused');
      await this.countdown(60000 * this.throttles, 'm_slow_down');
    }

    settle(item, outcome) {
      const p = this.progress;
      this.done.add(item.url);
      p.sessionCount++;
      if (this.retrying.has(item.url)) p.retry = p.retry.filter(entry => entry.url !== item.url);

      if (outcome === 'added' || outcome === 'owned') {
        if (outcome === 'added') p.added++;
        else p.owned++;
        this.misses = 0;
        if (this.pacer.good()) this.throttles = 0;
      } else {
        p.retry.push({ title: item.title, url: item.url, reason: outcome });
        this.pacer.bad();
        if (++this.misses >= LIMITS.misses) throw new Problem('e_fail_streak', 'paused');
      }
      if (p.sessionCount % 10 === 0) saveDone();
      persist();
    }

    async run() {
      let doc = await this.catalog();
      let swept = false;   // one extra pass over a fresh catalog before declaring victory

      while (this.live && doc) {
        this.harvest(doc);
        if (!this.queue.length) {
          report('m_loading_more');
          if (await this.loadMore(doc)) continue;
          if (!this.live) return;
          if (swept) {
            this.progress.status = 'finished';
            this.progress.msg = this.progress.retry.length
              ? { k: 'm_done_some', p: { n: this.progress.retry.length } }
              : { k: 'm_done_all' };
            return;
          }
          swept = true;
          doc = await this.catalog();
          continue;
        }
        swept = false;

        const item = this.queue.shift();
        this.queued.delete(item.url);
        if (new URL(item.url).origin !== M.origin) throw new Problem('e_address');
        report('m_adding', { title: item.title });

        const tile = fab.tileFor(doc, item.url);
        let outcome = tile ? await this.fromTile(doc, tile, item.url) : 'tile missing';
        if (this.live && !['added', 'owned', 'throttled'].includes(outcome)) outcome = await this.fromListing(item.url);
        if (!this.live) return;

        if (outcome === 'throttled') {
          await this.coolDown();      // the item is not marked done, so it comes back
          doc = await this.catalog();
          continue;
        }
        this.settle(item, outcome);

        if (this.stale || fab.products(doc).length > LIMITS.cardsBeforeRefresh) {
          this.stale = false;
          doc = await this.catalog();
        }
      }
    }
  }

  // -------------------------------------------------------------- state --

  const blank = () => ({
    status: 'idle', added: 0, owned: 0, retry: [], total: null,
    elapsedMs: 0, startedAt: 0, sessionCount: 0, msg: null, heartbeat: 0, tabId: null, hidden: false
  });

  let progress = blank();
  let done = new Set();
  let session = null;
  let tabId = null;
  let writeTimer = null;

  function persist(now = false) {
    const write = () => {
      writeTimer = null;
      progress.heartbeat = Date.now();
      progress.hidden = document.hidden;
      return chrome.storage.local.set({ progress }).catch(() => {});
    };
    panel.update();
    if (now) { clearTimeout(writeTimer); return write(); }
    writeTimer ??= setTimeout(write, 600);
  }
  const saveDone = () => chrome.storage.local.set({ done: [...done] }).catch(() => {});
  function report(k, p = {}) { progress.msg = { k, p }; persist(); }

  async function begin({ fresh = false } = {}) {
    if (session) { panel.show(); return { ok: true, already: true }; }
    if (!fab.isCatalog(location.href)) return { ok: false, error: 'wrong-page' };

    tabId ??= await chrome.runtime.sendMessage({ cmd: 'whoami' }).catch(() => null);
    const saved = await chrome.storage.local.get(['progress', 'done']);
    const other = saved.progress;
    if (other?.status === 'running' && other.tabId !== tabId && Date.now() - (other.heartbeat || 0) < 15000) {
      return { ok: false, error: 'running-elsewhere' };   // never run in two tabs at once
    }

    progress = fresh || !other ? blank() : { ...blank(), ...other };
    done = new Set(fresh ? [] : saved.done || []);
    for (const entry of progress.retry) done.delete(entry.url);   // failed listings get another try
    Object.assign(progress, { status: 'running', tabId, startedAt: Date.now(), sessionCount: 0, msg: { k: 'm_starting' } });

    panel.show();
    session = new Session(progress, done, panel.frame());
    await persist(true);
    const beat = setInterval(() => persist(), 3000);

    session.run()
      .catch(problem => {
        console.warn('[Megascans Claimer]', problem);
        progress.status = problem instanceof Problem ? problem.status : 'paused';
        progress.msg = { k: problem instanceof Problem ? problem.key : 'e_unknown' };
      })
      .finally(async () => {
        clearInterval(beat);
        if (progress.status === 'running') {
          progress.status = 'paused';
          progress.msg = { k: 'm_paused_user' };
        }
        progress.elapsedMs += Date.now() - progress.startedAt;
        progress.startedAt = 0;
        session = null;
        await saveDone();
        await persist(true);
      });
    return { ok: true };
  }

  function pause() {
    if (!session) return;
    session.stop();
    report('m_pausing');
  }

  // -------------------------------------------------------------- panel --

  const panel = (() => {
    let host, root, wrap, frame;
    const el = {};
    const icon = (name, size = 16) => globalThis.ICONS.svg(name, size);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const t = (k, p) => I18N.t(k, p);

    const css = `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .wrap {
        --surface: #0d1019; --surface-2: #131726; --line: rgba(148,163,255,.10); --line-strong: rgba(148,163,255,.18);
        --text: #eef0fa; --muted: #8b92ab; --periwinkle: #8b9cff; --ok: #4ade80; --warn: #fbbf24; --danger: #f87171;
        font-family: "Inter", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
        position: fixed; inset: 0; z-index: 2147483646; display: flex; flex-direction: column; gap: 14px;
        padding: 18px 22px; color: var(--text); -webkit-font-smoothing: antialiased;
        background: radial-gradient(60% 45% at 50% -5%, rgba(61,107,255,.35), transparent 70%), rgba(5,6,10,.94);
        backdrop-filter: blur(8px); transition: opacity .2s;
      }
      .wrap[lang="fa"] { font-family: "Vazirmatn", "Segoe UI", Tahoma, system-ui, sans-serif; }
      .wrap[lang="zh"] { font-family: "Inter", "Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif; }
      .wrap.min { opacity: 0; pointer-events: none; }
      .icon { display: block; flex: none; }
      header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .logo { width: 34px; height: 34px; border-radius: 10px; flex: none; display: grid; place-items: center; color: #fff;
        background: linear-gradient(135deg, #5eead4, #3d6bff); box-shadow: 0 6px 20px rgba(61,107,255,.4); }
      h1 { font-size: 16px; font-weight: 700; margin: 0; }
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
      .bar.busy i { width: 30%; animation: slide 1.6s ease-in-out infinite; }
      @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(340%); } }
      .wrap[dir="rtl"] .bar.busy i { animation-name: slide-rtl; }
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
            <span class="pill" data-el="pill"></span>
            <div class="spacer"></div>
            <button data-el="toggle" class="primary"></button>
            <button data-el="hide"></button>
            <button data-el="close"></button>
          </header>
          <div class="stats">
            <div class="stat"><div class="ico ok">${icon('circleCheck', 18)}</div><div><b data-el="added">0</b><span data-t="ov_added"></span></div></div>
            <div class="stat"><div class="ico">${icon('library', 18)}</div><div><b data-el="owned">0</b><span data-t="ov_owned"></span></div></div>
            <div class="stat"><div class="ico warn">${icon('rotateCcw', 18)}</div><div><b data-el="retry">0</b><span data-t="ov_failed"></span></div></div>
            <div class="stat"><div class="ico">${icon('clock', 18)}</div><div><b data-el="time">0:00</b><span data-t="ov_time"></span></div></div>
          </div>
          <div class="bar" data-el="bar"><i data-el="fill"></i></div>
          <div class="msg">${icon('info', 15)}<span data-el="msg"></span></div>
          <div class="frame"><iframe data-el="frame"></iframe></div>
          <div class="note">${icon('monitor', 14)}<span data-t="ov_note"></span></div>
        </div>
        <div class="chip" data-el="chip"><span class="dot"></span><span data-el="chipText"></span></div>
      `;
      root.querySelectorAll('[data-el]').forEach(node => { el[node.dataset.el] = node; });
      wrap = root.querySelector('.wrap');
      frame = el.frame;
      el.toggle.addEventListener('click', () => (session ? pause() : begin()));
      el.hide.addEventListener('click', () => minimize(true));
      el.chip.addEventListener('click', () => minimize(false));
      el.close.addEventListener('click', () => {
        if (session && !confirm(t('ov_close_confirm'))) return;
        pause();
        host.remove();
      });
      document.documentElement.append(host);
      translate();
    }

    function minimize(on) {
      wrap.classList.toggle('min', on);
      el.chip.classList.toggle('show', on);
    }

    function translate() {
      if (!root) return;
      const info = I18N.info();
      wrap.lang = info.code;
      wrap.dir = info.dir;
      el.chip.dir = info.dir;
      root.querySelectorAll('[data-t]').forEach(node => { node.textContent = t(node.dataset.t); });
      el.hide.innerHTML = `${icon('eyeOff', 15)}<span>${esc(t('ov_hide'))}</span>`;
      el.hide.title = t('ov_hide_title');
      el.close.innerHTML = `${icon('x', 15)}<span>${esc(t('ov_close'))}</span>`;
      frame.title = t('ov_workspace');
      update();
    }

    function update() {
      if (!host?.isConnected) return;
      const p = progress;
      el.pill.className = `pill ${p.status}`;
      el.pill.innerHTML = `<span class="dot"></span>${esc(t(`status_${p.status}`))}`;
      el.added.textContent = I18N.num(p.added);
      el.owned.textContent = I18N.num(p.owned);
      el.retry.textContent = I18N.num(p.retry.length);
      el.time.textContent = I18N.duration(p.elapsedMs + (p.startedAt ? Date.now() - p.startedAt : 0));
      const handled = p.added + p.owned + p.retry.length;
      el.bar.classList.toggle('busy', !!session && !p.total);
      el.fill.style.width = p.total ? `${Math.min(100, (handled / p.total) * 100).toFixed(1)}%` : (p.status === 'finished' ? '100%' : '');
      el.msg.textContent = I18N.tm(p.msg);

      let label = t('btn_resume'), glyph = 'play';
      if (session) [label, glyph] = [t('btn_pause'), 'pause'];
      else if (p.status === 'finished') [label, glyph] = p.retry.length ? [t('ov_retry'), 'rotateCcw'] : [t('ov_run_again'), 'refresh'];
      el.toggle.innerHTML = `${icon(glyph, 15)}<span>${esc(label)}</span>`;
      el.chipText.textContent = t('ov_chip', { status: t(`status_${p.status}`), n: I18N.num(p.added) });
    }

    return {
      show() { if (!host?.isConnected) build(); minimize(false); update(); },
      frame() { if (!host?.isConnected) build(); return frame; },
      translate,
      update
    };
  })();

  // ----------------------------------------------------------- messages --

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    switch (msg?.cmd) {
      case 'ping':
        reply({ ok: true, onCatalog: fab.isCatalog(location.href), running: !!session });
        return;
      case 'start':
        begin({ fresh: !!msg.fresh }).then(reply);
        return true;
      case 'pause':
        pause();
        reply({ ok: true });
        return;
      case 'show':
        (async () => {
          if (!session) {   // not running here: show the last saved progress
            const { progress: saved } = await chrome.storage.local.get('progress');
            if (saved) progress = { ...blank(), ...saved };
          }
          panel.show();
          reply({ ok: true });
        })();
        return true;
    }
  });

  document.addEventListener('visibilitychange', () => { if (session) persist(); });
  I18N.load().then(() => panel.translate());
  I18N.onChange(() => panel.translate());

  // Started from the popup on another page: continue after the catalog has loaded.
  (async () => {
    if (!fab.isCatalog(location.href)) return;
    const { autostart } = await chrome.storage.local.get('autostart');
    if (!autostart || Date.now() - autostart.at > 120000) return;
    await chrome.storage.local.remove('autostart');
    await delay(1500);
    begin({ fresh: !!autostart.fresh });
  })();
})();

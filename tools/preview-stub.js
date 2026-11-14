(() => {
  const q = new URLSearchParams(location.search);
  const now = Date.now();
  const states = {
    running: { status: 'running', added: 1284, owned: 312, retry: [{title:'x',url:'u',reason:'r'}], total: 5200, elapsedMs: 0, startedAt: now - 2730000, sessionCount: 1597, msg: { k: 'm_adding', p: { title: 'Historic Bowl Wood Old 10' } }, heartbeat: now, tabId: 1, hidden: false },
    finished: { status: 'finished', added: 4870, owned: 312, retry: [], total: 5182, elapsedMs: 9900000, startedAt: 0, sessionCount: 0, msg: { k: 'm_done_all' }, heartbeat: now, tabId: 1 },
    none: undefined
  };
  const store = { progress: states[q.get('state') || 'running'], lang: q.get('lang') || 'en' };
  window.chrome = {
    storage: { local: { get: async k => { const o = {}; for (const key of [].concat(k)) if (store[key] !== undefined) o[key] = store[key]; return o; }, set: async o => Object.assign(store, o), remove: async () => {} },
      onChanged: { addListener() {} } },
    tabs: { query: async () => [{ id: 1, url: q.get('state') === 'none' ? 'https://example.com/' : 'https://www.fab.com/sellers/Quixel%20Megascans?is_free=1' }], sendMessage: async () => ({ ok: true }), update: async () => {}, create: async () => {}, reload: async () => {} },
    windows: { update: async () => {} }
  };
  window.close = () => {};
})();

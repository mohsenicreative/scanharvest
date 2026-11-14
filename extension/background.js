// ScanHarvest — background worker: toolbar badge, notifications, tab bookkeeping.
importScripts('i18n.js');

const STALE_MS = 15000; // a "running" state without a heartbeat for this long is treated as interrupted

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg?.cmd === 'whoami') reply(sender.tab?.id ?? null);
});

function shortCount(n) {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${Math.round(n / 1000)}k`;
}

function setBadge(run) {
  if (!run || run.status === 'idle') {
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  const look = {
    running: { text: shortCount(run.added), color: '#3d6bff' },
    paused: { text: '❚❚', color: '#b45309' },
    finished: { text: '✓', color: '#15803d' },
    error: { text: '!', color: '#b91c1c' }
  }[run.status] || { text: '', color: '#444' };
  chrome.action.setBadgeText({ text: look.text });
  chrome.action.setBadgeBackgroundColor({ color: look.color });
}

async function notify(run) {
  await I18N.load();
  const titleKey = { finished: 'n_finished', paused: 'n_paused', error: 'n_error' }[run.status] || 'appName';
  const counts = I18N.t('n_body', { a: I18N.num(run.added), o: I18N.num(run.owned) });
  chrome.notifications.create(`msc-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/128.png',
    title: I18N.t(titleKey),
    message: [I18N.tm(run.msg), counts].filter(Boolean).join('\n'),
    priority: 1
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.progress) return;
  const { oldValue: before, newValue: after } = changes.progress;
  setBadge(after);
  const userPaused = after?.msg?.k === 'm_paused_user';
  if (before?.status === 'running' && after && after.status !== 'running' && !userPaused) notify(after);
});

async function markInterrupted(key) {
  const { progress: run } = await chrome.storage.local.get('progress');
  if (!run || run.status !== 'running') return;
  run.elapsedMs += run.startedAt ? Math.max(0, (run.heartbeat || Date.now()) - run.startedAt) : 0;
  Object.assign(run, { status: 'paused', startedAt: 0, msg: { k: key } });
  await chrome.storage.local.set({ progress: run });
}

chrome.tabs.onRemoved.addListener(async tabId => {
  const { progress: run } = await chrome.storage.local.get('progress');
  if (run?.status === 'running' && run.tabId === tabId) markInterrupted('m_tab_closed');
});

async function checkStale() {
  const { progress: run } = await chrome.storage.local.get('progress');
  if (run?.status === 'running' && Date.now() - (run.heartbeat || 0) > STALE_MS) markInterrupted('m_interrupted');
  else setBadge(run);
}

chrome.runtime.onStartup.addListener(checkStale);
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.remove(['run', 'seen']);   // storage keys used before 1.1.0
  checkStale();
});

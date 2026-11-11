// Dev-only page: the UZU dev harness plus reset, rotate and tap-next buttons,
// keeping the game state across server logic restarts (see harness.mjs).
// Open http://localhost:<harness port>/harness while `npm run harness` runs.
// The harness proxies unknown paths to vite, so this page shares the harness
// origin and its in-memory room. Not part of the build.

const PAGE = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>UZU dev harness</title>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #1a1a2e; overflow: hidden; }
  #dev-controls { position: fixed; right: 12px; bottom: 12px; z-index: 2147483647; display: flex; gap: 8px; }
  #dev-controls button {
    width: 44px; height: 44px; border: 0; border-radius: 50%; cursor: pointer;
    background: rgba(255, 255, 255, 0.14); color: #fff; display: grid; place-items: center;
  }
  #dev-controls button:hover { background: rgba(255, 255, 255, 0.26); }
</style>
</head>
<body>
<template id="dev-controls-tpl"><div id="dev-controls">
  <button id="dev-reset" title="Reset" aria-label="Reset">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
  </button>
  <button id="dev-rotate" title="Rotate" aria-label="Rotate">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="16" rx="2"/><path d="M4 20h12a4 4 0 0 0 4-4v-2"/><path d="M17 17l3-3 3 3"/></svg>
  </button>
  <button id="dev-tap" title="Tap next" aria-label="Tap next">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10"/><path d="M12 9.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2.6-3.6a1.5 1.5 0 0 1 2.3-1.9L9 15"/></svg>
  </button>
</div></template>
<script>
  // The harness replaces <body>'s children, so hang the buttons on <html>.
  document.documentElement.append(document.getElementById('dev-controls-tpl').content.cloneNode(true));
  const params = new URLSearchParams(location.search);
  const forced = params.get('orientation');
  let orientation = null;
  let work = null;
  // The harness reads its orientation from /_uzu_meta.json; override it here.
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await realFetch(input, init);
    if (String(input) !== '/_uzu_meta.json') return res;
    const meta = await res.json();
    if (forced === 'portrait' || forced === 'landscape') meta.orientation = forced;
    orientation = meta.orientation;
    // Which work this harness runs, so state saved from another sample is never put back.
    work = JSON.stringify(meta.players.map((p) => p.characterId));
    // Load the player screens through the harness proxy, so they share this
    // page's origin and tap-next can reach their buttons.
    meta.scenarioUrl = location.origin + '/';
    return new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } });
  };
  document.getElementById('dev-reset').onclick = () => window.__uzu_dev?.reset?.({ seed: 'random' });
  document.getElementById('dev-rotate').onclick = () => {
    params.set('orientation', orientation === 'portrait' ? 'landscape' : 'portrait');
    location.search = params.toString();
  };
  // Click the first enabled, visible button across the player screens (same
  // origin): during the read-through that is the current reader's advance button.
  document.getElementById('dev-tap').onclick = () => {
    for (const frame of document.querySelectorAll('iframe')) {
      const doc = frame.contentDocument;
      const next = [...(doc?.querySelectorAll('button') ?? [])].find((b) => !b.disabled && b.getClientRects().length > 0);
      if (next) return next.click();
    }
  };
  // Hot swap: harness.mjs restarts the harness when the server logic changes,
  // which empties its in-memory room. Keep the latest state, and when the
  // harness comes back, reload and put that state back, only if it is the same
  // work (another sample may now run on this port). Uses its own channel
  // to the harness admin API, since the stock one does not reconnect.
  const RESTORE = 'uzu-dev-restore';
  let saved = sessionStorage.getItem(RESTORE);
  sessionStorage.removeItem(RESTORE);
  let last = null;
  let down = false;
  let admin = null;
  let seq = 0;
  const pending = new Map();
  const adminCall = (method, args = []) =>
    new Promise((resolve, reject) => {
      if (admin?.readyState !== WebSocket.OPEN) return reject(new Error('admin closed'));
      const id = 'dev-' + ++seq;
      pending.set(id, { resolve, reject });
      admin.send(JSON.stringify({ type: 'call', id, method, args }));
    });
  const openAdmin = () => {
    admin = new WebSocket('ws://' + location.host + '/dev/admin');
    admin.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const call = pending.get(msg.id);
      if (!call) return;
      pending.delete(msg.id);
      if (msg.type === 'error') call.reject(new Error(msg.error));
      else call.resolve(msg.value);
    };
    admin.onopen = () => {
      if (!down) return;
      if (last) sessionStorage.setItem(RESTORE, JSON.stringify({ work, state: last }));
      location.reload();
    };
    admin.onclose = () => {
      down = true;
      setTimeout(openAdmin, 1000);
    };
  };
  openAdmin();
  setInterval(async () => {
    // Fails with no_active_room until the player screens have joined.
    const state = await adminCall('getRawState').catch(() => null);
    if (!state) return;
    if (saved) {
      const { work: savedWork, state: savedState } = JSON.parse(saved);
      if (savedWork === work) await adminCall('setRawState', [savedState]).catch(() => {});
      saved = null;
    } else last = state;
  }, 1000);
</script>
<script src="/_uzu_harness.js"></script>
</body>
</html>
`;

// Plain JavaScript: each sample's vite.config.ts loads it from this package through Node, which
// cannot run TypeScript from another package before Node 22.18.
/** @returns {import('vite').Plugin} */
export const devHarness = () => ({
  name: 'dev-harness',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/harness') return next();
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(PAGE);
    });
  },
});

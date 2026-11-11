// Dev-only page: the UZU dev harness plus reset and rotate buttons.
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
</div></template>
<script>
  // The harness replaces <body>'s children, so hang the buttons on <html>.
  document.documentElement.append(document.getElementById('dev-controls-tpl').content.cloneNode(true));
  const params = new URLSearchParams(location.search);
  const forced = params.get('orientation');
  let orientation = null;
  // The harness reads its orientation from /_uzu_meta.json; override it here.
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await realFetch(input, init);
    if (String(input) !== '/_uzu_meta.json') return res;
    const meta = await res.json();
    if (forced === 'portrait' || forced === 'landscape') meta.orientation = forced;
    orientation = meta.orientation;
    return new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } });
  };
  document.getElementById('dev-reset').onclick = () => window.__uzu_dev?.reset?.({ seed: 'random' });
  document.getElementById('dev-rotate').onclick = () => {
    params.set('orientation', orientation === 'portrait' ? 'landscape' : 'portrait');
    location.search = params.toString();
  };
</script>
<script src="/_uzu_harness.js"></script>
</body>
</html>
`;

type Next = () => void;
type Res = { setHeader(k: string, v: string): void; end(body: string): void };
type Server = { middlewares: { use(fn: (req: { url?: string }, res: Res, next: Next) => void): void } };

export const devHarness = () => ({
  name: 'dev-harness',
  apply: 'serve' as const,
  configureServer(server: Server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/harness') return next();
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(PAGE);
    });
  },
});

// Runs inside each captured screen: number badges, the picked part's outline, and messages to the page.
(() => {
  const L = document.createElement('div');
  L.id = 'pv-layer';
  document.body.append(L);
  // Show every CSS animation at its end, as the screen settles after it.
  for (const a of document.getAnimations()) {
    try { a.finish(); } catch { a.cancel(); }
  }
  // Restore the scroll positions the app had (lists keep their newest item in view).
  document.querySelectorAll('[data-pv-scroll]').forEach((el) => (el.scrollTop = el.scrollHeight));
  const hud = document.createElement('div');
  hud.className = 'pv-hud';
  hud.style.width = HUD.x + 'px';
  hud.style.height = HUD.y + 'px';
  hud.textContent = 'UZU HUD';
  L.append(hud);

  const badges = {};
  const placed = [];
  for (const el of document.querySelectorAll('[data-n]')) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    // Left of the part when there is room, so the badge does not cover its text.
    let x = r.left >= 24 ? r.left - 21 : Math.max(2, r.left + 2);
    let y = Math.max(2, r.top - 3);
    while (placed.some((p) => Math.abs(p[0] - x) < 20 && Math.abs(p[1] - y) < 19)) y += 20;
    placed.push([x, y]);
    const b = document.createElement('div');
    b.className = 'pv-b';
    b.textContent = el.dataset.n;
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    b.onclick = (e) => {
      e.stopPropagation();
      parent.postMessage({ pv: 'pick', n: +el.dataset.n }, '*');
    };
    badges[el.dataset.n] = b;
    L.append(b);
  }

  let boxes = [];
  const sides = (s, p) => ['Top', 'Right', 'Bottom', 'Left'].map((d) => parseFloat(s[p + d]) || 0);
  function show(n) {
    boxes.forEach((b) => b.remove());
    boxes = [];
    Object.values(badges).forEach((b) => b.classList.remove('on'));
    const el = document.querySelector(`[data-n="${n}"]`);
    if (!el) return;
    badges[n]?.classList.add('on');
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const p = sides(s, 'padding');
    parent.postMessage({ pv: 'info', n, info: {
      w: Math.round(r.width), h: Math.round(r.height), margin: sides(s, 'margin'), padding: p,
      gap: /flex|grid/.test(s.display) ? parseFloat(s.rowGap) || 0 : null,
      fontSize: parseFloat(s.fontSize), hidden: !r.width && !r.height,
    } }, '*');
    const add = (c, x, y, w, h) => {
      const d = document.createElement('div');
      d.className = c;
      Object.assign(d.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      L.insertBefore(d, hud.nextSibling);
      boxes.push(d);
    };
    add('pv-box', r.left, r.top, r.width, r.height);
    add('pv-pad', r.left, r.top, r.width, p[0]);
    add('pv-pad', r.left, r.bottom - p[2], r.width, p[2]);
    add('pv-pad', r.left, r.top + p[0], p[3], r.height - p[0] - p[2]);
    add('pv-pad', r.right - p[1], r.top + p[0], p[1], r.height - p[0] - p[2]);
  }

  addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.pv === 'show') show(d.n);
    if (d.pv === 'labels') document.body.classList.toggle('pv-off', !d.on);
  });
  document.addEventListener('click', (e) => {
    e.preventDefault();
    const t = e.target.closest('[data-n]');
    if (t) parent.postMessage({ pv: 'pick', n: +t.dataset.n }, '*');
  }, true);
  parent.postMessage({ pv: 'ready' }, '*');
})();

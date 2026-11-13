// Runs in a captured screen's frame (capture.mjs --check) and returns what spills over.
// Four kinds, each with the element's path and how many px it is out by:
//   screen  - a box past the viewport
//   inset   - text or an image under the safe area or the UZU HUD (boxes may reach under them)
//   parent  - a box past its parent's edge, where the parent shows overflow
//   clipped - content cut off by an element that hides overflow, or a list scrolling sideways
// An element or subtree marked data-overflow-ok is skipped. An element marked data-overflow-parent-ok
// is only exempt from the "parent" check (it reaches past its parent on purpose, as a sheet's panel
// does); its own size against the screen and the safe area, and its content, are still checked.
() => {
  const TOL = 1;
  const root = getComputedStyle(document.documentElement);
  const px = (name) => parseFloat(root.getPropertyValue(name)) || 0;
  const safe = { top: px('--uzu-safe-area-inset-top'), right: px('--uzu-safe-area-inset-right'), bottom: px('--uzu-safe-area-inset-bottom'), left: px('--uzu-safe-area-inset-left') };
  const hud = { right: px('--uzu-safe-area-inset-left') + px('--uzu-hud-inset-x'), bottom: px('--uzu-safe-area-inset-top') + px('--uzu-hud-inset-y') };
  const W = innerWidth;
  const H = innerHeight;
  const issues = [];

  const path = (el) => {
    const names = [];
    for (let e = el; e && e !== document.body && names.length < 3; e = e.parentElement)
      names.unshift(e.localName + [...e.classList].filter((c) => !c.startsWith('svelte-')).map((c) => '.' + c).join(''));
    return names.join(' > ');
  };
  const label = (el) => (el.textContent ?? '').trim().slice(0, 20);
  const add = (kind, el, by, side) => issues.push({ kind, path: path(el), side, by: Math.round(by), text: label(el) });
  const clips = (st, axis) => st[axis] !== 'visible';
  const scrolls = (st, axis) => ['auto', 'scroll'].includes(st[axis]);

  // Shown, and not scrolled out of a list or cut away by a clipping ancestor.
  const shown = (el, r) => {
    if (!r.width && !r.height) return false;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.opacity === '0') return false;
    for (let a = el.parentElement; a; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (as.opacity === '0') return false;
      if (as.overflowX === 'visible' && as.overflowY === 'visible') continue;
      const b = a.getBoundingClientRect();
      if (r.right <= b.left || r.left >= b.right || r.bottom <= b.top || r.top >= b.bottom) return false;
    }
    return true;
  };
  // Inside a scroll list, only the list itself has to fit the screen.
  const inScroll = (el) => {
    for (let a = el.parentElement; a; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (scrolls(as, 'overflowX') || scrolls(as, 'overflowY')) return true;
    }
    return false;
  };
  const sides = (r, box) => [
    ['left', box.left - r.left], ['right', r.right - box.right], ['top', box.top - r.top], ['bottom', r.bottom - box.bottom],
  ].filter(([, by]) => by > TOL);
  const underHud = (r) => r.left < hud.right - TOL && r.top < hud.bottom - TOL && r.right > TOL && r.bottom > TOL;
  const content = { left: safe.left, top: safe.top, right: W - safe.right, bottom: H - safe.bottom };

  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('[data-overflow-ok]') || (el.closest('svg') && el.localName !== 'svg')) continue;
    const r = el.getBoundingClientRect();
    if (!shown(el, r)) continue;
    const st = getComputedStyle(el);
    const scrolled = inScroll(el);

    if (!scrolled) for (const [side, by] of sides(r, { left: 0, top: 0, right: W, bottom: H })) add('screen', el, by, side);

    // Text and images must keep clear of the safe area and the HUD.
    const ink = [];
    if (['img', 'svg', 'video', 'canvas'].includes(el.localName)) ink.push(r);
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      ink.push(...range.getClientRects());
    }
    for (const t of ink) {
      if (scrolled) break;
      for (const [side, by] of sides(t, content)) add('inset', el, by, side);
      if (underHud(t)) add('inset', el, Math.min(hud.right - t.left, hud.bottom - t.top), 'hud');
    }

    // Past the parent's edge, where the parent lets it show.
    const p = el.parentElement;
    // An inline parent is only its text's line, so it bounds nothing (ruby stands above its word).
    if (p && p !== document.body && st.position !== 'fixed' && !el.hasAttribute('data-overflow-parent-ok')) {
      const ps = getComputedStyle(p);
      if (ps.display !== 'inline' && ps.overflowX === 'visible' && ps.overflowY === 'visible')
        for (const [side, by] of sides(r, p.getBoundingClientRect())) add('parent', el, by, side);
    }
    // Text past its own box's sides, where the box lets it show. Not above or below: a tight
    // line-height puts the glyphs past the box without anything spilling over.
    if (st.overflowX === 'visible' && st.display !== 'inline')
      for (const t of ink.filter((t) => t !== r))
        for (const [side, by] of sides(t, r)) if (side === 'left' || side === 'right') add('parent', el, by, side);

    // Cut off by its own clipping, unless it is a scroll list.
    // A list that scrolls up and down still must not run sideways (overflow-y: auto makes x auto too).
    if (clips(st, 'overflowX') && el.scrollWidth - el.clientWidth > TOL)
      add('clipped', el, el.scrollWidth - el.clientWidth, 'x');
    if (clips(st, 'overflowY') && !scrolls(st, 'overflowY') && el.scrollHeight - el.clientHeight > TOL)
      add('clipped', el, el.scrollHeight - el.clientHeight, 'y');
    if (st.textOverflow === 'ellipsis' && el.scrollWidth - el.clientWidth > TOL) add('clipped', el, el.scrollWidth - el.clientWidth, 'ellipsis');
  }
  // One line per element, kind and side.
  const seen = new Set();
  return issues.filter((i) => {
    const k = `${i.kind}|${i.path}|${i.side}|${i.text}`;
    return !seen.has(k) && seen.add(k);
  });
}

() => {
  // The boxes of the marked parts, from the screen's top left in CSS px: every element with data-uzu-part (its first word),
  // and `main`, `phase` and `scroll` for the three data-uzu-* marks the screens keep (docs/screen-preview.md). Run in the page.
  const boxes = [];
  const add = (part, el) => {
    const r = el.getBoundingClientRect();
    if (r.width || r.height) boxes.push({ part, x: +r.left.toFixed(1), y: +r.top.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) });
  };
  document.querySelectorAll('[data-uzu-part]').forEach((e) => add(e.dataset.uzuPart.trim().split(/\s+/)[0], e));
  document.querySelectorAll('[data-uzu-actions="main"]').forEach((e) => add('main', e));
  document.querySelectorAll('[data-uzu-phase]').forEach((e) => add('phase', e));
  document.querySelectorAll('[data-uzu-scroll]').forEach((e) => add('scroll', e));
  return { em: parseFloat(getComputedStyle(document.querySelector('main') ?? document.body).fontSize), boxes };
}

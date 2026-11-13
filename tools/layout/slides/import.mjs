// Reads slides edited from the layout's slide export (docs/design/layout.md, "Slides") back into
// the layout definition. A box is matched to a part by the part id written in its text. Moves
// go into the layout; the rest is only listed: new boxes (new parts), boxes that vanished from a
// scene that shows them, and parts moved to different places on different slides.
//
// How slides are read:
// - The slides of one orientation are told apart by their aspect ratio; within an orientation the
//   n-th slide is the n-th scene of the layout.
// - A shape counts only if it has a box (an explicit position) and text. Text that is empty or
//   starts with `#` marks a caption or decoration and is ignored; pictures and shapes inside
//   groups are not read.
// - A box is placed on the reference screen: the slide is scaled to the reference size.
//
// CLI:  node import.mjs <slides.pptx> [layout.json]   (rewrites the layout file when parts moved)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const DEFAULT_LAYOUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/reader/src/layouts/read-through.layout.json');
const ORIENTATIONS = ['landscape', 'portrait'];
/** Moves smaller than this many reference px are rounding, not edits. */
const TOLERANCE = 1;

const decode = (s) =>
  s.replace(/&(lt|gt|amp|quot|apos|#x[0-9a-fA-F]+|#\d+);/g, (m, e) => {
    if (e === 'lt') return '<';
    if (e === 'gt') return '>';
    if (e === 'amp') return '&';
    if (e === 'quot') return '"';
    if (e === 'apos') return "'";
    return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  });

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

/** The slides of a pptx, in order: their size in EMU and their shapes with a box and text. */
export async function readSlides(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const read = async (name) => {
    const f = zip.file(name);
    if (!f) throw new Error(`not a slide deck: ${name} is missing`);
    return f.async('string');
  };
  const pres = await read('ppt/presentation.xml');
  const size = attrs(pres.match(/<p:sldSz\b[^>]*>/)?.[0] ?? '');
  const width = Number(size.cx);
  const height = Number(size.cy);
  if (!(width > 0 && height > 0)) throw new Error('not a slide deck: no slide size');
  const rels = new Map(
    [...(await read('ppt/_rels/presentation.xml.rels')).matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
      const a = attrs(m[0]);
      return [a.Id, a.Target];
    }),
  );
  const slides = [];
  for (const m of pres.matchAll(/<p:sldId\b[^>]*>/g)) {
    const target = rels.get(attrs(m[0])['r:id']);
    if (!target) continue;
    const xml = await read(target.startsWith('/') ? target.slice(1) : posix.join('ppt', target));
    const shapes = [];
    for (const sp of xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)) {
      const body = sp[0];
      if (/<p:ph\b/.test(body)) continue;
      const off = body.match(/<a:off\b[^>]*>/);
      const ext = body.match(/<a:ext\b[^>]*>/);
      if (!off || !ext) continue;
      const o = attrs(off[0]);
      const e = attrs(ext[0]);
      const text = decode(
        [...body.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)]
          .map((p) => [...p[0].matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)].map((t) => t[1]).join(''))
          .join(' '),
      ).trim();
      if (!text || text.startsWith('#')) continue;
      shapes.push({ text, x: Number(o.x), y: Number(o.y), w: Number(e.cx), h: Number(e.cy) });
    }
    slides.push({ shapes });
  }
  return { width, height, slides };
}

const near = (a, b) => a.every((n, i) => Math.abs(n - b[i]) <= TOLERANCE);
const sameRect = (a, b) => a.length === b.length && near(a, b);

/**
 * What the edited slides change in a layout. Returns the layout with the moves applied and the lists:
 * `moved` (id, orientation, from, to), `added` (new boxes), `removed` (part missing from a scene that
 * shows it), `conflicts` (a part at different new places on different slides; not applied) and
 * `problems` (slides that cannot be read).
 */
export async function importSlides(layout, buffer) {
  const { width, height, slides } = await readSlides(buffer);
  const result = { layout: structuredClone(layout), moved: [], added: [], removed: [], conflicts: [], problems: [] };
  const orientations = ORIENTATIONS.filter((o) => layout.reference[o]);
  const ratio = width / height;
  const byOrientation = new Map(orientations.map((o) => [o, []]));
  slides.forEach((slide, i) => {
    const best = orientations
      .map((o) => ({ o, d: Math.abs(Math.log(ratio / (layout.reference[o][0] / layout.reference[o][1]))) }))
      .sort((a, b) => a.d - b.d)[0];
    if (!best || best.d > 0.05) result.problems.push(`slide ${i + 1}: its shape matches no reference screen of the layout`);
    else byOrientation.get(best.o).push({ number: i + 1, slide });
  });

  for (const o of orientations) {
    const [refW, refH] = layout.reference[o];
    const mine = byOrientation.get(o);
    if (mine.length !== layout.scenes.length) {
      result.problems.push(`${o}: ${mine.length} slides for ${layout.scenes.length} scenes; slides are read one per scene, so none of them is read`);
      continue;
    }
    // Where each part was found on each slide (reference px).
    const found = new Map();
    mine.forEach(({ number, slide }, k) => {
      const scene = layout.scenes[k];
      const seen = new Map();
      for (const shape of slide.shapes) {
        const rect = [shape.x / width * refW, shape.y / height * refH, shape.w / width * refW, shape.h / height * refH].map(Math.round);
        const token = (shape.text.match(/[A-Za-z][A-Za-z0-9]*/g) ?? []).find((t) => layout.parts[t] || layout.reserved?.[t]);
        if (token) {
          if (!seen.has(token)) seen.set(token, []);
          seen.get(token).push(rect);
        } else {
          result.added.push({ orientation: o, scene: scene.key, slide: number, text: shape.text, rect });
        }
      }
      for (const [id, rects] of seen) {
        if (!layout.parts[id]) continue;
        const original = layout.parts[id][o];
        // A copied box keeps the id: the one nearest the original is the part, the others are new.
        const sorted = [...rects].sort((a, b) => dist(a, original) - dist(b, original));
        sorted.slice(1).forEach((rect) => result.added.push({ orientation: o, scene: scene.key, slide: number, text: id, copyOf: id, rect }));
        if (!found.has(id)) found.set(id, []);
        found.get(id).push({ scene: scene.key, slide: number, rect: sorted[0] });
      }
      for (const id of scene.show) {
        if (!seen.has(id)) result.removed.push({ orientation: o, scene: scene.key, slide: number, id });
      }
    });
    for (const [id, places] of found) {
      const original = layout.parts[id][o];
      const changed = places.filter((p) => !sameRect(p.rect, original));
      if (changed.length === 0) continue;
      const first = changed[0].rect;
      if (changed.every((p) => sameRect(p.rect, first))) {
        result.layout.parts[id][o] = first;
        result.moved.push({ id, orientation: o, from: [...original], to: first });
      } else {
        result.conflicts.push({ id, orientation: o, places: changed.map((p) => ({ scene: p.scene, slide: p.slide, rect: p.rect })) });
      }
    }
  }
  return result;
}

const dist = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));

/**
 * The layout file's text with the moved parts' boxes replaced. Parts written on one line each keep their
 * layout; any other shape of file is written out again as JSON.
 */
export function applyMoves(text, moved, updated) {
  let out = text;
  let patched = true;
  for (const { id, orientation, to } of moved) {
    const line = new RegExp(`^(\\s*"${id}": \\{.*"${orientation}": )\\[[^\\]]*\\]`, 'm');
    if (line.test(out)) out = out.replace(line, `$1[${to.join(', ')}]`);
    else patched = false;
  }
  return patched ? out : JSON.stringify(updated, null, 2) + '\n';
}

/** The lists as text for a person. */
export function reportOf(result) {
  const lines = [];
  const rect = (r) => `[${r.join(', ')}]`;
  for (const m of result.moved) lines.push(`moved   ${m.id} (${m.orientation}) ${rect(m.from)} -> ${rect(m.to)}`);
  for (const a of result.added) lines.push(`new     ${a.orientation} scene ${a.scene}, slide ${a.slide}: "${a.text}" at ${rect(a.rect)}${a.copyOf ? ` (copy of ${a.copyOf})` : ''}; needs code`);
  for (const r of result.removed) lines.push(`removed ${r.id} (${r.orientation}) is gone from scene ${r.scene}, slide ${r.slide}`);
  for (const c of result.conflicts) lines.push(`conflict ${c.id} (${c.orientation}) is in different places: ${c.places.map((p) => `scene ${p.scene} ${rect(p.rect)}`).join(', ')}; not applied`);
  for (const p of result.problems) lines.push(`problem ${p}`);
  return lines.length ? lines.join('\n') : 'no changes';
}

async function main(argv) {
  const [deck, layoutFile = DEFAULT_LAYOUT] = argv;
  if (!deck) throw new Error('usage: node import.mjs <slides.pptx> [layout.json]');
  const text = readFileSync(layoutFile, 'utf8');
  const result = await importSlides(JSON.parse(text), readFileSync(deck));
  if (result.moved.length) writeFileSync(layoutFile, applyMoves(text, result.moved, result.layout));
  console.log(reportOf(result));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

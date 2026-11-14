// Writes the order sheet for an image generator (ChatGPT and the like) from a layout definition
// (docs/design/layout.md): the list of image parts to make (file name, size, how it stretches) and
// one prompt per scene. The prompts' wording lives in brief-text.json; this file only fills it in.
//
// CLI:  node brief.mjs [layout.json] [world.md] [--orientation landscape|portrait] [--out file]
// The world file (optional) replaces the 【世界観】 hole. Without --orientation the sheet is for
// landscape (portrait only when the layout has no landscape).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const TEXT = JSON.parse(readFileSync(resolve(here, 'brief-text.json'), 'utf8'));
// In the toolkit's repository the reader is at packages/reader; installed, it sits beside the toolkit package.
const LAYOUTS = ['../../../packages/reader/src/layouts', '../../../../reader/src/layouts'].map((d) => resolve(here, d, 'read-through.layout.json'));
export const DEFAULT_LAYOUT = LAYOUTS.find(existsSync) ?? LAYOUTS[0];

const fill = (template, values) => template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
const pct = (n, of) => Math.round((n / of) * 1000) / 10;

/** The orientation a sheet is for: the asked one, else landscape, else the layout's first. */
export function pickOrientation(layout, asked) {
  const have = ['landscape', 'portrait'].filter((o) => layout.reference[o]);
  if (asked) {
    if (!have.includes(asked)) throw new Error(`layout ${layout.screen} has no ${asked} reference size`);
    return asked;
  }
  if (have.length === 0) throw new Error(`layout ${layout.screen} has no reference size`);
  return have.includes('landscape') ? 'landscape' : have[0];
}

const boxPct = ([x, y, w, h], [W, H]) => ({ x: pct(x, W), y: pct(y, H), w: pct(w, W), h: pct(h, H) });

/** The image parts to make: one per image name, sized at twice its largest box. */
export function imageList(layout, orientation) {
  const [W, H] = layout.reference[orientation];
  const byImage = new Map();
  for (const [id, part] of Object.entries(layout.parts)) {
    if (!part.image || !part[orientation]) continue;
    if (!byImage.has(part.image)) byImage.set(part.image, []);
    byImage.get(part.image).push({ id, label: part.label, stretch: !!part.stretch, box: part[orientation] });
  }
  const mineParts = new Set(layout.scenes.flatMap((s) => s.mine));
  const list = [...byImage].map(([image, boxes]) => {
    const w = Math.max(...boxes.map((b) => b.box[2]));
    const h = Math.max(...boxes.map((b) => b.box[3]));
    const stretch = boxes.some((b) => b.stretch);
    return {
      image,
      file: `assets/${image}.webp`,
      role: image.includes('{role}'),
      width: w * 2,
      height: h * 2,
      stretch,
      opaque: boxes.some((b) => b.box[2] >= W && b.box[3] >= H),
      boxes,
      mineOf: undefined,
    };
  });
  // A part that takes your colour in some scene also needs its picture in your colour.
  return list.flatMap((img) => {
    const mine = img.boxes.some((b) => mineParts.has(b.id));
    return mine ? [img, { ...img, image: `${img.image}-mine`, file: `assets/${img.image}-mine.webp`, mineOf: img.file }] : [img];
  });
}

function imageEntry(img) {
  const t = TEXT;
  const lines = [`### ${img.file}`];
  lines.push(`- ${fill(t.sizeLine, { w: img.width, h: img.height })}`);
  lines.push(`- ${img.stretch ? fill(t.stretchUse, { end: img.height }) : t.fixedUse}`);
  lines.push(`- ${img.opaque ? t.opaqueUse : t.transparentUse}`);
  if (img.mineOf) lines.push(`- ${fill(t.mineUse, { file: img.mineOf })}`);
  if (img.role) lines.push(`- ${t.roleNote}`);
  const ratios = img.boxes.map((b) => b.box[2] / b.box[3]);
  if (!img.stretch && Math.max(...ratios) / Math.min(...ratios) > 1.05) lines.push(`- ${t.variedNote}`);
  const boxes = img.boxes.map((b) => fill(t.boxItem, { label: b.label, w: b.box[2], h: b.box[3] })).join('、');
  lines.push(`- ${fill(t.sharedLine, { boxes })}`);
  lines.push('', fill(t.partPrompt, { file: img.file, w: img.width, h: img.height }));
  return lines.join('\n');
}

function sceneEntry(layout, scene, orientation) {
  const t = TEXT;
  const ref = layout.reference[orientation];
  const lines = [`### ${scene.id}. ${scene.label}`, ''];
  const parts = [fill(t.sceneIntro, { label: scene.label, w: ref[0], h: ref[1] })];
  for (const id of scene.show) {
    const part = layout.parts[id];
    const rect = part?.[orientation];
    if (!rect) continue;
    const p = boxPct(rect, ref);
    const kind = part.image ? fill(t.scenePartImage, { file: `assets/${part.image}.webp` }) : t.scenePartCode;
    parts.push(`- ${fill(t.scenePart, { label: part.label, ...p })}${kind}`);
  }
  lines.push(parts[0], ...parts.slice(1));
  const reserved = Object.values(layout.reserved ?? {}).filter((a) => a[orientation]);
  if (reserved.length) {
    lines.push('', t.sceneReserved);
    for (const area of reserved) {
      lines.push(`- ${fill(t.scenePart, { label: area.label, ...boxPct(area[orientation], ref) })}`);
    }
  }
  const margin = layout.margin?.[orientation];
  if (margin) {
    lines.push('', fill(t.sceneMargin, {
      top: pct(margin.top, ref[1]), right: pct(margin.right, ref[0]),
      bottom: pct(margin.bottom, ref[1]), left: pct(margin.left, ref[0]),
    }));
  }
  lines.push('', t.sceneEnd);
  return lines.join('\n');
}

/** The order sheet as Markdown, ready to copy to an image generator. */
export function buildBrief(layout, { world, orientation } = {}) {
  const o = pickOrientation(layout, orientation);
  const t = TEXT;
  const out = [
    `# ${fill(t.title, { screen: layout.screen, orientation: o })}`,
    '',
    t.intro,
    '',
    t.worldHeading,
    '',
    world && world.trim() ? world.trim() : t.worldHole,
    '',
    `## ${t.rulesHeading}`,
    '',
    ...t.rules.map((r) => `- ${r}`),
    '',
    `## ${t.partsHeading}`,
    '',
    imageList(layout, o).map(imageEntry).join('\n\n'),
    '',
    `## ${t.scenesHeading}`,
    '',
    layout.scenes.map((s) => sceneEntry(layout, s, o)).join('\n\n'),
    '',
  ];
  return out.join('\n');
}

function main(argv) {
  const files = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--orientation') opts.orientation = argv[++i];
    else if (argv[i] === '--out') opts.out = argv[++i];
    else files.push(argv[i]);
  }
  const layout = JSON.parse(readFileSync(files[0] ?? DEFAULT_LAYOUT, 'utf8'));
  const world = files[1] ? readFileSync(files[1], 'utf8') : undefined;
  const text = buildBrief(layout, { world, orientation: opts.orientation });
  if (opts.out) writeFileSync(opts.out, text);
  else process.stdout.write(text);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));

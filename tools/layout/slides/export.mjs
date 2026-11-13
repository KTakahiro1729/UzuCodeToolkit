// Writes a layout definition (docs/design/layout.md) out as slides to move boxes on.
// One slide per scene, at the reference size; each box holds "label id width×height".
// A pptx has one slide size, so each orientation gets its own file:
// layout.pptx when the layout has one orientation, else layout-landscape.pptx and layout-portrait.pptx.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_LAYOUT = resolve(here, '../../../packages/reader/src/layouts/read-through.layout.json');
const ORIENTATIONS = ['landscape', 'portrait'];
/** Slide px are CSS px: 96 per inch, so 1 px = 9525 EMU exactly. */
export const PX_PER_INCH = 96;

const COLORS = {
  part: { fill: 'DCE9F7', line: '4A7BB5', text: '1F3A5C' },
  mine: { fill: 'FBE3C4', line: 'D9822B', text: '6B3A08' },
  reserved: { fill: 'D9D9D9', line: '8C8C8C', text: '4D4D4D' },
};

/** The text a box carries; the importer reads the id from here. */
export function boxText(label, id, w, h) {
  return `${label} ${id} ${w}×${h}`;
}

/** The orientations a layout supports, in a fixed order. */
export function orientationsOf(layout) {
  return ORIENTATIONS.filter((o) => layout.reference?.[o]);
}

/** Builds one presentation for one orientation. Returns the pptxgenjs object. */
export function buildDeck(layout, orientation) {
  const [rw, rh] = layout.reference[orientation];
  const inch = (px) => px / PX_PER_INCH;
  const pptx = new pptxgen();
  pptx.defineLayout({ name: `${layout.screen}-${orientation}`, width: inch(rw), height: inch(rh) });
  pptx.layout = `${layout.screen}-${orientation}`;
  pptx.title = `${layout.screen} ${orientation}`;

  // A box too small for its caption keeps only "id size" on one line at 7pt; the id is the key
  // the importer reads, so it is never dropped.
  const addBox = (slide, id, label, rect, c, opts = {}) => {
    const [x, y, w, h] = rect;
    const small = w < 80 || h < 30;
    slide.addText(boxText(small ? '' : label, id, w, h).trim(), {
      x: inch(x), y: inch(y), w: inch(w), h: inch(h),
      shape: pptx.ShapeType.rect,
      fill: { color: c.fill, transparency: opts.transparency ?? 0 },
      line: { color: c.line, width: 1 },
      color: c.text,
      fontSize: small ? 7 : h < 40 ? 8 : 11,
      align: opts.align ?? 'left', valign: opts.valign ?? 'top', margin: 2, fit: 'none', wrap: !small,
      objectName: id,
    });
  };

  for (const scene of layout.scenes) {
    const slide = pptx.addSlide();
    slide.addNotes(`${scene.id} ${scene.key} ${scene.label}`);
    for (const id of scene.show) {
      const part = layout.parts[id];
      const rect = part?.[orientation];
      if (!rect) throw new Error(`layout ${layout.screen}: scene "${scene.key}" shows "${id}" with no ${orientation} box`);
      // The background sits bottom right so its text clears the boxes drawn over its top left.
      addBox(slide, id, part.label, rect, scene.mine.includes(id) ? COLORS.mine : COLORS.part, id === 'bg' ? { align: 'right', valign: 'bottom' } : {});
    }
    for (const [id, area] of Object.entries(layout.reserved ?? {})) {
      if (area[orientation]) addBox(slide, id, area.label, area[orientation], COLORS.reserved, { transparency: 60 });
    }
  }
  return pptx;
}

/** Writes the decks into outDir; returns the file paths written. */
export async function exportLayout(layout, outDir) {
  const orientations = orientationsOf(layout);
  if (orientations.length === 0) throw new Error(`layout ${layout.screen}: no reference size`);
  const written = [];
  for (const o of orientations) {
    const file = join(outDir, orientations.length === 1 ? 'layout.pptx' : `layout-${o}.pptx`);
    await buildDeck(layout, o).writeFile({ fileName: file });
    written.push(file);
  }
  return written;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [srcArg, outArg] = process.argv.slice(2);
  const src = srcArg || DEFAULT_LAYOUT;
  const outDir = outArg || '.';
  const layout = JSON.parse(readFileSync(src, 'utf8'));
  for (const f of await exportLayout(layout, outDir)) console.log(f);
}

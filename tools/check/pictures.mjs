// The picture checks of a work (public/assets/*.webp) against its layout definition (docs/design/layout.md).
// Pictures are optional: a work with none is drawn from colour tokens. Once it ships any picture the layout names
// (background, frame, ...), the rest of the set has to be there, so a screen is never half-dressed by an oversight.
// Reads only the first bytes of each WebP; no image library, so it runs wherever Node does.
//   picture-missing  a picture the layout names (and `-mine` for a part that takes your colour; `stand-<cast id>` for
//                    each cast entry that is not a stage direction) is not in public/assets/, while others are.
// Warnings:
//   picture-ratio    a picture whose width:height differs from its box's by more than 2% (it is stretched to the box).
//                    Not checked for stretched parts (the nameplate), for the full-screen background (it is cropped to cover the screen) or when the work serves both orientations.
//   picture-alpha    a picture meant to be drawn over others has no alpha channel (a part with a transparent
//                    background; the full-screen background is the one that may be opaque).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_LAYOUT, imageList } from '../layout/brief/brief.mjs';

/** { width, height, alpha } from a WebP's header, or null when the file is not a WebP this can read. */
export function webpInfo(buf) {
  if (buf.length < 30 || buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') return null;
  const kind = buf.toString('latin1', 12, 16);
  if (kind === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff, alpha: false };
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1, alpha: ((b >> 28) & 1) === 1 };
  }
  if (kind === 'VP8X')
    return { width: (buf.readUIntLE(24, 3)) + 1, height: (buf.readUIntLE(27, 3)) + 1, alpha: (buf[20] & 0x10) !== 0 };
  return null;
}

/** The layout the work's screen uses: its own `src/*.layout.json` when it has exactly one, else the toolkit's. */
function layoutOf(dir) {
  const own = existsSync(join(dir, 'src')) ? readdirSync(join(dir, 'src')).filter((f) => f.endsWith('.layout.json')) : [];
  return JSON.parse(readFileSync(own.length === 1 ? join(dir, 'src', own[0]) : DEFAULT_LAYOUT, 'utf8'));
}

/** Findings as [list, rule, message] for `checkWork` to file. */
export function checkPictures(dir, manifest) {
  const out = [];
  const assets = join(dir, 'public', 'assets');
  const layout = layoutOf(dir);
  const orientations = ['landscape', 'portrait'].filter((o) => layout.reference[o] && (!manifest.orientation || manifest.orientation === o));
  const wanted = new Map(); // name -> { entry }
  for (const o of orientations)
    for (const img of imageList(layout, o)) {
      if (img.role) continue;
      if (!wanted.has(img.image)) wanted.set(img.image, { ...img, orientations: 1 });
      else wanted.get(img.image).orientations++;
    }
  const scriptFile = join(dir, 'script', 'script.json');
  const cast = existsSync(scriptFile) ? (JSON.parse(readFileSync(scriptFile, 'utf8')).cast ?? []) : [];
  const hasRole = [...new Set(orientations.flatMap((o) => imageList(layout, o)).filter((i) => i.role).map((i) => i.image))];
  const names = [...wanted.keys(), ...hasRole.flatMap((p) => cast.filter((c) => !c.direction).map((c) => p.replace('{role}', c.id)))];
  const shown = (n) => existsSync(join(assets, `${n}.webp`));
  if (!names.some(shown)) return out;

  const missing = names.filter((n) => !shown(n));
  if (missing.length)
    out.push(['errors', 'picture-missing', `public/assets/ lacks ${missing.map((n) => `${n}.webp`).join(', ')} (the layout names them, and other pictures are there). Make them from the order sheet, or remove the pictures you do not mean to ship; the sheet lists each with its size.`]);
  for (const [name, img] of wanted) {
    if (!shown(name)) continue;
    const info = webpInfo(readFileSync(join(assets, `${name}.webp`)));
    if (!info) { out.push(['warnings', 'picture-ratio', `${name}.webp is not a WebP this check can read.`]); continue; }
    if (!img.opaque && !info.alpha)
      out.push(['warnings', 'picture-alpha', `${name}.webp has no alpha channel, but it is drawn over other pictures: its background should be transparent.`]);
    if (!img.stretch && !img.opaque && img.orientations === 1) {
      const diff = Math.abs(info.width / info.height / (img.width / img.height) - 1);
      if (diff > 0.02)
        out.push(['warnings', 'picture-ratio', `${name}.webp is ${info.width}×${info.height}; its box is ${img.width / 2}×${img.height / 2} (${img.width}×${img.height} at twice the size), so it would be stretched by ${(diff * 100).toFixed(1)}%.`]);
    }
  }
  for (const n of names.filter((n) => n.startsWith('stand-') && shown(n)))
    if (!webpInfo(readFileSync(join(assets, `${n}.webp`)))?.alpha)
      out.push(['warnings', 'picture-alpha', `${n}.webp has no alpha channel, but a standing character is drawn over the background: its background should be transparent.`]);
  return out;
}

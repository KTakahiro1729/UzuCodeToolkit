// Static checks for what no one sees on screen but certification or the game's sync cares about
// (https://docs.code.uzu-app.com/certification). Reads a work's source; runs nothing.
//   node tools/check/static.mjs <work folder>        exits 1 on any error; warnings only print
// In a test: `expect(checkWork(dir).errors).toEqual([])`. Types: static.d.mts.
//
// Errors (a defect the author cannot see, and certification or online play breaks on):
//   first-frame      the work never calls firstFrameReady() (directly or through startFlow()/startReader()): the splash stays.
//   file-name        a file in public/ or src/ has a name outside [A-Za-z0-9_.-].
//   external-url     the page or its styles name an http(s)/ws(s) address: external communication is not allowed.
//   absolute-path    a src/href/url() that starts at the site root, or a file: or drive path.
//   nondeterminism   Date.now, new Date, Math.random and the like in the server logic or what it imports; an
//                    action runs in client prediction and on the server, and the two would differ.
//   picture-drawn-by-code  a script of the work draws pictures with a drawing library instead of an image generator (look.mjs).
//   picture-missing  a work that ships some of the pictures its layout names lacks others (pictures.mjs).
//   orientation      manifest.orientation is not landscape or portrait; the work locks or rotates the screen
//                    itself; or the orientation it passes to startFlow()/run() differs from the manifest's.
// Warnings (a choice the author may have good reason for; never fail):
//   no-max-width     a portrait work with no max-width anywhere: a wide PC window stretches it.
//   px-fixed         sizes written in px (the screen's em is what scales).
//   layout-changed   the work's layout JSON moves a box of the guide's layout; theme-contrast  a text colour token under 4.5:1 on its surface (look.mjs).
//   font-glyph       Japanese text in the work's JSON data or source that neither bundled font subset holds: it would be
//                    drawn in a fallback font. (The listed sources of fonts.config.json are an error in the fonts test;
//                    this scan finds text that no list names. A string that is never shown can trigger it, hence a warning.)
// A line that must stay can say `uzu-check-ignore` in a comment on it or on the line above.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { FONT_FILES, fontCodePoints } from '../fonts/fonts.mjs';
import { checkLook } from './look.mjs';
import { checkPictures } from './pictures.mjs';

const CODE = new Set(['.ts', '.js', '.mjs', '.svelte']);
const STYLE = new Set(['.css', '.svelte', '.html']);
const SOURCE = new Set(['.ts', '.js', '.mjs', '.svelte', '.css', '.html']);
const NAME_OK = /^[A-Za-z0-9_.-]+$/;

const walk = (dir) =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

/** The text with comments blanked out (line count kept), so a note about Math.random is not a use of it. */
const blank = (s, ext) => {
  const keep = (m) => m.replace(/[^\n]/g, ' ');
  let t = s.replace(/\/\*[\s\S]*?\*\//g, keep);
  if (ext !== '.css') t = t.replace(/(^|[^:\\])\/\/[^\n]*/g, (m, p) => p + keep(m.slice(p.length)));
  if (ext === '.svelte' || ext === '.html') t = t.replace(/<!--[\s\S]*?-->/g, keep);
  return t;
};

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Matches of `re` in `text` as {line}, minus lines (or their next line) that say uzu-check-ignore in the original. */
const hits = (raw, text, re) => {
  const rawLines = raw.split('\n');
  const out = [];
  for (const m of text.matchAll(re)) {
    const line = lineOf(text, m.index);
    if (/uzu-check-ignore/.test(rawLines[line - 1] ?? '') || /uzu-check-ignore/.test(rawLines[line - 2] ?? '')) continue;
    out.push({ line, match: m[0] });
  }
  return out;
};

/** The server logic file and the work's own files it imports, relatively. */
const logicGraph = (dir, entry) => {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    const src = blank(readFileSync(file, 'utf8'), extname(file));
    for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const base = resolve(dirname(file), m[1]);
      const found = ['', '.ts', '.js', '.mjs', '/index.ts', '/index.js'].map((x) => base + x).find((f) => existsSync(f) && statSync(f).isFile());
      if (found) visit(found);
    }
  };
  visit(entry);
  return [...seen];
};

const JAPANESE = /[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]/u;
const stringsIn = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(stringsIn) : []);

/** Japanese characters (kana, kanji, full-width marks) of `text` that no bundled font subset holds. */
const unfont = (text, have, skip) => [...new Set([...text].filter((c) => JAPANESE.test(c) && !skip.has(c) && !have.has(c.codePointAt(0))))];

/**
 * @param {string} dir The work's folder (where manifest.json is).
 * @returns {{ errors: Finding[], warnings: Finding[] }}
 */
export function checkWork(dir) {
  dir = resolve(dir);
  const errors = [];
  const warnings = [];
  const add = (list, rule, file, line, message) => list.push({ rule, file: relative(dir, file) || '.', line, message });
  const manifestFile = join(dir, 'manifest.json');
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
  const indexFile = join(dir, 'index.html');
  const srcFiles = [...(existsSync(indexFile) ? [indexFile] : []), ...walk(join(dir, 'src'))].filter((f) => SOURCE.has(extname(f)));
  const texts = new Map(srcFiles.map((f) => [f, readFileSync(f, 'utf8')]));
  const stripped = new Map([...texts].map(([f, t]) => [f, blank(t, extname(f))]));
  const all = [...stripped.values()].join('\n');

  // first-frame
  if (!/\b(firstFrameReady|startFlow|startReader)\s*\(/.test(all))
    add(errors, 'first-frame', dir, 0, 'firstFrameReady() is never called, so the splash screen stays up. Call it once the first frame is drawn (startFlow() and startReader() do).');

  // file-name
  for (const f of [...walk(join(dir, 'public')), ...walk(join(dir, 'src'))])
    for (const seg of relative(dir, f).split(/[\\/]/).slice(1))
      if (!NAME_OK.test(seg)) { add(errors, 'file-name', f, 0, `"${seg}" has characters outside A-Z a-z 0-9 _ - . (certification).`); break; }

  for (const [f, raw] of texts) {
    const text = stripped.get(f);
    const ext = extname(f);
    // external-url (a namespace such as the SVG one is an identifier, not a request)
    for (const h of hits(raw, text, /\b(?:https?|wss?):\/\/(?!www\.w3\.org\/)[^\s'"`)>]+/g))
      add(errors, 'external-url', f, h.line, `${h.match} is an outside address; the work may not talk to the network (certification).`);
    // absolute-path
    for (const h of hits(raw, text, /\b(?:src|href|poster)\s*=\s*["']\/(?!\/)|url\(\s*["']?\/(?!\/)|["']file:\/\/|["'][A-Za-z]:\\/g))
      add(errors, 'absolute-path', f, h.line, `${h.match.trim()} starts at the site root or the disk; only relative paths are allowed (certification).`);
    // orientation lock / rotation
    if (CODE.has(ext))
      for (const h of hits(raw, text, /\bscreen\.orientation\.lock\s*\(|\blockOrientation\s*\(/g))
        add(errors, 'orientation', f, h.line, 'The work must not lock the device orientation; manifest.orientation does it.');
    if (STYLE.has(ext))
      for (const h of hits(raw, text, /(?:^|[}\s,])(?:html|body|:root)\s*\{[^}]*\brotate\(\s*-?(?:90|270)deg/g))
        add(errors, 'orientation', f, h.line, 'The work must not rotate the screen with CSS; keep the manifest orientation\'s ratio and leave margins.');
    // px-fixed (a warning per file)
    if (STYLE.has(ext)) {
      const px = hits(raw, text, /(?:font-size|width|height|padding|gap|top|left|right|bottom|line-height)\s*:\s*[^;{}]*\b(?:[2-9]|\d{2,})(?:\.\d+)?px/g);
      if (px.length) add(warnings, 'px-fixed', f, px[0].line, `${px.length} size(s) written in px (first: ${px[0].match.trim()}); em, based on the short side, scales with the screen.`);
    }
  }

  // orientation: the manifest, and what the work passes to the SDK
  const orientation = manifest.orientation;
  if (orientation !== undefined && orientation !== 'landscape' && orientation !== 'portrait') add(errors, 'orientation', manifestFile, 0, `manifest orientation "${orientation}" is not landscape or portrait.`);
  for (const [f, text] of stripped)
    for (const m of text.matchAll(/\borientation\s*:\s*['"](landscape|portrait)['"]|\bstartReader\([^)]*,\s*['"](landscape|portrait)['"]\s*\)/g))
      if ((orientation === 'landscape' || orientation === 'portrait') && (m[1] ?? m[2]) !== orientation) add(errors, 'orientation', f, lineOf(text, m.index), `passes orientation "${m[1] ?? m[2]}" but manifest.json says "${orientation}".`);
  if (orientation === 'portrait' && ![...stripped].some(([f, t]) => STYLE.has(extname(f)) && /max-width/.test(t)))
    add(warnings, 'no-max-width', dir, 0, 'A portrait work is opened in a wide window on a PC; cap the width (max-width) and centre it.');

  // nondeterminism, in the server logic and what it imports
  const entry = manifest.serverActionLogicPath ? resolve(dir, manifest.serverActionLogicPath) : null;
  if (entry)
    for (const f of logicGraph(dir, entry)) {
      const raw = readFileSync(f, 'utf8');
      for (const h of hits(raw, blank(raw, extname(f)), /\bDate\.now\s*\(|\bnew\s+Date\b|\bperformance\.now\s*\(|\bMath\.random\s*\(|\bcrypto\.(?:getRandomValues|randomUUID)\s*\(/g))
        add(errors, 'nondeterminism', f, h.line, `${h.match.replace(/\s*\($/, '')} in server logic: an action runs in prediction and on the server and would differ. Use the action's time, or a serverAction's random.`);
    }

  // pictures: the set the layout names, once the work ships any of it (pictures.mjs)
  for (const [list, rule, message] of checkPictures(dir, manifest)) add(list === 'errors' ? errors : warnings, rule, join(dir, 'public', 'assets'), 0, message);

  // look: pictures drawn by code, a layout moved from the guide's, text colours too close to their surface (look.mjs)
  for (const [list, rule, message, file] of checkLook(dir)) add(list === 'errors' ? errors : warnings, rule, join(dir, file), 0, message);

  // font-glyph: against the subsets the work's fonts.config.json builds
  const fontConfig = join(dir, 'fonts.config.json');
  if (existsSync(fontConfig)) {
    const config = JSON.parse(readFileSync(fontConfig, 'utf8'));
    const out = resolve(dir, config.out ?? 'src/fonts');
    const files = [...FONT_FILES.story, ...FONT_FILES.ui].map((n) => join(out, n)).filter(existsSync);
    if (files.length) {
      const have = new Set(files.flatMap((f) => [...fontCodePoints(f)]));
      const skip = new Set([...(config.ignore ?? '')]);
      const data = [...walk(join(dir, 'script')), ...walk(join(dir, 'src'))].filter((f) => extname(f) === '.json');
      for (const f of data) {
        const lost = unfont(stringsIn(JSON.parse(readFileSync(f, 'utf8'))).join(''), have, skip);
        if (lost.length) add(warnings, 'font-glyph', f, 0, `${lost.length} character(s) in no font subset, drawn in a fallback font: ${lost.slice(0, 20).join('')}. List the file in fonts.config.json and run npm run fonts.`);
      }
      for (const [f, text] of stripped) {
        const lost = unfont(text, have, skip);
        if (lost.length) add(warnings, 'font-glyph', f, 0, `${lost.length} character(s) in no font subset, drawn in a fallback font: ${lost.slice(0, 20).join('')}.`);
      }
    }
  }

  return { errors, warnings };
}

export const format = ({ rule, file, line, message }) => `${rule}  ${file}${line ? `:${line}` : ''}  ${message}`;

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const dir = process.argv[2];
  if (!dir) throw new Error('usage: node tools/check/static.mjs <work folder>');
  const { errors, warnings } = checkWork(dir);
  for (const w of warnings) console.log(`warning  ${format(w)}`);
  for (const e of errors) console.log(`ERROR    ${format(e)}`);
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}

// Checks that a work's screens go through the toolkit's parts and the work's tokens (docs/design.md: Look, Type).
//   raw-colour   (error)    a colour written as a value in a style (#hex, rgb(), hsl(), oklch(), a colour name ...) outside the
//                           work's theme file and outside a custom property (`--name: #hex` is a token being made).
//   raw-font     (error)    a typeface written in a style (font-family, font) that does not come from a variable
//                           (`var(--font-ui)`); @font-face and the work's fonts.css are where typefaces are named.
//   bare-button  (warning)  a plain <button> in a work's screen instead of the toolkit's Button. A card in a hand or a square
//                           of a board is a button the toolkit has no part for, so this only warns.
// A line that must stay says `uzu-check-ignore` in a comment on it or on the line above.
// Reads source only: check(dir, ctx) returns [list, rule, message, file, line, fix] (docs/qa-contract.md, 2).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const SOURCE = new Set(['.svelte', '.css', '.html', '.ts', '.js', '.mjs']);
const STYLED = new Set(['.svelte', '.css', '.html']);
const COLOUR_PROP = /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-[a-z]+)?)?(?:-color)?|outline(?:-color)?|box-shadow|text-shadow|text-decoration(?:-color)?|caret-color|accent-color|fill|stroke|stop-color|flood-color|column-rule(?:-color)?|filter|drop-shadow|mask-image)$/;
const NAMES = new Set(
  ('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '),
);
const FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
const HEX = /(?<![\w&-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/i;
const GENERIC = /\b(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|emoji|math|fangsong)\b/i;

const walk = (dir) =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

/** Comments blanked out, line count kept. */
const blank = (s, ext) => {
  const keep = (m) => m.replace(/[^\n]/g, ' ');
  let t = s.replace(/\/\*[\s\S]*?\*\//g, keep);
  if (ext !== '.css') t = t.replace(/(^|[^:\\])\/\/[^\n]*/g, (m, p) => p + keep(m.slice(p.length)));
  if (STYLED.has(ext)) t = t.replace(/<!--[\s\S]*?-->/g, keep);
  return t;
};

/** `var( ... )` with its contents (the fallback is the token's own business) removed, nesting handled. */
const withoutVar = (v) => {
  let out = '';
  for (let i = 0; i < v.length; ) {
    if (/^var\(/i.test(v.slice(i))) {
      let depth = 0;
      let j = i + 3;
      do {
        if (v[j] === '(') depth++;
        if (v[j] === ')') depth--;
        j++;
      } while (j < v.length && depth > 0);
      out += ' ';
      i = j;
    } else out += v[i++];
  }
  return out;
};

/** The pieces of `text` that are styles: <style> blocks, style="..." and style:prop attributes, and a whole .css file. */
function styleRegions(text, ext) {
  if (ext === '.css') return [{ at: 0, css: text, fontFace: false }];
  const out = [];
  for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) out.push({ at: m.index + m[0].indexOf(m[1]), css: m[1] });
  for (const m of text.matchAll(/\bstyle\s*=\s*"([^"]*)"|\bstyle\s*=\s*'([^']*)'/g)) out.push({ at: m.index + m[0].indexOf(m[1] ?? m[2]), css: m[1] ?? m[2], inline: true });
  for (const m of text.matchAll(/\bstyle:([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) out.push({ at: m.index, css: `${m[1]}:${m[2] ?? m[3]}`, inline: true });
  return out;
}

/** Declarations of a style region as {prop, value, at}; `at` is the offset into the file. @font-face blocks are left out. */
function declarations({ at, css, inline }) {
  const decls = [];
  let rest = css;
  if (!inline) {
    // Blank @font-face bodies (the typeface is named there), same length so offsets hold.
    rest = css.replace(/@font-face\s*\{[^}]*\}/gi, (m) => m.replace(/[^\n]/g, ' '));
  }
  for (const m of rest.matchAll(/(?:^|[;{}\s])([a-z-]+|--[\w-]+)\s*:\s*([^;{}]+)/gi)) {
    // A selector such as `a:hover` has no value part that ends the rule; `{` was required before it in `m`, so skip those followed by `{`.
    const after = rest.slice(m.index + m[0].length, m.index + m[0].length + 1);
    if (after === '{') continue;
    decls.push({ prop: m[1].toLowerCase(), value: m[2], at: at + m.index + m[0].indexOf(m[2]) });
  }
  return decls;
}

/** The first raw colour in a value of `prop`, or ''. */
function rawColour(prop, value) {
  if (prop.startsWith('--')) return '';
  if (!COLOUR_PROP.test(prop)) return '';
  const v = withoutVar(value).replace(/url\([^)]*\)/gi, ' ');
  const hex = HEX.exec(v);
  if (hex) return hex[0];
  const fn = FUNCTION.exec(v);
  if (fn) return fn[0].replace(/\s*\($/, '(');
  for (const w of v.toLowerCase().match(/[a-z]+/g) ?? []) if (NAMES.has(w)) return w;
  return '';
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** True for the work's theme file, where its colour tokens are defined. */
const isTheme = (rel) => /(^|\/)theme[^/]*\.css$/i.test(rel);

/**
 * @param {string} dir The work's folder.
 * @param {{ manifest?: object, sources?: Map<string, string> }} [ctx] sources: file (absolute or relative to dir) -> text.
 * @returns {Array<['errors'|'warnings', string, string, string?, number?, string?]>}
 */
export function check(dir, ctx = {}) {
  dir = resolve(dir);
  const files = new Map();
  if (ctx.sources) for (const [f, t] of ctx.sources) files.set(relative(dir, resolve(dir, f)).split('\\').join('/'), t);
  else {
    const list = [join(dir, 'index.html'), ...walk(join(dir, 'src'))].filter((f) => existsSync(f));
    for (const f of list) files.set(relative(dir, f).split('\\').join('/'), readFileSync(f, 'utf8'));
  }
  const out = [];
  for (const [rel, raw] of files) {
    const ext = extname(rel);
    if (!SOURCE.has(ext) || rel.startsWith('toolkit/') || rel.includes('node_modules/')) continue;
    const text = blank(raw, ext);
    const rawLines = raw.split('\n');
    const ignored = (line) => /uzu-check-ignore/.test(rawLines[line - 1] ?? '') || /uzu-check-ignore/.test(rawLines[line - 2] ?? '');
    const add = (list, rule, line, message, fix) => !ignored(line) && out.push([list, rule, message, rel, line, fix]);

    if (STYLED.has(ext)) {
      const theme = isTheme(rel);
      const fontsFile = /(^|\/)fonts\.css$/i.test(rel);
      for (const region of styleRegions(text, ext))
        for (const { prop, value, at } of declarations(region)) {
          const line = lineOf(text, at);
          if (!theme) {
            const found = rawColour(prop, value);
            if (found)
              add('errors', 'raw-colour', line, `${prop}: ${found} is a colour written in the screen; every colour is a token (docs/design.md, Limits on decoration).`,
                `Make "${found}" a custom property in src/theme.css (a colour only this screen uses is a token there too) and write var(--...) here.`);
          }
          if (!fontsFile && (prop === 'font-family' || prop === 'font')) {
            const v = withoutVar(value);
            const has = /["']/.test(v) || GENERIC.test(v) || (prop === 'font-family' && /[a-z]/i.test(v.replace(/\b(?:inherit|initial|unset|revert)\b/gi, '')));
            if (has && !/^\s*(?:inherit|initial|unset|revert)\s*$/i.test(v))
              add('errors', 'raw-font', line, `${prop}: ${value.trim()} names a typeface in the screen; type is --font-body for story text and --font-ui for UI text (docs/design.md, Type).`,
                'Write font-family: var(--font-ui) (or var(--font-body) for story text); a typeface of the work is set in its theme.css and fonts.css.');
          }
        }
      // presentation attributes: fill="#fff" stroke="red"
      if (ext !== '.css' && !isTheme(rel))
        for (const m of text.matchAll(/\b(fill|stroke|stop-color|flood-color|color)\s*=\s*"([^"{]*)"|\b(fill|stroke|stop-color|flood-color|color)\s*=\s*'([^'{]*)'/g)) {
          const prop = (m[1] ?? m[3]).toLowerCase();
          const found = rawColour(prop, m[2] ?? m[4]);
          if (found)
            add('errors', 'raw-colour', lineOf(text, m.index), `${prop}="${found}" is a colour written in the screen; every colour is a token.`, `Use a token: ${prop}="currentColor", or style="${prop}: var(--...)" with the colour made in src/theme.css.`);
        }
    } else if (!isTheme(rel)) {
      // a script: a quoted colour on a line that is about drawing (canvas fillStyle, a style string)
      const scriptLines = text.split('\n');
      scriptLines.forEach((l, i) => {
        if (!/(?:fill|stroke|shadow|colou?r|background|Style)/i.test(l)) return;
        const m = /["'`](#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4}))["'`]|["'`][^"'`]*\b(?:rgba?|hsla?|oklch)\s*\(/i.exec(l);
        if (m) add('errors', 'raw-colour', i + 1, `${m[0].trim()} is a colour written in a script; every colour is a token.`, 'Read the token (getComputedStyle(...).getPropertyValue("--...")) or set a class and let the CSS use var(--...).');
      });
    }

    // bare-button: one warning per file, at the first
    if (ext === '.svelte') {
      const found = [...text.matchAll(/<button\b/g)].filter((m) => !ignored(lineOf(text, m.index)));
      if (found.length)
        out.push([
          'warnings',
          'bare-button',
          `${found.length} plain <button>${found.length > 1 ? 's' : ''} (first at line ${lineOf(text, found[0].index)}); a screen's actions are the toolkit's Button, so size, capsule, the grey of a button that cannot be tapped and the 16px floor stay the same everywhere.`,
          rel,
          lineOf(text, found[0].index),
          'Use <Button> from @uzu-toolkit/reader for a main or secondary action; a plain button is fine for a card in a hand or a square on a board (say uzu-check-ignore on it).',
        ]);
    }
  }
  return out;
}

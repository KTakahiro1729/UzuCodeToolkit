// Glyph lists for the bundled font subsets, collected from a project's own files, and a check
// that the subsets built from them still hold every glyph. See "Fonts" in CLAUDE.md.
//
// A project (a sample, or a work that uses the toolkit) has a `fonts.config.json` in its root:
//
//   {
//     "out": "src/fonts",
//     "story": [{ "file": "script/script.json", "paths": ["title", "lines[*].text"] }],
//     "ui":    [{ "file": "../../packages/reader/src/strings.json", "keys": ["button.next"] },
//               { "chars": "0123456789" }]
//   }
//
// `story` is set in Shippori Mincho and `ui` in BIZ UDPGothic. A source entry names a JSON `file`
// (relative to the project root; a `*` stands for any folder or file name), and takes either
// `paths` (`a.b[*].c`; `*` or `[*]` walks every item of an array or object; the strings under the
// end of a path all count) or `keys` (top-level keys of a flat object, for keys that hold dots).
// With neither, every string in the file counts. An entry can also hold literal `chars`.
// A path that matches no string is an error: a renamed field must not quietly shrink the lists.
// `ignore` (optional) lists characters the check skips: marks the page never draws (the ruby bar ｜).
//
// CLI (used by scripts/subset-fonts.sh):  node fonts.mjs collect <projectDir> <outDir>
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

export const FONT_FILES = {
  story: ['ShipporiMincho-Regular.subset.woff2'],
  ui: ['BIZUDPGothic-Regular.subset.woff2', 'BIZUDPGothic-Bold.subset.woff2'],
};

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

const strings = (v) =>
  typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

/** Expand `*` in a path's segments to the files and folders that exist. */
function expand(root, rel) {
  let found = [isAbsolute(rel) ? '/' : root];
  for (const seg of rel.split('/').filter(Boolean)) {
    found = found.flatMap((base) => {
      if (!seg.includes('*')) return [join(base, seg)];
      const re = new RegExp(`^${seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
      return existsSync(base) ? readdirSync(base).filter((n) => re.test(n)).map((n) => join(base, n)) : [];
    });
  }
  return found.filter((f) => existsSync(f));
}

/** The strings a path reaches in a JSON value. */
function pick(value, path) {
  let nodes = [value];
  for (const seg of path.replace(/\[\*\]/g, '.*').split('.').filter(Boolean)) {
    nodes = nodes.flatMap((n) => {
      if (n === null || typeof n !== 'object') return [];
      if (seg === '*') return Object.values(n);
      return seg in n ? [n[seg]] : [];
    });
  }
  return nodes.flatMap(strings);
}

function collectEntry(root, entry) {
  const parts = [];
  if (entry.chars) parts.push(entry.chars);
  if (entry.file) {
    const files = expand(root, entry.file);
    if (files.length === 0) throw new Error(`fonts.config.json: no file matches ${entry.file}`);
    for (const f of files) {
      const json = readJson(f);
      if (entry.keys) {
        for (const k of entry.keys) {
          if (typeof json[k] !== 'string') throw new Error(`fonts.config.json: ${entry.file} has no string at key ${k}`);
          parts.push(json[k]);
        }
      } else if (entry.paths) {
        for (const p of entry.paths) {
          const got = pick(json, p);
          if (got.length === 0) throw new Error(`fonts.config.json: path ${p} matches no string in ${f}`);
          parts.push(...got);
        }
      } else {
        parts.push(...strings(json));
      }
    }
  }
  return parts;
}

/** Distinct characters, sorted, without control characters (spaces stay: they are drawn). */
const chars = (parts) =>
  [...new Set([...parts.join('')].filter((c) => !/\p{Cc}/u.test(c)))].sort().join('');

/** The characters each font needs: `{ story, ui }`, as strings. */
export function collectGlyphs(projectDir) {
  const root = resolve(projectDir);
  const config = readJson(join(root, 'fonts.config.json'));
  return {
    story: chars((config.story ?? []).flatMap((e) => collectEntry(root, e))),
    ui: chars((config.ui ?? []).flatMap((e) => collectEntry(root, e))),
    ignore: config.ignore ?? '',
    out: resolve(root, config.out ?? 'src/fonts'),
  };
}

// --- reading the character map of a woff2 file ---

function readCmap(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a woff2 file');
  const numTables = buf.readUInt16BE(12);
  const compressedSize = buf.readUInt32BE(20);
  let p = 48;
  const base128 = () => {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const b = buf[p++];
      v = v * 128 + (b & 0x7f);
      if (!(b & 0x80)) return v;
    }
    throw new Error('bad UIntBase128');
  };
  let streamOffset = 0;
  let cmap;
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++];
    const tagIndex = flags & 0x3f;
    const version = flags >> 6;
    let tag;
    if (tagIndex === 63) { tag = buf.toString('latin1', p, p + 4); p += 4; }
    else if (tagIndex === 0) tag = 'cmap';
    const origLength = base128();
    // glyf (10) and loca (11) are transformed unless the version is 3; hmtx (3) when it is 1.
    const transformed = tagIndex === 10 || tagIndex === 11 ? version !== 3 : tagIndex === 3 && version !== 0;
    const length = transformed ? base128() : origLength;
    if (tag === 'cmap') cmap = { offset: streamOffset, length };
    streamOffset += length;
  }
  if (!cmap) throw new Error('no cmap table');
  const stream = brotliDecompressSync(buf.subarray(p, p + compressedSize));
  return stream.subarray(cmap.offset, cmap.offset + cmap.length);
}

/** The code points a woff2 font has a glyph for. */
export function fontCodePoints(file) {
  const t = readCmap(readFileSync(file));
  const covered = new Set();
  const count = t.readUInt16BE(2);
  for (let i = 0; i < count; i++) {
    const offset = t.readUInt32BE(4 + i * 8 + 4);
    const format = t.readUInt16BE(offset);
    if (format === 12) {
      const groups = t.readUInt32BE(offset + 12);
      for (let g = 0; g < groups; g++) {
        const at = offset + 16 + g * 12;
        const [start, end, glyph] = [t.readUInt32BE(at), t.readUInt32BE(at + 4), t.readUInt32BE(at + 8)];
        for (let c = start; c <= end; c++) if (glyph + (c - start) !== 0) covered.add(c);
      }
    } else if (format === 4) {
      const segs = t.readUInt16BE(offset + 6) / 2;
      const end = offset + 14;
      const start = end + segs * 2 + 2;
      const delta = start + segs * 2;
      const range = delta + segs * 2;
      for (let s = 0; s < segs; s++) {
        const [e, b, d, r] = [t.readUInt16BE(end + s * 2), t.readUInt16BE(start + s * 2), t.readUInt16BE(delta + s * 2), t.readUInt16BE(range + s * 2)];
        for (let c = b; c <= e && c < 0xffff; c++) {
          const glyph = r === 0 ? (c + d) & 0xffff : t.readUInt16BE(range + s * 2 + r + (c - b) * 2);
          if (glyph !== 0) covered.add(c);
        }
      }
    }
  }
  return covered;
}

/**
 * The characters a project needs that its font subsets lack, as `{ story: [...], ui: [...] }`
 * (each the characters missing from the least complete font of that kind).
 */
export function missingGlyphs(projectDir) {
  const { story, ui, ignore, out } = collectGlyphs(projectDir);
  const skip = new Set([...ignore]);
  const result = {};
  for (const [kind, text] of [['story', story], ['ui', ui]]) {
    const missing = new Set();
    for (const name of FONT_FILES[kind]) {
      const file = join(out, name);
      if (!existsSync(file)) throw new Error(`font subset missing: ${file}. Run npm run fonts.`);
      const have = fontCodePoints(file);
      for (const c of text) if (!skip.has(c) && !have.has(c.codePointAt(0))) missing.add(c);
    }
    result[kind] = [...missing].sort();
  }
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, projectDir, outDir] = process.argv.slice(2);
  if (cmd !== 'collect' || !projectDir || !outDir) {
    console.error('usage: node fonts.mjs collect <projectDir> <outDir>');
    process.exit(2);
  }
  const g = collectGlyphs(projectDir);
  writeFileSync(join(outDir, 'story.txt'), g.story);
  writeFileSync(join(outDir, 'ui.txt'), g.ui);
  writeFileSync(join(outDir, 'out.txt'), g.out);
}

// Rebuilds the deck with a large corner index (docs/design.md, Type: no text below 16px).
// Run on Kennard's SVGs as optimised by SVGO (one decimal place), from a folder of the same
// file names, with the joker's `2J.svg` as `joker.svg`:
//   node enlarge-index.mjs <source folder> <output folder>
// Each face gets its rank (a quarter of the card's width tall) and suit side by side in the top-left
// corner, and again turned round in the bottom-right, both within the card's left half so they show
// on a fanned hand. What the face held between the corners shrinks to fit between the two rows.
// Red becomes #c62828 (5.6:1 on white, WCAG AA). The back and the joker keep their art.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [from, to] = process.argv.slice(2);
if (!from || !to) throw new Error('usage: node enlarge-index.mjs <source folder> <output folder>');

const RED = '#c62828';
// Kennard's corner: the rank symbol 32 high, the suit 26.8 high under it.
const RANK = /<use xlink:href="#(\w+)" height="32" x="-114.4" y="-156"\/>/;
const SUIT = /<use xlink:href="#(\w+)" height="26.8" x="-111.8" y="-119"\/>/;
// The rank's symbol is 1000 units square and its strokes fill the height; the suit's is 1200
// square with the pip about 1000 of it. The card is 240 by 336, centred on 0.
const rank = (id) => `<use xlink:href="#${id}" height="60" x="-124" y="-160"/>`;
const suit = (id) => `<use xlink:href="#${id}" height="42" x="-72" y="-151"/>`;
// The corner rows end 100 units below the top edge; the rest of the face must stay inside this.
const FREE = 96;

/** How far the face's other parts reach up or down from the centre, from their y and height. */
function reach(uses) {
  let r = 0;
  for (const u of uses) {
    const y = Number(u.match(/ y="([-\d.]+)"/)?.[1] ?? 0);
    const h = Number(u.match(/ height="([-\d.]+)"/)?.[1] ?? 0);
    r = Math.max(r, Math.abs(y), Math.abs(y + h));
  }
  return r;
}

/** The corner with the large index, then the rest scaled down to fit between the rows. */
function corner(uses, scale) {
  const out = [];
  const rest = [];
  for (const u of uses) {
    const r = u.match(RANK);
    const s = u.match(SUIT);
    if (r) out.push(rank(r[1]));
    else if (s) out.push(suit(s[1]));
    else rest.push(u);
  }
  if (rest.length) out.push(scale < 1 ? `<g transform="scale(${scale})">${rest.join('')}</g>` : rest.join(''));
  return out.join('');
}

for (const name of readdirSync(from).filter((n) => n.endsWith('.svg'))) {
  let svg = readFileSync(join(from, name), 'utf8')
    .replace(/<metadata>.*?<\/metadata>/s, '')
    .replace(/ xmlns:c2pa="[^"]*"/, '');
  if (RANK.test(svg)) {
    const at = svg.indexOf('/>', svg.indexOf('<rect')) + 2;
    const head = svg.slice(0, at);
    const body = svg.slice(at, svg.lastIndexOf('</svg>'));
    const turned = body.match(/<g transform="rotate\(180\)">(.*?)<\/g>/s);
    const top = (turned ? body.replace(turned[0], '') : body).match(/<use[^>]*\/>/g) ?? [];
    const bottom = turned ? (turned[1].match(/<use[^>]*\/>/g) ?? []) : [];
    const others = [...top, ...bottom].filter((u) => !RANK.test(u) && !SUIT.test(u));
    const scale = Math.min(1, Math.round((FREE / reach(others)) * 1000) / 1000);
    svg = `${head}${corner(top, scale)}${bottom.length ? `<g transform="rotate(180)">${corner(bottom, scale)}</g>` : ''}</svg>`;
  }
  // Kennard outlines the court figure's panel in blue; at this size it reads as a stray frame.
  svg = svg.replace(/<defs><path id="i"[^>]*\/><\/defs>/, '').replace(/<use xlink:href="#i"[^>]*\/>/, '');
  writeFileSync(join(to, name), svg.replaceAll('"red"', `"${RED}"`));
}

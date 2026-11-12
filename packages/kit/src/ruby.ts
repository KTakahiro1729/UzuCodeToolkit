/**
 * Ruby in Aozora Bunko notation: `漢字《かんじ》`, or `｜base《ruby》` where the base is not
 * only kanji (｜ marks where the base starts).
 */

export type RubySegment = { text: string; ruby?: undefined } | { text: string; ruby: string };

// Without ｜, the base is the run of kanji (and 々〆ヵヶ) right before 《.
const RUBY = /｜([^｜《]+)《([^》]+)》|([\p{Script=Han}々〆ヵヶ]+)《([^》]+)》/gu;

/** Split text into plain runs and ruby pairs, dropping the notation marks. */
export function parseRuby(text: string): RubySegment[] {
  const out: RubySegment[] = [];
  let at = 0;
  for (const m of text.matchAll(RUBY)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    out.push({ text: m[1] ?? m[3], ruby: m[2] ?? m[4] });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

/** The text as shown, without ruby (for alt text and measuring). */
export function plainText(text: string): string {
  return parseRuby(text)
    .map((s) => s.text)
    .join('');
}

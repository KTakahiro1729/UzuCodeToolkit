/**
 * Test helper for scripts converted from Aozora Bunko text files: rebuilds the body lines
 * from script.json and pairs them with the body of original.txt (the Aozora file as UTF-8),
 * so a test can check the wording was not changed. Used by the samples' tests only.
 */

interface Line {
  speaker: string | string[];
  text: string;
  label?: string;
  scene?: string;
  cont?: boolean;
}
interface Script {
  cast: { id: string; label: string; direction?: boolean }[];
  lines: Line[];
  end?: string;
}

/** Characters Aozora writes as a note, stored as the character itself in script.json. */
const GAIJI: Record<string, string> = { '⁉': '※［＃疑問符感嘆符、1-8-77］' };

export function checkAgainstAozora(script: Script, original: string): { expected: string[]; rebuilt: string[] } {
  const all = original.split('\n');
  const start = all.findIndex((l, i) => i > 0 && l.startsWith('-----') && all.slice(0, i).some((p) => p.startsWith('-----'))) + 1;
  const end = all.findIndex((l) => l.startsWith('底本：'));
  // Indentation notes only lay out the page; headings and the closing date stay.
  const expected = all.slice(start, end).filter((l) => l.trim() !== '' && !/^［＃(ここから|ここで)/.test(l));

  const cast = new Map(script.cast.map((c) => [c.id, c]));
  const label = (l: Line) =>
    l.label ?? (Array.isArray(l.speaker) ? l.speaker : [l.speaker]).map((id) => cast.get(id)!.label).join('と');
  const restore = (s: string) => s.replace(/⁉/g, GAIJI['⁉']);
  const rebuilt: string[] = [];
  for (const l of script.lines) {
    if (l.scene) rebuilt.push(`［＃８字下げ］${l.scene}［＃「${l.scene}」は中見出し］`);
    const plain = l.cont || cast.get(l.speaker as string)?.direction;
    rebuilt.push(restore(plain ? l.text : `${label(l)}　${l.text}`));
  }
  if (script.end) rebuilt.push(`［＃地から１字上げ］${script.end}`);
  return { expected, rebuilt };
}

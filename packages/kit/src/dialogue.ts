/**
 * Read-through: players read the script aloud one line at a time, and the reader of
 * each line advances it themselves.
 *
 * Mutating functions change the given progress in place, so they can be called directly
 * from SDK action handlers (which mutate live state). Rejected operations throw.
 */

export interface DialogueLine {
  /** Role ID of the speaker, or several for a line spoken together; the first reads it. */
  speaker: string | readonly string[];
  text: string;
}

/** Progress kept in shared state. */
export interface DialogueProgress {
  /** Line currently being read. */
  index: number;
  /** True once the last line has been advanced. */
  finished: boolean;
}

export function startDialogue(): DialogueProgress {
  return { index: 0, finished: false };
}

/** The speakers of a line, in order. */
export function speakersOf(line: DialogueLine): readonly string[] {
  return typeof line.speaker === 'string' ? [line.speaker] : line.speaker;
}

/** The role that reads a line aloud and advances it: its first speaker. */
export function readerOf(line: DialogueLine): string {
  return speakersOf(line)[0];
}

/** The current line, or null when finished. */
export function currentLine<L extends DialogueLine>(lines: readonly L[], p: DialogueProgress): L | null {
  return p.finished ? null : (lines[p.index] ?? null);
}

/**
 * Advance to the next line. Only a player holding the current line's reader may advance.
 * `roles` are the roles the player holds. `seenIndex` is the line the player was looking at;
 * it stops a late duplicate tap from advancing two lines.
 */
export function advanceDialogue(
  lines: readonly DialogueLine[],
  p: DialogueProgress,
  roles: readonly string[],
  seenIndex: number,
): void {
  const line = currentLine(lines, p);
  if (!line) throw new Error('dialogue already finished');
  if (seenIndex !== p.index) throw new Error('line already advanced');
  if (!roles.includes(readerOf(line))) throw new Error('only the reader can advance this line');
  if (p.index + 1 < lines.length) p.index += 1;
  else p.finished = true;
}

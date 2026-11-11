/**
 * Read-through: players read the script aloud one line at a time, and the speaker of
 * each line advances it themselves.
 *
 * Mutating functions change the given progress in place, so they can be called directly
 * from SDK action handlers (which mutate live state). Rejected operations throw.
 */

export interface DialogueLine {
  /** Role ID of the reader. */
  speaker: string;
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

/** The current line, or null when finished. */
export function currentLine(lines: readonly DialogueLine[], p: DialogueProgress): DialogueLine | null {
  return p.finished ? null : (lines[p.index] ?? null);
}

/**
 * Advance to the next line. Only the current line's speaker may advance.
 * `seenIndex` is the line the player was looking at; it stops a late duplicate tap
 * from advancing two lines.
 */
export function advanceDialogue(
  lines: readonly DialogueLine[],
  p: DialogueProgress,
  roleId: string | undefined,
  seenIndex: number,
): void {
  const line = currentLine(lines, p);
  if (!line) throw new Error('dialogue already finished');
  if (seenIndex !== p.index) throw new Error('line already advanced');
  if (line.speaker !== roleId) throw new Error('only the speaker can advance this line');
  if (p.index + 1 < lines.length) p.index += 1;
  else p.finished = true;
}

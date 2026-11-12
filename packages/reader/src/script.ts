/**
 * The script format (each sample's script/script.json) and what the screens derive from it.
 */

import { type DialogueLine, type Part, partsOf, readerOf, speakersOf } from '@uzu-toolkit/kit';

export interface CastMember {
  id: string;
  label: string;
  description?: string;
  /** Stage directions: read aloud like a line, shown without a speaker. */
  direction?: boolean;
}

export interface Line extends DialogueLine {
  /** The name the text uses for the speaker here, when it differs from the cast label. */
  label?: string;
  /** Heading of the scene this line opens. */
  scene?: string;
  /** Continues the previous line's speech: shown without a new speaker name. */
  cont?: boolean;
}

export interface Script {
  title: string;
  author?: string;
  cast: CastMember[];
  /** What each seat plays (the manifest characters); one part per cast entry when absent. */
  parts?: (Part & { description?: string })[];
  lines: Line[];
  end?: string;
  afterword?: string;
  /** A note on the work shown above its first line, such as one on its wording. */
  notice?: string;
}

/** Lookups the screens and the logic share. */
export function scenario(script: Script) {
  const parts = partsOf(script);
  const cast = new Map(script.cast.map((c) => [c.id, c]));
  return {
    script,
    parts,
    partIds: parts.map((p) => p.id),
    /** Roles a part reads. */
    rolesOf: (partId: string | undefined): readonly string[] => parts.find((p) => p.id === partId)?.roles ?? [],
    isDirection: (line: Line): boolean => !!cast.get(readerOf(line))?.direction,
    /** The speaker name shown above a line; `and` joins the names of a line spoken together. */
    nameOf: (line: Line, and: string): string =>
      line.label ?? speakersOf(line).map((id) => cast.get(id)?.label ?? id).join(and),
  };
}

export type Scenario = ReturnType<typeof scenario>;

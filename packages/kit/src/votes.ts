/**
 * Counting votes where each voter names one seat or part (word wolf, a culprit vote). The rules
 * on top (who may vote, what a tie means) stay with the game.
 */

/** Voter -> the one they voted for. */
export type Votes = Readonly<Record<string, string>>;

/** How many votes each of `candidates` got, 0 for none. */
export function tally(votes: Votes, candidates: readonly string[]): Record<string, number> {
  const counts = Object.fromEntries(candidates.map((c) => [c, 0]));
  for (const target of Object.values(votes)) if (target in counts) counts[target]++;
  return counts;
}

/** The candidate with the most votes, or null when two or more share the most (or no votes). */
export function soleTop(votes: Votes, candidates: readonly string[]): string | null {
  const counts = tally(votes, candidates);
  const top = Math.max(0, ...Object.values(counts));
  const leaders = candidates.filter((c) => counts[c] === top);
  return top > 0 && leaders.length === 1 ? leaders[0] : null;
}

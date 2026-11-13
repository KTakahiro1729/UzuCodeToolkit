/**
 * Votes where each voter names one seat or part (word wolf, a culprit vote): a ballot to keep in
 * state, and counting. The rules on top (what a tie means, what follows) stay with the game.
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

/**
 * A vote where each voter names one candidate, kept in a game's or a phase's state. A vote can be
 * changed until the last voter has voted; then the ballot is closed.
 */
export interface Ballot {
  /** Who votes, such as the seats in play. */
  voters: string[];
  /** Whom they can vote for: seats, or parts for a culprit vote. */
  candidates: string[];
  /** Voter -> the candidate they voted for. */
  votes: Record<string, string>;
}

/** A ballot with no votes yet; the voters are the candidates unless others are given. */
export function ballot(voters: readonly string[], candidates: readonly string[] = voters): Ballot {
  return { voters: [...voters], candidates: [...candidates], votes: {} };
}

/** The voters who have not voted yet. */
export function notVoted(b: Ballot): string[] {
  return b.voters.filter((v) => !(v in b.votes));
}

/** Everyone has voted: no vote can change any more. */
export function ballotClosed(b: Ballot): boolean {
  return notVoted(b).length === 0;
}

/**
 * Record or change `voter`'s vote; throws when the ballot is closed, the voter or the candidate is
 * not on it, or a voter names themself (unless `self` allows it, as when parts are the candidates).
 */
export function castVote(b: Ballot, voter: string, target: unknown, { self = false }: { self?: boolean } = {}): void {
  if (ballotClosed(b)) throw new Error('voting is over');
  if (!b.voters.includes(voter)) throw new Error('not a voter');
  if (typeof target !== 'string' || !b.candidates.includes(target)) throw new Error('unknown candidate');
  if (!self && target === voter) throw new Error('cannot vote for yourself');
  b.votes[voter] = target;
}

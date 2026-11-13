/**
 * The people side of a phase's end: how many seats must act for the phase to move on. A work
 * keeps its own state (`done` in its `PhaseLogic`); this only turns the rule into a number, so a
 * footer can say "N more to go".
 */

/** Anyone (one seat), everyone, a majority (more than half), or one designated seat. */
export type TransitionRule = 'anyone' | 'everyone' | 'majority' | { only: string };

/** How many of `seatCount` seats must act under `rule`. */
export function needed(rule: TransitionRule, seatCount: number): number {
  if (typeof rule === 'object') return 1;
  if (rule === 'anyone') return Math.min(1, seatCount);
  if (rule === 'everyone') return seatCount;
  return Math.floor(seatCount / 2) + 1;
}

/** How many more seats must act, never below 0. */
export const stillNeeded = (rule: TransitionRule, seatCount: number, said: number): number => Math.max(0, needed(rule, seatCount) - said);

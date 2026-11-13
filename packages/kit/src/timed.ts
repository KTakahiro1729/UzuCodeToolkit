/**
 * A phase of text that runs for a time, such as a reading or a briefing: a timer shows the time
 * left, any player can pause it or ask for more, and the phase ends when the time runs out or
 * when enough players say they are done. Which players that takes is `rule` (see transition.ts):
 * everyone, anyone, one designated part, or none (the time alone ends it).
 * A work uses it for any phase it likes; nothing in the toolkit needs it.
 */

import { type GameTime, minus, plus } from '@uzuhq/code-sdk';
import { EXTENSION_MS } from './handout';
import type { PhaseLogic } from './flow';
import { needed, type TransitionRule } from './transition';

export interface TimedState {
  /** Game time the time runs out. */
  endsAt: GameTime;
  /** When the timer was paused (game time), or null while it runs. */
  pausedAt: GameTime | null;
  /** True once the time ran out (set by the server's deadline). */
  timeUp: boolean;
  /** What ends the phase besides the time; null: only the time. */
  rule: TransitionRule | null;
  /** Every seat in the game. */
  seats: string[];
  /** Seats that said they are done. */
  said: string[];
}

/** `minutes`: how long it runs. `rule`: who may end it early (default: only the time does). */
export function timedPhase({ minutes, rule = null }: { minutes: number; rule?: TransitionRule | null }): PhaseLogic<TimedState> {
  return {
    setup: (parts, time) => ({ endsAt: plus(time, minutes * 60_000), pausedAt: null, timeUp: false, rule, seats: Object.keys(parts), said: [] }),
    actions: {
      /** Pause the timer for everyone; the time left stands still until `resume`. */
      pause({ state, time }) {
        if (state.timeUp || state.pausedAt) throw new Error('cannot pause');
        state.pausedAt = time;
      },
      /** Resume a paused timer: the end moves by the time it stood still. */
      resume({ state, time }) {
        if (!state.pausedAt) throw new Error('not paused');
        state.endsAt = plus(state.endsAt, Math.max(0, minus(time, state.pausedAt)));
        state.pausedAt = null;
      },
      /** Ask for more time: everyone's timer gets EXTENSION_MS more. */
      extend({ state }) {
        if (state.timeUp) throw new Error('time is up');
        state.endsAt = plus(state.endsAt, EXTENSION_MS);
      },
      /** Say you are done, ending the phase early once the rule is met. Taken back with `undone`. */
      done({ state, playerId, part }) {
        if (!state.rule) throw new Error('only the time ends this phase');
        if (typeof state.rule === 'object' && part !== state.rule.only) throw new Error('not the one who moves on');
        if (state.said.includes(playerId)) throw new Error('already done');
        state.said.push(playerId);
      },
      undone({ state, playerId }) {
        if (!state.said.includes(playerId)) throw new Error('not done');
        state.said = state.said.filter((s) => s !== playerId);
      },
    },
    // The server ends the phase when the time runs out.
    deadline: {
      at: (state) => (state.timeUp || state.pausedAt ? null : state.endsAt),
      handler({ state }) {
        state.timeUp = true;
      },
    },
    done: (state) => state.timeUp || (state.rule !== null && state.said.length >= needed(state.rule, state.seats.length)),
  };
}

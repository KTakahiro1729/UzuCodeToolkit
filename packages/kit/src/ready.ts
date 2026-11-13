/**
 * A phase that waits until every player says they are ready, such as the introduction where each
 * player sees whom they play. `unready` takes it back; the phase ends once every seat is ready.
 */

import type { PhaseLogic } from './flow';

export interface ReadyState {
  /** Seats that are ready, in the order they said so. */
  ready: string[];
  /** Every seat in the game, to know when all are ready. */
  seats: string[];
}

export function readyPhase(): PhaseLogic<ReadyState> {
  return {
    setup: (parts) => ({ ready: [], seats: Object.keys(parts) }),
    actions: {
      ready({ state, playerId }) {
        if (state.ready.includes(playerId)) throw new Error('already ready');
        state.ready.push(playerId);
      },
      unready({ state, playerId }) {
        if (!state.ready.includes(playerId)) throw new Error('not ready');
        state.ready = state.ready.filter((s) => s !== playerId);
      },
    },
    done: (state) => state.seats.every((s) => state.ready.includes(s)),
  };
}

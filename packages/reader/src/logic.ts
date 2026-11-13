/**
 * Server-authoritative logic. A work's logic (manifest serverActionLogicPath) is flowLogic() over
 * its phases; readThroughPhase() is a read-through as one of them. readThroughLogic() is the
 * whole logic for a work that is one read-through (the samples). Actions run both in client
 * prediction and on the server, so keep them deterministic.
 */

import { advanceDialogue, type DialogueProgress, type FlowState, flowLogic, type PhaseLogic, startDialogue } from '@uzu-toolkit/kit';
import type { GameLogic } from '@uzuhq/code-sdk';
import { type Script, scenario } from './script';

/**
 * A read-through of a script as a phase. Action `advance` with `{ index }`, the line the player
 * was looking at, which stops a late duplicate tap from advancing two lines. Over after the last
 * line.
 */
export function readThroughPhase(script: Script): PhaseLogic<DialogueProgress> {
  const { rolesOf } = scenario(script);
  return {
    setup: () => startDialogue(),
    actions: {
      advance({ state, part, payload }) {
        advanceDialogue(script.lines, state, rolesOf(part), payload.index);
      },
    },
    done: (state) => state.finished,
  };
}

/** The ID of the samples' one phase. */
export const READING = 'reading';

export type State = FlowState;

/** The logic of a work that is one read-through of its script. */
export function readThroughLogic(script: Script): GameLogic<State> {
  return flowLogic([{ id: READING, logic: readThroughPhase(script) }], scenario(script).partIds);
}

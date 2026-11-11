/**
 * Server-authoritative logic shared by the samples; each sample's src/logic.ts (manifest
 * serverActionLogicPath) builds it from its script. Actions run both in client prediction
 * and on the server, so keep them deterministic.
 */

import { advanceDialogue, assignParts, type DialogueProgress, startDialogue } from '@uzu-toolkit/kit';
import type { ActionArgs, GameLogic } from '@uzuhq/code-sdk';
import { type Script, scenario } from './script';

export interface State {
  /** Seat ID -> part ID. */
  parts: Record<string, string>;
  dialogue: DialogueProgress;
}

export function readThroughLogic(script: Script): GameLogic<State> {
  const s = scenario(script);
  return {
    setup: ({ players }) => ({ parts: assignParts(players, s.partIds), dialogue: startDialogue() }),
    actions: {
      advance({ state, playerId, payload }: ActionArgs<State, { index: number }>) {
        advanceDialogue(script.lines, state.dialogue, s.rolesOf(state.parts[playerId]), payload.index);
      },
    },
    update() {},
  };
}

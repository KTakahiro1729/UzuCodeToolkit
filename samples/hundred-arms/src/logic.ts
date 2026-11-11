/**
 * Server-authoritative logic (manifest.json serverActionLogicPath).
 * Actions run both in client prediction and on the server, so keep them deterministic.
 */

import { advanceDialogue, assignRoles, type DialogueProgress, startDialogue } from '@uzu-toolkit/kit';
import type { ActionArgs, GameLogic } from '@uzuhq/code-sdk';
import { LINES, ROLE_IDS } from './scenario';

export interface State {
  /** Seat ID -> role ID. */
  roles: Record<string, string>;
  dialogue: DialogueProgress;
}

const logic: GameLogic<State> = {
  setup: ({ players }) => ({ roles: assignRoles(players, ROLE_IDS), dialogue: startDialogue() }),
  actions: {
    advance({ state, playerId, payload }: ActionArgs<State, { index: number }>) {
      advanceDialogue(LINES, state.dialogue, state.roles[playerId], payload.index);
    },
  },
  update() {},
};

export default logic;

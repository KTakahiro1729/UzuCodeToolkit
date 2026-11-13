/**
 * Phases: a work runs as a fixed list of phases in order (opening read-through, handouts, a game,
 * the post-game screen). Each phase brings its own logic; flowLogic() strings them into the
 * work's GameLogic. A phase's state is made when the game enters it and kept after it ends.
 */

import type { GameLogic, SeededRandom } from '@uzuhq/code-sdk';
import { assignParts } from './parts';

export interface PhaseArgs<P, A = Record<string, unknown>> {
  /** This phase's state (part of the work's state). */
  state: P;
  /** The seat that sent the action. */
  playerId: string;
  /** The part that seat plays (manifest characters[].id). */
  part: string;
  /** Seat ID -> part ID. */
  parts: Record<string, string>;
  payload: A;
}

export interface PhaseLogic<P = any> {
  /** Called when the game enters the phase; there is no state for it before. Deterministic. */
  setup(parts: Record<string, string>): P;
  /** Run both in client prediction and on the server: deterministic; reject by throwing. */
  actions?: Record<string, (a: PhaseArgs<P, any>) => void>;
  /** Run on the server only; shuffles and other random draws go here, with `random`. */
  serverActions?: Record<string, (a: PhaseArgs<P, any> & { random: SeededRandom }) => void>;
  /** True once the phase is over; the game then enters the next phase. */
  done(state: P): boolean;
}

export interface FlowState {
  /** Seat ID -> part ID. */
  parts: Record<string, string>;
  /** Index of the current phase. */
  at: number;
  /** Phase ID -> that phase's state, for the phases entered so far. */
  phases: Record<string, unknown>;
  /** True once the last phase is done: the game has ended. */
  ended: boolean;
}

/** The action name a phase's action is sent under. */
export const phaseAction = (phaseId: string, name: string): string => `${phaseId}:${name}`;

/**
 * The work's GameLogic from its phases, in order. Seats get parts from `partIds` (a seat's chosen
 * character first). Each phase's actions are sent as `${phaseId}:${name}`; an action of any phase
 * but the current one is rejected, so a late tap never reaches the next phase. After every action
 * the game moves past phases that are done; the last phase stays once done.
 */
export function flowLogic(
  phases: readonly { id: string; logic: PhaseLogic }[],
  partIds: readonly string[],
): GameLogic<FlowState> {
  if (phases.length === 0) throw new Error('a flow needs at least one phase');
  if (new Set(phases.map((p) => p.id)).size !== phases.length) throw new Error('phase IDs must differ');

  const enter = (state: FlowState): void => {
    const { id, logic } = phases[state.at];
    state.phases[id] = logic.setup(state.parts);
  };
  const isDone = (state: FlowState): boolean => phases[state.at].logic.done(state.phases[phases[state.at].id]);
  const moveOn = (state: FlowState): void => {
    while (state.at < phases.length - 1 && isDone(state)) {
      state.at += 1;
      enter(state);
    }
    state.ended = isDone(state);
  };
  type Args = { state: FlowState; playerId: string; payload: any };
  const argsFor = (phaseId: string, { state, playerId, payload }: Args): PhaseArgs<unknown> => {
    if (phases[state.at].id !== phaseId) throw new Error(`not in phase ${phaseId}`);
    return { state: state.phases[phaseId], playerId, part: state.parts[playerId], parts: state.parts, payload };
  };

  const actions: GameLogic<FlowState>['actions'] = {};
  const serverActions: NonNullable<GameLogic<FlowState>['serverActions']> = {};
  for (const { id, logic } of phases) {
    for (const [name, run] of Object.entries(logic.actions ?? {})) {
      actions[phaseAction(id, name)] = (a) => {
        run(argsFor(id, a));
        moveOn(a.state);
      };
    }
    for (const [name, run] of Object.entries(logic.serverActions ?? {})) {
      serverActions[phaseAction(id, name)] = (a) => {
        // The same name in actions runs first and may already have moved the game on.
        if (logic.actions?.[name] && phases[a.state.at].id !== id) return;
        run({ ...argsFor(id, a), random: a.ctx.random });
        moveOn(a.state);
      };
    }
  }

  return {
    setup({ players }) {
      const state: FlowState = { parts: assignParts(players, partIds), at: 0, phases: {}, ended: false };
      enter(state);
      moveOn(state);
      return state;
    },
    actions,
    serverActions,
    update() {},
  };
}

/** A phase whose content is not made yet: over when any player sends `next`. */
export function emptyPhase(): PhaseLogic<{ next: boolean }> {
  return {
    setup: () => ({ next: false }),
    actions: {
      next({ state }) {
        state.next = true;
      },
    },
    done: (state) => state.next,
  };
}

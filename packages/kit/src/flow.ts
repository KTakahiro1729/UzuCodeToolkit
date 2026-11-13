/**
 * Phases: a work runs as a fixed list of phases in order (opening read-through, handouts, a game,
 * the post-game screen). Each phase brings its own logic; flowLogic() strings them into the
 * work's GameLogic. A phase's state is made when the game enters it and kept after it ends.
 */

import type { Duration, GameLogic, GameTime, SeededRandom, VoicePlan } from '@uzuhq/code-sdk';
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
  /** The game time of the action (ctx.time): the same value when the action is replayed. */
  time: GameTime;
}

export interface PhaseLogic<P = any> {
  /**
   * Called when the game enters the phase; there is no state for it before. Deterministic.
   * `time` is the game time of entering, for deadlines kept in the phase's state.
   */
  setup(parts: Record<string, string>, time: GameTime): P;
  /** Run both in client prediction and on the server: deterministic; reject by throwing. */
  actions?: Record<string, (a: PhaseArgs<P, any>) => void>;
  /**
   * Run on the server only; shuffles and other random draws go here, with `random`. `after(d)` is
   * the game time `d` ms from now, for a deadline kept in the phase's state.
   */
  serverActions?: Record<string, (a: PhaseArgs<P, any> & { random: SeededRandom; after(d: Duration): GameTime }) => void>;
  /** True once the phase is over; the game then enters the next phase. */
  done(state: P): boolean;
  /**
   * A deadline kept in the phase's state, such as a timer's end: `at` reads it from the state
   * (null for none), and the server calls `handler` once the time comes, then moves on as after
   * an action. Runs only while the phase is current.
   */
  deadline?: {
    at(state: P): GameTime | null | undefined;
    handler(a: { state: P; parts: Record<string, string>; time: GameTime; random: SeededRandom }): void;
  };
  /**
   * The voice room and mic policy of one player while this phase is current (the SDK's
   * `voicePlan`): players in the same room hear each other, others do not. Without it everyone
   * is in the whole-game room with a free mic. Light and pure, from the state alone: it is called
   * after every change.
   */
  voicePlan?(a: { state: P; seat: string; part: string; parts: Record<string, string> }): VoicePlan;
  /**
   * Lets players come back to this phase from the next one, until anyone acts there (the
   * `${phaseId}:reopen` action). Changes this phase's state so it is not done; throw to refuse.
   * The next phase's state is dropped and set up again when the game re-enters it.
   */
  reopen?(a: { state: P; time: GameTime }): void;
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
  /** True from entering a phase until its first action: the phase before may be reopened. */
  reopenable: boolean;
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

  const enter = (state: FlowState, time: GameTime): void => {
    const { id, logic } = phases[state.at];
    state.phases[id] = logic.setup(state.parts, time);
  };
  const isDone = (state: FlowState): boolean => phases[state.at].logic.done(state.phases[phases[state.at].id]);
  const moveOn = (state: FlowState, time: GameTime): void => {
    while (state.at < phases.length - 1 && isDone(state)) {
      state.at += 1;
      enter(state, time);
      state.reopenable = true;
    }
    state.ended = isDone(state);
  };
  type Args = { state: FlowState; playerId: string; payload: any; ctx: { time: GameTime } };
  const argsFor = (phaseId: string, { state, playerId, payload, ctx }: Args): PhaseArgs<unknown> => {
    if (phases[state.at].id !== phaseId) throw new Error(`not in phase ${phaseId}`);
    return { state: state.phases[phaseId], playerId, part: state.parts[playerId], parts: state.parts, payload, time: ctx.time };
  };

  const actions: GameLogic<FlowState>['actions'] = {};
  const serverActions: NonNullable<GameLogic<FlowState>['serverActions']> = {};
  for (const { id, logic } of phases) {
    for (const [name, run] of Object.entries(logic.actions ?? {})) {
      actions[phaseAction(id, name)] = (a) => {
        run(argsFor(id, a));
        a.state.reopenable = false;
        moveOn(a.state, a.ctx.time);
      };
    }
    for (const [name, run] of Object.entries(logic.serverActions ?? {})) {
      serverActions[phaseAction(id, name)] = (a) => {
        // The same name in actions runs first and may already have moved the game on.
        if (logic.actions?.[name] && phases[a.state.at].id !== id) return;
        run({ ...argsFor(id, a), random: a.ctx.random, after: a.ctx.after });
        a.state.reopenable = false;
        moveOn(a.state, a.ctx.time);
      };
    }
  }
  phases.forEach(({ id, logic }, i) => {
    const { reopen } = logic;
    if (!reopen) return;
    actions[phaseAction(id, 'reopen')] = ({ state, ctx }) => {
      if (state.at !== i + 1 || !state.reopenable) throw new Error(`cannot reopen ${id}`);
      reopen({ state: state.phases[id], time: ctx.time });
      if (logic.done(state.phases[id])) throw new Error(`${id} is still done`);
      delete state.phases[phases[i + 1].id];
      state.at = i;
      state.ended = false;
      state.reopenable = false;
    };
  });

  return {
    setup({ players, ctx }) {
      const state: FlowState = {
        parts: assignParts(players, partIds),
        at: 0,
        phases: {},
        ended: false,
        reopenable: false,
      };
      enter(state, ctx.time);
      moveOn(state, ctx.time);
      return state;
    },
    actions,
    serverActions,
    deadlines: {
      // The current phase's deadline; the SDK re-reads it whenever the state changes.
      phase: {
        at: ({ state }) => {
          const { id, logic } = phases[state.at];
          return state.ended ? null : logic.deadline?.at(state.phases[id]);
        },
        handler: ({ state, ctx }) => {
          const { id, logic } = phases[state.at];
          logic.deadline?.handler({ state: state.phases[id], parts: state.parts, time: ctx.time, random: ctx.random });
          moveOn(state, ctx.time);
        },
      },
    },
    // The current phase's voice rooms (see PhaseLogic.voicePlan); the whole-game room without one.
    voicePlan({ state, playerId }) {
      const { id, logic } = phases[state.at];
      const plan = logic.voicePlan?.({ state: state.phases[id], seat: playerId, part: state.parts[playerId], parts: state.parts });
      return plan ?? { room: null, mic: 'free' };
    },
    update() {},
  };
}

/**
 * A phase whose content is not made yet: over when any player sends `next`. With `facilitator`
 * (a part ID) only the player of that part can.
 */
export function emptyPhase({ facilitator }: { facilitator?: string } = {}): PhaseLogic<{ next: boolean }> {
  return {
    setup: () => ({ next: false }),
    actions: {
      next({ state, part }) {
        if (facilitator !== undefined && part !== facilitator) throw new Error('not the facilitator');
        state.next = true;
      },
    },
    done: (state) => state.next,
  };
}

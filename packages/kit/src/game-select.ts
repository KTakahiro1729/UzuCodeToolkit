/**
 * A phase where the players pass the time with games: pick one from a list, play it, come back
 * and pick another, then move on. Each game is a PhaseLogic of its own; its state lives only
 * while it is played, and going back drops it.
 */

import type { PhaseArgs, PhaseLogic } from './flow';

/** A game the phase offers (the logic half; the screen adds a label and a view). */
export interface GameEntry {
  id: string;
  /** How many players it takes; outside this range it cannot be picked. */
  players: { min: number; max: number };
  logic: PhaseLogic;
}

export interface GameSelectState {
  /** The game being played, or null while choosing. */
  game: string | null;
  /** That game's state. */
  play: unknown;
  /** True once a player moved on to the next phase. */
  next: boolean;
}

/** The action name a game's action is sent under inside the phase: `${gameId}.${name}`. */
export const gameAction = (gameId: string, name: string): string => `${gameId}.${name}`;

/** Whether `game` can be played by this many players. */
export const playable = (game: GameEntry, playerCount: number): boolean =>
  game.players.min <= playerCount && playerCount <= game.players.max;

/**
 * The phase over `games`. Actions: `pick { id }` starts a game, `back` drops it and returns to
 * the list (at any time, so a game with no end never traps the players), `next` ends the phase
 * from the list. A game's own actions are `${gameId}.${name}`, rejected unless that game is
 * being played. A game that is done stays on screen, showing its result, until `back`.
 */
export function gameSelectPhase(games: readonly GameEntry[]): PhaseLogic<GameSelectState> {
  if (new Set(games.map((g) => g.id)).size !== games.length) throw new Error('game IDs must differ');

  const actions: NonNullable<PhaseLogic<GameSelectState>['actions']> = {
    pick({ state, parts, payload, time }: PhaseArgs<GameSelectState, { id: string }>) {
      if (state.game !== null) throw new Error('a game is being played');
      const game = games.find((g) => g.id === payload.id);
      if (!game) throw new Error(`no game ${payload.id}`);
      if (!playable(game, Object.keys(parts).length)) throw new Error(`${game.id} does not take this many players`);
      state.game = game.id;
      state.play = game.logic.setup(parts, time);
    },
    back({ state }) {
      if (state.game === null) throw new Error('no game is being played');
      state.game = null;
      state.play = null;
    },
    next({ state }) {
      if (state.game !== null) throw new Error('go back from the game first');
      state.next = true;
    },
  };
  const serverActions: NonNullable<PhaseLogic<GameSelectState>['serverActions']> = {};

  // The game's handler gets everything the phase's got (time, and random and after on the server).
  const inner = <T>(gameId: string, a: PhaseArgs<GameSelectState> & T) => {
    if (a.state.game !== gameId) throw new Error(`not playing ${gameId}`);
    return { ...a, state: a.state.play };
  };
  for (const { id, logic } of games) {
    for (const [name, run] of Object.entries(logic.actions ?? {})) {
      actions[gameAction(id, name)] = (a) => run(inner(id, a));
    }
    for (const [name, run] of Object.entries(logic.serverActions ?? {})) {
      serverActions[gameAction(id, name)] = (a) => {
        // The same name in actions runs first and may already have left the game.
        if (logic.actions?.[name] && a.state.game !== id) return;
        run(inner(id, a));
      };
    }
  }

  return {
    setup: () => ({ game: null, play: null, next: false }),
    actions,
    serverActions,
    done: (state) => state.next,
  };
}

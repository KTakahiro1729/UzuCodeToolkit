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
  /** Seat ID -> part ID of the seats playing it (all but a spectator), or null while choosing. */
  players: Record<string, string> | null;
  /** True once a player moved on to the next phase. */
  next: boolean;
}

/** The action name a game's action is sent under inside the phase: `${gameId}.${name}`. */
export const gameAction = (gameId: string, name: string): string => `${gameId}.${name}`;

const fits = (game: GameEntry, count: number): boolean => game.players.min <= count && count <= game.players.max;

/**
 * The seats that play `game` (seat ID -> part ID), or null if it cannot be played. Everyone
 * plays when the count fits; otherwise the `spectator` part, if given, sits out when that makes
 * it fit.
 */
export function playersFor(
  game: GameEntry,
  parts: Record<string, string>,
  spectator?: string,
): Record<string, string> | null {
  if (fits(game, Object.keys(parts).length)) return parts;
  if (spectator === undefined) return null;
  const rest = Object.fromEntries(Object.entries(parts).filter(([, part]) => part !== spectator));
  const count = Object.keys(rest).length;
  return count < Object.keys(parts).length && fits(game, count) ? rest : null;
}

/**
 * The phase over `games`. Actions: `pick { id }` starts a game, `back` drops a game that is done
 * and returns to the list (not before: a game runs to its end), `next` ends the phase
 * from the list. A game's own actions are `${gameId}.${name}`, rejected unless that game is
 * being played, and from a seat that sits it out. Games get only the seats that play them as
 * `parts` (see playersFor() and `spectator`). A game that is done stays on screen, showing its
 * result, until `back`.
 */
export function gameSelectPhase(
  games: readonly GameEntry[],
  { spectator }: { spectator?: string } = {},
): PhaseLogic<GameSelectState> {
  if (new Set(games.map((g) => g.id)).size !== games.length) throw new Error('game IDs must differ');

  const actions: NonNullable<PhaseLogic<GameSelectState>['actions']> = {
    pick({ state, parts, payload, time }: PhaseArgs<GameSelectState, { id: string }>) {
      if (state.game !== null) throw new Error('a game is being played');
      const game = games.find((g) => g.id === payload.id);
      if (!game) throw new Error(`no game ${payload.id}`);
      const players = playersFor(game, parts, spectator);
      if (!players) throw new Error(`${game.id} does not take this many players`);
      state.game = game.id;
      state.players = players;
      state.play = game.logic.setup(players, time);
    },
    back({ state }) {
      const game = games.find((g) => g.id === state.game);
      if (!game) throw new Error('no game is being played');
      if (!game.logic.done(state.play)) throw new Error('the game is not over');
      state.game = null;
      state.play = null;
      state.players = null;
    },
    next({ state }) {
      if (state.game !== null) throw new Error('go back from the game first');
      state.next = true;
    },
  };
  const serverActions: NonNullable<PhaseLogic<GameSelectState>['serverActions']> = {};

  // The game's handler gets everything the phase's got (time, and random and after on the server).
  const inner = <T>(gameId: string, a: PhaseArgs<GameSelectState> & T) => {
    const { game, players, play } = a.state;
    if (game !== gameId || !players) throw new Error(`not playing ${gameId}`);
    if (!(a.playerId in players)) throw new Error('this seat sits the game out');
    return { ...a, state: play, parts: players };
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
    setup: () => ({ game: null, play: null, players: null, next: false }),
    actions,
    serverActions,
    done: (state) => state.next,
  };
}

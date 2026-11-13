import { describe, expect, it } from 'vitest';
import type { GameTime } from '@uzuhq/code-sdk';
import { type Card, deal, deck, flowLogic, type FlowState, type GameSelectState, gameSelectPhase, type PhaseLogic } from '../src';

const players = [
  { id: 'seat-a', nickname: 'A', iconUrl: '' },
  { id: 'seat-b', nickname: 'B', iconUrl: '' },
] as never;
const random = { shuffle: <T>(a: T[]) => [...a].reverse() };
const ctx = { random, time: 0, after: (d: number) => d } as never;

/** Deal two cards each on the server; over once every seat has shown its hand. */
const cards: PhaseLogic<{ hands: Record<string, Card[]>; shown: string[] }> = {
  setup: () => ({ hands: {}, shown: [] }),
  actions: {
    show({ state, playerId }) {
      if (!state.hands[playerId]) throw new Error('not dealt');
      if (!state.shown.includes(playerId)) state.shown.push(playerId);
    },
  },
  serverActions: {
    deal({ state, parts, random }) {
      state.hands = deal(random.shuffle(deck()), Object.keys(parts), 2);
    },
  },
  done: (state) => state.shown.length === 2,
};
const solo: PhaseLogic<null> = { setup: () => null, done: () => false };
/** Keeps the time it started at and the deadline its server action set. */
const timed: PhaseLogic<{ start: GameTime; end: GameTime | null }> = {
  setup: (_parts, time) => ({ start: time, end: null }),
  serverActions: {
    go({ state, after }) {
      state.end = after(5000);
    },
  },
  done: () => false,
};

const idle = gameSelectPhase([
  { id: 'cards', players: { min: 2, max: 4 }, logic: cards },
  { id: 'solo', players: { min: 1, max: 1 }, logic: solo },
  { id: 'timed', players: { min: 1, max: 4 }, logic: timed },
]);
const logic = flowLogic([{ id: 'idle', logic: idle }], ['x', 'y']);
const send = (state: FlowState, name: string, payload = {}, playerId = 'seat-a') =>
  logic.actions[name]({ state, playerId, payload, ctx });
const serverSend = (state: FlowState, name: string) =>
  logic.serverActions![name]({ state, playerId: 'seat-a', payload: {}, ctx });
const phase = (state: FlowState) => state.phases.idle as GameSelectState;

describe('gameSelectPhase', () => {
  it('plays a game, keeps its result until back, then drops it', () => {
    const state = logic.setup({ players, ctx });
    send(state, 'idle:pick', { id: 'cards' });
    expect(phase(state).game).toBe('cards');
    serverSend(state, 'idle:cards.deal');
    expect(phase(state).play).toMatchObject({ hands: { 'seat-a': ['KC', 'JC'], 'seat-b': ['QC', 'TC'] } });
    send(state, 'idle:cards.show', {}, 'seat-a');
    send(state, 'idle:cards.show', {}, 'seat-b');
    expect(phase(state).game).toBe('cards');
    send(state, 'idle:back');
    expect(phase(state)).toEqual({ game: null, play: null, next: false });
    send(state, 'idle:next');
    expect(state.ended).toBe(true);
  });

  it("rejects a game's action unless that game is played", () => {
    const state = logic.setup({ players, ctx });
    expect(() => send(state, 'idle:cards.show')).toThrow();
    expect(() => serverSend(state, 'idle:cards.deal')).toThrow();
  });

  it('rejects a game for the wrong number of players, and next or pick during a game', () => {
    const state = logic.setup({ players, ctx });
    expect(() => send(state, 'idle:pick', { id: 'solo' })).toThrow();
    send(state, 'idle:pick', { id: 'cards' });
    expect(() => send(state, 'idle:next')).toThrow();
    expect(() => send(state, 'idle:pick', { id: 'cards' })).toThrow();
  });

  it('hands the game time to the game, and after() to its server actions', () => {
    const state = logic.setup({ players, ctx });
    send(state, 'idle:pick', { id: 'timed' });
    serverSend(state, 'idle:timed.go');
    expect(phase(state).play).toEqual({ start: 0, end: 5000 });
  });
});

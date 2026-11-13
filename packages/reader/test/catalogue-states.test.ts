import { type Handout, handoutLogic, type PhaseLogic, readyPhase, emptyPhase, gameSelectPhase } from '@uzu-toolkit/kit';
import { describe, expect, it } from 'vitest';
import { readThroughPhase } from '../src/logic';
// @ts-expect-error plain JavaScript, shared with the screen preview
import { catalogue, phaseScreens, states } from '../../../tools/screen-preview/catalogue.mjs';

/**
 * The catalogue's `states` write a toolkit phase's state for a screenshot. They must keep the
 * shape the phase's own `setup` makes, and be over (or not) as the phase says.
 */
const SEATS = { a: 'x', b: 'y' };
const seats = Object.keys(SEATS);
const keys = (o: unknown) => Object.keys(o as object).sort();
const time = 0 as never;

const shape = (logic: PhaseLogic, made: unknown) => expect(keys(made)).toEqual(keys(logic.setup(SEATS, time)));

describe('the catalogue states match the phases', () => {
  it('ready', () => {
    const logic = readyPhase();
    shape(logic, states.ready.fresh(seats));
    expect(logic.done(states.ready.fresh(seats))).toBe(false);
    expect(logic.done(states.ready.over(seats))).toBe(true);
  });
  it('dialogue', () => {
    const logic = readThroughPhase({ title: 't', cast: [{ id: 'x', label: 'X' }], lines: [{ speaker: 'x', text: '1' }, { speaker: 'x', text: '2' }] } as never);
    shape(logic, states.dialogue.over(2));
    shape(logic, states.dialogue.fresh());
    expect(logic.done(states.dialogue.fresh())).toBe(false);
    expect(logic.done(states.dialogue.lastLine(2))).toBe(false);
    expect(logic.done(states.dialogue.over(2))).toBe(true);
  });
  it('handout', () => {
    const handout: Handout = { common: [], parts: { x: { heading: 'x', body: [], settings: [{ id: 's', label: 's' }] }, y: { heading: 'y', body: [] } } };
    const logic = handoutLogic(handout, { minutes: 1 });
    const fresh = logic.setup(SEATS, time);
    const over = states.handout.over({ seats, values: fresh.values });
    shape(logic, over);
    expect(logic.done(fresh)).toBe(false);
    expect(logic.done(over)).toBe(true);
    const late = states.handout.timeUp(fresh, ['a']);
    expect(logic.done(late)).toBe(true);
    expect(late.ready).toEqual({ a: true, b: false });
  });
  it('empty', () => {
    const logic = emptyPhase();
    shape(logic, states.empty.fresh());
    expect(logic.done(states.empty.fresh())).toBe(false);
    expect(logic.done(states.empty.over())).toBe(true);
  });
  it('gameSelect', () => {
    const logic = gameSelectPhase([]);
    shape(logic, states.gameSelect.fresh());
    expect(logic.done(states.gameSelect.fresh())).toBe(false);
    expect(logic.done(states.gameSelect.over())).toBe(true);
  });
});

describe('phaseScreens', () => {
  const phases = [
    { id: 'intro', kind: 'ready', label: 'Intro' },
    { id: 'opening', kind: 'dialogue', lines: 3 },
    { id: 'handout', kind: 'handout' },
    { id: 'own', kind: 'mine' },
    { id: 'pastime', kind: 'gameSelect' },
  ];
  const args = { phases, seats: ['a', 'b'], parts: { a: 'x', b: 'y' }, values: { x: { s: 'v' } } };

  it('makes numbered screens, one per chosen state of each toolkit phase, and skips the work\'s own', () => {
    const screens = phaseScreens(args);
    expect(screens.map((s: unknown[]) => s[0])).toEqual(['01-intro-start', '02-opening-start', '03-opening-last', '04-handout-done', '05-pastime-start']);
    // They make a valid catalogue (its numbers run without a gap).
    expect(() => catalogue({ title: 't', screens })).not.toThrow();
  });
  it('puts the game in the phase with the earlier ones over', () => {
    const [, , , done, game] = phaseScreens(args);
    const at = (screen: unknown[]) => (screen[3] as { state: () => { at: number; phases: Record<string, unknown> } }[])[0].state();
    expect(at(done).at).toBe(2);
    expect(Object.keys(at(done).phases)).toEqual(['intro', 'opening', 'handout']);
    expect(at(game).at).toBe(4);
    expect(at(game).phases.pastime).toEqual(states.gameSelect.fresh());
  });
  it('shoots only what the work chooses', () => {
    expect(phaseScreens({ ...args, only: ['opening'], shots: { opening: ['last'] }, from: 7 }).map((s: unknown[]) => s[0])).toEqual(['07-opening-last']);
    expect(() => phaseScreens({ ...args, shots: { handout: ['start'] } })).toThrow(/no start state/);
  });
});

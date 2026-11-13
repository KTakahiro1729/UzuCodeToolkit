/**
 * Handout (HO) phase: every player reads the shared text and their own part's text, fills in
 * the settings their part asks for, and taps when done. The phase ends once every seat is done.
 * The settings stay in the state, by part, so later phases can read them.
 *
 * A timer shows the reading time left. When it runs out the phase ends, whoever is done or not
 * and whatever is filled in (settings left blank stay empty strings). Before that, any player
 * still reading can ask for more time, which adds EXTENSION_MS for everyone.
 */

import { type GameTime, minus, plus } from '@uzuhq/code-sdk';
import type { PhaseLogic } from './flow';

/** A setting the player fills in, such as the ship's name. */
export interface HandoutSetting {
  /** Key of the value in the state, read by later phases. */
  id: string;
  label: string;
  /** Shown in the empty input, such as "ネオホライゾン". */
  example?: string;
}

/** One part's own handout. */
export interface PartHandout {
  /** The part's name as the handout heads it, such as "池尾　ジン（いけお　じん）". */
  heading: string;
  /** Paragraphs; line breaks inside a paragraph are kept. */
  body: readonly string[];
  /** How this part sees the others. */
  impressions?: readonly { name: string; text: string }[];
  settings?: readonly HandoutSetting[];
}

export interface Handout {
  /** Paragraphs every player reads. */
  common: readonly string[];
  /** Part ID -> that part's own handout. */
  parts: Record<string, PartHandout>;
}

export interface HandoutState {
  /** Game time the reading time runs out. */
  endsAt: GameTime;
  /** True once a player's client reported the time up (checked against the game time). */
  timeUp: boolean;
  /** Seat ID -> whether that player has finished. */
  ready: Record<string, boolean>;
  /** Part ID -> setting ID -> value. Every setting starts as an empty string. */
  values: Record<string, Record<string, string>>;
}

/** What one request for more time adds. */
export const EXTENSION_MS = 2 * 60_000;

/** Longest value a setting takes. */
export const HANDOUT_VALUE_MAX = 40;

/** The settings a part fills in. */
export function settingsOf(handout: Handout, part: string): readonly HandoutSetting[] {
  return handout.parts[part]?.settings ?? [];
}

/** Whether a part has filled in every setting (blank values do not count). */
export function filledIn(handout: Handout, state: HandoutState, part: string): boolean {
  return settingsOf(handout, part).every((f) => (state.values[part]?.[f.id] ?? '').trim() !== '');
}

/** `minutes`: the reading time, such as 5. */
export function handoutLogic(handout: Handout, { minutes }: { minutes: number }): PhaseLogic<HandoutState> {
  return {
    setup(parts, time) {
      const ready: Record<string, boolean> = {};
      const values: HandoutState['values'] = {};
      for (const [seat, part] of Object.entries(parts)) {
        ready[seat] = false;
        values[part] = Object.fromEntries(settingsOf(handout, part).map((f) => [f.id, '']));
      }
      return { endsAt: plus(time, minutes * 60_000), timeUp: false, ready, values };
    },
    actions: {
      /** Set one of your part's settings. */
      set({ state, playerId, part, payload }) {
        const { id, value } = payload as { id: string; value: string };
        if (state.ready[playerId]) throw new Error('already done');
        if (!settingsOf(handout, part).some((f) => f.id === id)) throw new Error('no such setting');
        if (typeof value !== 'string' || value.length > HANDOUT_VALUE_MAX) throw new Error('bad value');
        state.values[part][id] = value;
      },
      /** Ask for more time: everyone's timer gets EXTENSION_MS more. */
      extend({ state, playerId }) {
        if (state.ready[playerId] !== false) throw new Error('not reading');
        state.endsAt = plus(state.endsAt, EXTENSION_MS);
      },
      /** Sent by every client once its clock reaches the end; rejected while time is left. */
      timeUp({ state, time }) {
        if (minus(state.endsAt, time) > 0) throw new Error('time left');
        state.timeUp = true;
      },
      /** Finish reading; needs every setting filled in. Cannot be undone. */
      ready({ state, playerId, part }) {
        if (!(playerId in state.ready)) throw new Error('not a player');
        if (!filledIn(handout, state, part)) throw new Error('settings left');
        state.ready[playerId] = true;
      },
    },
    done: (state) => state.timeUp || Object.values(state.ready).every(Boolean),
  };
}

/**
 * Handout (HO) phase: every player reads the shared text and their own part's text, fills in
 * the settings their part asks for, and taps when done. The phase ends once every seat is done.
 * The settings stay in the state, by part, so later phases can read them.
 */

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
  /** Seat ID -> whether that player has finished. */
  ready: Record<string, boolean>;
  /** Part ID -> setting ID -> value. Every setting starts as an empty string. */
  values: Record<string, Record<string, string>>;
}

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

export function handoutLogic(handout: Handout): PhaseLogic<HandoutState> {
  return {
    setup(parts) {
      const ready: Record<string, boolean> = {};
      const values: HandoutState['values'] = {};
      for (const [seat, part] of Object.entries(parts)) {
        ready[seat] = false;
        values[part] = Object.fromEntries(settingsOf(handout, part).map((f) => [f.id, '']));
      }
      return { ready, values };
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
      /** Finish reading; needs every setting filled in. Cannot be undone. */
      ready({ state, playerId, part }) {
        if (!(playerId in state.ready)) throw new Error('not a player');
        if (!filledIn(handout, state, part)) throw new Error('settings left');
        state.ready[playerId] = true;
      },
    },
    done: (state) => Object.values(state.ready).every(Boolean),
  };
}

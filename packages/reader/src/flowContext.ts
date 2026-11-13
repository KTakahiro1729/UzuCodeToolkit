/** The phase list, handed from FlowApp to the screens that show it inline (FlowStrip). */

import { getContext, setContext } from 'svelte';
import type { PhaseView } from './flow';

export interface FlowInfo {
  /** The work's phases, in order. */
  phases: readonly Pick<PhaseView, 'label'>[];
  /** Index of the current phase (FlowState.at). */
  at: number;
  /** True once the game has ended (FlowState.ended). */
  ended: boolean;
}

const KEY = Symbol('flow');

/** Called by FlowApp; `get` is read when the screens render, so they follow the game. */
export const provideFlow = (get: () => FlowInfo): void => void setContext(KEY, get);

/** The flow so far, or nothing outside FlowApp. */
export const useFlow = (): (() => FlowInfo) | undefined => getContext(KEY);

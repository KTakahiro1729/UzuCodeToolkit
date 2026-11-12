/** Hands the script, the shared state and the action sender to the view. */

import type { State } from './logic';
import type { Scenario } from './script';

export const game = $state<{ state: State | null; me: string | null }>({ state: null, me: null });

let current: Scenario | undefined;

/** The work being played; set once by startReader() before the view mounts. */
export function setScenario(s: Scenario): void {
  current = s;
}

export function getScenario(): Scenario {
  if (!current) throw new Error('scenario not set');
  return current;
}

let send: (type: string, payload: Record<string, unknown>) => void = () => {};

export function bindSend(fn: typeof send): void {
  send = fn;
}

export function sendAction(type: string, payload: Record<string, unknown>): void {
  send(type, payload);
}

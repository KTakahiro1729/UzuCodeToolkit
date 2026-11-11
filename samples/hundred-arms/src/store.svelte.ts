/**
 * SDK から届いた共有 state を画面へ渡す継ぎ目。
 */

import type { SeatKind } from '@uzuhq/code-sdk';
import type { State } from './logic';

type Send = (type: string, payload?: Record<string, unknown>) => void;

export const game = $state<{ state: State | null; me: string | null; seatKind: SeatKind | null }>({
  state: null,
  me: null,
  seatKind: null,
});

let send: Send = () => {};

export function bindSend(fn: Send): void {
  send = fn;
}

export function sendAction(type: string, payload?: Record<string, unknown>): void {
  send(type, payload);
}

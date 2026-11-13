/**
 * Time left on a timer, for the screen. Times are the SDK's game time, so the server and every
 * player count the same; only the view reads the clock.
 */

import { type GameTime, minus } from '@uzuhq/code-sdk';

/** Whole seconds from `now` until `endsAt`, never below 0. */
export const secondsLeft = (endsAt: GameTime, now: GameTime): number => Math.max(0, Math.ceil(minus(endsAt, now) / 1000));

/** Seconds as "m:ss", such as "4:05". */
export const formatClock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export interface Seat {
  id: string;
  /** The part (manifest character) the seat plays. */
  part: string;
}
export interface DriveArgs {
  seats: Seat[];
  /** Sends the phase's action `name` from the seat's own screen and waits for the state to change. */
  send(seat: Seat, name: string, payload?: Record<string, unknown>): Promise<void>;
  /** The phase's state when it was entered. */
  phase: unknown;
}
export type Driver = (args: DriveArgs) => Promise<void>;
export const ready: Driver;
export const readThrough: (script: {
  cast: readonly { id: string }[];
  parts?: readonly { id: string; roles: readonly string[] }[];
  lines: readonly { speaker: string | readonly string[] }[];
}) => Driver;
export const handout: (handouts: {
  parts: Record<string, { settings?: readonly { id: string; optional?: boolean }[] }>;
}) => Driver;
export function allPhases(o: {
  phases: readonly { id: string }[];
  drive?: Record<string, Driver>;
  cwd?: string;
  stepTimeoutMs?: number;
}): Promise<void>;

/**
 * Casting. A part is what one seat plays (a manifest character); it holds one or more
 * roles (speakers in the script), so one player can voice several roles.
 */

export interface Part {
  id: string;
  name: string;
  /** One line on who the part is (manifest characters[].description), shown when casting. */
  description?: string;
  /** Role IDs this part reads. */
  roles: readonly string[];
}

/**
 * The script's parts, or one part per cast entry when the script lists none.
 */
export function partsOf(script: {
  cast: readonly { id: string; label: string }[];
  parts?: readonly Part[];
}): readonly Part[] {
  return script.parts ?? script.cast.map((c) => ({ id: c.id, name: c.label, roles: [c.id] }));
}

/**
 * Seat assignment: seat (SDK Seat) -> part ID (manifest characters[].id).
 * A seat's chosen characterId wins; seats without a choice, or with a taken one,
 * get the remaining parts in seat order.
 */
export function assignParts(
  seats: readonly { id: string; characterId?: string }[],
  partIds: readonly string[],
): Record<string, string> {
  if (seats.length > partIds.length) throw new Error('more seats than parts');
  const assigned: Record<string, string> = {};
  const rest = [...partIds];
  const pending: string[] = [];
  for (const seat of seats) {
    const at = seat.characterId ? rest.indexOf(seat.characterId) : -1;
    if (at >= 0) assigned[seat.id] = rest.splice(at, 1)[0];
    else pending.push(seat.id);
  }
  for (const id of pending) assigned[id] = rest.shift() as string;
  return assigned;
}

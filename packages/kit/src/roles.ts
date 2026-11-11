/**
 * Role assignment: seat (SDK Seat) -> role (manifest characters[].id).
 * A seat's chosen characterId wins; seats without a choice, or with a taken one,
 * get the remaining roles in seat order.
 */
export function assignRoles(
  seats: readonly { id: string; characterId?: string }[],
  roleIds: readonly string[],
): Record<string, string> {
  if (seats.length > roleIds.length) throw new Error('more seats than roles');
  const roles: Record<string, string> = {};
  const rest = [...roleIds];
  const pending: string[] = [];
  for (const seat of seats) {
    const at = seat.characterId ? rest.indexOf(seat.characterId) : -1;
    if (at >= 0) roles[seat.id] = rest.splice(at, 1)[0];
    else pending.push(seat.id);
  }
  for (const id of pending) roles[id] = rest.shift() as string;
  return roles;
}

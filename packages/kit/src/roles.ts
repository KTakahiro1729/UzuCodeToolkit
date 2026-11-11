/**
 * 配役: 席 (SDK の Seat) → 役 (manifest の characters[].id)。
 * キャラ選択の characterId を優先し、 選ばれていない席や重なった席には残りの役を席順に割り当てる。
 */
export function assignRoles(
  seats: readonly { id: string; characterId?: string }[],
  roleIds: readonly string[],
): Record<string, string> {
  if (seats.length > roleIds.length) throw new Error('役より席が多いです');
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

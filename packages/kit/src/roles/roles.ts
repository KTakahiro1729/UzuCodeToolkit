/**
 * 配役。 席 (Seat) と役 (manifest の characters) を結ぶ。
 */

/** SDK の Seat のうち配役に使う部分。 */
export interface SeatLike {
  id: string;
  characterId?: string;
}

/**
 * 席 ID → 役 ID の対応を作る。
 *
 * キャラ選択で選ばれた `characterId` を優先し、 選ばれていない席 (dev harness や
 * 未選択) には残りの役を席の順に割り当てる。 同じ役が重なったら後の席を
 * 残りへ回す。 役より席が多ければ Error。
 */
export function assignRoles(
  seats: readonly SeatLike[],
  roleIds: readonly string[],
): Record<string, string> {
  if (seats.length > roleIds.length) {
    throw new Error(`役 (${roleIds.length}) より席 (${seats.length}) が多いです`);
  }
  const result: Record<string, string> = {};
  const taken = new Set<string>();
  const unassigned: SeatLike[] = [];
  for (const seat of seats) {
    const wanted = seat.characterId;
    if (wanted && roleIds.includes(wanted) && !taken.has(wanted)) {
      result[seat.id] = wanted;
      taken.add(wanted);
    } else {
      unassigned.push(seat);
    }
  }
  const rest = roleIds.filter((id) => !taken.has(id));
  unassigned.forEach((seat, i) => {
    result[seat.id] = rest[i];
  });
  return result;
}

/** 役 ID → 席 ID。 その役の席がなければ null。 */
export function seatOfRole(roles: Record<string, string>, roleId: string): string | null {
  for (const [seatId, r] of Object.entries(roles)) if (r === roleId) return seatId;
  return null;
}

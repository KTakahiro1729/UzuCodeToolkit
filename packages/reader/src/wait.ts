/**
 * The note of a button that waits for others: how many are left (`status.waitCount`, "あと{n}人").
 * A work that empties `status.waitCount` gets the plain sentence (`status.waitOthers`) instead.
 */

import { fill } from './fill';
import STRINGS from './strings';

export function waitNote(missing: number): string {
  return STRINGS['status.waitCount'] && missing > 0 ? fill(STRINGS['status.waitCount'], { n: missing }) : STRINGS['status.waitOthers'];
}

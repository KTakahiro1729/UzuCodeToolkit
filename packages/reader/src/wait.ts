/**
 * The note of a button that waits for others. By default the plain sentence (`status.waitOthers`);
 * a work that sets `status.waitCount` (such as "あと{n}人") shows how many are left.
 */

import { fill } from './fill';
import STRINGS from './strings';

export function waitNote(missing: number): string {
  return STRINGS['status.waitCount'] && missing > 0 ? fill(STRINGS['status.waitCount'], { n: missing }) : STRINGS['status.waitOthers'];
}

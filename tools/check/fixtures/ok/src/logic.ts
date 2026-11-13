// A small work that is fine with any one seat away: every phase can be moved on by anyone.
import { emptyPhase, flowLogic } from '@uzu-toolkit/kit';

export const PARTS = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];

export default flowLogic(
  [
    { id: 'first', logic: emptyPhase() },
    { id: 'second', logic: emptyPhase() },
  ],
  PARTS.map((p) => p.id),
);

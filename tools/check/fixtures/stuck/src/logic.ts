// A deliberately broken work: the second phase can be moved on only by the part `b`, so with `b` away it never ends.
import { emptyPhase, flowLogic } from '@uzu-toolkit/kit';

export const PARTS = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];

export default flowLogic(
  [
    { id: 'first', logic: emptyPhase() },
    { id: 'second', logic: emptyPhase({ facilitator: 'b' }) },
  ],
  PARTS.map((p) => p.id),
);

import { EmptyView, startFlow } from '@uzu-toolkit/reader';
import logic, { PARTS } from './logic';

startFlow(logic, {
  parts: PARTS,
  phases: [
    { id: 'first', label: 'First', view: EmptyView },
    { id: 'second', label: 'Second', view: EmptyView },
  ],
  orientation: 'landscape',
});

import { ReadThroughView, startFlow } from '@uzu-toolkit/reader';
import { StageReadThrough } from '@uzu-toolkit/reader/stage';
import script from '../script/script.json';
import logic from './logic';
import './theme.css';

startFlow(logic, {
  parts: script.parts,
  phases: [{ id: 'reading', label: '幾歳', view: ReadThroughView,
    props: { script, screen: StageReadThrough } }],
  orientation: 'landscape',
});

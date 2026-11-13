import { ReadThroughView, startFlow } from '@uzu-toolkit/reader';
import { READING } from '@uzu-toolkit/reader/logic';
import { StageReadThrough, type ScreenLayout } from '@uzu-toolkit/reader/stage';
import manifest from '../manifest.json';
import layout from '../read-through.layout.json';
import script from '../script/script.json';
import './fonts.css';
import './theme.css';
import logic from './logic';

startFlow(logic, {
  parts: script.parts,
  phases: [{
    id: READING,
    label: script.title,
    view: ReadThroughView,
    props: { script, screen: StageReadThrough, layout: layout as unknown as ScreenLayout },
  }],
  orientation: manifest.orientation as 'landscape',
});

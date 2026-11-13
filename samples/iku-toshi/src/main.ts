import { ReadThroughView, startFlow, STRINGS } from '@uzu-toolkit/reader';
import { READING } from '@uzu-toolkit/reader/logic';
import { READ_THROUGH_LAYOUT, StageReadThrough } from '@uzu-toolkit/reader/stage';
import script from '../script/script.json';
import './fonts.css';
import './theme.css';
import logic from './logic';

const layout: typeof READ_THROUGH_LAYOUT = {
  ...READ_THROUGH_LAYOUT,
  parts: {
    ...READ_THROUGH_LAYOUT.parts,
    bg: { ...READ_THROUGH_LAYOUT.parts.bg, image: 'winter-parlor' },
    c1: { ...READ_THROUGH_LAYOUT.parts.c1, landscape: [104, 50, 257, 300] },
    c2: { ...READ_THROUGH_LAYOUT.parts.c2, landscape: [353, 62, 238, 285] },
    solo: { ...READ_THROUGH_LAYOUT.parts.solo, landscape: [261, 46, 300, 324] },
    frame: { ...READ_THROUGH_LAYOUT.parts.frame, image: undefined },
    plate1: { ...READ_THROUGH_LAYOUT.parts.plate1, image: undefined },
    plate2: { ...READ_THROUGH_LAYOUT.parts.plate2, image: undefined },
    plateNarration: { ...READ_THROUGH_LAYOUT.parts.plateNarration, image: undefined },
    next: { ...READ_THROUGH_LAYOUT.parts.next, image: undefined },
    panel: { ...READ_THROUGH_LAYOUT.parts.panel, image: undefined },
  },
};

startFlow(logic, {
  parts: script.parts,
  phases: [{
    id: READING,
    label: STRINGS['phase.reading'],
    view: ReadThroughView,
    props: { script, screen: StageReadThrough, layout },
  }],
  orientation: 'landscape',
});

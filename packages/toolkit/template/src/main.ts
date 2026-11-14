// A read-through on the stage screen (docs/design/read-through.md, "Stage read-through"): standing
// characters, one dialogue frame, a log. The look comes from the layout JSON and the work's own
// pictures in public/assets/; a picture that is missing is drawn from the colour tokens in theme.css.
// The bubble chat is the other option: leave out `screen: StageReadThrough`.
import { ReadThroughView, startFlow } from '@uzu-toolkit/reader';
import { StageReadThrough } from '@uzu-toolkit/reader/stage';
import script from '../script/script.json';
// import './fonts.css'; // turn on after `npm run fonts` has made src/fonts/ (it needs fonttools and the network)
import './theme.css';
import logic from './logic';

startFlow(logic, {
  parts: script.parts,
  phases: [{ id: 'reading', label: script.title, view: ReadThroughView, props: { script, screen: StageReadThrough } }],
  orientation: 'landscape', // the author's answer; the same value as manifest.json
});

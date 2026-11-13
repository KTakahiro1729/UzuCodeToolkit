// An example shot list for tools/screen-preview (docs/screen-preview.md): steps per screen, in
// any seat's screen. Run, with this sample's harness up:
//   node tools/screen-preview/capture.mjs --png tmp/shots --config samples/hundred-arms/shots.example.mjs samples/hundred-arms
const NEXT = '.read > button:not([disabled])';

export default {
  screens: [
    {
      // Jump to the line 百 has to read, seen from 百's screen (seat 1).
      key: 'hyaku-turn',
      label: '百の番',
      seat: 1,
      steps: [
        { state: (s) => ({ ...s, phases: { ...s.phases, reading: { index: 7, finished: false } } }) },
        { waitFor: NEXT },
      ],
    },
    {
      // 百 taps on; 勇 (seat 0) now has the button.
      key: 'yu-turn',
      label: '勇の番',
      seat: 0,
      steps: [{ seat: 1, click: NEXT }, { waitFor: NEXT }],
    },
  ],
};

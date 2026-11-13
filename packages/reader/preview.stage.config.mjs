// The stage read-through's screens for tools/screen-preview (docs/screen-preview.md), for a sample
// that runs it (startReader(..., { layout: 'stage' })): capture.mjs --config packages/reader/preview.stage.config.mjs
// --size reference. `log` opens the log panel over the line being read.
const parts = [
  ['[data-stage]', '画面全体'],
  ['.tag', '上の札'],
  ['.figure[data-kind=speaker], .figure[data-kind=solo]', '立ち絵（話している人）'],
  ['.figure[data-kind=second]', '立ち絵（次の人）'],
  ['.frame', 'セリフ枠'],
  ['.line', 'セリフ本文'],
  ['.plate.one', '名札（話している人）'],
  ['.plate.two', '名札（次の人）'],
  ['[data-uzu-actions="main"] button', '次へ'],
  ['.log-link', 'ログ確認'],
  ['.panel', 'ログのパネル'],
  ['.panel .close', 'ログを閉じる'],
  ['.rows li', 'ログの1行'],
];
export default {
  player: 0,
  next: '[data-uzu-actions="main"] button:not([disabled])',
  scroll: ['[data-uzu-scroll]'],
  screens: [
    { key: 'first-mine', label: '初登場（自分）', seat: 0, taps: 0, parts },
    { key: 'first-other', label: '初登場（相手）', seat: 1, taps: 0, parts },
    { key: 'mine', label: '自分が話している', seat: 0, taps: 2, parts },
    { key: 'other', label: '相手が話し、自分が次', seat: 1, taps: 0, parts },
    { key: 'log', label: 'ログ', seat: 1, taps: 0, steps: [{ click: '.log-link' }], parts },
  ],
};

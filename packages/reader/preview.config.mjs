// The read-through screens for tools/screen-preview (docs/screen-preview.md), for every sample.
// A sample can keep its own preview.config.mjs instead. Labels are what the owner calls each part.
export default {
  player: 0,
  next: '[data-uzu-actions="main"] button:not([disabled])',
  scroll: ['[data-uzu-scroll]'],
  screens: [
    {
      key: 'reading',
      label: '読み合わせ中',
      taps: 5,
      parts: [
        ['main', '画面の外枠'],
        ['header', '上の帯'],
        ['[data-uzu-phase]', '場面名'],
        ['header .roles', '役の並び'],
        ['header .who:last-child', '役（アイコン＋名前）'],
        ['header .who:last-child img', '役アイコン'],
        ['.read', '会話とボタンの列'],
        ['.chat', '会話の列'],
        ['.chat li[data-side=left]', '相手の行'],
        ['.chat li[data-side=right]', '自分の行'],
        ['.chat li img', '話者アイコン'],
        ['.chat li .name', '話者名'],
        ['.chat li p', '吹き出し'],
        ['[data-uzu-actions="main"] button', '進むボタン'],
        ['.notice', '作品の注記'],
        ['.chat h3', '場面の見出し'],
        ['.chat li[data-direction=true] p', 'ト書き'],
      ],
    },
    {
      key: 'end',
      label: '感想戦',
      taps: Infinity,
      // The post-game screen follows the end mark after 3 s.
      wait: 4000,
      parts: [
        ['main', '画面の外枠'],
        ['header', '上の帯'],
        ['[data-uzu-phase]', '場面名'],
        ['header .roles', '役の並び'],
        ['.end', '終了画面の列'],
        ['.closing', '題名と終わりの印'],
        ['.review', '振り返り'],
        ['.review h1', '振り返りの見出し'],
        ['.afterword', 'あとがき'],
        ['.afterword h2', 'あとがきの見出し'],
        ['.afterword p', 'あとがき本文'],
      ],
    },
  ],
};

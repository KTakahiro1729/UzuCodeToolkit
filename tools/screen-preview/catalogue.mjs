// What every work's numbered screen catalogue shares (docs/screen-preview.md, "Catalogue of a
// work"): the marks screens are found by, the toolkit screens' numbered parts, steps that put the
// game in a phase, and catalogue(), which checks the screens' numbers and joins the parts. A work
// keeps only its own screens (`shots.mjs`) and the parts of its own games.

/** Marks the default screens carry (see FooterActions, TopBand and ReadThrough). */
export const PHASE = '[data-uzu-phase]';
export const MAIN = '[data-uzu-actions="main"]';
export const SCROLL = '[data-uzu-scroll]';
/** The button that moves the game on, in whichever seat's screen has it. */
export const NEXT = `${MAIN} button:not([disabled])`;
/** A button by its exact label. */
export const btn = (text) => `button:text-is("${text}")`;

/**
 * The toolkit screens' numbered parts. A number is a part's position in the list, so a part is
 * only ever added at the end, and a work's own parts come after them (`catalogue`).
 */
export const PARTS = [
  ['main', '画面の外枠'],
  ['header', '上の帯'],
  [PHASE, '場面名'],
  ['header .roles', '役の並び'],
  ['header .who:last-child', '自分の役（アイコン＋名前）'],
  ['header .who img', '役アイコン'],
  ['header .check', '済みのチェック'],
  ['footer', 'フッター'],
  ['footer .act', 'メインボタンの列'],
  [`${MAIN} button:last-child`, 'メインボタン'],
  [`${MAIN} button:first-child`, '控えめなボタン'],
  ['footer nav', '読み返しタブの列'],
  ['footer nav .tab', '読み返しタブ'],
  ['.guide', 'ガイド文'],
  ['.cast .text', '作品の紹介文'],
  ['.cast .you', 'あなたは〜を演じます'],
  ['.cast .parts', '役の一覧'],
  ['.cast .parts li', '役の行'],
  ['.cast .parts li img', '役の行のアイコン'],
  ['.cast .parts li .about', '役の説明'],
  ['.read', '会話とボタンの列'],
  ['.chat', '会話の列'],
  ['.chat li .name', '話者名'],
  ['.chat li p', '吹き出し'],
  ['.tabs', 'HOのタブ'],
  ['.tabs .dot', '未記入の印'],
  ['.panel', 'HOの本文'],
  ['.panel h2', 'HOの見出し'],
  ['.fields', '設定の欄'],
  ['.fields label', '設定の項目'],
  ['.fields textarea', '設定の入力欄'],
  ['.fields .value', '設定の記入済みの値'],
  ['.fields .optional', '任意の印'],
  ['.clock', '残り時間'],
  ['.reopen', 'HOに戻るボタン'],
  ['section:has(> .head)', 'シート'],
  ['.head', 'シートの見出し'],
  ['.head button', 'シートの閉じる'],
  ['section ol', 'ゲームの流れの一覧'],
  ['section ol li', 'ゲームの流れの行'],
  ['.empty', '空の場面'],
  ['.list', 'ゲーム一覧'],
  ['.list li', 'ゲームの行'],
  ['.list li .name', 'ゲーム名'],
  ['.list li .about', 'ゲームの説明'],
  ['.playing', '遊んでいるゲーム'],
  ['footer .opts', 'フッターの下段'],
  ['footer .opts .status', '下段の状態表示'],
  ['header .phase .more', '場面名の矢印'],
];

/**
 * Steps that put the game in a phase without playing up to it.
 * `ids`: the work's phase IDs in order; `parts`: seat -> part; `past`: each phase's state once it
 * is over; `fresh`: each phase's state as the game enters it (a phase missing from either is not
 * used as one). Each returns a step for a screen's `steps`.
 */
export function flowSteps({ ids, parts, past, fresh }) {
  /** The game in phase `id`, earlier phases over; `own` replaces its state. */
  const at = (id, own, { reopenable = false } = {}) => ({
    state: () => {
      const i = ids.indexOf(id);
      if (i < 0) throw new Error(`no phase ${id}`);
      const phases = Object.fromEntries(ids.slice(0, i).map((p) => [p, past[p]]));
      phases[id] = own ?? fresh[id];
      return { parts, at: i, phases, ended: false, reopenable };
    },
    wait: 1500,
  });
  return {
    at,
    /** `at`, then the screen loaded afresh, as a player joining now sees it. */
    jump: (...a) => [at(...a), { reload: true }],
    /** Changes one phase's state: `fn` gets it and returns the new one. */
    patch: (id, fn) => ({
      state: (s) => ({ ...s, phases: { ...s.phases, [id]: fn(s.phases[id]) } }),
      wait: 1200,
    }),
  };
}

/**
 * The config for capture.mjs. `screens`: `[key, label, seat, steps]` in order, `key` starting with
 * its two-digit number ("07-handout-own"). Numbers must run 01, 02, ... without gaps or repeats:
 * they are what the owner points at, so a screen is added at the end and never renumbered. A
 * screen's parts are the toolkit's (PARTS) and then the work's own `parts`; steps may be nested
 * (a helper returning several) and are flattened.
 */
export function catalogue({ title, player = 0, parts = [], screens }) {
  screens.forEach(([key], i) => {
    const want = String(i + 1).padStart(2, '0');
    if (!key.startsWith(`${want}-`)) throw new Error(`screen ${i + 1} must be keyed "${want}-...", got "${key}"`);
  });
  const all = [...PARTS, ...parts];
  return {
    title,
    player,
    next: NEXT,
    scroll: [SCROLL],
    screens: screens.map(([key, label, seat, steps]) => ({ key, label, seat, steps: steps.flat(), parts: all })),
  };
}

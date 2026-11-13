// What every work's numbered screen catalogue shares (docs/screen-preview.md, "Catalogue of a
// work"): the marks screens are found by, the toolkit screens' numbered parts, steps that put the
// game in a phase, and catalogue(), which checks the screens' numbers and joins the parts. A work
// keeps only its own screens (`shots.mjs`) and the parts of its own games.

/** Marks the default screens carry (see FooterActions, TopBand and ReadThrough). */
export const PHASE = '[data-uzu-phase]';
export const MAIN = '[data-uzu-actions="main"]';
export const SCROLL = '[data-uzu-scroll]';
/**
 * A part of a toolkit screen. `data-uzu-part` holds one or more names ("slot tab"), so a part is
 * found by name, never by class.
 */
export const part = (name) => `[data-uzu-part~="${name}"]`;
/** The button that moves the game on, in whichever seat's screen has it. */
export const NEXT = `${MAIN} button:not([disabled])`;
/** A button by its exact label. */
export const btn = (text) => `button:text-is("${text}")`;

/**
 * The toolkit screens' numbered parts. A number is a part's position in the list, so a part is
 * only ever added at the end, and a work's own parts come after them (`catalogue`). The four
 * marked "no longer drawn" are kept for their number; a part that is not on a screen is left out.
 */
export const PARTS = [
  [part('main'), '画面の外枠'],
  [part('header'), '上の帯'],
  [PHASE, '場面名'],
  [part('roles'), '役の並び'],
  [part('role-own'), '自分の役（アイコン＋名前）'],
  [part('role-icon'), '役アイコン'],
  [part('role-check'), '済みのチェック'],
  [part('footer'), 'フッター'],
  [part('footer-row'), 'メインボタンの列'],
  [`${MAIN} button:last-child`, 'メインボタン'],
  [`${MAIN} button:first-child`, '控えめなボタン'],
  [part('footer-tabs'), '読み返しタブの列'],
  [part('tab'), '読み返しタブ'],
  [part('guide'), 'ガイド文'],
  [part('cast-text'), '作品の紹介文'],
  [part('cast-you'), 'あなたは〜を演じます（今は描かない）'],
  [part('cast-parts'), '役の一覧'],
  [part('cast-row'), '役の行'],
  [part('cast-icon'), '役の行のアイコン'],
  [part('cast-about'), '役の説明'],
  [part('read'), '会話とボタンの列'],
  [part('chat'), '会話の列'],
  [part('speaker'), '話者名'],
  [part('bubble'), '吹き出し'],
  [part('tabs'), 'HOのタブ'],
  [part('tab-dot'), '未記入の印'],
  [part('panel'), 'HOの本文'],
  [part('panel-title'), 'HOの見出し'],
  [part('fields'), '設定の欄'],
  [part('field'), '設定の項目'],
  [part('field-input'), '設定の入力欄'],
  [part('field-value'), '設定の記入済みの値（今は描かない）'],
  [part('field-optional'), '任意の印'],
  [part('clock'), '残り時間'],
  [part('reopen'), 'HOに戻るボタン'],
  [part('sheet'), 'シート'],
  [part('sheet-head'), 'シートの見出し'],
  [`${part('sheet-head')} button`, 'シートの閉じる'],
  [part('flow-list'), 'ゲームの流れの一覧'],
  [part('flow-row'), 'ゲームの流れの行'],
  [part('empty'), '空の場面'],
  [part('list'), 'ゲーム一覧'],
  [part('list-row'), 'ゲームの行'],
  [part('list-name'), 'ゲーム名'],
  [part('list-about'), 'ゲームの説明'],
  [part('playing'), '遊んでいるゲーム'],
  [part('footer-opts'), 'フッターの上の行（古い形の状態の行。今は描かない）'],
  [part('footer-status'), '上の行の状態表示（今は描かない）'],
  [part('phase-more'), '場面名の矢印'],
  [`${part('footer')} ${part('slot')}`, 'フッターの項目（延長・読み返し・残り時間）'],
  [`${part('footer')} ${part('note')}`, 'ボタンの中の一文'],
];

/**
 * What each toolkit phase's state is when it is over, when the game enters it, and the few
 * states in between a screenshot needs, so a work's shots never write a state by hand. Each
 * mirrors the phase's own `setup` and `done` (a test in packages/reader checks them against the
 * phases). Pass the results to `flowSteps` as `past` and `fresh`, or to a screen's steps.
 */
export const states = {
  /** `readyPhase()`: the introduction that waits for everyone. */
  ready: {
    fresh: (seats) => ({ ready: [], seats: [...seats] }),
    over: (seats) => ({ ready: [...seats], seats: [...seats] }),
  },
  /** `readThroughPhase(script)`: `lineCount` lines. */
  dialogue: {
    /** As the game enters it, on the first line. */
    fresh: () => ({ index: 0, finished: false }),
    /** On the last line, not yet advanced past. */
    lastLine: (lineCount) => ({ index: lineCount - 1, finished: false }),
    over: (lineCount) => ({ index: lineCount - 1, finished: true }),
  },
  /** `handoutLogic(...)`: `values` is part -> setting -> value. */
  handout: {
    /** Everyone has finished before the time ran out. */
    over: ({ seats, values }) => ({
      endsAt: 0,
      pausedAt: null,
      timeUp: false,
      ready: Object.fromEntries(seats.map((s) => [s, true])),
      values,
    }),
    /** The time ran out; `readySeats` are the seats that had finished. */
    timeUp: (state, readySeats) => ({
      ...state,
      timeUp: true,
      ready: Object.fromEntries(Object.keys(state.ready).map((s) => [s, readySeats.includes(s)])),
    }),
  },
  /** `emptyPhase()`: a phase moved on with `next`. */
  empty: {
    fresh: () => ({ next: false }),
    over: () => ({ next: true }),
  },
  /** `gameSelectPhase(...)`: the list, and the list left by `next`. */
  gameSelect: {
    fresh: () => ({ game: null, play: null, players: null, next: false }),
    over: () => ({ game: null, play: null, players: null, next: true }),
  },
};

/**
 * Steps that put the game in a phase without playing up to it.
 * `ids`: the work's phase IDs in order; `parts`: seat -> part; `past`: each phase's state once it
 * is over; `fresh`: each phase's state as the game enters it (a phase missing from either is not
 * used as one). Each returns a step for a screen's `steps`.
 */
export function flowSteps({ ids, parts, past, fresh }) {
  /** The game in phase `id`, earlier phases over; `own` replaces its state. */
  const at = (id, own, { reopenable = false } = {}) => ({
    // `fresh`: replaces the whole state, so the screens before it do not matter (capture.mjs --jobs).
    fresh: true,
    state: () => {
      const i = ids.indexOf(id);
      if (i < 0) throw new Error(`no phase ${id}`);
      const phases = Object.fromEntries(ids.slice(0, i).map((p) => [p, past[p]]));
      phases[id] = own ?? fresh[id];
      return { parts, at: i, phases, ended: false, reopenable };
    },
  });
  return {
    at,
    /** `at`, then the screen loaded afresh, as a player joining now sees it. */
    jump: (...a) => [at(...a), { reload: true }],
    /** Changes one phase's state: `fn` gets it and returns the new one. */
    patch: (id, fn) => ({
      state: (s) => ({ ...s, phases: { ...s.phases, [id]: fn(s.phases[id]) } }),
    }),
    /** Changes the state of the game being played in the game-select phase `id`: `fn` gets it and returns the new one. */
    play: (id, fn) => ({
      state: (s) => ({ ...s, phases: { ...s.phases, [id]: { ...s.phases[id], play: fn(s.phases[id].play) } } }),
    }),
    /** Puts the handout phase `id` in the state where the time ran out (`states.handout.timeUp`). */
    handoutTimeUp: (id, readySeats) => ({
      state: (s) => ({ ...s, phases: { ...s.phases, [id]: states.handout.timeUp(s.phases[id], readySeats) } }),
    }),
  };
}

/**
 * A screen for each phase of a work, so a work gets its shots without writing one by hand. Each
 * phase is `{ id, kind, label?, lines? }`, where `kind` is the toolkit phase it is made of:
 * `ready`, `dialogue` (a read-through; `lines` is its line count), `handout`, `empty` or
 * `gameSelect`. A phase of any other kind (a work's own) is skipped: write its screens by hand.
 *
 * What is shot of a phase is the work's to choose: `only` lists the phase IDs to shoot (default
 * all), and `shots` says which states of a phase (default below), by phase ID. A state is
 * `start` (as the game enters the phase), `last` (a read-through's last line) or `done` (everyone
 * has finished; a handout has no `start`, since its clock starts when the game does).
 *
 *   ready, empty, gameSelect: start      dialogue: start, last      handout: done
 *
 * Returns screens (`[key, label, seat, steps]`) numbered from `from`. Numbers are fixed once the
 * owner has seen them: a phase added later goes at the end of the work's list, never in the middle.
 * `seats`: seat IDs; `parts`: seat -> part; `values`: part -> setting -> value of the handouts.
 */
export function phaseScreens({ phases, seats, parts, values = {}, seat = 0, from = 1, only, shots = {} }) {
  const DEFAULT = { ready: ['start'], dialogue: ['start', 'last'], handout: ['done'], empty: ['start'], gameSelect: ['start'] };
  const KINDS = Object.keys(DEFAULT);
  const known = phases.filter((p) => KINDS.includes(p.kind));
  const past = {};
  const fresh = {};
  for (const p of known) {
    const st = states[p.kind];
    past[p.id] = p.kind === 'dialogue' ? st.over(p.lines) : p.kind === 'handout' ? st.over({ seats, values }) : st.over(seats);
    if (p.kind !== 'handout') fresh[p.id] = p.kind === 'dialogue' ? st.fresh() : st.fresh(seats);
  }
  // Phases of other kinds count as over (an empty state a work's own phase never reads here).
  for (const p of phases) if (!(p.id in past)) past[p.id] = {};
  const { jump } = flowSteps({ ids: phases.map((p) => p.id), parts, past, fresh });
  const out = [];
  for (const p of known) {
    if (only && !only.includes(p.id)) continue;
    for (const shot of shots[p.id] ?? DEFAULT[p.kind]) {
      if (shot === 'start' && !(p.id in fresh)) throw new Error(`phase ${p.id} (${p.kind}) has no start state to shoot`);
      const own = shot === 'last' ? states.dialogue.lastLine(p.lines) : shot === 'done' ? past[p.id] : undefined;
      if (shot === 'last' && p.kind !== 'dialogue') throw new Error(`phase ${p.id} (${p.kind}) has no last line`);
      const n = String(from + out.length).padStart(2, '0');
      out.push([`${n}-${p.id}-${shot}`, `${p.label ?? p.id} (${shot})`, seat, jump(p.id, own)]);
    }
  }
  return out;
}

/**
 * The config for capture.mjs. `screens`: `[key, label, seat, steps]` in order, `key` starting with
 * its two-digit number ("07-handout-own"). Numbers must run 01, 02, ... without gaps or repeats:
 * they are what the owner points at, so a screen is added at the end and never renumbered. A
 * screen's parts are the toolkit's (PARTS) and then the work's own `parts`; steps may be nested
 * (a helper returning several) and are flattened.
 */
export function catalogue({ title, player = 0, orientation, parts = [], screens }) {
  screens.forEach(([key], i) => {
    const want = String(i + 1).padStart(2, '0');
    if (!key.startsWith(`${want}-`)) throw new Error(`screen ${i + 1} must be keyed "${want}-...", got "${key}"`);
  });
  const all = [...PARTS, ...parts];
  return {
    title,
    player,
    // `both` for a work that serves both orientations; otherwise the manifest's decides what --check looks at.
    orientation,
    next: NEXT,
    scroll: [SCROLL],
    screens: screens.map(([key, label, seat, steps, reach]) => ({ key, label, seat, steps: steps.flat(), reach, parts: all })),
  };
}

# Screen preview

A page that shows a sample's screens in landscape (844×390) and portrait
(390×844) side by side, with every part numbered, so the owner can point at a
part in one line ("縦 4番の間隔を狭く") from the chat. It is built from the real
screens in the dev harness (their DOM, CSS, fonts and images), not redrawn.
Tapping a number outlines that part in both orientations and lists its size,
margin, padding, gap and font size in px and em.

Use it whenever a thread shows UI to the owner: publish the page as an
Artifact next to the screenshots, and republish to the same link after each
change.

## Make one

1. Start the sample's harness (`npm run harness` in its folder).
2. Run, from the repo root:

   ```bash
   node tools/screen-preview/capture.mjs samples/yubiwa out.html
   ```

   `--size lower|device|wide|reference` picks the screen size: certification's three (780×360, 844×390 (the
   default), 1194×834) or UZU's design guide size (874×402), which is none of them. A screen built on the guide
   is looked at in `reference` and checked in all four.

   It needs Playwright with Chromium where it runs (the cloud container has it;
   elsewhere `npx playwright install chromium`). `HARNESS` overrides the
   harness URL (default `http://localhost:10001`). The output defaults to
   `screen-preview.html` in the temp folder.
3. Publish `out.html` as an Artifact.

The page is a still: nothing on it advances the game, and it does not follow
code changes until it is captured again.

## Config

The samples share the read-through screens, so they share one config,
[`packages/reader/preview.config.mjs`](../packages/reader/preview.config.mjs).
A sample with screens of its own puts a `preview.config.mjs` in its folder
instead. `next` and `scroll` find the screens by three marks every screen and
shell keeps, so they work after the screens are replaced: `data-uzu-actions="main"`
on the main actions (`FooterActions` sets it), `data-uzu-phase` on the phase name
and `data-uzu-scroll` on a list that scrolls. The numbered `parts` may use any
selector of the work's own markup. The title comes from the sample's `script.json` unless the config
sets one.

| Key | Meaning |
|---|---|
| `title` | Optional: the work's name, shown in the page title |
| `player` | Whose screen to capture (harness player index) |
| `next` | Selector tapped to move the game on, in whichever player's screen has it |
| `scroll` | Selectors of lists to show scrolled to the end |
| `screens` | In order: `key`, `label`, `seat` (whose screen to capture, default `player`), `taps` (taps of `next` since the previous screen; `Infinity` taps to the end), `steps` (run after the taps, below), `wait` (ms to wait after them; by default the capture waits until the screen is still), `parts` |
| `parts` | Optional: `[selector, label]` pairs; the number is the position, and parts not on a screen are left out of its list. The last match on screen is numbered |
| `variants` | Optional pickers for trying layouts on the page: `{ name, options: [{ label, note, css }] }`. The `css` is added to both screens |

### Steps

A screen's `steps` get the game to it: open a tab or a sheet, type into a
field, press a button in another player's screen, or set the state outright.
Each step is an object with one action, in the seat given by `seat` (harness
player index; default the screen's seat). Selectors are Playwright selectors,
so `button:has-text("読み終えた")` works too.

| Step | Does |
|---|---|
| `{ click: sel }` | Waits for `sel` to show, then clicks it |
| `{ fill: sel, text }` | Types `text` into the field `sel` |
| `{ waitFor: sel }` | Waits for `sel` to show |
| `{ tap: n }` | Taps `next` n times, as `taps` does |
| `{ state: s => newState }` | Sets the game state through the harness (`setRawState`); the function gets the current state. A plain object replaces it |
| `{ reload: true }` | Reloads the seat's screen from the current state, as a player joining now sees it |
| `{ wait: ms }` | Waits that long (for a real delay in the game, such as a timer; nothing else needs it) |

After every step the capture waits until that seat's screen is still (fonts loaded, no DOM change
for 120 ms, two frames drawn), after a click or a state change also one round trip to the harness; it
sleeps only when a step or screen gives `wait`. A step followed by one that waits for its own element (click, fill, waitFor) skips the wait. A step waits up to 15 s for its element and looks the seat's screen up again each
time, so a screen that reloads (after a reset or a resize) does not make it
miss. Use `state` to start a screen deep in the game instead of playing up to
it.

The stage read-through (UZU's layout) has its own list,
[`packages/reader/preview.stage.config.mjs`](../packages/reader/preview.stage.config.mjs); pass it with `--config`.

A shot list for one piece of work can live in its own file next to the
sample and be passed with `--config`, leaving the shared config alone. See
[`samples/hundred-arms/shots.example.mjs`](../samples/hundred-arms/shots.example.mjs).

Name parts the way the owner talks about them. Keep numbers stable between
captures, so add new parts at the end.

## Catalogue of a work

A work with many screens keeps one numbered list of all of them, so the owner can say "画面 11 の 12番".
[`catalogue.mjs`](../tools/screen-preview/catalogue.mjs) holds what every work shares; the work
keeps a `shots.mjs` with its own screens and the parts of its own games.

```js
import { btn, catalogue, flowSteps, NEXT, states } from './toolkit/tools/screen-preview/catalogue.mjs';
const { at, jump, patch, play } = flowSteps({ ids, parts, past, fresh }); // past: { intro: states.ready.over(seats), … }
export default catalogue({
  title: '…',
  player: 1,
  parts: [['.board', 'chess: board']], // the work's own parts, numbered after the toolkit's
  screens: [
    ['01-intro', 'はじめに', 1, [{ reload: true }, { waitFor: btn('次へ') }]],
    ['02-opening', 'オープニング', 1, [jump('opening', states.dialogue.lastLine(lines.length))]],
  ],
});
```

```bash
cd toolkit && node tools/screen-preview/capture.mjs --config ../shots.mjs .. ../screen-preview.html
```

- A screen is `[key, label, seat, steps]`. Its key starts with its number (`07-…`). The numbers run
  01, 02, … with no gap or repeat (`catalogue` throws otherwise). They are fixed: a new screen goes
  at the end and nothing is renumbered, so the owner's earlier references stay true.
- The same goes for parts: `PARTS` (the toolkit's screens) only ever grows at the end, and a work's own
  parts come after them. Every screen lists the same parts, so a number means the same part on every
  screen; a part not on a screen is left out of its list.
- Screens are reached by clicking (`click`, `fill`, `tap`) or, for a state that takes long to play to, by
  setting the game state: `at(id, state)` puts the game in a phase with the earlier ones over, `jump`
  adds a `reload`, `patch(id, fn)` changes one phase's state, `play(id, fn)` the state of the game being
  played in a game-select phase. A work never writes a toolkit phase's state itself: `states` has
  what each toolkit phase looks like fresh, over and in between (`states.ready`, `.dialogue`,
  `.handout`, `.empty`, `.gameSelect`), and a test keeps them equal to the phases.
- Find parts by the marks the default screens carry (`PHASE`, `MAIN`, `SCROLL`: `data-uzu-*`, and
  `data-uzu-part` names such as `part('footer-row')`), not by class names. A new part of a toolkit
  screen gets a `data-uzu-part` name and an entry at the end of `PARTS`.

## One pass, limits and trial runs

`--check`, `--png <dir>` and the page are all made in one pass: each screen is played once, and in
each orientation the overflow check, the PNG and the snapshot are taken one after the other.
The page is written when no mode is given or when `out.html` is. Keep a run short while
trying something:

- `--only 01,05` (screen numbers or keys) plays just those screens, steps included, so a screen
  that builds on the one before it must be listed with it, or set up by `state`.
- `--step-timeout <s>` (default 15) caps a step and the wait for its element; `--timeout <s>` (default
  600) caps the whole run. Either one stops the run, names the screen and step it was on, and exits
  non-zero (2 for the whole-run cap).
- `--jobs <n>` plays independent runs of screens at the same time (see "Parallel runs").
- `--times` prints the time spent per screen and per kind of work (settling, steps, resize, PNG, snapshot, check).
- Try 1 screen, then a few, then all, under `timeout 60` or the like.

## Parallel runs

`--jobs n` plays the screens on n workers, each a page on a harness of its own (the harness keeps
one shared game, so workers cannot share one). Start n harnesses (each picks the next free port:
10001, 10002, ...), a few seconds apart, then run with `--jobs n`. `HARNESS` may list their URLs,
comma separated; missing ones are the last port + 1, + 2, ... The run stops at once, naming them,
if one is not there.

```bash
for i in 1 2 3 4; do (npm run harness > /dev/null 2>&1 &); sleep 5; done
node tools/screen-preview/capture.mjs --jobs 4 --png tmp/shots --config shots.mjs .
```

- The screens are split into runs. A screen whose steps include a `fresh` step starts a new run: a
  state step that replaces the whole state (a catalogue's `at` and `jump` are marked; a `state` step
  that is a plain object counts too). What came before it does not matter, so a run can be played on
  any worker. Screens without one continue the screen before and stay in its run.
- A run that starts fresh starts from the game's start: the harness is reset with a fixed numeric seed
  (the harness ignores any other seed), so the cards dealt do not depend on which screens were
  played before, and the seats' frames are back at their grid size. The steps and taps before the
  `fresh` step are skipped. This is so in every run, `--jobs 1` included, so the result is the same
  for any number of jobs (PNGs byte for byte, the page but for a running clock's digits).
- Runs go to workers longest first. A work with few runs gains little; mark screens that are
  independent by starting them with `jump` / `at`.
- Workers share the machine's CPU: on 4 cores, 4 workers were barely faster than 2.

## PNG screenshots

```bash
node tools/screen-preview/capture.mjs --png tmp/shots --config samples/hundred-arms/shots.example.mjs samples/hundred-arms
```

writes `<key>-landscape.png` and `<key>-portrait.png` for each screen into
`tmp/shots/` (git ignores `tmp/`), at twice the pixels, with the UZU HUD drawn over the screen as in
the harness. `--config` works with every mode.

## Check for overflow

```bash
node tools/screen-preview/capture.mjs --check samples/yubiwa
```

walks the same screens in both orientations, writes no page, and lists what
spills over ([`overflow.js`](../tools/screen-preview/overflow.js)), exiting 1
if anything does:

| Kind | Means |
|---|---|
| `screen` | A box runs past the viewport |
| `inset` | Text or an image sits under the safe area or the UZU HUD (backgrounds may reach under them) |
| `parent` | A box runs past its parent, or text past its own box, where they show overflow |
| `clipped` | An element that hides overflow cuts its content off, or a scroll list runs sideways |

The check looks at the orientation the work's `manifest.json` fixes (`orientation`): the app holds a
phone to it, so the other one is never played, and certification's size table is read in that
orientation's column. A work that serves both says so with `orientation: 'both'` in its shots config
(or `--orientation both` on the command line); `--orientation landscape|portrait` picks one.

`--size all` checks certification's three sizes (lower, device, wide) in one run; `--size
device,reference` names the sizes. For a portrait work it adds `desktop` (1280×720, landscape): a PC
window has any shape, and a portrait work may be opened wide, so it should hold a column in the
middle (`max-width` and centring). Lines then read `<screen> <size> <orientation>`. Certification asks
for all three sizes, and a check at one size does not prove the others.

Each line gives the side, how many px it is out by, the element and the start
of its text. Inside a scroll list only the list itself has to fit. Mark an
element `data-overflow-ok` where spilling over is meant; the check skips it and
everything in it. An element that only reaches past its parent on purpose (a sheet's
panel) takes `data-overflow-parent-ok` instead: only the parent check skips it, and its
size against the screen, the safe area and its content are still checked. It sees only the screens and the text the config reaches, so
run it on every sample after a layout change.

The overflow check cannot see a button that is cut off inside a scroll area, since
it skips what is scrolled out of view. A screen can therefore list the actions that
must be pressable as it stands: the fifth item of a `catalogue()` screen is a list
of selectors (`[key, label, seat, steps, [btn('これで勝負')]]`). In `--check`, each
is reported as `unreachable` if it is missing, past the viewport, or covered or
cut off (what is hit at its centre is not the element), in both orientations.

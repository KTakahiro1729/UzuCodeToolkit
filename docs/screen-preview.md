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
| `screens` | In order: `key`, `label`, `seat` (whose screen to capture, default `player`), `taps` (taps of `next` since the previous screen; `Infinity` taps to the end), `steps` (run after the taps, below), `wait` (ms to wait after them, default 800), `parts` |
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
| `{ wait: ms }` | Waits |

Every step waits 300 ms after it (`wait` on any step changes that). A step
waits up to 10 s for its element and looks the seat's screen up again each
time, so a screen that reloads (after a reset or a resize) does not make it
miss. Use `state` to start a screen deep in the game instead of playing up to
it.

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
import { btn, catalogue, flowSteps, NEXT } from './toolkit/tools/screen-preview/catalogue.mjs';
const { at, jump, patch } = flowSteps({ ids, parts, past, fresh });
export default catalogue({
  title: '…',
  player: 1,
  parts: [['.board', 'chess: board']], // the work's own parts, numbered after the toolkit's
  screens: [
    ['01-intro', 'はじめに', 1, [{ reload: true }, { waitFor: btn('次へ') }]],
    ['02-opening', 'オープニング', 1, [jump('opening', { index: 79, finished: false })]],
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
  adds a `reload`, `patch(id, fn)` changes one phase's state.
- Find parts by the marks the default screens carry (`PHASE`, `MAIN`, `SCROLL`: `data-uzu-*`), not by
  class names.

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

Each line gives the side, how many px it is out by, the element and the start
of its text. Inside a scroll list only the list itself has to fit. Mark an
element `data-overflow-ok` where spilling over is meant; the check skips it and
everything in it. It sees only the screens and the text the config reaches, so
run it on every sample after a layout change.

The overflow check cannot see a button that is cut off inside a scroll area, since
it skips what is scrolled out of view. A screen can therefore list the actions that
must be pressable as it stands: the fifth item of a `catalogue()` screen is a list
of selectors (`[key, label, seat, steps, [btn('これで勝負')]]`). In `--check`, each
is reported as `unreachable` if it is missing, past the viewport, or covered or
cut off (what is hit at its centre is not the element), in both orientations.

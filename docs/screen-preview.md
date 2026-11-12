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
instead. The title comes from the sample's `script.json` unless the config
sets one.

| Key | Meaning |
|---|---|
| `title` | Optional: the work's name, shown in the page title |
| `player` | Whose screen to capture (harness player index) |
| `next` | Selector tapped to move the game on, in whichever player's screen has it |
| `scroll` | Selectors of lists to show scrolled to the end |
| `screens` | In order: `key`, `label`, `taps` (taps of `next` since the previous screen; `Infinity` taps to the end), `wait` (ms to wait after them, default 800), `parts` |
| `parts` | `[selector, label]` pairs; the number is the position, and parts not on a screen are left out of its list. The last match on screen is numbered |
| `variants` | Optional pickers for trying layouts on the page: `{ name, options: [{ label, note, css }] }`. The `css` is added to both screens |

Name parts the way the owner talks about them. Keep numbers stable between
captures, so add new parts at the end.

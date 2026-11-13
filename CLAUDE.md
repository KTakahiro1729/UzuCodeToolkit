# CLAUDE.md

Toolkit for making murder-mystery games with UZU Code (`run()` from `@uzuhq/code-sdk`). Docs: https://docs.code.uzu-app.com/

## Design policy

Read [docs/design.md](docs/design.md) before any UI work: the short list of rules every screen follows. Then read only the component spec in `docs/design/` for the part you change (the index is at the end of design.md). Do not read the other specs.

## Language

Write code, comments, docs, tests and error messages in English. UI strings come only from keys or data. Japanese goes into the repo only as content (the script and UI string data), rule text from specs, or proper nouns. Docs state the owner's intent in English; do not quote the owner.

## Layout (npm workspaces)

| Path | Role |
|---|---|
| `packages/kit` | UI-independent helpers: phases (`flowLogic`, `emptyPhase`), read-through (`advanceDialogue` etc.), casting (`partsOf`, `assignParts`), ruby (`parseRuby`), the game-select phase (`gameSelectPhase`), playing cards (`deck`, `deal`), timers (`secondsLeft`, `formatClock`), votes (a `Ballot` kept in state: `ballot`, `castVote`, `ballotClosed`; counting: `tally`, `soleTop`) and a phase that waits for everyone (`readyPhase`). Called from both server actions and the view |
| `packages/reader` | The screens (Svelte 5): the frame with the top band, phase screens (`ReadThroughView`, `EmptyView`, `CastView`, `HandoutView`, `HandoutReviewView`, `GameSelectView`), parts for any screen (`Button`, `TimeLeft`, `Guide`, `Vote`; playing cards as `PlayingCard` from `@uzu-toolkit/reader/cards`) the client entry (`startFlow`, `startReader`), the pieces a work's own shell is made of (`game`, `sendAction`, `FooterActions`, `Frame`, `TopBand`, `Sheet`; Replacing the screens below); the read-through phase (`readThroughPhase`), script format (`src/script.ts`), theme, UI strings and dev harness |
| `samples/hundred-arms` | Sample work 百本腕と勇者. Two players |
| `samples/yubiwa` | Sample work 指環 (江戸川乱歩, Aozora Bunko). Two players |
| `samples/mittsu-no-takara` | Sample work 三つの宝 (芥川龍之介, Aozora Bunko). Three players, two of them doubling roles |

A sample is its manifest, script, icons and font subsets; `src/main.ts` and `src/logic.ts` only hand its script to `packages/reader`. A work with more than a read-through strings phases together (Phases below).

## Players and parts

UZU documents no upper limit on players (`playerCount` is an integer of 1 or more; `characters` overrides it). The code takes any count. Each seat plays a part (a manifest character); a part reads one or more roles (script speakers), listed in `script.json` `parts`. Without `parts`, each cast entry is its own part. A line spoken together lists several speakers; the first reads it. Stage directions are lines of a cast entry with `direction: true`.

## Phases

A work is a fixed list of phases in order (opening read-through, handouts, a game, the post-game screen). Each phase is a `PhaseLogic` (`packages/kit/src/flow.ts`): `setup` when the game enters it, `actions` (and `serverActions`), `done`, and an optional `deadline`. The work's logic (`src/logic.ts`, the manifest's `serverActionLogicPath`) is `flowLogic(phases, partIds)`; shared state is `FlowState`: seat parts, the current phase `at`, each entered phase's state, and `ended`. A phase's actions are sent as `${phaseId}:${name}`; an action of any phase but the current one is rejected. After each action or deadline, the game moves past phases that are done; when the last one is done, `ended` turns true and the client calls `gameEnded()`.

The client entry (`src/main.ts`) calls `startFlow(logic, { parts, phases, orientation })`, giving each phase, in the logic's order, a band label (the text itself), a screen and optional extra `props`. A phase screen gets `PhaseViewProps` (`packages/reader/src/flow.ts`). `readThroughPhase(script)` with `ReadThroughView` (`props: { script }`) is a read-through; `emptyPhase()` with `EmptyView` holds the place of a phase not made yet. A work of more than one phase gets a footer with the phase list; a phase view with `keep` (such as `handoutKeep` for `HandoutView`) adds a footer entry that reads that phase back once the game has left it. A sample is one read-through phase: `readThroughLogic(script)` and `startReader(script, logic, orientation)`.

## Replacing the screens

A work changes its look without a toolkit change. Find the smallest piece below that covers the request; each is a plain Svelte file or option in the work, never a toolkit prop.

| The request | Change |
|---|---|
| Colours, fonts, radii, band and footer heights | The work's `theme.css` tokens (the toolkit's `theme.css` lists them) |
| Wording of any toolkit button or label | `startFlow(..., { strings: { 'button.back': '...' } })`; keys are in `packages/reader/src/strings.json` |
| One phase's screen | Its `view` in the work's `main.ts`: any Svelte component taking `PhaseViewProps`. Put its main actions in the footer with `FooterActions` |
| The frame (band, footer, sheets) | `startFlow(..., { shell })`: a Svelte component taking `ShellProps`. Copy `FlowApp.svelte` and change it; it reads the state from `game`, sends with `sendAction(phaseAction(id, name), payload)` and may reuse `Frame`, `TopBand`, `Sheet`, `PhaseList`. Call `provideFlow(() => ({ phases, at, ended }))` (as `FlowApp` does) if a screen shows `FlowStrip`, which reads the phase list from it |
| The read-through on UZU's design guide layout (standing characters, one frame, a log) | `{ view: ReadThroughView, props: { script, screen: StageReadThrough } }` with `StageReadThrough` from `@uzu-toolkit/reader/stage`; pictures are `public/assets/stand-<role>.webp`; add the `stage.*` and `log.*` strings to the work's `fonts.config.json` |
| A feature of an existing phase (handout keep, ready checks) | `handoutScreen(handouts, props)` and `castScreen(props)` carry the wiring; spread them into the phase |

The dev harness and the screen preview find the main action, the phase name and the scrolling list by three marks: `data-uzu-actions="main"` (set by `FooterActions`), `data-uzu-phase` and `data-uzu-scroll`. A custom shell or screen keeps them (docs/screen-preview.md). The logic tests, the work's flow test and the build-size test do not depend on the screens.

Add to the toolkit only what the work cannot do with the pieces above, and only if it prevents a mistake no eye can see on the screen or a second work uses it (docs/decisions: the-toolkit-takes-what-prevents-an-error-no-eye-can-see).

## Commands (from the repo root)

| Purpose | Command |
|---|---|
| Install | `npm ci` (npm 10's `npm install` without a lockfile can crash; use npm 11) |
| Unit tests | `npm test` |
| Types | `npm run typecheck` |
| CSS lint (no outer `margin`; see docs/design.md Layout) | `npm run lint` |
| Screen preview: both orientations with numbered parts, a page to publish as an Artifact (docs/screen-preview.md) | `node tools/screen-preview/capture.mjs samples/<name> out.html` while that sample's harness runs |
| Screenshots: PNGs in both orientations, after steps (click, type, set the state) in any player's screen (docs/screen-preview.md) | `node tools/screen-preview/capture.mjs --png <dir> [--config <file>] samples/<name>` while that sample's harness runs |
| Catalogue of a work: every screen numbered, in both orientations, from the work's `shots.mjs` built with `tools/screen-preview/catalogue.mjs` (docs/screen-preview.md) | `cd toolkit && node tools/screen-preview/capture.mjs --config ../shots.mjs .. ../screen-preview.html` in a work while its harness runs |
| Overflow check: what spills past the screen, the safe area, the HUD or its parent, in both orientations (docs/screen-preview.md) | `node tools/screen-preview/capture.mjs --check samples/<name>` while that sample's harness runs |
| Fonts | `npm run fonts` (needs fonttools; rebuilds every sample's subsets) |
| Dev harness | `npm run harness` in a sample's folder (from the root: hundred-arms; `-- --orientation portrait` for portrait), then open `/harness` on the port in the log: the harness with reset, rotate and tap-next buttons (`packages/reader/dev-harness.js`, dev server only) |

`npm run dev` (vite only) does not connect to the SDK; check behaviour in the harness. Hot swap: vite swaps screen code and CSS in place; `npm run harness` (`packages/reader/harness.mjs`) restarts the harness when the server logic changes, and `/harness` puts the game state back.

## Writing code

- What a work does not use must not reach its build. Keep a part that brings files with it (images, such as the playing cards) behind an entry of its own, so a work that never imports it ships none of them.
- Actions run both in client prediction and on the server: keep them deterministic (no random or wall-clock values in state). Reject by throwing.
- Sizes in em, based on the screen's short side. `packages/reader/src/index.ts` exposes the safe area and the UZU HUD as CSS variables (`--safe-*`, `--hud-x`, `--hud-y`).
- Certification (https://docs.code.uzu-app.com/certification): call `firstFrameReady()`, use relative paths, file names only `[A-Za-z0-9_.-]`, no external network access.

## Fonts

Each sample's `src/fonts/` holds two Google Fonts (OFL 1.1) as woff2 subsets of the characters that work shows, declared in its `src/fonts.css`. No CDN: certification forbids external network access.

- Shippori Mincho Regular for story text: title, end mark, afterword, scene headings and lines, ruby included.
- BIZ UDPGothic Regular and Bold for UI text: cast and part names, names the lines use, the work's `notice`, and the read-through's strings in `packages/reader/src/strings.json` (a sample shows no other screen, and every string the subset holds adds weight).

Which files and fields feed each font is the project's `fonts.config.json` (format in the header of `tools/fonts/fonts.mjs`; a work that takes the toolkit as a submodule has its own, and points at wherever the toolkit keeps `strings.json`; a work that overrides strings lists the file holding its overrides as a `ui` source too). A test in each project calls `missingGlyphs` and fails when a subset lacks a glyph. Rebuild when it fails, or in the same pull request that changes those characters, including after editing a read-through string (every project, since `strings.json` is shared). Needs [fonttools](https://github.com/fonttools/fonttools) (`pip install fonttools brotli`):

```bash
npm run fonts                          # every sample
scripts/subset-fonts.sh samples/<name> # one project; a work runs: sh toolkit/scripts/subset-fonts.sh .
```

## Decisions and history

There is no changelog; the merged pull requests are the history (GitHub's generated release notes can list them). Say in the pull request description what a work built on the toolkit has to do after taking the change (a part's props, a string key, a data format, a command, the fonts), or that it has to do nothing.

Owner decisions are one file each in `docs/decisions/` (format in its `README.md`). They give the reason behind a rule; the spec is design.md. Do not read them through: search by word before you change a rule. A pull request that records a decision adds its own file there; it does not edit another file or an index.

## Licenses

- Code: MIT (`LICENSE`)
- Script text (`samples/hundred-arms/script/`): CC BY 4.0, author あろすてりっく (`script/LICENSE.md`). Never change any script's wording; each sample has a test that checks `script.json` against `original.txt`.
- 指環 and 三つの宝 (`samples/yubiwa/script/`, `samples/mittsu-no-takara/script/`): public domain in Japan, from Aozora Bunko (`script/LICENSE.md`).
- Playing cards (`packages/reader/src/cards/`): CC0, Adrian Kennard's SVG deck (`cards/LICENSE.md`).
- Fonts (`samples/*/src/fonts/`): SIL Open Font License 1.1 (`OFL-ShipporiMincho.txt`, `OFL-BIZUDPGothic.txt`)
- The official sample densetsu-no-tantei has no license notice, so do not copy its code.

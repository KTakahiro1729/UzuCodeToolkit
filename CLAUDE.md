# CLAUDE.md

Toolkit for making murder-mystery games with UZU Code (`run()` from `@uzuhq/code-sdk`). Docs: https://docs.code.uzu-app.com/

## Design policy

Read [docs/design.md](docs/design.md) before any UI work. It holds the functional design rules every screen follows.

## Language

Write code, comments, docs, tests and error messages in English. UI strings come only from keys or data. Japanese goes into the repo only as content (the script and UI string data), rule text from specs, or proper nouns. Docs state the owner's intent in English; do not quote the owner.

## Layout (npm workspaces)

| Path | Role |
|---|---|
| `packages/kit` | UI-independent helpers: phases (`flowLogic`, `emptyPhase`), read-through (`advanceDialogue` etc.), casting (`partsOf`, `assignParts`), ruby (`parseRuby`), the game-select phase (`gameSelectPhase`), playing cards (`deck`, `deal`), timers (`secondsLeft`, `formatClock`), vote counting (`tally`, `soleTop`) and a phase that waits for everyone (`readyPhase`). Called from both server actions and the view |
| `packages/reader` | The screens (Svelte 5): the frame with the top band, phase screens (`ReadThroughView`, `EmptyView`, `CastView`, `HandoutView`, `GameSelectView`), parts for any screen (`Button`, `TimeLeft`, `Guide`; playing cards as `PlayingCard` from `@uzu-toolkit/reader/cards`) and the client entry (`startFlow`, `startReader`); the read-through phase (`readThroughPhase`), script format (`src/script.ts`), theme, UI strings and dev harness |
| `samples/hundred-arms` | Sample work 百本腕と勇者. Two players |
| `samples/yubiwa` | Sample work 指環 (江戸川乱歩, Aozora Bunko). Two players |
| `samples/mittsu-no-takara` | Sample work 三つの宝 (芥川龍之介, Aozora Bunko). Three players, two of them doubling roles |

A sample is its manifest, script, icons and font subsets; `src/main.ts` and `src/logic.ts` only hand its script to `packages/reader`. A work with more than a read-through strings phases together (Phases below).

## Players and parts

UZU documents no upper limit on players (`playerCount` is an integer of 1 or more; `characters` overrides it). The code takes any count. Each seat plays a part (a manifest character); a part reads one or more roles (script speakers), listed in `script.json` `parts`. Without `parts`, each cast entry is its own part. A line spoken together lists several speakers; the first reads it. Stage directions are lines of a cast entry with `direction: true`.

## Phases

A work is a fixed list of phases in order (opening read-through, handouts, a game, the post-game screen). Each phase is a `PhaseLogic` (`packages/kit/src/flow.ts`): `setup` when the game enters it, `actions` (and `serverActions`), `done`, and an optional `deadline`. The work's logic (`src/logic.ts`, the manifest's `serverActionLogicPath`) is `flowLogic(phases, partIds)`; shared state is `FlowState`: seat parts, the current phase `at`, each entered phase's state, and `ended`. A phase's actions are sent as `${phaseId}:${name}`; an action of any phase but the current one is rejected. After each action or deadline, the game moves past phases that are done; when the last one is done, `ended` turns true and the client calls `gameEnded()`.

The client entry (`src/main.ts`) calls `startFlow(logic, { parts, phases, orientation })`, giving each phase, in the logic's order, a band label (the text itself), a screen and optional extra `props`. A phase screen gets `PhaseViewProps` (`packages/reader/src/flow.ts`). `readThroughPhase(script)` with `ReadThroughView` (`props: { script }`) is a read-through; `emptyPhase()` with `EmptyView` holds the place of a phase not made yet. A sample is one read-through phase: `readThroughLogic(script)` and `startReader(script, logic, orientation)`.

## Commands (from the repo root)

| Purpose | Command |
|---|---|
| Install | `npm ci` (npm 10's `npm install` without a lockfile can crash; use npm 11) |
| Unit tests | `npm test` |
| Types | `npm run typecheck` |
| CSS lint (no outer `margin`; see docs/design.md Layout) | `npm run lint` |
| Screen preview: both orientations with numbered parts, a page to publish as an Artifact (docs/screen-preview.md) | `node tools/screen-preview/capture.mjs samples/<name> out.html` while that sample's harness runs |
| Overflow check: what spills past the screen, the safe area, the HUD or its parent, in both orientations (docs/screen-preview.md) | `node tools/screen-preview/capture.mjs --check samples/<name>` while that sample's harness runs |
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
- BIZ UDPGothic Regular and Bold for UI text: cast and part names, names the lines use, the work's `notice`, and `packages/reader/src/strings.json`.

Rebuild a sample's subsets when those characters change, including after editing `strings.json` (rebuild every sample then). Needs [fonttools](https://github.com/fonttools/fonttools):

```bash
scripts/subset-fonts.sh samples/<name>
```

## Licenses

- Code: MIT (`LICENSE`)
- Script text (`samples/hundred-arms/script/`): CC BY 4.0, author あろすてりっく (`script/LICENSE.md`). Never change any script's wording; each sample has a test that checks `script.json` against `original.txt`.
- 指環 and 三つの宝 (`samples/yubiwa/script/`, `samples/mittsu-no-takara/script/`): public domain in Japan, from Aozora Bunko (`script/LICENSE.md`).
- Playing cards (`packages/reader/src/cards/`): CC0, Adrian Kennard's SVG deck (`cards/LICENSE.md`).
- Fonts (`samples/*/src/fonts/`): SIL Open Font License 1.1 (`OFL-ShipporiMincho.txt`, `OFL-BIZUDPGothic.txt`)
- The official sample densetsu-no-tantei has no license notice, so do not copy its code.

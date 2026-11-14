# Making a work from a plan

For the agent that builds a work from an author's plan. The plan is free-form; there is no format to match. The author's part is the plan and a reaction to the screens; yours is everything between. A work lives in its own repository and installs this toolkit from a GitHub release: one URL in its `package.json` for `@uzu-toolkit/toolkit`, which brings `@uzu-toolkit/kit` and `@uzu-toolkit/reader` (see docs/decisions/2026-11-14-the-toolkit-is-shipped-as-release-tarballs.md). The package carries this file, CLAUDE.md, the docs, the scripts, the tools and `template/` (the files every work starts from); they land under `node_modules/@uzu-toolkit/toolkit/`, and `packages/reader` under `node_modules/@uzu-toolkit/reader/`. Its README is where to start. Older works still take the toolkit as the submodule `toolkit/`. Inside this repository a sample is the same, one folder deeper.

Read, in this order, and nothing more until you need it: this file, [plan-to-parts.md](plan-to-parts.md), then [design.md](design.md) and only the spec in `design/` for a screen you change.

## 1. Read the plan, then ask once

Write down, for each thing the plan says, the part that answers it (plan-to-parts.md). What the plan does not say falls in two groups.

**Ask the author first** (these change how the game plays, and are costly to redo):

- the screen's orientation, when the plan does not say: landscape only, portrait only, or both. It decides `manifest.json`'s `orientation` and what the checks look at (below);
- a game's rules and how it is won, when the plan only names the game;
- who may move the game on in a phase, and who sees what alone;
- the number of players and the parts they play;
- the order and length of the phases.

Put them in one message: for each, two or three options with one recommended, so a line answers each. Ask only what the plan leaves open; if nothing is open, ask nothing. Do not wait for the answer to start what does not depend on it.

**Ask once, only when the plan names a look** (an era, a world, a mood): is it colours and typefaces only, or also pictures (a background, standing characters, frames) made from an order sheet by an image generator? Recommend colours and typefaces first; pictures are a second pass (step 2, "Pictures"). If the plan names no look, ask nothing and use the neutral defaults.

**Do not ask** (fill with a default, list it in step 5): the wording of the introduction and the guides, labels, small layout choices. The author fixes these from the screens.

## 2. Lay out the work

One folder, built from these files (`template/` is a single read-through work; the phases are the part a plan adds).

| File | What |
|---|---|
| `script/work.json` | `title`, `intro` (the introduction text), `phases`: `{ id, label, guide? }` in order. The label is the band's text |
| `script/opening.json` | A read-through's script (`Script` in `packages/reader/src/script.ts`): `title`, `cast`, `parts` (each with `id`, `name`, `description`, `roles`; the logic and the screens read them), `lines` |
| `script/handouts.json` | The handouts, if the plan has them (`Handout` in `packages/kit/src/handout.ts`) |
| `src/logic.ts` | The server logic: `flowLogic(phases, partIds)` |
| `src/main.ts` | The client: `startFlow(logic, { parts, phases, orientation })` |
| `src/theme.css` | The work's colours and art, over the toolkit's neutral defaults |
| `manifest.json` | `id`, `playerCount`, `orientation`, `serverActionLogicPath: "./src/logic.ts"`, `characters` with an icon each |
| `fonts.config.json`, `src/fonts.css` | The font subsets (CLAUDE.md, Fonts); run `npm run fonts` once the text exists |
| `index.html`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `package.json` | As in `template/`; `vite.config.ts` has `devHarness()` from `@uzu-toolkit/reader/dev-harness` |
| `test/` | A test for the logic, one that checks the script against the plan's text, and the fonts test |

The read-through's main screen is the stage one (`StageReadThrough`: standing characters, one dialogue frame, a log, drawn from a layout JSON and the work's own pictures). The bubble chat (`ReadThroughView` without `screen`, and `startReader`) is the other option, for a work that draws nothing. `template/` starts a work of one read-through on the stage screen; a work of more phases is the two files below.

```ts
// src/logic.ts
import { emptyPhase, flowLogic, type PhaseLogic, readyPhase } from '@uzu-toolkit/kit';
import { readThroughPhase } from '@uzu-toolkit/reader/logic';
import opening from '../script/opening.json';
import work from '../script/work.json';

export type { FlowState as State } from '@uzu-toolkit/kit';

/** Each phase's logic, by the phase IDs in script/work.json. */
const LOGIC: Record<string, PhaseLogic> = {
  intro: readyPhase(),
  opening: readThroughPhase(opening),
  ending: emptyPhase(),
};

export default flowLogic(
  work.phases.map(({ id }) => ({ id, logic: LOGIC[id] })),
  opening.parts.map((p) => p.id),
);
```

```ts
// src/main.ts
import { castScreen, EmptyView, type PhaseView, ReadThroughView, startFlow } from '@uzu-toolkit/reader';
import { StageReadThrough } from '@uzu-toolkit/reader/stage';
import opening from '../script/opening.json';
import work from '../script/work.json';
import './fonts.css';
import './theme.css';
import logic from './logic';

/** Each phase's screen and its content, by the phase IDs in script/work.json. */
const VIEW: Record<string, Omit<PhaseView, 'id' | 'label'>> = {
  intro: castScreen({ text: work.intro, cast: opening.parts }),
  opening: { view: ReadThroughView, props: { script: opening, screen: StageReadThrough } },
  ending: { view: EmptyView },
};

// `guide` is optional per phase; typing the list keeps a work.json without any from failing the types.
const phases: { id: string; label: string; guide?: string }[] = work.phases;

startFlow(logic, {
  parts: opening.parts,
  phases: phases.map(({ id, label, guide }) => ({ id, label, ...VIEW[id], props: { ...VIEW[id].props, guide } })),
  orientation: 'portrait',
});
```

More phases are more entries in the two tables: a handout is `handoutLogic(handouts, { minutes })` with `handoutScreen(handouts)`, a list of games `gameSelectPhase(games)` with `GameSelectView`, a phase not made yet `emptyPhase()` with `EmptyView`. A game's rules stay in the work, under `src/games/`. Never change the plan's wording in the data.

A part you would write yourself (a screen, a timer, a turn rule) may already exist: look in plan-to-parts.md and `packages/*/src/index.ts` before writing it. A phase's own logic and screen are the work's when no part answers the plan; keep them in files named for what they are, so step 5 can list them.

### Pictures (when the author chose them in step 1)

A work with no pictures works: every part of the stage screen falls back to the colour tokens in `theme.css`. Pictures are added on top, in this order:

1. Write the world in a few lines (era, place, colours, materials, mood) in a file, e.g. `world.md`. Example: 大正時代の洋館の応接間。漆黒と真鍮の色、和紙と革の質感、静かで少し寂しい雰囲気。
2. Make the order sheet: `node node_modules/@uzu-toolkit/toolkit/tools/layout/brief/brief.mjs node_modules/@uzu-toolkit/reader/src/layouts/read-through.layout.json world.md --orientation landscape --out brief.md` (`--orientation portrait` for a portrait work). It lists each picture to make (file name, size, how it stretches) and one prompt per scene. If the work has its own layout (below), give that file in place of the toolkit's: the picture sizes follow the boxes.
3. Give `brief.md` to the author and ask them to have the pictures made by an image generator, and to send them back. You cannot make them yourself; say so.
4. Put the returned pictures in `public/assets/` under the names in the sheet (`.webp`), run the checks and show the screens.
5. Set the text colours to the pictures. Text is set by code over the pictures, so a dark frame with dark text is unreadable and no check sees it. Open the screens with the pictures in, then in `src/theme.css` set the text colour of what sits on a picture (the line and names on the frame and plates, the label on the button and log panel: `--color-text`, `--color-mine-text`, `--color-text-quiet`) so each reaches 4.5:1 against the picture behind it, and show the screens again. Light pictures take dark text; dark pictures take light text. Colours that stay for parts with no picture (the tag, the log link) must still read on the background picture.

### Moving the boxes on slides (when the author wants a different arrangement)

The stage screen's boxes (background, standing characters, frame, nameplates, buttons, log) are numbers in a layout JSON, and the pictures' sizes follow them. An author who wants a part elsewhere or another size should not have to read numbers: the layout goes out as slides, the author moves boxes in PowerPoint or Google Slides, and the slides come back in. Do this once the author has said so, and before the order sheet (a picture made for a box that then moves has to be made again). A work that keeps UZU's arrangement skips it.

1. Copy the layout into the work: `cp node_modules/@uzu-toolkit/reader/src/layouts/read-through.layout.json src/read-through.layout.json`, and pass it to the screen: `import layout from './read-through.layout.json'` and `props: { script, screen: StageReadThrough, layout }` in `main.ts`. `npm run typecheck` fails if it does not fit.
2. Write the slides: `npm run layout:export -- src/read-through.layout.json slides` (one slide per scene; landscape and portrait each get a file; the folder must exist). Give the `.pptx` to the author and say what to do: move or resize the boxes, do not delete or rename them, and send the file back.
3. Read them back: `npm run layout:import -- slides/layout-landscape.pptx --layout src/read-through.layout.json` (also the portrait file if the work has both). It rewrites the JSON for moved boxes and **only lists** the rest: a new box (a new part needs code, tell the author it is not done), a vanished box, or a part moved differently on two slides (a conflict, not applied; ask the author which one they mean).
4. Run the checks and show the screens (step 3). Then make the order sheet from this layout file (step "Pictures", 2).

Without a shell, tell the author this is the step you could not run, give them the layout JSON and the slides command, and say the boxes stay as UZU's until they do. Slides are placeholders for places, not the work's art; the format is in [design/layout.md](design/layout.md).

## 3. Check as you go

From the work's root, with the harness running (`npm run harness`, then `/harness` on the port in its log):

| Check | Command |
|---|---|
| Tests, types, CSS | `npm test`, `npm run typecheck`, `npm run lint` |
| Every phase plays through with every seat; a plain action that reads the clock or a random number fails | `allPhases(...)` in a test (`tools/e2e/all-phases.mjs`) |
| Defects no screen shows: no `firstFrameReady`, a file name or address certification forbids, `Date.now`/`Math.random` in server logic, a lock or rotation of the screen | `checkWork(dir)` in a test (`tools/check/static.mjs`; `node toolkit/tools/check/static.mjs .` to read it). Errors fail; warnings (px sizes, a portrait work with no `max-width`, no toolkit part) are a list to report, not to fix |
| A phase still ends when a player has left | `allPhases({ ..., away: '<part>' })`: that seat never acts. Optional: a work may require a seat in a phase on purpose |
| Overflow, in certification's three sizes, in the orientation `manifest.json` fixes (a portrait work also in a wide PC window) | `node toolkit/tools/screen-preview/capture.mjs --check --size all --config shots.mjs .` |
| Screens, numbered, to show the author | `--png <dir>` or the page, with the same `--config` |

`shots.mjs` is the work's list of screens. `phaseScreens` makes one for every toolkit phase without a line of steps (see [screen-preview.md](screen-preview.md), "Catalogue of a work"); write by hand only what it cannot reach (a game in progress, a sheet). The work chooses how much to shoot with `only` and `shots`.

The answer to the orientation question sets:

| Answer | `manifest.json` | `shots.mjs` | The checks look at |
|---|---|---|---|
| Landscape only | `"orientation": "landscape"` | nothing | landscape in each size |
| Portrait only | `"orientation": "portrait"` | nothing | portrait in each size, and `desktop` (a wide PC window) |
| Both | leave `orientation` out (the SDK's type makes it optional; how the app treats a work without it is not stated in the docs read for this toolkit, so check UZU's docs or ask the organisers) | `orientation: 'both'` in `catalogue({ ... })` | both orientations in each size |

A work serves the orientation its manifest fixes (the app holds a phone to it); it need not serve the other. On a PC the window has any shape, so a portrait work keeps its column in the middle (`max-width`, centred) when opened wide; the check's `desktop` size looks at that. A work that serves both says `orientation: 'both'` in `shots.mjs`.

Fix what the checks list before showing anything. Show the author the screens only once, when the work stands; do not re-shoot while you work.

## 4. Fix from the author's reaction

The author answers with a feeling about a screen, often by its number ("縦 4番の間隔を狭く", "the button is small"). Find the part from the number (screen-preview.md), change the smallest piece that covers it (CLAUDE.md, Replacing the screens), run the checks, and show only the screens that changed.

## 5. Report back

When the work stands, give the author these three lists with the screens, and nothing longer:

1. **Decided for you**: each default you chose where the plan was silent, one line each, and where to change it.
2. **Parts and your own code**: for each thing the plan says, the part that answered it, and every place you wrote your own (a file and why no part answered).
3. **What you could not do or check**: anything skipped, and why.

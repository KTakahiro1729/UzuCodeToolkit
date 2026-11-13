# Making a work from a plan

For the agent that builds a work from an author's plan. The plan is free-form; there is no format to match. The author's part is the plan and a reaction to the screens; yours is everything between. A work lives in its own repository and takes this toolkit as the submodule `toolkit/` (the steps below assume it; inside this repository a sample is the same, one folder deeper).

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

**Do not ask** (fill with a default, list it in step 5): the wording of the introduction and the guides, labels, colours, art, small layout choices. The author fixes these from the screens.

## 2. Lay out the work

One folder, built from these files (see `samples/` for a single read-through work; the phases are the part a plan adds).

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
| `index.html`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `package.json` | As in `samples/hundred-arms`; `vite.config.ts` adds `devHarness()` from `@uzu-toolkit/reader/dev-harness` |
| `test/` | A test for the logic, one that checks the script against the plan's text, and the fonts test |

A work of one read-through is `startReader(script, readThroughLogic(script), orientation)`; a work of more phases is the two files below.

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
import opening from '../script/opening.json';
import work from '../script/work.json';
import './fonts.css';
import './theme.css';
import logic from './logic';

/** Each phase's screen and its content, by the phase IDs in script/work.json. */
const VIEW: Record<string, Omit<PhaseView, 'id' | 'label'>> = {
  intro: castScreen({ text: work.intro, cast: opening.parts }),
  opening: { view: ReadThroughView, props: { script: opening } },
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

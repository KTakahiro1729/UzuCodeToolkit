# Changelog

What changed in the toolkit that a work built on it (a submodule such as InterstellarBoardGame) can notice. Newest first, one dated section per day.

Every entry ends with `Work action:` saying what a work has to do after taking the change: `none`, or the step (a command, a file to edit). The works' automatic submodule update copies these lines into its pull request, so write them for someone who has not read the toolkit's pull request. Decisions and their reasons stay in `docs/decisions.md`; this file lists changes.

## 2026-11-13

- Font subsets are built from a `fonts.config.json` in each project (sample or work) instead of a script's hard-coded lists, and `scripts/subset-fonts.sh [projectDir]` builds from it (`npm run fonts` rebuilds every sample). `tools/fonts/fonts.mjs` exports `missingGlyphs(projectDir)`, which a test calls to fail when a subset lacks a glyph the project shows. Work action: add `fonts.config.json` to the work (format in the header of `tools/fonts/fonts.mjs`), add a test that calls `missingGlyphs`, and run `sh toolkit/scripts/subset-fonts.sh .` whenever that test fails (after a toolkit change in `strings.json`, for one).
- `startFlow` takes `shell` (the frame around the phases) and `strings` (any key of `packages/reader/src/strings.json`); `game`, `band`, `sendAction`, `footerSlots`, `sceneIn`, `sceneOut`, `FlowApp`, `Frame`, `TopBand`, `FooterActions`, `PhaseList` and `Sheet` are exported from `@uzu-toolkit/reader`, and `handoutScreen(handouts, props)` and `castScreen(props)` return a phase's view with its wiring. Work action: none is required; to use them, spread `handoutScreen(...)` and `castScreen(...)` in `src/main.ts` in place of `handoutKeep`, `handoutDone`, `handoutReopen`, `readyDone` and the two views, and list any `strings` override as a ui source in `fonts.config.json`.
- The dev harness's tap-next and the screen preview's `next`, `scroll` and phase name find screens by `data-uzu-actions="main"`, `data-uzu-phase` and `data-uzu-scroll` (set by the default screens, `FooterActions` included) instead of `footer .act button`, `.chat` and `header .phase`. Work action: if the work has its own preview config or a custom shell or screen, use those marks in place of the old selectors; with the default screens, none.
- The top band caps a long phase name with an ellipsis so the players stay on screen. Work action: none.

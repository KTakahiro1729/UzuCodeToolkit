# Changelog

What changed in the toolkit that a work built on it (a submodule such as InterstellarBoardGame) can notice. Newest first, one dated section per day.

Every entry ends with `Work action:` saying what a work has to do after taking the change: `none`, or the step (a command, a file to edit). The works' automatic submodule update copies these lines into its pull request, so write them for someone who has not read the toolkit's pull request. Decisions and their reasons stay in `docs/decisions.md`; this file lists changes.

## 2026-11-13

- Font subsets are built from a `fonts.config.json` in each project (sample or work) instead of a script's hard-coded lists, and `scripts/subset-fonts.sh [projectDir]` builds from it (`npm run fonts` rebuilds every sample). `tools/fonts/fonts.mjs` exports `missingGlyphs(projectDir)`, which a test calls to fail when a subset lacks a glyph the project shows. Work action: add `fonts.config.json` to the work (format in the header of `tools/fonts/fonts.mjs`), add a test that calls `missingGlyphs`, and run `sh toolkit/scripts/subset-fonts.sh .` whenever that test fails (after a toolkit change in `strings.json`, for one).

# A work's shots meet the toolkit only through its public API

The screen catalogue (`shots.mjs`) of a work no longer writes toolkit phase state by hand or selects toolkit parts by class name. Both made every internal change in the toolkit a change in every work's shots.

- States: `states` in `tools/screen-preview/catalogue.mjs` (`ready`, `dialogue`, `handout`, `empty`, `gameSelect`) gives each toolkit phase's state fresh, over and in between; `flowSteps` adds `play` and `handoutTimeUp`. A test in `packages/reader` checks them against the phases' `setup` and `done`.
- Parts: `PARTS` selects by `data-uzu-part` names set on the toolkit's components (`part('footer-row')`), as the harness and the checks already select by `data-uzu-*` marks. A name is a token list, so one element can carry several (`slot tab`). Numbers and labels are unchanged. Five parts the screens no longer draw (`cast-you`, `field-value`, `footer-opts`, `footer-status`; and `.reopen`, which now names the real button) keep their numbers.
- Not taken: a state-making function inside the TypeScript packages. The tools run as plain Node without a transpiler, so they could not import it.
- Known change: the old `.panel` also matched the sheet's panel and its `h2`, and `section:has(> .head)` never matched the sheet; the marks follow the labels instead.

# Checks fail only on defects the official docs name; style is a warning

Superseded in part by 2026-11-13-the-toolkit-drops-options-no-work-uses.md (the warnings `no-orientation` and `no-toolkit`).

The static check (`tools/check/static.mjs`) and the away-seat run (`allPhases({ away })`) follow the rule "the toolkit prevents a mistake no eye can see" without tightening what an author may do.

- **Errors**: a missing `firstFrameReady` (also through `startFlow`/`startReader`), a file name outside `[A-Za-z0-9_.-]`, an outside address, an absolute path, `Date.now`/`new Date`/`Math.random` and the like in the server logic and what it imports, a screen lock or CSS rotation by the work, and an orientation that differs from the manifest's. Each is named in certification or breaks online play, and the author cannot see it. A line that must stay says `uzu-check-ignore` in a comment.
- **Warnings** (never fail): sizes in px, a portrait work with no `max-width` (a PC window is wide), no orientation in the manifest, no toolkit part used. The author may have a reason; the agent reports them.
- **Orientation**: `manifest.orientation` is the right way to fix the orientation (UZU's operators confirmed: a work only needs to play well in the orientation it names). It is not a defect; the check only fails the work locking or rotating the screen itself, or passing the SDK another orientation than the manifest's.
- **Text no font holds** (`font-glyph`): a warning. The fonts test (`missingGlyphs`) already fails when a subset lacks a glyph from a source `fonts.config.json` lists; that stays an error, since the list is the author's statement of what is shown. The static scan reads every JSON file under `script/` and `src/` and the screens' source, so it also finds text no list names (the case where a fallback serif was drawn). It cannot tell shown text from metadata (a `script.json` author field is not drawn), and on the three samples it flags exactly such fields, so it only warns. A fallback glyph is also easy to miss by eye, which is why it is worth listing at all.
- **A seat that has left** is opt-in (`away`), not run by default: the platform tells the game logic nothing about presence, so a phase that needs everyone (`readyPhase`) or one part (`emptyPhase({ facilitator })`) strands the others. That can be the work's intent. The option shows which phase it is when the author wants to know.

Not taken: failing on px sizes or on work code that could have used a part (the owner does not want constraints that make the toolkit hard to use); failing the away run by default (it would fail every work that uses `readyPhase`, whose rule is the toolkit's phase design, not a defect of the work).

Where: `tools/check/`, `tools/e2e/all-phases.mjs`, tests in `packages/reader/test/work-check.test.ts`.

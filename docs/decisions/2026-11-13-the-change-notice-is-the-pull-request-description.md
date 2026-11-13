# The notice of what a work must do is the toolkit pull request's description, not a CHANGELOG

The toolkit has no `CHANGELOG.md` (retired in #51). A toolkit pull request that changes a part's props, a string key, a data format, a command or the fonts says in its description what a work has to do after taking it, or that it has to do nothing. The work's automatic update pull request lists the toolkit pull requests merged since the last pin, so the owner reads those descriptions.

This replaces the CHANGELOG with `Work action:` entries in the automatic-update decision; the automatic update itself stands.

Also: every UI string a screen shows is read through `strings.ts`, never `strings.json`, so `startFlow({ strings })` reaches all of them; `packages/reader/test/strings.test.ts` fails on a direct import. A shell that shows `FlowStrip` calls `provideFlow` (CLAUDE.md, Replacing the screens).

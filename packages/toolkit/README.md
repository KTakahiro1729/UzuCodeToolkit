# UzuCodeToolkit

Toolkit for making murder-mystery games with UZU Code. You are reading this inside the package `@uzu-toolkit/toolkit` (in `node_modules/@uzu-toolkit/toolkit/` once installed). One install brings everything:

| Where | What |
|---|---|
| `node_modules/@uzu-toolkit/kit` | UI-independent helpers (phases, read-through, casting, votes, timers) |
| `node_modules/@uzu-toolkit/reader` | The screens (Svelte 5), the dev harness (`harness.mjs`), UI strings |
| `node_modules/@uzu-toolkit/toolkit/CLAUDE.md` | The toolkit's rules (language, sizes, determinism, certification) |
| `node_modules/@uzu-toolkit/toolkit/docs/` | `new-work.md` (plan to work), `plan-to-parts.md`, `design.md` and `design/`, `image-brief/`, `screen-preview.md` |
| `node_modules/@uzu-toolkit/toolkit/tools/`, `scripts/` | Fonts, layout, screen preview, checks |
| `node_modules/@uzu-toolkit/toolkit/template/` | The files every work starts from |

Where CLAUDE.md and the docs say `toolkit/`, read `node_modules/@uzu-toolkit/toolkit/` (docs, scripts, tools) or `node_modules/@uzu-toolkit/reader/` (the packages).

## Making a work from a plan, starting with nothing but this package

1. In a new folder, copy `template/` into the work's root (rename `gitignore` to `.gitignore`, keep `.github/workflows/verify.yml` and `AGENTS.md`). Put the release URL of this package in `package.json` (`dependencies["@uzu-toolkit/toolkit"]`) and set the work's name and title.
2. `npx npm@11 install` (npm 10 can crash), and commit `package-lock.json`.
3. Read `CLAUDE.md`, then `docs/new-work.md`, and follow it: ask the author once what changes how the game plays, then build the work.
4. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and, with a shell, `npm run harness`. CI (`verify.yml`) runs the first four on every push; if you cannot run them, say so in your report.
5. Push the work to a branch of the author's repository.

The author publishes with `uzu publish` (needs their account); do not.

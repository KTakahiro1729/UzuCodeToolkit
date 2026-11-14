# UzuCodeToolkit

Toolkit for making UZU Code games (read-throughs first, murder-mystery phases beyond) from a plan, by an AI agent such as ChatGPT. You are reading this either inside the package `@uzu-toolkit/toolkit` (`node_modules/@uzu-toolkit/toolkit/` once installed) or as the standalone `README.md` attached to the release. One install brings everything:

| Where | What |
|---|---|
| `node_modules/@uzu-toolkit/kit` | UI-independent helpers (phases, read-through, casting, votes, timers) |
| `node_modules/@uzu-toolkit/reader` | The screens (Svelte 5), the dev harness (`harness.mjs`), UI strings |
| `node_modules/@uzu-toolkit/toolkit/CLAUDE.md` | The toolkit's rules (language, sizes, determinism, certification) |
| `node_modules/@uzu-toolkit/toolkit/docs/` | `new-work.md` (plan to work), `plan-to-parts.md`, `design.md` and `design/`, `image-brief/`, `screen-preview.md` |
| `node_modules/@uzu-toolkit/toolkit/tools/`, `scripts/` | Fonts, layout, screen preview, checks |
| `node_modules/@uzu-toolkit/toolkit/template/` | The files every work starts from |

Where CLAUDE.md and the docs say `toolkit/`, read `node_modules/@uzu-toolkit/toolkit/` (docs, scripts, tools) or `node_modules/@uzu-toolkit/reader/` (the packages).

## If you cannot install the package, or have no repository

The package is the only thing you are certain to have. If `npm i` fails (no network), the same files are in the repository `KTakahiro1729/UzuCodeToolkit` at the tag `vVERSION` (the version is in the tarball's file name): `CLAUDE.md`, `docs/`, `tools/`, `scripts/` at its root, and `packages/toolkit/template/`, `packages/kit/`, `packages/reader/`. Raw files are at `https://raw.githubusercontent.com/KTakahiro1729/UzuCodeToolkit/vVERSION/<path>`; read `docs/new-work.md` first.

If you are not given a repository, make the work as a folder of files (the layout below, without `node_modules/` and `dist/`) and hand it over as one archive. You will probably not be able to run the checks; that is expected. Say in your report which of `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and the harness you ran, which you could not, and why. The author runs them. Never claim a check passed that you did not run.

## Making a work from a plan, starting with nothing but this package

1. In a new folder, copy `template/` into the work's root (rename `gitignore` to `.gitignore`, keep `.github/workflows/verify.yml` and `AGENTS.md`). Put the release URL of this package in `package.json` (`dependencies["@uzu-toolkit/toolkit"]`) and set the work's name and title.
2. `npx npm@11 install` (npm 10 can crash), and commit `package-lock.json`.
3. Read `CLAUDE.md`, then `docs/new-work.md`, and follow it: ask the author once what changes how the game plays, then build the work.
4. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and, with a shell, `npm run harness`. CI (`verify.yml`) runs the first four on every push; if you cannot run them, say so in your report.
5. Hand the work over: push it to a branch of the author's repository if you were given one, otherwise as an archive of the folder.

The author publishes with `uzu publish` (needs their account); do not.

# AGENTS.md

A UZU Code work built on UzuCodeToolkit, installed as one npm package from a GitHub release (`@uzu-toolkit/toolkit` in `package.json`; it brings `@uzu-toolkit/kit` and `@uzu-toolkit/reader`).

Before any change, read `node_modules/@uzu-toolkit/toolkit/README.md`, then its `CLAUDE.md` and `docs/new-work.md`. Their rules apply here. Where they say `toolkit/`, read `node_modules/@uzu-toolkit/toolkit/` (docs, scripts, tools) and `node_modules/@uzu-toolkit/reader/` (the packages).

Hard rules (the ones most often broken):

- Use npm 11 (`npx npm@11 install`). npm 10 can crash. Commit `package-lock.json`.
- Move to a newer toolkit by changing the one release URL in `package.json`, then `npm install`.
- UI strings come only from keys or data. Never write Japanese UI text in code. Japanese belongs in content (script, UI string data) only.
- Never change the original text's wording; a test checks the data against the original.
- Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` before you hand work over. If you cannot run them (no network), say so; CI runs the same steps on every push.
- Run `npm run fonts` whenever text or UI strings change.

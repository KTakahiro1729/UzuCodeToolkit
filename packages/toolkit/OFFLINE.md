# Start here (the offline bundle)

This folder is a work template with everything installed: `node_modules/` is complete, so you need no network and no `npm install`. It is UzuCodeToolkit VERSION. Read `node_modules/@uzu-toolkit/toolkit/README.md` next, then `CLAUDE.md` and `docs/new-work.md` in the same folder; the package's steps 1 and 2 (copy the template, install) are already done.

## What you can and cannot do here

- Works offline: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run harness`, the slides round trip (`npm run layout:export`, `npm run layout:import`) and the order sheet (`node_modules/@uzu-toolkit/toolkit/tools/layout/brief/brief.mjs`).
- Needs the network, so it cannot be done here: `npm run fonts` (it also needs fonttools), `npm install` of anything new, `uzu publish`. Leave `src/fonts.css` off (it is commented out in `src/main.ts`) and say so in your report.
- The installed binaries are for 64-bit Linux (glibc) and Node 22.12 or newer. On another system (macOS, Windows, ARM) `npm test` may fail to start; then use the tarball install in the package's README instead.
- Do not run `npm install` or `npm update` with the network off: it can break `node_modules/`. Do not add packages.

## After you open the zip

1. Set the work's name in `package.json`, the title and orientation in `manifest.json` and in `src/main.ts`.
2. Put the plan's script at `script/script.json` (the format is in `docs/new-work.md`), and write the tests in `test/`.
3. Build the work as `docs/new-work.md` says, running the four checks as you go.
4. Hand it over as an archive of the folder **without `node_modules/` and `dist/`** (the author has the toolkit already, and the archive stays small). The author runs `npm install` with npm 11 on their side; `package-lock.json` pins the toolkit release.

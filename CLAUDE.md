# CLAUDE.md

Toolkit for making murder-mystery games with UZU Code (`run()` from `@uzuhq/code-sdk`). Docs: https://docs.code.uzu-app.com/

## Design policy

Read [docs/design.md](docs/design.md) before any UI work. It holds the functional design rules every screen follows.

## Language

Write code, comments, docs, tests and error messages in English. UI strings come only from keys or data. Japanese goes into the repo only as content (the script and UI string data), rule text from specs, or proper nouns. Docs state the owner's intent in English; do not quote the owner.

## Layout (npm workspaces)

| Path | Role |
|---|---|
| `packages/kit` | UI-independent helpers: read-through (`advanceDialogue` etc.) and role assignment (`assignRoles`). Called from both server actions and the view |
| `samples/hundred-arms` | Sample work 百本腕と勇者. Two players, Svelte 5 |

## Commands (from the repo root)

| Purpose | Command |
|---|---|
| Install | `npm ci` (npm 10's `npm install` without a lockfile can crash; use npm 11) |
| Unit tests | `npm test` |
| Types | `npm run typecheck` |
| CSS lint (no outer `margin`; see docs/design.md Layout) | `npm run lint` |
| Dev harness | `npm run harness` (`-- --orientation portrait` for portrait), then open `/harness` on the port in the log: the harness with reset, rotate and tap-next buttons (`samples/hundred-arms/dev-harness.ts`, dev server only) |

`npm run dev` (vite only) does not connect to the SDK; check behaviour in the harness. Hot swap: vite swaps screen code and CSS in place; `npm run harness` (`samples/hundred-arms/harness.mjs`) restarts the harness when the server logic changes, and `/harness` puts the game state back.

## Writing code

- Actions run both in client prediction and on the server: keep them deterministic (no random or wall-clock values in state). Reject by throwing.
- Sizes in em, based on the screen's short side. `main.ts` exposes the safe area and the UZU HUD as CSS variables (`--safe-*`, `--hud-x`, `--hud-y`).
- Certification (https://docs.code.uzu-app.com/certification): call `firstFrameReady()`, use relative paths, file names only `[A-Za-z0-9_.-]`, no external network access.

## Fonts

`samples/hundred-arms/src/fonts/` holds two Google Fonts (OFL 1.1) as woff2 subsets, declared in `src/theme.css`. No CDN: certification forbids external network access.

- Shippori Mincho Regular for story text, subset to the script, title, end mark and afterword (~21 KB).
- BIZ UDPGothic Regular and Bold for UI text, subset to the role names and `src/strings.json` (~8 KB each).

Rebuild them when those characters change (needs [fonttools](https://github.com/fonttools/fonttools)):

```bash
curl -LO https://raw.githubusercontent.com/google/fonts/main/ofl/shipporimincho/ShipporiMincho-Regular.ttf
for w in Regular Bold; do curl -LO https://raw.githubusercontent.com/google/fonts/main/ofl/bizudpgothic/BIZUDPGothic-$w.ttf; done
node -e 'const s=require("./samples/hundred-arms/script/script.json");const t=[s.title,s.end,...s.lines.map(l=>l.text),s.afterword].join("");process.stdout.write([...new Set(t)].join(""))' > story.txt
node -e 'const s=require("./samples/hundred-arms/script/script.json");const t=[...s.cast.map(c=>c.label),...Object.values(require("./samples/hundred-arms/src/strings.json"))].join("");process.stdout.write([...new Set(t)].join(""))' > ui.txt
F=samples/hundred-arms/src/fonts
pyftsubset ShipporiMincho-Regular.ttf --text-file=story.txt --flavor=woff2 --layout-features='*' --output-file=$F/ShipporiMincho-Regular.subset.woff2
for w in Regular Bold; do pyftsubset BIZUDPGothic-$w.ttf --text-file=ui.txt --flavor=woff2 --layout-features='*' --output-file=$F/BIZUDPGothic-$w.subset.woff2; done
```

## Licenses

- Code: MIT (`LICENSE`)
- Script text (`samples/hundred-arms/script/`): CC BY 4.0, author あろすてりっく (`script/LICENSE.md`). Never change the script's wording; a test checks `script.json` against `original.txt`.
- Fonts (`samples/hundred-arms/src/fonts/`): SIL Open Font License 1.1 (`OFL-ShipporiMincho.txt`, `OFL-BIZUDPGothic.txt`)
- The official sample densetsu-no-tantei has no license notice, so do not copy its code.

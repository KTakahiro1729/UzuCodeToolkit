# CLAUDE.md

Toolkit for making murder-mystery games with UZU Code (`run()` from `@uzuhq/code-sdk`). Docs: https://docs.code.uzu-app.com/

## Design policy (owner's words)

> 過剰設計をさける。具体的にはサンプルプロジェクトに不要なものはYAGNIと考える
> 文字に頼るUIは極小に
> 余白や背景色を利用し、線が多すぎるUIは減らす

In practice:

- Build only what `samples/` uses. Add to the kit when the sample needs it.
- Screen text is the work's own text (the script). Do not explain state with sentences or hints.
- No borders or rules; separate things with spacing and background colour.

## Language

Write code, comments, docs, tests and error messages in English. UI strings come only from keys or data. Japanese goes into the repo only as the owner's own text quoted verbatim (e.g. the script, the policy above), rule text from specs, or proper nouns.

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
| Dev harness | `npm run harness`, then the URL in the log. `npx uzu dev --orientation portrait` (in the sample) for portrait |

`npm run dev` (vite only) does not connect to the SDK; check behaviour in the harness. Restart the harness after changing server logic.

## Writing code

- Actions run both in client prediction and on the server: keep them deterministic (no random or wall-clock values in state). Reject by throwing.
- Sizes in em, based on the screen's short side. `main.ts` exposes the safe area and the UZU HUD as CSS variables (`--safe-*`, `--hud-y`).
- Certification (https://docs.code.uzu-app.com/certification): call `firstFrameReady()`, use relative paths, file names only `[A-Za-z0-9_.-]`, no external network access.

## Font

`samples/hundred-arms/src/fonts/` holds Shippori Mincho (Google Fonts, OFL 1.1) as a woff2 subset to the script's characters (~21 KB). No CDN: certification forbids external network access. Regular only, so no bold.

Rebuild it when the script's characters change (needs [fonttools](https://github.com/fonttools/fonttools)):

```bash
curl -LO https://raw.githubusercontent.com/google/fonts/main/ofl/shipporimincho/ShipporiMincho-Regular.ttf
node -e 'const s=require("./samples/hundred-arms/script/script.json");const t=[s.title,s.end,...s.cast.map(c=>c.label),...s.lines.map(l=>l.text),s.afterword].join("");process.stdout.write([...new Set(t)].join(""))' > chars.txt
pyftsubset ShipporiMincho-Regular.ttf --text-file=chars.txt --flavor=woff2 --layout-features='*' \
  --output-file=samples/hundred-arms/src/fonts/ShipporiMincho-Regular.subset.woff2
```

## Licenses

- Code: MIT (`LICENSE`)
- Script text (`samples/hundred-arms/script/`): CC BY 4.0, author あろすてりっく (`script/LICENSE.md`). Never change the script's wording; a test checks `script.json` against `original.txt`.
- Font (`samples/hundred-arms/src/fonts/`): SIL Open Font License 1.1 (`OFL.txt`)
- The official sample densetsu-no-tantei has no license notice, so do not copy its code.

# Quality assurance: three agreements

Three things the checks, the screen renderer and the guides all depend on. Threads that build one of them read this first and do not change it without telling the thread that owns it (the check entry: the one that owns `tools/check/index.mjs`). This file is the spec; `docs/new-work.md` and the skill only point here.

## 1. The check command

One command a work runs, and an AI or an author reads:

```bash
npm run check            # in a work; runs: node node_modules/@uzu-toolkit/toolkit/tools/check/index.mjs .
node tools/check/index.mjs <work dir> [--allow rule,rule] [--out dir] [--shots auto|none]
```

- It runs every static check (`checkWork` in `tools/check/static.mjs`, which wires in `parts.mjs`, `look.mjs`, `pictures.mjs` and the others), then, if a browser is available, renders the screens for the shots list. It never stops for lack of a browser: shots then say `none` and why, and the static result stands.
- Exit code: 1 when there is any error, otherwise 0. Warnings, missing items and a failed shot never change it.
- It prints, in this order, and writes the same to `<out>/report.json` (default `<work>/check-out/`, which a work's `.gitignore` lists):

```
ERRORS   (n)   rule  file:line  message
WARNINGS (n)   rule  file:line  message
NEXT           what to do, one line each, the errors' first, then what is not made yet
SHOTS          none (reason)   |   a list: key  orientation  path
```

```jsonc
{
  "ok": false,                       // no errors
  "errors":   [Finding],
  "warnings": [Finding],
  "next":     ["Make public/assets/stand-a.webp (326×692) from the order sheet.", ...],
  "shots": { "mode": "browser" | "none", "reason": "…",   // reason only when none
             "files": [{ "key": "02-opening", "label": "…", "orientation": "landscape", "path": "check-out/shots/02-opening-landscape.png" }] }
}
```

`next` is the `fix` of each finding (without repeats, errors first) followed by items a check reports as missing without a finding (fonts not built, pictures not made while `brief.md` exists). Each line is one imperative sentence an AI can act on without reading the rule.

The shots are the screens the work's `shots.mjs` lists (the toolkit's default list when it has none), in each orientation its manifest allows. The list is the picture of the work the author is shown; nothing else is reported as seen.

## 2. A finding

```ts
interface Finding {
  rule: string;      // kebab-case name, unique: 'stand-ratio', 'raw-colour', 'bare-button'
  file: string;      // relative to the work; '' when about the whole work
  line: number;      // 0 when about the whole file or work
  message: string;   // what is wrong, with the numbers, and what is expected
  fix?: string;      // the one next step, imperative; goes to `next` in the report
}
```

A check is a function in a file of its own under `tools/check/`:

```ts
export function check(dir: string, ctx: { manifest: object; sources: Map<string, string> }):
  Array<['errors' | 'warnings', rule: string, message: string, file?: string, line?: number, fix?: string]>;
```

- The tuple's first four elements are what `checkPictures`, `checkPictureColors` and `checkLook` return today (the fifth and sixth are new and optional), so they keep working unchanged.
- Only the owner of `tools/check/index.mjs` and `static.mjs` wires a check in. Another thread writes its function and a fixtures folder (`tools/check/fixtures/<rule>/{ok,bad}/`) and asks for the wiring.
- A rule an author may turn off by name is listed in `ALLOWABLE` of `static.mjs`; the report says why under "What you could not do or check". A line that must stay says `uzu-check-ignore` in a comment on it or the line above.
- Errors are what the docs forbid or what no eye can see; warnings are style (`docs/decisions/2026-11-13-checks-fail-only-on-what-the-docs-forbid-and-warn-on-style.md`).

## 3. Rendering one screen

`tools/screen-preview/render.mjs` draws one screen of a work in one orientation and says where its parts are. The check's shots and the slide comparison both use it.

```ts
render(workDir: string, spec: {
  screen: string;                       // a key of the work's shots list, e.g. '02-opening'
  orientation: 'landscape' | 'portrait';
  size?: 'lower' | 'device' | 'wide' | 'reference';   // as capture.mjs; default 'device' (844×390 / 390×844)
}): Promise<
  | { ok: true;
      png: string;                      // path of the written image
      width: number; height: number;    // CSS px of the screen
      em: number;                       // px per em on this screen
      boxes: Array<{ part: string; x: number; y: number; width: number; height: number }>;   // CSS px from the screen's top left
      messages: string[] }              // console errors, page errors, failed requests (404), one line each
  | { ok: false; reason: string } >     // never throws for a missing browser or a work that does not start
```

The module also exports `screens(workDir): Promise<string[]>`, the keys of the work's shots list in order, which the check walks. `render` takes an optional `out` (a folder for the image) and returns `label` (the screen's label) beside `png`.

```bash
node tools/screen-preview/render.mjs <work dir> --screen 02-opening --orientation landscape --out dir [--json]
```

- `boxes` has an entry for every element carrying `data-uzu-part` (its value is `part`; the first word when it holds several), plus `main` for `data-uzu-actions="main"`, `phase` for `data-uzu-phase` and `scroll` for `data-uzu-scroll`. It is the same set the screen preview numbers, so a box means the same thing in both.
- One call plays the work to that screen the way `capture.mjs` does (the work's own `shots.mjs` steps). The screen is drawn by the work's real code and CSS.
- Two ways to reach the same result, picked by the renderer, never by the caller: the dev harness (the SDK's, where it runs) or a standalone page (the SDK replaced by a stand-in, the page served from memory so no navigation is needed). The result is the same shape; a standalone run says so in `messages`.
- A caller reads `ok: false` as "no shot", not as an error of the work.

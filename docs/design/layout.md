# Layout definitions

Read this when you touch a screen laid out from a layout definition (the stage read-through), or the tools in `tools/layout/`. Rules every screen follows are in [../design.md](../design.md).

A layout definition is one JSON file per screen that says which parts the screen has, where each sits, which image each takes, and which parts each scene shows. It is the one source of those numbers: the screen reads it, `npm run layout:export` writes it out as slides to move boxes on, `npm run layout:import` reads the edited slides back into it, and `npm run layout:brief` writes the list of images to make and the prompts for an image generator. UZU's design guide is the toolkit's starting point; a work may ship its own copy and change it.

The toolkit's one layout so far is the read-through's: `packages/reader/src/layouts/read-through.layout.json`, the guide's numbers (https://docs.code.uzu-app.com/guides/design/reading).

## Format

```json
{
  "screen": "read-through",
  "source": "https://docs.code.uzu-app.com/guides/design/reading",
  "reference": { "landscape": [874, 402] },
  "parts": {
    "frame": { "label": "セリフ枠", "image": "frame", "landscape": [68, 233, 738, 140] },
    "plate1": { "label": "名札① 話している人", "image": "plate", "stretch": true, "landscape": [84, 217, 190, 32] }
  },
  "reserved": { "logo": { "label": "UZUのロゴ", "landscape": [68, 8, 44, 44] } },
  "margin": { "landscape": { "top": 0, "right": 62, "bottom": 21, "left": 62 } },
  "scenes": [
    { "id": 1, "key": "self", "label": "自分が話している", "show": ["frame", "plate1"], "mine": ["frame", "plate1"] }
  ]
}
```

| Field | Meaning |
|---|---|
| `reference` | The reference screen per orientation, `[width, height]` in px. An orientation left out is not supported. Landscape alone unless the spec asks for portrait |
| `parts` | Keyed by part id (letters and digits; the id is how slides are read back, so it never changes). Each has a `label` for people, a box `[x, y, width, height]` per orientation, and optionally `image` and `stretch` |
| `image` | The picture drawn in the box, `assets/<image>.webp` in the work. Parts naming the same image share it, so a work keeps one frame, one nameplate. `{role}` stands for the role shown (`stand-{role}`). A part that takes your colour in some scene (`mine`) also has `<image>-mine`, used on your turn, since the colour is what shows the turn. No `image`: the screen draws the part from colour tokens, as it also does while the image (or its `-mine` picture) is missing |
| `stretch` | The image keeps its ends and stretches in width to the box (a nameplate fitting its name). Without it the image is drawn at the box's size |
| `reserved` | What UZU draws over the screen (logo, indicator, toast). Shown on the slides, never used by a part |
| `margin` | Edges that stay empty |
| `scenes` | One per screen of the guide: `show` lists the parts it shows, back to front; `mine` the parts that take your colour |

Text (the line, names, labels) is never in an image: the screen sets it from the script and the strings. Behaviour (which scene a line is, who reads next) is code, not layout: for the read-through, `stageScene()` in `stage-layout.ts`.

`layoutProblems()` (from `@uzu-toolkit/reader/stage`) lists what is wrong with a layout: unknown parts in a scene, missing boxes, ids or image names that are not plain.

## Slides

One slide per scene, in the order of `scenes`, at the reference size. A pptx holds one slide size, so each orientation is its own file: `layout.pptx` when the layout has one orientation, `layout-landscape.pptx` and `layout-portrait.pptx` when it has both. Each part the scene shows is a box with its label, id and size written inside (`名札① plate1 190×32`); the box's text is how it is read back, so slide tools that drop shape names (some do on export) lose nothing. Boxes are placeholders, not the work's art.

Reading back: a box whose text holds a known part id moves that part; a part moved to different places on two slides is reported as a conflict and not applied; a box with no known id is reported as a new part; a part missing from a slide that should show it is reported as removed. Moves go into the JSON; new parts (a new button) need code and are left to whoever implements them.

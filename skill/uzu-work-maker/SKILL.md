---
name: uzu-work-maker
description: Make a UZU Code murder-mystery work (a read-through on the stage screen, phases, handouts) from an author's plan with UzuCodeToolkit, including its pictures. Use when the author gives a plan, script or order sheet for a UZU Code work, or asks for its pictures.
---

# Making a UZU Code work from a plan

This skill is the loop. The procedure itself is in `references/` (copies of the toolkit's docs); read them, do not work from memory. If the toolkit is installed (`node_modules/@uzu-toolkit/toolkit/`), its docs and tools are the current ones and win over the copies here.

1. Read `references/toolkit-README.md`, then `references/new-work.md`, and follow `new-work.md`. Ask the author once only what changes how the game plays; fill the rest with defaults and list them.
2. Pictures (whenever the plan names a look; do not ask the author whether to make them), in this order, each step finished before the next:
   1. Make the order sheet (`new-work.md`, "Pictures", step 2).
   2. Generate each picture of the sheet with your image generation, one picture per generation, at the sheet's size, in the sheet's order. Never generate the whole scene and cut parts out of it (the parts come out small and blurred). Never draw a picture with code (PIL `ImageDraw`, canvas, SVG, a script that paints the set) as a stand-in; if you cannot generate images, leave them out, keep `brief.md` in the output and say why in the report. Converting a generated PNG to WebP is fine.
   3. Put them in `public/assets/` under the sheet's names.
   4. Run `node node_modules/@uzu-toolkit/toolkit/tools/check/static.mjs .`. Read every line. Fix every error and every picture warning, or list the warning in the report. `picture-contrast` and `stand-ratio` are errors; only `--allow <rule>` turns one into a warning, and then the report says which and why. Run it again.
   5. Make the composite check pictures of every scene: `python3 node_modules/@uzu-toolkit/toolkit/tools/check/compose.py .` (in the toolkit's repository: `python3 tools/check/compose.py <work folder>`; needs Pillow only, no browser; it writes `screen-check/`). Look at every picture with the checklist below, against the guide's arrangement (`references/layout.md`). Make again only the pictures that are wrong, then repeat from 4.
3. Write the fonts test (`test/fonts.test.ts`) even where `npm run fonts` cannot run; it stays red, and the report says so.
4. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Say which you could not run and why.

## What to look at in each check picture

For every scene and both orientations, answer each line yes or no (line 7 also gives the source of each picture). Paste the answers in the report (one line per scene); a scene you did not look at is listed as not looked at.

1. No grey box (a picture that is missing)?
2. Every standing character's head and face show above the frame and nameplates (the body may run behind the frame)? A character drawn small at the frame's foot is a picture of the wrong shape.
3. Every picture sits in its outlined box, none stretched or cut off (a frame or button is not squashed, a nameplate keeps its ends)?
4. The surface text will sit on (frame, log panel, nameplate, button) is plain or softly shaded? Rules, stripes and patterns only at the edge, never under the text.
5. A scene that takes your colour (`mine`) shows the `-mine` picture, and it differs from the base picture only in colour?
6. Every box is where the guide puts it (you changed no box without the author asking)?
7. Where each picture came from: was every one made by image generation, none drawn by code (PIL, canvas, SVG, a painting script)? Write one line per picture file: the prompt you gave the generator, or "not generated" and why. A picture that was not generated is replaced, left out, or asked of the author, and the report says so.

## Done means these outputs, not your impression

You may say the work is done only after you have pasted, in your last message: the final output of the static check (zero errors), the answers to the check-picture list, and the three lists of `new-work.md` plus the slides master (where `slides/*.pptx` is). A step you did not do is listed under "What you could not do or check", never skipped silently. Never claim a check passed that you did not run.

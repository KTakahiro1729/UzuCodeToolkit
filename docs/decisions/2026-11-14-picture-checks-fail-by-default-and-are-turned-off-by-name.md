# Picture checks fail by default and are turned off by name

Two ChatGPT runs (0.1.6) showed what an agent skips when a step is only advice: the first made no picture (the procedure asked whether the author wanted any, and recommended "colours and typefaces first"), the second made a frame too dark for its text (1.32:1) and standing pictures of the wrong shape (ratio 0.68 against 0.47), and neither applied the fonts. The rules that follow:

- A plan that names a look gets pictures without a question. An agent that cannot generate images writes why in the report and leaves `brief.md` for the author; `pictures-none` fails a work with `world.md` and neither pictures nor `brief.md`.
- `stand-ratio` (a standing picture 25% off its box) and `picture-contrast` (mean colour of a frame, plate or panel against the text colour under 4.5:1, measured with Pillow) are errors, not warnings. The default is the stricter one; a work that means it passes `--allow <rule>` (`checkWork(dir, { allow })`), which reports the rule as a warning marked `(allowed)`. Only these three rules can be allowed; certification errors cannot.
- The fonts test is written even where fonts cannot be built; it stays red until `npm run fonts` runs, and the report says so. It is in `template/test/`.
- The per-question answers to the check-picture list were left out: they are the agent's own account of itself and add length without a gate.

The mean-colour measure is rough (a picture dark only at its edge passes; a textured one can fail), which is why the rule can be allowed.

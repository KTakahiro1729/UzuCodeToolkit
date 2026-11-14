# The checks run as one command with a fixed report

Why: an AI that builds a work has to know what to fix next without reading each rule, and the author has to see the screens. Several commands (static checks, overflow, shots) were run or skipped one by one, and a missing browser silently dropped the part that shows the work.

How: `npm run check` (`tools/check/index.mjs`) runs every static check and then draws the work's screens when a browser is there. It prints errors, warnings, what to do next and the shots list, and writes the same to `check-out/report.json`. A missing browser or a screen that cannot be drawn is reported (`shots: none (reason)`) and never changes the exit code; only an error does. The shape of the report, of a finding and of the render call is `docs/qa-contract.md`.

Not taken: one command per check (the AI would pick), failing when no browser is there (an AI in a sandbox would be stuck on something it cannot fix).

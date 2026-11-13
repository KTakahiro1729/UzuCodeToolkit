# A test that starts `uzu dev` stops it on every way out, including a killed test process

Why: `allPhases` started `uzu dev` through `npx` and shell wrappers, and stopped it only in a `finally` with `process.kill(-pid)`. On Windows that call fails and the fallback killed only the shell, so servers stayed; and a test run stopped with Ctrl+C or killed by the runner never reached the `finally`, on any OS. Servers piled up across runs.

Taken: the tree is stopped with `taskkill /T /F` on Windows and a SIGTERM to the process group elsewhere (then SIGKILL after 5 s). `uzu dev` starts vite in a session of its own, so a plain SIGKILL of the group orphans vite: `uzu dev` must be asked to quit. `exit`, SIGINT, SIGTERM and SIGHUP handlers stop what is still running. A small watcher process, fed by a pipe from the test process, does the same when the test process is killed outright. `harness.mjs` also stops on SIGHUP and on exit.

Not taken: a global test setup that starts one shared server (a bigger change to how tests are written); a kill-by-port sweep (can hit the owner's own servers).

Where: `tools/e2e/all-phases.mjs`, `packages/reader/harness.mjs`.

# Each release also carries a zip of a work template with everything installed

Why: the first agent the author uses (ChatGPT) often runs in a sandbox with no network, so `npm i <release URL>` fails there. A zip that holds the template and a complete `node_modules/` needs no install: the agent opens it, and the checks that need no network run.

How: after the Release workflow makes the release, it runs `packages/toolkit/make-offline-bundle.mjs`, which copies `template/`, sets the toolkit URL to that release, runs `npm install` (npm 11) and adds `START-HERE.md` (from `packages/toolkit/OFFLINE.md`); the folder is zipped as `uzu-toolkit-offline-<version>.zip` and attached. About 45 MB (119 MB unpacked). The binaries in it are the runner's: 64-bit Linux, glibc. Fonts (`npm run fonts`), new installs and `uzu publish` still need a network and are left to the author.

Not taken: an npm cache for `npm install --offline` (the agent would still have to run an install, and a cache holds only the maker's platform too); one zip per platform (add one when a second platform is needed).

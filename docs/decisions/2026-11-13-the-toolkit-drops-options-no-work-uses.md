# The toolkit drops options no work uses

A YAGNI review (InterstellarBoardGame and the samples use none of these) found options added to follow the official murder-mystery guide, with no work asking for them. The owner agreed to remove:

- **The clock's placement** (`TransitionFooter` `clockAt`, `band.clock`): the time left stays the footer's leftmost item.
- **The count in the waiting note** (`status.waitCount`, `wait.ts`): the note is always `status.waitOthers`. A work that wants other words sets that string through `strings`.
- **The `majority` transition rule**: no phase, work or test needed it. `anyone`, `everyone` and `{ only }` remain.
- **The warnings `no-orientation` and `no-toolkit`** of the static check: certification does not require a manifest orientation, and using a toolkit part is not a defect. `no-max-width` stays: the operators recommend it for portrait works. Narrows `checks-fail-only-on-what-the-docs-forbid-and-warn-on-style`.
- **The exports** `handoutReopen`, `handoutDone`, `handoutKeep` and `readyDone`: only `handoutScreen` and `castScreen` use them.

Kept for now: `timedPhase`, and the game-select `facilitator` and `memo`, until the second trial of a plan shows whether a work needs them. The reader's replaceable screens (`shell` and its parts) stay; making them private is the owner's call.

Where: `TransitionFooter.svelte`, `TopBand.svelte`, `store.svelte.ts`, `CastView.svelte`, `HandoutView.svelte`, `strings.json`, `kit/src/transition.ts`, `tools/check/static.mjs`, `docs/design/chrome.md`.

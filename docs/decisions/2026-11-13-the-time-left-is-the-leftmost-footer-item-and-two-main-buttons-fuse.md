# The time left is the leftmost footer item, and main-button candidates fuse into one capsule

- The time left is always the leftmost item of the footer row, large and dark. The action that goes with it (more time, pause) follows to its right, and the main button stays at the right end.
- Wording: the note for a next-phase button any one player can tap is `押すと全員が進みます` (`status.anyoneNext`; the old text could be read as "everyone taps"). A seat that sits a game out sees `観戦中です` (`game.watching`).
- When two or more buttons in the main row could each be the main one, they are fused into one capsule (round at the outer ends, a thin seam between), the one to press now last. A work chooses which buttons they are.
- A button that ends a phase (such as ending the free time) reads `次のフェーズへ` by default; the conditions that move a phase differ by work, so the toolkit does not fix a wording (a work passes its own `finish`).

- Pause is the toolkit timer's own feature: any player pauses and resumes it for everyone (`pause` / `resume` actions of the handout phase, `TransitionFooter` in the reader); the time left stands still while paused. `needed(rule, seatCount)` in the kit gives how many seats a people rule needs.

- The time item shows no clock mark (the name 残り says what the number is), so the room goes to the digits; the pause item is named 停止 because 一時停止 plus the clock and the extension leave the main button too little room on a 390px screen. The row's gaps and the button's side padding are tighter for the same reason, on every screen.

Not taken: a time that is not at a fixed place. Where it shows: `HandoutView`, `Slot`, `FooterActions`, `strings.json`, `docs/design.md` (Footer).

# A phase moves on by time or by people, and the footer shows which

Why: transition conditions differ per work, so the toolkit fixes only how a condition looks in the footer and keeps its API small (`done` and `deadline` already express every case). Replaces nothing; builds on "The footer is one row: items at the left, the main button at the right, its note inside it".

## The two triggers

- **Time**: the phase ends when its time runs out. Sub-options: pause, and skip.
- **People**: the phase ends when people act. The rule is the work's choice: anyone (one person), everyone, a majority, or a designated seat (the read-through's current reader).

Skip is a time option whose "who" is a people rule: people can end the time early. "Time OR people" is therefore not a pattern of its own (the handouts are time with skip by everyone). "Time AND people" is not built: it is two steps, a time phase and then a people phase.

Pause is the toolkit timer's own feature (not the UZU game pause): one player pauses and resumes it for everyone.

## What the footer shows

- The label is the work's words for what the player does (`準備OK`, `読み終えた`, default `次のフェーズへ`). The note is the rule's words for the result, and appears only where the player would otherwise guess (cannot press, waiting, moves everyone).
- Notes: anyone → `押すと全員が進みます` (was `全員で進みます`; the old wording also reads as "everyone must press"); everyone, after pressing → `他の人を待っています`; majority, after pressing → `あと{n}人で進みます`; designated seat, others → `相手の番です`; a seat that may not press → `観戦中です` (was `観戦中は押せません`). All other notes stay as they are.
- Time: the time left is the leftmost item in every footer, large and dark; its operations (pause or resume, one more minute) follow it to the right; the main button stays at the right edge. A time-only phase (no skip) has no main button: the clock is large and the pause item follows it, with no note.
- A pressed toggle stays outlined with a tick, and tapping it again takes it back (unchanged). Who is done shows as ticks on the band's icons, with no count.

## Toolkit changes (small)

- `kit`: `needed(rule, seatCount)` gives how many seats must press (anyone 1, everyone all, majority more than half, designated 1); the timer's pause state (pausing keeps the time left; resuming moves the end by the paused span, from `ctx.time`, so it stays deterministic).
- `reader`: one footer part that takes the label, an optional time, and an optional people state (needed, said, mine) and picks the main button's state and note. Extension of time and going back (`reopen`) stay with the handout phase until a second phase needs them.
- New strings: pause, resume, and the notes above.

## Not taken

- A separate skip button outside the people rules (a second way into the same behaviour).
- A disabled "next" button with the note "moves on by time" on a time-only phase (a button that can never be pressed).
- Making the work-level end of a game (chess, cards) a phase trigger: the game's rules end it, and the footer only shows what follows.

Where: `packages/kit/src` (a people-rule helper, the pause state in the timer), `packages/reader/src/components` (`FooterActions`, `Slot`, `Button`, `HandoutView`, `EmptyView`, `CastView`), `packages/reader/src/strings.json`, `docs/design.md` (Footer).

# Phase progress follows the official murder-mystery guide where it fits

Superseded in part by 2026-11-13-the-last-30-seconds-have-no-edge.md (the edge) and by 2026-11-13-the-wait-note-says-how-many-are-left.md (the wording).

Read against https://docs.code.uzu-app.com/guides/murder-mystery (phase progress: §0, §1, §2, §4, §11). The guide's three ways out of a phase (everyone presses, the time runs out, a facilitator advances) match the toolkit's time and people triggers (a designated seat is the facilitator). The guide says nothing on pause, extension or skip, so those stay as decided in "A phase moves on by time or by people, and the footer shows which". This adds to that decision; it replaces only the "no count" line noted below.

## Decided

- **Waiting shows how many are still to go, as an option.** A work chooses whether the note of a waiting button carries the number (`あと{n}人を待っています`) or the plain sentence (`他の人を待っています`). Default: the plain sentence, as before. The ticks on the band's icons stay and carry no count; this changes only the note, and only where a work asks for it. The guide asks for "how many more / how many more minutes" while waiting; the work decides how much to show.
- **The time left can sit in the footer or in the top band.** It is a part with no fixed place: the footer's leftmost item by default (with its pause and extension items), or beside the phase label in the band when a work puts it there. A work that moves it keeps the pause and extension items in the footer.

## Adopted without a question (nobody objected)

- A phase that has a natural facilitator can limit the main button to that seat (`{ only }` already exists in `needed()`); the default stays "anyone". Who can press is the work's choice.
- The last 30 seconds of a timer are shown heavier and darker, with an edge. No red (red is for danger) and no motion.
- A seat that cannot press and is not simply waiting for a turn sees `{name}が進めます` in a facilitator phase; the read-through keeps `相手の番です`.

## Not taken

- A "curtain" at each phase change (a short banner naming the new phase). The guide asks for both the plate and the curtain; the owner decided the phase label in the band is enough.
- Moving the time permanently into the band (the guide puts the phase plate and the timer side by side): the owner wants it movable, not fixed.
- A rescue seat that can force a phase on: a work adds one when it needs it; a phase that waits for everyone states its condition in the note instead.

Where: `packages/reader/src/components/TransitionFooter.svelte` (the note's variant, the clock's placement, the last-30-seconds look), `packages/reader/src/strings.json`, `docs/design.md` (Footer, Top band).

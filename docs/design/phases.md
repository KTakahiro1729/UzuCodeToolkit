# Screens between the games

Read this when you touch the introduction, an empty phase, the phase list or a phase change. Rules every screen follows are in [../design.md](../design.md).

## Guide

- A phase's screen may open with what to do now, in a line or two of UI text
  at the top (`guide`, the work's own words). It is part of the screen's
  content and scrolls away with it; it never floats over the screen or stays
  pinned (owner's decision). It needs no tap: no window to close. Only where players
  would otherwise guess (why the game waits, what is secret), not to repeat
  the band.

## Introduction with the cast

- The introduction shows its story text, then the game's flow (`FlowStrip`),
  then the cast. Your part has a block of its own (`cast.mine`; icon, the
  part's name bold, one line on who they are) in your role's tint. The other
  parts follow under `cast.others` as plain text on the page, with no block
  (small icon, name, one line), so nothing in the list looks like a choice
  that can be changed.
- In the footer one ready button (`button.ready`), with no count of who is
  ready (owner's decision). Once tapped it keeps its name, turns outlined in a
  dark 2px edge with a tick (never red), and the band checks your icon (`readyDone`); tapping it again
  takes it back (owner's decision, a toggle: `Button` `on`). The
  phase moves on when everyone is ready.
- On a landscape screen the story text over the flow stands beside the cast.

## Phase changes

- When the phase changes, the old screen fades out, then the new one fades in (200 ms each, one at a time, instant with reduced motion). The band's phase label changes with the screen: the old label fades out with the old screen, then the new one fades in with the new screen, so two labels never show at once.
- The first screen, shown as the game loads, does not fade in.

## Empty phase

- A phase with no game of its own (an empty phase) shows the next button, centred, labelled `button.nextPhase` with the note `status.anyoneNext`, under optional story text (such as an introduction): left-aligned paragraphs in the story font, at the chat's reading width. Without text it holds the place of a phase not made yet. Every player can tap it; the first tap moves everyone on. The band's phase label names the phase.
- On the last line of a read-through that another phase follows, the advance button says `button.nextPhase` instead of `button.end`.

## Phase list

- The work's phases in order, opened from the footer, so a player can see
  where the game is and what comes next. One column at the chat's reading
  width; it scrolls when the phases do not fit, starting with the current one
  in view.
- Each entry is a number and the phase's band label. Phases in a row that
  share a label (such as the handouts and the pause after them) are one entry.
- Each entry is a card of its own (a block of information: `--radius-read`,
  `--color-bubble`), in text larger than body text since the list is read at a
  glance. The current entry's card is tinted (`--color-bubble-mine`, not the
  button's blue, which means tap) and bold. Entries already over keep the
  white card with the quieter text colour; sitting above the current one
  already says so. Once the game has ended, every entry is over.
- The introduction and the empty phases (the screens that wait for everyone or
  for a tap) show the same list under their content with the heading
  `footer.flow`, in a work of more than one phase (`FlowStrip`); it scrolls
  with the content and does not scroll itself.
- Reading only: tapping an entry does nothing. No player moves the game from
  here (owner's decision; the official sample's list that moves everyone
  belongs to its game-master seat, which this toolkit does not have).

## Other screens

- Screens other than the read-through, such as the afterword, do not use the
  chat style. They follow the same rules.

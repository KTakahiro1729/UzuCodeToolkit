# Games

Read this when you touch the game select or a game. Rules every screen follows are in [../design.md](../design.md).

## Whose turn (games)

- As in the read-through: on your turn your button for the next step is
  filled; on another player's turn that player's block (name, hand) sits on
  white, and your buttons grey. Nothing else marks the turn: no outlines, no
  tints. A game without player blocks (chess) says whose turn it is in a short
  line instead.

## Time left

- A timer shows the time left as m:ss (`TimeLeft`), from the game time the
  state holds, so every player sees the same.

## Watching a game

- A seat that sits a game out watches it: it sees only what every player may
  see, and no buttons of the game. The game's screen gets `watching`.

## Game select

- The games this many players can play, as a list of choices (Look by role:
  an edge, no fill, filled when selected): the game's
  name, and under it in the quieter colour how many play, who watches when the
  spectator sits out, and the game's own line (`description`), joined by
  `list.sep`. The item that leaves the list reads `button.nextPhase`, or the work's
  own label (such as 暇つぶしを終える), since leaving the list ends the phase. A game that
  does not take this many players is left out, unless the work names a
  spectator part and the game takes everyone else: that part then watches
  (owner's decision for InterstellarBG, where the half-GM part watches).
- A tap on the list only selects a game (filled, as a pressed choice); the
  play button (`game.play`) in the footer starts it for everyone, and stays
  greyed until a game is selected (owner's decision). One tap by any player
  never starts a game nobody can leave.
- Beside the play button, leaving the phase is an item at the left, not a capsule:
  it is not the next step on this screen, and it cannot be undone.
- While a game is played, the game fills the screen and the band names it.
  There is no way back while it runs (owner's decision: the only way back in
  the work is the step after the handouts). Once the game is done, its result
  stays and the back button appears in the footer.
- A game taller than its space scrolls there; it never runs under the footer.
- A seat that sits the game out sees `game.watching` in the footer, in the
  quieter text colour, until the back button takes its place.
- On a landscape screen the list has three columns, so it fits without
  scrolling.
- Playing cards are Kennard's deck, each face loaded the first time it shows.

# Band, footer, buttons, sheets

Read this when you touch the top band, the footer, a button or a sheet. Rules every screen follows are in [../design.md](../design.md).

## Buttons

- One `Button` everywhere (`packages/reader`). `primary` is the next step,
  filled; one screen has at most one primary at a time. `secondary` is any
  other choice, outlined with no fill (Look by role). A choice that stays selected (such as your vote) takes
  the primary's fill while selected (`pressed`).
- A button greys only while it cannot be tapped, never to look quieter.

## Top band

- A full-width row on a white background that reaches the top edge behind the
  HUD, tall enough for icons with names under them (`--band-h`).
- Whether it shares the HUD's row depends on how much of the screen width the
  HUD takes. Over a quarter (phones held upright, about a third), the band is
  its own row under the HUD, so the centred phase label keeps clear of the
  HUD. A quarter or less (landscape and tablets, under a fifth), the band
  shares the HUD's row with the HUD over its empty left part, so the chat
  keeps the height. Nothing else shares a row with the HUD.
- Under the HUD (an upright phone), the phase label goes up into the HUD's row,
  centred in the room beside the HUD, and the players keep the band's own row
  under it, at every width down to 320px; a name too long for its room ends in
  an ellipsis.
- Under 480px tall (a phone held sideways) each player's icon and name sit side
  by side and the band is shorter, so the text under it keeps the height.
- Shows every player as icon and part name, ordered like the chat: the other
  players left (in the script's order), you right. A part that reads several
  roles shows its first role's icon. Each name sits under its icon. Your role's icon has a
  double circle (a ring around it), since order alone does not say which one
  is yours. Band text is
  bold.
- The phase label changes when the screen below it does (for example when the
  afterword appears), never before.
- It does not signal the turn; the current line does. In a phase every player
  finishes on their own (the handouts), a small check at the lower right of an
  icon marks that player done, so you can see whom you are waiting for. No
  count is shown.
- Shows the current phase of the game (read-through, afterword, or other) as a
  short label from a key, in every phase (owner's decision), centred on the
  screen. In a work of more than one phase the label is a button (a pill with
  a down mark) that opens the phase list as a sheet. When the players need more than the right half (several players on
  an upright phone), the label gives way to the left, keeping a gap.

## Footer

- **Options on the footer** (a work chooses; the defaults are the plain forms):
  - The time left (`TransitionFooter`) is the footer's leftmost item; pause and more time follow it.
  - The last 30 seconds of the clock are heavier and darker, with no edge: no red (red is for
    danger), no motion.
  - A phase that one part moves on (`emptyPhase({ facilitator })`, view prop `facilitator`) shows
    the other seats a greyed button with `status.facilitator` (`{name}待ち`). The
    read-through keeps `status.theirTurn`.
- The main action area: a full-width white block along the bottom edge, the
  band's counterpart, on every screen, as one row.
- **The main button** is at the right edge, one fixed width; **it is
  always the one to press now** (the send button of a chat), in every phase. It is the
  filled one, a fixed 8.4em wide in every state, at least 3.5em high (about 9mm or more, for a thumb at the edge of the
  screen) with room for a label and a note, so the footer keeps its height in every
  state. Screens put it there with `FooterActions`. Buttons beside it that could
  each be the main one are fused with it into one capsule (round at the outer ends, a thin
  seam between), the one to press now last. A work chooses which; the toolkit does not.
- **Items** are at the left: plain text in the quiet colour over a mark, no capsule,
  so the one filled capsule stays the one to press now (`Slot`). They are the read-back
  items (the handouts, once the game has left a phase whose content stays readable,
  `PhaseView.keep`), more time, leaving the game select for the next phase, and the time
  left (large and dark, the one number to watch). At most three, plus the main button.
  The mark never stands alone (▤ ◷ ＋ »): the name is always written. Items go into
  `FooterActions place="aside"`; the open read-back item is bold and underlined.
- **The note.** A button whose state is not obvious says why in one short sentence under
  its label, inside the button (`Button` `note`, `status.*` strings): "他の人待ち"
  after you tap ready or done, "相手の番です" while another player reads, "設定が未記入"
  while the handout's done button is greyed, "選ぶと押せます" on the play button,
  "押すと全員進む" on a next-phase button any one player can tap for everyone. The label and the note are one line each: the main button has a fixed width, so each is at most 7 full-width
  characters (`packages/reader/test/notes.test.ts` fails on a longer `status.*` or `button.*` string; a work's own test calls `fitsButton(label, note)` from `@uzu-toolkit/reader` on its labels). A button that
  can be pressed and says what it does by its label alone has no note: text is read only
  where its absence would leave the player guessing. It states a fact of the screen; it
  never repeats the label or invents a rule. 16px, quiet colour.
- **Labels say what moves.** The read-through's advance button is `▼ 次のせりふ`; a button
  that moves the game to the next phase reads `次のフェーズへ` (`button.nextPhase`) without
  the phase's name (a narrow button may say `次へ` with the longer sentence as its note);
  the cast's is `準備OK`, the handout's `読み終えた`. `次へ` alone is not used for both.
- **Red is for danger only.** A dangerous action (one that loses what a player
  made) is a secondary button whose label and edge take `--color-danger`
  (`Button variant="danger"`). Red means nothing else, and a danger button is
  never the rightmost one of the main row, which is the button to press now: it
  goes before it. A pressed toggle is not red.
- A read-back item opens a sheet over the screen, for this player alone;
  the screen keeps running under it and the footer's actions stay usable.
  The sheet rises from the footer: a panel whose bottom edge is flush against it, its
  sides at the screen's edge where the screen is narrow, only its top corners round,
  a strip of the screen left above it, and the screen behind dimmed
  (`--color-scrim`) rather than hidden, so the reader keeps their place. It slides up
  and fades in (200 ms, transform and opacity). The
  handouts' sheet is the one players open any time after the handout phase;
  tapping the dimmed part closes it like the close button. The band and footer
  are not dimmed. The sheet's title and a
  close button share its top row; tapping the open item again also closes
  it. A phase change closes the sheet. The phase list opens from the band's phase button.
- Every button says what it does, and whether to press it shows at a glance:
  filled for the step to take, greyed when it cannot be pressed now, outlined
  for a side action (secondary).

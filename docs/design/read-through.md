# Read-through screens

Read this when you touch the read-through: the chat, the stage layout, the end screen. Rules every screen follows are in [../design.md](../design.md).

## Focus and hierarchy

- During the read-through the focus is the newest line, at the bottom, and the
  advance button right under it, in the footer. The advance button reads
  `▼ 次のせりふ` (`button.nextLine`) with the mark before it. On the last line of a
  read-through that another phase follows it reads `button.nextPhase`.
- A newest line taller than the chat shows from its top, its speaker's name
  included, so its reader starts at its first words and scrolls on; earlier
  lines can always be scrolled back to.
- When you read, the line being read takes the button's blue, so line and
  button read as one cue. The other role's lines are always white.
- Every player sees the button. It is filled for whoever reads now and greyed
  for the others, so each player knows at a glance whether to read or to wait.
  Nothing else on screen signals the turn.
- The button is always there during the read-through, so it never moves the
  lines. It carries a short label from a key (read, then tap) until your first
  line is read, then the next mark (a small down-pointing triangle) alone. On
  the last line it carries an end label from a key instead of the mark, since
  that tap ends the read-through rather than showing a next line.
- Lines are told apart by side (yours right, as in chat apps), by the
  speaker's icon and name, on one row above the bubble. Your role's
  bubbles are tinted; the other role's are white. All lines keep full text
  contrast.
- A player may read several roles (a part). Every line of those roles counts
  as yours: right side, tint, and the button when it is current.

## Stage read-through (UZU's layout)

- The read-through's second screen, on UZU's design guide (`StageReadThrough`; why: docs/decisions/archive, the-official-read-through-layout-is-a-second-screen and in-the-stage-layout-the-turn-rules-follow-the-guide). One dialogue frame shows the line being read, with the speaker's nameplate above its left edge and the next reader's beside it; the characters stand behind.
- Your turn: the frame and nameplate ① take your colour, nameplate ① says whose turn it is, and the next button (dark, so it stands out from the frame) is at the frame's lower right. Another's turn: no button; nameplate ② shows the next line, in your colour when you read next. The log link is always at the lower left and opens the log over a dimmed screen, without characters.
- It is the whole screen: no band, no footer. Sizes come from the guide's reference screen scaled to the screen, text 18px (never under 16px). The numbers are in `layouts/read-through.layout.json` and nowhere else ([layout.md](layout.md)).

## Dialogue line (read-through only)

- The speaker's small icon and name on one row, the bubble under them. Your
  role's lines on the right, the other role's on the left.
- The bubble's top corner on the speaker's side is square, pointing up to the
  speaker; the other corners are round.
- Only the button advances; tapping elsewhere does nothing, so a stray tap
  never skips a line.
- A line spoken together shows the speakers' names joined (`name.and`) and the
  first speaker's icon; that speaker reads it. A line marked as continuing the
  previous speech shows no icon or name, and all its bubble's corners are
  round.
- A bubble is as wide as its longest line, so a wrapped line leaves no gap at
  the right.
- Ruby from the script (Aozora notation) shows above its word. It may run past
  its word rather than spread the word's letters apart.

## Notice

- A work may carry a note on itself (`notice` in `script.json`), such as one on
  its wording. It sits above the first line for the whole read-through, as UI
  text in the quieter colour with no background, left-aligned: an aside, not
  story. It needs no tap.

## Stage direction and scene heading

- A stage direction is read aloud like a line, by the player whose part holds
  it, but it is no one's speech: it spans the chat column as plain text, with
  no icon, name or background (owner's decision). While you read one, a line
  in the advance button's colour stands at each side of it instead of a
  coloured background (owner's decision); this is the one place lines are
  drawn. Other players see it plain.
- A scene heading sits centred above the line that opens the scene, in the
  quieter text colour, since it stands for what follows.

## End screen

- The title and the end mark (when the script has one), centred, nothing else.
- After a moment the post-game screen replaces it: a centred greeting
  (`review.heading`) and under it an area (a white block) labelled
  `review.afterword` holding the author's afterword, when the script has one. The end screen fades out,
  then the post-game screen fades in, so the two never show through each
  other. The band's phase changes as the post-game screen comes in.

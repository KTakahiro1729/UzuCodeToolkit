# Design policy

How screens in this repository work for the players. This policy covers the
functional side of design only: helping players see what to do and keeping
their cognitive load low. The decorative side (hues, typeface, icon art, corner
shapes) is out of scope here; this policy only sets the limits decoration must
stay within.

## What to avoid

Every screen is checked against these six.

1. **Excess motion.** Anything that moves pulls the eye, and so does a stutter
   or a sudden jump. Move only what has to change, and move it smoothly.
2. **Unclear state or action.** At any moment a player can tell whose turn it
   is and what a tap does, from what is on screen alone. Signs follow the
   meaning players already know from other apps; never reuse a familiar sign
   with a different meaning.
3. **No clear focus.** There is one most important thing on screen at a time,
   and it is the most salient thing. If everything is emphasised, nothing is.
4. **The eye drawn elsewhere.** Nothing outside the focus is more salient than
   the focus: no strong colour, size or motion on things the player is not
   acting on now.
5. **Reading the obvious.** Text is judged by load, not avoided as such. Leave
   out text that only repeats what position, colour or the content already
   says; reading it costs more than it gives. Show text where its absence would
   leave the player guessing.
6. **Eye travel.** What the player needs at one moment sits together, near the
   focus. Related things are close; the eye does not cross the screen for one
   decision.

Plus: build only what the sample uses (YAGNI), group with space and background rather than lines, and spend no room
on cards.

## Rules

### Focus and hierarchy

- During the read-through the focus is the newest line, at the bottom, and the
  advance button right under it.
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

### Text

- Use text when going without it costs the player more than reading it, and
  not otherwise. Prefer position, colour or a familiar mark where one says the
  same thing as clearly.
- UI text is short and comes from a key.
- The next reader is not shown.

### Layout

- Phone first; sizes in em, based on the screen's short side.
- The chat column has a reading width, so the eye does not cross a wide
  landscape screen between lines.
- Respect the safe area and the UZU HUD (`--safe-*`, `--hud-x`, `--hud-y`).
- Group with spacing; a background only where it carries meaning, such as one
  line of dialogue. No borders, dividers or cards, except the side lines on a
  stage direction you are reading.
- The parent owns spacing: the gap between siblings is the parent's `gap`, the
  room inside an element is its own `padding`. No element sets outer `margin`
  (only `0` or `auto`), so DevTools shows every space in one of two places.
  `npm run lint` enforces this.

### Alignment

- Text that can run to more than one line (dialogue, the afterword) is
  left-aligned, so every line starts at the same edge and the eye does not
  hunt for it. A label naming such text (such as the afterword's) shares its
  left edge.
- Where a block sits carries meaning: dialogue goes to its speaker's side, your
  role sits at the right of the band as in the chat.
- Centre only short, single items that stand for the whole screen rather than
  one speaker: the phase label, the advance button, the title and end mark, the
  post-game greeting.

### Motion

- Only state changes move: a line appearing, the list making room for it.
- A new line never makes the rest of the list jump; older lines move up
  smoothly or not at all.
- Motion must run without dropped frames: opacity and transform only, never
  width, height, padding or margin. 150–250 ms, ease-out, no bounce, no loops.
- No transition that cannot be seen; remove it with the change it served.
- With `prefers-reduced-motion`, change instantly.

### Limits on decoration

Decoration is out of scope, but it must not break the rules above:

- Colours are tokens in `packages/reader/src/theme.css`; screens use the
  variables, never raw colours.
- Every text colour meets WCAG AA (4.5:1) on its background.
- No gradients, edge fades, shadows or glows.
- No colour, size or weight that competes with the focus.

### Type

- Two roles, as CSS variables in `theme.css`: story text (script lines, title,
  end mark, afterword) in Shippori Mincho (`--font-body`); UI text (top band,
  speaker names, the advance button) in BIZ UDPGothic (`--font-ui`), a
  universal-design gothic made for telling characters apart, so short labels
  stay legible at small sizes. Both are bundled subsets; no system fonts.
- No text below 16px, except ruby: it gives the reading of the word under it
  at half the text size (owner's decision).

## Components

### Top band

- A full-width row on a white background that reaches the top edge behind the
  HUD, tall enough for icons with names under them (`--band-h`).
- Whether it shares the HUD's row depends on how much of the screen width the
  HUD takes. Over a quarter (phones held upright, about a third), the band is
  its own row under the HUD, so the centred phase label keeps clear of the
  HUD. A quarter or less (landscape and tablets, under a fifth), the band
  shares the HUD's row with the HUD over its empty left part, so the chat
  keeps the height. Nothing else shares a row with the HUD.
- Shows every player as icon and part name, ordered like the chat: the other
  players left (in the script's order), you right. A part that reads several
  roles shows its first role's icon. Each name sits under its icon. Your role's icon has a
  double circle (a ring around it), since order alone does not say which one
  is yours. Band text is
  bold.
- The phase label changes when the screen below it does (for example when the
  afterword appears), never before.
- It does not signal the turn; the current line does.
- Shows the current phase of the game (read-through, afterword, or other) as a
  short label from a key, in every phase (owner's decision), centred on the
  screen. When the players need more than the right half (several players on
  an upright phone), the label gives way to the left, keeping a gap.

### Dialogue line (read-through only)

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

### Notice

- A work may carry a note on itself (`notice` in `script.json`), such as one on
  its wording. It sits above the first line for the whole read-through, as UI
  text in the quieter colour with no background, left-aligned: an aside, not
  story. It needs no tap.

### Stage direction and scene heading

- A stage direction is read aloud like a line, by the player whose part holds
  it, but it is no one's speech: it spans the chat column as plain text, with
  no icon, name or background (owner's decision). While you read one, a line
  in the advance button's colour stands at each side of it instead of a
  coloured background (owner's decision); this is the one place lines are
  drawn. Other players see it plain.
- A scene heading sits centred above the line that opens the scene, in the
  quieter text colour, since it stands for what follows.

### End screen

- The title and the end mark (when the script has one), centred, nothing else.
- After a moment the post-game screen replaces it: a centred greeting
  (`review.heading`) and under it an area (a white block) labelled
  `review.afterword` holding the author's afterword, when the script has one. The end screen fades out,
  then the post-game screen fades in, so the two never show through each
  other. The band's phase changes as the post-game screen comes in.

### Phase changes

- When the phase changes, the old screen fades out, then the new one fades in (200 ms each, one at a time, instant with reduced motion). The band's phase label changes with the screen.
- The first screen, shown as the game loads, does not fade in.

### Empty phase

- A phase whose content is not made yet shows the next button alone, centred, labelled `button.next`. Every player can tap it; the first tap moves everyone on. The band's phase label names the phase.
- On the last line of a read-through that another phase follows, the advance button says `button.next` instead of `button.end`.

### Other screens

- Screens other than the read-through, such as the afterword, do not use the
  chat style. They follow the same rules.

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
- Both players see the button. It is filled for whoever reads now and greyed
  for the other, so each player knows at a glance whether to read or to wait.
  Nothing else on screen signals the turn.
- The button is always there during the read-through, so it never moves the
  lines. It carries a short label from a key (read, then tap) until your first
  line is read, then the next mark (a small down-pointing triangle) alone.
- Lines are told apart by side (yours right, as in chat apps), by the
  speaker's icon and by the speaker's name above the bubble. Your role's
  bubbles are tinted; the other role's are white. All lines keep full text
  contrast.

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
- Respect the safe area and the UZU HUD (`--safe-*`, `--hud-y`).
- Group with spacing; a background only where it carries meaning, such as one
  line of dialogue. No borders, dividers or cards.

### Alignment

- Text that can run to more than one line (dialogue, the afterword) is
  left-aligned, so every line starts at the same edge and the eye does not
  hunt for it. A heading over such text shares its left edge.
- Where a block sits carries meaning: dialogue goes to its speaker's side, your
  role sits at the right of the band as in the chat.
- Centre only short, single items that stand for the whole screen rather than
  one speaker: the phase label, the advance button, the title and end mark.

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

- Colours are tokens in `samples/hundred-arms/src/theme.css`; screens use the
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
- No text below 16px.

## Components

### Top band

- Its own full-width row under the UZU HUD, on a white background that
  reaches the top edge behind the HUD, tall
  enough for icons with names under them (`--band-h`). Nothing shares a row
  with the HUD.
- Shows both players as icon and role name, ordered like the chat: the other
  player left, you right. Each name sits under its icon. Your role's icon has a
  double circle (a ring around it), since order alone does not say which one
  is yours. Band text is
  bold.
- The phase label changes when the screen below it does (for example when the
  afterword appears), never before.
- It does not signal the turn; the current line does.
- Shows the current phase of the game (read-through, afterword, or other) as a
  short label from a key, in every phase (owner's decision), centred on the
  screen.

### Dialogue line (read-through only)

- A bubble with the speaker's icon beside it and name above it. Your role's
  lines on the right, the other role's on the left.
- Only the button advances; tapping elsewhere does nothing, so a stray tap
  never skips a line.

### End screen

- The title and the end mark, centred, nothing else.
- After a moment the post-game screen replaces it: a heading
  (`review.heading`) and under it an area (a white block) holding the author's
  afterword. The band's phase changes at the same moment.

### Other screens

- Screens other than the read-through, such as the afterword, do not use the
  chat style. They follow the same rules.

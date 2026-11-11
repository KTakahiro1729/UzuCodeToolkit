# Design policy

How screens in this repository look and move.

## Principles

1. **The work leads.** The screen carries the script and the players reading it. The UI helps and never competes; it has no look of its own.
2. **Nothing without a job.** Build only what the sample uses. Every element must have a reason to be on screen; if nothing breaks without it, leave it out.
3. **Group with space.** Separate and group things with spacing. Use a background only where it carries meaning, such as one line of dialogue. No lines or borders.
4. **Room is scarce.** Design for a phone first. Keep padding and gaps tight. No cards by default.
5. **Change smoothly.** Motion keeps the eye's place when something changes. It never decorates.

## Foundations

### Colour

- Light theme only.
- The usual chat-app palette: a soft grey page (not pure white), white bubbles for the other player, a calm blue with white text for your lines.
- Read lines keep full contrast.
- No gradients, fades, shadows or glows.
- Every text colour meets WCAG AA contrast (4.5:1) on its background.
- No opacity on resting states; quieter things use a quieter colour token. Short opacity transitions are fine.
- Colours are tokens in `samples/hundred-arms/src/theme.css`. Screens use the variables, never raw colours.

### Typography

- Shippori Mincho, Regular, one size for the script.
- Hierarchy comes from colour and position, not from size or weight.

### Space and layout

- Sizes in em, based on the screen's short side.
- Tight, consistent gaps. Small padding inside bubbles.
- The newest line sits at the bottom; older lines scroll up.
- Respect the safe area and the UZU HUD (`--safe-*`, `--hud-y`).

### Shape

- Rounded bubbles and round icons only.

### Motion

- Animate state changes only: a line appearing, the current line changing, the list scrolling.
- 150–250 ms, ease-out. Opacity and transform only; never width, height, padding or margin.
- No bounce or elastic easing, no looping animation.
- With `prefers-reduced-motion`, change instantly.

### Text on screen

- Text on screen is the work's own text: the script, the title, character names. No hints or instructions.
- A short label is allowed only where no icon or position can say the same thing. It comes from a key.
- State is shown by position and colour. When the newest line is yours (right, blue), it is your turn. The next reader is not shown.

## Components

### Top band

- Sits in the strip to the right of the UZU HUD, at the HUD's height, so it takes no reading space. Same layout in portrait and landscape.
- Left: the current phase of the game (read-through, afterword, or other) as a short label from a key, in a quieter text colour.
- Right: both players as icon and role name, ordered like the chat: the other player left, you right.
- During the read-through, the name of the player whose line is current is in the full text colour and the other in a quieter one; icons stay at full strength. In other phases both are full.
- The band is the only place that says where the game is; screens below it have no headings.

### Dialogue line (read-through only)

- A bubble with the speaker's icon beside it. Your role's lines on the right, the other role's on the left.
- Your lines are blue, the other player's white. When the newest line is yours, it is your turn to read and tap.
- On your line, a tap anywhere advances.

### Character icon

- Every role has one. It tells speakers apart alongside the side of the screen.

### End screen

- The title and the end mark, centred, nothing else.

### Other screens

- Screens other than the read-through, such as the afterword, do not use the chat style. They follow the same principles and foundations.

## Don't

- Wrap blocks in cards, or nest cards.
- Use gradients, edge fades, glows or coloured shadows.
- Add a tint, brand colour or accent colour.
- Add labels, hints or headings that explain what the screen already shows.
- Draw borders, dividers or accent stripes.
- Build features or options the sample does not use.
- Use bounce easing, animate layout properties, or animate everything.
- Use emoji or generic icons as decoration.
- Centre everything by default.

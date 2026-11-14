# Design policy

How screens in this repository work for the players. This file holds the rules
every screen follows. Each component's spec is in `docs/design/`: read the one
you are changing (index at the end), not all of them.

How screens in this repository work for the players. This policy covers the
functional side of design only: helping players see what to do and keeping
their cognitive load low. The decorative side (hues, typeface, icon art) is out
of scope here; this policy only sets the limits decoration must stay within.
Which kind of shape, fill and edge each role gets is function (Look by role);
the exact colours and radii are the work's.

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

### Text

- Use text when going without it costs the player more than reading it, and
  not otherwise. Prefer position, colour or a familiar mark where one says the
  same thing as clearly.
- UI text is short and comes from a key.
- The next reader is not shown.

### Layout

- Phone first; sizes in em, based on the screen's short side. The narrowest
  screen supported is 320px wide.
- The chat column has a reading width, so the eye does not cross a wide
  landscape screen between lines.
- A screen with room for columns gets them, measured in the screen's own em:
  2 columns from 40em wide and 480px tall (tablets held sideways, laptops), 3
  from 60em (full-HD monitors). Phones keep one column in both orientations;
  sideways they lack the height. Each column is then at least about 19em, near
  a phone held upright.
- Respect the safe area and the UZU HUD (`--uzu-safe-area-inset-*`, `--uzu-hud-inset-x`, `--uzu-hud-inset-y`).
- Group with spacing; a background only where it carries meaning, such as one
  line of dialogue. No dividers. Lines are edges of controls only (Look by
  role), plus the side lines on a stage direction you are reading.
- The parent owns spacing (`gap`); an element owns only its `padding`. No outer
  `margin`: `npm run lint` enforces it.

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
  variables, never raw colours. Those values are neutral defaults for the
  samples. A work's look (colours, art, effects) is the work's own: it sets the
  tokens in its own stylesheet, and a colour only its screens use (such as a
  chess board's) becomes a token there too.
- Every text colour meets WCAG AA (4.5:1) on its background.
- Text set on a work's own images (backgrounds, characters, frames, nameplates, buttons) still meets AA.
- No colour, size or weight that competes with the focus.

### Look by role

A player tells what something is, and whether to tap it, from its look alone,
before reading it. Each role below has one look, and no other role borrows it
(weak signifiers cost time in NN/g eyetracking; WCAG 1.4.11 asks 3:1 for what
shows a control is there).

| Role | Shape | Fill | Edge |
|---|---|---|---|
| Ground: story text, guide, labels, notices, status | none | none (page) | none |
| Bars: top band, footer | full width, square | `--color-bubble` | none |
| Something to read: a bubble, the handout's area, the afterword, a block of information (a cast entry) | `--radius-read` | `--color-bubble` (yours: `--color-bubble-mine`) | none |
| Primary button: the next step | capsule | `--color-mine-current` | none |
| Secondary button: any other action, cancel and undo | capsule | none | 1px `--color-line` |
| Button that cannot be tapped now | capsule | `--color-button-off`, quiet text | none |
| Input | `--radius-control` | `--color-field` | 1px `--color-line`; focus: 2px `--color-mine-current` |
| Choice in a list (one of several, stays selected) | `--radius-control` | none; selected: `--color-mine-current` | 1px `--color-line` |
| Tab | text; chosen: shares the area's fill, bold | none | none |
| Read-back link in the footer | text; open: bold, underlined | none | none |
| Status (done, waiting) | a mark (tick) beside a name or icon | none | none |

- A capsule always means a button, and only a button is a capsule.
- Something to read has a fill and no edge; something to tap or fill in has an
  edge (or the primary fill). So a block of information never looks like a
  choice, and an input never looks greyed.
- A greyed button has neither edge nor fill colour, so it never looks like a
  secondary button. A button greys only while it cannot be tapped.
- An input is never filled with the page or the greyed colour: grey reads as
  disabled. Its value, once locked, is plain text with no edge or fill.
- A destructive action (one that loses what a player made) is a secondary
  button whose label and edge take a danger colour, never the primary. None is
  built yet; add a token when the first one is.
- Fill and edge carry the roles.

### Type

- Two roles, as CSS variables in `theme.css`: story text (script lines, title,
  end mark, afterword) in `--font-body`; UI text (top band, speaker names, the
  advance button) in `--font-ui`. Which typefaces they hold is the work's; the
  fonts a work bundles are subsets of the characters it shows (CLAUDE.md,
  Fonts).
- No text below 16px, except ruby: it gives the reading of the word under it
  at half the text size (owner's decision).

### Scrollbars

- One style everywhere a vertical area scrolls: thin, a quiet thumb
  (`--color-scroll`), no track, set by the `scroll` class. The read-through's
  list spans the whole screen so its scrollbar sits at the screen's right
  edge, while its lines keep the reading width. Horizontal strips (tabs) keep
  none.

## Component specs (read the one you change)

| You touch | Read |
|---|---|
| The read-through: chat, dialogue line, stage layout, stage direction, notice, end screen | [design/read-through.md](design/read-through.md) |
| Top band, footer, `Button`, sheets | [design/chrome.md](design/chrome.md) |
| A layout definition (parts, boxes, images, scenes), `tools/layout/` | [design/layout.md](design/layout.md) |
| Handout screens, post-game handouts | [design/handout.md](design/handout.md) |
| Guide, introduction, empty phase, phase list, phase changes | [design/phases.md](design/phases.md) |
| Game select, turn marks in games, spectating, the clock | [design/games.md](design/games.md) |

Owner decisions that explain why are in `docs/decisions/` (see its README); look
them up by word when you are about to change a rule, do not read them through.

# Design policy

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

### Focus and hierarchy

- During the read-through the focus is the newest line, at the bottom, and the
  advance button right under it, in the footer.
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
- A screen with room for columns gets them, measured in the screen's own em:
  2 columns from 40em wide and 480px tall (tablets held sideways, laptops), 3
  from 60em (full-HD monitors). Phones keep one column in both orientations;
  sideways they lack the height. Each column is then at least about 19em, near
  a phone held upright.
- Once the handouts are over, they stay in view as columns beside the screen
  (the handouts left, the screen in the last column) instead of opening as a
  sheet, and their footer button is hidden. The footer's actions centre under
  the screen's column, so the advance button stays under the lines. Screens
  before the handouts keep their single reading column, centred.
- Respect the safe area and the UZU HUD (`--safe-*`, `--hud-x`, `--hud-y`).
- Group with spacing; a background only where it carries meaning, such as one
  line of dialogue. No dividers. Lines are edges of controls only (Look by
  role), plus the side lines on a stage direction you are reading.
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
  variables, never raw colours. Those values are neutral defaults for the
  samples. A work's look (colours, art, effects) is the work's own: it sets the
  tokens in its own stylesheet, and a colour only its screens use (such as a
  chess board's) becomes a token there too.
- Every text colour meets WCAG AA (4.5:1) on its background.
- No gradients, edge fades, shadows or glows.
- No colour, size or weight that competes with the focus.

### Look by role

A player tells what something is, and whether to tap it, from its look alone,
before reading it. Each role below has one look, and no other role borrows it
(evidence in the research page: NN/g eyetracking found weak signifiers cost 22%
more time; enclosed inputs beat underlined ones in Google's text-field study;
WCAG 1.4.11 asks 3:1 for what shows a control is there).

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
- Shadows stay out (Limits on decoration): fill and edge carry the roles.

### Type

- Two roles, as CSS variables in `theme.css`: story text (script lines, title,
  end mark, afterword) in Shippori Mincho (`--font-body`); UI text (top band,
  speaker names, the advance button) in BIZ UDPGothic (`--font-ui`), a
  universal-design gothic made for telling characters apart, so short labels
  stay legible at small sizes. Both are bundled subsets; no system fonts.
- No text below 16px, except ruby: it gives the reading of the word under it
  at half the text size (owner's decision).

## Components

### Guide

- A phase's screen may open with what to do now, in a line or two of UI text
  at the top (`guide`, the work's own words). It is part of the screen's
  content and scrolls away with it; it never floats over the screen or stays
  pinned (owner's decision). It needs no tap: no window to close. Only where players
  would otherwise guess (why the game waits, what is secret), not to repeat
  the band.

### Introduction with the cast

- The introduction shows, under its story text, whom you play (`cast.you`,
  the part's name bold) and every part as a white block: icon, name and one
  line on who they are (the manifest's description). Yours comes first and
  takes your role's tint.
- In the footer one ready button (`button.ready`), with no count of who is
  ready (owner's decision). Once tapped it keeps its name, greyed with a tick,
  the band checks your icon (`readyDone`), and a separate button
  (`button.unready`, naming what it undoes) takes it back: a button says what
  it does, so taking back is never the same button (owner's decision). The
  phase moves on when everyone is ready.
- On a landscape screen the story text and the cast stand side by side.

### Buttons

- One `Button` everywhere (`packages/reader`). `primary` is the next step,
  filled; one screen has at most one primary at a time. `secondary` is any
  other choice, outlined with no fill (Look by role). A choice that stays selected (such as your vote) takes
  the primary's fill while selected (`pressed`).
- A button greys only while it cannot be tapped, never to look quieter.

### Whose turn (games)

- As in the read-through: on your turn your button for the next step is
  filled; on another player's turn that player's block (name, hand) sits on
  white, and your buttons grey. Nothing else marks the turn: no outlines, no
  tints. A game without player blocks (chess) says whose turn it is in a short
  line instead.

### Time left

- A timer shows the time left as m:ss (`TimeLeft`), from the game time the
  state holds, so every player sees the same.

### Watching a game

- A seat that sits a game out watches it: it sees only what every player may
  see, and no buttons of the game. The game's screen gets `watching`.

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
- It does not signal the turn; the current line does. In a phase every player
  finishes on their own (the handouts), a small check at the lower right of an
  icon marks that player done, so you can see whom you are waiting for. No
  count is shown.
- Shows the current phase of the game (read-through, afterword, or other) as a
  short label from a key, in every phase (owner's decision), centred on the
  screen. In a work of more than one phase the label is a button (a pill with
  a down mark) that opens the phase list as a sheet. When the players need more than the right half (several players on
  an upright phone), the label gives way to the left, keeping a gap.

### Footer

- The main action area: a full-width white block along the bottom edge, the
  band's counterpart, on every screen, in two rows like a chat input.
- Upper row, the screen's actions: the advance button, the next button, the
  handout's extension and done buttons, back to the list after a game, and the
  way back to the handouts. Quieter actions sit at the left; **the rightmost
  button is always the one to press now** (the send button of a chat), in
  every phase. Screens put them there with `FooterActions`.
- Lower row, options and state: the read-back buttons at the left, quieter
  than the actions (plain text in the quiet colour): once the game has left a
  phase whose content stays readable (`PhaseView.keep`, the handouts), that
  content; the state at the right, such as the handout's time left
  (`FooterActions place="status"`). The row is there on every screen so the
  footer does not change height between phases. The phase list is not here: it
  opens from the band's phase button.
- A read-back button opens a sheet over the screen, for this player alone;
  the screen keeps running under it and the footer's actions stay usable. The
  open one is bold and underlined, as a chosen tab. The sheet's title and a
  close button share its top row; tapping the open button again also closes
  it. A phase change closes the sheet.
- Every button says what it does, and whether to press it shows at a glance:
  filled for the step to take, greyed when it cannot be pressed now, outlined
  for a side action (secondary).

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

- When the phase changes, the old screen fades out, then the new one fades in (200 ms each, one at a time, instant with reduced motion). The band's phase label changes with the screen: the old label fades out with the old screen, then the new one fades in with the new screen, so two labels never show at once.
- The first screen, shown as the game loads, does not fade in.

### Empty phase

- A phase with no game of its own (an empty phase) shows the next button, centred, labelled `button.next`, under optional story text (such as an introduction): left-aligned paragraphs in the story font, at the chat's reading width. Without text it holds the place of a phase not made yet. Every player can tap it; the first tap moves everyone on. The band's phase label names the phase.
- On the last line of a read-through that another phase follows, the advance button says `button.next` instead of `button.end`.

### Handout

- The handout is split into tabs, one text per tab, so a long handout does
  not run as one scroll: the shared text (`handout.common`), your part's own
  text (labelled with your part's name, its full heading at the top of the
  tab), how your part sees the others (`handout.impressions`) and the
  settings your part fills in (`handout.tabFields`). A tab with nothing in it
  is left out. The tabs sit at the chat's reading width over one white area;
  the chosen tab shares its white, as a folder tab, the others sit on the
  page. The text scrolls under the tab bar and starts from the top when the
  tab changes.
- Each setting is a name with an input under it. A setting that may stay
  blank says so after its name (`handout.optional`, in the quiet colour). The
  example, when there is one, sits in the empty input. The input starts one
  line tall and grows with its text, so a long example or answer shows whole.
  Focus shows as a ring in the button's blue, not the browser's black.
- While a setting that is not optional is still blank, the settings tab
  carries a small dot, the familiar sign for "something here needs you", since
  the done button stays greyed for a reason on another tab.
- In the footer, always in view, one row: the time left, the extension
  button (`handout.extend`), and the done button (`handout.done`). The done
  button is the next step, so it is the filled one; it stays greyed until
  every setting is filled in (a setting marked optional may stay blank). The
  extension button is secondary (outlined, not filled), since it is not the
  next step.
- Once you tap done, your settings lock: each value shows as plain text
  without the input's edge or fill (`handout.blank` when left empty), so
  nothing looks writable. The done button keeps its
  name, greyed with a tick, so it reads as pressed rather than changed into
  something else; the band checks your icon, so everyone sees who is done
  (no count). The extension button gives way to a separate undo button that
  names what it undoes (`handout.unready`), styled like it. Undo brings back the settings and the
  extension button, until the phase ends.
- When time runs out, the game moves on. Until anyone acts on the next screen,
  that screen shows the extension button in the footer beside its main
  action, secondary (outlined, not filled); it brings everyone back to the handout with
  more time. It fades in and out with the screen it sits on, so it never shows
  next to the handout's own extension button.
- After the phase, the footer's handout button opens the same tabs in a sheet,
  read-only: each setting's name with what was filled in under it, or
  `handout.blank` in the quiet colour when it was left empty.
- Text typed into a setting is the one text the bundled subsets cannot hold,
  so it may fall back to a system face.

### Game select

- The games this many players can play, as a list of choices (Look by role:
  an edge, no fill, filled when selected): the game's
  name, and under it in the quieter colour how many play, who watches when the
  spectator sits out, and the game's own line (`description`), joined by
  `list.sep`. The next button may carry the work's own label (such as
  暇つぶしを終える), since leaving the list ends the phase. A game that
  does not take this many players is left out, unless the work names a
  spectator part and the game takes everyone else: that part then watches
  (owner's decision for InterstellarBG, where the half-GM part watches).
- A tap on the list only selects a game (filled, as a pressed choice); the
  play button (`game.play`) in the footer starts it for everyone, and stays
  greyed until a game is selected (owner's decision). One tap by any player
  never starts a game nobody can leave.
- Beside the play button, the next button (`button.next`) is secondary: leaving
  the phase is not the next step on this screen, and it cannot be undone.
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

### Phase list

- The work's phases in order, opened from the footer, so a player can see
  where the game is and what comes next. One column at the chat's reading
  width; it scrolls when the phases do not fit, starting with the current one
  in view.
- Each entry is a number and the phase's band label. Phases in a row that
  share a label (such as the handouts and the pause after them) are one entry.
- The current entry is bold with a small mark at its start, and no
  background, so the read-only list never looks like choices. Entries
  already over are in the quieter text colour, with no mark, since sitting
  above the current one already says so. Once the game has ended, every entry
  is over.
- Reading only: tapping an entry does nothing. No player moves the game from
  here (owner's decision; the official sample's list that moves everyone
  belongs to its game-master seat, which this toolkit does not have).

### Other screens

- Screens other than the read-through, such as the afterword, do not use the
  chat style. They follow the same rules.

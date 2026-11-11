# Design policy

How screens in this repository work for the players. This policy covers the
functional side of design only: helping players see what to do and keeping
their cognitive load low. The decorative side (hues, typeface, icon art, corner
shapes) is out of scope here; this policy only sets the limits decoration must
stay within.

## Owner's instructions

Quoted verbatim.

> デザインは機能面と装飾面を分けて考え、さらにここでは装飾面は担当しません。
> 機能面とは、ユーザーが何をすべきかを理解し、認知負荷を下げるためのものです
> ・過剰なアニメーション（カクツキもユーザーからはアニメーションと捉えられる）
> ・不明な
> ・注目すべき箇所がわからない（情報が階層化されていない）
> ・それ以外のものに視線が行く
> ・自明や不要な文章を読むことの認知負荷
> ・視線移動
> をすべて避けるべきです。

Earlier instructions that still apply:

> 過剰設計をさける（YAGNI）
> 文字に頼るUIは極小に
> 余白や背景色を利用し、線が多すぎるUIは減らす
> カード型デザインを過信しないで。変に余白食うだけのことあるし

## What to avoid

Every screen is checked against these six. The item "不明な" is cut off in the
original; it is read here as an unclear state or action.

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
5. **Reading the obvious.** No text that repeats what position, colour or the
   content already says. No hints, headings or instructions.
6. **Eye travel.** What the player needs at one moment sits together, near the
   focus. Related things are close; the eye does not cross the screen for one
   decision.

Plus: build only what the sample uses (YAGNI), group with space and background
rather than lines, and spend no room on cards.

## Rules

### Focus and hierarchy

- During the read-through the focus is the current line: the newest one, at the
  bottom.
- The current line is the most salient thing on screen. Read lines keep full
  text contrast (no fades), but their bubbles are quieter than the current one,
  on both sides.
- Your turn is shown at the focus itself: the current line is on your side.
  Nothing else on screen signals the turn.
- Lines are told apart by side (yours right, as in chat apps) and by the
  speaker's icon.

### Text

- Text on screen is the work's own text: the script, the title, character names.
- A short label is allowed only where nothing else on screen says the same
  thing. It comes from a key.
- The next reader is not shown.

### Layout

- Phone first; sizes in em, based on the screen's short side.
- The chat column has a reading width, so the eye does not cross a wide
  landscape screen between lines.
- Respect the safe area and the UZU HUD (`--safe-*`, `--hud-y`).
- Group with spacing; a background only where it carries meaning, such as one
  line of dialogue. No borders, dividers or cards.

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

## Components

### Top band

- Sits in the strip to the right of the UZU HUD, at the HUD's height, so it
  takes no reading space.
- Shows both players as icon and role name, ordered like the chat: the other
  player left, you right. This is where you learn which role is yours.
- It does not signal the turn; the current line does.
- Shows the current phase of the game (read-through, afterword, or other) as a
  short label from a key, in every phase (owner's decision).

### Dialogue line (read-through only)

- A bubble with the speaker's icon beside it. Your role's lines on the right,
  the other role's on the left.
- When the current line is yours, a tap anywhere advances. When it is not, a
  tap does nothing.

### End screen

- The title and the end mark, centred, nothing else.

### Other screens

- Screens other than the read-through, such as the afterword, do not use the
  chat style. They follow the same rules.

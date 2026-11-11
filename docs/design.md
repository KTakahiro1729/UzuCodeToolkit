# Design policy

The source of truth for how screens in this repository look and move. It turns the owner's instructions (quoted verbatim at the end) into principles, foundations and component rules, following the usual design-system layout: principles first, then foundations (colour, type, space, shape, motion, text), then components.

Values chosen for the sample (exact colours, file names) are in [decisions.md](decisions.md). Points still open are marked **Open** and follow the recommended option until the owner decides.

## The idea behind it

The screen exists to carry the work: the script, read aloud by the players. Everything the owner has corrected so far was something that pulled the eye away from it: features the sample did not need, sentences explaining state, lines and boxes, tinted colour, gradients, cards that eat room, and changes that jump. So the UI steps back and the work leads.

This is the idea Apple's iOS 7 guidelines call *deference*: "The user interface helps users understand and interact with the content, but never competes with it."

## Principles

1. **The work leads.** On screen, the script and the characters' icons carry the colour, the voice and the attention. The UI has no identity of its own.
2. **Nothing without a job.** YAGNI applies to elements as well as code. Before adding anything, ask what breaks without it. If nothing does, leave it out.
3. **Group with space; let colour mean something.** Proximity groups things first. A background (a "common region") is used only where it carries meaning, such as one line of dialogue. No lines or borders. NN/g notes that boundaries overpower proximity and that "too many borders and colored boxes that exist purely for decoration add clutter".
4. **Room is scarce.** Design for a phone first. Every padding and gap costs room for the script. No card by default.
5. **Change smoothly, not loudly.** Motion is there so the eye keeps its place when something changes, never to decorate.

## Foundations

### Colour

- Neutral greys and white only, with no hue or tint. The characters' icons are the only colour on screen.
- Light theme only: a white or near-white background with dark text.
- Meaning is carried by contrast. The current line stands out most, and your own current line inverts (dark bubble, light text).
- No gradients, fades, shadows or glows.
- Text keeps WCAG AA contrast (4.5:1), including dimmed earlier lines.

### Typography

- One family, Shippori Mincho: the work's voice. One weight (Regular) and one size for the script.
- Hierarchy comes from contrast and position, not from size or weight.

### Space and layout

- Sizes in em based on the screen's short side, so portrait and landscape keep the same proportions.
- Tight, consistent gaps between lines. Bubble padding stays small.
- The newest line sits at the bottom, nearest the thumb; older lines scroll up.
- Respect the safe area and the UZU HUD (`--safe-*`, `--hud-y`).

### Shape

- Rounded bubbles and round icons. No other shapes.

### Motion

- Animate only state changes: a line appearing, the current line changing, the list scrolling.
- 150–250 ms, ease-out. Animate opacity and transform only, never width, height, padding or margin.
- No bounce or elastic easing, no looping animation, no animation on every element.
- With `prefers-reduced-motion`, switch instantly.

### Text on screen

- The only text on screen is the work's own text (the script, the title, character names). No labels, hints or instructions.
- State is shown by position and contrast. For example, whose turn it is shows as which side the current line is on and whether it is inverted. The next reader is not shown.
- **Open:** whether a short label is ever allowed where no icon or position can say it. Recommended: no labels; rethink the screen instead.

## Components

### Top band

- Shows both players' icons and names, and the current phase of the game (the read-through, the afterword, or anything else).
- It is the one place that says where the game is, so the screens below it need no headings. How the phase is shown is being designed in the header thread.

### Dialogue line

- A bubble with the speaker's icon beside it. Your role's lines on the right, the other role's on the left.
- The current line has full contrast; earlier lines are fainter. Your own current line inverts: that is the cue to read and tap.
- On your line, a tap anywhere advances.

### Character icon

- Every role has an icon. It is the only colour on screen and the main way to tell speakers apart.

### End screen

- The title and the end mark, centred, with nothing else.

**Open:** whether the chat style applies to every screen built from the script (such as the afterword) or only to the read-through. Recommended: every screen built from the script.

## Anti-patterns

Habits common in AI-generated UI (Claude's included) that break this policy. Several have already been corrected in this project.

| Pattern | Breaks | Seen here |
|---|---|---|
| Wrapping every block in a card, or cards inside cards | 3, 4 | Yes |
| Gradients, fades at the edge of a list, glows, coloured shadows | Colour | Yes (top fade on the chat log) |
| Tinted or "brand" colour, purple or cyan accents | 1, Colour | Yes (tinted palette) |
| Labels, hints or headings that explain what the screen already shows | Text on screen | |
| Borders, dividers, accent stripes on one side of a box | 3 | |
| Building features or options the sample does not use | 2 | Yes |
| Bounce easing, animating layout properties, motion everywhere | Motion | |
| Emoji or generic icons as decoration | 1 | |
| Centring everything by default | Space and layout | |

The list draws on Adrian Krebs's scoring of Show HN pages for AI design patterns and on the anti-pattern lists in the Skills below.

## Skills

Published design Skills, reviewed against this policy. A rule is adopted when it serves the principles above and rejected when it adds decoration or a visual identity. None is installed; the rules worth keeping are already in this document.

| Skill | Licence | Useful here | Conflicts with this policy |
|---|---|---|---|
| [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Anthropic) | See repo | Avoid default fonts and clichéd palettes; choose type deliberately | Asks for bold aesthetics, high-impact motion and atmospheric backgrounds (against 1 and 5) |
| [Impeccable](https://github.com/pbakaus/impeccable) | Apache 2.0 | No nested cards, no bounce easing, no layout-property animation; a CLI that checks for anti-patterns | "Always tint" greys (against Colour) |
| [ux-skill](https://github.com/Laith0003/ux-skill) | MIT | Ban list: decorative glow, `<hr>` between sections, fade-up on every element, emoji as decoration | Broad web-app scope; most rules do not apply to a one-screen sample |

## Owner's words

The instructions this policy is built from, verbatim.

> 過剰設計をさける。具体的にはサンプルプロジェクトに不要なものはYAGNIと考える
>
> 文字に頼るUIは極小に
>
> 余白や背景色を利用し、線が多すぎるUIは減らす
>
> カラーリングはもっとクセをなくして
>
> なんかグラデがかかって見づらい
>
> カード型デザインを過信しないで。変に余白食うだけのことあるし
>
> どちらかというとチャット画面風にして
>
> アイコンはある前提で
>
> カクカクにならないような最小限のアニメーションを入れて
>
> 帯には2人のアイコンと名前、現在のゲームステータス（本編なのか感想戦なのかそれ以外なのか）を
>
> そのまま書き移すんじゃなくて、記載したものから私の思考と方針を汲み取り、曖昧なところは確認し、既存のデザインフレームに落とし込み、きちんと言語化されたデザイン方針を作ってほしいんだよね

When the owner gives a new design instruction, add it here and fold it into the sections above.

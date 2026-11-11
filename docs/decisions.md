# Decisions

Owner decisions for this repository, newest last.

## 2026-11-11

- **Do not show who reads next.** In the two-player sample the lines alternate, so the screen shows only the lines read so far and the current one. When the newest line is yours, it is your turn.
- **Font: Shippori Mincho.** Bundled as a woff2 subset of the story text's characters (`samples/hundred-arms/src/fonts/`) and rebuilt when the script's characters change (steps in `CLAUDE.md`).
- **Chat-style screen with icons.** Lines appear as chat bubbles with the speaker's icon; your role's lines on the right, the other role's on the left. Icons are assumed to exist (`public/assets/icon-<role>.webp`, also used by the manifest's character select); the current files are placeholders: Noto Color Emoji glyphs (🗡️ for 勇, 🐙 for 百) rendered once to webp, so they look the same on every device.
- **Light theme, usual chat-app colours.** Soft grey page (not pure white); the current line is white, or a calm blue when it is yours; read lines sit on quieter bubbles with full text contrast. Tokens live in `samples/hundred-arms/src/theme.css`; screens use those variables, never raw colours. Every text colour meets WCAG AA (4.5:1); no opacity fades on resting states.
- **Post-game screen shows the afterword.** After the last line, the title and end mark hold for a moment, then the post-game screen replaces them with no fade: the centred greeting `review.heading` and under it an area labelled `review.afterword` holding the author's afterword (`afterword` in `script.json`, the author's words verbatim, CC BY 4.0 with the script). No tap needed.
- **Design covers function only.** Design here means helping players see what to do and keeping cognitive load low; decoration (hues, typeface, icon art) is out of scope. Screens are checked against six things to avoid: excess motion (stutter counts), unclear state or action, no clear focus, the eye drawn elsewhere, reading the obvious, and eye travel. Details in `docs/design.md`.
- **Show what to do on your turn.** Right under the newest line, both players see the advance button: filled for the reader, greyed for the other. It says `hint.readThenTap` until your first line is read, then shows the next mark alone. Tapping elsewhere does nothing. Each line shows the speaker's name; in the top band your role's icon has a double circle, and band text is bold.
- **Fonts by role.** Story text in Shippori Mincho, UI text in BIZ UDPGothic (Google Fonts, bundled as subsets like the mincho), as two CSS variables. No text below 16px.

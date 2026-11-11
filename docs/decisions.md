# Decisions

Owner decisions for this repository, newest last.

## 2026-11-11

- **Do not show who reads next.** In the two-player sample the lines alternate, so the screen shows only the lines read so far and the current one. Your own turn is shown by the current bubble turning dark.
- **Font: Shippori Mincho.** Bundled as a woff2 subset of the script's characters (`samples/hundred-arms/src/fonts/`) and rebuilt when the script's characters change (steps in `CLAUDE.md`).
- **Chat-style screen with icons.** Lines appear as chat bubbles with the speaker's icon; your role's lines on the right, the other role's on the left. Icons are assumed to exist (`public/assets/icon-<role>.webp`, also used by the manifest's character select); the current files are placeholders.
- **Neutral colours, light theme only.** Plain greys with no tint. Tokens live in `samples/hundred-arms/src/theme.css`; screens use those variables, never raw colours. Every text colour meets WCAG AA (4.5:1); no opacity fades; the only strong colour is your current line.
- **Post-game screen shows the afterword.** After the last line, the title and end mark hold for a moment, then switch to the author's afterword (no fade) (`afterword` in `script.json`, the author's words verbatim, CC BY 4.0 with the script). No tap needed and no label.

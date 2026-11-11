# Decisions

Owner decisions for this repository, newest last.

## 2026-11-11

- **Do not show who reads next.** In the two-player sample the lines alternate, so the screen shows only the lines read so far and the current one. Your own turn is shown by the current bubble turning light.
- **Font: Shippori Mincho.** Bundled as a woff2 subset of the script's characters (`samples/hundred-arms/src/fonts/`) and rebuilt when the script's characters change (steps in `CLAUDE.md`).
- **Chat-style screen with icons.** Lines appear as chat bubbles with the speaker's icon; your role's lines on the right, the other role's on the left. Icons are assumed to exist (`public/assets/icon-<role>.webp`, also used by the manifest's character select); the current files are placeholders.
- **Neutral colours.** Plain greys and white with no tint (background `#141414`, bubbles `#2b2b2b`, your current line `#f5f5f5`).
- **Light theme only.** The owner chose a light theme over dark or following the device. This replaces the dark values above; the sample still uses them until its screen is updated.

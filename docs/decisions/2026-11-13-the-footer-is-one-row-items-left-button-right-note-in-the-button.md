# The footer is one row: items at the left, the main button at the right, its note inside it

Replaces "Footer rows swapped, main row bigger" and "The footer says its state in a line" (their first line says so). The owner chose the merge of two brainstormed footers (a one-sentence state, and bottom-bar items) and then that the sentence goes inside the button, in both orientations.

- One row. The main button is at the right edge, the one to press now, filled, at least 3.5em high with room for a label and a note, so the footer keeps its height in every state. Items (`Slot`: mark over a short name, quiet text, no capsule) are at the left: the read-back items, more time, leaving the game select, and the time left (large and dark). At most three.
- The state sentence is the button's `note`, under its label, only where its absence would leave the player guessing (cannot be pressed, waiting, moves everyone). A pressed or pressable button that says what it does has none. The older line above the row (`FooterActions place="status"`) was removed once InterstellarBoardGame moved to notes.
- Labels say what moves: `▼ 次のせりふ`, `次のフェーズへ` (never the phase's name; a narrow button may say `次へ` with the sentence as its note), `準備OK`, `読み終えた`. `次へ` is no longer used for all of them. "全員で次へ" is `次のフェーズへ` with the note `全員で進みます`.
- More time is one minute for everyone (`handout.extend` is `1分延長`, `EXTENSION_MS` is 60 s). Replaces the two minutes of "HO reading time".
- The handouts' sheet rises from the footer: bottom flush, only the top corners round, slides up. The phase label in the top band shares the HUD's row at every width down to 320px.

Why: Haiku, reading the screens without help, could not tell why a button was grey when the reason was a line away; brainstormed layouts were weighed against the owner's feedback and the research on thumb reach (large taps at the bottom edge, the primary action at the trailing side, state shown as information not as a second control). Not taken: the sentence above the button (too far in landscape, extra height), the phase list dropping from the band (left open), symbols without names.

Where: `packages/reader/src/components` (`Button`, `Slot`, `FooterActions`, `Frame`, `Sheet`, `TopBand`, the screens), `docs/design.md` (Footer, Top band), `packages/reader/src/strings.json`.

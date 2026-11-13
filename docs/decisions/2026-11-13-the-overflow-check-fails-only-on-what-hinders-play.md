# The overflow check fails only on what hinders play

The overflow check (`--check`) fails on what stops play: a box off the screen or under the HUD, a control that cannot be pressed, text that cannot be read (cut by more than a third, or inside a button or field). A small cut of a label (a band label losing its last letter) is a warning: listed, not failing, so the author or agent fixes it when convenient. The line is in `tools/screen-preview/overflow.js` (`severity`).

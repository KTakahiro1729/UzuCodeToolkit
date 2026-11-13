# Ready and done are toggles

The cast screen's button and the handout's done button are both `button.next` (次へ). Once tapped, the same button turns red-outlined with a tick (`--color-undo`, `Button` `on`; the red is replaced by a dark edge, see "Red is for danger only") and tapping it again takes it back. Replaces the separate undo buttons (`button.unready`, `handout.unready`) and "taking back is a separate button".

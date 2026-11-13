# Overflow is checked on the drawn screens

A CSS lint cannot tell whether something spills over, since that depends on the text and the screen size. `capture.mjs --check` walks the screen-preview screens in both orientations in Playwright and lists boxes past the screen or their parent, text and images under the safe area or the HUD, and cut-off content. Chosen over Galen (a layout spec per screen; unmaintained) and BackstopJS (pixel diffs show change, not overflow).

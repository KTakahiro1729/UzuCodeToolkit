# The action to press now is checked as reachable, not only as non-overflowing

The overflow check skips what is scrolled out of its list, so a game's button cut off at the bottom of its scroll area passed with no findings. A screen can list its must-press selectors and `--check` reports any that cannot be pressed without scrolling. A game puts its actions in the footer's main row (`FooterActions`), the one place for main actions, and keeps only the hands on the scrolling table.

# The capture adds the guide's reference size and keeps certification's three

`capture.mjs --size` picks the screen size: `device` (844×390 and 390×844, the default, unchanged), `lower` (780×360), `wide` (1194×834) and `reference` (874×402 and 402×874, what UZU's design guide draws its layouts at). The three first are certification's reference sizes, where nothing may go off screen; the guide's size is none of them, so a screen that fits it is not thereby certified. A screen built on the guide is looked at in `reference` and checked (`--check`) in all four.

Not taken: replacing 844×390 with the guide's size, which would drop a certification size from the check.

# Playing cards

SVG playing cards by Adrian Kennard (https://www.me.uk/cards/), released under
CC0 1.0 Universal (public domain, no attribution required; see
https://revk.uk/2018/06/svg-vector-playing-cards.html).

Changes:

- Optimised with SVGO (coordinates rounded to one decimal place); metadata removed.
- A large corner index (`enlarge-index.mjs`): on every face the rank, a third of
  the card's width tall, and the suit sit side by side in the top-left corner
  and again in the bottom-right, both within the card's left half. The pips
  and court figures shrink to fit between the two rows. Red is `#c62828`
  (5.6:1 on white) instead of `red` (4.0:1).
- The joker (Kennard's `2J`) is `joker.svg`. The back and the joker are unchanged.

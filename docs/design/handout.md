# Handouts

Read this when you touch the handout screens. Rules every screen follows are in [../design.md](../design.md).

## Beside the screen

- Once the handouts are over, they stay in view as columns beside the screen
  (the handouts left, the screen in the last column) instead of opening as a
  sheet, and their footer button is hidden. The footer's actions centre under
  the screen's column, so the advance button stays under the lines. Screens
  before the handouts keep their single reading column, centred.

## Handout

- Where there is room (about 18em per column, 480px tall) the tabs spread over
  up to 3 columns, counted on the width the handout itself has: each tab but
  the last ones gets a column under a caption, and the last column keeps the
  rest as tabs. Beside the screen (see Layout) the handout has fewer columns
  by itself.
- The handout is split into tabs, one text per tab, so a long handout does
  not run as one scroll: the shared text (`handout.common`), your part's own
  text (labelled with your part's name, its full heading at the top of the
  tab), how your part sees the others (`handout.impressions`) and the
  settings your part fills in (`handout.tabFields`). A tab with nothing in it
  is left out. The tabs sit at the chat's reading width over one white area;
  the chosen tab shares its white, as a folder tab, the others sit on the
  page. The text scrolls under the tab bar and starts from the top when the
  tab changes. Each reader's tab and scroll position are remembered on their
  own device, so closing the handout sheet and opening it again resumes where
  they left off.
- A guide (`guide`, see Guide) opens the first tab and scrolls away with its
  text; it is not repeated on the other tabs.
- Each setting is a name with an input under it. A setting that may stay
  blank says so after its name (`handout.optional`, in the quiet colour). The
  example, when there is one, sits in the empty input. The input starts one
  line tall and grows with its text, so a long example or answer shows whole.
  The input is a white field with an edge (`--color-field`, `--color-line`,
  `--radius-control`), so it reads as something to fill in, not as a greyed
  control. Focus shows as a ring in the button's blue, not the browser's black.
- While a setting that is not optional is still blank, the settings tab
  carries a small dot, the familiar sign for "something here needs you", since
  the done button stays greyed for a reason on another tab.
- In the footer, always in view: the time left (leftmost, large and dark), then pause or
  resume (any player, for everyone) and the extension (`handout.extend`,
  one more minute for everyone) as items at the left (`Slot`, laid out by `TransitionFooter`), and the done button
  (`button.done`) as the main button. The done button is the next step, so it is the filled
  one; it stays greyed until every setting is filled in (a setting marked optional may stay
  blank), and says so in its note. The extension is an item, not a capsule, since it is not the
  next step.
- Once you tap next, your settings lock but stay fields (on the page's grey,
  `handout.blank` when left empty), and tapping one takes done back and lets
  you type. The done button keeps its name, outlined in a dark 2px edge with a tick; tapping
  it again takes done back too (a toggle). The extension greys while
  you are done. Who is done is not shown while reading (the band has no
  checks in this phase).
- When time runs out, the game moves on. Until anyone acts on the next screen,
  that screen shows the extension item in the footer beside its main
  action, secondary (outlined, not filled); it brings everyone back to the handout with
  more time. It fades in and out with the screen it sits on, so it never shows
  next to the handout's own extension button.
- After the phase, the footer's handout button opens the same tabs in a sheet,
  read-only: each setting's name with what was filled in under it, or
  `handout.blank` in the quiet colour when it was left empty.
- Text typed into a setting is the one text the bundled subsets cannot hold,
  so it may fall back to a system face.

## Post-game handouts

- When the post-game phase has handouts (`HandoutReviewView`), it shows every
  part's handout and what its player filled in, so players can compare their
  answers. A row of parts on top, yours chosen first and filled dark; under it
  that part's handout in the same tabs as the handout sheet, read-only. The
  part's own tab is labelled `handout.body`, since the part is already chosen
  above. The tab stays when the part changes, so one setting can be read across
  players. The footer holds the next-phase button (the end button in the last phase).

# UZU's read-through layout is a second screen of the read-through; the chat stays

UZU's design guide gives the read-through 6 screens in both orientations (you speak, another speaks and you are next, a character's first appearance, narration you read, narration another reads, the log): standing characters, one dialogue frame with the line being read, two nameplates, a log link and a next button. The toolkit now has them as `StageReadThrough`, a screen of `ReadThroughView` next to the chat bubbles, chosen with `props: { script, screen: StageReadThrough }`. The chat stays the default; a work picks one.

Why a second screen and not a replacement: the guide says its layouts are optional, and certification does not mention them. The chat is the owner's earlier decision and handles what the guide does not (ruby, lines that run long, a part reading several roles). Why not only borrowing its rules: three of the six screens (standing characters, the first appearance, the log) cannot be had that way.

- Entry: `@uzu-toolkit/reader/stage`, so a work that keeps the chat ships none of it (the build-size test holds). `stage-layout.ts` is the one place for the guide's numbers (a table of about 14 parts for each orientation, and `stageScene()` for what each of the 6 screens shows); the guide says its values may change.
- The stage fills the whole screen, like the guide's reference screen: it hides the band and the footer while it is up (so the phase list and the handouts cannot be opened from it), puts the next button and the log link inside the frame, and scales to fit the shorter side. Another shape of screen (a tablet) gets bars.
- A character's picture is `public/assets/stand-<role>.webp`; a role without one shows none. The first appearance is a role's first line.
- Nameplate ① holding a name alone fits the name, as the guide says (its width follows the name's length, 78 in the template); ② follows 10px after it and takes the rest of the row. The guide's positions for ② in that case (x187 landscape, x135 portrait) do not agree with 78, so they are not used. Narration another reads has ① at 116 wide; your own turn has ① at 190 wide, which holds the name and the label for your turn.
- The next button is dark in your turn, since the frame is already the highlight blue and a blue button would vanish into it. Text under 16px is not used: the 18px text of the guide scales with the screen and stops at 16px.
- The guide's 2 lines (3 portrait) hold about 78 (54) characters; a longer line scrolls inside the frame. A work with long lines (such as the prose samples) should keep the chat.
- The work's `notice` is shown at the top of the log.

Not taken: replacing the chat; a `layout` option on the chat screen (it would ship both everywhere); drawing the guide's characters from icons (the icons are small emoji squares, which look wrong at that size).

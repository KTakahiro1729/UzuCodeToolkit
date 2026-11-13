# From a plan to parts

For the agent that turns an author's plan into a work. The toolkit sets no format for the plan: the author writes it freely, and you read it and pick the parts. This table says which part answers which thing a plan may say. It defines no schema. The parts are listed in `CLAUDE.md` (Layout, Phases, Replacing the screens).

| The plan says | Use |
|---|---|
| A numbered list of phases, with minutes | A list of phases in `flowLogic(phases, partIds)`; a minute count becomes the phase's `deadline` |
| A phase read aloud ("読み合わせ") | `readThroughPhase(script)` with `ReadThroughView` |
| Characters and who plays them | The manifest's characters; `partsOf` / `assignParts` for seats; one seat may read several roles (`parts` in the script) |
| Lines written as "name line", with a reading in （） after a word | The script's lines; `parseRuby` for the readings (stored as Aozora ruby) |
| A stage direction or a scene heading | A line of a cast entry with `direction: true`; a scene heading on the line that opens the scene |
| A handout: shared text, text per part, impressions of others, settings to fill in | `handoutScreen(handouts, props)` with `HandoutView`; after the game `HandoutReviewView` |
| "Read for 5 minutes", an extension, a pause | The handout phase's timer (`TimeLeft`, `secondsLeft`); extension and pause are part of it |
| An introduction, the cast, "ready when everyone is ready" | `castScreen(props)` and `readyPhase` |
| A list of games to choose from | `gameSelectPhase`, `GameSelectView`; cards `deck` / `deal`; a vote `Ballot` with `Vote` |
| "Shown only to X", a secret | Hidden on screen only (docs/decisions: secrets-are-hidden-on-screen-only); a `Guide` line for the part that sees it |
| "Who may move the game on" | `emptyPhase({ facilitator })`; the read-through's current reader moves its own phase |
| A chapter left empty, or "placeholder" | `emptyPhase()` |
| "Looks like this" (colours, art, mood) | The work's `theme.css` tokens and assets, not the toolkit |
| A game's rules | The work's own game under its `src/games/` (a game is not a toolkit part) |

What the plan leaves open: ask the author about what changes how the game plays, and fill the rest with a default and list it (docs/new-work.md; docs/decisions: ask-what-changes-the-play-fill-the-rest-and-list-it).

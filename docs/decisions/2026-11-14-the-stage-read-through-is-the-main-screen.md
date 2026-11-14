# The read-through's main screen is the stage one; the bubble chat is the other option

A work's read-through is drawn from a layout JSON and the work's own pictures (`StageReadThrough`), because that is what UZU's design guide shows and what an image generator can fill from an order sheet. The bubble chat (`ReadThroughView` without `screen`) stays for a work that draws nothing. `docs/new-work.md` and `template/` start a work on the stage screen; a work with no pictures still works, drawn from the colour tokens.

When the plan names a look, the agent asks the author once: colours and typefaces only, or also pictures from an order sheet (`docs/new-work.md`, "Pictures"). The order sheet's world section carries an example of how to write the world.

Not taken: making the stage screen the code's default (works built on the chat keep working; the change is in what the docs and the template start from).

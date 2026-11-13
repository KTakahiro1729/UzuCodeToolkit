# A layout definition is the one source of a screen's boxes, edited as slides

UZU's design guide gives each screen a layout: the image parts it needs and where they sit, then a generated picture to make the parts from. The owner expects the guide to publish more such layouts, and wants a work's layout to change by changing that definition: the toolkit lays the screen out from it, writes it out as slides the owner edits in Google Slides (move a box, add a button), and reads the slides back. So each laid-out screen has one JSON file (`docs/design/layout.md`), starting with the read-through's, holding the guide's numbers that used to be in `stage-layout.ts`.

- Slides are one per scene (the read-through has the guide's six) at the reference size; boxes carry their part id in their text, since slide tools may drop shape names.
- Landscape only, unless the work's spec asks for portrait: a layout leaves out an orientation it does not support.
- The frame, nameplates and buttons are the work's images of a fixed size the author keeps using; text stays code. A generated full-screen picture is the reference the parts are made from, not an asset.
- Only the data format is general. Behaviour (which scene a line is) stays code per screen; a generic engine that builds screens from layouts waits until a second layout shows what is common.

Not taken: SVG templates (no one edits them by hand here), drawing the parts from colour tokens only, a slide per screenshot.

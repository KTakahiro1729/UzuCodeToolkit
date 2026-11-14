# Scene check images are drawn with Pillow, from the layout and the work's pictures

Why: an AI that builds a work often cannot take screenshots (headless Chromium fails or times out in some sandboxes), yet it must see whether the pictures it made fit the layout: a character hidden behind the frame, a plate stretched wrong. Python with Pillow and Node are what such sandboxes have.

How: `python3 tools/check/compose.py <work dir>` writes one PNG per scene and orientation. It places each picture as the screen does (standing figures `contain`, bottom centre; nameplates keep their ends; the background covers) and draws every box's outline and part name over them. It does not run the screen, so it shows where pictures land, not text fitting or the real fonts; those need a browser.

Not taken: a Node image library (a dependency every work would carry for a rare case); rendering the Svelte screen (needs the browser that is missing).

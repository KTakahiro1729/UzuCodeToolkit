# A work is drawn on its own by letting the SDK run locally, not by replacing the SDK

Why: where no UZU host or dev harness runs (an AI's sandbox that forbids page navigation), the work still has to be drawn by its real code. The SDK already runs a single-player local game when the page counts as hosted (`window.FlutterHost` exists) and has no room ID, so setting `window.FlutterHost = { postMessage() {} }` before the work's scripts is all it needs. No stand-in SDK means no second copy of its behaviour to keep right.

How: `tools/screen-preview/standalone.mjs` puts the built page into `about:blank`, adds `<base href>` and answers the sub-resources from the build folder with `page.route`. `render.mjs` uses it when the harness cannot start. Limits: one seat only (the local player), no HUD, screens that need a prepared game state are not drawn.

Not taken: replacing `run()` with our own implementation (it would drift from the SDK).

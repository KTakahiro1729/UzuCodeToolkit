# Font glyph lists come from the project's files, and a test guards them

Each project (sample or work) lists in `fonts.config.json` which files and fields feed the story font and the UI font, so a work whose strings or data sit elsewhere only changes that file. A test fails when a subset lacks a glyph the project shows; one command rebuilds the subsets (`npm run fonts`).

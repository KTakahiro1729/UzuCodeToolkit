# The PowerPoint round trip of layouts ships in the toolkit tarball

Why: a work on the stage screen edits its own copy of the layout, and the author moves boxes in PowerPoint or Google Slides rather than reading numbers. That happens inside the tarball workflow (the agent has only the package), so the export and import tools (`tools/layout/slides`) must be in it and must run there.

How: `@uzu-toolkit/toolkit` lists `jszip` and `pptxgenjs` as dependencies, so a work that installs it gets them. The tools find the toolkit's layout beside the installed reader, as the order-sheet tool does. The template has `layout:export` and `layout:import` scripts, and `docs/new-work.md` ("Moving the boxes on slides") says when: after the author asks for another arrangement, before the order sheet, because picture sizes follow the boxes.

Not taken: leaving the tools in the repository only (an earlier trim did, and the workflow then had no way for the author to move boxes).

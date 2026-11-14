# The layout slides ship with every stage work

The PowerPoint form of a layout (`npm run layout:export`) is the owner's master for judging and moving boxes without reading numbers. Every work on the stage screen hands over its slides in the output (`slides/layout.pptx`, or the landscape and portrait files when the work has both), whether or not anyone asked to move a box; the agent exports again after it changes the layout JSON itself, and says which boxes it moved. The report's fourth list names where the slides are. The reason is an agent's run in which the layout was edited (the frame and the standing boxes enlarged) with nothing to compare against the guide's arrangement; the slides make that visible. Where the export cannot run, the report says so.

The export is one command and must finish within 20 seconds in the agent's sandbox; a test runs it as a child process with a 20-second limit (it takes about 0.3 s here).

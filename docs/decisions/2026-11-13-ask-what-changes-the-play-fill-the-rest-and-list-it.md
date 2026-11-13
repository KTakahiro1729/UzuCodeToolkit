# Ask what changes how the game plays; fill the rest with defaults and list them

Replaces `archive/2026-11-13-gaps-in-a-plan-are-filled-with-defaults-and-listed.md`.

Where a plan leaves something open, the agent asks the author first only about what changes how the game plays: a game's rules and how it is won, who may move the game on, the number of players and parts, and the order and length of the phases. It asks all of them in one message, each with options and a recommendation, so one line answers each. Everything else (introduction and guide wording, labels, colours, art, small layout choices) is filled with a sound default and listed back to the author after the build, to be fixed later from the author's reaction to the screens. A choice the author makes in the plan always wins.

Why: the author's work is the plan and a reaction to the screens, not a series of prompts. But a choice that changes the play is costly to redo after the build, while a wording or a colour is cheap to change. The first earlier build filled about twenty gaps silently, three games' rules among them; the official flow also tells the AI to ask first about what has to be decided.

Not taken: asking about every gap (slow, against "hand over a plan and get a work"); filling every gap silently (what the earlier decision allowed; the play-changing ones were the costly ones).

Where: `docs/new-work.md` (the steps and the report to give back).

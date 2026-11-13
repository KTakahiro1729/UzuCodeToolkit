# Decisions

One file per owner decision. Read these before working; they are the single source of truth for what was decided and why.

## Writing one

- File name: `YYYY-MM-DD-short-slug.md` (the day it was decided). Do not number files and do not keep an index file: two pull requests that each add a file never touch the same line, so they cannot conflict.
- Content: `# Title` (the decision as a sentence), then why, what was not taken, and where it shows in the code.
- To change a decision, add a new file that says which file it replaces, and edit the old file's first line after the title to `Superseded by <file>.` Do not rewrite history in place.
- Each pull request adds its own decision files. They are not collected afterwards.

## Reading them

List the titles: `head -qn1 docs/decisions/20*.md`. Search them: `grep -ril <word> docs/decisions`.

## Review

The set will grow without bound. Review it from time to time: merge decisions that say the same thing, and move the ones the code now makes obvious or that were superseded into `archive/`. There is no mechanism for this yet.

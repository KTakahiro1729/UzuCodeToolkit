# Decisions

One file per owner decision: why a rule is what it is. They are not the spec. What a screen does now is in `docs/design.md` and `docs/design/`; what the code and its checks enforce is in the code.

## Reading them

Do not read them through. List the titles with `head -qn1 docs/decisions/20*.md`, and search by word before you change a rule: `grep -ril <word> docs/decisions docs/decisions/archive`.

## Writing one

- File name: `YYYY-MM-DD-short-slug.md` (the day it was decided). Do not number files and do not keep an index file: two pull requests that each add a file never touch the same line, so they cannot conflict.
- Content: `# Title` (the decision as a sentence), then why, what was not taken, and where it shows in the code. Keep it short.
- A decision that changes how a screen looks or works also changes `docs/design.md` or `docs/design/` in the same pull request. The spec states the result; the decision keeps the reason.
- To change a decision, add a new file that says which one it replaces, and put `Superseded by <file>.` after the old file's title. Do not rewrite history in place.
- Each pull request adds its own decision files. They are not collected afterwards.

## Keeping the set small

`docs/decisions/` holds only what still guides work: architecture, process, and reasons no check or spec shows. `archive/` holds the rest: superseded decisions, and decisions whose result now stands in the spec or in a test or lint rule. Move a file there with `git mv` when its rule is in the spec or enforced by a check, or when it is superseded. Nothing is deleted.

# The note of a waiting button says how many are left, in the fewest words

The owner wants the waiting note to read `あと{n}人` (`status.waitCount`), so the count shows by default; it replaces the "Default: the plain sentence" part of "Phase progress follows the official guide where it fits". A work that empties `status.waitCount` keeps `他の人を待っています` (`status.waitOthers`). Where: `packages/reader/src/wait.ts`, `strings.json`, `docs/design.md` (Footer options).

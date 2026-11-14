// Copies the toolkit's root-level files into this package just before `npm pack`, so a work that
// installs the package gets them under node_modules/@uzu-toolkit/toolkit/ in the same layout the
// submodule had (scripts/ and tools/ stay siblings). The copies are not committed (.gitignore).
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
for (const name of ['CLAUDE.md', 'docs', 'scripts', 'tools', '.stylelintrc.json']) {
  rmSync(here(name), { recursive: true, force: true });
  cpSync(here(`../../${name}`), here(name), { recursive: true });
}

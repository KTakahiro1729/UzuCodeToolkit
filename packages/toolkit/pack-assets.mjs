// Copies the toolkit's root-level files into this package just before `npm pack`, so a work that
// installs the package gets them under node_modules/@uzu-toolkit/toolkit/ in the same layout the
// submodule had (scripts/ and tools/ stay siblings). The copies are not committed (.gitignore).
//
// Left out, because a work does not use them: the owner's decision records (docs/decisions), the
// PR-watch list (docs/status.md), the PowerPoint export of layouts (tools/layout/slides, which needs
// packages a work does not install) and the toolkit's own test fixtures. A finished example is
// added as examples/hundred-arms (the repository's samples/hundred-arms without its font subsets).
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const root = (p) => here(`../../${p}`);
const LEFT_OUT = ['docs/decisions', 'docs/status.md', 'tools/layout/slides', 'tools/check/fixtures'];

for (const name of ['CLAUDE.md', 'docs', 'scripts', 'tools', '.stylelintrc.json', 'examples']) {
  rmSync(here(name), { recursive: true, force: true });
}
for (const name of ['CLAUDE.md', 'docs', 'scripts', 'tools', '.stylelintrc.json']) {
  cpSync(root(name), here(name), { recursive: true });
}
for (const name of LEFT_OUT) rmSync(here(name), { recursive: true, force: true });
cpSync(root('samples/hundred-arms'), here('examples/hundred-arms'), {
  recursive: true,
  filter: (src) => !/[\\/]samples[\\/]hundred-arms[\\/](src[\\/]fonts|node_modules|dist)([\\/]|$)/.test(src),
});

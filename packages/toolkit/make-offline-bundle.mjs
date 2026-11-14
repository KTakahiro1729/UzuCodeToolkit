// Builds the folder of the offline bundle: the work template with the toolkit installed from the
// release URL, so `node_modules/` is complete and nothing has to be downloaded afterwards. Run by
// the Release workflow after the release exists (the install reads the release's tarballs), which
// zips the folder and attaches it. Usage: node make-offline-bundle.mjs <version> <out-dir>
// Needs npm 11 and the network (it is the bundle's maker that has them, not its user).
import { cpSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [version, out] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || !out) throw new Error('usage: node make-offline-bundle.mjs <version> <out-dir>');
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const repo = process.env.GITHUB_REPOSITORY ?? 'KTakahiro1729/UzuCodeToolkit';
const url = `https://github.com/${repo}/releases/download/v${version}/uzu-toolkit-toolkit-${version}.tgz`;

rmSync(out, { recursive: true, force: true });
cpSync(here('template'), out, { recursive: true });
renameSync(`${out}/gitignore`, `${out}/.gitignore`);
const pkgFile = `${out}/package.json`;
const pkg = readFileSync(pkgFile, 'utf8');
if (!pkg.includes('RELEASE-URL-OF-THE-TOOLKIT-TARBALL')) throw new Error('template/package.json has no URL placeholder');
writeFileSync(pkgFile, pkg.replace('RELEASE-URL-OF-THE-TOOLKIT-TARBALL', url));
writeFileSync(`${out}/START-HERE.md`, readFileSync(here('OFFLINE.md'), 'utf8').replaceAll('VERSION', version));
execFileSync('npm', ['install'], { cwd: out, stdio: 'inherit' });
if (!existsSync(`${out}/node_modules/@uzu-toolkit/toolkit/README.md`)) throw new Error('the toolkit was not installed');

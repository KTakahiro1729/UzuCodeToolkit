# The toolkit is shipped to works as tarballs on a GitHub release, not as a submodule

Why: an AI that builds a work often cannot run `npm`, clones without submodules, or pins an old commit by hand; the CI of a work then fails at the checkout. A tarball is one URL and one version in the work's `package.json` and lockfile. npm cannot install a package from a folder of a git repository (npm/cli#513), and GitHub Packages asks the installer for a token, so a release asset is the way that needs no account.

How: Actions > Release > Run workflow with a version creates the release `v<version>` with three tarballs. `@uzu-toolkit/toolkit` depends on `@uzu-toolkit/kit` and `@uzu-toolkit/reader` by their release URLs, so a work installs one URL (`npm i <release URL of the toolkit tarball>`). It also carries README.md (where an agent with nothing but this package starts), CLAUDE.md, docs, scripts, tools, the stylelint config and `template/` (package.json, vite config, tsconfig, CI, AGENTS.md: the files every work starts from), unpacked under `node_modules/@uzu-toolkit/toolkit/`. No template repository and no empty repository are needed.

Not taken: publishing on npm now (an account and a name to claim; revisit when a work needs `@latest`); the submodule (kept in the older works until they move).

# The toolkit is shipped to works as tarballs on a GitHub release, not as a submodule

Why: an AI that builds a work often cannot run `npm`, clones without submodules, or pins an old commit by hand; the CI of a work then fails at the checkout. A tarball is one URL and one version in the work's `package.json` and lockfile. npm cannot install a package from a folder of a git repository (npm/cli#513), and GitHub Packages asks the installer for a token, so a release asset is the way that needs no account.

How: Actions > Release > Run workflow with a version creates the release `v<version>` with three tarballs: `@uzu-toolkit/kit`, `@uzu-toolkit/reader` and `@uzu-toolkit/dev` (CLAUDE.md, docs, scripts, tools and the stylelint config, unpacked under `node_modules/@uzu-toolkit/dev/`). A work lists the three URLs; the reader's dependency on the kit is pinned to the same version.

Not taken: publishing on npm now (an account and a name to claim; revisit when a work needs `@latest`); the submodule (kept in the older works until they move).

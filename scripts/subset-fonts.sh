#!/bin/sh
# Rebuild a project's bundled font subsets from its fonts.config.json (see tools/fonts/fonts.mjs).
# Usage: scripts/subset-fonts.sh [projectDir]...   (default: every sample; needs node, curl and
# fonttools' pyftsubset: pip install fonttools brotli). A work that takes the toolkit as a
# submodule runs it on its own root: sh toolkit/scripts/subset-fonts.sh .
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
if [ $# -eq 0 ]; then
  set -- $(ls -d "$HERE"/../samples/*/fonts.config.json | xargs -n1 dirname)
fi
T=$(mktemp -d)
trap 'rm -r "$T"' EXIT
G=https://raw.githubusercontent.com/google/fonts/main/ofl
curl -fsSLo "$T/mincho.ttf" $G/shipporimincho/ShipporiMincho-Regular.ttf
for w in Regular Bold; do curl -fsSLo "$T/gothic-$w.ttf" $G/bizudpgothic/BIZUDPGothic-$w.ttf; done
for P in "$@"; do
  node "$HERE/../tools/fonts/fonts.mjs" collect "$P" "$T"
  F=$(cat "$T/out.txt")
  mkdir -p "$F"
  pyftsubset "$T/mincho.ttf" --text-file="$T/story.txt" --flavor=woff2 --layout-features='*' --output-file="$F/ShipporiMincho-Regular.subset.woff2"
  for w in Regular Bold; do
    pyftsubset "$T/gothic-$w.ttf" --text-file="$T/ui.txt" --flavor=woff2 --layout-features='*' --output-file="$F/BIZUDPGothic-$w.subset.woff2"
  done
done

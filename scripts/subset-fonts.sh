#!/bin/sh
# Rebuild a sample's bundled font subsets (src/fonts/) from its script and the UI strings.
# Usage: scripts/subset-fonts.sh samples/<name>   (needs node, curl and fonttools' pyftsubset)
set -eu
S=$1
T=$(mktemp -d)
G=https://raw.githubusercontent.com/google/fonts/main/ofl
curl -sSLo "$T/mincho.ttf" $G/shipporimincho/ShipporiMincho-Regular.ttf
for w in Regular Bold; do curl -sSLo "$T/gothic-$w.ttf" $G/bizudpgothic/BIZUDPGothic-$w.ttf; done
# Story text: title, end mark, afterword, scene headings and lines (ruby included).
# UI text: cast and part names, names the lines use, the work's notice and the UI strings the
# read-through shows (a sample is one read-through; the other screens' strings would only add weight).
node -e '
const [dir, out] = process.argv.slice(1);
const s = require(`./${dir}/script/script.json`);
const all = require("./packages/reader/src/strings.json");
const READING = ["phase.reading", "phase.review", "review.heading", "review.afterword", "button.end", "name.and", "button.next"];
const ui = Object.fromEntries(READING.map((k) => [k, all[k]]));
const set = (a) => [...new Set(a.filter(Boolean).join(""))].join("");
const fs = require("fs");
fs.writeFileSync(`${out}/story.txt`, set([s.title, s.end, s.afterword, ...s.lines.flatMap((l) => [l.scene, l.text])]));
fs.writeFileSync(`${out}/ui.txt`, set([...s.cast.map((c) => c.label), ...(s.parts ?? []).map((p) => p.name), ...s.lines.map((l) => l.label), s.notice, ...Object.values(ui)]));
' "$S" "$T"
F=$S/src/fonts
mkdir -p "$F"
pyftsubset "$T/mincho.ttf" --text-file="$T/story.txt" --flavor=woff2 --layout-features='*' --output-file=$F/ShipporiMincho-Regular.subset.woff2
for w in Regular Bold; do
  pyftsubset "$T/gothic-$w.ttf" --text-file="$T/ui.txt" --flavor=woff2 --layout-features='*' --output-file=$F/BIZUDPGothic-$w.subset.woff2
done
rm -r "$T"

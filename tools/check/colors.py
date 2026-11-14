#!/usr/bin/env python3
"""Prints the mean colour of the opaque pixels in the middle of each picture, as JSON: {"frame": [r, g, b], ...}.

  python3 tools/check/colors.py <file.webp> ...

The middle (the inner 80% across, 60% down) is where text sits on a frame, a plate or a panel. A file Pillow cannot
read is left out of the answer. Needs Pillow only (the same as compose.py). Called by tools/check/picture-colors.mjs.
"""
import json
import sys
from pathlib import Path

from PIL import Image

out = {}
for arg in sys.argv[1:]:
    try:
        im = Image.open(arg).convert('RGBA')
    except Exception:
        continue
    w, h = im.size
    mid = im.crop((int(w * 0.1), int(h * 0.2), int(w * 0.9), int(h * 0.8)))
    px = [p for p in mid.getdata() if p[3] > 128]
    if px:
        out[Path(arg).stem] = [round(sum(p[i] for p in px) / len(px)) for i in range(3)]
print(json.dumps(out))

#!/usr/bin/env python3
"""Draws each scene of a work's layout (docs/design/layout.md) as a PNG, from its pictures (public/assets/*.webp).

A stand-in for a screenshot where no browser runs: it places the background, standing characters, frame,
nameplates, buttons and log panel the way the stage read-through does, then draws every box's outline and part
name over them. Text is a placeholder (the part's label). The point is to see a picture that does not fit its
box: a character hidden behind the frame, a picture stretched, a missing file (drawn as a grey box).

  python3 tools/check/compose.py <work dir> [--layout file] [--orientation landscape|portrait]
                                 [--roles a,b] [--scale 2] [--out dir]

Needs Pillow only. Writes <out>/<scene id>-<key>-<orientation>.png (default out: <work dir>/screen-check).
Drawing follows packages/reader/src/components/StageReadThrough.svelte:
  background       covers the whole screen, centred (`cover`)
  standing figure  `object-fit: contain`, `object-position: bottom center` in its box
  nameplate        keeps its two ends (half its height) and stretches between them (`stretch`)
  other pictures   stretched to the box
  your turn        a part in the scene's `mine` list takes `<image>-mine.webp` when the work has it
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

COLORS = [(230, 57, 70), (29, 120, 220), (42, 157, 143), (244, 162, 97), (131, 56, 236), (6, 160, 200), (214, 40, 140)]
FONT_PATHS = [
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',
    '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc',
    '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc',
    'C:/Windows/Fonts/YuGothR.ttc',
]


def find_font(size):
    """A Japanese font at `size`, or None (labels are then the part ids alone)."""
    paths = list(FONT_PATHS)
    try:
        found = subprocess.run(['fc-list', ':lang=ja', 'file'], capture_output=True, text=True, timeout=10).stdout
        paths += [l.split(':')[0] for l in found.splitlines()]
    except (OSError, subprocess.SubprocessError):
        pass
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return None


def layout_of(work, given):
    if given:
        return json.loads(Path(given).read_text('utf8'))
    own = sorted((work / 'src').glob('*.layout.json')) if (work / 'src').is_dir() else []
    if len(own) == 1:
        return json.loads(own[0].read_text('utf8'))
    here = Path(__file__).resolve().parent
    for rel in ('../../packages/reader/src/layouts', '../../../reader/src/layouts'):
        f = here / rel / 'read-through.layout.json'
        if f.exists():
            return json.loads(f.read_text('utf8'))
    sys.exit('no layout: give --layout')


def roles_of(work, assets, given):
    """Roles that stand in the scenes: --roles, else the cast of script/script.json, else the stand-*.webp present."""
    if given:
        return given.split(',')
    script = work / 'script' / 'script.json'
    if script.exists():
        cast = json.loads(script.read_text('utf8')).get('cast', [])
        ids = [c['id'] for c in cast if not c.get('direction')]
        if ids:
            return ids
    return [p.stem[len('stand-'):] for p in sorted(assets.glob('stand-*.webp'))]


def load(assets, name):
    f = assets / f'{name}.webp'
    return Image.open(f).convert('RGBA') if f.exists() else None


def paste(canvas, img, box, how, s):
    x, y, w, h = [round(v * s) for v in box]
    if w < 1 or h < 1:
        return
    if how == 'cover':
        k = max(canvas.width / img.width, canvas.height / img.height)
        r = img.resize((round(img.width * k), round(img.height * k)))
        ox, oy = (r.width - canvas.width) // 2, (r.height - canvas.height) // 2
        canvas.alpha_composite(r.crop((ox, oy, ox + canvas.width, oy + canvas.height)))
    elif how == 'contain':
        k = min(w / img.width, h / img.height)
        r = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))))
        canvas.alpha_composite(r, (x + (w - r.width) // 2, y + h - r.height))
    elif how == 'ends':
        end = img.height // 2
        e = min(max(1, round(end * h / img.height)), w // 2)
        left = img.crop((0, 0, end, img.height)).resize((e, h))
        right = img.crop((img.width - end, 0, img.width, img.height)).resize((e, h))
        mid = img.crop((end, 0, img.width - end, img.height)).resize((max(1, w - 2 * e), h))
        canvas.alpha_composite(left, (x, y))
        canvas.alpha_composite(mid, (x + e, y))
        canvas.alpha_composite(right, (x + w - e, y))
    else:
        canvas.alpha_composite(img.resize((w, h)), (x, y))


def dashed(d, xy, color, width, dash=8):
    x0, y0, x1, y1 = [round(v) for v in xy]
    for t in range(x0, x1, dash * 2):
        e = min(t + dash, x1)
        d.line([(t, y0), (e, y0)], color, width)
        d.line([(t, y1), (e, y1)], color, width)
    for t in range(y0, y1, dash * 2):
        e = min(t + dash, y1)
        d.line([(x0, t), (x0, e)], color, width)
        d.line([(x1, t), (x1, e)], color, width)


def compose(layout, scene, orientation, assets, roles, s, font):
    """The scene as an RGB image, and the notes (pictures it lacks)."""
    W, H = layout['reference'][orientation]
    canvas = Image.new('RGBA', (round(W * s), round(H * s)), (40, 44, 52, 255))
    parts = layout['parts']
    seats = {'c1': 0, 'c2': 1, 'solo': 0}
    notes = []
    drawn = []
    for pid in scene['show']:
        part = parts.get(pid)
        if not part or orientation not in part:
            continue
        box = scene.get('boxes', {}).get(pid, {}).get(orientation, part[orientation])
        name = part.get('image')
        pic = None
        if name and '{role}' in name:
            seat = seats.get(pid, 0)
            name = name.replace('{role}', roles[seat]) if seat < len(roles) else None
            pic = load(assets, name) if name else None
        elif name:
            pic = (load(assets, f'{name}-mine') if pid in scene.get('mine', []) else None) or load(assets, name)
        if pic is not None:
            how = 'cover' if pid == 'bg' else 'contain' if '{role}' in part['image'] else 'ends' if part.get('stretch') else 'stretch'
            paste(canvas, pic, (0, 0, W, H) if how == 'cover' else box, how, s)
        elif name:
            notes.append(f'{pid}: assets/{name}.webp missing')
            x, y, w, h = [v * s for v in box]
            ImageDraw.Draw(canvas, 'RGBA').rectangle([x, y, x + w, y + h], fill=(160, 160, 160, 150))
        drawn.append((pid, part, box, pic is not None))

    over = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    for area in layout.get('reserved', {}).values():
        if orientation in area:
            x, y, w, h = [v * s for v in area[orientation]]
            d.rectangle([x, y, x + w, y + h], fill=(230, 57, 70, 70), outline=(230, 57, 70, 220), width=2)
            if font:
                d.text((x + 3, y + 2), area['label'], fill=(255, 255, 255, 255), font=font)
    m = layout.get('margin', {}).get(orientation)
    if m:
        dashed(d, (m['left'] * s, m['top'] * s, (W - m['right']) * s, (H - m['bottom']) * s), (255, 255, 255, 150), 1)
    for i, (pid, part, box, found) in enumerate(drawn):
        c = COLORS[i % len(COLORS)]
        x, y, w, h = [v * s for v in box]
        d.rectangle([x, y, x + w, y + h], outline=c + (255,), width=2)
        label = f"{pid} {part['label']}" if font else pid
        if not found and part.get('image'):
            label += ' (no picture)'
        tw = d.textlength(label, font=font)
        ty = y + 2 if h > 14 * s else y - 12 * s
        d.rectangle([x + 1, ty, x + tw + 3, ty + 12 * s], fill=(0, 0, 0, 170))
        d.text((x + 2, ty), label, fill=c + (255,), font=font)
    return Image.alpha_composite(canvas, over).convert('RGB'), notes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('work')
    ap.add_argument('--layout')
    ap.add_argument('--orientation', choices=['landscape', 'portrait'])
    ap.add_argument('--roles')
    ap.add_argument('--scale', type=float, default=2)
    ap.add_argument('--out')
    a = ap.parse_args()
    work = Path(a.work)
    assets = work / 'public' / 'assets'
    layout = layout_of(work, a.layout)
    roles = roles_of(work, assets, a.roles)
    out = Path(a.out) if a.out else work / 'screen-check'
    out.mkdir(parents=True, exist_ok=True)
    font = find_font(round(10 * a.scale))
    if font is None:
        print('no Japanese font found: boxes are named by part id only', file=sys.stderr)
    for o in ('landscape', 'portrait'):
        if o not in layout['reference'] or a.orientation not in (None, o):
            continue
        for scene in layout['scenes']:
            img, notes = compose(layout, scene, o, assets, roles, a.scale, font)
            f = out / f"{scene['id']:02d}-{scene['key']}-{o}.png"
            img.save(f)
            print(f)
            for n in notes:
                print(f'  ! {n}')


if __name__ == '__main__':
    main()

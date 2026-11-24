"""Render fonts/cascivo-mono/specimen.png: python3 -I fonts/cascivo-mono/src/specimen.py"""
import os
from PIL import Image, ImageDraw, ImageFont, features

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VF = os.path.join(ROOT, 'fonts', 'CascivoMono[opsz,wght].ttf')
PLEX = '/tmp/claude-0/-home-user-cascivo/93daf58c-961e-59db-aafe-64d991de93c9/scratchpad/refs/visual/IBMPlexMono-Regular.ttf'
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC


def face(size, wght=400, path=VF):
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    if path == VF:
        f.set_variation_by_axes([14, wght] if f.get_variation_axes()[0]['name'] in (b'Optical size', 'Optical size') else [wght, 14])
    return f


rows = [
    (face(18), 'Cascivo Mono v1: one 600-unit cell, opsz 14'),
    (face(40), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    (face(40), 'abcdefghijklmnopqrstuvwxyz'),
    (face(40), '0123456789 il1I|!; mmwwMMWW'),
    (face(40), 'const x = fn(a, b) => a != b;'),
    (face(40, 100), 'Thin 100  {[(<minimum>)]} @#$%&*'),
    (face(40, 400), 'Regular 400  if (n > 0) return n;'),
    (face(40, 900), 'Black 900  if (n > 0) return n;'),
]
if os.path.exists(PLEX):
    rows.append((face(40, path=PLEX), 'const x = fn(a, b) => a != b; (Plex)'))
img = Image.new('L', (1600, 60 + 64 * len(rows)), 255)
d = ImageDraw.Draw(img)
y = 30
for f, s in rows:
    d.text((40, y), s, font=f, fill=0)
    y += 64
img.save(os.path.join(ROOT, 'specimen.png'))

"""Round 7 sheets: python3 -I src/specimen_round7.py <before|after> [ref.ttf | barlow-dir]; writes specimens/round7/<tag>-*.png.

A ref .ttf is a variable font (Roboto Condensed); a directory holds Barlow Condensed's statics named *-<wght>-normal.ttf."""
import glob
import os
import sys
from PIL import Image, ImageDraw, ImageFont, features

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VF = os.path.join(ROOT, 'fonts', 'CascivoCondensed[opsz,wght].ttf')
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
TAG = sys.argv[1] if len(sys.argv) > 1 else 'after'
REFS = sys.argv[2:]


def face(path, size, wght=400, opsz=None):
    if os.path.isdir(path):
        return ImageFont.truetype(glob.glob(os.path.join(path, f'*-{wght}-normal.ttf'))[0], size, layout_engine=LAYOUT)
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    names = [a['name'] for a in f.get_variation_axes()]
    f.set_variation_by_axes([{b'Optical size': opsz or min(48, size), 'Optical size': opsz or min(48, size)}.get(n, wght) for n in names])
    return f


def fonts():
    yield 'Cascivo', VF
    for r in REFS:
        yield os.path.basename(r.rstrip('/'))[:18], r


LBL = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
label = ImageFont.truetype(LBL, 12) if os.path.exists(LBL) else None


def sheet(name, rows, width):
    img = Image.new('L', (width, sum(r[1] for r in rows) + 40), 255)
    d = ImageDraw.Draw(img)
    y = 20
    for f, lh, s, *track in rows:
        if f is None:
            y += lh
            continue
        if track:  # letter-spacing by hand: PIL has no tracking
            x = 20
            for ch in s:
                d.text((x, y), ch, font=f, fill=0)
                x += f.getlength(ch) + track[0]
        else:
            d.text((20, y), s, font=f, fill=0)
        y += lh
    img.save(os.path.join(ROOT, 'specimens', 'round7', f'{TAG}-{name}.png'))


rows = []
for nm, path in fonts():
    rows.append((label, 16, nm))
    for px, w, s in ((96, 900, 'Quarterly Records'), (72, 700, 'Ticket Sales Jump 38%'), (48, 400, 'Every weight, every street, rated'), (48, 100, 'Thin Agency Display 2026')):
        rows.append((face(path, px, w), round(px * 1.12), s))
sheet('headlines', rows, 1500)
rows = []
for nm, path in fonts():
    rows.append((label, 16, nm))
    for w in (400, 600, 700, 900):
        rows.append((face(path, 12, w), 22, f'01 · WHAT WE MAKE — CASE STUDIES / {w} WEIGHT ARCHIVE', 1.8))
sheet('eyebrows', rows, 700)
TABLE = ['Region      Q1      Q2      Q3     Δ%', 'North   1,204.50  987.10  1,111.00  +12.6', 'South     308.75  411.40    399.99   -2.8',
         'Total   1,513.25 1,398.50 1,510.99   +8.0', '0123456789 $€£ %‰ 1/2 ½ 3×4 ±0.5 #11 11:11']
rows = []
for nm, path in fonts():
    rows.append((label, 16, nm))
    for w in (400, 700):
        rows += [(face(path, 16, w), 22, s) for s in TABLE]
sheet('figures', rows, 800)
rows = []
for nm, path in fonts():
    for w in (100, 200, 300, 400, 500, 600, 700, 800, 900):
        rows.append((face(path, 32, w), 40, f'{w} Hamburgefonstiv 0123 RAQGS'))
sheet('weights', rows, 1100)

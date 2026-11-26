"""Round 10 sheets: python3 -I src/specimen_round10.py <before|after> [ref.ttf | barlow-dir]; writes specimens/round9/<tag>-*.png.

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
        if track and isinstance(track[0], str):  # an OpenType feature, e.g. tnum
            d.text((20, y), s, font=f, fill=0, features=[track[0]])
        elif track:  # letter-spacing by hand: PIL has no tracking
            x = 20
            for ch in s:
                d.text((x, y), ch, font=f, fill=0)
                x += f.getlength(ch) + track[0]
        else:
            d.text((20, y), s, font=f, fill=0)
        y += lh
    img.save(os.path.join(ROOT, 'specimens', 'round10', f'{TAG}-{name}.png'))



WGHTS = (100, 400, 700, 900)
HEAD = ['Quarterly Revenue Hits Record', 'Input/Output «Bonjour» {Config}']
for px in (48, 96):
    rows = []
    for nm, path in fonts():
        rows.append((label, 16, f'{nm} {px}px'))
        for w in WGHTS:
            f = face(path, px, w)
            rows += [(f, round(px * 1.2), s) for s in HEAD]
    sheet(f'headlines-{px}', rows, 1700 if px == 96 else 1000)
UI = ['Save changes   Cancel   Get started', 'Overview  Activity  Settings  Billing', 'Read/Write  and/or  «Oui» ‹non›  {name}',
      'Home / Projects / Settings   src\\app\\main',
      ('CASE STUDIES · 2026 REPORT',)]
for px in (12, 16):
    rows = []
    for nm, path in fonts():
        rows.append((label, 16, f'{nm} {px}px'))
        for w in WGHTS:
            f = face(path, px, w)
            for s in UI:
                rows.append((f, round(px * 1.5), s[0], px * 0.12) if isinstance(s, tuple) else (f, round(px * 1.5), s))
            rows.append((None, 6, ''))
    sheet(f'ui-{px}', rows, 520)
TABLE = ['REGION      Q1 2026     Q2 2026    CHANGE', 'North        $1,299.00   $1,411.10  +8.6%', 'South        $10,980     $9,696     -11.7%',
         'West (new)   [n/a]       $3,568     +100%']
FIGS = ['0123456789  $1 $10 #1 (1) [1] {1}', '$1,299.00  €49.95  11/25/2026  2026-11-25  1/2  3/4', '1111 0000 OO00 1l1I 3568 9696']
for px in (12, 16, 48):
    rows = []
    for nm, path in fonts():
        rows.append((label, 16, f'{nm} {px}px'))
        for w in WGHTS:
            f = face(path, px, w)
            rows += [(f, round(px * 1.35), s, 'tnum') if LAYOUT == ImageFont.Layout.RAQM else (f, round(px * 1.35), s) for s in TABLE]
            rows += [(f, round(px * 1.35), s) for s in FIGS]
            rows.append((None, 6, ''))
    sheet(f'tables-{px}', rows, 1300 if px == 48 else 560)

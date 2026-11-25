"""Round 8 sheets: python3 -I src/specimen_round8.py <before|after> [ref.ttf | barlow-dir]; writes specimens/round8/<tag>-*.png.

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
    img.save(os.path.join(ROOT, 'specimens', 'round8', f'{TAG}-{name}.png'))



WGHTS = (400, 700, 900)
UI = [('headline', 'Quarterly Revenue Hits Record'), ('button', 'Save changes   Cancel   Get started'), ('tabs', 'Overview  Activity  Settings  Billing'),
      ('eyebrow', 'CASE STUDIES · 2026 REPORT'), ('table', 'REGION   Q1 2026   Q2 2026   CHANGE')]
for px in (12, 16, 48):
    rows = []
    for nm, path in fonts():
        rows.append((label, 16, f'{nm} {px}px'))
        for w in WGHTS:
            f = face(path, px, w)
            for kind, s in UI:
                if px == 48 and kind in ('button', 'tabs', 'table'):
                    continue
                rows.append((f, round(px * 1.4), s, px * 0.12) if kind == 'eyebrow' else (f, round(px * 1.4), s))
            rows.append((None, 8, ''))
    sheet(f'ui-{px}', rows, 1500 if px == 48 else 700)
FIGS = ['0123456789  (proportional)', '\u20070123456789', '$1,299.00  €49.95  £1,011.11  ¥10,980', '2026-11-25  11/01/2026  31.12.1999  10:41',
        '1111 0000 OO00 1l1I 3568 9696', '+12.6%  −2.8%  ±0.5  1/2  #101']
rows = []
for nm, path in fonts():
    rows.append((label, 16, nm))
    for w in WGHTS:
        for px in (16, 48):
            f = face(path, px, w)
            rows += [(f, round(px * 1.3), s) for s in FIGS]
            if LAYOUT == ImageFont.Layout.RAQM:  # tabular figures need raqm for the tnum feature
                rows.append((f, round(px * 1.3), '0123456789 1111 1,011.10 (tnum)', 'tnum'))
sheet('figures', rows, 1100)
RHY = ['nnnonono nnonn HOHOHO', 'nOnCnGnQ nonconenanson', 'minimum illumination', 'HHOHHCHHGHHQ ooccee aass', 'Dodge Bags Quotas Cocoa']
rows = []
for nm, path in fonts():
    rows.append((label, 16, nm))
    for w in WGHTS:
        for px in (16, 48):
            f = face(path, px, w)
            rows += [(f, round(px * 1.3), s) for s in RHY]
sheet('rhythm', rows, 1100)

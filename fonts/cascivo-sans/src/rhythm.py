"""Rhythm proxy for JUDGING.md: the white between two n's over the white inside one n.

    python3 -I src/rhythm.py [REF.woff2|REF.ttf ...]

Prints gap/counter for 'nnnn' at wght 100 400 700 900 (default opsz), measured on a scanline at
half x-height of a 400 px HarfBuzz rendering. An even rhythm keeps the ratio about flat across
weights (Inter 0.56-0.64); a falling ratio means heavy weights clot.
"""

import io
import os
import sys

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

OWN = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fonts', 'CascivoSans[opsz,wght].ttf')
WEIGHTS = (100, 400, 700, 900)


def load(path):
    """A Pillow-readable TrueType stream (woff2 is decompressed in memory)."""
    t = TTFont(path)
    t.flavor = None
    buf = io.BytesIO()
    t.save(buf)
    buf.seek(0)
    return buf


def ratio(path, wght):
    f = ImageFont.truetype(load(path), 400, layout_engine=ImageFont.Layout.RAQM)
    names = [str(a['name']).lower() for a in f.get_variation_axes()]
    f.set_variation_by_axes([wght if 'weight' in n else a['default'] for n, a in zip(names, f.get_variation_axes())])
    im = Image.new('L', (2400, 600), 255)
    ImageDraw.Draw(im).text((40, 40), 'nnnn', font=f, fill=0)
    ink = np.array(im) < 128
    rows = np.where(ink.any(1))[0]
    line = ink[(rows.min() + rows.max()) // 2]
    xs = np.where(line)[0]
    seg = line[xs[0]:xs[-1] + 1]
    edges = np.flatnonzero(np.diff(seg.astype(np.int8))) + 1
    runs = np.diff(np.concatenate(([0], edges, [len(seg)])))
    whites = runs[1::2]  # runs alternate ink, white, ink ...: whites alternate counter, gap
    return whites[1::2].mean() / whites[0::2].mean()


if __name__ == '__main__':
    for path in [OWN, *sys.argv[1:]]:
        name = os.path.basename(path)
        print(f'{name:36}', ' '.join(f'{w}:{ratio(path, w):.2f}' for w in WEIGHTS))

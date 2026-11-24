"""Renders ../specimen.png: python3 -I fonts/cascivo-condensed/src/specimen.py"""

import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
TTF = os.path.join(HERE, '..', 'fonts', 'CascivoCondensed[opsz,wght].ttf')
LINES = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789 $€£ %&@?!', 'Condensed headlines fit more words in narrow columns.']


def font(size, wght):
    f = ImageFont.truetype(TTF, size, layout_engine=ImageFont.Layout.RAQM)
    f.set_variation_by_axes([wght if 'eight' in str(a['name']) else min(max(size * 0.75, 8), 48) for a in f.get_variation_axes()])
    return f


im = Image.new('RGB', (1600, 1500), 'white')
d = ImageDraw.Draw(im)
y = 30
d.text((40, y), 'Cascivo Condensed v1', font=font(28, 400), fill=(120, 120, 120))
y += 60
for w in (100, 400, 900):
    d.text((40, y), f'{w}', font=font(20, 400), fill=(160, 160, 160))
    y += 30
    for i, line in enumerate(LINES):
        size = 44 if i < 3 else 52
        d.text((40, y), line, font=font(size, w), fill='black')
        y += size + 22
    y += 20
im.crop((0, 0, 1600, y)).save(os.path.join(HERE, '..', 'specimen.png'))

"""Render specimen.png: python3 -I fonts/cascivo-serif/src/specimen.py"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont, features

HERE = os.path.dirname(os.path.abspath(__file__))
TTF = os.path.join(HERE, '..', 'fonts', 'CascivoSerif[opsz,wght].ttf')
PLEX = sys.argv[1] if len(sys.argv) > 1 else None
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
ROWS = [
    (400, 60, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    (400, 60, 'abcdefghijklmnopqrstuvwxyz'),
    (400, 60, '0123456789 &?!(.,;:)'),
    (400, 40, 'Sphinx of black quartz, judge my vow. Hamburgefonstiv'),
    (100, 54, 'Thin 100 Hamburgefonstiv HNOnoa'),
    (400, 54, 'Regular 400 Hamburgefonstiv HNOnoa'),
    (900, 54, 'Black 900 Hamburgefonstiv HNOnoa'),
]


def font(size, wght):
    f = ImageFont.truetype(TTF, size, layout_engine=LAYOUT)
    f.set_variation_by_axes([wght if b'Weight' in a['name'] else 14 for a in f.get_variation_axes()])
    return f


def main():
    rows = list(ROWS)
    H = sum(s * 1.5 for _, s, _ in rows) + 60 + (90 if PLEX else 0)
    im = Image.new('RGB', (1600, int(H)), 'white')
    d = ImageDraw.Draw(im)
    y = 30
    for w, s, txt in rows:
        d.text((40, y), txt, font=font(s, w), fill='black')
        y += s * 1.5
    if PLEX:
        d.text((40, y), 'IBM Plex Serif: Sphinx of black quartz, judge my vow. Hamburgefonstiv', font=ImageFont.truetype(PLEX, 40, layout_engine=LAYOUT), fill=(110, 110, 110))
    im.save(os.path.join(HERE, '..', 'specimen.png'))


if __name__ == '__main__':
    main()

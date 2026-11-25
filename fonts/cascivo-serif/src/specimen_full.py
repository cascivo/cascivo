"""Full specimen: caps, lowercase, figures, punctuation, 100-900 and a text paragraph, optionally over a reference row per line.

    python3 -I fonts/cascivo-serif/src/specimen_full.py OUT.png [FONT.ttf] [--ref SourceSerif4.woff2]

Upright only: Cascivo Serif has no italic yet (NOTES.md). The reference (grey) sits under each Cascivo line at the same size.
"""
import argparse
import os

from PIL import Image, ImageDraw, ImageFont, features

HERE = os.path.dirname(os.path.abspath(__file__))
TTF = os.path.join(HERE, '..', 'fonts', 'CascivoSerif[opsz,wght].ttf')
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
PARA = ('Typography is the craft of making written language legible and beautiful. At small sizes the counters close,',
        'the joins clot and the spacing decides whether a line reads as words or as a texture. Quick brown foxes',
        'jump over 13 lazy dogs: 0123456789, (a, b; c) “done”. Cogent graphs, eager agents and a quiet Galaxy.')
ROWS = [(400, 64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), (400, 64, 'abcdefghijklmnopqrstuvwxyz'),
        (400, 64, '0123456789 $€£%&@#*'), (400, 64, '.,:;!?¡¿‘’“”«»()[]{}/\\|-–—_+=<>~^'),
        (700, 64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), (700, 64, 'abcdefghijklmnopqrstuvwxyz 0123456789')]
ROWS += [(w, 44, f'{w} Hamburgefonstiv Cogency agree: HOCG nogea') for w in range(100, 1000, 100)]
ROWS += [(400, 18, t) for t in PARA] + [(700, 18, PARA[0])]


def font(path, size, wght):
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    f.set_variation_by_axes([wght if b'eight' in a['name'] else (14 if b'ptical' in a['name'] else a['default']) for a in f.get_variation_axes()])
    return f


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('font', nargs='?', default=TTF)
    ap.add_argument('--ref')
    a = ap.parse_args()
    k = 2 if a.ref else 1
    H = int(sum(s * 1.3 * k + (6 if a.ref else 0) for _, s, _ in ROWS)) + 60
    im = Image.new('RGB', (1800, H), 'white')
    d = ImageDraw.Draw(im)
    y = 30
    for w, s, txt in ROWS:
        d.text((30, y), txt, font=font(a.font, s, w), fill='black')
        y += s * 1.3
        if a.ref:
            d.text((30, y), txt, font=font(a.ref, s, w), fill=(120, 120, 120))
            y += s * 1.3 + 6
    im.save(a.out)


if __name__ == '__main__':
    main()

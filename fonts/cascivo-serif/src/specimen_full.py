"""Full specimen: caps, lowercase, figures, punctuation, 100-900, display 72 px, text at 16 and 18 px, and the italic.

    python3 -I fonts/cascivo-serif/src/specimen_full.py OUT.png [FONT.ttf] [--ref SourceSerif4.woff2]
        [--italic Italic.ttf] [--ref-italic SourceSerif4-Italic.woff2]

The reference (grey) sits under each Cascivo line at the same size. Italic rows are drawn only when an italic font is given
(or found next to the upright).
"""
import argparse
import os

from PIL import Image, ImageDraw, ImageFont, features

HERE = os.path.dirname(os.path.abspath(__file__))
TTF = os.path.join(HERE, '..', 'fonts', 'CascivoSerif[opsz,wght].ttf')
TTF_IT = os.path.join(HERE, '..', 'fonts', 'CascivoSerif-Italic[opsz,wght].ttf')
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
PARA = ('Typography is the craft of making written language legible and beautiful. At small sizes the counters close,',
        'the joins clot and the spacing decides whether a line reads as words or as a texture. Quick brown foxes',
        'jump over 13 lazy dogs: 0123456789, (a, b; c) “done”. Cogent graphs, eager agents and a quiet Galaxy.')
ROWS = [(400, 64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), (400, 64, 'abcdefghijklmnopqrstuvwxyz'),
        (400, 64, '0123456789 $€£%&@#*'), (400, 64, '.,:;!?¡¿‘’“”«»()[]{}/\\|-–—_+=<>~^'),
        (700, 64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), (700, 64, 'abcdefghijklmnopqrstuvwxyz 0123456789')]
ROWS += [(w, 44, f'{w} Hamburgefonstiv Cogency agree: HOCG nogea') for w in range(100, 1000, 100)]
ROWS += [(400, 72, 'Handgloves Rafters'), (700, 72, 'Quiet agency 2025')]
ROWS += [(400, 16, t) for t in PARA] + [(400, 18, t) for t in PARA] + [(700, 18, PARA[0])]
IT_ROWS = [(400, 64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), (400, 64, 'abcdefghijklmnopqrstuvwxyz'), (700, 64, 'abcdefghijklmnopqrstuvwxyz 0123'),
           (400, 72, 'Handgloves Rafters'), (100, 44, '100 Hamburgefonstiv agree'), (900, 44, '900 Hamburgefonstiv agree')]
IT_ROWS += [(400, 16, t) for t in PARA[:2]]


def font(path, size, wght):
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    f.set_variation_by_axes([wght if b'eight' in a['name'] else (14 if b'ptical' in a['name'] else a['default']) for a in f.get_variation_axes()])
    return f


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('font', nargs='?', default=TTF)
    ap.add_argument('--ref')
    ap.add_argument('--italic')
    ap.add_argument('--ref-italic')
    a = ap.parse_args()
    it = a.italic or (TTF_IT if a.font == TTF and os.path.exists(TTF_IT) else None)
    rows = [(a.font, a.ref, r) for r in ROWS] + ([(it, a.ref_italic, r) for r in IT_ROWS] if it else [])
    H = int(sum(s * 1.3 * (2 if ref else 1) + (6 if ref else 0) for _, ref, (_, s, _) in rows)) + 60
    im = Image.new('RGB', (1800, H), 'white')
    d = ImageDraw.Draw(im)
    y = 30
    for path, ref, (w, s, txt) in rows:
        d.text((30, y), txt, font=font(path, s, w), fill='black')
        y += s * 1.3
        if ref:
            d.text((30, y), txt, font=font(ref, s, w), fill=(120, 120, 120))
            y += s * 1.3 + 6
    im.save(a.out)


if __name__ == '__main__':
    main()

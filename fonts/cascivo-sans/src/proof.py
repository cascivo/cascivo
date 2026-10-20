"""Proof sheets: Cascivo over Inter over Geist at the weights the quality pass is judged at.

    python3 -I src/proof.py OUT_DIR [--refs DIR_WITH_Inter.ttf_InterItalic.ttf_Geist.ttf]

Writes cmp_{u|i}_w{100,250,400,650,900}_{lower,upper,figpunct,sentence}.png (Cascivo on top; the
italic has no Geist row) and text14_w{100,400,900}.png (running text at 14 px, enlarged 3x with
nearest-neighbour so pixels stay visible). 250 and 650 sit between masters, where a fix tuned at
100/400/900 can kink. Without --refs only Cascivo is drawn. Rendering is Pillow's (HarfBuzz via
raqm, so kerning applies), at each family's default optical size.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, '..', 'fonts')
WEIGHTS = (100, 250, 400, 650, 900)
TEXT_WEIGHTS = (100, 400, 900)
SAMPLES = {
    'lower': ('abcdefghijklmnopqrstuvwxyz', 80),
    'upper': ('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 80),
    'figpunct': ('0123456789 .,;:!?&@%()“”‘’', 80),
    'sentence': ('Hamburgefonstiv: quick wafting zephyrs vex bold Jim.', 56),
}
PARAGRAPH = (
    'Typography is the craft of making written language legible and beautiful. At small sizes '
    'the counters close, the joins clot and the spacing decides whether a line reads as words or '
    'as a texture. Quick brown foxes jump over 13 lazy dogs: 0123456789, (a, b; c) “done”.'
)
WIDTH, PAD, LABEL = 1700, 24, 22
INK, PAPER, MUTED = 0, 255, 120


def font_at(path, size, wght):
    """A Pillow font with its weight axis set; other axes stay at their defaults."""
    f = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
    axes = f.get_variation_axes()
    vals = []
    for a in axes:
        name = a['name'].decode().lower() if isinstance(a['name'], bytes) else str(a['name']).lower()
        vals.append(wght if 'weight' in name else a['default'])
    f.set_variation_by_axes(vals)
    return f


def families(refs, italic):
    """[(label, path)] top to bottom; Geist has no italic."""
    own = os.path.join(DIST, 'CascivoSans-Italic[opsz,wght].ttf' if italic else 'CascivoSans[opsz,wght].ttf')
    rows = [('Cascivo Sans', own)]
    if refs:
        rows.append(('Inter', os.path.join(refs, 'InterItalic.ttf' if italic else 'Inter.ttf')))
        if not italic:
            rows.append(('Geist', os.path.join(refs, 'Geist.ttf')))
    return rows


def sheet(rows, text, size, wght):
    label = ImageFont.load_default(size=LABEL - 6)
    fonts = [(name, font_at(path, size, wght)) for name, path in rows]
    line_h = int(size * 1.45)
    img = Image.new('L', (WIDTH, PAD + len(fonts) * (line_h + LABEL) + PAD), PAPER)
    d = ImageDraw.Draw(img)
    y = PAD
    for name, f in fonts:
        d.text((PAD, y), f'{name}  wght {wght}', font=label, fill=MUTED)
        d.text((PAD, y + LABEL), text, font=f, fill=INK)
        y += line_h + LABEL
    return img


def text_sheet(rows, wght):
    """Running text at 14 px, one block per family, enlarged 3x without smoothing."""
    blocks = []
    for name, path in rows:
        f = font_at(path, 14, wght)
        lines, cur = [], ''
        for word in PARAGRAPH.split():
            trial = f'{cur} {word}'.strip()
            if f.getlength(trial) > 560:
                lines.append(cur)
                cur = word
            else:
                cur = trial
        lines.append(cur)
        img = Image.new('L', (600, 22 + len(lines) * 21 + 12), PAPER)
        d = ImageDraw.Draw(img)
        d.text((8, 4), f'{name}  wght {wght}  14 px', font=ImageFont.load_default(size=11), fill=MUTED)
        for i, ln in enumerate(lines):
            d.text((8, 22 + i * 21), ln, font=f, fill=INK)
        blocks.append(img)
    out = Image.new('L', (600, sum(b.height for b in blocks)), PAPER)
    y = 0
    for b in blocks:
        out.paste(b, (0, y))
        y += b.height
    return out.resize((out.width * 3, out.height * 3), Image.NEAREST)


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    refs = argv[argv.index('--refs') + 1] if '--refs' in argv else None
    if refs in args:
        args.remove(refs)
    if len(args) != 1:
        print(__doc__)
        return 2
    out = args[0]
    os.makedirs(out, exist_ok=True)
    n = 0
    for italic in (False, True):
        rows = families(refs, italic)
        for w in WEIGHTS:
            for key, (text, size) in SAMPLES.items():
                sheet(rows, text, size, w).save(os.path.join(out, f'cmp_{"i" if italic else "u"}_w{w}_{key}.png'))
                n += 1
    for w in TEXT_WEIGHTS:
        text_sheet(families(refs, False), w).save(os.path.join(out, f'text14_w{w}.png'))
        n += 1
    print(f'{n} sheets in {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

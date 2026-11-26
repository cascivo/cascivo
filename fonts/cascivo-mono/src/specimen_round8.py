"""Round 8 sheets: python3 -I src/specimen_round8.py <before|after> [JetBrainsMono dir]; writes specimens/round8/<tag>-*.png.

code at 12/16/48 px in 400/700/900, punctuation and operators, disambiguation, cell balance (narrow vs wide letters in a grid)."""
import os
import sys
from PIL import Image, ImageDraw, ImageFont, features

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VF = os.path.join(ROOT, 'fonts', 'CascivoMono[opsz,wght].ttf')
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
TAG = sys.argv[1] if len(sys.argv) > 1 else 'after'
REF = sys.argv[2] if len(sys.argv) > 2 else None  # a directory with JetBrainsMono-<Style>.ttf statics
REF_STYLE = {400: 'Regular', 700: 'Bold', 900: 'ExtraBold'}
WEIGHTS = (400, 700, 900)


def face(path, size, wght=400, opsz=None):
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    try:
        names = [a['name'] for a in f.get_variation_axes()]
        z = min(48, max(8, size)) if opsz is None else opsz
        f.set_variation_by_axes([{b'Optical size': z, 'Optical size': z}.get(n, wght) for n in names])
    except OSError:
        pass
    return f


def fonts(w):
    yield 'Cascivo', VF
    if REF:
        p = os.path.join(REF, f'JetBrainsMono-{REF_STYLE[w]}.ttf')
        if os.path.exists(p):
            yield 'JetBrains', p


CODE = ['fn parse(s: &str) -> Result<i64, Err> {', '    let n = s.trim().len(); // 0O Il1|', '    if n != 0 && x >= 10 { return Ok(x); }',
        '    arr[i] = {a: 1, b: [2, 3]}; f(x);', '    x |= y << 2 ^ ~z % 3; a?.b ?? c;', '}']
PUNCT = ['=> != {} [] () ;: ., -> == <= >= :: && ||', '/* */ #! @ $ % ^ & * ~ ` " \' ? ! + - = < > _', 'a.b a,b a:b a;b a-b a+b a*b a/b a%b a=b']
DIS = ['0O0o O0O 00OO oo00', '1lI| l1Il |I1l Ill1', 'rn m rnm mrn corn com', 'g9q 5S 2Z 8B 6b cl d']
GRID = ['ilijftr.,', 'mwMWmwMW@', 'i.l,j:f;t', 'MiWlmjwfM', 'illi1Imw#', 'tirl{WMw}']


def sheet(name, rows, width=1500):
    h = sum(r[1] for r in rows) + 40
    img = Image.new('L', (width, h), 255)
    d = ImageDraw.Draw(img)
    y = 20
    for f, lh, s in rows:
        if f is not None:
            d.text((20, y), s, font=f, fill=0)
        y += lh
    img.save(os.path.join(ROOT, 'specimens', 'round8', f'{TAG}-{name}.png'))


label = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') else None
for px in (12, 16, 48):
    rows = []
    code = CODE if px < 48 else CODE[1:5]
    for w in WEIGHTS:
        for nm, path in fonts(w):
            rows.append((label, 18, f'{nm} {px}px {w}'))
            rows += [(face(path, px, w), round(px * 1.35), s) for s in code]
            rows.append((None, 8, ''))
    sheet(f'code{px}', rows, 820 if px == 12 else 1050 if px == 16 else 1500)
for name, lines, px in (('punct', PUNCT, 32), ('dis', DIS, 40)):
    rows = []
    for w in WEIGHTS:
        for nm, path in fonts(w):
            rows.append((label, 16, f'{nm} {w}'))
            rows += [(face(path, px, w), round(px * 1.3), s) for s in lines]
    sheet(name, rows, 1150)


def grid(tag_px=40):
    """Each glyph in its own cell, cells outlined: narrow letters lost / wide ones cramped shows at a glance."""
    cw = round(tag_px * 0.6)
    lh = round(tag_px * 1.3)
    rows_n = sum(1 + len(GRID) for w in WEIGHTS for _ in fonts(w))
    img = Image.new('L', (40 + cw * 9 * 2 + 40, 20 + rows_n * lh), 255)
    d = ImageDraw.Draw(img)
    y = 10
    for w in WEIGHTS:
        for nm, path in fonts(w):
            if label:
                d.text((20, y + lh - 18), f'{nm} {w}', font=label, fill=0)
            y += lh
            f = face(path, tag_px, w)
            for s in GRID:
                for i in range(len(s)):
                    x = 20 + i * cw * 2
                    d.rectangle((x, y, x + cw - 1, y + lh - 1), outline=200)
                # one run per row (a cell between letters): drawn a glyph at a time, Pillow's cache gave some glyphs another weight's
                d.text((20, y + round(tag_px * 0.05)), ' '.join(s), font=f, fill=0)
                y += lh
    img.save(os.path.join(ROOT, 'specimens', 'round8', f'{TAG}-grid.png'))


grid()

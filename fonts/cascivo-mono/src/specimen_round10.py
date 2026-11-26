"""Round 10 sheets: python3 -I src/specimen_round10.py <before|after> [JetBrainsMono dir] [--ink]; writes specimens/round10/<tag>-*.png.

code at 12/16/48 px in 100/400/700/900, then the disambiguation and operator set at 48 px. --ink prints each glyph's ink
(rasterized at 150 px) over JetBrains Mono's at the same weight: the numbers round 10's fixes were picked from."""
import os
import sys
from PIL import Image, ImageDraw, ImageFont, features

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VF = os.path.join(ROOT, 'fonts', 'CascivoMono[opsz,wght].ttf')
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
TAG = ARGS[0] if ARGS else 'after'
REF = ARGS[1] if len(ARGS) > 1 else None
REF_STYLE = {100: 'Thin', 400: 'Regular', 700: 'Bold', 900: 'ExtraBold'}
WEIGHTS = (100, 400, 700, 900)
OUT = os.path.join(ROOT, 'specimens', 'round10')


def face(path, size, wght=400):
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    try:
        names = [a['name'] for a in f.get_variation_axes()]
        z = min(48, max(8, size))
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
        '    arr[i] = {a: 1, b: [2, 3]}; f(x);', '    x |= y << 2 ^ ~z % 3; a?.b ?? c * `t`;', '}']
SET = ['0O 1lI il| {}[]()', '== != <= >= => -> :: && || ++ -- **', '~ * ` ^ # @ $ % & " \' ; : , .']
LABEL = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
label = ImageFont.truetype(LABEL, 12) if os.path.exists(LABEL) else None


def sheet(name, rows, width):
    img = Image.new('L', (width, sum(r[1] for r in rows) + 40), 255)
    d = ImageDraw.Draw(img)
    y = 20
    for f, lh, s in rows:
        if f is not None:
            d.text((20, y), s, font=f, fill=0)
        y += lh
    # 16 greys: the antialiasing reads the same and the sheets are a third the size in git
    img.quantize(16).save(os.path.join(OUT, f'{TAG}-{name}.png'), optimize=True)


def ink(path, w, ch, px=150):
    f = face(path, px, w)
    img = Image.new('L', (px * 2, px * 2), 0)
    ImageDraw.Draw(img).text((px // 2, px // 4), ch, font=f, fill=255)
    return sum(img.getdata()) / 255


if '--ink' in sys.argv and REF:
    chars = '~*`^#@$%&"\';:,.-+=<>!?|/\\_{}[]()0O1lIijfrtmwQA69ag'
    for w in WEIGHTS:
        ref = os.path.join(REF, f'JetBrainsMono-{REF_STYLE[w]}.ttf')
        print(w, ' '.join(f'{c}{ink(VF, w, c) / max(1, ink(ref, w, c)):.2f}' for c in chars))
    sys.exit()

os.makedirs(OUT, exist_ok=True)
for px in (12, 16, 48):
    rows = []
    code = CODE if px < 48 else CODE[1:5:3]
    for w in WEIGHTS if px < 48 else (400, 900):
        for nm, path in fonts(w):
            rows.append((label, 18, f'{nm} {px}px {w}'))
            rows += [(face(path, px, w), round(px * 1.35), s) for s in code]
            rows.append((None, 6, ''))
    sheet(f'code{px}', rows, {12: 760, 14: 880, 16: 1000, 48: 1500}[px])
rows = []
for w in WEIGHTS:
    for nm, path in fonts(w):
        rows.append((label, 16, f'{nm} 48px {w}'))
        rows += [(face(path, 48, w), 62, s) for s in SET]
sheet('set48', rows, 1100)
rows = []
for w in WEIGHTS:
    for nm, path in fonts(w):
        rows.append((label, 16, f'{nm} 96px {w}'))
        rows.append((face(path, 96, w), 120, '~1rtjf OQA690'))
sheet('glyphs96', rows, 900)

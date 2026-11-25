"""Round 7 sheets: python3 -I src/specimen_round7.py <before|after> [JetBrainsMono.ttf]; writes specimens/round7/<tag>-*.png."""
import os
import sys
from PIL import Image, ImageDraw, ImageFont, features

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VF = os.path.join(ROOT, 'fonts', 'CascivoMono[opsz,wght].ttf')
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
TAG = sys.argv[1] if len(sys.argv) > 1 else 'after'
REF = sys.argv[2] if len(sys.argv) > 2 else None


def face(path, size, wght=400):
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    try:
        names = [a['name'] for a in f.get_variation_axes()]
        f.set_variation_by_axes([{b'Optical size': 14, 'Optical size': 14}.get(n, wght) for n in names])
    except OSError:
        pass
    return f


CODE = ['fn parse(s: &str) -> Result<i64, Err> {', '    let n = s.trim().len(); // 0O Il1|', '    if n != 0 && x >= 10 { return Ok(x); }',
        '    arr[i] = {a: 1, b: [2, 3]}; f(x);', '}']
PUNCT = '=> != {} [] () ;: ., -> == <= >= :: && || /* */ #! @ $ % ^ & * ~ ` " \' ? !'
DIS = '0O0O 1lI|1lI| rn m cl d g9q 5S 2Z 8B ; : , .'
BOX = ['┌──────┬──────┐ ╔════╗ ╭──╮', '│ name │ size │ ║ ok ║ │▓▒│', '├──────┼──────┤ ╠════╣ ╰──╯', '│ a.rs │ 12kB │ ║ ░░ ║ ▁▃▅▇█', '└──────┴──────┘ ╚════╝ ━━┃━━']


def sheet(name, rows, width=1500):
    h = sum(r[1] for r in rows) + 40
    img = Image.new('L', (width, h), 255)
    d = ImageDraw.Draw(img)
    y = 20
    for f, lh, s in rows:
        if f is not None:
            d.text((20, y), s, font=f, fill=0)
        y += lh
    img.save(os.path.join(ROOT, 'specimens', 'round7', f'{TAG}-{name}.png'))


def fonts():
    yield 'Cascivo', VF
    if REF:
        yield 'JetBrains', REF


label = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') else None
for px in (13, 14, 20):
    rows = []
    for nm, path in fonts():
        rows.append((label, 18, f'{nm} {px}px 400'))
        rows += [(face(path, px), round(px * 1.4), s) for s in CODE]
        rows.append((None, 10, ''))
    sheet(f'code{px}', rows, 900 if px < 20 else 1300)
rows = []
for nm, path in fonts():
    for w in (100, 400, 700, 900):
        rows.append((label, 16, f'{nm} {w}'))
        rows.append((face(path, 28, w), 40, PUNCT))
        rows.append((face(path, 28, w), 40, DIS))
sheet('punct', rows, 1500)
rows = []
for nm, path in fonts():
    rows.append((label, 16, nm))
    rows += [(face(path, 24), 30, s) for s in BOX]
sheet('box', rows, 700)
rows = []
for nm, path in fonts():
    for w in (100, 200, 300, 400, 500, 600, 700, 800, 900):
        rows.append((face(path, 22, w), 32, f'{w} {nm}: const x = fn(a, b) => a != b; // 0O Il1'))
sheet('weights', rows, 1100)
rows = []
for nm, path in fonts():
    for w in (400, 900):
        rows.append((face(path, 72, w), 92, 'Rag{0Il1}=>;'))
sheet('zoom', rows, 900)

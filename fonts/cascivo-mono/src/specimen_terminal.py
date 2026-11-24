"""Render fonts/cascivo-mono/specimen-terminal.png: python3 -I fonts/cascivo-mono/src/specimen_terminal.py [REF.ttf ...]

A terminal at line-height 1 (each row is the font's ascent + descent, no gap): shell prompt, ls -l, code, a box-drawing TUI with
block bars and shades. Rows at 28 px (2x of 14 px) and a 14 px strip; optional reference fonts (JetBrains Mono, Plex Mono) under it.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont, features

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VF = os.path.join(ROOT, 'fonts', 'CascivoMono[opsz,wght].ttf')
LAYOUT = ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC
BG, FG, DIM, ACC, GRN = (24, 26, 31), (220, 223, 228), (128, 134, 145), (97, 175, 239), (152, 195, 121)

SCREEN = [
    (GRN, 'adam@cascivo ~/src/cascivo (main *+) $ ls -l fonts/'),
    (FG, 'drwxr-xr-x  5 adam staff   160 Nov 24 09:41 cascivo-mono'),
    (FG, '-rw-r--r--  1 adam staff 14080 Nov 24 09:12 README.md'),
    (ACC, 'const f = (a, b) => a !== b && *p++ <= 0x1F; // ~^`\'"'),
    (FG, 'if (x[i] == {0}) { return -1 + 2 * 3 / 4 % 5; }  O0 Il1| rnm'),
    (FG, '╭─ cpu ─────────────┬─ mem ──────────────╮ ┏━━━━┓ ╔══╦══╗'),
    (FG, '│ 0 ███████▋░░░ 52% │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▁▁ │ ┃bold┃ ║ok║ok║'),
    (FG, '│ 1 ████▎░░░░░░ 31% │ ░░░▒▒▒▓▓▓███▓▓▓▒▒▒ │ ┗━━━━┛ ╠══╬══╣'),
    (FG, '├───────────────────┼────────────────────┤ ┌┬┐├┼┤ ╚══╩══╝'),
    (FG, '╰───────────────────┴────────────────────╯ └┴┘╱╲╳ ▖▗▘▝▚▞▙'),
]
assert len({len(s) for _, s in SCREEN[5:]}) == 1


def face(path, size, wght=400):
    f = ImageFont.truetype(path, size, layout_engine=LAYOUT)
    try:
        axes = f.get_variation_axes()
        f.set_variation_by_axes([14 if b'ptical' in a['name'] or 'ptical' in str(a['name']) else wght for a in axes])
    except OSError:
        pass  # a static reference
    return f


def block(path, size, label, wght=400):
    f = face(path, size, wght)
    asc, desc = f.getmetrics()
    lh = asc + desc  # line-height 1
    w = int(f.getlength('M') * 64) + 40
    img = Image.new('RGB', (w, lh * (len(SCREEN) + 1) + 20), BG)
    d = ImageDraw.Draw(img)
    d.text((20, 6 + asc), label, font=face(path, max(12, size // 2), wght), fill=DIM, anchor='ls')
    for i, (c, s) in enumerate(SCREEN):
        d.text((20, 10 + lh * (i + 1) + asc), s, font=f, fill=c, anchor='ls')
    return img


def main(refs):
    parts = [block(VF, 28, 'Cascivo Mono 400, 28 px, line-height 1'), block(VF, 28, 'Cascivo Mono 700', 700),
             block(VF, 14, 'Cascivo Mono 400, 14 px')]
    parts += [block(r, 28, os.path.basename(r)) for r in refs if os.path.exists(r)]
    img = Image.new('RGB', (max(p.width for p in parts), sum(p.height for p in parts)), BG)
    y = 0
    for p in parts:
        img.paste(p, (0, y))
        y += p.height
    img.save(os.path.join(ROOT, 'specimen-terminal.png'), optimize=True)


if __name__ == '__main__':
    main(sys.argv[1:])

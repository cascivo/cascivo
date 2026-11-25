"""Rasterize the variable fonts with FreeType, hinted (the TrueType interpreter) and unhinted, to measure what
the hinting does at text sizes and to draw the before/after specimens.

    python3 -I src/hinting.py   # writes specimens/round6/hinting-before.png and hinting-after.png
"""
import ctypes
import io
import os

import freetype
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, '..', 'fonts')
SAMPLE = 'Hamburgefonstiv 0123 Own your stylesheet.'
SIZES = range(9, 17)

# (name, interpreter version, load target). 40 is FreeType's default (ClearType-style: it ignores
# horizontal moves, like DirectWrite); 35 is the full interpreter, as GDI runs it, in grey and in black-and-white.
MODES = (
    ('v40 grey', 40, freetype.FT_LOAD_TARGET_NORMAL),
    ('v35 grey', 35, freetype.FT_LOAD_TARGET_NORMAL),
    ('v35 mono', 35, freetype.FT_LOAD_TARGET_MONO),
)


def _interpreter(version):
    v = ctypes.c_uint(version)
    err = freetype.raw.FT_Property_Set(freetype.get_handle(), b'truetype', b'interpreter-version', ctypes.byref(v))
    if err:
        raise RuntimeError(f'FreeType refused interpreter-version {version}')


def font_bytes(path):
    """The sfnt data of a .ttf or .woff2 (FreeType here may be built without Brotli)."""
    if path.endswith('.woff2'):
        f = TTFont(path)
        f.flavor = None
        buf = io.BytesIO()
        f.save(buf)
        return buf.getvalue()
    with open(path, 'rb') as fh:
        return fh.read()


class Raster:
    """One face at one instance and size. `hinted` False renders the outlines as they are (what Windows does with
    an unhinted font); True runs the font's own instructions (never FreeType's autohinter)."""

    def __init__(self, data, wght, opsz, ppem, hinted, mode=MODES[0]):
        _, version, target = mode
        _interpreter(version)
        self.mono = target == freetype.FT_LOAD_TARGET_MONO
        self.face = freetype.Face(io.BytesIO(data))
        if wght is not None:  # None: a static font
            self.face.set_var_design_coords((wght, opsz))
        self.face.set_pixel_sizes(0, ppem)
        self.flags = (freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_AUTOHINT | target) if hinted else (freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
        if self.mono:
            self.flags |= freetype.FT_LOAD_MONOCHROME

    def glyph(self, ch):
        """(left, top, rows) of the rendered glyph: rows of coverage 0..1, top row first; plus its advance in pixels."""
        self.face.load_char(ch, self.flags)
        g = self.face.glyph
        b = g.bitmap
        rows = []
        for y in range(b.rows):
            line = b.buffer[y * b.pitch:(y + 1) * b.pitch]
            if self.mono:
                rows.append([float(line[x >> 3] >> (7 - (x & 7)) & 1) for x in range(b.width)])
            else:
                rows.append([v / 255 for v in line[:b.width]])
        return g.bitmap_left, g.bitmap_top, rows, g.advance.x / 64, g.linearHoriAdvance / 65536

    def outline_top(self, ch):
        """The glyph's top in pixels above the baseline, as hinting left it (unhinted: the exact scaled outline)."""
        self.face.load_char(ch, self.flags & ~freetype.FT_LOAD_RENDER)
        return self.face.glyph.metrics.horiBearingY / 64


def edges(rows, top):
    """(top row, bottom row) of the ink, in pixels above the baseline (the bottom row's lower edge is its value - 1)."""
    ink = [i for i, r in enumerate(rows) if any(v > 0.02 for v in r)]
    return top - ink[0], top - ink[-1]


def edge_crispness(rows):
    """How much of a flat edge's ink its last row carries, at the H's top and bottom: the row's coverage over a
    row through the stems alone (a quarter down). 1.0 is an edge on a pixel boundary; an edge halfway through
    a row leaves half its coverage there and a grey fringe."""
    ink = [i for i, r in enumerate(rows) if any(v > 0.02 for v in r)]
    ref = sum(rows[ink[0] + (ink[-1] - ink[0]) // 4])
    return min(sum(rows[ink[0]]), sum(rows[ink[-1]])) / ref


def alignment(data, wght, opsz, ppem, hinted, mode=MODES[0]):
    """Whether the round letters' tops and bottoms land on the flat letters' rows (overshoots add no row), and how
    crisp the H's flat ends are: (o top == x and n top, O top == H top, o O x H bottoms on one row, H crispness)."""
    r = Raster(data, wght, opsz, ppem, hinted, mode)
    e = {}
    for ch in 'xnoHO':
        _, top, rows, _, _ = r.glyph(ch)
        e[ch] = edges(rows, top)
        if ch == 'H':
            crisp = edge_crispness(rows)
    return e['o'][0] == e['x'][0] == e['n'][0], e['O'][0] == e['H'][0], e['o'][1] == e['O'][1] == e['x'][1] == e['H'][1], crisp


def render_line(data, wght, opsz, ppem, hinted, text=SAMPLE, mode=MODES[0]):
    """A line of text as rows of coverage (no kerning: the glyphs at their advances), height ppem * 1.4."""
    r = Raster(data, wght, opsz, ppem, hinted, mode)
    h = round(ppem * 1.4)
    base = round(ppem * 1.05)
    glyphs, x = [], 2
    for ch in text:
        left, top, rows, adv, _ = r.glyph(ch)
        glyphs.append((x + left, base - top, rows))
        x += adv
    w = int(x) + 4
    canvas = [[0.0] * w for _ in range(h)]
    for gx, gy, rows in glyphs:
        gx = int(round(gx))
        for j, row in enumerate(rows):
            for i, v in enumerate(row):
                if 0 <= gy + j < h and 0 <= gx + i < w:
                    canvas[gy + j][gx + i] = min(1.0, canvas[gy + j][gx + i] + v)
    return canvas


def specimen(path, hinted, out, scale=3):
    from PIL import Image, ImageDraw

    data = font_bytes(path)
    lines = []
    for wght, label in ((400, 'Regular'), (100, 'Thin'), (900, 'Black')):
        for ppem in SIZES:
            lines.append((f'{label} {ppem}px', render_line(data, wght, 14, ppem, hinted)))
    pad, label_w = 4, 76
    width = label_w + max(len(c[0]) for _, c in lines) + pad
    height = sum(len(c) for _, c in lines) + pad * 2
    img = Image.new('L', (width, height), 255)
    draw = ImageDraw.Draw(img)
    y = pad
    for label, canvas in lines:
        draw.text((2, y + len(canvas) // 2 - 5), label, fill=110)
        for j, row in enumerate(canvas):
            for i, v in enumerate(row):
                if v:
                    img.putpixel((label_w + i, y + j), round(255 * (1 - v)))
        y += len(canvas)
    img = img.resize((width * scale, height * scale), Image.NEAREST)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, optimize=True)


if __name__ == '__main__':
    vf = os.path.join(DIST, 'CascivoSans[opsz,wght].ttf')
    spec = os.path.join(HERE, '..', 'specimens', 'round6')
    specimen(vf, False, os.path.join(spec, 'hinting-before.png'))
    specimen(vf, True, os.path.join(spec, 'hinting-after.png'))

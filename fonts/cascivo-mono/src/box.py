"""Box drawing (U+2500-257F), block elements (U+2580-259F) and the Powerline arrows (U+E0B0-E0B3), drawn on the terminal cell.

The cell is the advance (600) by the line box (hhea ascent 1000 to descent -300): at line-height 1 a terminal stacks cells with no
gap, so lines and blocks reach the cell's edges. Lines run OVER units past the edges (JetBrains Mono's 20/100): a terminal rounds the
cell to whole pixels, and ink that stopped exactly at the edge left a hairline seam whenever the rounding went the other way. Blocks
and shades stop at the edges, or a shade's tile would overlap its neighbour's. Every master draws the same outlines: a box glyph
does not change with the weight (JetBrains Mono's and Fira Code's do not), so TUIs mixing Regular and Bold frames stay joined.
"""

import math
import unicodedata

from geom import L, arc, orient

W, ASC, DESC = 600, 1000, -300
CX, CY = W / 2, (ASC + DESC) / 2
OVER_X, OVER_Y = 20, 100
X0, X1, Y0, Y1 = -OVER_X, W + OVER_X, DESC - OVER_Y, ASC + OVER_Y
LIGHT, HEAVY, DOUBLE, GAP = 90, 180, 70, 110  # double lines: two DOUBLE-thick lines GAP either side of the centre
ARC_R = 240
DIRS = {'LEFT': 'L', 'RIGHT': 'R', 'UP': 'U', 'DOWN': 'D'}
AXES = {'HORIZONTAL': 'LR', 'VERTICAL': 'UD'}
STYLE = {'LIGHT': 1, 'SINGLE': 1, 'HEAVY': 2, 'DOUBLE': 3}
U = {'R': (1, 0), 'L': (-1, 0), 'U': (0, 1), 'D': (0, -1)}
OPP = {'L': 'R', 'R': 'L', 'U': 'D', 'D': 'U'}


def rect(x0, y0, x1, y1):
    x0, x1 = sorted((x0, x1))
    y0, y1 = sorted((y0, y1))
    pts = [(x0, y0), (x0, y1), (x1, y1), (x1, y0)]
    return orient([L(a, b) for a, b in zip(pts, pts[1:] + pts[:1])], outer=True)


def poly(pts):
    return orient([L(a, b) for a, b in zip(pts, pts[1:] + pts[:1])], outer=True)


def thick(s):
    return {1: LIGHT, 2: HEAVY, 3: DOUBLE}[s]


def offs(s):
    return (-GAP, GAP) if s == 3 else (0,)


def parse(name):
    """'BOX DRAWINGS DOWN LIGHT AND RIGHT HEAVY' -> {'D': 1, 'R': 2}; a part without a weight takes the previous part's."""
    arms, last = {}, 1
    for part in name.removeprefix('BOX DRAWINGS ').split(' AND '):
        words = part.split()
        w = next((STYLE[x] for x in words if x in STYLE), last)
        for x in words:
            for d in DIRS.get(x, '') or AXES.get(x, ''):
                arms[d] = w
        last = w
    return arms


def lines(arms):
    """Each arm's lines as rectangles. A line stops where it meets the perpendicular arm on its side (corners and T joins of double
    lines), runs through to the centre when the opposite arm continues it, and otherwise reaches the far line of the one perpendicular
    arm (an outer corner). Each stop runs on half the met line's thickness so the joint is square."""
    out = []
    for d, s in arms.items():
        ux, uy = U[d]
        horiz = ux != 0
        perp = ('U', 'D') if horiz else ('R', 'L')  # +v side first
        t = thick(s)
        for o in offs(s):
            side = perp[0] if o > 0 else perp[1] if o < 0 else None
            far = perp[1] if o > 0 else perp[0] if o < 0 else None
            if side and side in arms:
                e = max(offs(arms[side])) - thick(arms[side]) / 2
            elif OPP[d] in arms:
                e = 0.0
            elif o == 0 and all(q in arms for q in perp):
                e = min(max(offs(arms[q])) for q in perp) - max(thick(arms[q]) for q in perp) / 2
            elif o == 0 and any(q in arms for q in perp):
                q = next(q for q in perp if q in arms)
                e = -max(offs(arms[q])) - thick(arms[q]) / 2
            elif far and far in arms:
                e = -max(offs(arms[far])) - thick(arms[far]) / 2
            else:
                e = 0.0
            if horiz:
                out.append(rect(CX + ux * e, CY + o - t / 2, X1 if ux > 0 else X0, CY + o + t / 2))
            else:
                out.append(rect(CX + o - t / 2, CY + uy * e, CX + o + t / 2, Y1 if uy > 0 else Y0))
    return out


def dashes(n, s, horiz):
    t = thick(s)
    span = W if horiz else ASC - DESC
    period = span / n
    dash = period * 0.62
    out = []
    for i in range(n):
        a = i * period + (period - dash) / 2
        out.append(rect(a, CY - t / 2, a + dash, CY + t / 2) if horiz else rect(CX - t / 2, DESC + a, CX + t / 2, DESC + a + dash))
    return out


def arc_corner(hx, vy):
    """A quarter circle joining the vertical arm (vy: +1 up, -1 down) to the horizontal one (hx: +1 right, -1 left), drawn for down
    and right and mirrored."""
    t = LIGHT
    ox, oy = CX + ARC_R, CY - ARC_R  # centre of the down-and-right arc
    outer = arc(ox, oy, ARC_R + t / 2, ARC_R + t / 2, 180, 90, 0.5523)
    inner = arc(ox, oy, ARC_R - t / 2, ARC_R - t / 2, 90, 180, 0.5523)
    segs = [L((CX + t / 2, Y0), (CX - t / 2, Y0)), L((CX - t / 2, Y0), outer[0][1])] + outer
    segs += [L(outer[-1][-1], (X1, CY + t / 2)), L((X1, CY + t / 2), (X1, CY - t / 2)), L((X1, CY - t / 2), inner[0][1])] + inner
    segs.append(L(inner[-1][-1], (CX + t / 2, Y0)))
    fx = (lambda x: x) if hx > 0 else (lambda x: W - x)
    fy = (lambda y: y) if vy < 0 else (lambda y: ASC + DESC - y)
    segs = [(sg[0],) + tuple((fx(q[0]), fy(q[1])) for q in sg[1:]) for sg in segs]
    return [orient(segs, outer=True)]


def diag(rising):
    t = LIGHT * math.hypot(W, ASC - DESC) / (ASC - DESC)  # across the stroke LIGHT; measured horizontally a little more
    a, b = (0, DESC), (W, ASC)
    if not rising:
        a, b = (0, ASC), (W, DESC)
    return [poly([(a[0] - t / 2, a[1]), (a[0] + t / 2, a[1]), (b[0] + t / 2, b[1]), (b[0] - t / 2, b[1])])]


# ------------------------------------------------------------------------------------------------ blocks

H = ASC - DESC


def shade(level):
    """Light (1), medium (2) and dark (3) shade on a 8 x 16 grid of 75 x 81.25 tiles that repeats across cells: medium is a
    checkerboard, light fills one tile in four, dark is light's complement (whole rows plus the tiles light leaves)."""
    nx, ny = 8, 16
    tw, th = W / nx, H / ny
    out = []

    def tile(i, j, grow=0.0):
        return rect(i * tw, max(DESC, DESC + j * th - grow), (i + 1) * tw, min(ASC, DESC + (j + 1) * th + grow))

    for j in range(ny):
        if level == 2:
            out += [tile(i, j) for i in range(nx) if (i + j) % 2 == 0]
        elif level == 1:
            if j % 2 == 0:
                out += [tile(i, j) for i in range(nx) if i % 2 == (j // 2) % 2]
        else:
            if j % 2 == 1:
                out.append(rect(0, DESC + j * th, W, DESC + (j + 1) * th))
            else:
                # each tile runs a unit into the full rows either side: touching edges leave anti-aliasing seams
                out += [tile(i, j, 1.0) for i in range(nx) if i % 2 != (j // 2) % 2]
    return out


def quadrants(ul, ur, ll, lr):
    q = {'ul': (0, CY, CX, ASC), 'ur': (CX, CY, W, ASC), 'll': (0, DESC, CX, CY), 'lr': (CX, DESC, W, CY)}
    on = [k for k, v in zip(('ul', 'ur', 'll', 'lr'), (ul, ur, ll, lr)) if v]
    return [rect(*q[k]) for k in on]


def blocks():
    g = {0x2580: [rect(0, CY, W, ASC)], 0x2588: [rect(0, DESC, W, ASC)], 0x2590: [rect(CX, DESC, W, ASC)],
         0x2594: [rect(0, ASC - H / 8, W, ASC)], 0x2595: [rect(W - W / 8, DESC, W, ASC)]}
    for k in range(1, 8):  # lower one to seven eighths, left seven to one eighths
        g[0x2580 + k] = [rect(0, DESC, W, DESC + H * k / 8)]
        g[0x2588 + k] = [rect(0, DESC, W * (8 - k) / 8, ASC)]
    for k in (1, 2, 3):
        g[0x2590 + k] = shade(k)
    quad = {0x2596: '0010', 0x2597: '0001', 0x2598: '1000', 0x2599: '1011', 0x259A: '1001', 0x259B: '1110', 0x259C: '1101',
            0x259D: '0100', 0x259E: '0110', 0x259F: '0111'}
    for cp, bits in quad.items():
        g[cp] = quadrants(*(b == '1' for b in bits))
    return g


def powerline():
    t = LIGHT
    # the thin arrows' arms are LIGHT thick across; their tips reach the cell's edge like the solid ones
    k = t / 2 * math.hypot(W, H / 2) / W
    solid_r = [poly([(0, DESC), (W, CY), (0, ASC)])]
    thin_r = [poly([(0, DESC), (W, CY), (0, ASC), (0, ASC - 2 * k), (W - 2 * k * W / (H / 2), CY), (0, DESC + 2 * k)])]
    mirror = lambda cs: [orient([(sg[0],) + tuple((W - q[0], q[1]) for q in sg[1:]) for sg in c], outer=True) for c in cs]  # noqa: E731
    return {0xE0B0: solid_r, 0xE0B1: thin_r, 0xE0B2: mirror(solid_r), 0xE0B3: mirror(thin_r)}


def glyphs():
    """{codepoint: [contour]} for every cell glyph."""
    g = {}
    for cp in range(0x2500, 0x2580):
        name = unicodedata.name(chr(cp))
        if 'DASH' in name:
            n = next(v for k, v in (('DOUBLE', 2), ('TRIPLE', 3), ('QUADRUPLE', 4)) if f'{k} DASH' in name)
            g[cp] = dashes(n, 2 if 'HEAVY' in name else 1, 'HORIZONTAL' in name)
        elif 'ARC' in name:
            g[cp] = arc_corner(1 if 'RIGHT' in name else -1, 1 if 'UP' in name else -1)
        elif 'DIAGONAL' in name:
            g[cp] = (diag(True) if 'RIGHT TO LOWER LEFT' in name or 'CROSS' in name else []) + (
                diag(False) if 'LEFT TO LOWER RIGHT' in name or 'CROSS' in name else [])
        else:
            g[cp] = lines(parse(name))
    g.update(blocks())
    g.update(powerline())
    return g

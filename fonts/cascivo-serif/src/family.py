"""Cascivo Serif v1: Cascivo Sans's engine with higher contrast and bracketed serifs (fonts/PLAN-families.md).

Serifs are a post-process on the drawn strokes: every straight vertical stroke end at the baseline,
x-height, cap height, ascender or descender gets a slab plus a bracket fillet, as one raw contour.
Which ends get a serif, and on which sides, is decided once per glyph (the first master drawn) and
reused for every master, so the masters stay point-compatible; only the sizes vary with the weight.
"""

import unicodedata

from fontTools.agl import toUnicode

import family as _hook
from geom import C, L, arc, orient, seg_point

NAME = 'Cascivo Serif'
PS = 'CascivoSerif'
VERSION = '0.1.0'
ITALIC = False



def _pw(x, table):
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return table[0][1] if x < table[0][0] else table[-1][1]


BAR_SHARE = 0.6  # crossbars thin less than hairlines: thin bars open e, A, P, R counters past Source Serif's
WEDGE = 0.6  # share of the slab a lowercase head serif's tip drops: a wedge, not a flat slab
ROUND_DOT = 1.12  # a round dot's diameter over Sans's square dot: 1.12^2 x pi/4 keeps its ink (0.985)
CAP_REACH = 1.2  # capitals carry longer serifs, as in Source Serif (and it moves I's stem off l's at 11 px)


def tune(p):
    # contrast: hairlines thin faster than stems as the weight rises (Sans keeps 0.96 -> 0.72 of V)
    f = _pw(p.V, [(24, 0.84), (84, 0.62), (194, 0.48)])
    p.H *= f
    p.bar *= f ** BAR_SHARE
    # a little more white beside the serif tips
    p.S *= 1.04
    p.Sc *= 1.04


@_hook.override('l')
def _l(g, p):  # plain stem: the serifs make it an l, the Sans tail would fight the foot serif
    g.vstem(0, 0, p.asc)
    g.ht = 'a'
    g.sb = (0.8, 1.0)  # the stem sits left of I's (score's I/l test at 11-12 px)


@_hook.override('I')
def _I(g, p):
    g.vstem(0, 0, p.cap)
    g.ht = 'c'


def _sizes(p):
    """(outer reach, inner reach, slab, bracket height factor). Outer serifs set the advance, so their reach keeps the
    v1 slope change at Regular (0.19 / stem unit; a sharper bend shows as an advance kink at 400, score's wstep row).
    Inner serifs share a counter (Black's n counter is 145): capped so two leave it about 30."""
    outer = _pw(p.V, [(20, 43), (84, 62), (194, 74)])
    inner = min(outer, _pw(p.V, [(20, 43), (84, 62), (194, 57)]))
    return outer, inner, max(12.0, p.H * 0.95), 0.9


def _half(s, p):
    if s.w is not None:
        return s.w / 2
    v = s.pen[0] if s.pen else p.V
    return v * s.ws / 2


def _is_dot(s):
    """The engine draws a dot (period, colon, i's tittle, the foot of ! and ?) as one short vertical stroke as wide as it is
    tall (Glyph.dot): from the baseline it read as a stem foot and took a slab and brackets."""
    if s.w is None or len(s.segs) != 1 or s.segs[0][0] != 'L':
        return False
    (x0, y0), (x1, y1) = s.segs[0][1], s.segs[0][2]
    return abs(x0 - x1) < 0.5 and abs(y1 - y0) <= s.w * 1.05 + 1


def _serifed(name):
    """Letters and digits only: a straight quote, | ¦ ¶ or the stem of ! is a vertical stroke on a metric too, and a slab
    there reads as a misdrawn letter."""
    u = toUnicode(name.split('.')[0])
    return len(u) == 1 and unicodedata.category(u)[0] in 'LN'


def _ends(g, p):
    """(stroke, end, kind) for every straight vertical open-stroke end lying on a vertical metric."""
    tol = 3.0
    lines = {'base': 0, 'desc': p.desc, 'xh': p.xh, 'cap': p.cap, 'asc': p.asc}
    out = []
    for i, s in enumerate(g.strokes):
        if s.closed or not s.segs or _is_dot(s):
            continue
        for end, seg in ((0, s.segs[0]), (1, s.segs[-1])):
            if seg[0] != 'L' or (s.taper[end] != 1.0):
                continue
            a, b = (seg[1], seg[2]) if end == 1 else (seg[2], seg[1])  # a: the other end, b: this end
            if abs(a[0] - b[0]) > 0.5 or abs(a[1] - b[1]) < 40:
                continue
            for kind, y in lines.items():
                if abs(b[1] - y) <= tol:
                    up = a[1] > b[1]  # stroke rises from this end: a foot
                    if up == (kind in ('base', 'desc')):
                        out.append((i, end, kind))
                    break
    return out


def _blocked(g, p, i, cx, hw, Y, d, side, reach, depth):
    """True when another stroke already covers the serif zone on that side (a bar or bowl leaving the stem)."""
    x0, x1 = (cx + hw, cx + hw + reach) if side > 0 else (cx - hw - reach, cx - hw)
    pad = max(p.H, p.bar) * 0.6 + 2
    ya, yb = sorted((Y - d * pad, Y + d * (depth + pad)))
    for j, s in enumerate(g.strokes):
        if j == i:
            continue
        for seg in s.segs:
            for k in range(11):
                q = seg_point(seg, k / 10) if seg[0] != 'L' else (seg[1][0] + (seg[2][0] - seg[1][0]) * k / 10, seg[1][1] + (seg[2][1] - seg[1][1]) * k / 10)
                if x0 - 1 <= q[0] <= x1 + 1 and ya <= q[1] <= yb:
                    return True
    return False


_PLAN = {}
_DOTS = {}


def _plan(g, p, name):
    reach, _, t, bf = _sizes(p)
    B = reach * bf
    plan = []
    is_cap = name[:1].isupper()
    xmin = min((q[0] for s in g.strokes for seg in s.segs for q in seg[1:]), default=0)
    xmax = max((q[0] for s in g.strokes for seg in s.segs for q in seg[1:]), default=0)
    for i, end, kind in _ends(g, p):
        s = g.strokes[i]
        seg = s.segs[0] if end == 0 else s.segs[-1]
        b = seg[1] if end == 0 else seg[2]
        cx, hw = b[0], _half(s, p)
        d = 1 if kind in ('base', 'desc') else -1
        sides = []
        for side in (-1, 1):
            if not is_cap and d < 0 and side > 0:
                continue  # lowercase head serifs point left only
            if not is_cap and kind == 'xh' and cx - hw > xmin + 1:
                continue  # an x-height top inside the letter (q, d, u's right stem) joins a bowl
            if not _blocked(g, p, i, cx, hw, b[1], d, side, reach, t + B):
                outer = cx - hw <= xmin + 1 if side < 0 else cx + hw >= xmax - 1
                sides.append((side, outer))
        if sides:
            plan.append((i, end, kind, tuple(sides)))
    return plan


def _serif(cx, hw, Y, d, rl, rr, t, bf, wedge=0.0):
    """Slab plus bracket on one stem end; rl / rr: reach left / right (0: no serif on that side). The bracket is a
    concave fillet from the stem (bf x reach above the slab) to 0.6 x reach out along the slab top."""
    P = lambda x, y: (x, Y + d * y)  # noqa: E731
    xl, xr = cx - hw - rl, cx + hw + rr
    B = max(rl, rr) * bf  # one bracket height for both sides: the contour's points stay the same in every master
    c = [L(P(xl, wedge), P(xr, 0))]  # wedge: the left tip drops below the stem top (a lowercase head serif)
    if rr:
        xs = cx + hw + rr * 0.6
        c += [L(P(xr, 0), P(xr, t)), L(P(xr, t), P(xs, t)), C(P(xs, t), P(cx + hw + rr * 0.2, t), P(cx + hw, t + B * 0.35), P(cx + hw, t + B))]
    else:
        c += [L(P(xr, 0), P(xr, t + B))]
    c += [L(P(cx + hw, t + B), P(cx - hw, t + B))]
    if rl:
        xs = cx - hw - rl * 0.6
        c += [C(P(cx - hw, t + B), P(cx - hw, t + B * 0.35), P(cx - hw - rl * 0.2, t), P(xs, t)), L(P(xs, t), P(xl, t)), L(P(xl, t), P(xl, wedge))]
    else:
        c += [L(P(xl, t + B), P(xl, 0))]
    return orient(c, outer=True)


def _round_dot(s):
    (x, y0), (_, y1) = s.segs[0][1], s.segs[0][2]
    r = s.w / 2 * ROUND_DOT
    return orient(arc(x, (y0 + y1) / 2, r, r, 90, 450), outer=True)


def glyph(g, p, name):
    # Sans's dots are squares; a serif's are round (Source Serif's), in punctuation, the i j tittles and the accents alike
    # (decided at the first master, like _PLAN: zero.dot's dot is square at some weights only, and masters must stay compatible)
    if name not in _DOTS:
        _DOTS[name] = {i for i, s in enumerate(g.strokes) if _is_dot(s)}
    dots = [s for i, s in enumerate(g.strokes) if i in _DOTS[name]]
    g.strokes = [s for i, s in enumerate(g.strokes) if i not in _DOTS[name]]
    g.raw += [_round_dot(s) for s in dots]
    if g.mark or g.tab or g.adv_fixed is not None or not g.strokes or not _serifed(name):
        return
    if name not in _PLAN:
        _PLAN[name] = _plan(g, p, name)
    outer, inner, t, bf = _sizes(p)
    k = CAP_REACH if name[:1].isupper() else 1.0
    tuck = set()
    for i, end, kind, sides in _PLAN[name]:
        s = g.strokes[i]
        seg = s.segs[0] if end == 0 else s.segs[-1]
        b = seg[1] if end == 0 else seg[2]
        r = {side: k * (outer if out else inner) for side, out in sides}
        tuck.update(side for side, out in sides if out)
        d = 1 if kind in ('base', 'desc') else -1
        wedge = t * WEDGE if d < 0 and k == 1.0 and -1 in r else 0.0
        g.raw.append(_serif(b[0], _half(s, p), b[1], d, r.get(-1, 0), r.get(1, 0), t, bf, wedge))
    if tuck and not name[:1].isupper():
        # An outer serif widens the ink, so the stem would sit a reach further from its neighbour: heavy lowercase set
        # loose (nn 1.29 gap/counter at 900, Source Serif 1.14). Part of the reach is taken back from the sidebearing.
        d = _pw(p.V, [(20, 0), (84, 10), (194, 24)]) / p.S
        g.sb = (g.sb[0] - d * (-1 in tuck), g.sb[1] - d * (1 in tuck))

"""Cascivo Serif v1: Cascivo Sans's engine with higher contrast and bracketed serifs (fonts/PLAN-families.md).

Serifs are a post-process on the drawn strokes: every straight vertical stroke end at the baseline,
x-height, cap height, ascender or descender gets a slab plus a bracket fillet, as one raw contour.
Which ends get a serif, and on which sides, is decided once per glyph (the first master drawn) and
reused for every master, so the masters stay point-compatible; only the sizes vary with the weight.
"""

import family as _hook
from geom import C, L, orient, seg_point

NAME = 'Cascivo Serif'
PS = 'CascivoSerif'
VERSION = '0.1.0'
ITALIC = False



def _pw(x, table):
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return table[0][1] if x < table[0][0] else table[-1][1]


def tune(p):
    # contrast: hairlines thin faster than stems as the weight rises (Sans keeps 0.96 -> 0.72 of V)
    f = _pw(p.V, [(24, 0.84), (84, 0.70), (194, 0.60)])
    p.H *= f
    p.bar *= f
    # a little more white beside the serif tips
    p.S *= 1.04
    p.Sc *= 1.04


@_hook.override('l')
def _l(g, p):  # plain stem: the serifs make it an l, the Sans tail would fight the foot serif
    g.vstem(0, 0, p.asc)
    g.ht = 'a'


@_hook.override('I')
def _I(g, p):
    g.vstem(0, 0, p.cap)
    g.ht = 'c'


def _sizes(p):
    reach = _pw(p.V, [(20, 30), (84, 48), (194, 58)])  # Black's n counter is 145: two inner serifs leave it 29
    t = max(12.0, p.H * 0.8)
    return reach, t, reach * 0.8


def _half(s, p):
    if s.w is not None:
        return s.w / 2
    v = s.pen[0] if s.pen else p.V
    return v * s.ws / 2


def _ends(g, p):
    """(stroke, end, kind) for every straight vertical open-stroke end lying on a vertical metric."""
    tol = 3.0
    lines = {'base': 0, 'desc': p.desc, 'xh': p.xh, 'cap': p.cap, 'asc': p.asc}
    out = []
    for i, s in enumerate(g.strokes):
        if s.closed or not s.segs:
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


def _plan(g, p, name):
    reach, t, B = _sizes(p)
    plan = []
    is_cap = name[:1].isupper()
    xmin = min((q[0] for s in g.strokes for seg in s.segs for q in seg[1:]), default=0)
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
                sides.append(side)
        if sides:
            plan.append((i, end, kind, tuple(sides)))
    return plan


def _serif(cx, hw, Y, d, sides, reach, t, B):
    left, right = -1 in sides, 1 in sides
    P = lambda x, y: (x, Y + d * y)  # noqa: E731
    xl = cx - hw - (reach if left else 0)
    xr = cx + hw + (reach if right else 0)
    c = [L(P(xl, 0), P(xr, 0))]
    if right:
        xs = cx + hw + reach * 0.55
        c += [L(P(xr, 0), P(xr, t)), L(P(xr, t), P(xs, t)), C(P(xs, t), P(cx + hw + reach * 0.22, t), P(cx + hw, t + B * 0.4), P(cx + hw, t + B))]
    else:
        c += [L(P(xr, 0), P(xr, t + B))]
    c += [L(P(cx + hw, t + B), P(cx - hw, t + B))]
    if left:
        xs = cx - hw - reach * 0.55
        c += [C(P(cx - hw, t + B), P(cx - hw, t + B * 0.4), P(cx - hw - reach * 0.22, t), P(xs, t)), L(P(xs, t), P(xl, t)), L(P(xl, t), P(xl, 0))]
    else:
        c += [L(P(xl, t + B), P(xl, 0))]
    return orient(c, outer=True)


def glyph(g, p, name):
    if g.mark or g.tab or g.adv_fixed is not None or not g.strokes:
        return
    if name not in _PLAN:
        _PLAN[name] = _plan(g, p, name)
    reach, t, B = _sizes(p)
    for i, end, kind, sides in _PLAN[name]:
        s = g.strokes[i]
        seg = s.segs[0] if end == 0 else s.segs[-1]
        b = seg[1] if end == 0 else seg[2]
        g.raw.append(_serif(b[0], _half(s, p), b[1], 1 if kind in ('base', 'desc') else -1, sides, reach, t, B))

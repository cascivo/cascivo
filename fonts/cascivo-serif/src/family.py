"""Cascivo Serif v1: Cascivo Sans's engine with higher contrast and bracketed serifs (fonts/PLAN-families.md).

Serifs are a post-process on the drawn strokes: every straight vertical stroke end at the baseline,
x-height, cap height, ascender or descender gets a slab plus a bracket fillet, as one raw contour.
Which ends get a serif, and on which sides, is decided once per glyph (the first master drawn) and
reused for every master, so the masters stay point-compatible; only the sizes vary with the weight.
"""

import unicodedata

from fontTools.agl import toUnicode

import family as _hook
from geom import C, L, _open_sides, arc, orient, seg_point
import glyphs as _G
from glyphs import term_taper

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
SLAB, BRACKET = 1.12, 1.1  # round 4: slab over the hairline and bracket height over the reach (0.95, 0.9 until round 3): at 14-18 px the
# thinner serifs and short fillets faded into the stems and text read as a sans beside Source Serif
CAP_REACH = 1.2  # capitals carry longer serifs, as in Source Serif (and it moves I's stem off l's at 11 px)


SB_K = [(24, 1.01), (84, 1.0), (194, 0.95)]  # sidebearing factor on Sans's
CAP_SB_K = 0.95  # capitals' sidebearings, on top of SB_K
CAP_H_K = [(24, 0.96), (84, 0.94), (194, 0.83)]  # straight capitals' counter (H E N B ...)
CAP_ROUND_K = [(24, 0.97), (84, 0.96), (194, 0.91)]  # round and diagonal capitals' (O C G S A V ...)
LC_K = [(24, 0.99), (84, 0.98), (194, 0.93)]  # n's counter, which the lowercase follows


def tune(p):
    # contrast: hairlines thin faster than stems as the weight rises (Sans keeps 0.96 -> 0.72 of V)
    f = _pw(p.V, [(24, 0.84), (84, 0.62), (194, 0.48)])
    p.H *= f
    p.bar *= f ** BAR_SHARE
    # a little more white beside the serif tips (round 6: less at Black, whose lowercase set 1.06x Source Serif 4's)
    p.S *= _pw(p.V, SB_K)
    p.Sc *= _pw(p.V, SB_K) * CAP_SB_K
    # Round 6: Sans widths under serifs set wide against Source Serif 4: capitals 1.08x (Regular) to 1.17x (Black), rounds
    # 1.07-1.11x, lowercase 1.02-1.06x. Counters narrow, most at Black where the slabs add the most width.
    p.cH *= _pw(p.V, CAP_H_K)
    p.cHd *= _pw(p.V, CAP_ROUND_K)
    p.cn *= _pw(p.V, LC_K)
    # Round overshoot keeps growing past Regular, as Source Serif's (o 12 / 12 / 15, O 15 / 16 / 19 units at 200 / 400 / 800);
    # Sans holds 13.4 from Regular up, so Bold's rounds and the serifed x stood level at the x-height
    p.ov = _pw(p.V, [(24, 11.5), (84, 13.4), (194, 16.5)])


@_hook.override('l')
def _l(g, p):  # plain stem: the serifs make it an l, the Sans tail would fight the foot serif
    g.vstem(0, 0, p.asc)
    g.ht = 'a'
    g.sb = (0.8, 1.0)  # the stem sits left of I's (score's I/l test at 11-12 px)


@_hook.override('I')
def _I(g, p):
    g.vstem(0, 0, p.cap)
    g.ht = 'c'


# Round 6: C G c top terminals. The Sans C ran on to where its stroke falls near vertical and was cut flat ('h'); the serif pass hung a
# thin barb under that flat face, so the top read as a claw curling into the counter. Source Serif's (and Merriweather's) C stops
# while the stroke still runs out to the right and drops a heavy beak with a vertical outer face. Here: the arm stops VBEAK_OPEN
# degrees earlier, and _vbeak hangs a bracketed wedge from the end face, its outer side vertical, its tip at VBEAK_TIP of the height.
VBEAK = {'C': 0.64, 'G': 0.66, 'c': 0.62}  # the beak tip's height, as a share of cap height (C G) or x-height (c)
VBEAK_OPEN = 16  # degrees the top arm stops short of the Sans terminal
VBEAK_TIP = 0.5  # the beak tip's width over the stem
VBEAK_FOOT = 0.3  # C's lower end: a short upward spur (Merriweather's, Source Serif's hint of one), its rise over the top beak's drop


@_hook.override('C')
def _C(g, p):
    w = p.Hd * (1.12 + (0.07 + _G.C_BLACK) * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    a0 = 22 + p.ap - _G.TERM_RUN * p.heavy + VBEAK_OPEN
    g.stroke(g.arc(cx, cy, rx, ry, a0, 270) + g.arc(cx, cy, rx, ry, 270, 338 - p.ap + _G.TERM_RUN * p.heavy, p.k), caps=('b', 'b'), cut='v')
    g.ht = 'c'
    g.sb = (0.62, 0.45)


@_hook.override('G')
def _Gcap(g, p):
    w = p.Hd * (1.12 + _G.G_BLACK * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    k = p.k + _G.G_SPUR * p.heavy
    g.stroke(g.arc(cx, cy, rx, ry, 22 + p.ap + VBEAK_OPEN, 270) + g.arc(cx, cy, rx, ry, 270, 360, k=k), caps=('b', 'h'), cut='v')
    g.hbar(cx + rx * 0.08, cx + rx, cy - p.H, w=p.H)
    g.ht = 'c'
    g.sb = (0.62, 0.8)


@_hook.override('c')
def _clow(g, p):
    w = p.nw * (1.04 - 0.02 * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 30 + p.ap - _G.C_RUN * p.heavy + VBEAK_OPEN, 330 - p.ap + _G.C_RUN * p.heavy), caps=('b', 'b'), cut='t', tilt=_G.C_TILT, turn=p.face)
    g.sb = (0.62, 0.42)


def _side_pts(side, end, n=24):
    """Points along an open side, starting at the given end (0: the stroke's start, 1: its end)."""
    segs = side if end == 0 else [(sg[0],) + tuple(reversed(sg[1:])) for sg in reversed(side)]
    return [seg_point(sg, i / n) for sg in segs for i in range(n)]


# Round 6: a double-storey g. The Sans's single-storey g with a slab under its stem was the loudest sans tell in running text (critique,
# "agree", "legible"). Source Serif's: a small upper bowl, an ear flagged out to the right at the x-height, a short link, and a wide
# lower loop below the baseline whose top is a hairline near the baseline.
G2 = dict(bowl=(0.04, 0.74, 0.34), loop=(0.0, 0.94, 0.1), ear=(0.6, 1.0), link=0.3)  # x shares of w, y shares of the x-height


FIGS = {'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'}


@_hook.override('g')
def _g2(g, p):
    w = p.nw * 1.0
    V, H = p.V, p.H
    bx0, bx1, by0 = G2['bowl']
    lx0, lx1, ly1 = G2['loop']
    g.oval(bx0 * w, by0 * p.xh, bx1 * w, p.xh + p.ov, V=V * 0.92)
    g.oval(lx0 * w, p.desc - p.ov, lx1 * w, ly1 * p.xh + H, V=V * 0.85)
    # the link: from the bowl's foot down and left onto the loop's top, a hairline swelling a little
    lk = G2['link'] * w
    g.stroke([C((lk + V * 0.4, by0 * p.xh + H * 0.5), (lk - V * 0.1, by0 * p.xh - H), (lk - V * 0.2, ly1 * p.xh + H * 2.2), (lk - V * 0.6, ly1 * p.xh + H * 0.5))], w=H * 1.5, caps=('b', 'b'))
    ex0, ex1 = G2['ear']
    g.hbar(ex0 * w, ex1 * w, p.xh - H * 1.25, h=H * 1.25)
    g.sb = (0.62, 0.45)


def _vbeak(g, p, s, end, tip_y, wt, run, rise=None):
    """A beak on a curved terminal: from the end face's outer corner a vertical outer side runs to tip_y, a tip wt wide, then a
    concave bracket back into the stroke's inner side, which it meets run units in from the face (x). The outer side being
    vertical is what makes it a beak, not a barb: the engine's face is square to the stroke at light weights and a long
    diagonal at Black, and the wedge covers the corner between that face and the vertical."""
    left, right = _open_sides(s, p.V, p.H)
    f1, f2 = (left[0][1], right[0][1]) if end == 0 else (left[-1][-1], right[-1][-1])
    xs = [q[0] for o in g.strokes for sg in o.segs for q in sg[1:]]
    ys = [q[1] for o in g.strokes for sg in o.segs for q in sg[1:]]
    mx, my = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    d2 = lambda q: (q[0] - mx) ** 2 + (q[1] - my) ** 2
    (o, i, inn_side) = (f1, f2, right) if d2(f1) > d2(f2) else (f2, f1, left)
    xo, yo = max(f1[0], f2[0]), o[1]
    if rise is not None:  # a spur standing rise units off the outer corner instead of reaching a set height
        tip_y = yo + rise
    dy = 1 if tip_y > yo else -1
    tip_y = dy * max(dy * tip_y, dy * i[1] + 0.3 * wt)  # the tip clears the face's inner corner: else that corner pokes out
    tx = min(xo - wt, i[0] - 0.1 * wt)  # the bracket starts left of the inner corner, so the corner stays inside the beak
    pts = _side_pts(inn_side, end)
    # J: run units in from the face, but short of the inner side's extreme (c's narrow counter: past it the bracket crossed
    # the closing edge and the wedge's winding cut a hole)
    peak = next((n - 4 for n in range(1, len(pts)) if dy * (pts[n][1] - pts[n - 1][1]) > 0), len(pts) - 1)
    k = min(peak, next((n for n, q in enumerate(pts) if q[0] <= tx - run + wt), len(pts) - 1))
    j, jb = pts[k], pts[max(k - 1, 0)]
    tn = ((jb[0] - j[0]) ** 2 + (jb[1] - j[1]) ** 2) ** 0.5 or 1.0
    span = ((j[0] - tx) ** 2 + (j[1] - tip_y) ** 2) ** 0.5
    c2 = (j[0] + (jb[0] - j[0]) / tn * span * 0.4, j[1] + (jb[1] - j[1]) / tn * span * 0.4)  # leaves the inner side along it: no kink
    seg = s.segs[0] if end == 0 else s.segs[-1]
    _, (ux, uy) = _tangent(seg, end)
    m = ((f1[0] + f2[0]) / 2 - ux * p.H * 0.6, (f1[1] + f2[1]) / 2 - uy * p.H * 0.6)  # closes through the stroke, not along its face
    c = [L((xo, yo), (xo, tip_y)), L((xo, tip_y), (tx, tip_y)),
         C((tx, tip_y), (tx, tip_y - dy * 0.5 * abs(j[1] - tip_y)), c2, j),
         L(j, m), L(m, (xo, yo))]
    return orient(c, outer=True)


def _sizes(p):
    """(outer reach, inner reach, slab, bracket height factor). Outer serifs set the advance, so their reach keeps the
    v1 slope change at Regular (0.19 / stem unit; a sharper bend shows as an advance kink at 400, score's wstep row).
    Inner serifs share a counter (Black's n counter is 145): capped so two leave it about 30."""
    # Round 4: Thin's slab floor 12 -> 16 (its arm wedges 14): on a 24-unit stem the old serifs faded and Thin read as a sans. The
    # reach stays: a longer one at Thin moved the advances' bend off Regular (wstep row at 400)
    outer = _pw(p.V, [(20, 43), (84, 62), (194, 74)])
    inner = min(outer, _pw(p.V, [(20, 43), (84, 62), (194, 57)]))
    return outer, inner, max(16.0, p.H * SLAB), BRACKET


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


# Round 4: diagonals and arms. v1-3 serifed only vertical stems, so at 400 a headline (v w y, A V W) read as a sans with feet.
DIAG_OUTER, DIAG_INNER = 0.9, 0.7  # a diagonal's slab reach over a stem's: the outer side longer, as Source Serif's V and v
DIAG_TAKE = 0.75  # share of the outer slabs' added width a diagonal letter's skeleton gives back: the serifs reach out,
# the strokes stand steeper inside them (Source Serif's A V are 712 / 709 at 400; unsqueezed they set 771 / 754)
DIAG_LEAN = 0.35  # the obtuse side's bracket height over the acute side's: the stroke already leans out over it
SPUR_LEN = 1.25  # an arm serif's length past the bar, over the stem serif's reach (Source Serif E: ~80 units at Regular)
SPUR_TIP, SPUR_BASE = 0.42, 0.55
SPUR_SB = 0.25  # share of the spur's base width its side's sidebearing gains (split over the glyph's spurs)  # its width at the tip (x stem) and the extra at the bar (x reach): a bracketed wedge


def _metric(p, y, tol=3.0):
    for kind, v in (('base', 0), ('desc', p.desc), ('xh', p.xh), ('cap', p.cap), ('asc', p.asc)):
        if abs(y - v) <= tol:
            return kind
    return None


def _diag_hw(g, s, a, b):
    return g.hw(a[0] - b[0], a[1] - b[1], s.ws, s.w)


def _diag_ends(g, p):
    """(stroke, end, kind, side of the glyph) for every free straight diagonal end cut along a metric line: v w y x tops,
    A K X feet. An end another stroke also ends beside (V's foot, A's apex, M and N's corners) is a vertex, not a terminal."""
    ends = [(i, e, (s.segs[0][1] if e == 0 else s.segs[-1][-1])) for i, s in enumerate(g.strokes)
            if not s.closed and s.segs and not _is_dot(s) for e in (0, 1)]
    xs = [q[0] for s in g.strokes for seg in s.segs for q in seg[1:]]
    mid = (min(xs) + max(xs)) / 2 if xs else 0
    out = []
    for i, end, b in ends:
        s = g.strokes[i]
        seg = s.segs[0] if end == 0 else s.segs[-1]
        if seg[0] != 'L' or s.caps[end] != 'h' or s.taper[end] != 1.0:
            continue
        a = seg[2] if end == 0 else seg[1]
        if abs(a[0] - b[0]) <= 0.5 or abs(a[1] - b[1]) < 40:
            continue
        kind = _metric(p, b[1])
        if kind is None or (a[1] > b[1]) != (kind in ('base', 'desc')):
            continue
        if any(j != i and abs(q[1] - b[1]) < 6 and abs(q[0] - b[0]) < 1.6 * p.V for j, _, q in ends):
            continue
        out.append((i, end, kind, -1 if b[0] < mid else 1))
    return out


def _top(g):
    ys = [q[1] for o in g.strokes for seg in o.segs for q in seg[1:]] + [q[1] for c in g.raw for seg in c for q in seg[1:]]
    return max(ys, default=0)


def _arm_ends(g, p):
    """(stroke, end, d) for every free end of a straight horizontal bar on the cap height, x-height or baseline (E F L T Z z, Cyrillic
    Г Т Е): d = -1, the spur hangs down from a top arm; +1, it stands up from a foot."""
    out = []
    for i, s in enumerate(g.strokes):
        if s.closed or len(s.segs) != 1 or s.segs[0][0] != 'L' or _is_dot(s):
            continue
        (x0, y0), (x1, y1) = s.segs[0][1], s.segs[0][2]
        if abs(y0 - y1) > 0.5 or abs(x1 - x0) < p.V:
            continue
        h = s.w if s.w is not None else (s.pen[1] if s.pen else p.H)
        top = _metric(p, y0 + h / 2, 4)
        if top == 'cap' or (top == 'xh' and _top(g) < p.xh + 5):
            d = -1  # an x-height bar takes one only as z's top: t's and f's crossbars are not arms
        elif _metric(p, y0 - h / 2, 4) == 'base':
            d = 1
        else:
            continue
        for end, (xe, ye) in ((0, (x0, y0)), (1, (x1, y1))):
            busy = False
            for j, o in enumerate(g.strokes):
                if j == i:
                    continue
                for seg in o.segs:
                    for k in range(11):
                        q = seg_point(seg, k / 10) if seg[0] != 'L' else (seg[1][0] + (seg[2][0] - seg[1][0]) * k / 10, seg[1][1] + (seg[2][1] - seg[1][1]) * k / 10)
                        if abs(q[0] - xe) < p.V * 1.1 and abs(q[1] - ye) < p.V * 1.1:
                            busy = True
            if not busy:
                out.append((i, end, d, 1 if xe > min(x0, x1) else -1, h))
    return out


def _squeeze(g, f, xc):
    """Scale a glyph's skeleton horizontally about xc (strokes and x anchors; the pen, so the stroke weights, unchanged)."""
    X = lambda x: xc + (x - xc) * f  # noqa: E731
    for s in g.strokes:
        s.segs = [(seg[0],) + tuple((X(q[0]), q[1]) for q in seg[1:]) for seg in s.segs]
    for k, v in list(g.anchors.items()):
        if isinstance(v, (int, float)) and k.endswith('_x'):
            g.anchors[k] = X(v)
        elif isinstance(v, tuple) and len(v) == 2:
            g.anchors[k] = (X(v[0]), v[1])


# Round 4: curved terminals. Sans ends C G S c s on a near-horizontal cut and a r f on a plain stroke end; Source Serif barbs the
# first (a vertical serif along the outer side) and balls the second.
BEAK_TOP = {'S', 's', 'uni0421', 'uni0441', 'uni0404', 'uni0454'}
BEAK_FOOT = {'S', 's'}
BALL = {'a', 'r', 'f', 'uni0430'}
BALL_TAIL = {'dotlessj', 'y', 'uni0443'}  # descender tails, balled as Source Serif's j and y
BEAK_LEN, BEAK_TIP = 1.15, 0.36  # beak length over the stem serif's reach, its tip width over the stem
BALL_BACK = 0.1  # how far the ball sits back along the stroke, in radii: further, it leaves the curve and stands out as a knob
BALL_R = [(24, 0.75), (84, 0.56), (194, 0.36)]  # a ball's radius over the stem (Source Serif's r: ~0.55 at 400, ~0.33 at 900)


def _tangent(seg, end):
    pt, q = (seg[1], seg[2]) if end == 0 else (seg[-1], seg[-2])
    dx, dy = pt[0] - q[0], pt[1] - q[1]
    n = (dx * dx + dy * dy) ** 0.5 or 1.0
    return pt, (dx / n, dy / n)  # pointing out of the stroke, past its end


def _terminals(g, name):
    """(kind, stroke, end): the curved open ends to beak or ball, chosen once per glyph like the stem plan."""
    out = []
    base = name.split('.')[0]
    for i, s in enumerate(g.strokes):
        if s.closed or not s.segs or _is_dot(s) or s.w is not None:
            continue
        for end in (0, 1):
            seg = s.segs[0] if end == 0 else s.segs[-1]
            if seg[0] != 'C' or s.caps[end] != 'b' or s.taper[end] != 1.0:
                continue
            pt, (tx, ty) = _tangent(seg, end)
            if any(j != i and min(abs(q[0] - pt[0]) + abs(q[1] - pt[1]) for sg in o.segs for q in sg[1:]) < g.p.V for j, o in enumerate(g.strokes)):
                continue  # a join (S's spine meets its ends, r's arm leaves the stem), not a terminal
            if base in BEAK_TOP and ty < -0.85 and pt[1] > 0.5 * g.p.xh:
                out.append(('beak', i, end))
            elif base in BEAK_FOOT and ty > 0.85 and pt[1] < 0.5 * g.p.xh:
                out.append(('beak', i, end))
            elif base in BALL and pt[1] > 0.6 * g.p.xh:
                out.append(('ball', i, end))
            elif base in BALL_TAIL and pt[1] < 0:
                out.append(('ball', i, end))
    return out


def _terminal(g, p, kind, s, end, reach):
    """A beak or a ball on a curved terminal, placed on the stroke's own end face (the engine turns and thins heavy cuts)."""
    seg = s.segs[0] if end == 0 else s.segs[-1]
    (x, y), (tx, ty) = _tangent(seg, end)
    left, right = _open_sides(s, p.V, p.H)
    f1, f2 = (left[0][1], right[0][1]) if end == 0 else (left[-1][-1], right[-1][-1])
    if kind == 'beak':
        xs = [q[0] for o in g.strokes for sg in o.segs for q in sg[1:]]
        side = 1 if x > (min(xs) + max(xs)) / 2 else -1  # the outer side: away from the glyph's middle
        out, inn = (f1, f2) if side * f1[0] > side * f2[0] else (f2, f1)
        d = 1 if ty > 0 else -1  # +1: the stroke ends rising (a foot terminal), the beak stands up from the face
        face = min(out[1], inn[1]) if d < 0 else max(out[1], inn[1])  # the face's far corner: the beak starts below (above) it
        wb = abs(out[0] - inn[0])
        return _spur(out[0], side, face - d * wb * 0.5, d, face, reach * BEAK_LEN, min(p.V * BEAK_TIP, wb * 0.6), wb)
    # ball: tangent to the end face's outer corner, hanging toward the curve's inside (a teardrop, as Source Serif's r and f)
    a, b = (seg[-1], seg[-2]) if end == 0 else (seg[1], seg[2])
    q1 = seg[2] if end == 0 else seg[-2]
    t0 = ((seg[1] if end == 0 else seg[-1])[0] - q1[0], (seg[1] if end == 0 else seg[-1])[1] - q1[1])
    t1 = (b[0] - a[0], b[1] - a[1])
    turn = t1[0] * t0[1] - t1[1] * t0[0]
    nx, ny = (-ty, tx) if turn > 0 else (ty, -tx)
    out, inn = (f1, f2) if (f1[0] - x) * nx + (f1[1] - y) * ny < (f2[0] - x) * nx + (f2[1] - y) * ny else (f2, f1)
    r = p.V * _pw(p.V, BALL_R)
    cx, cy = out[0] + nx * r - tx * r * BALL_BACK, out[1] + ny * r - ty * r * BALL_BACK
    return orient(arc(cx, cy, r, r, 90, 450), outer=True)


def _diag_serif(cx, hw, Y, d, sl, rl, rr, t, Bl, Br):
    """A slab on a diagonal's end: the stem walls lean by sl (x per unit away from the slab), the brackets follow them."""
    P = lambda x, y: (x, Y + d * y)  # noqa: E731
    wl = lambda y: cx - hw + sl * y  # noqa: E731
    wr = lambda y: cx + hw + sl * y  # noqa: E731
    xl, xr = wl(0) - rl, wr(0) + rr
    xsr, xsl = wr(t) + rr * 0.6, wl(t) - rl * 0.6
    c = [L(P(xl, 0), P(xr, 0)), L(P(xr, 0), P(xr, t)), L(P(xr, t), P(xsr, t)),
         C(P(xsr, t), P(wr(t) + rr * 0.2, t), P(wr(t + Br * 0.35), t + Br * 0.35), P(wr(t + Br), t + Br)),
         L(P(wr(t + Br), t + Br), P(wl(t + Bl), t + Bl)),
         C(P(wl(t + Bl), t + Bl), P(wl(t + Bl * 0.35), t + Bl * 0.35), P(wl(t) - rl * 0.2, t), P(xsl, t)),
         L(P(xsl, t), P(xl, t)), L(P(xl, t), P(xl, 0))]
    return orient(c, outer=True)


def _spur(xe, sx, Ym, d, edge, ln, wt, wb):
    """An arm serif: its outer side continues the bar's end (xe) from the metric line Ym past the bar's inner edge by ln, d the
    direction away from the metric; its inner side a concave bracket from the tip (wt wide) into the bar (wb wide)."""
    tip = edge + d * ln
    c = [L((xe, Ym), (xe, tip)), L((xe, tip), (xe - sx * wt, tip)),
         C((xe - sx * wt, tip), (xe - sx * wt, tip - d * ln * 0.45), (xe - sx * wb, edge + d * ln * 0.12), (xe - sx * wb, edge - d * 2)),
         L((xe - sx * wb, edge - d * 2), (xe - sx * wb, Ym)), L((xe - sx * wb, Ym), (xe, Ym))]
    return orient(c, outer=True)


_PLAN = {}
_DPLAN = {}
_TPLAN = {}
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


THIN_DIAG = (1.15, 0.45)  # a / stroke's width: the larger of 1.15 hairlines and 0.45 stems (Source Serif's V: ~0.45 of the \\ stroke)


def _thin_slashes(g, p):
    """Serif contrast on diagonals: a / stroke (rising to the right) is thin, a \\ stroke thick. The angle pen drew both alike, so
    Black's X carried 1.11-1.24x E's ink density (Source Serif 0.91) and set beside Z it read a weight heavier. Z and z keep their
    thick / diagonal, as every serif Z does."""
    w = max(p.H * THIN_DIAG[0], p.V * THIN_DIAG[1])
    for s in g.strokes:
        if s.closed or s.w is not None or not s.segs or s.segs[0][0] != 'L':
            continue
        (x0, y0), (x1, y1) = s.segs[0][1], s.segs[0][2]
        if abs(x1 - x0) > 0.5 and abs(y1 - y0) > 40 and (x1 - x0) * (y1 - y0) > 0:
            s.w = w


def _comma_heads(g, p):
    """Sans's comma (and every curly quote, built from it: glyphs.comma_shape) has a square head; a serif's is round, the period's
    dot with the tail leaving its foot. The head stroke starts at the dot's centre so its square corners stay inside the disc."""
    for s in g.strokes:
        if s.closed or s.w is None or len(s.segs) != 2 or s.segs[0][0] != 'L' or s.segs[1][0] != 'C' or s.taper != (1, 0.15):
            continue
        (x, ya), (_, yb) = s.segs[0][1], s.segs[0][2]
        if abs(s.segs[0][1][0] - s.segs[0][2][0]) > 0.5 or abs(yb - ya) < 1:
            continue
        u = 1 if yb > ya else -1  # +1: a turned quote, the head at the bottom
        r = p.dot / 2 * ROUND_DOT
        cx = x - u * (p.dot - s.w) / 2  # the stroke keeps its left (turned: right) edge where the dot's is: the disc sits over it
        cy = ya + u * r
        start = cy if (yb - cy) * u > 1 else yb - u * 1  # never past the neck, so every master keeps one point order
        s.segs[0] = ('L', (x, start), (x, yb))
        g.raw.append(orient(arc(cx, cy, r, r, 90, 450), outer=True))


SPACE = [(100, -37), (400, -13), (900, 42)]  # units on the Sans word space: its space over n's advance stood 0.44 / 0.39 / 0.26 at Thin /
# Regular / Black (Source Serif 0.39 / 0.37 / 0.32): Thin's words drifted apart, Black's headline words ran together


def glyph(g, p, name):
    if name in ('space', 'nbspace') and g.adv_fixed is not None:
        g.adv_fixed = round(g.adv_fixed + _pw(p.wght, SPACE))
        return
    # Sans's dots are squares; a serif's are round (Source Serif's), in punctuation, the i j tittles and the accents alike
    # (decided at the first master, like _PLAN: zero.dot's dot is square at some weights only, and masters must stay compatible)
    if name not in _DOTS:
        _DOTS[name] = {i for i, s in enumerate(g.strokes) if _is_dot(s)}
    dots = [s for i, s in enumerate(g.strokes) if i in _DOTS[name]]
    g.strokes = [s for i, s in enumerate(g.strokes) if i not in _DOTS[name]]
    g.raw += [_round_dot(s) for s in dots]
    _comma_heads(g, p)
    # Round 6: tabular figures (g.tab) take serifs too: skipped, 0-9 read as the Sans's beside serifed text (critique). Their
    # advance is fixed, so the serifs sit inside it.
    if g.mark or (g.tab and not name.split('.')[0] in FIGS) or g.adv_fixed is not None or not g.strokes or not _serifed(name):
        return
    if name.split('.')[0] not in ('Z', 'z') and unicodedata.category(toUnicode(name.split('.')[0]))[0] == 'L':
        _thin_slashes(g, p)
    if name not in _PLAN:
        _PLAN[name] = _plan(g, p, name)
        letter = unicodedata.category(toUnicode(name.split('.')[0]))[0] == 'L'
        _DPLAN[name] = (_diag_ends(g, p), _arm_ends(g, p)) if letter else ([], [])
        _TPLAN[name] = _terminals(g, name) if letter else []
    outer, inner, t, bf = _sizes(p)
    k = CAP_REACH if name[:1].isupper() else 1.0
    if _DPLAN[name][0]:
        xs = [q[0] for s in g.strokes for seg in s.segs for q in seg[1:]]
        sides = {side for *_, side in _DPLAN[name][0]}
        give = k * outer * DIAG_OUTER * DIAG_TAKE * len(sides)
        _squeeze(g, 1 - give / (max(xs) - min(xs) + p.V), (min(xs) + max(xs)) / 2)
    for kind, i, end in _TPLAN[name]:
        g.raw.append(_terminal(g, p, kind, g.strokes[i], end, outer * k))
    if name in VBEAK:
        h = p.cap if name.isupper() else p.xh
        g.raw.append(_vbeak(g, p, g.strokes[0], 0, VBEAK[name] * h, p.V * VBEAK_TIP, p.V * VBEAK_TIP + outer * k * BRACKET))
        if name == 'C':  # the lower end: a short spur standing up, as Merriweather's (Source Serif's a hint of one)
            g.raw.append(_vbeak(g, p, g.strokes[0], 1, 0, p.V * VBEAK_TIP * 0.7, p.V * 0.35 + outer * k * 0.6, rise=VBEAK_FOOT * (h * (1 - VBEAK[name]))))
    for i, end, kind, side in _DPLAN[name][0]:
        s = g.strokes[i]
        seg = s.segs[0] if end == 0 else s.segs[-1]
        b, a = (seg[1], seg[2]) if end == 0 else (seg[2], seg[1])
        d = 1 if kind in ('base', 'desc') else -1
        sl = (a[0] - b[0]) / abs(a[1] - b[1])  # x the walls move per unit away from the slab
        ro, ri = k * outer * DIAG_OUTER, k * outer * DIAG_INNER
        rl, rr = (ro, ri) if side < 0 else (ri, ro)
        B = outer * k * bf
        Bl, Br = (B * DIAG_LEAN, B) if sl < 0 else (B, B * DIAG_LEAN)
        g.raw.append(_diag_serif(b[0], _diag_hw(g, s, a, b), b[1], d, sl, rl, rr, t, Bl, Br))
    for i, end, d, sx, h in _DPLAN[name][1]:
        s = g.strokes[i]
        xe, ye = s.segs[0][1 + end]
        Ym = ye - d * h / 2
        g.raw.append(_spur(xe, sx, Ym, d, ye + d * h / 2, outer * k * SPUR_LEN, max(14.0, p.V * SPUR_TIP), max(14.0, p.V * SPUR_TIP) + outer * SPUR_BASE))
        # the spur fills the white beside the arm (EH set 0.66 of Source Serif's 0.85 gap at Bold): that side stands off further
        sb = list(g.sb)
        sb[sx > 0] += SPUR_SB * (p.V * SPUR_TIP + outer * SPUR_BASE) / p.S / len(_DPLAN[name][1])
        g.sb = tuple(sb)
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

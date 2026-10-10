"""Glyph drawings. Each function draws centerline strokes for one master's parameters.

Conventions: the left ink edge is roughly x=0 (the builder re-measures and re-spaces anyway),
y=0 is the baseline. `g.sb` is (left, right) sidebearing in units of the stem sidebearing S:
1.0 = straight stem, ~0.6 = round, ~0.1 = diagonal apex/foot.

Rule that keeps the variable font valid: nothing here may branch on a master parameter in a way
that changes the *number* of strokes or segments. Parameters may only move points.
"""

import math

from geom import L, Stroke, arc, contour_bounds, norm, orient, pen_thickness, reverse_seg

GLYPHS = {}  # name -> (codepoints, fn)
ORDER = []


def glyph(name, *cps):
    def deco(fn):
        GLYPHS[name] = (list(cps), fn)
        ORDER.append(name)
        return fn

    return deco


class G:
    def __init__(self, p):
        self.p = p
        self.strokes = []
        self.raw = []
        self.sb = (1.0, 1.0)
        self.ht = 'x'
        self.anchors = {}
        self.mark = False
        self.tab = False
        self.adv_fixed = None

    # -- drawing primitives ------------------------------------------------------------------
    def stroke(self, segs, **kw):
        self.strokes.append(Stroke(segs, **kw))
        return self

    def line(self, p0, p1, **kw):
        return self.stroke([L(p0, p1)], **kw)

    def vstem(self, xl, y0, y1, **kw):
        x = xl + self.p.V / 2
        return self.line((x, y0), (x, y1), **kw)

    def hbar(self, x0, x1, yb, h=None, **kw):
        h = self.p.H if h is None else h
        y = yb + h / 2
        if h != self.p.H:
            kw.setdefault('w', h)
        return self.line((x0, y), (x1, y), **kw)

    def arc(self, cx, cy, rx, ry, a0, a1, k=None):
        return arc(cx, cy, rx, ry, a0, a1, self.p.k if k is None else k)

    def box(self, x0, y0, x1, y1, V=None, H=None):
        """Centerline ellipse whose *outer* edge touches the box."""
        V = self.p.V if V is None else V
        H = self.p.H if H is None else H
        return ((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 - V / 2, (y1 - y0) / 2 - H / 2)

    def oval(self, x0, y0, x1, y1, V=None, H=None, **kw):
        V = self.p.V if V is None else V
        H = self.p.H if H is None else H
        # a small ring (%, &, @) drawn with a heavy pen closes up: keep the pen under a third of
        # the ring's size so a counter always survives (letters like o are never this small)
        V, H = min(V, (x1 - x0) * 0.33), min(H, (y1 - y0) * 0.33)
        cx, cy, rx, ry = self.box(x0, y0, x1, y1, V, H)
        segs = self.arc(cx, cy, rx, ry, 90, 450)
        pen = (V, H)
        return self.stroke(segs, closed=True, pen=pen, **kw)

    def hw(self, dx, dy, ws=1.0, w=None):
        """Horizontal half-width of a straight stroke with direction (dx, dy)."""
        t = norm((dx, dy))
        w = pen_thickness(t, self.p.V, self.p.H) * ws if w is None else w
        return w / 2 / max(abs(t[1]), 0.2)

    def diag(self, x0, y0, x1, y1, a0='c', a1='c', ws=0.93, caps=('h', 'h'), **kw):
        """Straight stroke whose end x positions name an edge: 'l' left edge, 'r' right, 'c' center."""
        cx0, cx1 = x0, x1
        for _ in range(3):
            h = self.hw(cx1 - cx0, y1 - y0, ws, kw.get('w'))
            cx0 = x0 + (h if a0 == 'l' else -h if a0 == 'r' else 0)
            cx1 = x1 + (h if a1 == 'l' else -h if a1 == 'r' else 0)
        self.line((cx0, y0), (cx1, y1), ws=ws, caps=caps, **kw)
        return (cx0, y0), (cx1, y1)

    def dot(self, xc, yb, d=None):
        d = self.p.dot if d is None else d
        return self.line((xc, yb), (xc, yb + d), w=d)


def on_line(p0, p1, y):
    t = (y - p0[1]) / (p1[1] - p0[1])
    return p0[0] + (p1[0] - p0[0]) * t


# ============================================================================================
# Uppercase
# ============================================================================================


@glyph('H', 0x48)
def _H(g, p):
    w = p.Hw
    g.vstem(0, 0, p.cap).vstem(w - p.V, 0, p.cap)
    g.hbar(p.V / 2, w - p.V / 2, p.cap * 0.5 - p.bar / 2 + 6, h=p.bar)
    g.ht = 'c'


@glyph('I.ss01')
def _I_ss01(g, p):  # plain I: opt-in, it is identical to l in most grotesques
    g.vstem(0, 0, p.cap)
    g.ht = 'c'


@glyph('I', 0x49)
def _I(g, p):  # serifed by default, so I, l and 1 never read alike in text
    e = p.cH * 0.30 + p.V * 0.2
    w = p.V + 2 * e
    g.vstem(e, 0, p.cap)
    g.hbar(0, w, 0).hbar(0, w, p.cap - p.H)
    g.ht = 'c'
    g.sb = (0.6, 0.6)


@glyph('L', 0x4C)
def _L(g, p):
    w = p.Hw * 0.76
    g.vstem(0, 0, p.cap).hbar(p.V / 2, w, 0)
    g.ht = 'c'
    # the italic's foot slants out under the next capital: heavy, it met X
    g.sb = (1, 0.35 + (0.3 if p.italic else 0) * p.heavy)
    g.anchors['top_x'] = p.V / 2 + 0.12 * w  # over the stem, as Inter's, Geist's and Plex's Ĺ


@glyph('E', 0x45)
def _E(g, p):
    w = p.Hw * 0.82
    g.vstem(0, 0, p.cap)
    g.hbar(p.V / 2, w, 0).hbar(p.V / 2, w * 0.95, p.cap * 0.5 - p.H / 2 + 6).hbar(p.V / 2, w, p.cap - p.H)
    g.ht = 'c'
    g.sb = (1, 0.5)


@glyph('F', 0x46)
def _F(g, p):
    w = p.Hw * 0.78
    g.vstem(0, 0, p.cap)
    g.hbar(p.V / 2, w * 0.93, p.cap * 0.5 - p.H / 2 - 4).hbar(p.V / 2, w, p.cap - p.H)
    g.ht = 'c'
    g.sb = (1, 0.4)


@glyph('T', 0x54)
def _T(g, p):
    # wider, as Geist's and Inter's: it carried 0.92x their ink at every weight
    w = p.Hw * 0.97
    g.hbar(0, w, p.cap - p.H).vstem((w - p.V) / 2, 0, p.cap - p.H / 2)
    g.ht = 'c'
    g.sb = (0.18, 0.18)


@glyph('A', 0x41)
def _A(g, p):
    # heavy A widens and drops its bar, or the counter above the bar closes (Black: 0.38x)
    w = p.Hw * (1.1 + 0.14 * p.heavy)
    if p.italic:  # the italic's narrowing closed Black's counter to 0.89x the upright's
        w *= 1 + 0.06 * p.heavy
    c = w / 2
    # diagonals at (nearly) the full stroke: the A carried 0.90-0.91x the references' ink at every
    # weight. Black widens as much again, so the counter above the bar stays open
    ws = 1.0 - 0.03 * p.heavy
    a = g.diag(0, 0, c, p.cap, 'l', 'c', ws=ws)
    b = g.diag(w, 0, c, p.cap, 'r', 'c', ws=ws)
    y = p.cap * (0.27 - 0.05 * p.heavy)
    g.hbar(on_line(*a, y), on_line(*b, y), y, h=p.bar)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('V', 0x56)
def _V(g, p):
    w = p.Hw * (1.07 + 0.1 * p.heavy)
    c = w / 2
    # Regular's diagonals heavier: 0.82-0.91x the ink of Inter, Geist and Helvetica (Black kept)
    g.diag(0, p.cap, c, 0, 'l', 'c', ws=1.0 - 0.07 * p.heavy)
    g.diag(w, p.cap, c, 0, 'r', 'c', ws=1.0 - 0.07 * p.heavy)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('W', 0x57)
def _W(g, p):
    w = p.Hw * 1.6
    # Regular's diagonals were too light (the W carried 0.85x Geist's and Inter's ink against a
    # 0.94x Regular overall); Black's weight is unchanged
    ws = 0.96 - 0.1 * p.heavy
    x1, x3 = w * 0.25, w * 0.75
    g.diag(0, p.cap, x1, 0, 'l', 'c', ws=ws)
    g.diag(w / 2, p.cap, x1, 0, 'c', 'c', ws=ws)
    g.diag(w / 2, p.cap, x3, 0, 'c', 'c', ws=ws)
    g.diag(w, p.cap, x3, 0, 'r', 'c', ws=ws)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('M', 0x4D)
def _M(g, p):
    w = p.Hw * 1.24
    g.vstem(0, 0, p.cap).vstem(w - p.V, 0, p.cap)
    # heavier diagonals at Regular (0.87x the references' ink) and, less, at Black (0.88-0.92x)
    g.diag(0, p.cap, w / 2, 0, 'l', 'c', ws=0.94 - 0.04 * p.heavy)
    g.diag(w, p.cap, w / 2, 0, 'r', 'c', ws=0.94 - 0.04 * p.heavy)
    g.ht = 'c'


@glyph('N', 0x4E)
def _N(g, p):
    w = p.Hw
    g.vstem(0, 0, p.cap).vstem(w - p.V, 0, p.cap)
    g.diag(0, p.cap, w, 0, 'l', 'r', ws=0.95)
    g.ht = 'c'


@glyph('Z', 0x5A)
def _Z(g, p):
    w = p.Hw * 0.9
    g.hbar(w * 0.04, w, p.cap - p.H).hbar(0, w, 0)
    g.diag(w, p.cap - p.H / 2, 0, p.H / 2, 'r', 'l', ws=0.95)
    g.ht = 'c'
    g.sb = (0.35, 0.35 + (0.3 if p.italic else 0) * p.heavy)  # as the italic L


@glyph('X', 0x58)
def _X(g, p):
    w = p.Hw * (1.02 + 0.1 * p.heavy)
    # Regular's diagonals heavier: 0.80-0.90x the ink of Inter, Geist and Helvetica (Black kept)
    g.diag(0, p.cap, w, 0, 'l', 'r', ws=1.0 - 0.07 * p.heavy)
    g.diag(w, p.cap, 0, 0, 'r', 'l', ws=0.97 - 0.07 * p.heavy)
    g.ht = 'c'
    g.sb = (0.1, 0.1)


@glyph('Y', 0x59)
def _Y(g, p):
    w = p.Hw * 1.04
    c = w / 2
    yj = p.cap * 0.43
    # heavier arms at Regular (0.88x the references' ink), Black's unchanged
    g.diag(0, p.cap, c, yj, 'l', 'c', ws=0.98 - 0.06 * p.heavy)
    g.diag(w, p.cap, c, yj, 'r', 'c', ws=0.98 - 0.06 * p.heavy)
    g.vstem(c - p.V / 2, 0, yj + 2)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('K', 0x4B)
def _K(g, p):
    w = p.Hw * (0.98 + 0.08 * p.heavy)
    g.vstem(0, 0, p.cap)
    a0, a1 = g.diag(p.V / 2, p.cap * 0.33, w, p.cap, 'c', 'r', ws=0.92, caps=('v', 'h'))
    t = 0.38
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w + 4, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    g.ht = 'c'
    g.sb = (1, 0.1)


@glyph('O', 0x4F)
def _O(g, p):
    w = p.Hw * 1.17
    g.oval(0, -p.ov, w, p.cap + p.ov)
    g.ht = 'c'
    g.sb = (0.62, 0.62)


@glyph('Q', 0x51)
def _Q(g, p):
    w = p.Hw * 1.17
    g.oval(0, -p.ov, w, p.cap + p.ov)
    g.diag(w * 0.6, p.cap * 0.2, w + p.V * 0.2, -p.ov - 40, 'c', 'r', ws=0.9, caps=('b', 'h'))
    g.ht = 'c'
    g.sb = (0.62, 0.5)


@glyph('C', 0x43)
def _C(g, p):
    w = p.Hw * (1.12 + 0.07 * p.heavy)  # Black's C was 0.75x Geist's and Inter's width, Regular's 0.88x
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    # terminals sit 14° further round than they first did, at every weight, as in Geist and Inter:
    # the open aperture left the C at 0.79x their ink at Regular and 0.71x at Black
    g.stroke(g.arc(cx, cy, rx, ry, 28 + p.ap, 332 - p.ap), caps=('b', 'b'), cut='h')
    g.ht = 'c'
    g.sb = (0.62, 0.45)


@glyph('G', 0x47)
def _G(g, p):
    w = p.Hw * 1.12
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    # the top terminal sits where the C's does, at every weight (it was 14° more open at Regular)
    g.stroke(g.arc(cx, cy, rx, ry, 28 + p.ap, 360), caps=('b', 'b'), cut='h')
    xr = cx + rx
    # ends inside the curve's stroke: run to its outer edge, the bar overhung where the curve
    # turns inward below it
    g.hbar(cx + rx * 0.08, xr, cy - p.H)
    g.ht = 'c'
    g.sb = (0.62, 0.8 - (0.5 if p.italic else 0) * p.heavy)  # the heavy italic's Go sat 28% loose


@glyph('D', 0x44)
def _D(g, p):
    w = p.Hw * 1.06
    V, H = p.V, p.H
    xr = w - V / 2
    ry = (p.cap - H) / 2
    rx = min(ry * 1.02, (xr - V / 2) * 0.62)
    cx, cy = xr - rx, p.cap / 2
    g.stroke([L((V / 2, p.cap - H / 2), (cx, p.cap - H / 2))] + g.arc(cx, cy, rx, ry, 90, -90) + [L((cx, H / 2), (V / 2, H / 2))])
    g.vstem(0, 0, p.cap)
    g.ht = 'c'
    g.sb = (1, 0.62)


def _bowl_right(g, x0, xr, ytop, ybot, ratio=1.0):
    """A P/B/R bowl: bars from the stem centre at ytop/ybot (centerlines), round on the right."""
    ry = (ytop - ybot) / 2
    rx = min(ry * ratio, (xr - x0) * 0.75)
    cx = xr - rx
    cy = (ytop + ybot) / 2
    g.stroke([L((x0, ytop), (cx, ytop))] + g.arc(cx, cy, rx, ry, 90, -90) + [L((cx, ybot), (x0, ybot))])
    return cx


@glyph('P', 0x50)
def _P(g, p):
    w = p.Hw * (0.93 + 0.05 * p.heavy)  # heavy P's bowl grows, or its counter closes
    V, H = p.V, p.H
    g.vstem(0, 0, p.cap)
    _bowl_right(g, V / 2, w - V / 2, p.cap - H / 2, p.cap * (0.44 - 0.04 * p.heavy) + H / 2, 1.05)
    g.ht = 'c'
    g.sb = (1, 0.55)


@glyph('R', 0x52)
def _R(g, p):
    w = p.Hw * 0.98
    if p.italic:  # as the italic A: Black's bowl closed to 0.86x the upright's
        w *= 1 + 0.06 * p.heavy
    V, H = p.V, p.H
    g.vstem(0, 0, p.cap)
    ym = p.cap * 0.44 + H / 2
    cx = _bowl_right(g, V / 2, w - V / 2 - w * 0.03, p.cap - H / 2, ym, 1.05)
    g.diag(cx - V * 0.1, ym, w, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    g.ht = 'c'
    g.sb = (1, 0.12)


@glyph('B', 0x42)
def _B(g, p):
    w = p.Hw * 0.97
    V, H = p.V, p.H
    g.vstem(0, 0, p.cap)
    ym = p.cap * 0.535
    _bowl_right(g, V / 2, w - V / 2 - w * 0.05, p.cap - H / 2, ym, 1.08)
    _bowl_right(g, V / 2, w - V / 2, ym, H / 2, 1.08)
    g.ht = 'c'
    g.sb = (1, 0.6)


@glyph('U', 0x55)
def _U(g, p):
    w = p.Hw * 1.0
    V, H = p.V, p.H
    xl, xr = V / 2, w - V / 2
    rx = (xr - xl) / 2
    ry = min(rx * 1.0, p.cap * 0.42)
    cy = -p.ov + H / 2 + ry
    g.stroke([L((xl, p.cap), (xl, cy))] + g.arc(xl + rx, cy, rx, ry, 180, 360) + [L((xr, cy), (xr, p.cap))])
    g.ht = 'c'
    g.sb = (1, 1)


@glyph('J', 0x4A)
def _J(g, p):
    w = p.Hw * 0.8
    V, H = p.V, p.H
    xr = w - V / 2
    rx = (w - V / 2) / 2 - 2
    # a taller hook: the J carried 0.88-0.91x Geist's and Inter's ink at every weight
    ry = min(rx * 1.12, p.cap * 0.40)
    cy = -p.ov + H / 2 + ry
    # Regular's hook runs 12° further round (it stopped short, 0.87x the references' ink); Black's
    # is unchanged
    g.stroke([L((xr, p.cap), (xr, cy))] + g.arc(xr - rx, cy, rx, ry, 0, max(-179.0, -178 + 20 * p.heavy + p.ap)), caps=('b', 'b'))  # short of -180°: same segments in every master
    g.ht = 'c'
    g.sb = (0.4, 0.9)


def _ell_seg(cx, cy, rx, ry, a0, a1, k):
    """One cubic along an ellipse from a0 to a1 (degrees), which may cross a quadrant boundary.
    Its handles scale with the span from the quarter-arc squareness k, so it matches arc()."""
    t0, t1 = math.radians(a0), math.radians(a1)
    h = k / 0.5523 * 4 / 3 * math.tan((t1 - t0) / 4)
    p0 = (cx + rx * math.cos(t0), cy + ry * math.sin(t0))
    p3 = (cx + rx * math.cos(t1), cy + ry * math.sin(t1))
    return ('C', p0, (p0[0] - h * rx * math.sin(t0), p0[1] + h * ry * math.cos(t0)),
            (p3[0] + h * rx * math.sin(t1), p3[1] - h * ry * math.cos(t1)), p3)


def _S(g, p, w, top, ov, pen=None, term=32, spine=0.1, run=0, run_up=None, close=0):
    """S/s/$ spine: upper arc, a cubic spine at full stem weight, lower arc."""
    V, H = p.V, p.H
    yb, yt = -ov, top + ov
    # upper bowl height (outer); Black gives it more, or its counter closes under the heavier pen
    hu = (yt - yb) * (0.47 + 0.03 * p.heavy)
    wu = w * 0.94
    PV, PH = pen if pen else (V, H)
    cxu, cyu, rxu, ryu = g.box(w * 0.03, yt - hu, w * 0.03 + wu, yt, PV, PH)
    cxl, cyl, rxl, ryl = g.box(0, yb, w, yb + (yt - yb) - hu + PH, PV, PH)
    pa = (cxu - rxu, cyu)
    pb = (cxl + rxl, cyl)
    dy = pa[1] - pb[1]
    # the spine runs a few units into each bowl: strokes that only touch edge to edge render
    # with an anti-aliased hairline seam
    lap = 8
    pa, pb = (pa[0], pa[1] + lap), (pb[0], pb[1] - lap)
    dy = pa[1] - pb[1]
    # Longer handles flatten the spine's middle (its slope there is (dy - handle) / dx). Heavy
    # s's lie flatter, as three near-horizontal bands, the way Geist's and Inter's do.
    heavy = p.heavy
    hd = dy * (0.55 + 0.2 * heavy)
    spine_seg = ('C', pa, (pa[0], pa[1] - hd), (pb[0], pb[1] + hd), pb)
    # The upper bowl is short, so near 0° its inner radius of curvature drops below half the
    # stroke and the inner edge must fold. The terminal sits higher, where the curve is gentle,
    # and is cut square to the stroke (a horizontal cut there would leave a sliver).
    # `run`: degrees the heavy terminals run further round. Geist's and Inter's Black S ends each
    # bowl past its widest point, on a near-flat face low on the curve, which keeps the counters
    # small and round. That crosses a quadrant boundary, so the terminal segment is drawn as one
    # cubic (_ell_seg) in every master that needs it: the segment count stays the same.
    # `close`: degrees every weight's terminals sit further round; the heavy run shrinks by as
    # much, so Black's terminals stay put
    a_up = term - close - (8 + (run if run_up is None else run_up) - close) * heavy + p.ap * 0.8
    a_lo = -146 - close - (8 + run - close) * heavy + p.ap * 0.8
    up = g.arc(cxu, cyu, rxu, ryu, a_up, 180) if a_up > 0 else [_ell_seg(cxu, cyu, rxu, ryu, a_up, 90, p.k)] + g.arc(cxu, cyu, rxu, ryu, 90, 180)
    lo = g.arc(cxl, cyl, rxl, ryl, 0, a_lo) if a_lo > -180 else g.arc(cxl, cyl, rxl, ryl, 0, -90) + [_ell_seg(cxl, cyl, rxl, ryl, -90, a_lo, p.k)]
    # Three strokes, so the spine gets its own pen: the default angle pen thins a diagonal spine
    # too far at Regular, while a constant full stem closes the counters at Black. A heavier
    # hairline (1.15 H) does both. The joins sit at the bowls' vertical extremes, where every
    # pen is exactly one stem wide, so they are seamless.
    # heavy terminals cut toward horizontal, as Geist's and Inter's: cut toward vertical, the
    # lower one ran out into a long wedge (and in the italic, where the flat cut folds, they stay)
    cut = 'h'
    g.stroke(up, caps=('b', 'b'), pen=pen, cut=cut)
    # Heavier, the spine carries more: at 1.15 H a Black spine was 60% of a stem and the s read
    # as a lightning bolt beside Geist's and Inter's near-full-weight spines.
    g.stroke([spine_seg], pen=(PV, PH * (1.15 + spine * heavy)))
    g.stroke(lo, caps=('b', 'b'), pen=pen, cut=cut)


def _s_extra(p):
    # s stacks three horizontals plus a diagonal spine inside one x-height, so it runs out of
    # counter before any other letter as weight rises; heavy weights give it extra width
    return 1.1 * max(0.0, p.V - 90)


@glyph('S', 0x53)
def _S_(g, p):
    # capitals have room, so half the s's extra width; a heavier spine, as Geist's and Inter's S
    # and heavier horizontals: Black's top and bottom were 12% thinner than theirs, and the S
    # carried 0.86x their ink
    # (Regular's terminals sit 14° further round too: the S carried 0.80x their ink at Regular)
    _S(g, p, p.Hw * 0.94 + _s_extra(p) * 0.5, p.cap, p.ov, pen=(p.V, p.H * (1 + 0.1 * p.heavy)), spine=0.3, run=34, close=26)
    g.ht = 'c'
    g.sb = (0.5, 0.5)


# ============================================================================================
# Lowercase
# ============================================================================================


def shoulder(g, xl, xr, top, taper=0.5, ry_k=0.93):
    """n-arch from a stem whose left edge is xl to a right stem whose left edge is xr."""
    p = g.p
    a, b = xl + p.V / 2, xr + p.V / 2
    rx = (b - a) / 2
    ry = rx * ry_k
    cy = top - p.H / 2 - ry
    g.stroke(g.arc(a + rx, cy, rx, ry, 166, 0) + [L((b, cy), (b, 0))], taper=(taper, 1))


@glyph('n', 0x6E)
def _n(g, p):
    g.vstem(0, 0, p.xh)
    shoulder(g, 0, p.nw - p.V, p.xh + p.ov * 0.4)


@glyph('h', 0x68)
def _h(g, p):
    g.vstem(0, 0, p.asc)
    shoulder(g, 0, p.nw - p.V, p.xh + p.ov * 0.4)
    g.ht = 'a'


@glyph('m', 0x6D)
def _m(g, p):
    c = p.cn * 0.86
    g.vstem(0, 0, p.xh)
    shoulder(g, 0, c + p.V, p.xh + p.ov * 0.4, ry_k=1.12)
    shoulder(g, c + p.V, 2 * c + 2 * p.V, p.xh + p.ov * 0.4, ry_k=1.12)


@glyph('u', 0x75)
def _u(g, p):
    w = p.nw
    a, b = p.V / 2, w - p.V / 2
    rx = (b - a) / 2
    ry = rx * 0.93
    cy = -p.ov * 0.4 + p.H / 2 + ry
    g.stroke([L((a, p.xh), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 346), taper=(1, 0.5))
    g.vstem(w - p.V, 0, p.xh)


@glyph('r', 0x72)
def _r(g, p):
    # Regular's arm is shorter: it ran 1.5x Geist's and Inter's width and 1.3x Inter's and Plex's
    # italic, and Helvetica's r is as narrow as theirs (Black, at 1.02, is unchanged)
    w = p.nw * (0.64 - 0.13 * (1 - p.heavy))
    g.vstem(0, 0, p.xh)
    a = p.V / 2
    rx = w - a - p.V * 0.2
    ry = p.xh * 0.42
    cy = p.xh + p.ov * 0.4 - p.H / 2 - ry
    g.stroke(g.arc(a + rx, cy, rx, ry, 166, 62 - p.ap * 0.5), taper=(0.5, 1), caps=('b', 'b'))
    g.sb = (1, 0.35 + (0.25 if p.italic else 0) * p.heavy)  # ra, re, ro sat 10% tighter than in the references


@glyph('dotlessi', 0x131)
def _dotlessi(g, p):
    g.vstem(0, 0, p.xh)


@glyph('l.ss01')
def _l_ss01(g, p):  # plain l: opt-in
    g.vstem(0, 0, p.asc)
    g.ht = 'a'


@glyph('l', 0x6C)
def _l(g, p):  # tailed by default
    a = p.V / 2
    # A short tail that grows slower than the stem: a long heavy tail turns ill into iʟʟ at Black
    rx = 70 + p.V * 0.5
    ry = rx * 1.05
    cy = -p.ov * 0.4 + p.H / 2 + ry
    g.stroke([L((a, p.asc), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 290), caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (1, -0.25)  # the tail tucks under the next letter; spacing it as ink opened a hole after every l


@glyph('dotlessj', 0x237)
def _dotlessj(g, p):
    x = p.V * 0.5 + 70
    rx = 70 + p.V * 0.3
    ry = rx * 1.15
    cy = p.desc + p.H / 2 + ry
    g.stroke([L((x, p.xh), (x, cy))] + g.arc(x - rx, cy, rx, ry, 0, -90) + [L((x - rx, p.desc + p.H / 2), (x - rx - 12, p.desc + p.H / 2))])
    g.sb = (0.2, 1)
    g.anchors['top_x'] = x


def _bowl_lc(g, p, w, stem_left, taper=0.55):
    """b/p (stem_left) or d/q bowl. Returns nothing; draws the open arc meeting the stem."""
    V = p.V
    if stem_left:
        x0, x1 = V / 2 - V / 2, w  # left centerline sits on the stem centre
        cx, cy, rx, ry = g.box(x0, -p.ov, x1, p.xh + p.ov)
        g.stroke(g.arc(cx, cy, rx, ry, 152, -152), taper=(taper, taper))
    else:
        cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
        g.stroke(g.arc(cx, cy, rx, ry, 28, 332), taper=(taper, taper))


@glyph('b', 0x62)
def _b(g, p):
    w = p.nw * 1.08
    g.vstem(0, -0, p.asc)
    _bowl_lc(g, p, w, True)
    g.ht = 'a'
    g.sb = (1, 0.62)


@glyph('p', 0x70)
def _p(g, p):
    w = p.nw * 1.08
    g.vstem(0, p.desc, p.xh)
    _bowl_lc(g, p, w, True)
    g.sb = (1, 0.62)


@glyph('d', 0x64)
def _d(g, p):
    w = p.nw * 1.08
    g.vstem(w - p.V, 0, p.asc)
    _bowl_lc(g, p, w, False)
    g.ht = 'a'
    g.sb = (0.62, 1)
    g.anchors['topright_x'] = w + p.S * 0.3


@glyph('q', 0x71)
def _q(g, p):
    w = p.nw * 1.08
    g.vstem(w - p.V, p.desc, p.xh)
    _bowl_lc(g, p, w, False)
    g.sb = (0.62, 1)


@glyph('g', 0x67)
def _g(g, p):
    w = p.nw * 1.07
    V, H = p.V, p.H
    xr = w - V / 2
    rx = (w - V) / 2 * 0.98
    ry = 104 + p.V * 0.25
    cy = p.desc - p.ov * 0.5 + H / 2 + ry
    g.stroke([L((xr, p.xh), (xr, cy))] + g.arc(xr - rx, cy, rx, ry, 0, -152 + p.ap), caps=('b', 'b'))
    cx, cy2, rx2, ry2 = g.box(0, 18, w, p.xh + p.ov)
    g.stroke(g.arc(cx, cy2, rx2, ry2, 28, 332), taper=(0.55, 0.55))
    g.sb = (0.62, 1.15 if p.italic else 1)  # the italic sat 10% tighter on its right than Inter's and Plex's


@glyph('o', 0x6F)
def _o(g, p):
    g.oval(0, -p.ov, p.nw * 1.1, p.xh + p.ov)
    g.sb = (0.62, 0.62)


@glyph('c', 0x63)
def _c(g, p):
    # Regular's c was 0.81x Geist's and Inter's width; heavier, it widens a little more, or its
    # counter pinches
    w = p.nw * (1.04 + 0.02 * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    # terminals sit 14° further round than they first did, at every weight: the open aperture left
    # the c at 0.78x Geist's and Inter's ink at Regular and 0.77x at Black, and Bold inherited it
    g.stroke(g.arc(cx, cy, rx, ry, 30 + p.ap, 330 - p.ap), caps=('b', 'b'), cut='h')
    g.sb = (0.62, 0.42)


@glyph('e', 0x65)
def _e(g, p):
    w = p.nw * 1.06
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    # flush with where the bowl stroke ends, or its butt end shows below the bar; heavy bars drop
    # half their height (still covering that end) so the eye above stays open
    yb = cy - p.bar * 0.5 * p.heavy
    # the italic's narrower, slanted eye closed to 0.69x Inter's and Plex's at Regular: its bar
    # sits lower at every weight short of Black (every italic master starts with the one cubic)
    if p.italic:
        yb -= p.bar * 0.4 * (1 - p.heavy)
    else:  # the upright's too: 0.73-0.79x the eye of Inter, Geist and Helvetica at Regular
        yb -= p.bar * 0.35 * (1 - p.heavy)
    # The bowl starts at the dropped bar's underside, or the bar's lower right corner shows below
    # the bowl as a step (Bold). Below 0° that crosses a quadrant, so the first segment is one
    # cubic (_ell_seg) and every master keeps the same segments.
    a0 = -math.degrees(math.asin(min(1.0, (cy - yb) / ry)))
    first = [_ell_seg(cx, cy, rx, ry, a0, 90, p.k)] if a0 < 0 else g.arc(cx, cy, rx, ry, 0, 90)
    # the start is a join hidden in the bar, cut flat along the bar's underside, not a terminal
    g.stroke(first + g.arc(cx, cy, rx, ry, 90, 322 - p.ap), caps=('h', 'b'), cut='h')
    # ends on the bowl's centreline, so the bowl stroke covers it; in the italic the stroke's end
    # is cut on a slant, so the bar stops short of it
    g.hbar(cx - rx, cx + rx - (p.V * 0.18 if p.italic else 0), yb, h=p.bar)
    g.sb = (0.62, 0.5)


def _a_bowl(g, p, xs, wf):
    """The double-storey a's bowl, left of a stem centred on xs (in æ, the e's left stroke).

    An outer shape and a counter drawn directly, not a stroke. As a stroke, the bowl's thickness
    followed the pen and its diagonal join into the stem, and at Black the counter shrank to a
    slit with a nick at its lower right. Drawn, each thickness is its own master parameter, and
    the counter's right side runs flat against the stem as in Geist and Inter. Regular keeps its
    proportions. Heavy weights lift the bowl a little and lighten its left side; the counter's
    area at Black then matches the old one, but as a round shape, not a slit.
    """
    V = p.V
    h = p.heavy
    k = p.k
    ybt = p.xh * (0.57 + 0.05 * h)  # top of the bowl
    yb0 = -p.ov  # bottom of the bowl
    xe = xs - V / 2  # stem's left edge
    rxb = (xs - V / 2) / 2 * wf
    cxb = V / 2 + rxb  # horizontal centre of the bowl's round left half
    th = p.bar  # top and bottom of the bowl
    tl = V * (1 - 0.08 * h)  # left side of the bowl
    cy = (ybt + yb0) / 2
    ry = (ybt - yb0) / 2
    yjo = yb0 + (ybt - yb0) * 0.3  # where the outline meets the stem
    outer = [
        L((xs, ybt), (cxb, ybt)),
        ('C', (cxb, ybt), (cxb - cxb * k, ybt), (0, cy + ry * k), (0, cy)),
        ('C', (0, cy), (0, cy - ry * k), (cxb - cxb * k, yb0), (cxb, yb0)),
        ('C', (cxb, yb0), (cxb + (xs - cxb) * 0.6, yb0), (xs, yjo - (yjo - yb0) * 0.6), (xs, yjo)),
        L((xs, yjo), (xs, ybt)),
    ]
    yti, ybi = ybt - th, yb0 + th
    cyi, ryi = (yti + ybi) / 2, (yti - ybi) / 2
    rxi = cxb - tl
    yji = ybi + (yti - ybi) * 0.45  # where the counter's round bottom meets the stem
    inner = [
        L((xe, yti), (cxb, yti)),
        ('C', (cxb, yti), (cxb - rxi * k, yti), (tl, cyi + ryi * k), (tl, cyi)),
        ('C', (tl, cyi), (tl, cyi - ryi * k), (cxb - rxi * k, ybi), (cxb, ybi)),
        ('C', (cxb, ybi), (cxb + (xe - cxb) * 0.6, ybi), (xe, yji - (yji - ybi) * 0.6), (xe, yji)),
        L((xe, yji), (xe, yti)),
    ]
    g.raw += [orient(outer, outer=True), orient(inner, outer=False)]


@glyph('a', 0x61)
def _a(g, p):
    if p.italic:  # single-storey: a bowl closed by a stem at x-height, as in Plex and Source italics
        w = p.nw * 1.04
        g.vstem(w - p.V, 0, p.xh)
        _bowl_lc(g, p, w, False)
        g.sb = (0.62, 1)
        return
    w = p.nw * 0.98
    V, H = p.V, p.H
    xs = w - V / 2  # stem centre
    # top arc
    cxt = xs * 0.5 + 6
    rxt = xs - cxt
    ryt = p.xh * 0.26
    cyt = p.xh + p.ov * 0.5 - H / 2 - ryt
    g.stroke([L((xs, 0), (xs, cyt))] + g.arc(cxt, cyt, rxt, ryt, 0, 154 - p.ap), caps=('b', 'b'))
    _a_bowl(g, p, xs, 0.94)
    g.sb = (0.55, 1)


@glyph('s', 0x73)
def _s(g, p):
    # Heavy terminals run round as the S's do (the short upper bowl folds inside past 16°, 8° once
    # slanted), and they carry part of the extra width's job, so the s takes 70% of it.
    # Regular's terminals also sit 14° further round, and its s is 4% wider: it carried 0.77x
    # Geist's and Inter's ink at 0.90x their width
    _S(g, p, p.nw * (0.92 - 0.04 * p.heavy) + _s_extra(p) * 0.7, p.xh, p.ov, run=34, run_up=8 if p.italic else 16, close=26)
    g.sb = (0.55, 0.55)


def _f_hook(p):
    """The f's width, stem position, hook end angle and hook radius."""
    w = p.cn * 0.47 + p.V * 1.69  # heavier stems need a wider f, or the hook has no room to turn
    xs = w * 0.28 + p.V * 0.1
    # size the hook so its terminal ends above the crossbar's end: a wider hook overhangs empty
    # space and opens a gap before the next letter ("def ault")
    # Heavier weights end the hook higher: near its tip the hook turns tighter than half a Black
    # stroke, and the inner edge folds into a pinhole. The angle stays in one quadrant, so the
    # outline structure (and master compatibility) is unchanged.
    end = 38 + 34 * p.heavy
    rx = (w * 0.96 - xs - p.V / 2) / (1 + math.cos(math.radians(end))) + p.V * 0.15
    return w, xs, end, rx


def _italic_descender(g, p, x):
    """Italic f, long s and sharp s: the stem at x runs below the baseline and hooks left under
    the preceding letter, the same size in all three. Returns the hook and the y where it meets
    the stem."""
    rx = _f_hook(p)[3]
    rxb, ryb = rx * 0.9, rx * 0.99
    cyb = p.desc + p.H / 2 + ryb
    return g.arc(x - rxb, cyb, rxb, ryb, -140, 0), cyb


@glyph('f', 0x66)
def _f(g, p):
    V, H = p.V, p.H
    w, xs, end, rx = _f_hook(p)
    ry = rx * 1.15
    top = p.asc + p.ov * 0.3
    cy = top - H / 2 - ry
    sx = xs + V / 2
    top_hook = g.arc(sx + rx, cy, rx, ry, 180, end)
    if p.italic:
        # the italic f descends and hooks left under the preceding letter
        hook, cyb = _italic_descender(g, p, sx)
        g.stroke(hook + [L((sx, cyb), (sx, cy))] + top_hook, caps=('b', 'b'))
        # heavier, the hook ran into the feet of x, y, k, r; and the arm, 9% tight at Bold, met a T
        g.sb = (-0.2 + 0.1 * p.heavy, 0.15 + 0.3 * p.heavy)
    else:
        g.stroke([L((sx, 0), (sx, cy))] + top_hook, caps=('b', 'b'))
        g.sb = (0.45, 0.2 + 0.4 * p.heavy)  # crossbar overhang, as for t (fo, ft sat 15% tighter than the references')
    g.hbar(0, w * 0.96, p.xh - H)
    g.ht = 'a'


@glyph('t', 0x74)
def _t(g, p):
    heavy = p.heavy
    # Heavy t's widen so the crossbar still reaches past the stem on the right.
    w = p.nw * (0.6 + 0.14 * heavy)
    V, H = p.V, p.H
    xs = w * 0.24 + V * 0.12
    g.hbar(0, w * 0.96, p.xh - H)
    # Stem and foot are one outline, drawn directly rather than as a stroke: a stroke turning a
    # corner tighter than half its width folds on the inside, and Geist's and Inter's heavy t
    # turns with an almost square inner corner. Every radius is a master parameter, so the same
    # points interpolate from Regular's round hook to Black's square foot.
    xl, xr = xs, xs + V  # stem edges
    yb = -p.ov * 0.4  # underside of the foot
    ytop = p.xh + (p.asc - p.xh) * 0.62
    hf = H * (1 - 0.1 * heavy)  # foot thickness at the corner
    yi = yb + hf  # top of the foot
    rx = w - xs - V * 0.4  # the Regular hook's centreline radius
    ri = (rx - V / 2) * (1 - 0.88 * heavy)  # inner corner: round at Regular, near square at Black
    xe = xr + V * (2.1 - 1.55 * heavy)  # end of the foot
    rise = hf * 0.25 * (1 - heavy)  # Regular's foot lifts a little toward its end, Black's is flat
    end_bot = yb + hf * 0.2 * (1 - heavy)
    roy = (rx * 0.9 + H / 2) * (1 - 0.45 * heavy)  # outer corner, up the stem
    rox = min(roy * 1.1, (xe - xl) * 0.7)  # outer corner, along the foot
    k = p.k
    inner_end = (xr + ri, yi)
    d = xe - inner_end[0]
    bot = (xl + rox, yb)
    db = xe - bot[0]
    contour = [
        L((xl, ytop), (xr, ytop)),
        L((xr, ytop), (xr, yi + ri)),
        ('C', (xr, yi + ri), (xr, yi + ri * (1 - k)), (xr + ri * (1 - k), yi), inner_end),
        ('C', inner_end, (inner_end[0] + d * 0.5, yi), (xe - d * 0.2, yi + rise), (xe, yi + rise)),
        L((xe, yi + rise), (xe, end_bot)),
        ('C', (xe, end_bot), (xe - db * 0.35, yb), (bot[0] + db * 0.3, yb), bot),
        ('C', bot, (xl + rox * (1 - k), yb), (xl, yb + roy * (1 - k)), (xl, yb + roy)),
        L((xl, yb + roy), (xl, ytop)),
    ]
    g.raw.append(orient(contour, outer=True))
    # the crossbar reaches left: 0.3 let it touch the stem before it at Black ("ht"). On the right,
    # Regular's foot lifts away from the next letter; Black's runs flat along the baseline and
    # touched a following z. The italic's z slants its baseline bar further under the t.
    # the italic t sat 15-25% looser than Inter's and Plex's on both sides, and Bold's left side
    # 15% looser in both styles. Where that brings a diagonal's foot against the crossbar at
    # Black, kerning opens the pair (kern.OWN_SHAPE_PAIRS).
    g.sb = ((0.4 - 0.3 * heavy) if p.italic else (0.55 - 0.25 * heavy), (0.05 + 0.25 * heavy) if p.italic else (0.25 + 0.2 * heavy))
    g.anchors['topright_x'] = xs + V + p.S * 0.4


@glyph('k', 0x6B)
def _k(g, p):
    w = p.nw * (0.94 + 0.08 * p.heavy)
    g.vstem(0, 0, p.asc)
    a0, a1 = g.diag(p.V / 2, p.xh * 0.3, w - 6, p.xh, 'c', 'r', ws=0.92, caps=('v', 'h'))
    t = 0.42
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    g.ht = 'a'
    g.sb = (1, 0.2)  # ke, ky sat 20% tighter than in Geist and Inter


@glyph('kgreenlandic', 0x138)
def _kra(g, p):
    w = p.nw * 0.94
    g.vstem(0, 0, p.xh)
    a0, a1 = g.diag(p.V / 2, p.xh * 0.3, w - 6, p.xh, 'c', 'r', ws=0.92, caps=('v', 'h'))
    t = 0.42
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    g.sb = (1, 0.1)


@glyph('v', 0x76)
def _v(g, p):
    w = p.nw * 1.10  # diagonals need room: v was 0.9x the references' width at Regular and Black
    g.diag(0, p.xh, w / 2, 0, 'l', 'c')
    g.diag(w, p.xh, w / 2, 0, 'r', 'c')
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 15% tighter beside round and straight letters
    g.sb = (0.25, 0.25)


@glyph('w', 0x77)
def _w(g, p):
    w = p.nw * 1.64  # v, w, x, y and z were 0.88-0.91x Geist's and Inter's width at Regular
    ws = 0.86
    g.diag(0, p.xh, w * 0.25, 0, 'l', 'c', ws=ws)
    g.diag(w / 2, p.xh, w * 0.25, 0, 'c', 'c', ws=ws)
    g.diag(w / 2, p.xh, w * 0.75, 0, 'c', 'c', ws=ws)
    g.diag(w, p.xh, w * 0.75, 0, 'r', 'c', ws=ws)
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 18% tighter beside round and straight letters
    g.sb = (0.36, 0.36)


@glyph('x', 0x78)
def _x(g, p):
    w = p.nw * 1.07
    g.diag(0, p.xh, w, 0, 'l', 'r', ws=0.93)
    g.diag(w, p.xh, 0, 0, 'r', 'l', ws=0.9)
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 12% tighter beside round and straight letters
    g.sb = (0.2, 0.2)


@glyph('y', 0x79)
def _y(g, p):
    w = p.nw * 1.10
    a = g.diag(w, p.xh, w * 0.36, p.desc, 'r', 'c', caps=('h', 'h'))
    if p.italic:  # the right stroke turns into a curved tail instead of a straight descender
        g.strokes.pop()
        (x0, y0), (x1, y1) = a
        d = math.hypot(x1 - x0, y1 - y0)
        ux, uy = (x1 - x0) / d, (y1 - y0) / d
        t = (p.desc * 0.15 - y0) / (y1 - y0)
        q = (x0 + (x1 - x0) * t, p.desc * 0.15)
        end = (w * 0.06, p.desc + p.H * 0.55)
        dist = math.hypot(q[0] - end[0], q[1] - end[1])
        tail = ('C', q, (q[0] + ux * dist * 0.45, q[1] + uy * dist * 0.45), (end[0] + dist * 0.4, end[1]), end)
        g.stroke([L(a[0], q), tail], caps=('h', 'b'), ws=0.93)
    # the left arm ends below the baseline, on the right stroke's centreline: a cut exactly at
    # the baseline leaves its corner showing at heavy weights
    yj = -p.H * 0.5
    g.diag(0, p.xh, on_line(*a, yj), yj, 'l', 'c', caps=('h', 'b'))
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 20% on the left, tighter beside round and straight letters
    g.sb = (0.42, 0.25)


@glyph('z', 0x7A)
def _z(g, p):
    w = p.nw * 0.95
    g.hbar(w * 0.04, w * 0.98, p.xh - p.H).hbar(0, w, 0)
    g.diag(w * 0.98, p.xh - p.H / 2, 0, p.H / 2, 'r', 'l', ws=0.95)
    # the italic's baseline bar slants out under the next letter: heavy, it met X and A
    g.sb = (0.35, 0.35 + (0.4 if p.italic else 0) * p.heavy)


# ============================================================================================
# Figures (tabular by default: one advance for all ten)
# ============================================================================================


def fw(p):
    return p.fig_adv - 2 * p.S * 0.62


@glyph('zero', 0x30)
def _zero(g, p):
    g.oval(0, -p.ov, fw(p) * 0.98, p.cap + p.ov)
    g.tab = True
    g.ht = 'c'


@glyph('zero.slash')
def _zero_slash(g, p):
    w = fw(p) * 0.98
    g.oval(0, -p.ov, w, p.cap + p.ov)
    g.line((w * 0.22, p.cap * 0.2), (w * 0.78, p.cap * 0.8), ws=0.7, caps=('b', 'b'))
    g.tab = True
    g.ht = 'c'


@glyph('one', 0x31)
def _one(g, p):
    w = fw(p)
    xs = w * 0.55
    g.vstem(xs - p.V / 2, 0, p.cap)
    g.diag(xs, p.cap - p.H * 0.4, w * 0.12, p.cap * 0.74, 'c', 'c', ws=0.82, caps=('b', 'b'))
    g.tab = True
    g.ht = 'c'


@glyph('two', 0x32)
def _two(g, p):
    w = fw(p)
    V, H = p.V, p.H
    cx, cy, rx, ry = g.box(w * 0.03, p.cap * 0.42, w, p.cap + p.ov)
    end = -38
    arc_ = g.arc(cx, cy, rx, ry, 158 - p.ap, end)
    pe = arc_[-1][-1]
    tx, ty = arc_[-1][-1][0] - arc_[-1][-2][0], arc_[-1][-1][1] - arc_[-1][-2][1]
    t = norm((tx, ty))
    tgt = (g.hw(-0.12, -0.3), H)  # outer edge of the foot lands exactly on the bar's start
    d = math.hypot(tgt[0] - pe[0], tgt[1] - pe[1])
    spine = ('C', pe, (pe[0] + t[0] * d * 0.35, pe[1] + t[1] * d * 0.35), (tgt[0] + d * 0.12, tgt[1] + d * 0.3), tgt)
    g.stroke(arc_ + [spine], caps=('b', 'h'))  # the spine's foot joins the base bar; only the top is a terminal
    g.hbar(0, w, 0)
    g.tab = True
    g.ht = 'c'


@glyph('three', 0x33)
def _three(g, p):
    # wider than the other figures, or its bowls pinch: Black's 3 was 0.80x Geist's and Inter's
    # width, Regular's 0.90x
    w = fw(p) * (1.06 + 0.02 * p.heavy)
    H = p.H
    ym = p.cap * 0.56
    cxu, cyu, rxu, ryu = g.box(w * 0.06, ym - H / 2, w * 0.95, p.cap + p.ov)
    cxl, cyl, rxl, ryl = g.box(0, -p.ov, w, ym + H / 2)
    # terminals sit 10° further round than they first did at every weight (Regular's 3 was open
    # and light, 0.86x the references' ink)
    g.stroke(g.arc(cxu, cyu, rxu, ryu, 162 - p.ap, -90), caps=('b', 'b'), cut='h')
    # the bar starts where the bowls end; heavier, its square left end stuck out as a spur
    g.hbar(w * 0.36 + (cxu - w * 0.36) * 0.5 * p.heavy, cxu + 2, ym - H / 2)
    g.stroke(g.arc(cxl, cyl, rxl, ryl, 90, -160 + p.ap), caps=('b', 'b'), cut='h')
    g.tab = True
    g.ht = 'c'


@glyph('four', 0x34)
def _four(g, p):
    w = fw(p)
    V, H = p.V, p.H
    # heavy 4 drops its bar and lightens its diagonal, or the counter closes (Black: 0.29x)
    # Regular sits its stem further right and its bar lower too: its counter was 0.73x Geist's
    # and Inter's, and 0.65x Inter's and Plex's in the italic (Black is unchanged)
    xs = w * (0.79 if p.italic else 0.77)  # the slanted triangle runs smaller
    yb = p.cap * (0.23 - 0.05 * p.heavy)
    g.vstem(xs - V / 2, 0, p.cap)
    g.hbar(0, w, yb)
    # heavier, the diagonal meets the stem's middle rather than its right edge, opening the counter
    g.diag(xs + V / 2 - V * 0.5 * p.heavy, p.cap, 0, yb + H / 2, 'r', 'l', ws=0.9 - 0.15 * p.heavy, caps=('h', 'h'))
    g.tab = True
    g.ht = 'c'


@glyph('five', 0x35)
def _five(g, p):
    w = fw(p)
    V, H = p.V, p.H
    xl = w * 0.1
    g.hbar(xl + 10, w * 0.93, p.cap - H)  # from the stem's own left edge: a square corner
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap * 0.63)
    # The bowl starts exactly under the stem, so the stem ends flat on it. With the bowl fixed at
    # 150° and the stem at its own x, the stem's corner stuck out beside the bowl's start: a
    # small step at Regular, a large one at Black. The angle stays in one quadrant.
    xsm = xl + V / 2
    a0 = math.degrees(math.acos(max(-1.0, min(1.0, (xsm - cx) / rx))))
    ps = (cx + rx * math.cos(math.radians(a0)), cy + ry * math.sin(math.radians(a0)))
    g.line((xsm + 10, p.cap - H / 2), ps, caps=('h', 'h'))
    g.stroke(g.arc(cx, cy, rx, ry, a0, -150 + p.ap - 10 * p.heavy), taper=(0.6, 1), caps=('h', 'b'), cut='h')
    g.tab = True
    g.ht = 'c'


@glyph('six', 0x36)
def _six(g, p):
    w = fw(p)
    _six_strokes(g, p, w)
    g.tab = True
    g.ht = 'c'


def _six_strokes(g, p, w):
    V = p.V
    # a taller bowl and, at Regular, a hook running further round: the 6 and 9 carried 0.88x
    # Geist's and Inter's ink at every weight, and Black's counter was 0.80x theirs. Black's hook
    # is drawn on a wider ellipse, so it can end lower without its inner edge folding: ending at
    # 72° on the narrow one, it tapered to a point
    top = p.cap * 0.63
    g.oval(0, -p.ov, w, top)
    cx, cy, rx, ry = g.box(0, -p.ov, w * (1.02 + 0.15 * p.heavy), p.cap + p.ov)
    cyb = (-p.ov + top) / 2
    g.stroke([L((cx - rx, cyb), (cx - rx, cy))] + g.arc(cx, cy, rx, ry, 180, 44 + 14 * p.heavy + p.ap * 0.5), caps=('b', 'b'), cut='h')  # heavy terminals end higher, so the cut trims little and Bold, between the masters, has no dip
    del V


@glyph('nine', 0x39)
def _nine(g, p):
    w = fw(p)
    _six_strokes(g, p, w)
    cap = p.cap
    g.strokes = [s.transformed(lambda q: (w - q[0], cap - q[1])) for s in g.strokes]
    if p.italic:  # the slant is not symmetric under the 180° turn: the 9's tail takes the flat cut badly
        for s in g.strokes:
            s.cut = 'v'
    g.tab = True
    g.ht = 'c'


@glyph('seven', 0x37)
def _seven(g, p):
    w = fw(p)
    g.hbar(0, w, p.cap - p.H)
    g.diag(w, p.cap - p.H / 2, w * 0.3, 0, 'r', 'c', ws=0.95, caps=('b', 'h'))
    g.tab = True
    g.ht = 'c'


@glyph('eight', 0x38)
def _eight(g, p):
    w = fw(p)
    ym = p.cap * 0.55
    g.oval(w * 0.06, ym - p.H, w * 0.94, p.cap + p.ov)
    g.oval(0, -p.ov, w, ym)
    g.tab = True
    g.ht = 'c'


# ============================================================================================
# Punctuation & symbols
# ============================================================================================


@glyph('space', 0x20)
def _space(g, p):
    g.adv_fixed = round(p.S * 2 + 128)


@glyph('nbspace', 0xA0)
def _nbsp(g, p):
    g.adv_fixed = round(p.S * 2 + 128)


@glyph('period', 0x2E)
def _period(g, p):
    g.dot(p.dot / 2, 0)
    g.sb = (0.9, 0.9)


def comma_depth(p):
    # in dots; Black's tail ran 1.7x as deep as Geist's and Inter's
    return 1.15 - 0.3 * p.heavy


def comma_shape(g, d, x, top, depth):
    """A grotesque comma: a square head one dot wide, then a tail that curves down and to the
    left and tapers. Every curly quote is built from this (’ ” raised, ‘ “ turned), so the
    curve is what tells them apart from the straight ' and ". A straight wedge read as ″."""
    neck = top - d * 0.95
    end = (x - d * 0.6, neck - depth)
    tail = ('C', (x, neck), (x, neck - depth * 0.45), (x - d * 0.12, neck - depth * 0.8), end)
    g.stroke([L((x, top), (x, neck)), tail], w=d, taper=(1, 0.15), caps=('b', 'b'))


@glyph('comma', 0x2C)
def _comma(g, p):
    d = p.dot
    comma_shape(g, d, d / 2, d, d * comma_depth(p))
    g.sb = (0.9, 0.9)


@glyph('quotesingle', 0x27)
def _quotesingle(g, p):
    g.line((p.V / 2, p.cap), (p.V / 2, p.cap * 0.66), w=p.V * 0.95, taper=(1, 0.8))
    g.sb = (0.9, 0.9)
    g.ht = 'c'


@glyph('quotedbl', 0x22)
def _quotedbl(g, p):
    gap = p.V * 0.95 + 60
    for x in (p.V / 2, p.V / 2 + gap):
        g.line((x, p.cap), (x, p.cap * 0.66), w=p.V * 0.95, taper=(1, 0.8))
    g.sb = (0.9, 0.9)
    g.ht = 'c'


@glyph('exclam', 0x21)
def _exclam(g, p):
    d = p.dot
    g.line((d / 2, p.cap), (d / 2, p.cap * 0.27), w=p.V * 1.04, taper=(1, 0.78))
    g.dot(d / 2, 0)
    g.sb = (1, 1)
    g.ht = 'c'


@glyph('question', 0x3F)
def _question(g, p):
    w = p.Hw * (0.78 + 0.14 * p.heavy)  # the heavy hook needs width to keep its counter
    V, H = p.V, p.H
    d = p.dot
    xm = w * 0.47
    # The hook ends a fixed gap above the dot (Black's dot is 227 tall and reached it), and its
    # bowl rises with that end, or the tail runs out flat and turns to a point.
    tgt = (xm, max(p.cap * 0.27, p.dot + p.cap * 0.07))
    cx, cy, rx, ry = g.box(0, tgt[1] + p.cap * (0.15 - 0.03 * p.heavy), w, p.cap + p.ov)
    arc_ = g.arc(cx, cy, rx, ry, 160 - p.ap, -55)
    pe = arc_[-1][-1]
    g.stroke(arc_ + [('C', pe, (pe[0] - 30, pe[1] - 25), (tgt[0], tgt[1] + 60), tgt)], caps=('b', 'b'))
    g.dot(xm, 0)
    del V, H, d
    g.sb = (0.55, 0.6)
    g.ht = 'c'


@glyph('hyphen', 0x2D, 0xAD)
def _hyphen(g, p):
    w = 270 + p.V * 0.3  # Regular's was 0.70x as long as Geist's and Inter's; Black's is kept
    g.hbar(0, w, p.xh * 0.5 - p.H * 0.55, h=p.H * 1.1)
    g.sb = (0.55, 0.55)


@glyph('endash', 0x2013)
def _endash(g, p):
    g.hbar(0, 500, p.xh * 0.5 - p.H * 0.55, h=p.H * 1.1)
    g.sb = (0.0, 0.0)


@glyph('emdash', 0x2014)
def _emdash(g, p):
    g.hbar(0, 1000, p.xh * 0.5 - p.H * 0.55, h=p.H * 1.1)
    g.sb = (0.0, 0.0)


@glyph('underscore', 0x5F)
def _underscore(g, p):
    g.hbar(0, 500, -120 - p.H, h=p.H)
    g.sb = (0, 0)


def _mathy(p):
    """Shared geometry for + − × ÷ = ± so operators align: centred on the figure middle."""
    w = p.fig_adv - 2 * p.S * 0.7
    return w, p.cap * 0.42, max(p.H * 0.95, 20)


@glyph('plus', 0x2B)
def _plus(g, p):
    w, cy, t = _mathy(p)
    g.hbar(0, w, cy - t / 2, h=t)
    g.line((w / 2, cy - w / 2), (w / 2, cy + w / 2), w=t)
    g.tab = True


@glyph('minus', 0x2212)
def _minus(g, p):
    w, cy, t = _mathy(p)
    g.hbar(0, w, cy - t / 2, h=t)
    g.tab = True


@glyph('equal', 0x3D)
def _equal(g, p):
    w, cy, t = _mathy(p)
    gap = w * 0.17 + t / 2
    g.hbar(0, w, cy - gap - t / 2, h=t).hbar(0, w, cy + gap - t / 2, h=t)
    g.tab = True


@glyph('multiply', 0xD7)
def _multiply(g, p):
    w, cy, t = _mathy(p)
    r = w * 0.36
    c = w / 2
    g.line((c - r, cy - r), (c + r, cy + r), w=t, caps=('b', 'b'))
    g.line((c - r, cy + r), (c + r, cy - r), w=t, caps=('b', 'b'))
    g.tab = True


@glyph('divide', 0xF7)
def _divide(g, p):
    w, cy, t = _mathy(p)
    d = p.dot * 0.95
    g.hbar(0, w, cy - t / 2, h=t)
    g.dot(w / 2, cy + t / 2 + w * 0.12, d)
    g.dot(w / 2, cy - t / 2 - w * 0.12 - d, d)
    g.tab = True


@glyph('plusminus', 0xB1)
def _plusminus(g, p):
    w, cy, t = _mathy(p)
    cy += w * 0.12
    g.hbar(0, w, cy - t / 2, h=t)
    g.line((w / 2, cy - w * 0.4), (w / 2, cy + w * 0.4), w=t)
    g.hbar(0, w, cy - w * 0.4 - t * 1.9, h=t)
    g.tab = True


@glyph('less', 0x3C)
def _less(g, p):
    w, cy, t = _mathy(p)
    h = w * 0.42
    g.line((w, cy + h), (0, cy), w=t, caps=('b', 'b'))
    g.line((0, cy), (w, cy - h), w=t, caps=('b', 'b'))
    g.tab = True


@glyph('greater', 0x3E)
def _greater(g, p):
    w, cy, t = _mathy(p)
    h = w * 0.42
    g.line((0, cy + h), (w, cy), w=t, caps=('b', 'b'))
    g.line((w, cy), (0, cy - h), w=t, caps=('b', 'b'))
    g.tab = True


@glyph('logicalnot', 0xAC)
def _not(g, p):
    w, cy, t = _mathy(p)
    g.hbar(0, w, cy, h=t)
    g.line((w - t / 2, cy + t), (w - t / 2, cy - w * 0.28), w=t)
    g.tab = True


@glyph('asciitilde', 0x7E)
def _tilde_ascii(g, p):
    w, cy, t = _mathy(p)
    a = w * 0.14  # a deeper wave: it was 0.67x the references' height
    m = w * 0.08 * p.heavy  # heavy weights draw it shorter: Black's ran 1.3x as wide
    g.stroke([('C', (m, cy - a), (m + (w - 2 * m) * 0.2, cy + a * 2.6), (w - m - (w - 2 * m) * 0.2, cy - a * 2.6), (w - m, cy + a))], w=t)
    g.tab = True


@glyph('asciicircum', 0x5E)
def _asciicircum(g, p):
    w, cy, t = _mathy(p)
    # a raised caret, not a full-height chevron: it was 1.5x Geist's and Inter's size
    x0, x1 = w * (0.17 + 0.08 * p.heavy), w * (0.83 - 0.08 * p.heavy)
    g.line((x0, p.cap * 0.55), (w / 2, p.cap * 0.93), w=t, caps=('h', 'b'))
    g.line((x1, p.cap * 0.55), (w / 2, p.cap * 0.93), w=t, caps=('h', 'b'))
    g.ht = 'c'
    g.tab = True


@glyph('slash', 0x2F)
def _slash(g, p):
    w = p.cap * 0.42
    g.diag(0, p.desc * 0.6, w, p.cap, 'l', 'r', ws=0.8)
    g.sb = (0.15, 0.15)


@glyph('backslash', 0x5C)
def _backslash(g, p):
    w = p.cap * 0.42
    g.diag(0, p.cap, w, p.desc * 0.6, 'l', 'r', ws=0.8)
    g.sb = (0.15, 0.15)


@glyph('bar', 0x7C)
def _bar(g, p):
    g.line((p.V * 0.45, p.desc), (p.V * 0.45, p.asc + 30), w=p.V * 0.9)
    g.sb = (1.1, 1.1)


@glyph('brokenbar', 0xA6)
def _brokenbar(g, p):
    x = p.V * 0.45
    g.line((x, p.desc), (x, p.xh * 0.3), w=p.V * 0.9)
    g.line((x, p.xh * 0.62), (x, p.asc + 30), w=p.V * 0.9)
    g.sb = (1.1, 1.1)


def _paren(g, p, flip):
    h0, h1 = p.desc + 20, p.asc + 40
    cy = (h0 + h1) / 2
    ry = (h1 - h0) / 2
    rx = 150 + p.V * 0.2
    cx = rx + p.V / 2
    segs = g.arc(cx, cy, rx, ry, 122, 238, k=0.56)
    s = Stroke(segs, caps=('h', 'h'), ws=0.92)
    if flip:
        s = s.transformed(lambda q: (-q[0], q[1]))
    g.strokes.append(s)
    g.sb = (0.75, 0.3) if not flip else (0.3, 0.75)


@glyph('parenleft', 0x28)
def _parenleft(g, p):
    _paren(g, p, False)


@glyph('parenright', 0x29)
def _parenright(g, p):
    _paren(g, p, True)


def _bracket(g, p, flip):
    h0, h1 = p.desc + 20, p.asc + 40
    w = 120 + p.V * 0.8
    pts = [(0, h0), (0, h1)]
    s1 = Stroke([L((p.V / 2, h0), (p.V / 2, h1))])
    s2 = Stroke([L((p.V / 2, h1 - p.H / 2), (w, h1 - p.H / 2))])
    s3 = Stroke([L((p.V / 2, h0 + p.H / 2), (w, h0 + p.H / 2))])
    del pts
    for s in (s1, s2, s3):
        g.strokes.append(s.transformed(lambda q: (-q[0], q[1])) if flip else s)
    g.sb = (0.8, 0.3) if not flip else (0.3, 0.8)


@glyph('bracketleft', 0x5B)
def _bracketleft(g, p):
    _bracket(g, p, False)


@glyph('bracketright', 0x5D)
def _bracketright(g, p):
    _bracket(g, p, True)


def _brace(g, p, flip):
    V, H = p.V, p.H
    h0, h1 = p.desc + 20, p.asc + 40
    cy = (h0 + h1) / 2
    x = 70 + V * 0.5
    r = 110 + V * 0.3  # at 60 + 0.2 V the braces were half as wide as Geist's and Inter's
    xs = x + V / 2 * 0.0
    up = [L((xs + r, h1 - H / 2), (xs + r * 0.98, h1 - H / 2))]
    del up
    s_top = Stroke(g.arc(xs + r, h1 - H / 2 - r, r, r, 90, 180) + [L((xs, h1 - H / 2 - r), (xs, cy + r))] + g.arc(xs - r, cy + r, r, r, 0, -90), ws=0.9)
    s_bot = Stroke(g.arc(xs - r, cy - r, r, r, 90, 0) + [L((xs, cy - r), (xs, h0 + H / 2 + r))] + g.arc(xs + r, h0 + H / 2 + r, r, r, 180, 270), ws=0.9)
    for s in (s_top, s_bot):
        g.strokes.append(s.transformed(lambda q: (-q[0], q[1])) if flip else s)
    g.sb = (0.5, 0.4) if not flip else (0.4, 0.5)


@glyph('braceleft', 0x7B)
def _braceleft(g, p):
    _brace(g, p, False)


@glyph('braceright', 0x7D)
def _braceright(g, p):
    _brace(g, p, True)


@glyph('numbersign', 0x23)
def _numbersign(g, p):
    w = p.fig_adv - 2 * p.S * 0.6
    t = p.H * 0.95
    top = p.cap * 0.95
    for x in (w * 0.3, w * 0.68):
        g.line((x + 30, top), (x - 30, 0), w=p.V * 0.85, caps=('h', 'h'))
    g.hbar(0, w, p.cap * 0.62 - t / 2, h=t).hbar(0, w, p.cap * 0.3 - t / 2, h=t)
    g.tab = True
    g.ht = 'c'


@glyph('dollar', 0x24)
def _dollar(g, p):
    w = fw(p) * 0.98
    # a bar through an S on a tabular width: both thin with weight, or the Black $ fills in
    k = 1 - 0.2 * p.heavy
    _S(g, p, w, p.cap, p.ov, pen=(p.V * k, p.H * k))
    g.line((w * 0.52, -p.ov - 90), (w * 0.52, p.cap + p.ov + 90), w=p.V * 0.72 * k)
    g.tab = True
    g.ht = 'c'


@glyph('percent', 0x25)
def _percent(g, p):
    w = p.Hw * 1.2
    pen = (p.V * 0.82, p.H * 0.82)
    g.oval(0, p.cap * 0.5, w * 0.36, p.cap + p.ov * 0.6, V=pen[0], H=pen[1])
    g.oval(w * 0.64, -p.ov * 0.6, w, p.cap * 0.5, V=pen[0], H=pen[1])
    g.diag(w * 0.82, p.cap, w * 0.18, 0, 'c', 'c', ws=0.8)
    g.sb = (0.5, 0.5)
    g.ht = 'c'


@glyph('ampersand', 0x26)
def _ampersand(g, p):
    w = p.Hw * 1.1
    V = p.V
    top = p.cap + p.ov
    # upper loop: a closed oval sitting left of centre
    lx0, lx1, ly0 = w * 0.1, w * 0.6, p.cap * 0.58
    g.oval(lx0, ly0, lx1, top)
    # the loop's own centreline: oval() caps its pen for small rings, so a box with the full pen
    # put the leg's start inside the counter
    Vo, Ho = min(V, (lx1 - lx0) * 0.33), min(p.H, (top - ly0) * 0.33)
    cx, cy, rx, ry = g.box(lx0, ly0, lx1, top, Vo, Ho)
    # leg: leaves the loop's lower left where it runs tangent to the loop, so its square start
    # lies buried in the loop's own stroke. Started inside the loop, it poked into the small
    # counter of heavy weights.
    foot = (w - V * 0.55, 0)

    def off_tangent(a):
        t = math.radians(a)
        px, py = cx + rx * math.cos(t), cy + ry * math.sin(t)
        tx, ty = -rx * math.sin(t), ry * math.cos(t)
        return tx * (foot[1] - py) - ty * (foot[0] - px)

    lo, hi = 185.0, 265.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if (off_tangent(mid) > 0) == (off_tangent(lo) > 0):
            lo = mid
        else:
            hi = mid
    t = math.radians(lo)
    start = (cx + rx * math.cos(t), cy + ry * math.sin(t))
    # the leg is wider than the capped loop, so it starts at the loop's width and widens toward
    # the foot: started at full width, one corner of its square end poked into the counter
    d = norm((foot[0] - start[0], foot[1] - start[1]))
    k0 = min(1.0, pen_thickness(d, Vo, Ho) / (pen_thickness(d, V, p.H) * 0.96))
    g.line(start, foot, ws=0.96, caps=('b', 'h'), taper=(k0, 1))
    # lower bowl: from under the loop, round the bottom, and on into the arm in one stroke. A
    # separate arm met the bowl end to end at an angle and showed as a broken wedge at Black.
    bx0, bx1 = 0, w * 0.86
    bcx, bcy, brx, bry = g.box(bx0, -p.ov, bx1, p.cap * 0.64)
    bowl = g.arc(bcx, bcy, brx, bry, 62, 340)
    e = bowl[-1][-1]
    # the arm rises steeply and ends on a flat cut, as in Geist and Inter: run out at a shallow
    # angle, it ended in a long flag at heavy weights
    arm = (w - V * 0.4, p.cap * 0.5)
    d = math.hypot(arm[0] - e[0], arm[1] - e[1])
    t = math.radians(340)
    tx, ty = -brx * math.sin(t), bry * math.cos(t)
    tl = math.hypot(tx, ty)
    swing = ('C', e, (e[0] + tx / tl * d * 0.4, e[1] + ty / tl * d * 0.4), (arm[0] - V * 0.1, arm[1] - d * 0.35), arm)
    g.stroke(bowl + [swing], caps=('b', 'h'), taper=(0.7, 1))
    g.sb = (0.55, 0.12)
    g.ht = 'c'


@glyph('asterisk', 0x2A)
def _asterisk(g, p):
    r = 176  # Regular's was 0.78x the references' size, and sat high; Black's 0.94x
    cy = p.cap - r
    c = r
    for ang in (90, 18, -54, -126, 162):
        a = math.radians(ang)
        g.line((c, cy), (c + r * math.cos(a), cy + r * math.sin(a)), w=p.V * (0.82 - 0.22 * p.heavy), caps=('b', 'b'))  # Black's filled in
    g.sb = (0.45, 0.45)
    g.ht = 'c'


@glyph('at', 0x40)
def _at(g, p):
    w = p.Hw * 1.45
    pen = (min(p.V * 0.8, w * 0.13), min(p.H * 0.8, w * 0.11))  # @ is mostly counter: cap the pen at heavy weights
    cx, cy, rx, ry = g.box(0, p.desc * 0.7, w, p.cap + p.ov, V=pen[0], H=pen[1])
    xs = w * 0.7
    # inner bowl
    g.oval(w * 0.3, p.cap * 0.12, xs + pen[0] / 2, p.cap * 0.72, V=pen[0], H=pen[1])
    # stem continuing into the outer ring
    r = (cx + rx - xs) / 2
    yb = p.cap * 0.12 + r + 6
    tail = [L((xs, p.cap * 0.72), (xs, yb))] + g.arc(xs + r, yb, r, r, 180, 360) + [L((cx + rx, yb), (cx + rx, cy))]
    outer = g.arc(cx, cy, rx, ry, 0, 300)
    g.stroke(tail + outer, pen=pen, caps=('b', 'b'))
    g.sb = (0.55, 0.55)
    g.ht = 'c'


@glyph('bullet', 0x2022)
def _bullet(g, p):
    # Regular's was 0.64x Geist's and Inter's size; Black's 0.86x
    d = p.dot * 1.5 * (1.5 - 0.3 * p.heavy)
    # a solid disc, drawn directly: as an oval stroke, the pen cap that keeps small rings open
    # left it a ring
    g.raw.append(orient(g.arc(d / 2, p.xh * 0.5, d / 2, d / 2, 90, 450), outer=True))
    g.sb = (0.8, 0.8)


@glyph('periodcentered', 0xB7)
def _periodcentered(g, p):
    g.dot(p.dot / 2, p.xh * 0.5 - p.dot / 2)
    g.sb = (0.9, 0.9)


@glyph('degree', 0xB0)
def _degree(g, p):
    d = 225 + p.V * 0.75  # 0.61-0.68x the references' size, at every weight
    t = min(p.V * 0.72, d * 0.24)
    g.oval(0, p.cap - d, d, p.cap, V=t, H=t)
    g.sb = (0.6, 0.6)
    g.ht = 'c'


@glyph('ring.circle')
def _circle(g, p):
    _ring_circle(g, p, 1.0)


@glyph('ring.circle.small')
def _circle_small(g, p):
    _ring_circle(g, p, 0.68)  # (R)'s: a raised mark, drawn small at the full stroke rather than scaled down


def _ring_circle(g, p, k):
    d = (p.cap + 90) * k
    t = p.V * (0.62 + 0.25 * (1 - p.heavy)) + 6  # (C) and (R) carried 0.6x Inter's and Geist's ink at Regular
    if k < 1:
        t *= 1 - 0.25 * p.heavy  # small, a Black ring fills in
    y0 = (p.cap + 41 if k == 1 else p.cap + 8) - d
    g.oval(0, y0, d, y0 + d, V=t, H=t)
    g.sb = (0.6, 0.6)
    g.ht = 'c'


@glyph('currency', 0xA4)
def _currency(g, p):
    w, cy, t = _mathy(p)
    r = w * 0.32
    c = w / 2
    g.oval(c - r, cy - r, c + r, cy + r, V=t, H=t)
    for dx, dy in ((-1, 1), (1, 1), (-1, -1), (1, -1)):
        g.line((c + dx * r * 0.7, cy + dy * r * 0.7), (c + dx * r * 1.45, cy + dy * r * 1.45), w=t, caps=('b', 'b'))
    g.tab = True


@glyph('cent', 0xA2)
def _cent(g, p):
    w = fw(p) * 0.92
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov + 40)
    g.stroke(g.arc(cx, cy, rx, ry, 30 + p.ap, 330 - p.ap), caps=('b', 'b'), cut='h')  # as c
    g.line((w * 0.53, -110), (w * 0.53, p.xh + 150), w=p.V * 0.72)
    g.tab = True


@glyph('sterling', 0xA3)
def _sterling(g, p):
    w = fw(p)
    V, H = p.V, p.H
    xs = w * 0.24
    rx = (w * 0.9 - xs - V / 2) / 2
    ry = rx * 1.05
    cy = p.cap + p.ov - H / 2 - ry
    g.stroke([L((xs + V / 2, H), (xs + V / 2, cy))] + g.arc(xs + V / 2 + rx, cy, rx, ry, 180, 18), caps=('b', 'b'))
    g.hbar(0, w, 0)
    g.hbar(0, w * 0.68, p.cap * 0.43 - H / 2)
    g.tab = True
    g.ht = 'c'


@glyph('yen', 0xA5)
def _yen(g, p):
    w = fw(p)
    c = w / 2
    yj = p.cap * 0.42
    g.diag(0, p.cap, c, yj, 'l', 'c', ws=0.9)
    g.diag(w, p.cap, c, yj, 'r', 'c', ws=0.9)
    g.vstem(c - p.V / 2, 0, yj + 2)
    g.hbar(w * 0.12, w * 0.88, p.cap * 0.32 - p.H / 2, h=p.H * 0.9)
    g.hbar(w * 0.12, w * 0.88, p.cap * 0.14 - p.H / 2, h=p.H * 0.9)
    g.tab = True
    g.ht = 'c'


@glyph('Euro', 0x20AC)
def _euro(g, p):
    w = fw(p)
    # the full figure width, and bars at the full horizontal: it was 0.72x as wide as Geist's and
    # Inter's, and 0.8x their ink
    cx, cy, rx, ry = g.box(w * 0.04, -p.ov, w * 1.1, p.cap + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 46, 314), caps=('b', 'b'))
    g.hbar(-w * 0.12, w * 0.72, p.cap * 0.56 - p.H / 2, h=p.H)
    g.hbar(-w * 0.12, w * 0.66, p.cap * 0.38 - p.H / 2, h=p.H)
    g.tab = True
    g.ht = 'c'


@glyph('section', 0xA7)
def _section(g, p):
    w = p.nw * 0.9
    pen = (p.V * 0.78, p.H * 0.78)
    _S(g, p, w, p.cap * 0.66, p.ov, pen)
    s2 = []
    for s in g.strokes:
        s2.append(s.transformed(lambda q: (q[0], q[1] - p.cap * 0.1)))
    g.strokes = []
    _S(g, p, w, p.cap * 0.66, p.ov, pen)
    g.strokes = [s.transformed(lambda q: (q[0], q[1] + p.cap * 0.34)) for s in g.strokes] + s2
    g.sb = (0.6, 0.6)
    g.ht = 'c'


@glyph('paragraph', 0xB6)
def _paragraph(g, p):
    w = p.Hw * 0.82
    V = p.V
    x1 = w - V / 2
    x0 = x1 - V * 1.5 - 70
    g.line((x0, p.desc * 0.6), (x0, p.cap), w=V * 0.8)
    g.line((x1, p.desc * 0.6), (x1, p.cap), w=V * 0.8)
    g.hbar(x0 - 20, x1 + V * 0.4, p.cap - p.H)
    # solid bowl: an oval penned so thick it closes on itself
    top, bot = p.cap, p.cap * 0.42
    r = (top - bot) / 2
    g.line((x0 - r * 0.55, bot + r), (x0, bot + r), w=top - bot, caps=('b', 'b'))
    g.oval(x0 - r * 1.15, bot, x0 + 2, top, V=r * 1.15, H=r)
    g.sb = (0.6, 1)
    g.ht = 'c'


@glyph('ellipsis', 0x2026)
def _ellipsis(g, p):
    gap = p.dot + p.S * 1.4
    for i in range(3):
        g.dot(p.dot / 2 + i * gap, 0)
    g.sb = (0.9, 0.9)


def _guil(g, p, x0, flip, h=1.0):
    # Regular's were 0.8x the references' size, Black's 0.88x and cramped
    w = 160 + p.V * 0.45
    hh = p.xh * 0.31 * h
    cy = p.xh * 0.5
    tip = x0 if not flip else x0 + w
    back = x0 + w if not flip else x0
    t = p.V * (0.9 - 0.12 * p.heavy)  # at the full stem, Black's chevrons ran into each other
    g.line((back, cy + hh), (tip, cy), ws=0.86, caps=('b', 'b'), w=t)
    g.line((tip, cy), (back, cy - hh), ws=0.86, caps=('b', 'b'), w=t)
    return w


@glyph('guilsinglleft', 0x2039)
def _guilsinglleft(g, p):
    _guil(g, p, 0, False)
    g.sb = (0.5, 0.5)


@glyph('guilsinglright', 0x203A)
def _guilsinglright(g, p):
    _guil(g, p, 0, True)
    g.sb = (0.5, 0.5)


@glyph('guillemotleft', 0xAB)
def _guillemotleft(g, p):
    w = _guil(g, p, 0, False)
    _guil(g, p, w * 0.8 + p.V * 0.5, False)
    g.sb = (0.5, 0.5)


@glyph('guillemotright', 0xBB)
def _guillemotright(g, p):
    w = _guil(g, p, 0, True)
    _guil(g, p, w * 0.8 + p.V * 0.5, True)
    g.sb = (0.5, 0.5)


def _arrow(g, p, rot):
    w, cy, t = _mathy(p)
    w = w * 1.25
    c = (w / 2, cy)
    h = w * 0.36
    segs = [((0, cy), (w, cy)), ((w - h, cy + h), (w, cy)), ((w, cy), (w - h, cy - h))]
    for a, b in segs:
        s = Stroke([L(a, b)], w=t, caps=('b', 'b'))
        if rot:
            ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
            s = s.transformed(lambda q: (c[0] + (q[0] - c[0]) * ca - (q[1] - c[1]) * sa, c[1] + (q[0] - c[0]) * sa + (q[1] - c[1]) * ca))
        g.strokes.append(s)
    g.tab = True


@glyph('arrowright', 0x2192)
def _arrowright(g, p):
    _arrow(g, p, 0)


@glyph('arrowup', 0x2191)
def _arrowup(g, p):
    _arrow(g, p, 90)


@glyph('arrowleft', 0x2190)
def _arrowleft(g, p):
    _arrow(g, p, 180)


@glyph('arrowdown', 0x2193)
def _arrowdown(g, p):
    _arrow(g, p, 270)


@glyph('fraction', 0x2044)
def _fraction(g, p):
    w = p.cap * 0.5
    g.diag(0, 0, w, p.cap, 'l', 'r', ws=0.75)
    g.sb = (-0.9, -0.9)
    g.ht = 'c'


# ============================================================================================
# Special letters
# ============================================================================================


@glyph('germandbls', 0xDF)
def _germandbls(g, p):
    w = p.nw * 1.02
    V, H = p.V, p.H
    a = V / 2
    ym = p.xh * 0.9
    rx = (w * 0.86 - a) / 2
    ry = (p.asc + p.ov * 0.4 - ym) / 2
    cy = p.asc + p.ov * 0.4 - H / 2 - ry
    top = g.arc(a + rx, cy, rx, ry, 180, -90) + [L((a + rx, cy - ry), (w * 0.4, cy - ry))]
    if p.italic:  # the long-s half descends, as in the italic f and long s
        hook, cyb = _italic_descender(g, p, a)
        g.stroke(hook + [L((a, cyb), (a, cy))] + top, caps=('b', 'b'))
    else:
        g.stroke([L((a, 0), (a, cy))] + top)
    yt = cy - ry
    ryl = (yt - H / 2) / 2
    rxl = min(ryl * 1.05, (w - V / 2 - w * 0.36) * 0.8)
    cxl = w - V / 2 - rxl
    g.stroke([L((w * 0.36, yt), (cxl, yt))] + g.arc(cxl, (yt + H / 2) / 2, rxl, ryl, 90, -90) + [L((cxl, H / 2), (w * 0.3, H / 2))])
    g.ht = 'a'
    g.sb = (0.1 if p.italic else 1, 0.6)


@glyph('eth', 0xF0)
def _eth(g, p):
    w = p.nw * 1.06
    V, H = p.V, p.H
    g.oval(0, -p.ov, w, p.xh * 0.92)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.asc)
    g.stroke([L((cx + rx, p.xh * 0.4), (cx + rx, cy))] + g.arc(cx, cy, rx, ry, 0, 118), caps=('b', 'b'))
    g.diag(w * 0.28, p.asc * 0.76, w * 0.8, p.asc * 0.98, 'c', 'c', ws=0.8, caps=('b', 'b'))
    del V, H
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('thorn', 0xFE)
def _thorn(g, p):
    w = p.nw * 1.08
    g.vstem(0, p.desc, p.asc)
    _bowl_lc(g, p, w, True)
    g.ht = 'a'
    g.sb = (1, 0.62)


@glyph('Thorn', 0xDE)
def _Thorn(g, p):
    w = p.Hw * 0.93
    V, H = p.V, p.H
    g.vstem(0, 0, p.cap)
    _bowl_right(g, V / 2, w - V / 2, p.cap * 0.8 - H / 2, p.cap * 0.22 + H / 2, 1.05)
    g.ht = 'c'
    g.sb = (1, 0.55)


@glyph('AE', 0xC6)
def _AE(g, p):
    w = p.Hw * 1.42
    xa = w * 0.47
    a = g.diag(0, 0, xa + p.V * 0.3, p.cap, 'l', 'c', ws=0.93)
    g.vstem(xa, 0, p.cap)
    g.hbar(a[1][0], w, p.cap - p.H)
    g.hbar(xa + p.V / 2, w * 0.96, p.cap * 0.5 - p.H / 2 + 6)
    g.hbar(xa + p.V / 2, w, 0)
    y = p.cap * 0.27
    g.hbar(on_line(*a, y), xa + p.V / 2, y)
    g.ht = 'c'
    g.sb = (0.08, 0.5)


@glyph('ae', 0xE6)
def _ae(g, p):
    V, H = p.V, p.H
    if p.italic:  # single-storey, matching the italic a
        wa = p.nw * 1.0
        g.vstem(wa - V, 0, p.xh)
        _bowl_lc(g, p, wa, False)
        _ae_e(g, p, wa - V)
        g.sb = (0.62, 0.5)
        return
    wa = p.nw * 0.9
    xs = wa - V / 2
    cxt = xs * 0.5 + 6
    rxt = xs - cxt
    ryt = p.xh * 0.26
    cyt = p.xh + p.ov * 0.5 - H / 2 - ryt
    g.stroke([L((xs, p.xh * 0.35), (xs, cyt))] + g.arc(cxt, cyt, rxt, ryt, 0, 154 - p.ap), caps=('b', 'b'))
    _a_bowl(g, p, xs, 1.0)
    _ae_e(g, p, xs - V / 2)
    g.sb = (0.55, 0.5)


def _ae_e(g, p, x0):
    """The e half of æ, its left side sharing the a's stem."""
    cx, cy, rx, ry = g.box(x0, -p.ov, x0 + p.nw * 0.96, p.xh + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 0, 322 - p.ap), caps=('h', 'b'), cut='h')
    # ends inside the bowl's stroke, as in e: run to the outer edge, it stuck out at Bold where
    # the bowl has already turned inward
    g.hbar(cx - rx, cx + rx - (p.V * 0.18 if p.italic else 0), cy + 2)


@glyph('Eng', 0x14A)
def _Eng(g, p):
    w = p.Hw
    V, H = p.V, p.H
    g.vstem(0, 0, p.cap)
    g.diag(0, p.cap, w, 0, 'l', 'r', ws=0.95)
    xr = w - V / 2
    rx = 70 + V * 0.3
    ry = rx * 1.1
    cy = p.desc * 0.7 + H / 2 + ry
    g.stroke([L((xr, p.cap), (xr, cy))] + g.arc(xr - rx, cy, rx, ry, 0, -90) + [L((xr - rx, cy - ry), (xr - rx - 20, cy - ry))])
    g.ht = 'c'


@glyph('eng', 0x14B)
def _eng(g, p):
    V, H = p.V, p.H
    g.vstem(0, 0, p.xh)
    a, b = V / 2, p.nw - V / 2
    rx = (b - a) / 2
    ry = rx * 0.93
    cy = p.xh + p.ov * 0.4 - H / 2 - ry
    r2 = 60 + V * 0.3
    cy2 = p.desc + H / 2 + r2 * 1.1
    g.stroke(g.arc(a + rx, cy, rx, ry, 166, 0) + [L((b, cy), (b, cy2))] + g.arc(b - r2, cy2, r2, r2 * 1.1, 0, -90) + [L((b - r2, p.desc + H / 2), (b - r2 - 20, p.desc + H / 2))], taper=(0.5, 1))


@glyph('longs', 0x17F)
def _longs(g, p):
    w = p.nw * 0.52
    V, H = p.V, p.H
    xs = V * 0.1
    rx = w - xs - V * 0.25
    ry = rx * 0.95
    top = p.asc + p.ov * 0.3
    cy = top - H / 2 - ry
    sx = xs + V / 2
    top_hook = g.arc(sx + rx, cy, rx, ry, 180, 38)
    if p.italic:  # descends like the italic f, which it is the ancestor of
        hook, cyb = _italic_descender(g, p, sx)
        g.stroke(hook + [L((sx, cyb), (sx, cy))] + top_hook, caps=('b', 'b'))
        g.sb = (-0.2, 0.2)
    else:
        g.stroke([L((sx, 0), (sx, cy))] + top_hook, caps=('b', 'b'))
        g.sb = (1, 0.2)
    g.ht = 'a'


@glyph('mu', 0xB5)
def _mu(g, p):
    w = p.nw
    a, b = p.V / 2, w - p.V / 2
    rx = (b - a) / 2
    ry = rx * 0.93
    cy = -p.ov * 0.4 + p.H / 2 + ry
    g.vstem(0, p.desc, p.xh)
    g.stroke(g.arc(a + rx, cy, rx, ry, 194, 346), taper=(0.5, 0.5))
    g.vstem(w - p.V, 0, p.xh)


# ---- strokes used only as components ----


@glyph('slashcomp.cap')
def _slashcap(g, p):
    w = p.Hw * 1.17
    g.line((w * 0.06, -p.ov - 30), (w * 0.94, p.cap + p.ov + 30), w=p.H * 0.92, caps=('b', 'b'))
    g.mark = True


@glyph('slashcomp.lc')
def _slashlc(g, p):
    w = p.nw * 1.1
    g.line((w * 0.04, -p.ov - 25), (w * 0.96, p.xh + p.ov + 25), w=p.H * 0.92, caps=('b', 'b'))
    g.mark = True


def _strokebar(name, w_fn, y_fn):
    @glyph(name)
    def _fn(g, p):
        x0, x1 = w_fn(p)
        y = y_fn(p)
        g.hbar(x0, x1, y - p.H * 0.45, h=p.H * 0.9)
        g.mark = True


_strokebar('barcomp.D', lambda p: (-p.V * 0.7 - 20, p.V * 1.6 + 70), lambda p: p.cap * 0.5)
_strokebar('barcomp.H', lambda p: (-50, p.Hw + 50), lambda p: p.cap * 0.76)
_strokebar('barcomp.d', lambda p: (p.nw * 1.08 - p.V * 2.2 - 40, p.nw * 1.08 + 50), lambda p: p.asc * 0.83)
_strokebar('barcomp.T', lambda p: (-p.Hw * 0.24, p.Hw * 0.24), lambda p: p.cap * 0.46)
_strokebar('barcomp.t', lambda p: (-p.nw * 0.24, p.nw * 0.24), lambda p: p.xh * 0.42)
_strokebar('barcomp.h', lambda p: (-50, p.V + 110), lambda p: p.asc * 0.83)


@glyph('lslash.comp')
def _lslash(g, p):
    g.line((-60 - p.V * 0.2, p.cap * 0.32), (60 + p.V * 1.2, p.cap * 0.6), w=p.H * 0.9, caps=('b', 'b'))
    g.mark = True


# ============================================================================================
# Marks (combining, zero-width, attach point at the origin)
# ============================================================================================


def _mk(name, cp, fn, case=False):
    @glyph(name, *([cp] if cp else []))
    def _f(g, p):
        fn(g, p, 0.97 if case else 1.0)  # at 0.82, capital accents were 0.75x the references' height
        g.mark = True

    return _f


# Acutes lean toward where they point: Inter, Geist and Plex set them about 45 units right of
# the letter's centre (Á, ć, ŕ, Ś), graves as far left. The spacing ´ and ` take it back out.
MARK_DX = {'acutecomb': 45, 'gravecomb': -45}


def m_acute(g, p, s):
    h = 150 * s
    dx = MARK_DX['acutecomb']
    g.diag(dx - 45, 0, dx + 45, h, 'c', 'c', w=p.mt, caps=('h', 'h'))  # steeper: 1.4x the references' width at 120


def m_grave(g, p, s):
    h = 150 * s
    dx = MARK_DX['gravecomb']
    g.diag(dx + 45, 0, dx - 45, h, 'c', 'c', w=p.mt, caps=('h', 'h'))


# Dots, macron: raised clear of the letter. Measured on Inter, Geist and Plex, they sat 0.10-0.13
# x-height above it against the references' 0.16-0.22, where acute and grave already matched.
# Heavier, the references' dots, macrons and tildes come closer (0.09-0.12 at Black), while their
# acutes keep their distance: the lift turns into a drop.
def lift_dots(p):
    return 30 - 41 * p.heavy


def lift_macron(p):
    return 45 - (17 if p.italic else 42) * p.heavy  # Inter's heavy italic keeps its macron, tilde and breve higher


def m_circumflex(g, p, s):
    h = (135 + 40 * p.heavy) * s  # the references' grow taller with weight (0.20 → 0.24 cap height at Bold)
    a = 130 + p.V * 0.25  # 0.8x the references' width
    g.diag(-a, 0, 0, h, 'l', 'c', w=p.mt, caps=('h', 'h'))
    g.diag(a, 0, 0, h, 'r', 'c', w=p.mt, caps=('h', 'h'))


def m_caron(g, p, s):
    h = (135 + 40 * p.heavy) * s
    a = 130 + p.V * 0.25
    g.diag(-a, h, 0, 0, 'l', 'c', w=p.mt, caps=('h', 'h'))
    g.diag(a, h, 0, 0, 'r', 'c', w=p.mt, caps=('h', 'h'))


def m_dieresis(g, p, s):
    d = p.dot * 0.94
    gap = 54 + p.V * 0.35
    g.dot(-(gap + d) / 2, lift_dots(p), d)
    g.dot((gap + d) / 2, lift_dots(p), d)


def m_dot(g, p, s):
    g.dot(0, lift_dots(p))


def m_macron(g, p, s):
    a = 110 + p.V * 0.25
    g.hbar(-a, a, lift_macron(p), h=p.mt * (0.9 - 0.2 * p.heavy))  # Black's was 1.27x as thick


def m_breve(g, p, s):
    # Drawn directly, outer and inner half-ellipse: as a stroke, a shallower bowl folded inside, so
    # Black's breve stood 1.27x as tall as Inter's and Geist's. Drawn, its depth and its bottom's
    # thickness are separate: heavier, it gets shallower, narrower and a little lighter.
    h = p.heavy
    r = (100 + p.V * 0.2) * (1 - 0.2 * h)
    ts = p.mt * (1 - 0.15 * h)  # side thickness
    tb = p.mt * 0.85 * (1 - 0.2 * h)  # bottom thickness
    ryo = max(85 * s + 2, p.mt * 0.55 + 30) * (1 - 0.25 * h) * (1.25 if p.italic else 1) + tb / 2  # the italics' run deeper
    ryi = max(ryo - tb, 20)
    rxo, rxi = r + ts / 2, r - ts / 2
    top = ryo - (0 if p.italic else 25) * h  # and closer to the letter, as the references' heavy breves sit
    outer = g.arc(0, top, rxo, ryo, 180, 360)
    inner = [reverse_seg(sg) for sg in reversed(g.arc(0, top, rxi, ryi, 180, 360))]
    contour = outer + [L((rxo, top), (rxi, top))] + inner + [L((-rxi, top), (-rxo, top))]
    g.raw.append(orient(contour, outer=True))


def m_ring(g, p, s):
    d = 180 + p.V * 0.45  # 0.65x the references' size
    t = min(p.mt * 0.8, d * 0.24)  # a heavy pen would close a small ring
    # on a capital the ring sits closer than other accents (Å, Ů in Inter, Geist and Plex), and
    # flatter, so it does not tower
    y0 = -28 if s < 1 else -30 * p.heavy
    g.oval(-d / 2, y0, d / 2, y0 + d * (0.95 if s == 1 else 0.85), V=t, H=t * 0.94)


def m_tilde(g, p, s):
    a = 120 + p.V * 0.2
    h = 60 * s  # 0.75x the references' height
    t = p.mt * 0.92
    y = -(30 if p.italic else 55) * p.heavy  # heavier, the references' tildes sit closer (less so in the italic)
    g.stroke([('C', (-a, y + t / 2 + 2), (-a * 0.45, y + h * 2.4 + t / 2), (a * 0.45, y - h * 0.4 + t / 2 - h * 0.8), (a, y + h + t / 2 + 6))], w=t)


def m_hungarumlaut(g, p, s):
    h = 150 * s
    for dx in (-62 - p.V * 0.2, 62 + p.V * 0.2):
        g.diag(dx - 48, 0, dx + 48, h, 'c', 'c', w=p.mt * 0.92, caps=('h', 'h'))


def m_cedilla(g, p, s):
    r = 52 + p.V * 0.3 - 25 * p.heavy
    n = 60 - 30 * p.heavy  # Bold's cedilla hung 1.35x as deep as the references'
    t = min(p.mt * 0.8, r * 0.8)
    # neck and curve are separate, overlapping strokes: one stroke cannot offset cleanly round
    # the right-angle turn between them, and the fold showed once slanted
    g.stroke([L((0, 0), (0, -n - t / 2))], w=t)
    g.stroke(g.arc(0, -n - r, r * 1.1, r, 90, -90) + [L((0, -n - 2 * r), (-r * 1.1, -n - 2 * r))], w=t)


def m_ogonek(g, p, s):
    t = p.mt * 0.85
    r = 80 + p.V * 0.2
    g.stroke([L((0, 10), (0, -40))] + g.arc(r, -40, r, r * 1.05, 180, 270) + [L((r, -40 - r * 1.05), (r * 1.5, -40 - r * 1.05))], w=t)


def m_commabelow(g, p, s):
    d = p.dot * (0.95 - (0.42 if p.italic else 0.3) * p.heavy)  # Black's hung 1.4x as deep as the references': its head alone was most of that
    ln = min(d * 2.1, 150 + d * 0.6)
    comma_shape(g, d, 0, -40, ln - d)  # the same comma as , and the quotes


def m_caronalt(g, p, s):
    d = p.dot * 0.95
    ln = min(d * 2.0, 140 + d * 0.6)
    comma_shape(g, d, 0, 0, ln - d)  # the apostrophe-like caron of ď ľ ť is a comma too


MARKS = [
    # name, combining cp, fn, spacing cp
    ('gravecomb', 0x300, m_grave, 0x60),
    ('acutecomb', 0x301, m_acute, 0xB4),
    ('circumflexcomb', 0x302, m_circumflex, 0x2C6),
    ('tildecomb', 0x303, m_tilde, 0x2DC),
    ('macroncomb', 0x304, m_macron, 0xAF),
    ('brevecomb', 0x306, m_breve, 0x2D8),
    ('dotaccentcomb', 0x307, m_dot, 0x2D9),
    ('dieresiscomb', 0x308, m_dieresis, 0xA8),
    ('ringcomb', 0x30A, m_ring, 0x2DA),
    ('hungarumlautcomb', 0x30B, m_hungarumlaut, 0x2DD),
    ('caroncomb', 0x30C, m_caron, 0x2C7),
    ('commaaccentcomb', 0x326, m_commabelow, None),
    ('cedillacomb', 0x327, m_cedilla, 0xB8),
    ('ogonekcomb', 0x328, m_ogonek, 0x2DB),
]
TOP_MARKS = {'gravecomb', 'acutecomb', 'circumflexcomb', 'tildecomb', 'macroncomb', 'brevecomb', 'dotaccentcomb', 'dieresiscomb', 'ringcomb', 'hungarumlautcomb', 'caroncomb'}

for _name, _cp, _fn, _sp in MARKS:
    _mk(_name, _cp, _fn)
    if _name in TOP_MARKS:
        _mk(_name + '.case', None, _fn, case=True)
_mk('caroncomb.alt', None, m_caronalt)

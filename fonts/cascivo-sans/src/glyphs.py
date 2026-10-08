"""Glyph drawings. Each function draws centerline strokes for one master's parameters.

Conventions: the left ink edge is roughly x=0 (the builder re-measures and re-spaces anyway),
y=0 is the baseline. `g.sb` is (left, right) sidebearing in units of the stem sidebearing S:
1.0 = straight stem, ~0.6 = round, ~0.1 = diagonal apex/foot.

Rule that keeps the variable font valid: nothing here may branch on a master parameter in a way
that changes the *number* of strokes or segments. Parameters may only move points.
"""

import math

from geom import L, Stroke, arc, contour_bounds, pen_thickness, norm

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


@glyph('I', 0x49)
def _I(g, p):
    g.vstem(0, 0, p.cap)
    g.ht = 'c'


@glyph('I.ss01')
def _I_ss01(g, p):
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
    g.sb = (1, 0.35)
    g.anchors['top_x'] = p.V / 2 + 0.35 * w


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
    w = p.Hw * 0.92
    g.hbar(0, w, p.cap - p.H).vstem((w - p.V) / 2, 0, p.cap - p.H / 2)
    g.ht = 'c'
    g.sb = (0.18, 0.18)


@glyph('A', 0x41)
def _A(g, p):
    w = p.Hw * 1.1
    c = w / 2
    a = g.diag(0, 0, c, p.cap, 'l', 'c')
    b = g.diag(w, 0, c, p.cap, 'r', 'c')
    y = p.cap * 0.27
    g.hbar(on_line(*a, y), on_line(*b, y), y, h=p.bar)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('V', 0x56)
def _V(g, p):
    w = p.Hw * 1.07
    c = w / 2
    g.diag(0, p.cap, c, 0, 'l', 'c')
    g.diag(w, p.cap, c, 0, 'r', 'c')
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('W', 0x57)
def _W(g, p):
    w = p.Hw * 1.6
    ws = 0.86
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
    g.diag(0, p.cap, w / 2, 0, 'l', 'c', ws=0.86)
    g.diag(w, p.cap, w / 2, 0, 'r', 'c', ws=0.86)
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
    g.sb = (0.35, 0.35)


@glyph('X', 0x58)
def _X(g, p):
    w = p.Hw * 1.02
    g.diag(0, p.cap, w, 0, 'l', 'r', ws=0.93)
    g.diag(w, p.cap, 0, 0, 'r', 'l', ws=0.9)
    g.ht = 'c'
    g.sb = (0.1, 0.1)


@glyph('Y', 0x59)
def _Y(g, p):
    w = p.Hw * 1.04
    c = w / 2
    yj = p.cap * 0.43
    g.diag(0, p.cap, c, yj, 'l', 'c', ws=0.92)
    g.diag(w, p.cap, c, yj, 'r', 'c', ws=0.92)
    g.vstem(c - p.V / 2, 0, yj + 2)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('K', 0x4B)
def _K(g, p):
    w = p.Hw * 0.98
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
    w = p.Hw * 1.07
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 42 + p.ap, 318 - p.ap), caps=('h', 'h'))
    g.ht = 'c'
    g.sb = (0.62, 0.45)


@glyph('G', 0x47)
def _G(g, p):
    w = p.Hw * 1.12
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 42 + p.ap, 360), caps=('h', 'b'))
    xr = cx + rx
    g.hbar(cx + rx * 0.08, xr + p.V / 2, cy - p.H)
    g.ht = 'c'
    g.sb = (0.62, 0.8)


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
    w = p.Hw * 0.93
    V, H = p.V, p.H
    g.vstem(0, 0, p.cap)
    _bowl_right(g, V / 2, w - V / 2, p.cap - H / 2, p.cap * 0.44 + H / 2, 1.05)
    g.ht = 'c'
    g.sb = (1, 0.55)


@glyph('R', 0x52)
def _R(g, p):
    w = p.Hw * 0.98
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
    w = p.Hw * 0.78
    V, H = p.V, p.H
    xr = w - V / 2
    rx = (w - V / 2) / 2 - 2
    ry = min(rx * 1.05, p.cap * 0.36)
    cy = -p.ov + H / 2 + ry
    g.stroke([L((xr, p.cap), (xr, cy))] + g.arc(xr - rx, cy, rx, ry, 0, -158 + p.ap), caps=('b', 'h'))
    g.ht = 'c'
    g.sb = (0.4, 1)


def _S(g, p, w, top, ov, pen=None, term=32):
    """S/s/$ spine: upper arc, a cubic spine at full stem weight, lower arc."""
    V, H = p.V, p.H
    yb, yt = -ov, top + ov
    hu = (yt - yb) * 0.47  # upper bowl height (outer)
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
    spine = ('C', pa, (pa[0], pa[1] - dy * 0.55), (pb[0], pb[1] + dy * 0.55), pb)
    # The upper bowl is short, so near 0° its inner radius of curvature drops below half the
    # stroke and the inner edge must fold. The terminal sits higher, where the curve is gentle,
    # and is cut square to the stroke (a horizontal cut there would leave a sliver).
    up = g.arc(cxu, cyu, rxu, ryu, term + p.ap * 0.8, 180)
    lo = g.arc(cxl, cyl, rxl, ryl, 0, -146 + p.ap * 0.8)
    # Three strokes, so the spine gets its own pen: the default angle pen thins a diagonal spine
    # too far at Regular, while a constant full stem closes the counters at Black. A heavier
    # hairline (1.15 H) does both. The joins sit at the bowls' vertical extremes, where every
    # pen is exactly one stem wide, so they are seamless.
    g.stroke(up, caps=('b', 'b'), pen=pen)
    g.stroke([spine], pen=(PV, PH * 1.15))
    g.stroke(lo, caps=('b', 'b'), pen=pen)


@glyph('S', 0x53)
def _S_(g, p):
    _S(g, p, p.Hw * 0.94, p.cap, p.ov)
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
    w = p.nw * 0.64
    g.vstem(0, 0, p.xh)
    a = p.V / 2
    rx = w - a - p.V * 0.2
    ry = p.xh * 0.42
    cy = p.xh + p.ov * 0.4 - p.H / 2 - ry
    g.stroke(g.arc(a + rx, cy, rx, ry, 166, 62 - p.ap * 0.5), taper=(0.5, 1), caps=('b', 'v'))
    g.sb = (1, 0.25)


@glyph('dotlessi', 0x131)
def _dotlessi(g, p):
    g.vstem(0, 0, p.xh)


@glyph('l', 0x6C)
def _l(g, p):
    g.vstem(0, 0, p.asc)
    g.ht = 'a'


@glyph('l.ss01')
def _l_ss01(g, p):
    a = p.V / 2
    rx = p.V * 1.15 + 40
    ry = rx * 1.05
    cy = -p.ov * 0.4 + p.H / 2 + ry
    g.stroke([L((a, p.asc), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 300), caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (1, 0.35)


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
    g.stroke([L((xr, p.xh), (xr, cy))] + g.arc(xr - rx, cy, rx, ry, 0, -152 + p.ap), caps=('b', 'h'))
    cx, cy2, rx2, ry2 = g.box(0, 18, w, p.xh + p.ov)
    g.stroke(g.arc(cx, cy2, rx2, ry2, 28, 332), taper=(0.55, 0.55))
    g.sb = (0.62, 1)


@glyph('o', 0x6F)
def _o(g, p):
    g.oval(0, -p.ov, p.nw * 1.1, p.xh + p.ov)
    g.sb = (0.62, 0.62)


@glyph('c', 0x63)
def _c(g, p):
    w = p.nw * 0.98
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 44 + p.ap, 316 - p.ap), caps=('h', 'h'))
    g.sb = (0.62, 0.42)


@glyph('e', 0x65)
def _e(g, p):
    w = p.nw * 1.06
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    yb = cy  # flush with where the bowl stroke ends, or its butt end shows below the bar
    g.stroke(g.arc(cx, cy, rx, ry, 0, 322 - p.ap), caps=('b', 'h'))
    g.hbar(cx - rx, cx + rx, yb, h=p.bar)  # ends on the bowl's centreline, so the bowl stroke covers it
    g.sb = (0.62, 0.5)


@glyph('a', 0x61)
def _a(g, p):
    w = p.nw * 0.98
    V, H = p.V, p.H
    xs = w - V / 2  # stem centre
    # top arc
    cxt = xs * 0.5 + 6
    rxt = xs - cxt
    ryt = p.xh * 0.26
    cyt = p.xh + p.ov * 0.5 - H / 2 - ryt
    g.stroke([L((xs, 0), (xs, cyt))] + g.arc(cxt, cyt, rxt, ryt, 0, 154 - p.ap), caps=('b', 'h'))
    # bowl
    ybt = p.xh * (0.57 + 0.05 * max(0.0, (p.V - 90) / 88))  # heavy a: lift the bowl so it keeps a counter
    yt = ybt - H / 2
    ybot = -p.ov + H / 2
    ryb = (yt - ybot) / 2
    rxb = (xs - V / 2) / 2 * 0.94
    cxb = V / 2 + rxb
    cyb = (yt + ybot) / 2
    # The bowl leaves its curve at 322° and runs straight along that tangent into the stem
    # centre. A round bowl meeting a stem always grazes the stem's foot about 20 units above
    # the baseline; a diagonal join (as in Geist) lifts the junction clear of it.
    bowl = g.arc(cxb, cyb, rxb, ryb, 90, 322)
    end = bowl[-1][-1]
    tx, ty = end[0] - bowl[-1][-2][0], end[1] - bowl[-1][-2][1]
    join = (xs, end[1] + (xs - end[0]) * ty / tx)
    g.stroke([L((xs, yt), (cxb, yt))] + bowl + [L(end, join)], taper=(1, 0.8))
    g.sb = (0.55, 1)


@glyph('s', 0x73)
def _s(g, p):
    _S(g, p, p.nw * 0.88, p.xh, p.ov)
    g.sb = (0.55, 0.55)


@glyph('f', 0x66)
def _f(g, p):
    w = p.cn * 0.47 + p.V * 1.69  # heavier stems need a wider f, or the hook has no room to turn
    V, H = p.V, p.H
    xs = w * 0.28 + V * 0.1
    # size the hook so its terminal ends above the crossbar's end: a wider hook overhangs empty
    # space and opens a gap before the next letter ("def ault")
    rx = (w * 0.96 - xs - V / 2) / (1 + math.cos(math.radians(38))) + V * 0.15
    ry = rx * 1.15
    top = p.asc + p.ov * 0.3
    cy = top - H / 2 - ry
    g.stroke([L((xs + V / 2, 0), (xs + V / 2, cy))] + g.arc(xs + V / 2 + rx, cy, rx, ry, 180, 38), caps=('b', 'b'))
    g.hbar(0, w * 0.96, p.xh - H)
    g.sb = (0.3, 0.05)
    g.ht = 'a'


@glyph('t', 0x74)
def _t(g, p):
    w = p.nw * 0.6
    V, H = p.V, p.H
    xs = w * 0.24 + V * 0.12
    rx = w - xs - V * 0.4
    ry = rx * 0.9
    cy = -p.ov * 0.4 + H / 2 + ry
    g.stroke([L((xs + V / 2, p.xh + (p.asc - p.xh) * 0.62), (xs + V / 2, cy))] + g.arc(xs + V / 2 + rx, cy, rx, ry, 180, 286), caps=('b', 'v'))
    g.hbar(0, w * 0.96, p.xh - H)
    g.sb = (0.3, 0.25)
    g.anchors['topright_x'] = xs + V + p.S * 0.4


@glyph('k', 0x6B)
def _k(g, p):
    w = p.nw * 0.94
    g.vstem(0, 0, p.asc)
    a0, a1 = g.diag(p.V / 2, p.xh * 0.3, w - 6, p.xh, 'c', 'r', ws=0.92, caps=('v', 'h'))
    t = 0.42
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    g.ht = 'a'
    g.sb = (1, 0.1)


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
    w = p.nw * 1.02
    g.diag(0, p.xh, w / 2, 0, 'l', 'c')
    g.diag(w, p.xh, w / 2, 0, 'r', 'c')
    g.sb = (0.1, 0.1)


@glyph('w', 0x77)
def _w(g, p):
    w = p.nw * 1.52
    ws = 0.86
    g.diag(0, p.xh, w * 0.25, 0, 'l', 'c', ws=ws)
    g.diag(w / 2, p.xh, w * 0.25, 0, 'c', 'c', ws=ws)
    g.diag(w / 2, p.xh, w * 0.75, 0, 'c', 'c', ws=ws)
    g.diag(w, p.xh, w * 0.75, 0, 'r', 'c', ws=ws)
    g.sb = (0.1, 0.1)


@glyph('x', 0x78)
def _x(g, p):
    w = p.nw * 0.98
    g.diag(0, p.xh, w, 0, 'l', 'r', ws=0.93)
    g.diag(w, p.xh, 0, 0, 'r', 'l', ws=0.9)
    g.sb = (0.12, 0.12)


@glyph('y', 0x79)
def _y(g, p):
    w = p.nw * 1.02
    a = g.diag(w, p.xh, w * 0.36, p.desc, 'r', 'c', caps=('h', 'h'))
    # the left arm ends below the baseline, on the right stroke's centreline: a cut exactly at
    # the baseline leaves its corner showing at heavy weights
    yj = -p.H * 0.5
    g.diag(0, p.xh, on_line(*a, yj), yj, 'l', 'c', caps=('h', 'b'))
    g.sb = (0.1, 0.1)


@glyph('z', 0x7A)
def _z(g, p):
    w = p.nw * 0.86
    g.hbar(w * 0.04, w * 0.98, p.xh - p.H).hbar(0, w, 0)
    g.diag(w * 0.98, p.xh - p.H / 2, 0, p.H / 2, 'r', 'l', ws=0.95)
    g.sb = (0.35, 0.35)


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
    tgt = (V * 0.55, H)
    d = math.hypot(tgt[0] - pe[0], tgt[1] - pe[1])
    spine = ('C', pe, (pe[0] + t[0] * d * 0.35, pe[1] + t[1] * d * 0.35), (tgt[0] + d * 0.12, tgt[1] + d * 0.3), tgt)
    g.stroke(arc_ + [spine], caps=('h', 'h'))
    g.hbar(0, w, 0)
    g.tab = True
    g.ht = 'c'


@glyph('three', 0x33)
def _three(g, p):
    w = fw(p)
    H = p.H
    ym = p.cap * 0.56
    cxu, cyu, rxu, ryu = g.box(w * 0.06, ym - H / 2, w * 0.95, p.cap + p.ov)
    cxl, cyl, rxl, ryl = g.box(0, -p.ov, w, ym + H / 2)
    g.stroke(g.arc(cxu, cyu, rxu, ryu, 152 - p.ap, -90), caps=('h', 'b'))
    g.hbar(w * 0.36, cxu + 2, ym - H / 2)
    g.stroke(g.arc(cxl, cyl, rxl, ryl, 90, -150 + p.ap), caps=('b', 'h'))
    g.tab = True
    g.ht = 'c'


@glyph('four', 0x34)
def _four(g, p):
    w = fw(p)
    V, H = p.V, p.H
    xs = w * 0.74
    yb = p.cap * 0.25
    g.vstem(xs - V / 2, 0, p.cap)
    g.hbar(0, w, yb)
    g.diag(xs + V / 2, p.cap, 0, yb + H / 2, 'r', 'l', ws=0.9, caps=('h', 'h'))
    g.tab = True
    g.ht = 'c'


@glyph('five', 0x35)
def _five(g, p):
    w = fw(p)
    V, H = p.V, p.H
    xl = w * 0.1
    yj = p.cap * 0.55
    g.hbar(xl + V * 0.3, w * 0.93, p.cap - H)
    g.line((xl + V / 2 + 10, p.cap - H / 2), (xl + V / 2, yj - 6), caps=('b', 'b'))
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap * 0.63)
    g.stroke(g.arc(cx, cy, rx, ry, 150, -150 + p.ap), taper=(0.6, 1), caps=('b', 'h'))
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
    top = p.cap * 0.6
    g.oval(0, -p.ov, w, top)
    cx, cy, rx, ry = g.box(0, -p.ov, w * 1.02, p.cap + p.ov)
    cyb = (-p.ov + top) / 2
    g.stroke([L((cx - rx, cyb), (cx - rx, cy))] + g.arc(cx, cy, rx, ry, 180, 52 + p.ap * 0.5), caps=('b', 'h'))
    del V


@glyph('nine', 0x39)
def _nine(g, p):
    w = fw(p)
    _six_strokes(g, p, w)
    cap = p.cap
    g.strokes = [s.transformed(lambda q: (w - q[0], cap - q[1])) for s in g.strokes]
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


@glyph('comma', 0x2C)
def _comma(g, p):
    d = p.dot
    g.line((d / 2, d), (d / 2 - d * 0.18, -d * 1.25), w=d, taper=(1, 0.45), caps=('b', 'b'))
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
    w = p.Hw * 0.78
    V, H = p.V, p.H
    d = p.dot
    cx, cy, rx, ry = g.box(0, p.cap * 0.42, w, p.cap + p.ov)
    xm = w * 0.47
    arc_ = g.arc(cx, cy, rx, ry, 160 - p.ap, -55)
    pe = arc_[-1][-1]
    tgt = (xm, p.cap * 0.27)
    g.stroke(arc_ + [('C', pe, (pe[0] - 30, pe[1] - 25), (tgt[0], tgt[1] + 60), tgt)], caps=('h', 'b'))
    g.dot(xm, 0)
    del V, H, d
    g.sb = (0.55, 0.6)
    g.ht = 'c'


@glyph('hyphen', 0x2D, 0xAD)
def _hyphen(g, p):
    w = 150 + p.V * 0.9
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
    a = w * 0.1
    g.stroke([('C', (0, cy - a), (w * 0.2, cy + a * 2.6), (w * 0.8, cy - a * 2.6), (w, cy + a))], w=t)
    g.tab = True


@glyph('asciicircum', 0x5E)
def _asciicircum(g, p):
    w, cy, t = _mathy(p)
    g.line((0, p.cap * 0.38), (w / 2, p.cap), w=t, caps=('h', 'b'))
    g.line((w, p.cap * 0.38), (w / 2, p.cap), w=t, caps=('h', 'b'))
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
    r = 60 + V * 0.2
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
    _S(g, p, w, p.cap, p.ov)
    g.line((w * 0.52, -p.ov - 90), (w * 0.52, p.cap + p.ov + 90), w=p.V * 0.72)
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
    cx, cy, rx, ry = g.box(lx0, ly0, lx1, top)
    # leg: from the loop's lower left, straight down to the foot on the right
    a = (cx - rx * 0.55, cy - ry * 0.8)
    g.line(a, (w - V * 0.55, 0), ws=0.96, caps=('b', 'h'))
    # lower bowl: from under the loop, round the bottom, ending on the right
    bx0, bx1 = 0, w * 0.86
    bcx, bcy, brx, bry = g.box(bx0, -p.ov, bx1, p.cap * 0.64)
    g.stroke(g.arc(bcx, bcy, brx, bry, 62, 352), caps=('b', 'b'), taper=(0.7, 1))
    e = (bcx + brx * math.cos(math.radians(-8)), bcy + bry * math.sin(math.radians(-8)))
    g.line(e, (w, p.cap * 0.44), ws=0.9, caps=('b', 'h'))
    g.sb = (0.55, 0.12)
    g.ht = 'c'


@glyph('asterisk', 0x2A)
def _asterisk(g, p):
    r = 120 + p.V * 0.2
    cy = p.cap - r
    c = r
    for ang in (90, 18, -54, -126, 162):
        a = math.radians(ang)
        g.line((c, cy), (c + r * math.cos(a), cy + r * math.sin(a)), w=p.V * 0.82, caps=('b', 'b'))
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
    g.stroke(tail + outer, pen=pen, caps=('b', 'h'))
    g.sb = (0.55, 0.55)
    g.ht = 'c'


@glyph('bullet', 0x2022)
def _bullet(g, p):
    d = p.dot * 1.5
    g.oval(0, p.xh * 0.5 - d / 2, d, p.xh * 0.5 + d / 2, V=d * 0.5, H=d * 0.5)
    g.sb = (0.8, 0.8)


@glyph('periodcentered', 0xB7)
def _periodcentered(g, p):
    g.dot(p.dot / 2, p.xh * 0.5 - p.dot / 2)
    g.sb = (0.9, 0.9)


@glyph('degree', 0xB0)
def _degree(g, p):
    d = 150 + p.V * 0.5
    t = min(p.V * 0.72, d * 0.24)
    g.oval(0, p.cap - d, d, p.cap, V=t, H=t)
    g.sb = (0.6, 0.6)
    g.ht = 'c'


@glyph('ring.circle')
def _circle(g, p):
    d = p.cap + 90
    g.oval(0, -45 - 4, d, p.cap + 45 - 4, V=p.V * 0.62 + 6, H=p.V * 0.62 + 6)
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
    g.stroke(g.arc(cx, cy, rx, ry, 44 + p.ap, 316 - p.ap), caps=('h', 'h'))
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
    g.stroke([L((xs + V / 2, H), (xs + V / 2, cy))] + g.arc(xs + V / 2 + rx, cy, rx, ry, 180, 18), caps=('b', 'h'))
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
    cx, cy, rx, ry = g.box(w * 0.12, -p.ov, w * 1.02, p.cap + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 46, 314), caps=('h', 'h'))
    g.hbar(0, w * 0.72, p.cap * 0.56 - p.H / 2, h=p.H * 0.9)
    g.hbar(0, w * 0.66, p.cap * 0.38 - p.H / 2, h=p.H * 0.9)
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
    w = 120 + p.V * 0.45
    hh = p.xh * 0.26 * h
    cy = p.xh * 0.5
    tip = x0 if not flip else x0 + w
    back = x0 + w if not flip else x0
    g.line((back, cy + hh), (tip, cy), ws=0.86, caps=('b', 'b'), w=p.V * 0.9)
    g.line((tip, cy), (back, cy - hh), ws=0.86, caps=('b', 'b'), w=p.V * 0.9)
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
    g.stroke([L((a, 0), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, -90) + [L((a + rx, cy - ry), (w * 0.4, cy - ry))])
    yt = cy - ry
    ryl = (yt - H / 2) / 2
    rxl = min(ryl * 1.05, (w - V / 2 - w * 0.36) * 0.8)
    cxl = w - V / 2 - rxl
    g.stroke([L((w * 0.36, yt), (cxl, yt))] + g.arc(cxl, (yt + H / 2) / 2, rxl, ryl, 90, -90) + [L((cxl, H / 2), (w * 0.3, H / 2))])
    g.ht = 'a'
    g.sb = (1, 0.6)


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
    wa = p.nw * 0.9
    xs = wa - V / 2
    cxt = xs * 0.5 + 6
    rxt = xs - cxt
    ryt = p.xh * 0.26
    cyt = p.xh + p.ov * 0.5 - H / 2 - ryt
    g.stroke([L((xs, p.xh * 0.35), (xs, cyt))] + g.arc(cxt, cyt, rxt, ryt, 0, 154 - p.ap), caps=('b', 'h'))
    ybt = p.xh * 0.57
    yt = ybt - H / 2
    ybot = -p.ov + H / 2
    ryb = (yt - ybot) / 2
    rxb = (xs - V / 2) / 2
    cxb = V / 2 + rxb
    g.stroke([L((xs, yt), (cxb, yt))] + g.arc(cxb, (yt + ybot) / 2, rxb, ryb, 90, 360))
    x0 = xs - V / 2
    we = p.nw * 0.96
    cx, cy, rx, ry = g.box(x0, -p.ov, x0 + we, p.xh + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 0, 322 - p.ap), caps=('b', 'h'))
    g.hbar(cx - rx, cx + rx + V / 2, cy + 2)
    g.sb = (0.55, 0.5)


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
    g.stroke([L((xs + V / 2, 0), (xs + V / 2, cy))] + g.arc(xs + V / 2 + rx, cy, rx, ry, 180, 38), caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (1, 0.2)


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
        fn(g, p, 0.82 if case else 1.0)
        g.mark = True

    return _f


def m_acute(g, p, s):
    h = 150 * s
    g.diag(-60, 0, 60, h, 'c', 'c', w=p.mt, caps=('h', 'h'))


def m_grave(g, p, s):
    h = 150 * s
    g.diag(60, 0, -60, h, 'c', 'c', w=p.mt, caps=('h', 'h'))


def m_circumflex(g, p, s):
    h = 135 * s
    a = 105 + p.V * 0.2
    g.diag(-a, 0, 0, h, 'l', 'c', w=p.mt, caps=('h', 'h'))
    g.diag(a, 0, 0, h, 'r', 'c', w=p.mt, caps=('h', 'h'))


def m_caron(g, p, s):
    h = 135 * s
    a = 105 + p.V * 0.2
    g.diag(-a, h, 0, 0, 'l', 'c', w=p.mt, caps=('h', 'h'))
    g.diag(a, h, 0, 0, 'r', 'c', w=p.mt, caps=('h', 'h'))


def m_dieresis(g, p, s):
    d = p.dot * 0.94
    gap = 54 + p.V * 0.35
    g.dot(-(gap + d) / 2, 0, d)
    g.dot((gap + d) / 2, 0, d)


def m_dot(g, p, s):
    g.dot(0, 0)


def m_macron(g, p, s):
    a = 110 + p.V * 0.25
    g.hbar(-a, a, 0, h=p.mt * 0.9)


def m_breve(g, p, s):
    r = 100 + p.V * 0.2
    ry = 85 * s + p.mt / 2
    g.stroke(g.arc(0, ry, r, ry - p.mt / 2 + 2, 180, 360), pen=(p.mt, p.mt * 0.85))


def m_ring(g, p, s):
    d = (120 + p.V * 0.3) * (0.92 if s < 1 else 1)
    t = min(p.mt * 0.8, d * 0.24)  # a heavy pen would close a small ring
    g.oval(-d / 2, 0, d / 2, d * (0.95 if s == 1 else 0.8), V=t, H=t * 0.94)


def m_tilde(g, p, s):
    a = 120 + p.V * 0.2
    h = 46 * s
    t = p.mt * 0.92
    g.stroke([('C', (-a, t / 2 + 2), (-a * 0.45, h * 2.4 + t / 2), (a * 0.45, -h * 0.4 + t / 2 - h * 0.8), (a, h + t / 2 + 6))], w=t)


def m_hungarumlaut(g, p, s):
    h = 150 * s
    for dx in (-62 - p.V * 0.2, 62 + p.V * 0.2):
        g.diag(dx - 48, 0, dx + 48, h, 'c', 'c', w=p.mt * 0.92, caps=('h', 'h'))


def m_cedilla(g, p, s):
    r = 52 + p.V * 0.3
    t = min(p.mt * 0.8, r * 0.8)
    g.stroke([L((0, 0), (0, -60)), L((0, -60), (r * 0.2, -60))] + g.arc(r * 0.2, -60 - r, r * 1.1, r, 90, -90) + [L((r * 0.2, -60 - 2 * r), (-r * 0.9, -60 - 2 * r))], w=t)


def m_ogonek(g, p, s):
    t = p.mt * 0.85
    r = 80 + p.V * 0.2
    g.stroke([L((0, 10), (0, -40))] + g.arc(r, -40, r, r * 1.05, 180, 270) + [L((r, -40 - r * 1.05), (r * 1.5, -40 - r * 1.05))], w=t)


def m_commabelow(g, p, s):
    d = p.dot * 0.95
    ln = min(d * 2.1, 150 + d * 0.6)
    g.line((0, -40), (-d * 0.2, -40 - ln), w=d, taper=(1, 0.45), caps=('b', 'b'))


def m_caronalt(g, p, s):
    d = p.dot * 0.95
    ln = min(d * 2.0, 140 + d * 0.6)
    g.line((0, 0), (-d * 0.18, -ln), w=d, taper=(1, 0.45), caps=('b', 'b'))


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

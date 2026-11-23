"""Glyph drawings. Each function draws centerline strokes for one master's parameters.

Conventions: the left ink edge is roughly x=0 (the builder re-measures and re-spaces anyway),
y=0 is the baseline. `g.sb` is (left, right) sidebearing in units of the stem sidebearing S:
1.0 = straight stem, ~0.6 = round, ~0.1 = diagonal apex/foot.

Rule that keeps the variable font valid: nothing here may branch on a master parameter in a way
that changes the *number* of strokes or segments. Parameters may only move points.
"""

import math

from params import ITALIC_ANGLE, MID_WGHT
from geom import L, lerp, Stroke, _smooth, arc, contour_bounds, expand, norm, orient, pen_thickness, reverse_seg

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

    def oval(self, x0, y0, x1, y1, V=None, H=None, k=None, **kw):
        V = self.p.V if V is None else V
        H = self.p.H if H is None else H
        # a small ring (%, &, @) drawn with a heavy pen closes up: keep the pen under a third of
        # the ring's size so a counter always survives (letters like o are never this small)
        V, H = min(V, (x1 - x0) * 0.33), min(H, (y1 - y0) * 0.33)
        cx, cy, rx, ry = self.box(x0, y0, x1, y1, V, H)
        segs = self.arc(cx, cy, rx, ry, 90, 450, k)
        if kw.pop('drawn', False):
            segs = self.drawn(segs, cx, cy, rx, ry)
        pen = (V, H)
        return self.stroke(segs, closed=True, pen=pen, **kw)

    def drawn(self, segs, cx, cy, rx, ry):
        """An italic round as drawn, not sheared: see ROUND_IT."""
        t = ROUND_IT * self.p.heavy if self.p.italic else 0.0
        if not t:
            return segs
        # the sides turn, the top and bottom stay: a point moves by the shear times 1 - its height squared (in radii), so the extremes
        # at the x-height and baseline keep their place, their height and their level handles (the overshoot is the unit it was)
        return [(s[0],) + tuple((q[0], q[1] - (q[0] - cx) * t * max(0.0, 1 - ((q[1] - cy) / ry) ** 2)) for q in s[1:]) for s in segs]

    def hw(self, dx, dy, ws=1.0, w=None, exact=False):
        """Horizontal half-width of a straight stroke with direction (dx, dy)."""
        # `exact`: measured as the italic will draw it. The stroke is slanted before the pen expands it and the pen leans with it,
        # so an end anchored by its edge with the upright's half-width misses by a few units in the italic (Z's diagonal stood out
        # past its bars, Y's arms past the stem). A slant keeps horizontal distances, so the italic's half-width lands the edge
        # exactly. Only ends that must meet another stroke's edge ask for it: every other diagonal keeps the upright's measure, and
        # with it the italic's advances.
        s = self.p.slant if exact else 0.0
        t = norm((dx + dy * s, dy))
        w = pen_thickness(t, self.p.V, self.p.H, s) * ws if w is None else w
        return w / 2 / max(abs(t[1]), 0.2)

    def diag(self, x0, y0, x1, y1, a0='c', a1='c', ws=0.93, caps=('h', 'h'), exact=(False, False), **kw):
        """Straight stroke whose end x positions name an edge: 'l' left edge, 'r' right, 'c' center. `exact`, per end: see hw."""
        cx0, cx1 = x0, x1
        for _ in range(3):
            h0, h1 = (self.hw(cx1 - cx0, y1 - y0, ws, kw.get('w'), e) for e in exact)
            cx0 = x0 + (h0 if a0 == 'l' else -h0 if a0 == 'r' else 0)
            cx1 = x1 + (h1 if a1 == 'l' else -h1 if a1 == 'r' else 0)
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


@glyph('I.ss02')
def _I_ss02(g, p):  # plain I: opt-in, it is identical to l in most grotesques
    g.vstem(0, 0, p.cap)
    g.ht = 'c'


@glyph('I', 0x49)
def _I(g, p):  # serifed by default, so I, l and 1 never read alike in text
    # Black's slabs are shorter and thinner than the stroke: at the full bar, 0.72 of a stem each side, the I was a slab serif's
    # beside H and J. Still a serif on both sides at every size, so it is never the l.
    # Round 4: Black's slabs shorter again (0.11 -> 0.2 of a stem off each) and thinner (0.16 -> 0.26 off the bar): at 107 a side and
    # 115 thick, heavier than H's bar (107), they still read slab-serif beside H and J, and set HI and IJ 0.71x and 0.63x the HH gap
    e = p.cH * 0.30 + p.V * (0.2 - 0.2 * p.heavy)
    w = p.V + 2 * e
    h = p.H * (1 - 0.26 * p.heavy)
    g.vstem(e, 0, p.cap)
    g.hbar(0, w, 0, h).hbar(0, w, p.cap - h, h)
    g.ht = 'c'
    g.sb = (0.6, 0.6)


K_FOOT, L_FOOT, J_HOOK = 0.35, 0.2, 0.35


L_FLAT_IT = -12


@glyph('L', 0x4C)
def _L(g, p):
    # Round 4, cycle 3: on the flat pen (no step at the baseline) Black italic LY read 1.10x Inter Italic's white: the kerning fit could
    # not close it, its closest row (the foot under Y's stem) at 800 already on its floor. The foot is L_FLAT_IT units shorter at Black
    # and the sidebearing takes them (advance held): the closest row opens, the fit closes the pair, 1.06x
    give = L_FLAT_IT * p.heavy if p.italic else 0
    w = p.Hw * 0.76
    g.vstem(0, 0, p.cap).hbar(p.V / 2, w + give, 0, pen=flat_pen(p))
    g.ht = 'c'
    # the italic's foot slants out under the next capital: heavy, it met X
    g.sb = (1, 0.35 + ((0.3 if p.italic else 0) + L_FOOT) * p.heavy - give / p.S)  # L_FOOT: Black's LM sat 0.68x / 0.73x the HH gap (Inter 0.79x)
    g.anchors['top_x'] = p.V / 2 + 0.12 * w  # over the stem, as Inter's, Geist's and Plex's Ĺ


@glyph('E', 0x45)
def _E(g, p):
    w = p.Hw * 0.82
    g.vstem(0, 0, p.cap)
    g.hbar(p.V / 2, w, 0, pen=flat_pen(p)).hbar(p.V / 2, w * 0.95, p.cap * 0.5 - p.H / 2 + 6).hbar(p.V / 2, w, p.cap - p.H, pen=flat_pen(p))
    g.ht = 'c'
    g.sb = (1, 0.5)


@glyph('F', 0x46)
def _F(g, p):
    w = p.Hw * 0.78
    g.vstem(0, 0, p.cap)
    g.hbar(p.V / 2, w * 0.93, p.cap * 0.5 - p.H / 2 - 4).hbar(p.V / 2, w, p.cap - p.H, pen=flat_pen(p))
    g.ht = 'c'
    g.sb = (1, 0.4)


# CAPW_BLACK: the share of Hd the capitals T V W X Y Z gain at Black, (upright, italic). Their ink width over H's stood 0.84-0.90x
# Inter's (T 0.852 of H's width beside Inter's 0.963, W 1.405 beside 1.580); they are widened to 0.95x at 900. The italic's X was
# 0.94x already, hence its small step. The widening starts at Bold (capw: 0 up to 692, 1 at 900) and the six letters are drawn for Bold
# (build.BOLD_OWN): interpolated from Regular, it came in at 0.58 of the way, which put 600 at +2.6% (limit 2%) on all-caps words.
CAPW_BLACK = {'T': (0.072, 0.118), 'V': (0.067, 0.066), 'W': (0.110, 0.113), 'X': (0.102, 0.017), 'Y': (0.114, 0.113), 'Z': (0.080, 0.115)}


def capw(p):
    return max(0.0, (p.wght - MID_WGHT) / (900 - MID_WGHT))


@glyph('T', 0x54)
def _T(g, p):
    # wider, as Geist's and Inter's: it carried 0.92x their ink at every weight
    w = p.Hd * (0.97 + CAPW_BLACK['T'][p.italic] * capw(p))
    g.hbar(0, w, p.cap - p.H, pen=flat_pen(p)).vstem((w - p.V) / 2, 0, p.cap - p.H / 2)
    g.ht = 'c'
    g.sb = (0.18, 0.18)


# Black's A: lighter diagonals, and a bar thinner and lower than the other crossbars. Its counter read 0.68x Inter's (as a share of
# the cap height squared) with a bar as heavy as the H's, a dark wedge in AVATAR and RAG
A_DIAG, A_BAR, A_BAR_DROP = 0.08, 0.14, 0.08


@glyph('A', 0x41)
def _A(g, p):
    # heavy A widens and drops its bar, or the counter above the bar closes (Black: 0.38x)
    w = p.Hd * (1.1 + 0.14 * p.heavy)
    if p.italic:  # the italic's narrowing closed Black's counter to 0.89x the upright's
        w *= 1 + 0.06 * p.heavy
    c = w / 2
    # diagonals at (nearly) the full stroke: the A carried 0.90-0.91x the references' ink at every
    # weight. Black widens as much again, so the counter above the bar stays open
    ws = 1.0 - A_DIAG * p.heavy
    a = g.diag(0, 0, c, p.cap, 'l', 'c', ws=ws)
    b = g.diag(w, 0, c + _vertex_step(g, c, p.cap, ws), p.cap, 'r', 'c', ws=ws)
    y = p.cap * (0.27 - A_BAR_DROP * p.heavy)
    g.hbar(on_line(*a, y), on_line(*b, y), y, h=p.bar * (1 - A_BAR * p.heavy))
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('V', 0x56)
def _V(g, p):
    w = p.Hd * (1.07 + 0.1 * p.heavy + CAPW_BLACK['V'][p.italic] * capw(p))
    c = w / 2
    # Regular's diagonals heavier: 0.82-0.91x the ink of Inter, Geist and Helvetica (Black kept)
    g.diag(0, p.cap, c, 0, 'l', 'c', ws=1.0 - 0.07 * p.heavy)
    g.diag(w, p.cap, c + _vertex_step(g, c, p.cap, 1.0 - 0.07 * p.heavy), 0, 'r', 'c', ws=1.0 - 0.07 * p.heavy)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('W', 0x57)
def _W(g, p):
    w = p.Hd * (1.6 + CAPW_BLACK['W'][p.italic] * capw(p))
    # Regular's diagonals were too light (the W carried 0.85x Geist's and Inter's ink against a
    # 0.94x Regular overall); Black's weight is unchanged
    ws = 0.96 - 0.1 * p.heavy
    x1, x3 = w * 0.25, w * 0.75
    step = _vertex_step(g, w / 4, p.cap, ws)
    g.diag(0, p.cap, x1, 0, 'l', 'c', ws=ws)
    g.diag(w / 2, p.cap, x1 + step, 0, 'c', 'c', ws=ws)
    g.diag(w / 2 + step, p.cap, x3, 0, 'c', 'c', ws=ws)
    g.diag(w, p.cap, x3 + step, 0, 'r', 'c', ws=ws)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('M', 0x4D)
def _M(g, p):
    w = p.Hw * (1.24 + M_BLACK * p.heavy)
    g.vstem(0, 0, p.cap).vstem(w - p.V, 0, p.cap)
    # heavier diagonals at Regular (0.87x the references' ink) and, less, at Black (0.88-0.92x)
    ws = 0.94 - 0.04 * p.heavy
    g.diag(exact_shift(g, w / 2, -p.cap, ws), p.cap, w / 2, 0, 'l', 'c', ws=ws)
    g.diag(w - exact_shift(g, -w / 2, -p.cap, ws), p.cap, w / 2 + _vertex_step(g, w / 2, p.cap, ws), 0, 'r', 'c', ws=ws)
    g.ht = 'c'


@glyph('N', 0x4E)
def _N(g, p):
    w = p.Hw
    g.vstem(0, 0, p.cap).vstem(w - p.V, 0, p.cap)
    g.diag(0, p.cap, w, 0, 'l', 'r', ws=0.95)
    g.ht = 'c'


@glyph('Z', 0x5A)
def _Z(g, p):
    w = p.Hd * (0.9 + CAPW_BLACK['Z'][p.italic] * capw(p))
    g.hbar(w * 0.04, w, p.cap - p.H, pen=flat_pen(p), caps=z_caps(p)).hbar(0, w, 0, pen=flat_pen(p), caps=z_caps(p))
    _z_diag(g, w, p.cap, 0)  # the italic's ends stood 10 to 25 units out past the bars
    g.ht = 'c'
    g.sb = (0.35, 0.35 + (0.3 if p.italic else 0) * p.heavy)  # as the italic L


@glyph('X', 0x58)
def _X(g, p):
    w = p.Hd * (1.02 + 0.1 * p.heavy + CAPW_BLACK['X'][p.italic] * capw(p))
    # Regular's diagonals heavier: 0.80-0.90x the ink of Inter, Geist and Helvetica (Black kept)
    g.diag(0, p.cap, w, 0, 'l', 'r', ws=1.0 - 0.07 * p.heavy)
    g.diag(w, p.cap, 0, 0, 'r', 'l', ws=0.97 - 0.07 * p.heavy)
    g.ht = 'c'
    g.sb = (0.1, 0.1)


@glyph('Y', 0x59)
def _Y(g, p):
    w = p.Hd * (1.04 + 0.05 * p.heavy + CAPW_BLACK['Y'][p.italic] * capw(p))  # Black's was 0.87x Inter's width
    c = w / 2
    yj = p.cap * 0.43
    # arms at the full stroke: at 0.92-0.98 the Y carried 0.89-0.92x the ink of Inter, Geist and
    # Helvetica at every weight
    # Each arm's outer edge meets the stem's edge at the join and the arm runs on inside the stem to its middle, where it ends on an
    # upright face. Ended in a flat cut at the join, an arm is wider than the stem there, and its far corner stood out as a ledge on
    # the other side (8 units at Regular, 16 at Black, 33 in the italic's Black).
    for x0, xe, side in ((0, c - p.V / 2, 'l'), (w, c + p.V / 2, 'r')):
        (ax, ay), (bx, by) = g.diag(x0, p.cap, xe, yj, side, side, ws=1.0, exact=(False, True))
        g.strokes.pop()
        xm = c + (1 if side == 'l' else -1)  # a unit past the middle, so the two faces overlap and leave no seam
        g.line((ax, ay), (xm, by + (xm - bx) * (by - ay) / (bx - ax)), ws=1.0, caps=('h', 'v'))
    g.vstem(c - p.V / 2, 0, yj + 2)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('K', 0x4B)
def _K(g, p):
    w = p.Hd * (0.98 + 0.08 * p.heavy)
    g.vstem(0, 0, p.cap)
    a0, a1 = g.diag(p.V / 2, p.cap * (0.33 - 0.04 * p.heavy), w, p.cap, 'c', 'r', ws=0.92, caps=('v', 'h'))  # a steeper arm at Black: its tip at the cap height was a sliver (52 px^2, Inter's 46)
    t = 0.38
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w + 4, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    g.ht = 'c'
    g.sb = (1, 0.1 + K_FOOT * p.heavy)  # Black's foot stands further off (K_FOOT): KL set 0.55x the HH gap upright, 0.49x italic (Inter 0.73x)


# Black's round capitals widen against H (O_BLACK, C_BLACK, G_BLACK, M_BLACK, shares of their round width): released from the width
# gate in round 4, H took its counter back but O C G Q M stayed narrow beside it. Black's O was 1.03x its H's ink width (Inter's 1.08x),
# C 1.01x (1.04x), G 0.98x (1.04x), M 1.24x (1.31x).
# The bowled ones narrow by as much (BOWL_NARROW): Black's B P R D stood 0.97x, 0.98x, 0.98x and 1.02x its H (Inter's 0.91x, 0.89x,
# 0.93x, 0.98x), their counters wide boxes, and the room they give back keeps a mixed-case line inside the width gate.
O_BLACK, C_BLACK, G_BLACK, M_BLACK = 0.045, 0.033, 0.068, 0.055
CAP_O_SQUARE = 0.1
BOWL_NARROW = {'B': 0.06, 'P': 0.09, 'R': 0.05, 'D': 0.04}


@glyph('O', 0x4F)
def _O(g, p):
    w = p.Hd * (1.17 + O_BLACK * p.heavy)
    g.oval(0, -p.ov, w, p.cap + p.ov, k=p.k + CAP_O_SQUARE * p.heavy, drawn=True)
    g.anchors['horn_x'], g.anchors['horn_y'] = _horn_on_bowl(p, w, p.cap)  # Ơ
    g.ht = 'c'
    g.sb = (0.62, 0.62)


Q_TAIL = 30
CAP_C_RUN_IT = 0


@glyph('Q', 0x51)
def _Q(g, p):
    w = p.Hd * (1.17 + O_BLACK * p.heavy)
    g.oval(0, -p.ov, w, p.cap + p.ov, k=p.k + CAP_O_SQUARE * p.heavy, drawn=True)
    # the tail ends Q_TAIL lower than it did, at every weight (its right edge and the advance stay): it stopped 27 under the baseline
    # at Regular and 32 at Black, a stub beside Inter's 56 and 70
    g.diag(w * 0.6, p.cap * 0.2 - 60 * p.heavy, w + p.V * 0.2 + 30 * p.heavy, -p.ov - 40 + 0.32 * p.V - 40 * p.heavy - Q_TAIL, 'c', 'r', ws=0.9, caps=('b', 'b'))  # a square end: the flat cut left a sliver at its lower corner; Black's starts lower and ends longer, in the ring's wall: its square start poked a spur into the counter
    g.ht = 'c'
    g.sb = (0.62, 0.5)


@glyph('C', 0x43)
def _C(g, p):
    w = p.Hd * (1.12 + (0.07 + C_BLACK) * p.heavy)  # Black's C was 0.75x Geist's and Inter's width, Regular's 0.88x
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    # terminals sit 14° further round than they first did, at every weight, as in Geist and Inter:
    # the open aperture left the C at 0.79x their ink at Regular and 0.71x at Black; and 6° more
    # later, when it still carried 0.85-0.93x the ink of Inter, Geist and Helvetica
    # The italic's Black ends as the c's: its last quarter squarer and on a near-flat face, so the lower end is blunt, not a wedge
    sq, run = (C_SQUARE_IT, CAP_C_RUN_IT) if p.italic else (0.0, 0.0)
    g.stroke(g.arc(cx, cy, rx, ry, 22 + p.ap, 270) + g.arc(cx, cy, rx, ry, 270, 338 - p.ap + run * p.heavy, p.k + sq * p.heavy), caps=('b', 'b'), cut='t' if p.italic else 'h', tilt=C_TILT_IT)
    g.ht = 'c'
    g.sb = (0.62, 0.45)


G_SPUR = 0.12


@glyph('G', 0x47)
def _G(g, p):
    w = p.Hd * (1.12 + G_BLACK * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap + p.ov)
    # the top terminal sits where the C's does, at every weight (it was 14° more open at Regular)
    # Black's last quarter, under the bar, is squarer (G_SPUR): its inner edge curved away under the bar and left a notch where they
    # met; squared, the side stands near upright to the bar as Inter's spur does. The spur's top is cut flat on the bar's top ('h'):
    # cut square to the slanted stroke, the italic's stood 13 units over the bar at its inner corner and fell under it outside
    k = p.k + G_SPUR * p.heavy
    g.stroke(g.arc(cx, cy, rx, ry, 22 + p.ap, 270) + g.arc(cx, cy, rx, ry, 270, 360, k=k), caps=('b', 'h'), cut='h')  # aligned with C
    xr = cx + rx
    # ends inside the curve's stroke: run to its outer edge, the bar overhung where the curve
    # turns inward below it
    g.hbar(cx + rx * 0.08, xr, cy - p.H, w=p.H)  # w: the slanted pen drew the italic's bar 3 units over the spur's flat top
    g.ht = 'c'
    g.sb = (0.62, 0.8 - (0.5 if p.italic else 0) * p.heavy)  # the heavy italic's Go sat 28% loose


@glyph('D', 0x44)
def _D(g, p):
    w = p.Hw * (1.06 - (0.04 + BOWL_NARROW['D']) * p.heavy)  # as b
    V, H = p.V, p.H
    xr = w - V / 2
    ry = (p.cap - H) / 2
    rx = min(ry * 1.02, (xr - V / 2) * 0.62)
    cx, cy = xr - rx, p.cap / 2
    g.stroke([L((V / 2, p.cap - H / 2), (cx, p.cap - H / 2))] + g.arc(cx, cy, rx, ry, 90, -90) + [L((cx, H / 2), (V / 2, H / 2))], pen=flat_pen(p))
    g.vstem(0, 0, p.cap)
    g.ht = 'c'
    g.sb = (1, 0.62)


def _bowl_right(g, x0, xr, ytop, ybot, ratio=1.0):
    """A P/B/R bowl: bars from the stem centre at ytop/ybot (centerlines), round on the right."""
    ry = (ytop - ybot) / 2
    rx = min(ry * ratio, (xr - x0) * 0.75)
    cx = xr - rx
    cy = (ytop + ybot) / 2
    g.stroke([L((x0, ytop), (cx, ytop))] + g.arc(cx, cy, rx, ry, 90, -90) + [L((cx, ybot), (x0, ybot))], pen=flat_pen(g.p))
    return cx


@glyph('P', 0x50)
def _P(g, p):
    w = p.Hw * (0.93 + (0.05 - BOWL_NARROW['P']) * p.heavy)  # heavy P's bowl grew, or its counter closed: now it is wider than Inter's
    V, H = p.V, p.H
    g.vstem(0, 0, p.cap)
    _bowl_right(g, V / 2, w - V / 2, p.cap - H / 2, p.cap * (0.44 - 0.04 * p.heavy) + H / 2, 1.05)
    g.ht = 'c'
    g.sb = (1, 0.55)


@glyph('R', 0x52)
def _R(g, p):
    w = p.Hw * (0.98 - BOWL_NARROW['R'] * p.heavy)
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
    w = p.Hw * (0.97 - BOWL_NARROW['B'] * p.heavy)
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
    g.anchors['horn_x'], g.anchors['horn_y'] = w - p.V * 0.35, p.cap - p.V * 0.3  # Ư: off the right stem's top
    g.ht = 'c'
    g.sb = (1, 1)


@glyph('J', 0x4A)
def _J(g, p):
    w = p.Hd * 0.8
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
    g.sb = (0.4 + J_HOOK * p.heavy, 0.9)  # J_HOOK: Black's hook reached under the I's slab, IJ 0.51x the HH gap upright (Inter's 0.70x)


def _ell_seg(cx, cy, rx, ry, a0, a1, k):
    """One cubic along an ellipse from a0 to a1 (degrees), which may cross a quadrant boundary.
    Its handles scale with the span from the quarter-arc squareness k, so it matches arc()."""
    t0, t1 = math.radians(a0), math.radians(a1)
    h = k / 0.5523 * 4 / 3 * math.tan((t1 - t0) / 4)
    p0 = (cx + rx * math.cos(t0), cy + ry * math.sin(t0))
    p3 = (cx + rx * math.cos(t1), cy + ry * math.sin(t1))
    return ('C', p0, (p0[0] - h * rx * math.sin(t0), p0[1] + h * ry * math.cos(t0)),
            (p3[0] + h * rx * math.sin(t1), p3[1] - h * ry * math.cos(t1)), p3)


def _steepen(seg, deg):
    """A cubic whose last handle is turned `deg` degrees counter-clockwise about its end: a terminal arriving steeper than the
    ellipse it was cut from, so a near-flat face cuts it square (a blunt end) where the round would leave a long wedge."""
    if not deg:
        return seg
    a = math.radians(deg)
    (x2, y2), (x3, y3) = seg[3], seg[4]
    dx, dy = x2 - x3, y2 - y3
    return (seg[0], seg[1], seg[2], (x3 + dx * math.cos(a) - dy * math.sin(a), y3 + dx * math.sin(a) + dy * math.cos(a)), seg[4])


def _S(g, p, w, top, ov, pen=None, term=32, spine=0.1, run=0, run_up=None, close=0, bowl=0.03, flat=0.2, deep=0, tilt=None, straight=0.0):
    """S/s/$ spine: upper arc, a cubic spine at full stem weight, lower arc."""
    V, H = p.V, p.H
    yb, yt = -ov, top + ov
    # upper bowl height (outer); Black gives it more, or its counter closes under the heavier pen
    hu = (yt - yb) * (0.47 + bowl * p.heavy)
    wu = w * 0.94
    PV, PH = pen if pen else (V, H)
    cxu, cyu, rxu, ryu = g.box(w * 0.03, yt - hu, w * 0.03 + wu, yt, PV, PH)
    cxl, cyl, rxl, ryl = g.box(0, yb, w, yb + (yt - yb) - hu + PH + deep * p.heavy, PV, PH)
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
    hd = dy * (0.55 + flat * heavy)
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
    if straight:
        # the terminal's own handle longer at Black: the curve straightens into the cut, so the inner edge, which runs inside the
        # centreline's radius of curvature there, meets the face in a clean corner instead of curling back into a nib
        e = 1 + straight * heavy
        s0, s1 = up[0], lo[-1]
        up[0] = (s0[0], s0[1], tuple(lerp(a, b, e) for a, b in zip(s0[1], s0[2])), s0[3], s0[4])
        lo[-1] = (s1[0], s1[1], s1[2], tuple(lerp(a, b, e) for a, b in zip(s1[4], s1[3])), s1[4])
    # Three strokes, so the spine gets its own pen: the default angle pen thins a diagonal spine
    # too far at Regular, while a constant full stem closes the counters at Black. A heavier
    # hairline (1.15 H) does both. The joins sit at the bowls' vertical extremes, where every
    # pen is exactly one stem wide, so they are seamless.
    # heavy terminals are cut square and tipped only as far as keeps the face near flat (cut='t'): the old
    # half-way turn pivoted on the outer edge and stretched the inner one into a tongue
    cut = 't'
    g.stroke(up, caps=('b', 'b'), pen=pen, cut=cut, tilt=tilt)
    # Heavier, the spine carries more: at 1.15 H a Black spine was 60% of a stem and the s read
    # as a lightning bolt beside Geist's and Inter's near-full-weight spines.
    g.stroke([spine_seg], pen=(PV, PH * (1.15 + spine * heavy)))
    g.stroke(lo, caps=('b', 'b'), pen=pen, cut=cut, tilt=tilt)


def _s_extra(p):
    # s stacks three horizontals plus a diagonal spine inside one x-height, so it runs out of
    # counter before any other letter as weight rises; heavy weights give it extra width
    return 1.1 * max(0.0, p.V - 90)


# Black's S (round 4, cycle 2): its upper bowl takes 0.03 - S_BOWL more of the height (S_BOWL was 0.03, which put the spine's middle
# 0.56 up and left the upper counter 0.47x the lower, Inter's 0.91x) and its lower terminal runs S_RUN_CAP degrees round, not 34, so
# the smaller lower bowl keeps its counter (upper / lower 0.95 upright and 0.94 italic). No master's outline crosses itself.
S_BOWL = -0.15
S_RUN_CAP = 32
CAP_S_TILT = 12
# CAP_S_UP (round 5): the upright Black S's (horizontals' extra weight, spine's extra weight, spine flatness, upper bowl share,
# terminal tilt, upper and lower terminals' run, terminal handle `straight`). Round 4's (0.1, 0.3, 0.2, 0.18, 12, 14, 32, -0.3) left a
# spine 184 units thick at the middle under horizontals of 150 (Inter's 170 and 162), a diagonal spine that pinched the upper counter
# to a slit at its left end, and a lower terminal run past the vertical and cut on a tilt, whose inner edge curled back from the face:
# a step into the counter. Lighter and flatter, the spine leaves both counters round-ended, 116 and 122 units tall (Inter's 121 and
# 130), and each terminal ends where its bowl turns vertical, cut level (quality.py reads both faces square, 190 thick), as Inter's.
CAP_S_UP = (0.2, 0.0, 0.4, 0.14, 0, 24, 26, 0.0)
CAP_S_RUN_UP = 14
# Black's s: see _s. S_LIGHT: its horizontals are this much lighter (the upper counter's throat read 0.70x Inter's).
S_FLAT_IT = 0.2
S_WIDE, S_WIDE_IT, S_SB = 0.04, 0.06, 0.1
S_LIGHT, S_LIGHT_IT = 0.14, 0.25
S_RUN = (14, 0, 4, -2)
S_STRAIGHT = -0.3


@glyph('S', 0x53)
def _S_(g, p):
    # capitals have room, so half the s's extra width; a heavier spine, as Geist's and Inter's S
    # and heavier horizontals: Black's top and bottom were 12% thinner than theirs, and the S
    # carried 0.86x their ink
    # (Regular's terminals sit 14° further round too: the S carried 0.80x their ink at Regular)
    # Black's upper terminal runs 20 degrees round, not 34: run on as far, its inner edge folded into a long beak (see S_BOWL)
    # Round 5, upright Black (the italic keeps round 4's): see CAP_S_UP
    hk, spine, flat, bowl, tilt, run_up, run, straight = (0.1, 0.3, 0.2, 0.03 - S_BOWL, CAP_S_TILT, CAP_S_RUN_UP, S_RUN_CAP, S_STRAIGHT) if p.italic else CAP_S_UP
    _S(g, p, p.Hd * 0.94 + _s_extra(p) * 0.5, p.cap, p.ov, pen=(p.V, p.H * (1 + hk * p.heavy)), spine=spine, run=run, close=26, bowl=bowl, run_up=run_up, tilt=tilt, straight=straight, flat=flat)
    g.ht = 'c'
    g.sb = (0.5, 0.5)


# ============================================================================================
# Lowercase
# ============================================================================================


def caption(p):
    """1 at the Caption master (opsz 8), 0 elsewhere."""
    return 1.0 if p.opsz == 8 else 0.0


def join_taper(p):
    """How much a bowl or arch thins where it flows into its stem (1 = not at all).

    The stroke leaves the stem tangentially, so the counter arches round into the stem and this
    only lightens the join. Thin has no room to thin; Regular thins most, where a full-weight join
    clots the stem's side. The more it thins, the more obliquely the stroke's inner edge crosses the
    stem's edge, so thinning is paid for in counter_join_angle: 0.7 left the Regular italic bowls
    3 deg under Inter's tolerance and 0.8 at Black left the counter's corner a chamfer again (38 deg
    against Inter's 48). The tangent join cuts no V at Black, so it needs little thinning."""
    V = min(max(p.V, 22.0), 190.0)
    return 1.0 - 0.17 * (V - 22) / (84 - 22) if V <= 84 else 0.83 + (BLACK_JOIN - 0.83) * (V - 84) / (190 - 84)


# Black's arch and bowl joins (round 4). At 0.95 an arch left the stem at full weight and its counter's crotch read dark and blunt
# (quality.join_ratio 0.76-0.81 against Inter's 0.45-0.46): the taper only thinned the end buried in the stem, since the stroke
# ramped back to full weight in the first sixth of its quarter (geom._ease). Black now thins to BLACK_JOIN and ramps back across
# JOIN_REACH quarters (join_reach), and the near quarter starts JOIN_FLUSH of half the thinning off the stem's centre (join_flush),
# so the inner edge still leaves the stem low and round and the thinning comes off the outside: n 0.57, m 0.59, b 0.69 (italic
# 0.71-0.74), the counters' corners 51-61 deg. Regular is unchanged (join_reach and join_flush are Regular's at heavy 0).
BLACK_JOIN, JOIN_REACH, JOIN_FLUSH = 0.45, 2.0, 1.0

# n h u: arch height over its half-width (m's is 1.12). At 0.93 the counter's ceiling met the stem at
# 51 deg at Regular where Inter's meets it at 66: a squat arch turns its corner too early.
ARCH_RY = 1.10

# How far short of the stem's tangent point (degrees) a bowl or arch stroke starts. The end is buried
# in the stem, so it never shows; stopping short keeps the end segment partial, which the quadratic
# conversion codes in fewer points (a full quarter at both ends of every bowl cost the italic 324 B
# of woff2 and broke its budget). The cap's corner stays inside the stem up to about 18 degrees; 8 is
# the value, among those that keep every join check passing, that put the italic under its budget.
JOIN_RUN = 8

# The face of the 6 and 9 terminals at Black, degrees from horizontal (the shared HEAVY_TILT is 28; the a uses
# that, and the g has its own literal values in _g). Inter's end in a face under 10; at 28 the cut left a beak.
FLAT_TILT = 18
A_END = 18  # degrees further round at Black: the top arc of the æ's a half (the g's tail has its own run in _g)
AE_A, AE_E = 0.1, 0.05  # Black's wider a and e halves of æ, as shares of the n width
AEI_A, AEI_E = -0.04, 0.14  # the italic's single-storey a half is a little narrower and its e wider: its eye closed to 0.65x Inter's
A_ARC_IN = 0.24  # Black's top arc starts this many stems further right: its terminal sat 0.15 x-heights left of the bowl, a beak (Inter's sits inside)
A_BOWL_SLOPE = 0.15  # extra slope of the bowl's top at Black, so its counter rises toward the stem like Inter's (Black read 3.6 deg, Inter 12)
A_BOWL_WALL = -0.06  # Black's bowl wall is thinner than the stem (as Inter's is), so the counter is a wide teardrop and not a slot
A_BOWL_LOW, A_BOWL_LOW_AE = 0.03, 0.015  # Black's bowl top sits this share of the x-height lower than the +0.05 lift (0.015 -> 0.02 opened the a's mouth 46 -> 49, Inter 51; 0.03 with round 5's level top, which raised the bowl under the arc's end: 27 -> 41; æ keeps 0.015), and
A_BOWL_FLOOR = 0.14  # its floor is this much of a bar thicker (not thinner): the counter stays short against its width, as Inter's does, which keeps its area under the cap
A_FILLET = 0.18  # extra share of a stem in the radius where the bowl's top meets the stem at Black: a steeper top left a spur there, not a U
A_TOP_LIFT = 0.35  # how far up the stem the counter's top meets it, in the round's radius (none at Black, where it rises along the slope)
A_TOP_ROUND, A_TOP_HANDLE = 0.12, 0.5  # the bowl top's round into the stem, at least this share of the x-height; its handle at the crown, a share of the run to the stem
A_FOOT, A_NOTCH = (0.13, 0.12), (70, 55)  # (Regular, Black): where the bowl's bottom meets the stem's edge (x-heights up) and the angle it rises at there, as Inter's
A_JOIN, A_FLOOR = (0.9, 0.6), (62, 88)  # (Regular, Black): see _a_bowl
A_BELLY = 0.6  # see _a_bowl
A_TIP = 5  # units: see _a_bowl
# Round 5 (2): Black's bowl redrawn as Inter's. Its top was one straight diagonal from the stem to the left side (the crown sat over
# the counter's right end, 0.76 of the way to the stem, on a 0.22 slope), and the counter a teardrop pointed at the stem: its floor
# rose 88 units along a diagonal into the stem, and its top fell away on the same 0.22 slope. Now the outer top runs level
# (A_TOP_SLOPE) to a crown A_CROWN of the way to the stem (under the arc's end, which keeps the mouth open), then turns round into the left side; the counter's top slopes A_IN_SLOPE
# (12 deg against Inter's 12), the bowl's top is A_TOP_THIN lighter by the stem, and the floor meets the stem lower (A_JOIN) and
# arrives along it (A_FLOOR) on a quarter-ellipse's handles (A_FLOOR_K), so the counter is a D, round on the left and on the floor.
# The bottom's handle into the notch is A_CHIN of the run (0.8 left a chin where it turned).
A_TOP_SLOPE, A_CROWN, A_IN_SLOPE, A_TOP_THIN, A_FLOOR_K, A_CHIN = 0.0, 0.7, 0.11, 0.15, 0.55, 0.6
A_TUCK = (0.6, 0.3)  # (Regular, Black) the italic a's last quarter: see _a
A_ARC_END = 13  # the a's arc runs less far round than the g's tail: ending higher keeps its mouth open once the end moved inward


# The italic's Black arches (n h m u r) are not the upright's half-ellipse. Their crown sits ARCH_LEAN of the half-span toward
# the stem they leave, on a quarter ARCH_DEEP taller than the far one, and they leave that stem thinned to ARCH_JOIN. The far
# quarter is then the wider one, so the counter's ceiling still comes down round into the far stem when the body narrows
# (round 2's counter trim): on the half-ellipse, slanted, a body trimmed by 5 to 12 units met the h's far stem and the u's
# near one 1-6 deg under quality.py's join-angle floor, which kept the italic's Black counters as wide as Regular's stems
# allowed and its rhythm at 0.30. The upright keeps the half-ellipse: thinned to 0.6 its join read 30 deg (floor 29) for no
# gain in white. ARCH_JOIN 0.85 -> 0.4 (round 4), ramped and set off the stem as the upright's (BLACK_JOIN): join 0.88 -> 0.71.
# Round 4, cycle 3: ARCH_DEEP 0.2 -> 0 and ARCH_LEAN -0.18 -> 0. The tall narrow quarter at the stem, thinned to ARCH_JOIN, left the
# counters of n h m u a teardrop at 230-300 px, pointed where they meet the stem (the u's at its foot); on the half-ellipse they are
# round there, as Inter Italic's are.
ARCH_JOIN, ARCH_DEEP, ARCH_LEAN, ARCH_LIFT = 0.4, 0.0, 0.0, 1.0


def arch_join(p):
    return lerp(join_taper(p), ARCH_JOIN, p.heavy) if p.italic else join_taper(p)


def join_flush(p, taper):
    """How far off its stem's centre a thinned arch or bowl starts (see _arch): half what the taper takes off, at Black."""
    return p.V * (1 - taper) / 2 * p.heavy * JOIN_FLUSH


def bowl_arc(g, cx, cy, rx, ry, stem_left, round_in=False, run=JOIN_RUN):
    """A bowl closing on a stem, its two quarters at the stem narrowed by join_flush (b p left, d q g right).

    `round_in` (b d p q): the narrowed quarters keep the full quarter's handle at the top and bottom, so they narrow only toward the
    stem. Narrowed all along, the counter's corners on the stem side were cut off at Black (its inner edge 10 units in at 45 degrees,
    where the far side is round), a chamfer and a straight run into the stem; now the counter is round on both sides, as Inter's."""
    d = join_flush(g.p, join_taper(g.p))
    near = (lambda a0, a1: _round_in(g.arc(cx, cy, rx - d, ry, a0, a1), cx, 1 + (rx / (rx - d) - 1) * round_in)) if round_in else (lambda a0, a1: g.arc(cx, cy, rx - d, ry, a0, a1))
    if stem_left:
        return near(180 - run, 90) + g.arc(cx, cy, rx, ry, 90, -90) + near(-90, -180 + run)
    return near(run, 90) + g.arc(cx, cy, rx, ry, 90, 270) + near(270, 360 - run)


def _round_in(segs, cx, k):
    """A narrowed quarter's handle at its top or bottom (the end on x = cx) lengthened by k, as the full quarter's."""
    out = []
    for sg in segs:
        q0, q1, q2, q3 = sg[1:]
        if abs(q3[0] - cx) < 1e-6:
            q2 = (cx + (q2[0] - cx) * k, q2[1])
        if abs(q0[0] - cx) < 1e-6:
            q1 = (cx + (q1[0] - cx) * k, q1[1])
        out.append((sg[0], q0, q1, q2, q3))
    return out


def join_reach(p):
    """Segments an arch's or bowl's thinning ramps across from its stem: Regular's first 1/1.6 of the quarter at the stem
    (geom._ease), Black's JOIN_REACH quarters."""
    return lerp(1 / 1.6, JOIN_REACH, p.heavy)


def _arch(g, a, b, y, ry, up=True, run=JOIN_RUN):
    """The two quarters of an arch from a stem centred on a to one centred on b, crown (or, for the u, floor) centreline at y."""
    h = g.p.heavy if g.p.italic else 0.0
    rx = (b - a) / 2
    cx = a + rx * (1 + ARCH_LEAN * h)
    s = 1 if up else -1
    ryl = ry * (1 + ARCH_DEEP * h)
    # the near quarter leaves the stem off its centre by half what the taper takes off, so the thinned stroke's inner edge still
    # leaves the stem's edge low and the counter's corner stays round: the thinning comes off the outside (see BLACK_JOIN)
    a1 = a + join_flush(g.p, arch_join(g.p))
    # The italic's Black crown sits higher (the u's floor lower) by what the thinning takes off its outside (ARCH_LIFT of it): thinned
    # across both quarters, the crown's outer edge came 18 units under the stem's end, and the stem's corner stood above the arch as a
    # notch at display sizes. The counter is that much taller.
    y += s * ARCH_LIFT * h * (1 - lerp(arch_join(g.p), 1.0, _smooth(1 / join_reach(g.p)))) * g.p.H / 2
    return g.arc(cx, y - s * ryl, cx - a1, ryl, s * (180 - run), s * 90) + g.arc(cx, y - s * ry, b - cx, ry, s * 90, 0), y - s * ry


def shoulder(g, xl, xr, top, ry_k=None):
    """n-arch from a stem whose left edge is xl to a right stem whose left edge is xr."""
    p = g.p
    a, b = xl + p.V / 2, xr + p.V / 2
    ry = (b - a) / 2 * (ARCH_RY if ry_k is None else ry_k)
    segs, cy = _arch(g, a, b, top - p.H / 2, ry)
    g.stroke(segs + [L((b, cy), (b, 0))], taper=(arch_join(p), 1), reach=(join_reach(p), None))


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


# Round 4, cycle 3: Black's u runs its quarter at the right stem all the way round (JOIN_RUN 8 -> 0, as the b d p q bowls'): stopped
# short, the counter's wall turned off the stem's edge at an 8-degree kink a third of the way up, a step at 300 px.
U_RUN = 1.0


@glyph('u', 0x75)
def _u(g, p):
    w = p.nw
    a, b = p.V / 2, w - p.V / 2
    # the n's arch turned half a turn: it leaves the right stem and runs down into the left one
    segs, cy = _arch(g, a, b, -p.ov * 0.4 + p.H / 2, (b - a) / 2 * ARCH_RY, up=False, run=JOIN_RUN * (1 - U_RUN * p.heavy))
    segs = [(s[0],) + tuple((a + b - q[0], q[1]) for q in s[1:]) for s in segs]
    g.stroke([L((a, p.xh), (a, cy))] + [reverse_seg(s) for s in reversed(segs)], taper=(1, arch_join(p)), reach=(None, join_reach(p)))
    g.vstem(w - p.V, 0, p.xh)
    g.anchors['horn_x'], g.anchors['horn_y'] = w - p.V * 0.35, p.xh - p.V * 0.3  # ư


# Round 4, cycle 3. Black's arm thinned from the stem across both its quarters (join_reach 2) and so thickened again toward its end,
# where the vertical cut, on a stroke still rising at 28 degrees, hung the face's lower corner 40 units under the arm's inner edge:
# a beak at 230-300 px. The thinning now stays in the quarter at the stem (R_REACH), the arm ends R_END degrees further round
# (62 -> 78), and its radius grows R_GROW so the arm's ink ends where it did (advance held): a flat arm cut square, as Inter's.
R_END, R_REACH, R_GROW = 16, 1.0, 0.12
# R_JOIN (round 5, upright): Black's arm leaves the stem at this share of its weight, not the arches' BLACK_JOIN 0.45. The r has no
# second stem to keep a counter open, and at 0.45 its arm hung from the stem on a neck half as thick as the arm (Inter's r keeps
# about two thirds of its arm's weight at the join).
R_JOIN = 0.65


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
    rx *= 1 + R_GROW * p.heavy
    taper = arch_join(p) if p.italic else lerp(arch_join(p), R_JOIN, p.heavy)
    g.stroke(g.arc(a + rx, cy, rx, ry, 180 - JOIN_RUN, 62 - p.ap * 0.5 + R_END * p.heavy), taper=(taper, 1), caps=('b', 'b'), reach=(min(join_reach(p), R_REACH), None))
    g.sb = (1, 0.35 + (0.25 if p.italic else 0) * p.heavy)  # ra, re, ro sat 10% tighter than in the references


@glyph('dotlessi', 0x131)
def _dotlessi(g, p):
    g.vstem(0, 0, p.xh)


@glyph('l.ss02')
def _l_ss02(g, p):  # plain l: opt-in
    g.vstem(0, 0, p.asc)
    g.ht = 'a'


# Round 5, italic 2: the italic's tail is less tall (L_FLAT -0.15 -> 0) and reaches L_TOE further (26 -> 40): turning on a tall narrow
# quarter, it curled in under the stem and the l read as a ( at 700 (the judge's flaw 3). It now runs out along the baseline as a foot,
# as the t's does, and L_RSB_IT (0.95 -> 0.62 stem sidebearings) gives back what the tail took, so the advance is unchanged and the
# toe stands as far from an m or l after it as the n's stems do (lm 1.0x -> 0.85x Inter Italic's closest white, nn 0.84x).
L_TOE, L_FLAT, L_RSB_IT = 40, 0.0, 0.62
# The upright's Black tail is flatter (its height L_FLAT_UP of its reach shorter) and the white after it L_RSB stems wider: as
# round as it was long it read as a ( at 700-900 and crowded the next letter (klm, ll). After it now the nn gap (0.80 -> 1.0).
# Bold's own L_BOLD_OPEN (the h (1 - h) term is nothing at Regular and Black): on the line between them 700 kept 0.79 (now 0.84).
L_FLAT_UP, L_RSB, L_BOLD_OPEN = 0.27, 0.6, 1.0
# Round 5 (2): L_FLAT_UP and L_BOLD_OPEN above, L_LONG, L_TOE_THIN and L_LIFT below. Black's tail ran 30 units past a 190-unit stem
# on a toe 109 tall, its inner edge a 30 x 108 tick into the toe: a stubby hook with a pinched step. It reaches 13 units further, its
# turn 0.78 as tall as it is long (it was 1.3x, L_FLAT_UP -0.25 -> 0.27), on a toe a tenth lighter than the bar (0.2 before), and its
# inner edge leaves the stem L_LIFT of the turn higher on one quarter-ellipse (glyphs._l, even_inner): one calm curve. The white after
# the toe holds (L_RSB), so Black's advance grows by the reach (Black's space gives it back, SPACE_BLACK); Bold's L_BOLD_OPEN 0.8 -> 1.0
# keeps the white after the tail 0.84x the nn gap once Bold's n opened (build.BOLD_OPEN_SB).
# Round 4, cycle 2: the upright's Black tail ran 21 units past the stem as a toe as tall as a bar, and its inner edge folded
# back 7 units where it left the stem: a nib stuck on the stem at display sizes. It reaches L_LONG further (30 units, Bold's 31
# before) on a toe L_TOE_THIN lighter than the bar, and L_FLAT_UP 0.35 -> 0.15 gives the turn the room it needs (an ellipse
# flatter than that folds a 190-unit pen's inner edge): it reads as a tail, as 700's does. Each unit it reaches is a unit of
# advance (the white after it holds), and 600 sets "Billing" within 7 units of its +2%.
L_LONG, L_TOE_THIN = 22, 0.1
# Round 4, cycle 3: Black's tail still read as a wart at 230-300 px, a tick then a block. The angle pen thinned the stroke from the
# stem's 190 to the toe's 110 as soon as the turn began, so its inner edge left the stem on a 7-unit radius (the tick) and then
# swept flat into a toe face 110 tall (the block). Black's pen is now even (the stem's width) and thins to the toe over the turn's
# last L_REACH (geom._smooth), so the inner edge leaves the stem on a wide radius and runs in one concave curve into the toe; the
# turn is taller for it (L_FLAT_UP 0.15 -> -0.25, italic L_FLAT 0.35 -> -0.15), and the italic's toe is cut along the slant
# (L_FACE), as its t's foot is, where its vertical face met a leaning stem in a notch. Reach, toe and advance are unchanged.
L_REACH, L_FACE = 0.5, 's'
L_INNER = 0.55
L_LIFT = 0.9


@glyph('l', 0x6C)
def _l(g, p):  # tailed by default
    a = p.V / 2
    # A short tail that grows slower than the stem: a long heavy tail turns ill into iʟʟ at Black. It
    # ends square (a vertical face, not the oblique butt of a stroke still rising) and inside its own
    # advance: the tail used to overhang by 12-21 units and met the next letter.
    # Heavier, a little shorter and further from the next letter: Black's tail ran into m, l and u (lm, ll), and the italic's read as a ( beside k
    rx = 52 + p.V * 0.4 - 12 * p.heavy  # -30 folded the inner edge of Black's tail into a spur (inner radius 3 units)
    ry = rx * (1.05 - L_FLAT_UP * p.heavy)
    toe = p.H
    if p.italic:
        # The italic's Black tail is longer and flatter: at the upright's size it was a rounded corner with a toe a ninth of a stem long
        # under a leaning stem, and the l read as a ( in Il1 and klm. A toe a quarter of a stem long on a quick turn reads as a foot.
        rx += L_TOE * p.heavy
        ry = rx * (1.05 - L_FLAT * p.heavy)
    else:
        rx += L_LONG * p.heavy
        ry += L_LONG * p.heavy * (1.05 - L_FLAT_UP)
        toe *= 1 - L_TOE_THIN * p.heavy
    cy = -p.ov * 0.4 + toe / 2 + ry
    h = p.heavy
    face = L_FACE if p.italic and h else 'v'
    g.stroke([L((a, p.asc), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 270), caps=('b', face), pen=(p.V, lerp(toe, p.V, h)), taper=(1, lerp(1, toe / p.V, h)), reach=(None, L_REACH))
    if not p.italic:
        # Round 5: the upright's tail evens out its expanded inner edge. The pen thins to the toe over the turn's last half, so at
        # Black the expansion left that edge's first handle 0.14 of its drop (Regular's 0.48): it ran straight down from the stem
        # and turned into the toe in a 30-unit corner, a flat on the curve at display sizes. It is L_INNER of the drop now, as an
        # ellipse's quarter; Regular and Thin are unchanged.
        def even_inner(cs, h=h):
            c = cs[0]
            i = next(j for j, sg in enumerate(c) if sg[0] == 'C')
            _, q0, q1, q2, q3 = c[i]
            # Round 5 (2): Black's inner edge leaves the stem L_LIFT of the turn's drop higher and runs to the toe on a quarter
            # ellipse's handles (L_INNER of the drop and of the run), so the tail is one calm curve and not a tick into a toe.
            top = (q0[0], q0[1] + L_LIFT * h * (q0[1] - q3[1]))
            q1 = (q1[0], top[1] - lerp(q0[1] - q1[1], L_INNER * (top[1] - q3[1]), h))
            q2 = (q3[0] - lerp(q3[0] - q2[0], L_INNER * (q3[0] - q0[0]), h), q2[1])
            c[i] = ('C', top, q1, q2, q3)
            c[i - 1] = c[i - 1][:-1] + (top,)
            return cs

        g.strokes[-1].post = even_inner
    g.ht = 'a'
    g.sb = (1, 0.28 + (0.08 + L_RSB_IT * p.heavy if p.italic else L_RSB * p.heavy + L_BOLD_OPEN * p.heavy * (1 - p.heavy)))


@glyph('dotlessj', 0x237)
def _dotlessj(g, p):
    x = p.V * 0.5 + 70
    rx = 70 + p.V * 0.3
    ry = rx * 1.15
    cy = p.desc + p.H / 2 + ry
    g.stroke([L((x, p.xh), (x, cy))] + g.arc(x - rx, cy, rx, ry, 0, -90) + [L((x - rx, p.desc + p.H / 2), (x - rx - 12, p.desc + p.H / 2))])
    # the dotted j's ink is wider than this stem (the dot), so 0.5 here reads as the 0.6 of the n's that the other three letters have
    g.sb = (0.5 + (0.04 + 0.55 * p.heavy if p.italic else 0), 1)
    g.anchors['top_x'] = x


BOWL_THIN = 0.14
# Round 4, cycle 3. Black's b d p q bowls run their stem-side quarters all the way round (JOIN_RUN 8 -> 0 degrees, BOWL_RUN): stopped
# 8 degrees short, the two quarters left a gap at mid-height that only the stem filled, and where the thinned bowl's inner edge
# stood a few units off the stem's edge (5 at 900 opsz 48) the counter had a notch there, a point on its stem side. The italic's
# narrowed quarters keep BOWL_ROUND_IT of the full quarter's handle (glyphs.bowl_arc round_in): the whole of it, slanted, made
# the counter's corner at the foot of the stem (b p) and at its head (d q) a point.
BOWL_RUN, BOWL_ROUND_IT = 1.0, 0.5


def bowl_pen(p):
    """The pen of a bowl that closes on a stem (b d p q, the 6 and 9): Black's top and bottom are BOWL_THIN lighter than its arches.
    Their counters read 0.90-0.92x Inter's as a share of the x-height squared, the o's 1.19x, so bdpq were darker than the o beside them."""
    return (p.V, p.H * (1 - BOWL_THIN * p.heavy))


def _bowl_lc(g, p, w, stem_left):
    """b/p (stem_left) or d/q bowl. Returns nothing; draws the open arc meeting the stem."""
    V = p.V
    if stem_left:
        x0, x1 = V / 2 - V / 2, w  # left centerline sits on the stem centre
        cx, cy, rx, ry = g.box(x0, -p.ov, x1, p.xh + p.ov)
        g.stroke(g.drawn(bowl_arc(g, cx, cy, rx, ry, True, BOWL_ROUND_IT if p.italic else 1.0, JOIN_RUN * (1 - BOWL_RUN * p.heavy)), cx, cy, rx, ry), taper=(join_taper(p),) * 2, pen=bowl_pen(p), reach=(join_reach(p),) * 2)
    else:
        cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
        g.stroke(g.drawn(bowl_arc(g, cx, cy, rx, ry, False, BOWL_ROUND_IT if p.italic else 1.0, JOIN_RUN * (1 - BOWL_RUN * p.heavy)), cx, cy, rx, ry), taper=(join_taper(p),) * 2, pen=bowl_pen(p), reach=(join_reach(p),) * 2)


@glyph('b', 0x62)
def _b(g, p):
    # heavy bowls narrower: at Bold and Black the counters ran 16-40% larger than Inter's, Geist's
    # and Helvetica's at equal ink, mostly from width (Regular's width is by design, section 8)
    w = p.nw * (1.08 - 0.05 * p.heavy)
    g.vstem(0, -0, p.asc)
    _bowl_lc(g, p, w, True)
    g.ht = 'a'
    g.sb = (1, 0.62)


@glyph('p', 0x70)
def _p(g, p):
    w = p.nw * (1.08 - 0.05 * p.heavy)  # as b
    g.vstem(0, p.desc, p.xh)
    _bowl_lc(g, p, w, True)
    g.sb = (1, 0.62)


@glyph('d', 0x64)
def _d(g, p):
    w = p.nw * (1.08 - 0.05 * p.heavy)  # as b
    g.vstem(w - p.V, 0, p.asc)
    _bowl_lc(g, p, w, False)
    g.ht = 'a'
    g.sb = (0.62, 1)
    g.anchors['topright_x'] = w + p.S * 0.3


@glyph('q', 0x71)
def _q(g, p):
    w = p.nw * (1.08 - 0.05 * p.heavy)  # as b
    g.vstem(w - p.V, p.desc, p.xh)
    _bowl_lc(g, p, w, False)
    g.sb = (0.62, 1)


G_TAPER = 0.6  # see _g


@glyph('g', 0x67)
def _g(g, p):
    w = p.nw * 1.07  # as e
    V, H = p.V, p.H
    xr = w - V / 2
    rx = (w - V) / 2 * 0.98
    # Upright: the tail is shallower and runs further round, ending in a 12 degree face (user decision: Black
    # a/g/9 faces 15-20), a blunt end with a 60 unit gap to the bowl. The italic keeps its own values: the same
    # change makes its corners a wedge.
    ry = 104 + p.V * 0.25
    if p.italic:
        end, tilt = -152 + p.ap - 3 * p.heavy, 24
    else:
        ry *= 1 - 0.2 * p.heavy
        end, tilt = -152 + p.ap - 18 * p.heavy, 12
    cy = p.desc - p.ov * 0.5 + H / 2 + ry
    # The tail's end rises steeply, where the pen is a stem wide, from a floor a hairline thick: the inner edge turned up in a step
    # just short of the cut (Black 137 -> 190 across the last quarter). The end thins by G_TAPER of that difference.
    te = 1 - G_TAPER * (1 - p.H / p.V)
    g.stroke([L((xr, p.xh), (xr, cy))] + g.arc(xr - rx, cy, rx, ry, 0, end), caps=('b', 'b'), cut='t', tilt=tilt, taper=(1, te))
    cx, cy2, rx2, ry2 = g.box(0, 18, w, p.xh + p.ov)
    # Round 5: the italic's bowl closes on its stem as the italic d's does (bowl_arc round_in, its stem-side quarters run all the way
    # round at Black): ending 8 degrees short on the narrowed quarters, its counter ran flat and pointed along the stem
    bowl = bowl_arc(g, cx, cy2, rx2, ry2, False, BOWL_ROUND_IT, JOIN_RUN * (1 - BOWL_RUN * p.heavy)) if p.italic else bowl_arc(g, cx, cy2, rx2, ry2, False)
    g.stroke(bowl, taper=(join_taper(p),) * 2, reach=(join_reach(p),) * 2)
    g.sb = (0.62, 1.15 if p.italic else 1)  # the italic sat 10% tighter on its right than Inter's and Plex's


O_SQUARE = 0.1
# Round 5, italic 2: the italic's heavy rounds are drawn, not sheared (G.drawn). Slanted whole, Black's o b d p q 6 9 O 0 and the
# italic a's bowl had counters pointed at their top right and bottom left, a lozenge (the counter's left extreme 0.20-0.27 of its height
# up, its right 0.72-0.80; Inter Italic's 0.29-0.31 and 0.69-0.72): the judge's "mechanical oblique". Before the slant the sides turn
# back (the right side down, the left up) by ROUND_IT x heavy of their distance from the centre, fading to nothing at the top and
# bottom, so the overshoots, the extremes' level handles and the joins on the stem stay where they were; the counters read 0.28-0.31 /
# 0.69-0.71 at Black. Regular, whose counters already matched Inter's (0.37 / 0.63), is unchanged.
ROUND_IT = 0.2


@glyph('o', 0x6F)
def _o(g, p):
    w = p.nw * (1.1 - 0.05 * p.heavy)  # as b
    g.oval(0, -p.ov, w, p.xh + p.ov, k=p.k + O_SQUARE * p.heavy, drawn=True)
    g.anchors['horn_x'], g.anchors['horn_y'] = _horn_on_bowl(p, w, p.xh)  # ơ
    g.sb = (0.62, 0.62)


C_RUN, C_RUN_IT, C_TILT = 12, (6, 6), 12
C_TILT_IT = 12
# Round 5, italic 2: the italic's Black c, e and x sat closest of any lowercase to their neighbours (closest ink against Inter Italic's at
# 900: ee ec ea 0.62-0.64x, ex 0.65x, ck 0.76x, where nn is 0.84x): "ck", "ex" nearly touched. Their right (x: both) sidebearings open by
# these shares of the stem sidebearing at Black, nothing at Regular. The e pays for it in body width (E_NARROW_IT, a share of the n
# width): a mixed-case line already sat at +9.8% of Regular's width at 900 (test_weight_changes_do_not_reflow_text allows +10%) and
# the e's eye read 1.17x Inter Italic's, so its white moves from inside the letter to beside it (the eye keeps its area through the
# lighter bar, E_BAR_IT). The c, whose counter read as a slit beside Inter's, is a little wider instead (C_NARROW_IT negative).
C_RSB_IT, E_RSB_IT, X_SB_IT = 0.28, 0.23, 0.23
C_NARROW_IT, E_NARROW_IT = -0.01, 0.019
# Bold's own share (the h (1 - h) term is nothing at Regular and Black): on the line between them 700's ee read 0.61x Inter Italic's
# closest white (nn 0.83x); the 600 line, two thirds of Bold's, keeps the mixed-case string under the +2% it may run to.
CE_BOLD_IT = 0.35
C_SQUARE_IT = 0.3


@glyph('c', 0x63)
def _c(g, p):
    # Regular's c was 0.81x Geist's and Inter's width. Heavier it narrows a little, as the e: on Black's untrimmed n (round 4)
    # the +0.02 it had widened by set c 10% over its Regular at Black (n 7%, Inter's c 6%)
    w = p.nw * (1.04 - (0.02 + (C_NARROW_IT if p.italic else 0)) * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    # terminals sit 14° further round than they first did, at every weight: the open aperture left
    # the c at 0.78x Geist's and Inter's ink at Regular and 0.77x at Black, and Bold inherited it
    # Black's terminals run C_RUN (italic C_RUN_IT, upper and lower) further round: short of that, the mouth read 2.3x Inter's
    # beside an e and s at 0.7-1.0x. Both end in near-flat faces as the e's do (cut 't', C_TILT). Round 5: the italic's upper end
    # ran 30 degrees round, to the ellipse's right extreme, and was cut flat across a stroke falling vertically: a beak hanging over
    # a slot of a counter (Black's mouth 72 units at opsz 48). It now ends 6 degrees round (C_RUN_IT), where the slanted stroke still
    # leans enough for the face to lean as Inter's (9 deg; at 12 the slant left it 3.7), and the c reads as open as Inter Italic's.
    # Regular's cut is square.
    ru, rl = C_RUN_IT if p.italic else (C_RUN, C_RUN)
    g.stroke(g.arc(cx, cy, rx, ry, 30 + p.ap - ru * p.heavy, 330 - p.ap + rl * p.heavy), caps=('b', 'b'), cut='t', tilt=C_TILT_IT if p.italic else C_TILT)
    g.sb = (0.62, 0.42 + (C_RSB_IT * p.heavy + CE_BOLD_IT * p.heavy * (1 - p.heavy) if p.italic else 0))


# Black's terminal: E_RUN -14 -> -8 (italic -12) ends it lower, so the aperture opens from a slit; its last quarter is E_SQUARE
# squarer, so the stroke still rises steeply at the cut and the near-flat face (E_TILT) leaves square corners (upright 124 / 76,
# italic 125 / 73; at -6 on the round quarter they were 135 / 68). E_WIDE: Black's e keeps Regular's share of the n, not 2% less,
# so the eye grows with the width the round-4 gate allows (counter 0.0496 -> 0.0525, Inter 0.0471); at +0.02 600 ran +2.1%.
E_END, E_RUN, E_RUN_IT, E_TILT, E_SQUARE, E_WIDE = 322, -8, -12, 12, 0.14, 0.0
# Black's bar is this much thinner than the other crossbars and drops this share of a bar below the middle: its eye read 0.78x Inter's
# (as a share of the x-height squared) while o a g read 1.0-1.2x, so the e was the dark spot of a Black word
E_BAR, E_DROP = 0.32, 0.35
E_SQUARE_IT = 0.14
E_STEEP_IT = 12
E_BAR_IT = 0.2  # the italic's bar is lighter still: its eye read 0.98x Inter Italic's at E_BAR. Round 5: 0.06 -> 0.12, Black's eye
# 108 -> 115 units tall (0.0496 -> 0.0538 of the x-height squared, Inter Italic 0.0458): it read small beside Inter's. Round 5, italic
# 2: 0.12 -> 0.2, so the eye stays as tall as the e narrows (E_NARROW_IT) and grows (0.050 -> 0.056 at opsz 14). A lower bar
# would close the mouth (test_black_e_opens) and open ef (test_heavy_f_leaves_no_hole)
AE_BAR = (0.2, 0.5)  # the e half of æ keeps the bar E_BAR and E_DROP were before round 4, cycle 2: its counter tip against the a half is held to that drawing's
# Caption (opsz 8) draws its horizontals 0.94 of a stem against Regular's 0.87, which closed the e's eye and the a's counter
# (0.109 and 0.124 of the x-height squared, Regular's 0.123 and 0.137) and, through the Caption delta, Black's at opsz 8 (0.046
# and 0.044 against 0.053 and 0.050 at 14). The e's bar and the a's bowl are lighter there by these shares.
E_CAP8, A_CAP8 = 0.25, 0.25
E_TRIM = 0.03  # stems the heavy bar stops short of the outer edge, so its corner sits inside the curve


def _e_body(g, p, x0, w, bar_k=None):
    """The e's bowl and bar in a box from x0, w wide: shared by e and by the e half of æ."""
    cx, cy, rx, ry = g.box(x0, -p.ov, x0 + w, p.xh + p.ov)
    # flush with where the bowl stroke ends, or its butt end shows below the bar; heavy bars drop
    # half their height (still covering that end) so the eye above stays open
    thin, drop = bar_k or (E_BAR + (E_BAR_IT if p.italic else 0), E_DROP)
    bar = p.bar * (1 - thin * p.heavy - E_CAP8 * caption(p))
    yb = cy - p.bar * drop * p.heavy
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
    tail = g.arc(cx, cy, rx, ry, 270, E_END - (E_RUN_IT if p.italic else E_RUN) * p.heavy - p.ap, p.k + (E_SQUARE_IT if p.italic else E_SQUARE) * p.heavy)
    tail[-1] = _steepen(tail[-1], (E_STEEP_IT if p.italic else 0.0) * p.heavy)
    g.stroke(first + g.arc(cx, cy, rx, ry, 90, 270) + tail, caps=('h', 'b'), cut='t', tilt=E_TILT)
    # ends on the bowl's centreline, so the bowl stroke covers it; in the italic the stroke's end
    # is cut on a slant, so the bar stops short of it
    # A heavy bar drops below the middle, where the bowl's outer edge has already turned in: its lower right corner stopped at
    # the centreline and stood out past the bowl, a step at the aperture (Black). It now stops on the outer edge at that height.
    dy = min(1.0, (cy - yb) / (ry + p.H / 2))
    x1 = min(cx + rx, cx + (rx + p.V / 2) * math.sqrt(1 - dy * dy) - E_TRIM * p.V * p.heavy)
    g.hbar(cx - rx, x1 - (p.V * 0.18 if p.italic else 0), yb, h=bar)


@glyph('e', 0x65)
def _e(g, p):
    _e_body(g, p, 0, p.nw * (1.06 + (E_WIDE - (E_NARROW_IT if p.italic else 0)) * p.heavy))
    g.sb = (0.62, 0.5 + (E_RSB_IT * p.heavy + CE_BOLD_IT * p.heavy * (1 - p.heavy) if p.italic else 0))


def _a_bowl(g, p, xs, wf, stem=True):
    """The double-storey a's bowl, left of a stem centred on xs (in æ, the e's left stroke: `stem` False).

    An outer shape and a counter drawn directly, not a stroke. As a stroke, the bowl's thickness
    followed the pen and its diagonal join into the stem, and at Black the counter shrank to a
    slit with a nick at its lower right. Drawn, each thickness is its own master parameter, and
    the counter's right side runs flat against the stem as in Geist and Inter. Regular keeps its
    proportions. Heavy weights lift the bowl a little. (They once also lightened its left side and
    lifted it more; set against Inter, Geist and Helvetica, Black's counter was then 1.5x theirs.)
    """
    V = p.V
    h = p.heavy
    k = p.k
    ybt = p.xh * (0.57 + 0.05 * h - (A_BOWL_LOW if stem else A_BOWL_LOW_AE) * h)  # top of the bowl
    yb0 = -p.ov  # bottom of the bowl
    xe = xs - V / 2  # stem's left edge
    rxb = (xs - V / 2) / 2 * wf
    cxb = V / 2 + rxb  # horizontal centre of the bowl's round left half
    th = p.bar * (1 - A_CAP8 * caption(p))  # top and bottom of the bowl
    tl = V * (1 + A_BOWL_WALL * h)  # left side of the bowl
    cy = (ybt + yb0) / 2
    ry = (ybt - yb0) / 2
    # the bowl's top rises toward the stem, as Inter's and Geist's do: a flat top meeting a vertical
    # stem read as a slab at Black
    slope = 0.07 + (A_IN_SLOPE if stem else A_BOWL_SLOPE) * h
    slope_o = 0.07 + A_TOP_SLOPE * h if stem else slope
    xc = cxb + (A_CROWN * xe - cxb) * h if stem else cxb  # the outer top's crown
    rise_i = slope * (xe - cxb)
    # The top ends against the stem's left edge in a rounded corner, so the aperture closes in a U
    # (Inter's) and not in a spur where the line crossed the arc's inner round
    # (clamped to the room left of the stem: in the narrower æ half a bigger round ran the top backwards)
    fr = max(A_TOP_ROUND * p.xh, min((0.32 + A_FILLET * h) * V, 0.8 * (xe - cxb)))
    yE = ybt + rise_i
    yq = ybt + slope_o * (xe - xc) + fr * 0.6
    # The top leaves the stem as one curve, tangent to the stem's edge, and turns into the sloped top at the bowl's crown, as
    # Inter's does: a fillet of a third of a stem (7 units at Thin) on a straight top read as a ruled line into the stem.
    xh_, xhi = (xe - xc) * A_TOP_HANDLE, (xe - cxb) * A_TOP_HANDLE
    # The bottom meets the stem's edge at A_FOOT of the x-height, rising at A_NOTCH degrees: a clean notch over a foot, as Inter's.
    # Arriving vertically at the stem's centre it crossed the edge at 20 degrees, 0.09 x-heights up (a sliver of white over a stub).
    tn = math.radians(A_NOTCH[0] + (A_NOTCH[1] - A_NOTCH[0]) * h)
    yx = p.xh * (A_FOOT[0] + (A_FOOT[1] - A_FOOT[0]) * h)
    # Black's bowl is lowest A_BELLY of the way to the stem, not at cxb (0.76 of the way): from there it had 75 units to turn
    # through 60 degrees into the notch, and turned in a corner (a chin); Inter's is lowest about half way
    xb = cxb + (min(cxb, A_BELLY * xe) - cxb) * h
    xX = xe - (yx - yb0) / math.tan(tn)  # where the bottom's tangent meets the notch's: the curve between stays convex
    # The notch's tip is a flat A_TIP units wide at Black (1 at Regular), as Inter's: a sharp one is a slit of white the spur check
    # reads (2.9 units^2 at Black), and the round it was until round 5 turned 145 degrees in 5 units, a bead of ink on the chin
    # that read as a nick at display sizes.
    tip = 1 + (A_TIP - 1) * h
    t1 = (xe - tip, yx)
    xX -= tip
    dt = 0.55 * (yx - yb0) / math.sin(tn)
    outer = [
        L((xs, yq), (xe, yq)),
        ('C', (xe, yq), (xe, yq - fr * 0.9), (xc + xh_, ybt + slope_o * xh_), (xc, ybt)),
        ('C', (xc, ybt), (xc - xc * k, ybt - slope_o * xc * k), (0, cy + ry * k), (0, cy)),  # leaves the sloped top along its own direction
        ('C', (0, cy), (0, cy - ry * k), (xb - xb * k, yb0), (xb, yb0)),
        ('C', (xb, yb0), (xb + (xX - xb) * lerp(0.8, A_CHIN, h), yb0), (t1[0] - dt * math.cos(tn), t1[1] - dt * math.sin(tn)), t1),
        L(t1, (xe, yx)),
        L((xe, yx), (xs, yq)),
    ]
    yti, ybi = ybt - th * (1 - A_TOP_THIN * h * stem), yb0 + th * (1 + A_BOWL_FLOOR * h)  # a heavy bowl's floor is thicker, as Inter's
    cyi, ryi = (yti + ybi) / 2, (yti - ybi) / 2
    rxi = cxb - tl
    # The counter's floor meets the stem A_JOIN[0] (Regular) to A_JOIN[1] (Black) stems above the outline's notch, rising at
    # A_FLOOR degrees, as Inter's (62 and 36 read by quality.counter_join_angle): the bowl is one stroke of even weight curving
    # into the stem. It used to arrive along the stem 0.62 of the counter up, which with the notch lower left a dark wedge.
    yji = yx + V * (A_JOIN[0] + (A_JOIN[1] - A_JOIN[0]) * h)
    ti = math.radians(A_FLOOR[0] + (A_FLOOR[1] - A_FLOOR[0]) * h)
    yi0, di0 = yti + rise_i + fr * A_TOP_LIFT * (1 - h), fr * 0.5
    di = (yji - ybi) * (0.5 + (A_FLOOR_K - 0.5) * h) / math.sin(ti)
    inner = [
        # the counter's top rises into the stem with the outline's round, so the stroke keeps its weight through the join
        ('C', (xe, yi0), (xe - di0 * 0.7, yi0 - di0 * 0.7 * lerp(1.0, slope, h)), (cxb + xhi * 0.8, yti + slope * xhi * 0.8), (cxb, yti)),
        ('C', (cxb, yti), (cxb - rxi * k, yti - slope * rxi * k), (tl, cyi + ryi * k), (tl, cyi)),
        ('C', (tl, cyi), (tl, cyi - ryi * k), (cxb - rxi * k, ybi), (cxb, ybi)),
        ('C', (cxb, ybi), (cxb + (xe - cxb) * 0.6, ybi), (xe - di * math.cos(ti), yji - di * math.sin(ti)), (xe, yji)),
        L((xe, yji), (xe, yi0)),
    ]
    if not stem:
        # æ: the e's round left side has no foot to notch, and no edge to curve the top into: the round-4 joins (a straight top
        # with a fillet, a bottom arriving vertically inside the e's stroke) stay
        fr = max(0.32 * V, min((0.32 + A_FILLET * h) * V, 0.8 * (xe - cxb)))
        xf, yf, yq = xe - fr, ybt + slope * (xe - fr - cxb), yE + fr * 0.6
        yjo = yb0 + (ybt - yb0) * (0.3 + 0.15 * h)
        yji = lerp(yjo, ybi + (yti - ybi) * 0.62, thin_blend(p))
        outer = [
            L((xs, yq), (xe, yq)),
            ('C', (xe, yq), (xe, yq - fr * 0.55), (xf + fr * 0.55, yf + slope * fr * 0.55), (xf, yf)),
            L((xf, yf), (cxb, ybt)),
            outer[2],
            ('C', (0, cy), (0, cy - ry * k), (cxb - cxb * k, yb0), (cxb, yb0)),
            ('C', (cxb, yb0), (cxb + (xs - cxb) * 0.6, yb0), (xs, yjo - (yjo - yb0) * 0.6), (xs, yjo)),
            L((xs, yjo), (xs, yq)),
        ]
        inner = [
            L((xe, yti + rise_i), (cxb, yti)),
            inner[1],
            inner[2],
            ('C', (cxb, ybi), (cxb + (xe - cxb) * 0.5, ybi), (xe, yji - (yji - ybi) * 0.85), (xe, yji)),
            L((xe, yji), (xe, yti + rise_i)),
        ]
    g.raw += [orient(outer, outer=True), orient(inner, outer=False)]


@glyph('a', 0x61)
def _a(g, p):
    if p.italic:  # single-storey: a bowl closed by a stem at x-height, as in Plex and Source italics
        w = p.nw * 1.04
        g.vstem(w - p.V, 0, p.xh)
        # The bowl's last quarter runs A_TUCK stems inside d's (bowl_arc) and swings out into the stem only at its end, so its outer
        # edge crosses the stem's edge steeply, a clean notch over a foot as in the upright and in Inter Italic. d's quarter ran
        # tangent into the stem and crossed its edge 0.04 x-heights up at Black: a sliver of white over a stub of stem.
        cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
        tuck = (A_TUCK[0] + (A_TUCK[1] - A_TUCK[0]) * p.heavy) * p.V
        q = g.arc(cx, cy, rx - join_flush(p, join_taper(p)) - tuck, ry, 270, 360 - JOIN_RUN)[0]
        last = [(q[0], q[1], q[2], (q[3][0] + tuck, q[3][1]), (q[4][0] + tuck, q[4][1]))]
        taper = join_taper(p)
        segs = bowl_arc(g, cx, cy, rx, ry, False)[:-1] + last
        # Black's bowl is the d's (round 5, italic 2). The round 4-5 ring (a lighter left wall, a heavier top and bottom, set clear
        # of the stem) left the counter a teardrop with a straight top and a V where the bowl met the stem at the baseline; d's bowl
        # runs round into the stem top and bottom (round_in, BOWL_RUN) and takes the italic's drawn round (ROUND_IT), as Inter's.
        hb = bowl_pen(p)[1] * (1 - A_CAP8 * caption(p))
        ring = g.drawn(bowl_arc(g, cx, cy, rx, ry, False, BOWL_ROUND_IT, JOIN_RUN * (1 - BOWL_RUN * p.heavy)), cx, cy, rx, ry)
        vp, hp = p.V, hb
        segs = [(a[0],) + tuple((lerp(u[0], v[0], p.heavy), lerp(u[1], v[1], p.heavy)) for u, v in zip(a[1:], b[1:])) for a, b in zip(segs, ring)]
        g.stroke(segs, taper=(taper,) * 2, pen=(vp, hp), reach=(join_reach(p),) * 2)
        g.sb = (0.62, 1)
        return
    w = p.nw * 0.98  # no narrower at Black: a narrower bowl met its stem at 25 deg, under Inter's 36 - 10
    V, H = p.V, p.H
    xs = w - V / 2  # stem centre
    # top arc
    cxt = xs * 0.5 + 6 + A_ARC_IN * V * p.heavy
    rxt = xs - cxt
    # The arc is no taller at Black (at +18% its end dropped onto the bowl's shoulder and the mouth narrowed to
    # 19 units, Inter's 40): it starts further right (A_ARC_IN) and runs A_ARC_END further round, so the end
    # meets the cut square; forcing a flat face on a stroke still falling at 49 degrees left a pointed wedge
    ryt = p.xh * 0.26
    cyt = p.xh + p.ov * 0.5 - H / 2 - ryt
    g.stroke([L((xs, 0), (xs, cyt))] + g.arc(cxt, cyt, rxt, ryt, 0, 154 - p.ap + A_ARC_END * p.heavy), caps=('b', 'b'), cut='t')
    _a_bowl(g, p, xs, 0.94)
    g.sb = (0.55, 1)


@glyph('s', 0x73)
def _s(g, p):
    # Heavy terminals run round as the S's do (the short upper bowl folds inside past 16°, 8° once
    # slanted), and they carry part of the extra width's job, so the s takes 70% of it.
    # Regular's terminals also sit 14° further round, and its s is 4% wider: it carried 0.77x
    # Geist's and Inter's ink at 0.90x their width
    # Black takes 0.10 off (0.04 before round 4): on the untrimmed n its s set 21% over its Regular (Inter's 11%)
    # Round 4, cycle 2: Black's s read narrow beside Inter's with slits for counters (upper throat 0.70x Inter's, italic spine
    # 0.85x): it is S_WIDE of the n wider (S_SB of the sidebearing pays for most of it), its terminals end S_RUN higher (upright,
    # upright upper, italic, italic upper; they were 18, 16, 10, 8) and the italic's spine lies flatter (S_FLAT_IT; 0.1)
    w = p.nw * (0.92 - (0.10 - (S_WIDE_IT if p.italic else S_WIDE)) * p.heavy) + _s_extra(p) * 0.7
    _S(g, p, w, p.xh, p.ov, run=S_RUN[2] if p.italic else S_RUN[0], run_up=S_RUN[3] if p.italic else S_RUN[1], close=26, bowl=0.22, flat=S_FLAT_IT if p.italic else 0.1, deep=70, pen=(p.V, p.H * (1 - (S_LIGHT_IT if p.italic else S_LIGHT) * p.heavy)))
    g.sb = (0.55 - S_SB * p.heavy,) * 2


F_BOLD_TUCK, F_BOLD_OPEN = 1.0, 0.5
F_STEM_IN, F_HOOK_IN, F_HOOK_IN_IT, F_RSB, F_TAIL = 0.23, 0.126, 0.25, -0.25, 0.35
# Round 4, cycle 2. F_ARM, F_ARM_IT: stems the crossbar's left arm is shorter by at Black. The italic's reached under the letter
#   before it (Black's a, c, g at 0.44-0.56x Inter Italic's white before the crossbar, as shares of the nn gap; now >= 0.85x); the
#   upright's stem moves with it, closer to the letter before, so f's white sits nearer Inter's (ff 1.6x Inter's at Black).
# F_BOLD_RSB: Bold's right sidebearing (the h (1 - h) term is nothing at Regular and Black). With F_RSB 0.2 -> -0.14 the white
#   after the crossbar, fu, is 0.92-0.95x the nn gap at 600-900 (it was 1.04-1.09x, Inter's 0.75x), fi and fl 1.0-1.1x Inter's.
# F_HOOK_CAP: stems the hook's radius grows by at the Caption master (opsz 8), its height held: a longer, flatter hook that reads
#   at 12-13 px, where "of" read as "ot". The right sidebearing gives it back, so the advance holds and the hook overhangs.
F_ARM, F_ARM_IT, F_BOLD_RSB, F_HOOK_CAP = 0.14, 0.145, -0.5, 0.36
# Round 4, cycle 3. F_END (upright, italic), F_TAIL_END, F_CUT: Black's hook ended 30 (italic 24) degrees short of the top on a
#   square cut, and the italic's tail 50 past the bottom: both ends turned back on themselves, so the cut's inner corner stood out
#   as a beak under the hook and a lip on the tail (a tangent break at 300 px), and the hook ran 35 units past the crossbar, which
#   left fi with the hook over the i's dot and f) with a hole under it. They end 10 and 5 degrees from flat now, cut toward the
#   vertical (the italic's along its slant), as Inter's: the hook's face stands over the crossbar's end and the tail is Inter's
#   length (140 units left of the stem, 190 before). F_GIVE (right, italic left) gives the units the hook and the tail took off the
#   ink back to the sidebearings at Black, so the stem keeps its place in the advance (fu, ef unchanged).
F_END, F_TAIL_END, F_CUT, F_GIVE = (42, 42), 45, 'v', (36, 56)
# Round 5: F_TAIL_REG, degrees short of 140 the descender's hook ends at Regular. At 140 it curled back up past the horizontal, a
# fussy upturned tip under the letter before (Inter Italic's and Plex Italic's end level, 110-120 round); now it ends falling flat.
F_TAIL_REG = 22


def _f_hook(p):
    """The f's width, stem position, hook end angle and hook radius."""
    w = p.cn * 0.47 + p.V * 1.69  # heavier stems need a wider f, or the hook has no room to turn
    # Black's stem sits F_STEM_IN stems further left: on Regular's share the crossbar's left arm ran 129 units and its right 57
    # (Inter's Black 84 and 101), so the white under the right arm sat past the hook, a hole before the next letter ("craf t")
    xs = w * 0.28 + p.V * (0.1 - F_STEM_IN * p.heavy)
    # size the hook so its terminal ends above the crossbar's end: a wider hook overhangs empty
    # space and opens a gap before the next letter ("def ault")
    # Heavier weights end the hook higher: near its tip the hook turns tighter than half a Black
    # stroke, and the inner edge folds into a pinhole. The angle stays in one quadrant, so the
    # outline structure (and master compatibility) is unchanged.
    end = 38 + (F_END[1] if p.italic else F_END[0]) * p.heavy
    # The hook reaches 0.15 stems past the crossbar's end at Regular and F_HOOK_IN less at Black (the italic F_HOOK_IN_IT, its slant
    # carries the hook further out): Black's +0.12 overhung its crossbar by 92 units (Inter's 20), and the f is spaced from the hook,
    # so the white under it was a hole after the f. Now 35 (italic 40); round 4 cycle 3, 0.10 -> 0.126 with F_END, F_GIVE: 2 at Black
    # (0.18 opened ff and fu at Black, under 0.125 the crevice under the hook grew past 1.15x Inter's). With the stem moved left the hook's own radius is about as
    # wide as before (151 at Black, 160 with the old +0.12 stems), so its inner edge stays clear of the stem.
    rx = (w * 0.96 - xs - p.V / 2) / (1 + math.cos(math.radians(end))) + p.V * (0.15 - (F_HOOK_IN_IT if p.italic else F_HOOK_IN) * p.heavy)
    return w, xs, end, rx


def _italic_descender(g, p, x, turn=20):
    """Italic f, long s and sharp s: the stem at x runs below the baseline and hooks left under
    the preceding letter, the same size in all three. Returns the hook and the y where it meets
    the stem. `turn`: degrees short of 140 the hook ends at Black (the f's F_TAIL_END), F_TAIL_REG at Regular."""
    rx = _f_hook(p)[3]
    # a wider hook at Black, turned a little less far: at Regular's size the inner edge of Black's hook curled up
    # against the stem and nicked it. F_TAIL 0.5 -> 0.35 (round 4): it ran 303 units left of the stem (Inter's 193), and the f,
    # spaced from it, stood 82 units right of Inter's with a hole before it ("e f g")
    rxb, ryb = rx * (0.9 + F_TAIL * p.heavy), rx * (0.99 + 0.2 * p.heavy)
    cyb = p.desc + p.H / 2 + ryb
    g.tail_was = g.arc(x - rxb, cyb, rxb, ryb, -140 + turn * p.heavy, 0)  # the round-4 tail, which the spacing keeps (tail_give)
    return g.arc(x - rxb, cyb, rxb, ryb, -140 + lerp(F_TAIL_REG, turn, p.heavy), 0), cyb


def tail_give(g, p, hook, rest, **kw):
    """What the shorter Regular tail (F_TAIL_REG) takes off the ink on the left, in sidebearings: given back, so the stem keeps its
    place and the advance its value (test_advances_at_regular_match_a855b5e0). Nothing at Black, whose tail is unchanged."""
    left = lambda segs: min(contour_bounds(c)[0] for c in expand(Stroke(segs + rest, **kw), p.V, p.H))  # noqa: E731
    return (left(hook) - left(g.tail_was)) / p.S


@glyph('f', 0x66)
def _f(g, p):
    V, H = p.V, p.H
    w, xs, end, rx = _f_hook(p)
    # Black's hook is rounder than tall: a tall narrow arc left a slit between its tip and the stem (the bite)
    ry = rx * (1.15 - 0.32 * p.heavy)
    top = p.asc + p.ov * 0.3
    cy = top - H / 2 - ry
    sx = xs + V / 2
    ext = F_HOOK_CAP * V * max(0.0, p.ap) / 7  # Caption only (ap 7); Regular and Display are unchanged
    give = ext * (1 + math.cos(math.radians(end))) / p.S  # what the longer hook adds to the ink's width, in sidebearings
    top_hook = g.arc(sx + rx + ext, cy, rx + ext, ry, 180, end)
    if p.italic:
        # the italic f descends and hooks left under the preceding letter
        hook, cyb = _italic_descender(g, p, sx, F_TAIL_END)
        # square ends (cut='n'): the heavy 'v' cut turned the descender's tip into a spike and left a sliver
        g.stroke(hook + [L((sx, cyb), (sx, cy))] + top_hook, caps=('b', 'b'), cut=F_CUT if p.heavy else 'n')
        give_tail = tail_give(g, p, hook, [L((sx, cyb), (sx, cy))] + top_hook, caps=('b', 'b'), cut=F_CUT if p.heavy else 'n')
        # heavier, the hook ran into the feet of x, y, k, r; and the arm, 9% tight at Bold, met a T
        # The heavy hook is wider (_italic_descender) and pushed the stem right: ef, af, gef read as two words at 600-900. The f
        # sits closer instead; kern.py keeps the hook off the feet of x, y, k, r.
        # Bold sits closer still (the h (1 - h) term is nothing at Regular and at Black): between the two masters the hole was back at 600-700
        # Round 4 (narrower top hook and tail): -1.0 / +0.3 -> -1.6 / +0.8 at Black, so the white after the crossbar matches Regular's
        # (fu 0.68 -> 0.95 of the nn gap) and the stem sits as close to the letter before as Inter's; Bold's tuck 1.8 -> 1.0 and its
        # right side F_BOLD_OPEN wider, or 700 set ef and fu at 0.79 and 0.83 of the nn gap (Regular 0.91, 0.93)
        g.sb = (-0.2 - 1.6 * p.heavy - F_BOLD_TUCK * p.heavy * (1 - p.heavy) + F_GIVE[1] * p.heavy / p.S + give_tail, 0.15 + 0.8 * p.heavy + F_BOLD_OPEN * p.heavy * (1 - p.heavy) - give)
        arm = F_ARM_IT * V * p.heavy
        # Heavy, the crossbar's left end follows the slant (as Inter Italic's does), so its top corner stands back from an r's arm
        # (rf 0.61x Inter Italic's white at Black, now 0.97x) while its bottom one keeps the e's (ef at most 1.15x the nn gap). The
        # right end stays square: slanted, its top corner closed ft to 0.26x the nn gap.
        g.hbar(arm, w * 0.96, p.xh - H, caps=('s' if p.heavy else 'b', 'b'))
        g.ht = 'a'
        return
    else:
        g.stroke([L((sx, 0), (sx, cy))] + top_hook, caps=('b', 'b'), cut=F_CUT if p.heavy else 'n')
        g.sb = (0.45, 0.2 + F_RSB * p.heavy + F_BOLD_RSB * p.heavy * (1 - p.heavy) + F_GIVE[0] * p.heavy / p.S - give)  # crossbar overhang, as for t (fo, ft sat 15% tighter than the references'); F_RSB 0.4 -> 0.2 with the shorter hook (round 4)
        arm = F_ARM * V * p.heavy
    g.hbar(arm, w * 0.96, p.xh - H)
    g.ht = 'a'


T_STEM_IN = 0.25
# Round 4, cycle 3: how far Black's inner corner closes from Regular's round (0.88 left an 18-unit radius, Inter's Black 44): at
# 230-300 px the stem's edge ran into the foot through a pinch, a nub in the italic, where the slant turns it 100 degrees. 0.73: 40.
T_SQUARE = 0.73


@glyph('t', 0x74)
def _t(g, p):
    heavy = p.heavy
    # Heavy t's widen so the crossbar still reaches past the stem on the right.
    w = p.nw * (0.6 + 0.14 * heavy)
    V, H = p.V, p.H
    # Black's stem sits T_STEM_IN stems further left, as the f's: its crossbar's left arm ran 117 units and its right 69 (Inter's
    # Black 67 and 91), so the t read narrow on the right with white before it
    xs = w * 0.24 + V * (0.12 - T_STEM_IN * heavy)
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
    ri = (rx - V / 2) * (1 - T_SQUARE * heavy)  # inner corner: round at Regular, near square at Black
    xe = xr + V * (2.1 - 1.55 * heavy)  # end of the foot
    # Thin keeps its hook short and tight. Regular's radius on a 22-unit stem is wider than the
    # foot is long (the inner arc ran past the foot's end and the outline folded into a blob), so
    # the radius halves and the foot always reaches past the end of the inner arc, as Regular's does.
    f = thin_blend(p)
    ri = lerp(ri * 0.5, ri, f)
    xe = lerp(xr + ri + V * 1.8, xe, f)
    rise = hf * 0.25 * (1 - heavy)  # Regular's foot lifts a little toward its end, Black's is flat
    end_bot = yb + hf * 0.2 * (1 - heavy)
    roy = (rx * 0.9 + H / 2) * (1 - 0.45 * heavy)  # outer corner, up the stem
    rox = min(roy * 1.1, (xe - xl) * 0.7)  # outer corner, along the foot
    # At Thin the outer corner must run concentric with the inner one (a stroke's width apart),
    # or the two arcs drift apart across the bend and fill it with a dark blob. From Regular up
    # the heavier corner is deliberate, so this fades out by wght 400.
    roy, rox = lerp(ri + hf, roy, f), lerp(ri + V, rox, f)
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
    g.sb = ((0.4 - 0.3 * heavy) if p.italic else (0.55 - 0.25 * heavy), (0.05 + 0.25 * heavy) if p.italic else (0.25 + 0.35 * heavy))  # Black's right 0.2 -> 0.35 with the longer right arm (T_STEM_IN): tu 0.73 -> 0.8 of the nn gap, Inter's 0.80
    g.anchors['topright_x'] = xs + V + p.S * 0.4
    g.anchors['topright_y'] = p.asc  # ť's comma reaches the ascender, as ď's and ľ's (and Inter's, Geist's)


# Black's k and w thin their strokes into the joints, as Inter's do: the arm toward the stem and the leg toward the arm (K_JOIN of
# the stroke at that end, on a straight taper), the w's four strokes toward their feet (W_JOIN). At full weight the crotches
# were clotted: the white between the k's stem and arm reached 0.29 x-heights down at Black (Inter's 0.38; the italic's 0.24), the
# w's top crotches 0.50 (Inter's 0.59). The italic's arm leans closer over its stem, so it thins further (K_JOIN_IT) and along its
# whole length (the italic's sliver allowance, Inter Italic's 62, has the room).
K_JOIN, K_JOIN_IT, W_JOIN = 0.55, 0.65, 0.8
# Round 4, cycle 3: the upright leg thins along its whole length, as the italic's does (K_LEG_REACH halves; it was 1). Thinned over
# its first half only, drawn as two straight sides, its left edge bent where the thinning stopped: a step halfway down the leg.
K_LEG_REACH = 2


def _k_taper(g, kj, reach):
    """The last diagonal drawn, thinned to kj at its start over `reach` halves of it: the upright's over its first half only, as
    tapered all along its arm's far end turned into a wedge at Black (quality's sliver 52 against Inter's 46)."""
    st = g.strokes.pop()
    (_, q0, q1), = st.segs
    m = ((q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2)
    g.stroke([L(q0, m), L(m, q1)], ws=st.ws, caps=st.caps, taper=(kj, 1), reach=(reach, None))


@glyph('k', 0x6B)
def _k(g, p):
    w = p.nw * (0.94 + 0.08 * p.heavy)
    g.vstem(0, 0, p.asc)
    kj = 1 - (1 - (K_JOIN_IT if p.italic else K_JOIN)) * p.heavy
    a0, a1 = g.diag(p.V / 2, p.xh * (0.3 - 0.04 * p.heavy), w - 6, p.xh, 'c', 'r', ws=0.92, caps=('v', 'h'))  # as K
    _k_taper(g, kj, 2 if p.italic else 1)
    t = 0.42
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    _k_taper(g, kj, 2 if p.italic else K_LEG_REACH)
    g.ht = 'a'
    g.sb = (1, 0.28 + (0.02 + 0.25 * p.heavy if p.italic else 0))  # ke, ky sat 20% tighter than in Geist and Inter


@glyph('kgreenlandic', 0x138)
def _kra(g, p):
    w = p.nw * 0.94
    g.vstem(0, 0, p.xh)
    a0, a1 = g.diag(p.V / 2, p.xh * 0.3, w - 6, p.xh, 'c', 'r', ws=0.92, caps=('v', 'h'))
    t = 0.42
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))
    g.sb = (1, 0.1)


# Black's v w y: the diagonals met in a crotch 60 units deep under a nearly solid wedge (v 450 wide with two 170-unit strokes; Inter's
# is 590). They are wider (what the width rule leaves: the reflow line holds one v) and their strokes lighter, as a drawn Black's
# diagonals are, so the white reaches a third of the way down.
V_WIDER, W_WIDER, V_LIGHTER = 34, 35, 0.10  # W_WIDER 70 -> 35 (round 4): with DIAG_TRIM halved, Black's w ran 1.46x its n (Inter's 1.35x)


def flat_pen(p):
    """Round 4, cycle 3: the pen of a stroke whose horizontal edges stand on the baseline or the cap height (E F L T Z z 7 bars,
    B D P R bowls). The italic's pen leans with the slant, so it draws a horizontal 5.5 units thicker than H at Black: those bars
    stood 3 units under the baseline and over the cap height, a step against the stem's square end at every corner (E's four,
    L's, B's). Black's pen draws them H thick; Regular is unchanged."""
    if not p.italic:
        return (p.V, p.H)
    c = pen_thickness((1.0, 0.0), 1.0, 0.0, p.slant)  # the share of V in a horizontal's thickness
    return (p.V, lerp(p.H, (p.H - p.V * c) / (1 - c), p.heavy))


def exact_shift(g, dx, dy, ws):
    """Round 4, cycle 3: how far Black's italic moves a diagonal end anchored by its edge so the edge lands where the italic draws
    it (G.hw's `exact`), leaving Regular's anchors where they were: an end measured upright stood 3-8 units past the stem or bar
    it meets (M's top corners, the 4's bar end)."""
    return (g.hw(dx, dy, ws, exact=True) - g.hw(dx, dy, ws)) * g.p.heavy


def _vertex_step(g, dx, dy, ws):
    """Round 4, cycle 3: in the italic a / stroke is drawn wider than a \\ one (the pen leans with the slant), so where the two
    meet in a vertex centred on each other the wider one's corner stood out past the other's edge: a 10-unit spur at the foot of
    Black's v and w, and on the w's middle apex. Black's / ends at a foot (and the \\ at the apex) move over by the difference, so
    the corners meet. dx, dy: the strokes' run and rise. Regular is unchanged."""
    p = g.p
    if not p.italic:
        return 0.0
    return (g.hw(dx, dy, ws, exact=True) - g.hw(-dx, dy, ws, exact=True)) * p.heavy


@glyph('v', 0x76)
def _v(g, p):
    w = p.dnw * 1.10 + V_WIDER * p.heavy  # diagonals need room: v was 0.9x the references' width at Regular and Black
    ws = 0.93 - V_LIGHTER * p.heavy
    g.diag(0, p.xh, w / 2, 0, 'l', 'c', ws=ws)
    g.diag(w, p.xh, w / 2 + _vertex_step(g, w / 2, p.xh, ws), 0, 'r', 'c', ws=ws)
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 15% tighter beside round and straight letters
    g.sb = (0.25, 0.25)


@glyph('w', 0x77)
def _w(g, p):
    w = p.dnw * 1.64 + W_WIDER * p.heavy  # v, w, x, y and z were 0.88-0.91x Geist's and Inter's width at Regular
    ws = 0.86 - V_LIGHTER * p.heavy
    wj = 1 - (1 - W_JOIN) * p.heavy
    step = _vertex_step(g, w / 4, p.xh, ws)
    g.diag(0, p.xh, w * 0.25, 0, 'l', 'c', ws=ws, taper=(1, wj))
    g.diag(w / 2, p.xh, w * 0.25 + step * wj, 0, 'c', 'c', ws=ws, taper=(1, wj))
    g.diag(w / 2 + step, p.xh, w * 0.75, 0, 'c', 'c', ws=ws, taper=(1, wj))
    g.diag(w, p.xh, w * 0.75 + step * wj, 0, 'r', 'c', ws=ws, taper=(1, wj))
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 18% tighter beside round and straight letters
    g.sb = (0.36, 0.36)


# Black's x and z were 0.87x and 0.84x of its n (Inter's 0.94x, 0.91x): the diagonal trim (params.DIAG_TRIM) pinched them beside n and o
X_WIDER, Z_WIDER = 35, 30


@glyph('x', 0x78)
def _x(g, p):
    w = p.dnw * 1.07 + X_WIDER * p.heavy
    g.diag(0, p.xh, w, 0, 'l', 'r', ws=0.93)
    g.diag(w, p.xh, 0, 0, 'r', 'l', ws=0.9)
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 12% tighter beside round and straight letters
    # 0.2 left it 14 units wide at Regular where Inter's is 32; Black's was already as tight as Inter's (11)
    # (Thin's opened white is not added: its x was 35 against Inter's 29, and the diagonals already breathe)
    sb = (0.4 - 0.2 * p.heavy + (X_SB_IT * p.heavy if p.italic else 0)) / p.opened
    g.sb = (sb, sb)


@glyph('y', 0x79)
def _y(g, p):
    w = p.dnw * 1.10 + V_WIDER * p.heavy
    ws = 0.93 - V_LIGHTER * p.heavy
    a = g.diag(w, p.xh, w * 0.36, p.desc, 'r', 'c', ws=ws, caps=('h', 'h'))
    if not p.italic:
        # The italic's curled tail, ending horizontal, on the upright too (Geist's curls as well): a straight
        # diagonal cut off flat read as chopped, and a bent wedge as a boot. The curl grows with weight, so
        # Regular's stays near its straight tail.
        g.strokes.pop()
        (x0, y0), (x1, y1) = a
        d = math.hypot(x1 - x0, y1 - y0)
        ux, uy = (x1 - x0) / d, (y1 - y0) / d
        t = (p.desc * 0.15 - y0) / (y1 - y0)
        q = (x0 + (x1 - x0) * t, p.desc * 0.15)
        reach = 0.45 + 0.55 * p.heavy
        end = (lerp(x1, w * 0.06, reach), p.desc + p.H * 0.55)
        dist = math.hypot(q[0] - end[0], q[1] - end[1])
        tail = ('C', q, (q[0] + ux * dist * 0.45, q[1] + uy * dist * 0.45), (end[0] + dist * 0.4, end[1]), end)
        g.stroke([L(a[0], q), tail], caps=('h', 'b'), ws=ws)
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
        g.stroke([L(a[0], q), tail], caps=('h', 'b'), ws=ws)
    # the left arm ends below the baseline, on the right stroke's centreline: a cut exactly at
    # the baseline leaves its corner showing at heavy weights
    yj = -p.H * 0.5
    g.diag(0, p.xh, on_line(*a, yj), yj, 'l', 'c', ws=ws, caps=('h', 'b'))
    # ỵ's dot below sits right of the descender, under where the arms meet (as Inter's); centred,
    # it disappeared into the descender
    g.anchors['bottom_x'] = on_line(*a, 0) + p.V * 0.5 + p.dot * 0.55
    # spaced against Geist's and Inter's (and Inter's and Plex's italics) pair by pair: it sat
    # about 20% on the left, tighter beside round and straight letters
    g.sb = (0.42, 0.25)


# Round 4, cycle 3: at Black the z's diagonal runs out of its bars' inner corners, as Inter's does: anchored at the bars' centrelines,
# its edges met the bars' inner faces 45 units in from the bars' ends, a ledge on the baseline bar at the left and under the top bar
# at the right. Its ends and edges are anchored Z_LAP units inside the bars, so the two outlines overlap (3 at opsz 48; on the faces they
# left a hairline seam at 900 opsz 48); the ledge left is 8-11 units.
Z_LAP = 6


def z_caps(p):
    """Round 5: the italic's heavy z and Z bars end along the slant, as Inter Italic's do. Cut square, the top bar's end stood over
    the diagonal's edge as a step on the right (and the baseline bar's on the left); Regular keeps square ends and its advances."""
    return ('s', 's') if p.italic else ('b', 'b')


def _z_diag(g, xr, top, xl):
    """z and Z: the diagonal from the top bar's right end (xr) to the baseline bar's left end (xl), its edges and ends anchored at
    Black Z_LAP inside the bars' inner faces (the upright's at their centrelines up to Regular)."""
    # The italic's bars end along the slant (z_caps), through the anchors themselves, and the diagonal's edges are anchored Z_LAP
    # inside the bars' inner faces at every weight, so they run on along those ends. (Square to the bars, the ends stood where the
    # slant puts the bars' centrelines, and the anchors moved back along the slant to meet them; anchored at the centreline up to
    # Regular, the edge left a shelf under the bar's end at 400-800, the step JUDGING.md lists.)
    k = (g.p.H / 2 - Z_LAP) * (1.0 if g.p.slant else g.p.heavy)
    g.diag(xr, top - g.p.H / 2 - k, xl, g.p.H / 2 + k, 'r', 'l', ws=0.95, exact=(True, True))


@glyph('z', 0x7A)
def _z(g, p):
    w = p.dnw * 0.95 + Z_WIDER * p.heavy
    g.hbar(w * 0.04, w * 0.98, p.xh - p.H, pen=flat_pen(p), caps=z_caps(p)).hbar(0, w, 0, pen=flat_pen(p), caps=z_caps(p))
    _z_diag(g, w * 0.98, p.xh, 0)  # as Z's: the italic's ends stood out past the bars at Black, a step on the right
    # the italic's baseline bar slants out under the next letter: heavy, it met X and A
    g.sb = (0.64, 0.64 + ((0.12 + 1.0 * p.heavy) if p.italic else 0))


# ============================================================================================
# Figures (tabular by default: one advance for all ten)
# ============================================================================================


def fw(p):
    return p.fig_adv - 2 * p.Sfig * 0.62


@glyph('zero', 0x30)
def _zero(g, p):
    # wider than the other figures, as Inter's is (0.98 of the figure width was 6% narrower at Regular and 12% at
    # Black); the tabular advance is fixed, so the extra comes out of its sidebearings
    g.oval(0, -p.ov, fw(p) * (1.01 + 0.03 * p.heavy), p.cap + p.ov, k=p.k + CAP_O_SQUARE * p.heavy)  # squarer at Black, as O (sheared, not drawn: drawn, its ink width fell under quality.ZERO_MIN_SHARE)
    g.tab = True
    g.ht = 'c'


@glyph('zero.slash')
def _zero_slash(g, p):
    w = fw(p) * 0.98
    g.oval(0, -p.ov, w, p.cap + p.ov, k=p.k + CAP_O_SQUARE * p.heavy)
    g.line((w * 0.22, p.cap * 0.2), (w * 0.78, p.cap * 0.8), ws=0.7, caps=('b', 'b'))
    g.tab = True
    g.ht = 'c'


@glyph('zero.dot.tf')
def _zero_dot(g, p):
    w = fw(p) * (1.01 + 0.03 * p.heavy)  # the ring is zero's, so ss01 changes nothing about the width
    g.oval(0, -p.ov, w, p.cap + p.ov, k=p.k + CAP_O_SQUARE * p.heavy)
    # The dot is the period's, the largest the counter holds: at Black the counter is narrower than the period's dot is
    # wide, so the dot narrows to 45% of it and stands taller than wide (up to 1.5x), clear of the ring on every side.
    cw = w - 2 * p.V
    dw = min(p.dot, 0.45 * cw)
    dh = min(p.dot, 1.5 * dw)
    cy = p.cap / 2
    g.line((w / 2, cy - dh / 2), (w / 2, cy + dh / 2), w=dw)
    g.tab = True
    g.ht = 'c'


# Old-style figures (onum): 0 1 2 stand at the x-height, 3 4 5 7 9 hang below the line, 6 8 keep
# the lining height (as IBM Plex's). Only the short three are drawn: the figure's own function at
# 1.04 x-height, which is where Plex's sit. The hanging five are composites (build.py).
OSF_HEIGHT = 1.04


def _osf(fn):
    import copy

    def draw(g, p):
        pc = copy.copy(p)
        pc.cap = p.xh * OSF_HEIGHT
        fn(g, pc)
        g.ht = 'x'

    return draw


ONE_FLUSH = 1.0


@glyph('one', 0x31)
def _one(g, p):
    w = fw(p)
    xs = w * 0.55
    g.vstem(xs - p.V / 2, 0, p.cap)
    end = (w * 0.12 + 6 + 20 * p.heavy, p.cap * 0.74)  # Black's flag reached 10% further left than Inter's (12 -> 20 once it started at the top)
    start = (xs, p.cap - p.H * (0.4 + 0.5 * p.heavy))  # Black's flag starts lower: its square start poked a spur above the stem top (2 units upright, 5 italic)
    # Black's flag moves up (ONE_FLUSH of the way) until its upper corner sits on the stem's top left corner, as Inter's does: from
    # 123 under the top the stem stood 60 units proud of the flag, a notch over a separate block
    flush = start
    for _ in range(4):
        t = norm((flush[0] - end[0], flush[1] - end[1]))
        half = pen_thickness(t, p.V, p.H) * 0.82 / 2
        flush = (xs - p.V / 2 + 3 + t[1] * half, p.cap - 3 - t[0] * half)
    start = (lerp(start[0], flush[0], ONE_FLUSH * p.heavy), lerp(start[1], flush[1], ONE_FLUSH * p.heavy))
    g.line(start, end, ws=0.82, caps=('b', 'b'))
    g.tab = True
    g.ht = 'c'


TWO_HEAD = (23, 0.15, 0.07)  # at Black: degrees the bowl's end moves back, the spine's first handle's growth (share of its length) and the bowl's drop (share of the cap)


@glyph('two', 0x32)
def _two(g, p):
    w = fw(p)
    V, H = p.V, p.H
    cx, cy, rx, ry = g.box(w * 0.03, p.cap * (0.42 - TWO_HEAD[2] * p.heavy), w, p.cap + p.ov)
    # Black's bowl ends earlier on the ellipse and the spine takes the turn on a longer handle: the ellipse's side has a radius of 108
    # under a pen of 190, so the counter's inner edge turned from the vertical to the diagonal on a radius of 13 and showed a corner
    # at the neck (Inter's counter is round there)
    end = -38 + TWO_HEAD[0] * p.heavy
    arc_ = g.arc(cx, cy, rx, ry, 158 - p.ap, end)
    pe = arc_[-1][-1]
    tx, ty = arc_[-1][-1][0] - arc_[-1][-2][0], arc_[-1][-1][1] - arc_[-1][-2][1]
    t = norm((tx, ty))
    # outer edge of the foot lands exactly on the bar's start (Black: measured as the italic draws it, see hw; the bar drawn H thick,
    # not the slanted pen's 3 more, so its top meets the foot: the corner stood out as a ledge 4 units wide)
    tgt = (lerp(g.hw(-0.12, -0.3), g.hw(-0.12, -0.3, exact=True), p.heavy), H)
    d = math.hypot(tgt[0] - pe[0], tgt[1] - pe[1])
    spine = ('C', pe, (pe[0] + t[0] * d * (0.35 + TWO_HEAD[1] * p.heavy), pe[1] + t[1] * d * (0.35 + TWO_HEAD[1] * p.heavy)), (tgt[0] + d * 0.12, tgt[1] + d * 0.3), tgt)
    # the top ends in a near-flat face, as c s 3 do (cut 't'): turned to the vertical, the cut ran along a stroke that is itself
    # steep there, and Black's 2 began with a beak
    g.stroke(arc_ + [spine], caps=('b', 'h'), cut='t')  # the spine's foot joins the base bar; only the top is a terminal
    g.hbar(0, w, 0, **({'w': H} if p.heavy else {}))
    g.tab = True
    g.ht = 'c'


glyph('zero.osf')(_osf(_zero))
glyph('one.osf')(_osf(_one))
glyph('two.osf')(_osf(_two))


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
    x0 = xs + V / 2 - V * 0.5 * p.heavy
    g.diag(x0, p.cap, exact_shift(g, x0, p.cap - yb - H / 2, 0.9 - 0.15 * p.heavy), yb + H / 2, 'r', 'l', ws=0.9 - 0.15 * p.heavy, caps=('h', 'h'))
    g.tab = True
    g.ht = 'c'


# FIVE_TAIL: degrees Black's bowl runs on round the lower left (it ends at -174). It stopped at -160 and ended in a wedge with a long
# sloping face, its outer corner 126 up beside Inter's 221; now the end is blunt, the outer edge near vertical under a near-flat cut, the
# corner 187 up, and the face the full stroke thick (187 against Inter's 192). The end stays above -180, where the arc would gain a
# segment, and 28 (-178) cost 140 bytes more in the full font.
FIVE_TAIL = 24
FIVE_FOOT, FIVE_START = 1.03, 0.15


@glyph('five', 0x35)
def _five(g, p):
    w = fw(p)
    V, H = p.V, p.H
    xl = w * 0.1
    # Black's stem runs up to the cap height and the bar starts inside it, by the half bar the slant leans the stem over: in the
    # italic the bar's square end and the slanted stem crossed at mid-bar, a notch of 12 units at the top left corner
    g.hbar(xl + 10 + (H / 2 * p.slant + 2) * p.heavy, w * 0.93, p.cap - H)  # from the stem's own left edge: a square corner
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.cap * 0.63)
    # The bowl starts exactly under the stem, so the stem ends flat on it. With the bowl fixed at
    # 150° and the stem at its own x, the stem's corner stuck out beside the bowl's start: a
    # small step at Regular, a large one at Black. The angle stays in one quadrant.
    xsm = xl + V / 2
    a0 = math.degrees(math.acos(max(-1.0, min(1.0, (xsm + 0.3 * V * p.heavy - cx) / rx))))
    ps = (cx + rx * math.cos(math.radians(a0)), cy + ry * math.sin(math.radians(a0)))
    # lighter weights end the stem a little inside the bowl: flush, its foot showed as a small step
    # (a visible face 36 thick, as a tongue reads) where the thin bowl start leaves it
    # Black's stem runs down to the bowl's inner edge at its start (FIVE_FOOT of the way): ending on the bowl's centreline, its foot
    # stood a step of 90 units above that edge, a ledge and a drop under the stem (Inter's stem edge runs straight into the counter)
    a = math.radians(a0)
    tn = norm((math.sin(a) * rx, -math.cos(a) * ry))
    inner = (0.6 + FIVE_START * p.heavy) * pen_thickness(tn, V, H, p.slant) / 2 * abs(tn[0])
    g.line((xsm + 10, p.cap - H / 2 + pen_thickness((1.0, 0.0), V, H, p.slant) / 2 * p.heavy), (xsm, ps[1] - 0.25 * V * (1 - p.heavy) - FIVE_FOOT * inner * p.heavy), caps=('h', 'h'))
    # Black's bowl starts a third of a stem right of the stem's centre: from the centre its thin start left a small hook
    # below the stem's foot, from there it leaves a clean step under it (Inter's)
    g.stroke(g.arc(cx, cy, rx, ry, a0, -150 + p.ap - FIVE_TAIL * p.heavy), taper=(0.6 + FIVE_START * p.heavy, 1), caps=('h', 'b'), cut='h')
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
    g.oval(0, -p.ov, w, top, H=bowl_pen(p)[1], drawn=True)
    cx, cy, rx, ry = g.box(0, -p.ov, w * (1.02 + 0.15 * p.heavy), p.cap + p.ov)
    cyb = (-p.ov + top) / 2
    g.stroke([L((cx - rx, cyb), (cx - rx, cy))] + g.arc(cx, cy, rx, ry, 180, 44 - 16 * p.heavy + p.ap * 0.5), caps=('b', 'b'), cut='t', tilt=FLAT_TILT)  # heavy terminals run round to 28°, where the stroke is steep and a square cut is a clean face: ending higher (58°) left a blade with a notch in its inner edge
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
    g.hbar(0, w, p.cap - p.H, pen=flat_pen(p))
    g.diag(w, p.cap - p.H / 2, w * 0.3, 0, 'r', 'c', ws=0.95, caps=('b', 'h'))
    g.tab = True
    g.ht = 'c'


EIGHT_WAIST = 0.03


@glyph('eight', 0x38)
def _eight(g, p):
    w = fw(p)
    # Black's waist sits EIGHT_WAIST higher and its upper bowl is wider by as much a side: its upper counter was a slot 0.6x as
    # wide as Inter's over a flat lower one
    ym = p.cap * (0.55 + EIGHT_WAIST * p.heavy)
    g.oval(w * (0.06 - EIGHT_WAIST * p.heavy), ym - p.H, w * (0.94 + EIGHT_WAIST * p.heavy), p.cap + p.ov)
    g.oval(0, -p.ov, w, ym)
    g.tab = True
    g.ht = 'c'


# ============================================================================================
# Punctuation & symbols
# ============================================================================================


SPACE_BLACK = 7


@glyph('space', 0x20)
def _space(g, p):
    # 28 shorter at Black (round 4): its letters' looser sidebearings set the word gap 1.1x Inter's; Inter's space loses 29% by Black
    # Round 5 (2): the upright Black's own SPACE_BLACK shorter still (heavy ** 4 leaves Bold's within a unit): it pays for the l's longer tail in the
    # width rule's strings, and the word gap stays 0.95x Inter's (test_heavy_spacing_stays_open asks 0.90x)
    g.adv_fixed = round(p.Sfig * 2 + 128 - 28 * p.heavy - (0 if p.italic else SPACE_BLACK) * p.heavy ** 4)


@glyph('nbspace', 0xA0)
def _nbsp(g, p):
    g.adv_fixed = round(p.Sfig * 2 + 128 - 28 * p.heavy - (0 if p.italic else SPACE_BLACK) * p.heavy ** 4)  # as the space


# Round 5: the full stop (and the colon's and semicolon's dots, built from it) is PERIOD_TRIM smaller than the i's dot at
# Regular, fading out toward Thin and Black (period_dot). A square dot reads heavier than Inter's round one of the same area, and
# at 300 to 600 a full-size one was the darkest mark in a line of text. The sidebearings take the difference: the advance holds.
PERIOD_TRIM = 0.08


def period_dot(p):
    return p.dot * (1 - PERIOD_TRIM * thin_blend(p) * (1 - p.heavy))


@glyph('period', 0x2E)
def _period(g, p):
    d = period_dot(p)
    g.dot(d / 2, 0, d)
    sb = 0.9 + (p.dot - d) / 2 / p.S
    g.sb = (sb, sb)


def thin_blend(p):
    """0 at Thin, 1 from Regular up: how far a hairline-only adjustment has faded out."""
    return max(0.0, min(1.0, (p.wght - 100) / 300))


def comma_swing(p):
    # Units the comma's tail sweeps left beyond its own taper: Inter's quotes are 0.9-1.0x as wide as the comma-shaped ones were
    # at Regular and 2x at Thin, where the hairline head is 29 wide and the old tail added 17.
    return lerp(42.0, 14.0, thin_blend(p)) + 14.0 * p.heavy


def comma_depth(p):
    # in dots; Black's tail ran 1.7x as deep as Geist's and Inter's. Thin's dot is small, so a tail
    # that long in dots is a speck at 14 px (it read as a period): 3.4 dots is 139 units, which
    # reaches Inter's proportions (it descends 0.27 x-heights) and fades to Regular's by wght 400.
    # Black's is 0.72 shorter (0.55 until round 4): 337 tall at opsz 14 and 329 at 48, 1.04x and 1.10x Inter's 325 and 298, which against
    # a cap height 0.96x Inter's made the quotes large wedges beside the letters. 306 now.
    return lerp(3.15, 1.4, thin_blend(p)) - 0.72 * p.heavy


COMMA_HEAD = 0.5
COMMA_STEM = (1.0, 16.0)  # the comma's widest head (stems, units): see comma_shape


def comma_shape(g, d, x, top, depth, swing=0.0, head=COMMA_HEAD):
    """A grotesque comma: a square head one dot wide, then a tail that curves down and to the
    left and tapers. Every curly quote is built from this (’ ” raised, ‘ “ turned), so the
    curve is what tells them apart from the straight ' and ". A straight wedge read as ″."""
    # The head is as wide as the dot from Regular up, but a hairline weight's dot is almost twice
    # its stem, and a comma that wide is a wedge: Inter's Thin comma is a tick about as thick as
    # its stem. The tail's width follows the stem there, with its left edge kept where the dot's is.
    p = g.p
    f = thin_blend(p)
    w = d * (f + (1 - f) * min(1.0, 1.2 * p.V / p.dot))
    if head == COMMA_HEAD:
        # Round 5: from Light to SemiBold the head is no wider than COMMA_STEM (a stem and a few units), as Inter's comma is a
        # stroke about a stem thick: a full dot's width (1.37 stems at Regular) made , ; and the quotes the darkest marks in
        # text at 300 to 600. Thin and Black are under it already; the tail swings further (comma_swing), so the ink box holds.
        w0, w = w, min(w, p.V * COMMA_STEM[0] + COMMA_STEM[1])
        swing += w0 - w
    x -= (d - w) / 2
    # The head is `head` (COMMA_HEAD; the Greek breathings keep 0.95, their own size) of a dot tall before the tail starts to taper, and the tail is longer by what the head gives up. At a
    # full dot the head was a square with a short tail under it: , ; and the quotes built from it were the darkest marks in a
    # paragraph at 300 to 600 (Inter's taper from the top), and Black's quotes were blocks.
    neck = top - d * head
    depth += d * (0.95 - head)
    end = (x - w * 0.6 - swing, neck - depth)
    tail = ('C', (x, neck), (x, neck - depth * 0.45), (x - w * 0.12 - swing * 0.3, neck - depth * 0.8), end)
    g.stroke([L((x, top), (x, neck)), tail], w=w, taper=(1, 0.15), caps=('b', 'b'))


@glyph('comma', 0x2C)
def _comma(g, p):
    d = p.dot
    comma_shape(g, d, d / 2, d, d * comma_depth(p), comma_swing(p))
    g.sb = (0.9, 0.9)


def _straight_quote(p):
    """(stroke width, length, gap between two) of the straight quotes. Inter's are 0.35 em long at Regular and 0.46 at Black (this
    was a fixed 0.24) and a tenth wider than ours at Regular."""
    blend = thin_blend(p)
    return (p.V * (0.95 + 0.14 * blend * (1 - p.heavy)) + 4 * (1 - blend), p.cap * 0.34 + 28 * blend + 45 * p.heavy, p.V * 0.95 + 60 + 24 * (1 - p.heavy))


@glyph('quotesingle', 0x27)
def _quotesingle(g, p):
    w, ln, _ = _straight_quote(p)
    g.line((w / 2, p.cap), (w / 2, p.cap - ln), w=w, taper=(1, 0.8))
    g.sb = (0.9, 0.9)
    g.ht = 'c'


@glyph('quotedbl', 0x22)
def _quotedbl(g, p):
    w, ln, gap = _straight_quote(p)
    for x in (w / 2, w / 2 + gap):
        g.line((x, p.cap), (x, p.cap - ln), w=w, taper=(1, 0.8))
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
    # the tail leaves along the arc's own tangent: a handle off that line left a kink in the hook's inner edge
    tx, ty = norm((pe[0] - arc_[-1][-2][0], pe[1] - arc_[-1][-2][1]))
    # At Black, hand the arc over to the tail without curvature: the arc turns one way and the tail the other, and a
    # tail that bent at once (a 39-unit handle) made the outer edge turn 30 degrees inside one pen width, a corner. The
    # second handle sits on the tangent line, so the hand-over is smooth in curvature too. Regular's short handle is
    # kept: its pen is thin enough that the edge reads smooth (6 degrees against Inter's 6).
    h = p.heavy
    far = (tgt[0], pe[1] + (tgt[0] - pe[0]) * ty / tx)
    c1 = (lerp(pe[0] + 39 * tx, (pe[0] + far[0]) / 2, h), lerp(pe[1] + 39 * ty, (pe[1] + far[1]) / 2, h))
    c2 = (tgt[0], lerp(tgt[1] + 60, far[1], h))
    g.stroke(arc_ + [('C', pe, c1, c2, tgt)], caps=('b', 'b'), cut='t')
    g.dot(xm, 0)
    del V, H, d
    g.sb = (0.55, 0.6)
    g.ht = 'c'


@glyph('hyphen', 0x2D, 0xAD)
def _hyphen(g, p):
    w = 270 + p.V * 0.3  # Regular's was 0.70x as long as Geist's and Inter's; Black's is kept
    g.hbar(0, w, p.xh * 0.5 - p.H * 0.55, h=p.H * 1.1)
    g.sb = (0.55, 0.55)


ENDASH_W = 500
MINUS_OF_ENDASH = 0.912  # the minus is this much of the en dash's length at most: test_minus_matches_plus asks for 8% shorter


@glyph('endash', 0x2013)
def _endash(g, p):
    g.hbar(0, ENDASH_W, p.xh * 0.5 - p.H * 0.55, h=p.H * 1.1)
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
    w = p.fig_adv - 2 * p.Sfig * 0.7
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
    # Same advance as the plus (it stands in the same column). Up to Bold its ink is 8.8% shorter than the en dash's 500: at the plus's
    # full width (0.479 em at Regular) it read as the en dash. Inter's is 0.458 against 0.500. Above Bold (user decision) it is the
    # plus's full bar, as Inter's is at its heavy weights: a 0.456 em minus beside a 0.567 em plus at Black read as a hyphen in
    # "2-1+3". The Bold master keeps 0.456 (build.mid_master draws it itself), so 800 is the straight line between the two.
    g.hbar(0, w if p.wght > MID_WGHT else min(w, ENDASH_W * MINUS_OF_ENDASH), cy - t / 2, h=t)
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


BAR_OPEN = 0.6


@glyph('bar', 0x7C)
def _bar(g, p):
    g.line((p.V * 0.45, p.desc), (p.V * 0.45, p.asc + 30), w=p.V * 0.9)
    # Round 5 (2): heavier, the bar takes BAR_OPEN more of a sidebearing a side: at 700 `1|` stood closer than `I l` (Inter's 1| is 1.4x
    # its Il), and the heavy rule read as part of the 1
    g.sb = (1.1 + (0 if p.italic else BAR_OPEN) * p.heavy,) * 2


@glyph('brokenbar', 0xA6)
def _brokenbar(g, p):
    x = p.V * 0.45
    g.line((x, p.desc), (x, p.xh * 0.3), w=p.V * 0.9)
    g.line((x, p.xh * 0.62), (x, p.asc + 30), w=p.V * 0.9)
    g.sb = (1.1, 1.1)


# Parentheses, brackets and braces share one height, Inter's 908, centred on 295 (between the x-height's middle and the cap height's,
# which `case` lifts to the caps): the parentheses stood 884 beside brackets of 974.
BRACKET_Y = (295 - 454, 295 + 454)
# Black's stand BRACKET_SHORT shorter: 912 of a 700 cap height is 1.04x Inter's 908 of 728, and beside Black capitals the light, tall
# parentheses read as rules
BRACKET_SHORT = 0.03


def _bracket_y(p):
    h = (BRACKET_Y[1] - BRACKET_Y[0]) / 2 * (1 - BRACKET_SHORT * p.heavy)
    c = sum(BRACKET_Y) / 2
    return c - h, c + h


def _bracket_sb(p, outer, inner, flip):
    """Sidebearings of a bracket, in stem sidebearings. Black's are wider by 0.6 (outer) and 1.2 (inner) of themselves: the letters'
    sidebearing halves by Black, and at that the parentheses touched the letter they enclose and `!(` and `)[` ran together."""
    sb = (outer * (1 + 0.6 * p.heavy), inner * (1 + 1.2 * p.heavy))
    return sb[::-1] if flip else sb


PAREN_BLACK = 1.0


def _paren(g, p, flip):
    # The arc spans 2 sin 58 = 1.7 of its vertical radius and 0.47 of its horizontal one. That one is 262 at every weight, a bow
    # 123 deep: at 150 + 0.2 V the parenthesis was 159 wide at Regular against Inter's 211 and Geist's 214, an almost straight
    # stroke that read as a bracket, and with sidebearings of 53 and 21 (Inter 106 and 47) it clustered in `!(`, `)[`, `f)`.
    y0, y1 = _bracket_y(p)
    cy = (y0 + y1) / 2
    ry = (y1 - y0) / (2 * math.sin(math.radians(58)))
    rx = 262
    cx = rx + p.V / 2
    segs = g.arc(cx, cy, rx, ry, 122, 238, k=0.56)
    # Black's belly is a full stem (PAREN_BLACK), as Inter's: at 0.86 of one the parentheses read light beside Black letters
    s = Stroke(segs, caps=('h', 'h'), ws=0.92 + (PAREN_BLACK - 0.92) * p.heavy)
    if flip:
        s = s.transformed(lambda q: (-q[0], q[1]))
    g.strokes.append(s)
    g.sb = _bracket_sb(p, 1.0, 0.45, flip)


@glyph('parenleft', 0x28)
def _parenleft(g, p):
    _paren(g, p, False)


@glyph('parenright', 0x29)
def _parenright(g, p):
    _paren(g, p, True)


def _bracket(g, p, flip):
    h0, h1 = _bracket_y(p)
    w = 120 + p.V * 0.8
    pts = [(0, h0), (0, h1)]
    s1 = Stroke([L((p.V / 2, h0), (p.V / 2, h1))])
    s2 = Stroke([L((p.V / 2, h1 - p.H / 2), (w, h1 - p.H / 2))])
    s3 = Stroke([L((p.V / 2, h0 + p.H / 2), (w, h0 + p.H / 2))])
    del pts
    for s in (s1, s2, s3):
        g.strokes.append(s.transformed(lambda q: (-q[0], q[1])) if flip else s)
    g.sb = _bracket_sb(p, 1.0, 0.55, flip)  # 0.8 / 0.3 until round 4: 56 / 21 at Regular beside the parentheses' 70 / 31, and `[]` 39 apart (Inter's 77)


@glyph('bracketleft', 0x5B)
def _bracketleft(g, p):
    _bracket(g, p, False)


@glyph('bracketright', 0x5D)
def _bracketright(g, p):
    _bracket(g, p, True)


BRACE_BLACK = 0.08


def _brace(g, p, flip):
    # Black's brace is heavier (BRACE_BLACK on the pen's width, twice that on its height, which the curled ends show): at 0.9 of a
    # stem and the bar's contrast it read light beside Black letters, Inter's runs 0.93 of its stem and its ends a full one
    V, H = p.V, p.H * (1 + 2 * BRACE_BLACK * p.heavy)
    h0, h1 = _bracket_y(p)
    cy = (h0 + h1) / 2
    x = 70 + p.V * 0.5
    r = 110 + V * 0.3  # at 60 + 0.2 V the braces were half as wide as Geist's and Inter's
    xs = x + V / 2 * 0.0
    up = [L((xs + r, h1 - H / 2), (xs + r * 0.98, h1 - H / 2))]
    del up
    s_top = Stroke(g.arc(xs + r, h1 - H / 2 - r, r, r, 90, 180) + [L((xs, h1 - H / 2 - r), (xs, cy + r))] + g.arc(xs - r, cy + r, r, r, 0, -90), ws=0.9 + BRACE_BLACK * p.heavy, pen=(V, H))
    s_bot = Stroke(g.arc(xs - r, cy - r, r, r, 90, 0) + [L((xs, cy - r), (xs, h0 + H / 2 + r))] + g.arc(xs + r, h0 + H / 2 + r, r, r, 180, 270), ws=0.9 + BRACE_BLACK * p.heavy, pen=(V, H))
    for s in (s_top, s_bot):
        g.strokes.append(s.transformed(lambda q: (-q[0], q[1])) if flip else s)
    g.sb = _bracket_sb(p, 0.8, 0.6, flip)  # 0.5 / 0.4 until round 4: 35 / 28 at Regular (Inter's 70 / 60), `]{` 84 apart (Inter's 132)


@glyph('braceleft', 0x7B)
def _braceleft(g, p):
    _brace(g, p, False)


@glyph('braceright', 0x7D)
def _braceright(g, p):
    _brace(g, p, True)


@glyph('numbersign', 0x23)
def _numbersign(g, p):
    w = p.fig_adv - 2 * p.Sfig * 0.6
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


PCT_RING, PCT_SLASH = 0.05, 0.22
PCT_THIN = (0.02, 0.085)  # ring width share and the gap's half height (share of the cap) Thin adds


@glyph('percent', 0x25)
def _percent(g, p):
    # Black's rings are wider (PCT_RING) and its slash lighter (PCT_SLASH): its rings, capped at a third of their size, read 0.51 of
    # a stem beside a slash of 0.93 (Inter's 0.63 and 0.59), light circles under a heavy bar
    w = p.Hw * (1.2 + PCT_RING * p.heavy)
    # Thin's rings (PCT_THIN) stood 0.51 of the cap tall and 0.32 wide, tall narrow ovals that read as a small lower zero beside the
    # slash: Inter's are 0.42 tall (0.43 at 200) and 0.33 wide, a white gap between them. They fade back to Regular's over 100-400.
    thin = 1 - thin_blend(p)
    r = 0.36 + PCT_RING * p.heavy + PCT_THIN[0] * thin
    gap = p.cap * PCT_THIN[1] * thin
    pen = (p.V * 0.82, p.H * 0.82)
    g.oval(0, p.cap * 0.5 + gap, w * r, p.cap + p.ov * 0.6, V=pen[0], H=pen[1])
    g.oval(w * (1 - r), -p.ov * 0.6, w, p.cap * 0.5 - gap, V=pen[0], H=pen[1])
    g.diag(w * 0.82, p.cap, w * 0.18, 0, 'c', 'c', ws=0.8 - PCT_SLASH * p.heavy)
    g.sb = (0.5, 0.5)
    g.ht = 'c'


AMP_LOOP, AMP_LOOP_PEN, AMP_LEG, AMP_BOWL, AMP_START = 0.05, 0.06, 0.2, 0.14, 22


@glyph('ampersand', 0x26)
def _ampersand(g, p):
    w = p.Hw * 1.1
    V = p.V
    hv = p.heavy
    top = p.cap + p.ov
    # upper loop: a closed oval sitting left of centre. Black's is larger and lighter (AMP_LOOP, AMP_LOOP_PEN): its counter was a dot
    # (Inter's an open eye) under a pen of a third of the loop's size
    lx0, lx1, ly0 = w * 0.1, w * (0.6 + AMP_LOOP * hv), p.cap * (0.58 - AMP_LOOP * hv)
    # the loop's own centreline: oval() caps its pen for small rings, so a box with the full pen
    # put the leg's start inside the counter
    Vo, Ho = min(V, (lx1 - lx0) * (0.33 - AMP_LOOP_PEN * hv)), min(p.H, (top - ly0) * (0.33 - AMP_LOOP_PEN * hv))
    g.oval(lx0, ly0, lx1, top, V=Vo, H=Ho)
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
    # Black's leg and bowl are lighter than its stem (AMP_LEG, AMP_BOWL), as Inter's: at the full pen the lower counter was 0.54x Inter's
    ws = 0.96 - AMP_LEG * hv
    k0 = min(1.0, pen_thickness(d, Vo, Ho) / (pen_thickness(d, V, p.H) * ws))
    g.line(start, foot, ws=ws, caps=('b', 'h'), taper=(k0, 1))
    # lower bowl: from under the loop, round the bottom, and on into the arm in one stroke. A
    # separate arm met the bowl end to end at an angle and showed as a broken wedge at Black.
    bx0, bx1 = 0, w * 0.86
    Vb, Hb = V * (1 - AMP_BOWL * hv), p.H * (1 - AMP_BOWL * hv)
    bcx, bcy, brx, bry = g.box(bx0, -p.ov, bx1, p.cap * 0.64, V=Vb, H=Hb)
    bowl = g.arc(bcx, bcy, brx, bry, 62 + AMP_START * hv, 340)  # Black's starts further round, under the loop: at 62 its square end stood out past the loop
    e = bowl[-1][-1]
    # the arm rises steeply and ends on a flat cut, as in Geist and Inter: run out at a shallow
    # angle, it ended in a long flag at heavy weights
    arm = (w - V * 0.4, p.cap * 0.5)
    d = math.hypot(arm[0] - e[0], arm[1] - e[1])
    t = math.radians(340)
    tx, ty = -brx * math.sin(t), bry * math.cos(t)
    tl = math.hypot(tx, ty)
    swing = ('C', e, (e[0] + tx / tl * d * 0.4, e[1] + ty / tl * d * 0.4), (arm[0] - V * 0.1, arm[1] - d * 0.35), arm)
    g.stroke(bowl + [swing], caps=('b', 'h'), taper=(0.7, 1), pen=(Vb, Hb))
    g.sb = (0.55, 0.12)
    g.ht = 'c'


ASTERISK_BLACK = 26


@glyph('asterisk', 0x2A)
def _asterisk(g, p):
    # Regular's was 0.78x the references' size, and sat high; Black's 0.94x. Black's arms are ASTERISK_BLACK longer and a little
    # heavier (0.60 -> 0.64 of a stem): at 176 its ink box was 0.90x Inter's width and 0.86x its height, a small star beside Black letters
    r = 176 + ASTERISK_BLACK * p.heavy
    cy = p.cap - r
    c = r
    for ang in (90, 18, -54, -126, 162):
        a = math.radians(ang)
        g.line((c, cy), (c + r * math.cos(a), cy + r * math.sin(a)), w=p.V * (0.82 - 0.18 * p.heavy), caps=('b', 'b'))  # Black's filled in at 0.82
    g.sb = (0.45, 0.45)
    g.ht = 'c'


AT_PEN, AT_PEN_H, AT_DEEP, AT_BOWL, AT_END, AT_LEFT = 0.03, 0.1, 0.27, 0.1, 14, 0.05


@glyph('at', 0x40)
def _at(g, p):
    w = p.Hw * 1.45
    # @ is mostly counter: cap the pen at heavy weights. Black's cap rises (w 0.13 -> AT_PEN, H 0.8 -> 0.8 + AT_PEN_H of itself) and
    # its ring reaches AT_DEEP further down: at 128 x 108 under a 190 stem its ring was a hairline beside the letters (Inter's Black @
    # carries 1.68x its H's ink, ours 1.44x) and it stood 0.93x Inter's height, its foot high.
    pen = (min(p.V * 0.8, w * (0.13 + AT_PEN * p.heavy)), min(p.H * (0.8 + AT_PEN_H * p.heavy), w * (0.11 + AT_PEN * p.heavy)))
    cx, cy, rx, ry = g.box(0, p.desc * (0.7 + AT_DEEP * p.heavy), w, p.cap + p.ov, V=pen[0], H=pen[1])
    # inner bowl. Black's reaches AT_BOWL of the cap height lower (Inter's runs 0.08 to 0.78), so its counter holds under the heavier
    # pen, and it sits AT_LEFT of the width further left and a little lower: where it was, the stem's top met the deeper ring
    xs = w * (0.7 - AT_LEFT * p.heavy)
    y0, y1 = p.cap * (0.12 - AT_BOWL * p.heavy), p.cap * (0.72 - 0.02 * p.heavy)
    g.oval(w * (0.3 - 0.6 * AT_LEFT * p.heavy), y0, xs + pen[0] / 2, y1, V=pen[0], H=pen[1])
    # stem continuing into the outer ring
    r = (cx + rx - xs) / 2
    yb = y0 + r + 6
    tail = [L((xs, y1), (xs, yb))] + g.arc(xs + r, yb, r, r, 180, 360) + [L((cx + rx, yb), (cx + rx, cy))]
    # Black's ring stops AT_END degrees short, or its end met the stem's curl and closed the white inside the ring
    outer = g.arc(cx, cy, rx, ry, 0, 300 - AT_END * p.heavy)
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
    ru, rl = C_RUN_IT if p.italic else (C_RUN, C_RUN)
    g.stroke(g.arc(cx, cy, rx, ry, 30 + p.ap - ru * p.heavy, 330 - p.ap + rl * p.heavy), caps=('b', 'b'), cut='t', tilt=C_TILT_IT if p.italic else C_TILT)  # as c
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


EURO_BAR, EURO_SPREAD = 0.4, 0.04
EURO_RUN, EURO_CUT, EURO_LIGHT = 6, 'v', 0.2  # Black's C runs 6 degrees further round each end on a pen 0.2 lighter: at the stems' weight its counter was a slit


@glyph('Euro', 0x20AC)
def _euro(g, p):
    w = fw(p)
    # the full figure width, and bars at the full horizontal: it was 0.72x as wide as Geist's and
    # Inter's, and 0.8x their ink
    cx, cy, rx, ry = g.box(w * 0.04, -p.ov, w * 1.1, p.cap + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 46 - EURO_RUN * p.heavy, 314 + EURO_RUN * p.heavy), caps=('b', 'b'), cut=EURO_CUT, tilt=C_TILT, pen=(p.V * (1 - EURO_LIGHT * p.heavy), p.H * (1 - EURO_LIGHT * p.heavy)))
    # Black's bars are EURO_BAR lighter and EURO_SPREAD of the cap further apart: at the full horizontal they overlapped into one
    # block across the C's counter (centres 126 apart, each 137 thick)
    hb = p.H * (1 - EURO_BAR * p.heavy)
    g.hbar(-w * 0.12, w * 0.72, p.cap * (0.56 + EURO_SPREAD * p.heavy) - hb / 2, h=hb)
    g.hbar(-w * 0.12, w * 0.66, p.cap * (0.38 - EURO_SPREAD * p.heavy) - hb / 2, h=hb)
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


GUIL_HEAVY = (7.0, 8.0, 0.075)  # run and half height shortened, centre raised (share of the x-height), at Bold and Black


def _guil(g, p, x0, flip, h=1.0):
    # A chevron is drawn as its outline, not as two pen strokes: two arms with square ends met in a notched tip and ended in corners
    # that pointed at the next chevron, so a Black pair read as one block with nicks in it. Now the tip and the inner corner are
    # points and the arms end flat on a common top and bottom line, as Inter's and Helvetica's do.
    # Geometry is Inter's, read off its boxes and ink (single chevron 224 / 296 / 398 wide at Thin / Regular / Black, 461 tall, ink
    # 93,966 at Black): every weight's arm runs 200 units back from the tip, and only the arm's width follows the weight.
    # Bold and Black (GUIL_HEAVY): Inter's chevron is 0.84 of its x-height tall and its centre 0.55 of it up; at Black's x-height of 528
    # that is 446 tall (it was 462, 0.875), and the arm keeps its width (0.98x Inter's at 900), so the pair stops calling attention to
    # itself. The centre goes to 0.575 (304 up, Inter's 301; it was 264, 0.50) so that Bold, which interpolates Regular and Black 58% of the
    # way, lands at 287 (0.95x Inter's). k fades the change in over 400-Bold, so Regular and lighter stay as they were.
    k = max(0.0, min(1.0, (p.wght - 400) / (MID_WGHT - 400)))
    run = 200.0 - GUIL_HEAVY[0] * k
    th = 8 + p.V  # the arm's width along the line (its thickness across the stroke is about 0.75 of this)
    hh = (231 - GUIL_HEAVY[1] * k) * h
    cy = p.xh * (0.5 + GUIL_HEAVY[2] * k)
    d = -1 if flip else 1
    tip = x0 + (run + th if flip else 0)
    pts = [(tip, cy), (tip + d * run, cy + hh), (tip + d * (run + th), cy + hh), (tip + d * th, cy), (tip + d * (run + th), cy - hh), (tip + d * run, cy - hh)]
    g.raw.append(orient([L(a, b) for a, b in zip(pts, pts[1:] + pts[:1])], outer=True))
    return th


def _guil_pair(g, p, flip):
    # the white between the two chevrons, along the line: Inter's is 85 at Thin, about 105 at Regular and 51 at Black
    th = _guil(g, p, 0, flip)
    _guil(g, p, th + 105 - 20 * (1 - thin_blend(p)) - 50 * p.heavy, flip)


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
    _guil_pair(g, p, False)
    g.sb = (0.5, 0.5)


@glyph('guillemotright', 0xBB)
def _guillemotright(g, p):
    _guil_pair(g, p, True)
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
        give_tail = tail_give(g, p, hook, [L((a, cyb), (a, cy))] + top, caps=('b', 'b'))
    else:
        g.stroke([L((a, 0), (a, cy))] + top)
    yt = cy - ry
    ryl = (yt - H / 2) / 2
    rxl = min(ryl * 1.05, (w - V / 2 - w * 0.36) * 0.8)
    cxl = w - V / 2 - rxl
    g.stroke([L((w * 0.36, yt), (cxl, yt))] + g.arc(cxl, (yt + H / 2) / 2, rxl, ryl, 90, -90) + [L((cxl, H / 2), (w * 0.3, H / 2))])
    g.ht = 'a'
    g.sb = (0.1 + give_tail if p.italic else 1, 0.6)


@glyph('uni1E9E', 0x1E9E)
def _Germandbls(g, p):
    """ẞ: the German capital sharp s as Inter, Geist and Plex draw it, a stem rounding into a
    flat top, a 7-like diagonal, and a bowl below (the round-shouldered B reads as a B)."""
    w = p.Hw * (1.0 + 0.08 * p.heavy)
    V, H = p.V, p.H
    a, yt = V / 2, p.cap - H / 2
    rc = w * 0.3
    xr = w * 0.88
    g.stroke([L((a, 0), (a, yt - rc))] + g.arc(a + rc, yt - rc, rc, rc, 180, 90) + [L((a + rc, yt), (xr, yt))], caps=('b', 'b'))
    ym = p.cap * (0.56 - 0.04 * p.heavy)
    g.diag(xr, yt, w * (0.42 + 0.04 * p.heavy), ym, 'r', 'c', ws=0.95, caps=('h', 'h'))
    ry = (ym - H / 2) / 2
    rx = min(ry * 1.1, (w - V / 2 - w * 0.38) * 0.85)
    cx = w - V / 2 - rx
    g.stroke([L((w * 0.38, ym), (cx, ym))] + g.arc(cx, (ym + H / 2) / 2, rx, ry, 90, -90) + [L((cx, H / 2), (w * 0.26, H / 2))], caps=('b', 'b'))
    g.ht = 'c'
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
    if p.italic:  # single-storey, matching the italic a
        wa = p.nw * (1.0 + AEI_A * p.heavy)
        g.vstem(wa - V, 0, p.xh)
        _bowl_lc(g, p, wa, False)
        _ae_e(g, p, wa - V)
        g.sb = (0.62, 0.5)
        return
    # Black is wider and its top arc is drawn in, ending over the bowl's left edge as Inter's does: with the
    # arc spilling 75 units past the bowl, the a's counter shrank to a slit and the e's to 0.7x Inter's
    wa = p.nw * (0.9 + AE_A * p.heavy)
    xs = wa - V / 2
    cxt = lerp(xs * 0.5 + 6, (xs + V / 2) / 2, p.heavy)
    rxt = xs - cxt
    ryt = p.xh * 0.26
    cyt = p.xh + p.ov * 0.5 - H / 2 - ryt
    g.stroke([L((xs, p.xh * 0.35), (xs, cyt))] + g.arc(cxt, cyt, rxt, ryt, 0, 154 - p.ap + A_END * p.heavy), caps=('b', 'b'), cut='t')
    _a_bowl(g, p, xs, 1.0, stem=False)
    _ae_e(g, p, xs - V / 2)
    g.sb = (0.55, 0.5)


def _ae_e(g, p, x0):
    """The e half of æ, its left side sharing the a's stem."""
    _e_body(g, p, x0, p.nw * (0.96 + (AEI_E if p.italic else AE_E) * p.heavy), AE_BAR)


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
    ry = rx * ARCH_RY  # n's arch and join
    cy = p.xh + p.ov * 0.4 - H / 2 - ry
    r2 = 60 + V * 0.3
    cy2 = p.desc + H / 2 + r2 * 1.1
    g.stroke(g.arc(a + rx, cy, rx - join_flush(p, join_taper(p)), ry, 180 - JOIN_RUN, 90) + g.arc(a + rx, cy, rx, ry, 90, 0) + [L((b, cy), (b, cy2))] + g.arc(b - r2, cy2, r2, r2 * 1.1, 0, -90) + [L((b - r2, p.desc + H / 2), (b - r2 - 20, p.desc + H / 2))], taper=(join_taper(p), 1), reach=(join_reach(p), None))


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
        g.sb = (-0.2 + tail_give(g, p, hook, [L((sx, cyb), (sx, cy))] + top_hook, caps=('b', 'b')), 0.2)
    else:
        g.stroke([L((sx, 0), (sx, cy))] + top_hook, caps=('b', 'b'))
        g.sb = (1, 0.2)
    g.ht = 'a'


@glyph('mu', 0xB5)
def _mu(g, p):
    w = p.nw
    a, b = p.V / 2, w - p.V / 2
    rx = (b - a) / 2
    ry = rx * ARCH_RY  # u's bowl and join
    cy = -p.ov * 0.4 + p.H / 2 + ry
    g.vstem(0, p.desc, p.xh)
    # the right join is u's (thinned, ramped and set off its stem); the left, into a separate stem, keeps the pre-round-4 taper,
    # so the counter, and with it Bold's squeeze (build.counter_squeeze), is u's
    left = join_taper(p) if p.V <= 84 else 0.83 + 0.12 * (min(p.V, 190) - 84) / 106
    g.stroke(g.arc(a + rx, cy, rx, ry, 180 + JOIN_RUN, 270) + g.arc(a + rx, cy, rx - join_flush(p, arch_join(p)), ry, 270, 360 - JOIN_RUN * (1 - U_RUN * p.heavy)), taper=(left, arch_join(p)), reach=(None, join_reach(p)))
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
    g.hbar(-a, a, lift_macron(p), h=p.mt * (0.9 - (0.32 if p.italic else 0.2) * p.heavy))  # Black's was 1.27x as thick (the italic's, at Bold, 1.3x)


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
    # heavier, wider and thinner, or Black's wave closed into a slanted bar that read as a grave
    a = 120 + p.V * 0.2 + 40 * p.heavy
    h = (60 + 15 * p.heavy) * s  # 0.75x the references' height
    t = p.mt * (0.92 - 0.25 * p.heavy)
    y = -(30 if p.italic else 55) * p.heavy  # heavier, the references' tildes sit closer (less so in the italic)
    g.stroke([('C', (-a, y + t / 2 + 2), (-a * 0.45, y + h * 2.4 + t / 2), (a * 0.45, y - h * 0.4 + t / 2 - h * 0.8), (a, y + h + t / 2 + 6))], w=t)


def m_hook(g, p, s):
    # Vietnamese hook above: a small question-mark head. Its radius follows the stroke (a smaller
    # one folds inside), so heavy hooks thin a little to stay compact.
    t = p.mt * (0.75 - 0.25 * p.heavy)
    r = t * 0.9
    cy = r * 0.94 + t / 2
    g.stroke(g.arc(0, cy, r * 1.15, r, 160, -70), w=t, caps=('b', 'h'))


def m_dotbelow(g, p, s):
    # Vietnamese dot below, as far under the baseline as the dot accent sits over the x-height
    d = p.dot * 0.95
    g.dot(0, -70 - d, d)


def m_horn(g, p, s):
    # Vietnamese horn: leaves the letter rightward and turns up, attached at its own origin
    r = 60 + p.V * 0.25
    t = p.mt * 0.95
    g.stroke([('C', (0, 0), (r * 0.65, 0), (r, r * 0.35), (r, r * 1.05))], w=t, caps=('b', 'h'))


def _horn_on_bowl(p, w, top):
    """Where a horn leaves a round bowl: on its outer edge, 40° up its right side."""
    a = math.radians(40)
    rx, ry = w / 2 - p.V * 0.35, (top + 2 * p.ov) / 2 - p.H * 0.35
    return w / 2 + rx * math.cos(a), top / 2 + ry * math.sin(a)


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
    # Against Inter, Geist and Plex it hung 1.2x as deep and 0.02-0.04 too close at every weight,
    # and the heavy ones were too narrow (their head stays wide, their tail gets short)
    d = p.dot * (0.9 - (0.2 if p.italic else 0.1) * p.heavy)
    ln = min(d * 1.75, 120 + d * 0.55) - 40 * p.heavy
    comma_shape(g, d, 0, -58, ln - d)  # the same comma as , and the quotes


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
    ('hookabovecomb', 0x309, m_hook, None),
    ('dotbelowcomb', 0x323, m_dotbelow, None),
    ('horncomb', 0x31B, m_horn, None),
]
TOP_MARKS = {'gravecomb', 'acutecomb', 'circumflexcomb', 'tildecomb', 'macroncomb', 'brevecomb', 'dotaccentcomb', 'dieresiscomb', 'ringcomb', 'hungarumlautcomb', 'caroncomb', 'hookabovecomb'}

for _name, _cp, _fn, _sp in MARKS:
    _mk(_name, _cp, _fn)
    if _name in TOP_MARKS:
        _mk(_name + '.case', None, _fn, case=True)
_mk('caroncomb.alt', None, m_caronalt)


@glyph('uni0259', 0x259)
def _schwa(g, p):
    """ə: the e turned round its centre, as in every grotesque (Azerbaijani, phonetics)."""
    _e(g, p)
    w, top = p.nw * 1.06, p.xh
    g.strokes = [st.transformed(lambda q: (w - q[0], top - q[1])) for st in g.strokes]
    g.sb = (g.sb[1], g.sb[0])


@glyph('uni018F', 0x18F)
def _Schwa(g, p):
    """Ə: the same turned e drawn at the cap height and a capital's width."""
    import copy
    pc = copy.copy(p)
    pc.xh = p.cap
    pc.cn = p.Hw * 1.1 / 1.06 - 2 * p.V  # so pc.nw is a capital's width
    _e(g, pc)
    w, top = pc.nw * 1.06, p.cap
    g.strokes = [st.transformed(lambda q: (w - q[0], top - q[1])) for st in g.strokes]
    g.sb = (0.477, 0.477)  # 0.62 of the lowercase unit, in the capitals' (1.3x)
    g.ht = 'c'

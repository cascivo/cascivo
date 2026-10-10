"""Greek: monotonic Greek, with tonos and dialytika.

Capitals and lowercase that are a Latin or Cyrillic shape (Α Β Γ Ε Ζ Η Ι Κ Μ Ν Ο Π Ρ Τ Υ Φ Χ,
γ δ κ μ ν ο) are composites of that glyph (composites.GREEK_ALIAS). The rest are drawn here,
after Inter and IBM Plex: an ɑ-shaped α, a β with two bowls on a descending stem, a tailed ι, τ
and ς, and the round υ ψ ω.
"""

from cyrillic import _mirror, _Ze
from geom import L, expand
from glyphs import _bowl_right, glyph, on_line, shoulder


def _iota_stroke(g, p, x, top):
    """A stem from `top` that turns right into a short tail at the baseline (ι, τ)."""
    a = x + p.V / 2
    rx = 70 + p.V * 0.5
    ry = rx * 1.05
    cy = -p.ov * 0.4 + p.H / 2 + ry
    g.stroke([L((a, top), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 290), caps=('b', 'b'))


# --- capitals -----------------------------------------------------------------------------------


@glyph('uni0394', 0x394)
def _Delta(g, p):
    w = p.Hw * (1.12 + 0.12 * p.heavy)
    c = w / 2
    ws = 1.0 - 0.03 * p.heavy
    g.diag(0, 0, c, p.cap, 'l', 'c', ws=ws)
    g.diag(w, 0, c, p.cap, 'r', 'c', ws=ws)
    g.hbar(0, w, 0)
    g.ht = 'c'
    g.sb = (0.08, 0.08 + (0.45 if p.italic else 0) * p.heavy)  # the italic's foot slants out, as Z's


@glyph('uni039B', 0x39B)
def _Lambda(g, p):
    w = p.Hw * (1.08 + 0.1 * p.heavy)
    c = w / 2
    g.diag(0, 0, c, p.cap, 'l', 'c', ws=1.0 - 0.03 * p.heavy)
    g.diag(w, 0, c, p.cap, 'r', 'c', ws=1.0 - 0.03 * p.heavy)
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('uni0398', 0x398)
def _Theta(g, p):
    w = p.Hw * 1.17
    g.oval(0, -p.ov, w, p.cap + p.ov)
    g.hbar(w * 0.3, w * 0.7, p.cap / 2 - p.bar / 2, h=p.bar)
    g.ht = 'c'
    g.sb = (0.62, 0.62)


@glyph('uni039E', 0x39E)
def _Xi(g, p):
    w = p.Hw * 0.9
    g.hbar(0, w, p.cap - p.H).hbar(w * 0.1, w * 0.9, p.cap / 2 - p.H / 2).hbar(0, w, 0)
    g.ht = 'c'
    g.sb = (0.4, 0.4)


@glyph('uni03A3', 0x3A3)
def _Sigma(g, p):
    w = p.Hw * 0.92
    xm = w * 0.52
    g.hbar(0, w, p.cap - p.H).hbar(0, w, 0)
    g.diag(0, p.cap - p.H / 2, xm, p.cap / 2, 'l', 'r', ws=0.95, caps=('h', 'b'))
    g.diag(xm, p.cap / 2, 0, p.H / 2, 'r', 'l', ws=0.95, caps=('b', 'h'))
    g.ht = 'c'
    g.sb = (0.35, 0.35)


def _cup(g, p, w, top, bottom):
    """A U whose bowl reaches down to `bottom` (Ψ, υ, ψ)."""
    a, b = p.V / 2, w - p.V / 2
    rx = (b - a) / 2
    ry = min(rx * 0.95, (top - bottom) * 0.6)
    cy = bottom + p.H / 2 + ry
    g.stroke([L((a, top), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 360) + [L((b, cy), (b, top))])


@glyph('uni03A8', 0x3A8)
def _Psi(g, p):
    w = p.Hw * 1.2
    _cup(g, p, w, p.cap, p.cap * 0.3)
    g.vstem((w - p.V) / 2, 0, p.cap)
    g.ht = 'c'


@glyph('uni03A9', 0x3A9)
def _Omega(g, p):
    """Ω: a round arch open at the bottom, standing on two outward feet."""
    V, H = p.V, p.H
    w = p.Hw * 1.17
    cx, cy = w / 2, p.cap * 0.56
    rx, ry = w / 2 - V / 2 - w * 0.02, p.cap * 0.44 + p.ov - H / 2
    g.stroke(g.arc(cx, cy, rx, ry, -58, 238), caps=('b', 'b'))
    ye = cy - ry * 0.85  # where the arch ends, above the feet
    xl, xr = cx - rx * 0.62, cx + rx * 0.62
    g.line((xl, ye + 10), (xl, H / 2), caps=('b', 'h'))
    g.line((xr, ye + 10), (xr, H / 2), caps=('b', 'h'))
    g.hbar(0, xl + V / 2, 0).hbar(xr - V / 2, w, 0)
    g.ht = 'c'
    g.sb = (0.2, 0.2 + (0.35 if p.italic else 0) * p.heavy)  # the italic's right foot slants out


# --- lowercase ----------------------------------------------------------------------------------


@glyph('uni03B1', 0x3B1)
def _alpha(g, p):
    """α: the ɑ of q's bowl and a stem the height of the bowl."""
    w = p.nw * (1.1 - 0.05 * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    g.stroke(g.arc(cx, cy, rx, ry, 28, 332), taper=(0.55, 0.55))
    g.vstem(w - p.V, 0, p.xh)
    g.sb = (0.62, 0.3)


@glyph('uni03B2', 0x3B2)
def _beta(g, p):
    """β: a stem from the descender rising into a small bowl at the ascender, a larger one below."""
    V, H = p.V, p.H
    w = p.nw * 0.98
    a = V / 2
    ym = p.xh * 0.62
    rxt = (w * 0.86 - a) / 2
    ryt = (p.asc + p.ov * 0.4 - ym) / 2
    cyt = p.asc + p.ov * 0.4 - H / 2 - ryt
    g.stroke([L((a, p.desc), (a, cyt))] + g.arc(a + rxt, cyt, rxt, ryt, 180, -90), caps=('b', 'b'))
    yj = cyt - ryt
    _bowl_right(g, a + rxt * 0.5, w - V / 2, yj, H / 2, 1.08)
    g.stroke([L((a + rxt * 0.5, H / 2), (a, H / 2))])
    g.ht = 'a'
    g.sb = (1, 0.62)


@glyph('uni03B5', 0x3B5)
def _epsilon(g, p):
    """ε: з reflected."""
    W = p.nw * 0.96
    _Ze(g, p, p.xh, W, False)
    _mirror(g, W * (0.86 + 0.04 * p.heavy))
    if p.italic:  # reflected strokes fold under the italic pen (see cyrillic._ge_bg)
        g.raw += [c for st in g.strokes for c in expand(st, p.V, p.H)]
        g.strokes = []


@glyph('uni03B6', 0x3B6)
def _zeta(g, p):
    """ζ: a short bar at the ascender, a curve down to the left and round to a hook below."""
    V, H = p.V, p.H
    w = p.nw * 0.9
    yt = p.asc - H / 2
    g.hbar(w * 0.3, w, p.asc - H)
    p0 = (w * 0.86, yt)
    p1 = (V / 2, p.xh * 0.3)
    p2 = (w * 0.55, H / 2)
    g.stroke([('C', p0, (w * 0.3, p.asc * 0.6), (V / 2, p.xh * 0.75), p1),
              ('C', p1, (V / 2, H / 2 + p.xh * 0.08), (w * 0.2, H / 2), p2),
              ('C', p2, (w * 0.95, H / 2), (w * 0.95, p.desc * 0.25), (w * 0.62, p.desc * 0.75))], caps=('h', 'b'))
    g.ht = 'a'
    g.sb = (0.6, 0.3)


@glyph('uni03B7', 0x3B7)
def _eta(g, p):
    """η: n whose right leg runs on to the descender."""
    g.vstem(0, 0, p.xh)
    shoulder(g, 0, p.nw - p.V, p.xh + p.ov * 0.4)
    g.vstem(p.nw - p.V, p.desc, 2)


@glyph('uni03B8', 0x3B8)
def _theta(g, p):
    w = p.nw * 0.98
    g.oval(0, -p.ov, w, p.asc + p.ov)
    g.hbar(p.V / 2, w - p.V / 2, p.asc / 2 - p.bar / 2, h=p.bar)
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni03B9', 0x3B9)
def _iota(g, p):
    _iota_stroke(g, p, 0, p.xh)
    g.sb = (1, 0.1)


@glyph('uni03BB', 0x3BB)
def _lambda(g, p):
    """λ: a long diagonal from the ascender, and a short leg from its middle."""
    w = p.nw * 1.08
    a = g.diag(w * 0.08, p.asc, w, 0, 'l', 'r', ws=0.97, caps=('h', 'h'))
    y = p.xh * 0.62
    g.diag(on_line(*a, y), y, 0, 0, 'c', 'l', ws=0.95, caps=('b', 'h'))
    g.ht = 'a'
    g.sb = (0.1, 0.1)


@glyph('uni03BE', 0x3BE)
def _xi(g, p):
    """ξ: a bar at the ascender over two left-facing bowls; the lower one ends in a hook below."""
    V, H = p.V, p.H
    w = p.nw * 0.92
    g.hbar(w * 0.2, w * 0.92, p.asc - H)
    ym = p.xh * 0.86
    cu = g.box(w * 0.12, ym - H / 2, w * 0.88, p.asc - H / 2)
    g.stroke(g.arc(cu[0], cu[1], cu[2], cu[3], 90, 270), caps=('b', 'b'))
    cl = g.box(0, -p.ov, w, ym + H / 2)
    g.stroke(g.arc(cl[0], cl[1], cl[2], cl[3], 90, 270) + [('C', (cl[0], -p.ov + H / 2), (cl[0] + cl[2], -p.ov + H / 2), (w * 0.95, p.desc * 0.3), (w * 0.62, p.desc * 0.78))], caps=('b', 'b'))
    g.hbar(cu[0] - 2, cl[0] + 2, ym - H / 2)
    if p.italic:  # the italic pen folded the upper bowl at Black (see cyrillic._ge_bg)
        g.raw += [c for st in g.strokes for c in expand(st, p.V, p.H)]
        g.strokes = []
    g.ht = 'a'
    g.sb = (0.6, 0.3)


@glyph('uni03C0', 0x3C0)
def _pi(g, p):
    w = p.nw * 1.12
    g.hbar(0, w, p.xh - p.H)
    g.vstem(w * 0.16, 0, p.xh - p.H / 2).vstem(w * 0.84 - p.V, 0, p.xh - p.H / 2)
    g.sb = (0.3, 0.3)


@glyph('uni03C1', 0x3C1)
def _rho(g, p):
    w = p.nw * (1.08 - 0.05 * p.heavy)
    g.oval(0, -p.ov, w, p.xh + p.ov)
    g.vstem(0, p.desc, p.xh * 0.5)
    g.sb = (1, 0.62)


@glyph('uni03C2', 0x3C2)
def _sigma_final(g, p):
    """ς: c whose bowl runs on below the line into a hook."""
    w = p.nw * (1.0 + 0.02 * p.heavy)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    yb = -p.ov + p.H / 2
    g.stroke(g.arc(cx, cy, rx, ry, 30 + p.ap, 270) + [('C', (cx, yb), (cx + rx * 0.9, yb), (cx + rx * 0.95, p.desc * 0.3), (cx + rx * 0.35, p.desc * 0.78))], caps=('b', 'b'), cut='h')
    g.sb = (0.62, 0.42)


@glyph('uni03C3', 0x3C3)
def _sigma(g, p):
    """σ: o with its top drawn out to the right."""
    w = p.nw * (1.06 - 0.05 * p.heavy)
    g.oval(0, -p.ov, w, p.xh + p.ov)
    g.hbar(w * 0.5, w * 1.22, p.xh - p.H)
    g.sb = (0.62, 0.15)


@glyph('uni03C4', 0x3C4)
def _tau(g, p):
    """τ: a bar over ι."""
    w = p.nw * 0.9
    g.hbar(0, w, p.xh - p.H)
    _iota_stroke(g, p, w * 0.42 - p.V / 2, p.xh - p.H / 2)
    g.sb = (0.2, 0.2)


@glyph('uni03C5', 0x3C5)
def _upsilon(g, p):
    _cup(g, p, p.nw, p.xh, -p.ov)
    g.sb = (0.9, 0.9)


@glyph('uni03C6', 0x3C6)
def _phi(g, p):
    w = p.nw * (1.4 + 0.12 * p.heavy)
    g.oval(0, -p.ov, w, p.xh + p.ov)
    g.vstem((w - p.V) / 2, p.desc, p.xh + p.ov)
    g.sb = (0.62, 0.62)


@glyph('uni03C7', 0x3C7)
def _chi(g, p):
    w = p.nw * 1.07
    g.diag(0, p.xh, w, p.desc, 'l', 'r', ws=0.93)
    g.diag(w, p.xh, 0, p.desc, 'r', 'l', ws=0.9)
    g.sb = (0.2, 0.2)


@glyph('uni03C8', 0x3C8)
def _psi(g, p):
    w = p.nw * 1.3
    _cup(g, p, w, p.xh, -p.ov)
    g.vstem((w - p.V) / 2, p.desc, p.asc)
    g.ht = 'a'
    g.sb = (0.9, 0.9)


@glyph('uni03C9', 0x3C9)
def _omega(g, p):
    """ω: two round bowls side by side, joined by a short middle stem."""
    V, H = p.V, p.H
    w = p.nw * 1.5
    a, b, c = V / 2, w - V / 2, w / 2
    rx = (c - a) / 2
    ry = min(rx * 1.1, p.xh * 0.55)
    cy = -p.ov + H / 2 + ry
    g.stroke([L((a, p.xh), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 360), taper=(1, 0.6))
    g.stroke(g.arc(c + rx, cy, rx, ry, 180, 360) + [L((b, cy), (b, p.xh))], taper=(0.6, 1))
    g.line((c, cy - 2), (c, p.xh * 0.58))
    g.sb = (0.9, 0.9)


# --- tonos --------------------------------------------------------------------------------------


def m_tonos(g, p, s):
    """The tonos: an acute stood up nearly vertical, centred over its letter."""
    h = 160 * s
    g.diag(-28, 0, 28, h, 'c', 'c', w=p.mt, caps=('h', 'h'))


@glyph('tonoscomb')
def _tonoscomb(g, p):
    m_tonos(g, p, 1.0)
    g.mark = True

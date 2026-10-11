"""Georgian: the 33 letters of modern Mkhedruli (U+10D0-10F0), and ჻ (U+10FB). A DRAFT: built only
with CASCIVO_GEORGIAN=1, and not shipped. Against Noto Sans Georgian, 20 letters read right and 13
(ა გ დ ე თ კ ლ ჟ უ ფ ღ შ ც) do not yet; RESEARCH.md section 27 has the comparison.

None of Inter, Geist or Plex has Georgian, so the structure follows Noto Sans Georgian (OFL):
every letter is drawn here, with the same pen as the Latin, from a small kit of parts.
- `_arch`: an arch over the x-height whose left end curls inward (ო, ი, the top of გ ე უ)
- `_bowl`: the closed round body (ბ ზ მ ძ ...)
- `_cup`: an open U (ს შ ყ)
- `_jbowl`: a stem that drops below the line and turns back left (გ ე კ უ ყ ჯ ქ ჭ)
- `_tail`: a leg that sweeps down and to the left below the line (დ ლ ღ)
- `_hook`: a stroke rising to the ascender and turning over (ბ ნ ძ რ ჩ წ)
The letters are unicameral; the Mtavruli capitals (U+1C90) are not drawn.
"""

from cyrillic import _Ze
from geom import L
from glyphs import glyph


def _w(p, k=1.0):
    return p.nw * 1.08 * k  # Noto's bowls are 0.92 x-height wide; n alone ran 15% narrow


def _arch_cy(p, x0, x1, top):
    """The height of the arch's centre, where its legs leave the curve."""
    rx = (x1 - x0 - p.V) / 2
    return top - p.H / 2 - min(rx * 1.05, (top - p.H / 2) * 0.55)


def _arch(p, x0, x1, top, curl=0.0, right_to=0.0, left_to=0.0, left_leg=True):
    """An arch over `top`. The left leg comes down to `left_to` and, by `curl`, turns in toward
    the right there (ო ი თ to the baseline; გ ე part way). Without `left_leg` the curl hangs
    straight off the curve (უ). The right leg comes down to `right_to`, or stops at the curve
    (None) for a bowl to carry on below. Every choice here is by argument, never by a master's
    measurements, so every master has the same segments."""
    V, H = p.V, p.H
    a, b = x0 + V / 2, x1 - V / 2
    rx = (b - a) / 2
    cy = _arch_cy(p, x0, x1, top)
    ry = top - H / 2 - cy
    rc = rx * 0.42 * curl
    foot = left_to + (H / 2 - p.ov * 0.4 if left_to == 0 else 0) if left_leg else cy - rc
    segs = []
    if curl:  # a small hook at the foot, turning in toward the right
        segs += _ell(a + rc, foot + rc, rc, rc, -70, -180)
    if left_leg:
        segs.append(L((a, foot + rc), (a, cy)))
    segs += _ell(a + rx, cy, rx, ry, 180, 0)
    if right_to is not None:
        segs.append(L((b, cy), (b, right_to)))
    return segs


def _ell(cx, cy, rx, ry, a0, a1):
    from geom import arc

    return arc(cx, cy, rx, ry, a0, a1)


def _bowl(g, p, x0, x1, y0=None, y1=None):
    g.oval(x0, -p.ov if y0 is None else y0, x1, p.xh + p.ov if y1 is None else y1)


def _cup(p, x0, x1, top, bottom=None):
    """U: both legs from `top` down into a round bottom."""
    V, H = p.V, p.H
    a, b = x0 + V / 2, x1 - V / 2
    rx = (b - a) / 2
    bottom = -p.ov if bottom is None else bottom
    ry = min(rx * 0.95, (top - bottom) * 0.6)
    cy = bottom + H / 2 + ry
    return [L((a, top), (a, cy))] + _ell(a + rx, cy, rx, ry, 180, 360) + [L((b, cy), (b, top))]


def _jbowl(p, x0, x1, from_y, end=0.15):
    """A right stem from `from_y` down into a round bottom below the line, turning back up on the
    left to `end` of the descender's depth."""
    V, H = p.V, p.H
    a, b = x0 + V / 2, x1 - V / 2
    rx = (b - a) / 2
    yb = p.desc + H / 2
    ry = min(rx * 1.0, (from_y - yb) * 0.55)
    cy = yb + ry
    ang = -180 - 25 * end
    return [L((b, from_y), (b, cy))] + _ell(a + rx, cy, rx, ry, 0, ang)


def _tail(p, x, x_end):
    """From the foot of a right leg at the baseline, a sweep down and to the left."""
    return [('C', (x, p.H), (x, p.desc * 0.35), (x_end + (x - x_end) * 0.4, p.desc * 0.7), (x_end, p.desc * 0.82))]


def _hook(p, x, from_y, to_y, right=True, reach=None):
    """A stem from `from_y` up to `to_y` that turns over to the right (or left) at the top."""
    H = p.H
    r = reach if reach is not None else p.nw * 0.24
    cy = to_y - H / 2 - r * 0.9
    if right:
        return [L((x, from_y), (x, cy))] + _ell(x + r, cy, r, r * 0.9, 180, 30)
    return [L((x, from_y), (x, cy))] + _ell(x - r, cy, r, r * 0.9, 0, 150)


# --- x-height letters -------------------------------------------------------------------------


@glyph('uni10D0', 0x10D0)
def _an(g, p):
    """ა: a stroke falling from the top right of centre to the left, into a cup that rises on the
    right to half the x-height."""
    V, H = p.V, p.H
    w = _w(p, 0.95)
    a, b = V / 2, w - V / 2
    rx = (b - a) / 2
    ry = min(rx, p.xh * 0.42)
    cy = -p.ov + H / 2 + ry
    top = (w * 0.55, p.xh - H / 2)
    g.stroke([('C', top, (w * 0.3, p.xh * 0.85), (a, p.xh * 0.6), (a, cy))] + _ell(a + rx, cy, rx, ry, 180, 360) + [L((b, cy), (b, p.xh * 0.48))], caps=('h', 'b'))
    g.sb = (0.62, 1)


@glyph('uni10D8', 0x10D8)
def _in(g, p):
    """ი: an arch whose left end curls in."""
    w = _w(p)
    g.stroke(_arch(p, 0, w, p.xh + p.ov * 0.4, curl=0.3), caps=('b', 'b'))
    g.sb = (0.62, 1)


@glyph('uni10DD', 0x10DD)
def _on(g, p):
    """ო: a wide arch, the left end curled in at the middle."""
    w = _w(p, 1.45)
    g.stroke(_arch(p, 0, w, p.xh + p.ov * 0.4, curl=0.45), caps=('b', 'b'))
    g.sb = (0.62, 1)


@glyph('uni10D7', 0x10D7)
def _tan(g, p):
    """თ: two arches on a shared middle leg, the left one curled in."""
    w = _w(p, 0.82)
    V = p.V
    top = p.xh + p.ov * 0.4
    g.stroke(_arch(p, 0, w, top, curl=0.45), caps=('b', 'b'))
    g.stroke(_arch(p, w - V, 2 * w - V, top, left_to=top), caps=('b', 'b'))  # from the shared middle leg
    g.sb = (0.62, 1)


# --- descenders ---------------------------------------------------------------------------------


@glyph('uni10D2', 0x10D2)
def _gan(g, p):
    """გ: an arch whose right leg drops into a bowl below the line."""
    w = _w(p)
    top = p.xh + p.ov * 0.4
    g.stroke(_arch(p, 0, w, top, curl=0.7, left_to=p.xh * 0.3, right_to=None) + _jbowl(p, 0, w, _arch_cy(p, 0, w, top), end=1.0), caps=('b', 'b'))
    g.sb = (0.62, 0.62)


@glyph('uni10D4', 0x10D4)
def _en(g, p):
    """ე: a short hook at the top, a stem dropping into a bowl below the line."""
    w = _w(p, 0.92)
    top = p.xh + p.ov * 0.4
    g.stroke(_arch(p, 0, w, top, curl=0.35, left_to=p.xh * 0.15, right_to=None) + _jbowl(p, 0, w, _arch_cy(p, 0, w, top), end=0.6), caps=('b', 'b'))
    g.sb = (0.5, 0.62)


@glyph('uni10E3', 0x10E3)
def _un(g, p):
    """უ: an arch curled in at the left, its right leg dropping into a bowl below the line."""
    w = _w(p)
    top = p.xh + p.ov * 0.4
    g.stroke(_arch(p, 0, w, top, curl=0.8, left_leg=False, right_to=None) + _jbowl(p, 0, w, _arch_cy(p, 0, w, top), end=0.6), caps=('b', 'b'))
    g.sb = (0.62, 0.62)


@glyph('uni10E7', 0x10E7)
def _qar(g, p):
    """ყ: a cup whose right leg runs on into a bowl below the line."""
    w = _w(p)
    V = p.V
    del V
    g.stroke(_cup(p, 0, w, p.xh, bottom=p.xh * 0.12)[:-1], caps=('b', 'b'))  # the right leg is the J's
    g.stroke(_jbowl(p, 0, w, p.xh, end=0.4), caps=('b', 'b'))
    g.sb = (0.62, 0.62)


@glyph('uni10D5', 0x10D5)
def _vin(g, p):
    """ვ: a 3 hanging from the x-height to the descender."""
    d = -p.desc * 0.95
    _Ze(g, p, p.xh + d, p.nw * 0.96, False)
    g.strokes = [st.transformed(lambda q: (q[0], q[1] - d)) for st in g.strokes]
    g.sb = (0.45, 0.62)


@glyph('uni10D9', 0x10D9)
def _kan(g, p):
    """კ: a small hook at the top left, a bowl hanging below the line."""
    w = _w(p, 0.92)
    V, H = p.V, p.H
    ym = p.xh * 0.45
    r = w * 0.26
    g.stroke(_ell(V / 2 + r, p.xh - H / 2 - r, r, r, 160, -60) + [L(_pt(V / 2 + r, p.xh - H / 2 - r, r, r, -60), (w * 0.55, ym))], caps=('b', 'h'))
    g.stroke([L((w * 0.42, ym), (w - V / 2, ym))] + _jbowl(p, 0, w, ym, end=0.6), caps=('b', 'b'))
    g.sb = (0.5, 0.62)


def _pt(cx, cy, rx, ry, a):
    import math

    return (cx + rx * math.cos(math.radians(a)), cy + ry * math.sin(math.radians(a)))


@glyph('uni10DF', 0x10DF)
def _zhar(g, p):
    """ჟ: ე with a second hook on the top left."""
    _en(g, p)
    w = _w(p, 0.92)
    r = w * 0.2
    g.stroke(_ell(r + p.V / 2, p.xh * 0.62, r, r, 90, 270), caps=('b', 'b'))


@glyph('uni10EF', 0x10EF)
def _jan(g, p):
    """ჯ: a stem dropping into a bowl below the line, crossed at the x-height."""
    w = _w(p, 0.92)
    g.stroke(_jbowl(p, 0, w, p.xh, end=0.6), caps=('b', 'b'))
    g.hbar(w * 0.35, w + p.V * 0.2, p.xh * 0.62)
    g.sb = (0.62, 0.3)


@glyph('uni10EA', 0x10EA)
def _tsan(g, p):
    """ც: a large bowl hanging below the line, open at the top right, where a hook turns in."""
    V, H = p.V, p.H
    w = _w(p, 1.05)
    cx, cy, rx, ry = g.box(0, p.desc * 0.92, w, p.xh * 0.95)
    xe, ye = _pt(cx, cy, rx, ry, 20)
    g.stroke(_ell(cx, cy, rx, ry, 110, 380) + [('C', (xe, ye), (xe - rx * 0.1, ye + ry * 0.35), (cx + rx * 0.05, ye + ry * 0.4), (cx - rx * 0.05, ye + ry * 0.05))], caps=('b', 'b'))
    del V, H
    g.sb = (0.62, 0.62)


@glyph('uni10E4', 0x10E4)
def _par(g, p):
    """ფ: a round loop on the left, a 3-like body on the right hanging below the line."""
    w = _w(p, 0.75)
    _bowl(g, p, 0, w)
    n = len(g.strokes)
    _vin(g, p)
    g.strokes[n:] = [st.transformed(lambda q: (q[0] + w * 0.78, q[1])) for st in g.strokes[n:]]
    g.sb = (0.62, 0.62)


# --- tails --------------------------------------------------------------------------------------


@glyph('uni10D3', 0x10D3)
def _don(g, p):
    """დ: a hook from the left curls over into a round bowl; from the bowl's foot a tail drops below
    the line and sweeps away to the right."""
    V, H = p.V, p.H
    w = _w(p, 1.3)
    cx, cy, rx, ry = g.box(w * 0.3, -p.ov, w, p.xh + p.ov)
    g.stroke([('C', (V / 2, p.xh * 0.45), (V / 2, p.xh * 0.8), (w * 0.3, p.xh + p.ov - H / 2), (cx, p.xh + p.ov - H / 2))] + _ell(cx, cy, rx, ry, 90, -230), caps=('b', 'b'))
    x0, y0 = _pt(cx, cy, rx, ry, -230)
    g.stroke([('C', (x0, y0), (x0 - rx * 0.5, y0 - ry * 0.4), (w * 0.05, p.desc * 0.55), (w * 0.4, p.desc * 0.6)), L((w * 0.4, p.desc * 0.6), (w * 0.7, p.desc * 0.95))], caps=('b', 'b'))
    g.sb = (0.62, 0.3)


@glyph('uni10E6', 0x10E6)
def _ghan(g, p):
    """ღ: დ narrower."""
    w = _w(p, 1.15)
    V = p.V
    g.stroke(_arch(p, 0, w, p.xh + p.ov * 0.4, curl=0.45, right_to=p.H) + _tail(p, w - V / 2, w * 0.35), caps=('b', 'b'))
    g.sb = (0.62, 0.62)


@glyph('uni10DA', 0x10DA)
def _las(g, p):
    """ლ: two arches, the second's leg sweeping down and back to the left."""
    w = _w(p, 0.95)
    V = p.V
    top = p.xh + p.ov * 0.4
    g.stroke(_arch(p, 0, w, top, curl=0.45), caps=('b', 'b'))
    g.stroke(_arch(p, w - V, 2 * w - V, top, left_to=top, right_to=p.H) + _tail(p, 2 * w - 1.5 * V, w * 1.1), caps=('b', 'b'))
    g.sb = (0.62, 0.62)


# --- ascenders ----------------------------------------------------------------------------------


@glyph('uni10D1', 0x10D1)
def _ban(g, p):
    """ბ: a round body with a hook rising from its top to the ascender."""
    w = _w(p)
    _bowl(g, p, 0, w)
    x = w * 0.5
    g.stroke([('C', (x, p.xh - p.H), (x, p.xh + (p.asc - p.xh) * 0.55), (w * 0.12, p.asc - p.H), (w * 0.4, p.asc - p.H / 2))], caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni10D6', 0x10D6)
def _zen(g, p):
    """ზ: a round body with a smaller loop on top, to the ascender."""
    w = _w(p)
    _bowl(g, p, 0, w)
    g.oval(w * 0.14, p.xh - p.H, w * 0.86, p.asc + p.ov * 0.4)
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni10DB', 0x10DB)
def _man(g, p):
    """მ: a round body under an arch that rises to the ascender."""
    w = _w(p)
    V = p.V
    _bowl(g, p, 0, w)
    g.stroke([L((w - V / 2, p.xh * 0.5), (w - V / 2, p.xh))] + _ell(w / 2, p.xh, w / 2 - V / 2, p.asc - p.H / 2 - p.xh, 0, 180) + [L((V / 2, p.xh), (V / 2, p.xh * 0.75))], caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni10DC', 0x10DC)
def _nar(g, p):
    """ნ: a 6: a round body whose left side rises to the ascender and turns right."""
    w = _w(p)
    _bowl(g, p, 0, w)
    g.stroke(_hook(p, p.V / 2, p.xh * 0.5, p.asc, right=True, reach=w * 0.35), caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni10EB', 0x10EB)
def _dzil(g, p):
    """ძ: a round body on a right stem from the ascender, the stem's top turning left."""
    w = _w(p)
    _bowl(g, p, 0, w)
    g.stroke(_hook(p, w - p.V / 2, 0, p.asc, right=False, reach=w * 0.22), caps=('h', 'b'))
    g.ht = 'a'
    g.sb = (0.62, 1)


@glyph('uni10EC', 0x10EC)
def _tsil(g, p):
    """წ: ნ whose top ends in a small flick upward."""
    w = _w(p)
    V, H = p.V, p.H
    _bowl(g, p, 0, w)
    r = w * 0.3
    cy = p.asc - H / 2 - r * 0.9
    g.stroke([L((V / 2, p.xh * 0.5), (V / 2, cy))] + _ell(V / 2 + r, cy, r, r * 0.9, 180, 90) + [('C', (V / 2 + r, p.asc - H / 2), (w * 0.62, p.asc - H / 2), (w * 0.75, p.asc - H * 1.2), (w * 0.92, p.asc - H * 0.2))], caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni10E0', 0x10E0)
def _rae(g, p):
    """რ: ო with a hook rising from its top to the ascender."""
    w = _w(p, 1.45)
    g.stroke(_arch(p, 0, w, p.xh + p.ov * 0.4, curl=0.45), caps=('b', 'b'))
    x = w * 0.52
    g.stroke([('C', (x, p.xh - p.H), (x, p.xh + (p.asc - p.xh) * 0.5), (w * 0.62, p.asc - p.H / 2), (w * 0.85, p.asc - p.H / 2))], caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (0.62, 1)


@glyph('uni10E1', 0x10E1)
def _san(g, p):
    """ს: a cup whose left leg rises to the ascender."""
    w = _w(p)
    cup = _cup(p, 0, w, p.xh)
    g.stroke([L((p.V / 2, p.asc), cup[0][2])] + cup[1:], caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (1, 1)


@glyph('uni10E8', 0x10E8)
def _shin(g, p):
    """შ: მ with a small curl on its top left."""
    _man(g, p)
    w = _w(p)
    r = w * 0.17
    g.stroke(_ell(p.V / 2 + r, p.asc - p.H / 2 - r, r, r, 0, 270), caps=('b', 'b'))


def _rev(segs):
    from geom import reverse_seg

    return [reverse_seg(s) for s in segs]


@glyph('uni10E9', 0x10E9)
def _chin(g, p):
    """ჩ: an arch whose left leg rises to the ascender and turns right."""
    w = _w(p)
    top = p.xh + p.ov * 0.4
    g.stroke(_arch(p, 0, w, top), caps=('b', 'b'))
    g.stroke(_hook(p, p.V / 2, top * 0.5, p.asc, right=True, reach=w * 0.22), caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (1, 1)


@glyph('uni10EE', 0x10EE)
def _xan(g, p):
    """ხ: a stem from the ascender and a round body: b, as in Noto."""
    w = _w(p)
    g.vstem(0, 0, p.asc)
    cx, cy, rx, ry = g.box(0, -p.ov, w, p.xh + p.ov)
    g.stroke(_ell(cx, cy, rx, ry, 152, -152), taper=(0.55, 0.55))
    g.ht = 'a'
    g.sb = (1, 0.62)


@glyph('uni10F0', 0x10F0)
def _hae(g, p):
    """ჰ: a 3 standing from the baseline to the ascender."""
    _Ze(g, p, p.asc, p.nw * 0.96, False)
    g.ht = 'a'
    g.sb = (0.45, 0.62)


@glyph('uni10DE', 0x10DE)
def _par_p(g, p):
    """პ: ჰ whose upper bowl is a small hook on the left."""
    _Ze(g, p, p.asc, p.nw * 0.96, False)
    g.strokes[0] = g.strokes[0].transformed(lambda q: (q[0] * 0.8, q[1]))
    g.ht = 'a'
    g.sb = (0.45, 0.62)


# --- ascender and descender ---------------------------------------------------------------------


@glyph('uni10E2', 0x10E2)
def _tar(g, p):
    """ტ: a round body hanging from the x-height to below the line, a stem dropping into it."""
    w = _w(p, 1.12)
    g.oval(0, p.desc * 0.85, w, p.xh + p.ov)
    g.vstem((w - p.V) / 2, p.xh * 0.1, p.asc)
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni10E5', 0x10E5)
def _khar(g, p):
    """ქ: a stem from the ascender into a bowl below the line, with a small hook on its left."""
    w = _w(p, 0.92)
    V, H = p.V, p.H
    g.stroke(_jbowl(p, 0, w, p.asc, end=0.6), caps=('b', 'b'))
    r = w * 0.24
    g.stroke(_ell(w - V / 2 - r, p.xh * 0.55, r, p.xh * 0.3, 90, 270), caps=('b', 'b'))
    del H
    g.ht = 'a'
    g.sb = (0.62, 1)


@glyph('uni10ED', 0x10ED)
def _char(g, p):
    """ჭ: a stem from the ascender into a bowl below the line, crossed above the x-height."""
    w = _w(p, 0.92)
    g.stroke(_jbowl(p, 0, w, p.asc, end=0.6), caps=('b', 'b'))
    g.hbar(w * 0.4, w + p.V * 0.35, p.xh + (p.asc - p.xh) * 0.3)
    g.ht = 'a'
    g.sb = (0.62, 0.3)


@glyph('uni10FB', 0x10FB)
def _paragraph(g, p):
    """჻: three dots in a triangle, the Georgian paragraph separator."""
    d = p.dot
    g.dot(d * 0.5, p.xh - d, d).dot(d * 2.1, p.xh - d, d).dot(d * 1.3, p.xh * 0.45 - d, d)
    g.sb = (0.6, 0.6)

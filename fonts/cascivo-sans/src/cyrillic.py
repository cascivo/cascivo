"""Cyrillic: Russian, Ukrainian, Belarusian, Bulgarian, Serbian and Macedonian.

Letters that share a Latin shape (А В Е К М Н О Р С Т Х, а е о р с у х, Ѕ І Ј ...) are not
drawn here: they are composites of the Latin glyph (composites.CYR_ALIAS). The lowercase is the
grotesque small-cap form (в н т л п), drawn by the capital's own function at the x-height
(`_small`), as in Inter, Geist and Plex. The italic slants those, except и п т, which take the
cursive u n m forms as Plex's drawn italic does (Inter's sloped roman keeps them upright).
"""

import copy

from glyphs import _B, _K, _M, _N, _R, _T, L, _bowl_right, _m, _n, _u, glyph, on_line

def _small(p, ratio):
    """Parameters under which a capital's drawing comes out as its small-cap lowercase."""
    pc = copy.copy(p)
    pc.cap = p.xh
    pc.cH = p.nw * ratio - 2 * p.V  # so pc.Hw is the lowercase width
    return pc


def _mirror(g, w):
    g.strokes = [st.transformed(lambda q: (w - q[0], q[1])) for st in g.strokes]
    g.sb = (g.sb[1], g.sb[0])


def _lighter(g, p):
    """Thinner horizontals for a lowercase that stacks three bars in an x-height (з я): at
    Black their counters closed, and Inter thins the same letters there."""
    for st in g.strokes:
        if st.w is None:
            st.pen = (p.V, p.H * (1 - 0.25 * p.heavy))


def _tail(p):
    return -(110 + p.V * 0.35)  # the descender of Д Ц Щ Џ: shorter than a letter's


def both(uc, lc, ratio=1.0):
    """Register fn(g, p, top, W, cap) as the capital and its lowercase."""

    def deco(fn):
        def upper(g, p):
            fn(g, p, p.cap, p.Hw, True)
            g.ht = 'c'

        def lower(g, p):
            fn(g, p, p.xh, p.nw * ratio, False)
            g.ht = 'x'

        glyph('uni%04X' % uc, uc)(upper)
        glyph('uni%04X' % lc, lc)(lower)
        return fn

    return deco


# --- reflected and small-cap forms of Latin capitals ------------------------------------------


@glyph('uni0418', 0x418)
def _I_cyr(g, p):
    """И: N reflected."""
    _N(g, p)
    _mirror(g, p.Hw)


@glyph('uni0438', 0x438)
def _i_cyr(g, p):
    if p.italic:
        _u(g, p)
        g.anchors = {}
        return
    pc = _small(p, 1.0)
    _N(g, pc)
    _mirror(g, pc.Hw)
    g.ht = 'x'


@glyph('uni042F', 0x42F)
def _Ya(g, p):
    """Я: R reflected, the leg kicking out to the left."""
    w = p.Hw * 0.98 * ((1 + 0.06 * p.heavy) if p.italic else 1)
    _R(g, p)
    _mirror(g, w)


@glyph('uni044F', 0x44F)
def _ya(g, p):
    pc = _small(p, 0.98)
    w = pc.Hw * 0.98 * ((1 + 0.06 * p.heavy) if p.italic else 1)
    _R(g, pc)
    _mirror(g, w)
    _lighter(g, p)
    g.ht = 'x'


@glyph('uni0432', 0x432)
def _ve(g, p):
    _B(g, _small(p, 0.98))
    g.ht = 'x'


@glyph('uni043C', 0x43C)
def _em(g, p):
    _M(g, _small(p, 0.98))
    g.ht = 'x'


@glyph('uni043D', 0x43D)
def _en(g, p):
    pc = _small(p, 1.0)
    w = pc.Hw
    g.vstem(0, 0, pc.cap).vstem(w - p.V, 0, pc.cap)
    g.hbar(p.V / 2, w - p.V / 2, pc.cap * 0.5 - p.bar / 2 + 4, h=p.bar)


@glyph('uni043F', 0x43F)
def _pe(g, p):
    if p.italic:
        _n(g, p)
        return
    w = p.nw
    g.vstem(0, 0, p.xh).vstem(w - p.V, 0, p.xh)
    g.hbar(p.V / 2, w - p.V / 2, p.xh - p.H)


@glyph('uni0442', 0x442)
def _te(g, p):
    if p.italic:
        _m(g, p)
        return
    _T(g, _small(p, 0.95))
    g.ht = 'x'


@glyph('uni041F', 0x41F)
def _Pe(g, p):
    w = p.Hw
    g.vstem(0, 0, p.cap).vstem(w - p.V, 0, p.cap)
    g.hbar(p.V / 2, w - p.V / 2, p.cap - p.H)
    g.ht = 'c'


# --- drawn in both cases --------------------------------------------------------------------


@both(0x413, 0x433, 0.98)
def _Ge(g, p, top, W, cap):
    w = W * 0.72
    g.vstem(0, 0, top).hbar(p.V / 2, w, top - p.H)
    g.sb = (1, 0.25)


@both(0x490, 0x491, 0.98)
def _Gheup(g, p, top, W, cap):
    """Ґ: Г with its bar's end turned up."""
    w = W * 0.72
    g.vstem(0, 0, top).hbar(p.V / 2, w - p.V / 2, top - p.H)
    g.vstem(w - p.V, top - p.H / 2, top + (150 if cap else 130))
    g.sb = (1, 0.6)


@both(0x414, 0x434, 1.06)
def _De(g, p, top, W, cap):
    """Д: a Л standing on a bar, the bar's ends dropping below the line."""
    V, H = p.V, p.H
    w = W * (1.06 + 0.12 * p.heavy)  # Black's counter closed to a slit at 1.06
    xl, xr = w * 0.16, w - V * 0.6
    g.vstem(xr - V, _tail(p), top)
    g.hbar(xl, xr - V / 2, top - H)
    g.diag(xl, top, V * 0.3, H / 2, 'l', 'l', ws=0.97, caps=('h', 'h'))  # as Л's leg, on the bar
    g.hbar(V / 2, xr - V / 2, 0)
    g.vstem(0, _tail(p), H)
    g.sb = (0.35, 0.35)


@both(0x41B, 0x43B)
def _El(g, p, top, W, cap):
    """Л: a stem, and a leg that drops straight and curls out to a foot on the left, under one
    bar (Inter, Geist, Plex; a straight diagonal leg read as a lean beside Н and П)."""
    V, H = p.V, p.H
    w = W * 1.02
    xl = w * 0.22
    g.vstem(w - V, 0, top)
    g.hbar(xl, w - V / 2, top - H)
    x = xl + V / 2
    rx = x - V * 0.1
    ry = min(rx * 1.15, (top - H) * 0.6)
    cy = H / 2 + ry
    g.stroke([L((x, top), (x, cy))] + g.arc(x - rx, cy, rx, ry, 0, -90), caps=('b', 'b'))
    g.sb = (0.3, 1)


def _arms(g, p, top, x0, w):
    """K's arm and leg from a stem centred at x0, reaching to w."""
    a0, a1 = g.diag(x0, top * 0.36, w, top, 'c', 'r', ws=0.92, caps=('v', 'h'))
    t = 0.4
    j = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
    g.diag(j[0], j[1], w + 4, 0, 'c', 'r', ws=0.95, caps=('b', 'h'))


@both(0x416, 0x436, 1.04)
def _Zhe(g, p, top, W, cap):
    """Ж: two K halves back to back on one stem."""
    w = W * (1.42 + 0.1 * p.heavy)
    c = w / 2
    _arms(g, p, top, c, w)
    n = len(g.strokes)
    _arms(g, p, top, c, w)
    g.strokes[n:] = [st.transformed(lambda q: (w - q[0], q[1])) for st in g.strokes[n:]]
    g.vstem(c - p.V / 2, 0, top)
    g.sb = (0.1, 0.1)


@both(0x417, 0x437, 0.96)
def _Ze(g, p, top, W, cap):
    """З: the 3 at letter height and width."""
    H = p.H
    w = W * (0.86 + 0.04 * p.heavy)
    ym = top * 0.55
    cxu, cyu, rxu, ryu = g.box(w * 0.07, ym - H / 2, w * 0.95, top + p.ov)
    cxl, cyl, rxl, ryl = g.box(0, -p.ov, w, ym + H / 2)
    g.stroke(g.arc(cxu, cyu, rxu, ryu, 162 - p.ap, -90), caps=('b', 'b'), cut='h')
    g.hbar(w * 0.36 + (cxu - w * 0.36) * 0.5 * p.heavy, cxu + 2, ym - H / 2)
    g.stroke(g.arc(cxl, cyl, rxl, ryl, 90, -160 + p.ap), caps=('b', 'b'), cut='h')
    g.sb = (0.45, 0.62)
    if not cap:
        _lighter(g, p)


@both(0x426, 0x446, 1.0)
def _Tse(g, p, top, W, cap):
    """Ц: П upside down, its bar running on into a short descender at the right."""
    V = p.V
    w = W
    g.vstem(0, 0, top).vstem(w - V, 0, top)
    xt = w + V * 0.45 + 20
    g.hbar(V / 2, xt - V / 2, 0)
    g.vstem(xt - V, _tail(p), p.H)
    g.sb = (1, 0.35)


@both(0x40F, 0x45F, 1.0)
def _Dzhe(g, p, top, W, cap):
    """Џ: П upside down with a descender from the middle of its bar."""
    w = W
    g.vstem(0, 0, top).vstem(w - p.V, 0, top)
    g.hbar(p.V / 2, w - p.V / 2, 0)
    g.vstem((w - p.V) / 2, _tail(p), p.H / 2)


def _sha(g, p, top, W, tail):
    V = p.V
    c = W * (0.7 if tail is None else 0.68) - V / 2
    w = 2 * c + V
    g.vstem(0, 0, top).vstem(c, 0, top).vstem(w - V, 0, top)
    if tail is None:
        g.hbar(V / 2, w - V / 2, 0)
    else:
        xt = w + V * 0.45 + 20
        g.hbar(V / 2, xt - V / 2, 0)
        g.vstem(xt - V, _tail(p), p.H)


@both(0x428, 0x448, 1.04)
def _Sha(g, p, top, W, cap):
    _sha(g, p, top, W, None)


@both(0x429, 0x449, 1.04)
def _Shcha(g, p, top, W, cap):
    _sha(g, p, top, W, True)
    g.sb = (1, 0.35)


@both(0x427, 0x447, 0.96)
def _Che(g, p, top, W, cap):
    """Ч: an upside-down h: the arm comes down and turns into the stem at about 0.4."""
    V, H = p.V, p.H
    w = W * 0.92
    a, b = V / 2, w - V / 2
    rx = (b - a) / 2
    ry = min(rx * 0.8, top * 0.3)
    yb = top * 0.36 - H / 2
    cy = yb + H / 2 + ry
    g.stroke([L((a, top), (a, cy))] + g.arc(a + rx, cy, rx, ry, 180, 346), taper=(1, 0.5))
    g.vstem(w - V, 0, top)
    g.sb = (0.9, 1)


def _soft(g, p, top, x0, w):
    """Ь's stem at x0 and its bowl, half the letter's height, reaching w."""
    g.vstem(x0, 0, top)
    _bowl_right(g, x0 + p.V / 2, w - p.V / 2, top * (0.56 - 0.03 * p.heavy), p.H / 2, 1.08)


@both(0x42C, 0x44C, 0.96)
def _Soft(g, p, top, W, cap):
    _soft(g, p, top, 0, W * 0.9)
    g.sb = (1, 0.62)


@both(0x42A, 0x44A, 0.96)
def _Hard(g, p, top, W, cap):
    xs = W * 0.26
    g.hbar(0, xs + p.V / 2, top - p.H)
    _soft(g, p, top, xs, xs + W * 0.86)
    g.sb = (0.2, 0.62)


@both(0x42B, 0x44B, 0.96)
def _Yeru(g, p, top, W, cap):
    wb = W * 0.84
    _soft(g, p, top, 0, wb)
    g.vstem(wb + W * 0.2, 0, top)


@both(0x409, 0x459, 1.0)
def _Lje(g, p, top, W, cap):
    """Љ: Л whose stem carries Ь's bowl."""
    _El(g, p, top, W, cap)
    w = W * 1.02
    ym = top * (0.56 - 0.03 * p.heavy)
    _bowl_right(g, w - p.V / 2, w - p.V / 2 + W * 0.66, ym, p.H / 2, 1.08)
    g.sb = (0.12, 0.62)


@both(0x40A, 0x45A, 1.0)
def _Nje(g, p, top, W, cap):
    """Њ: Н whose bar runs on into Ь's bowl."""
    V, H = p.V, p.H
    w = W * 0.96
    ym = top * (0.56 - 0.03 * p.heavy)
    g.vstem(0, 0, top).vstem(w - V, 0, top)
    g.hbar(V / 2, w - V / 2, ym - H / 2)
    _bowl_right(g, w - V / 2, w - V / 2 + W * 0.66, ym, H / 2, 1.08)
    g.sb = (1, 0.62)


def _ye(g, p, top, W, cap):
    """Є (and, reflected, Э): C with a bar through the middle."""
    w = W * ((1.1 + 0.07 * p.heavy) if cap else (1.04 + 0.02 * p.heavy))
    cx, cy, rx, ry = g.box(0, -p.ov, w, top + p.ov)
    o = p.ap + (22 if cap else 30)
    g.stroke(g.arc(cx, cy, rx, ry, o, 360 - o), caps=('b', 'b'), cut='h')
    g.hbar(cx - rx, cx + rx * 0.55, cy - p.bar / 2, h=p.bar)
    return w


@both(0x404, 0x454, 1.0)
def _Ye(g, p, top, W, cap):
    _ye(g, p, top, W, cap)
    g.sb = (0.62, 0.45)


@both(0x42D, 0x44D, 1.0)
def _E_rev(g, p, top, W, cap):
    w = _ye(g, p, top, W, cap)
    g.sb = (0.62, 0.45)
    _mirror(g, w)


@both(0x42E, 0x44E, 1.0)
def _Yu(g, p, top, W, cap):
    """Ю: a stem joined by a short bar to an O."""
    xo = p.V + W * (0.1 if cap else 0.08)
    wo = W * (1.08 if cap else 1.02)
    g.vstem(0, 0, top)
    g.hbar(p.V / 2, xo + p.V / 2, top / 2 - p.bar / 2, h=p.bar)
    g.oval(xo, -p.ov, xo + wo, top + p.ov)
    g.sb = (1, 0.62)


# --- capitals and lowercase drawn apart ---------------------------------------------------------


@glyph('uni0411', 0x411)
def _Be_uc(g, p):
    """Б: E's top bar over Ь."""
    w = p.Hw * 0.94
    _soft(g, p, p.cap, 0, w)
    g.hbar(p.V / 2, w * 0.92, p.cap - p.H)
    g.ht = 'c'
    g.sb = (1, 0.62)


@glyph('uni0431', 0x431)
def _be(g, p):
    """б: an o whose left side rises into a flag at the ascender."""
    w = p.nw * (1.1 - 0.05 * p.heavy)
    V, H = p.V, p.H
    g.oval(0, -p.ov, w, p.xh + p.ov)
    a = V / 2
    rx = w * 0.3
    ry = min(rx, (p.asc - p.xh * 0.55) * 0.5)
    yq = p.asc - H / 2 - ry
    g.stroke([L((a, p.xh * 0.5), (a, yq))] + g.arc(a + rx, yq, rx, ry, 180, 90) + [L((a + rx, p.asc - H / 2), (w * 0.9, p.asc - H / 2))], caps=('b', 'b'))
    g.ht = 'a'
    g.sb = (0.62, 0.62)


@glyph('uni0423', 0x423)
def _U_cyr(g, p):
    """У: Y whose right arm runs on to the baseline at the left."""
    w = p.Hw * (1.02 + 0.05 * p.heavy)
    a = g.diag(w, p.cap, w * 0.24, 0, 'r', 'c', ws=1.0, caps=('h', 'h'))
    yj = p.cap * 0.34
    g.diag(0, p.cap, on_line(*a, yj), yj, 'l', 'c', ws=1.0, caps=('h', 'b'))
    g.ht = 'c'
    g.sb = (0.08, 0.08)


@glyph('uni0424', 0x424)
def _Ef(g, p):
    """Ф: a wide O pierced by a stem."""
    w = p.Hw * (1.34 + 0.12 * p.heavy)
    g.oval(0, p.cap * 0.1, w, p.cap * 0.9)
    g.vstem((w - p.V) / 2, 0, p.cap)
    g.ht = 'c'
    g.sb = (0.62, 0.62)


@glyph('uni0444', 0x444)
def _ef(g, p):
    w = p.nw * (1.42 + 0.14 * p.heavy)
    g.oval(0, -p.ov, w, p.xh + p.ov)
    g.vstem((w - p.V) / 2, p.desc, p.asc)
    g.ht = 'a'
    g.sb = (0.62, 0.62)


def _djerv(g, p, x, top, hook, depth=0.62):
    """The arch of Ћ/Ђ (and ђ) from a stem centred at x; with `hook`, the leg curls below."""
    V, H = p.V, p.H
    w = p.nw * 0.98
    a, b = x, x + w - V
    rx = (b - a) / 2
    ry = rx * 0.93
    cy = top - H / 2 - ry
    if hook:
        rh = 70 + V * 0.3
        yh = p.desc * depth + H / 2 + rh * 1.15
        g.stroke(g.arc(a + rx, cy, rx, ry, 166, 0) + [L((b, cy), (b, yh))] + g.arc(b - rh, yh, rh, rh * 1.15, 0, -90) + [L((b - rh, yh - rh * 1.15), (b - rh - 12, yh - rh * 1.15))], taper=(0.5, 1))
    else:
        g.stroke(g.arc(a + rx, cy, rx, ry, 166, 0) + [L((b, cy), (b, 0))], taper=(0.5, 1))
    return b


def _tshe(g, p, hook):
    V = p.V
    xs = p.Hw * 0.26
    g.hbar(0, xs * 2 + V, p.cap - p.H)
    g.vstem(xs, 0, p.cap - p.H / 2)
    _djerv(g, p, xs + V / 2, p.cap * 0.62, hook)
    g.ht = 'c'
    g.sb = (0.18, 1 if not hook else 0.6)


@glyph('uni040B', 0x40B)
def _Tshe(g, p):
    _tshe(g, p, False)


@glyph('uni0402', 0x402)
def _Dje(g, p):
    _tshe(g, p, True)


@glyph('uni0452', 0x452)
def _dje(g, p):
    """ђ: ħ whose leg curls below the line."""
    g.vstem(0, 0, p.asc)
    _djerv(g, p, p.V / 2, p.xh + p.ov * 0.4, True, 0.85)
    g.hbar(-50, p.V + 110, p.asc * 0.83 - p.H * 0.45, h=p.H * 0.9)
    g.ht = 'a'
    g.sb = (0.4, 0.6)


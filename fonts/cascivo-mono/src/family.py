"""Cascivo Mono v1: Cascivo Sans's engine, every spacing glyph on one advance (fonts/PLAN-families.md).

Loaded by fonts/cascivo-sans/src/family.py when CASCIVO_FAMILY=mono. The engine is not edited: the hooks
below narrow the counters (tune), add slabs to i j l (glyph), centre every glyph in one cell (master),
and, because the Bold master's outlines are re-derived from Regular's and Black's points plus o.shift in
build_glyf, a few build.py functions are wrapped on the first master() call (see _patch).
"""

import copy
import importlib.util
import os
import re
import sys

import family as _hooks  # fonts/cascivo-sans/src/family.py: the override decorator

NAME = 'Cascivo Mono'
PS = 'CascivoMono'
ITALIC = False

W = 600  # the one advance, at every weight and optical size
MARGIN = 35  # ink wider than W - 2 MARGIN is squeezed horizontally to fit (m, w, M, W, dashes)
MAXW = W - 2 * MARGIN


# Black's stem in a 600 cell: Sans's 190 left Black's capitals, figures and m w at 530-940 units of ink, squeezed into the cell,
# so their verticals thinned and the 5 6 9 counters closed. Mono's Black draws BLACK_LIGHT lighter (stem 175; 0.06-0.10 swept
# against JetBrains Mono and Geist Mono, 0.08 scored best) and keeps every Black-only shape decision (p.heavy frozen at Sans's).
BLACK_LIGHT = 0.08
# Round 6: Black still read a step darker than JetBrains Mono ExtraBold (a e g s 8 @ & filled at 14 px, the 800-900 step the
# ramp's largest): a further BLACK_EXTRA lighter, on the stem only, so the horizontals and joins keep their opening
BLACK_EXTRA = 0.07
# Thin's 100 stem was a hairline at 12-14 px, greyer than JetBrains Mono Thin: THIN_UP heavier at Thin, fading out by Regular
THIN_UP = 0.15
CAP_HEAVY = 0.16  # the capitals' extra counter narrowing at Black (H 611 -> about 530 of ink)
FIG_HEAVY = 45  # units Black's figure width gives up (0 ink 598 -> about 520)
_frozen = {}
# Terminal legibility at 12-14 px: JetBrains Mono's x-height is 550, Geist Mono's 530, Sans's 528. Units added to every master's.
XH_UP = 22
# Dots (. , : ; ! ? i j): at least DOT_MIN + DOT_K stems; round at Thin, squarer (DOT_SQ more handle) toward Black, as JetBrains
# Mono's. Sans's square dot, enlarged for the cell, read as a block beside Thin's hairlines.
DOT_MIN, DOT_K, DOT_SQ = 110, 0.52, 0.2  # round 6: more floor, less stem: . , : read small at 400-700, Black's i j dots big
COMMA_DEPTH = 230  # units the comma's tail may hang under its head


def _freeze(p):
    """p.heavy as Sans computes it, held while V moves (a property on params.P, so the instance gets a subclass)."""
    cls = type(p)
    if cls not in _frozen:
        _frozen[cls] = type(cls.__name__, (cls,), {'heavy': property(lambda s: s._heavy)})
    h = p.heavy
    p.__class__ = _frozen[cls]
    p._heavy = h
    return h


def tune(p):
    h = _freeze(p)
    f = 1 - BLACK_LIGHT * h
    p.V *= f * (1 - BLACK_EXTRA * h) * (1 + THIN_UP * max(0.0, (400 - p.wght) / 300))
    p.H *= f
    p.bar *= f
    # narrower counters so the typical letter fits a 600 cell (Sans n 578, H 748, O 775 at Regular)
    p.cn *= 0.92
    p.cH *= 0.76 * (1 - CAP_HEAVY * h)
    p.cHd *= 0.76 * (1 - CAP_HEAVY * h)
    p.fig_adv -= FIG_HEAVY * h
    p.xh += XH_UP
    # a code font's dots carry the punctuation: Sans's Thin period was 54 units (JetBrains Mono's 146), a speck at 12 px
    p.dot = max(p.dot, p.V * DOT_K + DOT_MIN)


def _slabs(g, p, name):
    h = p.H * (1 - 0.26 * p.heavy)
    V = getattr(g, 'stem_v', p.V)  # the r draws its own lighter stem (_lighter)
    e = max(70.0, (420 - V) / 2)  # serif reach a side of the stem: the foot is ~420 units at every weight
    if name == 'dotlessi':
        g.hbar(-e, V + e, 0, h)
        g.hbar(-e * 0.85, V / 2, p.xh - h, h)
    elif name == 'l':
        g.strokes = []
        g.vstem(0, 0, p.asc)
        g.hbar(-e, V + e, 0, h)
        g.hbar(-e * 0.85, V / 2, p.asc - h, h)
        g.anchors.pop('top_x', None)
    elif name == 'dotlessj':
        x = g.anchors.get('top_x', V * 0.5 + 70)
        g.hbar(x - V / 2 - e * 0.85, x, p.xh - h, h)


def glyph(g, p, name):
    _slabs(g, p, name)


def _round_dot(self, xc, yb, d=None):
    from geom import arc, orient

    d = self.p.dot if d is None else d
    self.raw.append(orient(arc(xc, yb + d / 2, d / 2, d / 2, 0, 360, k=0.5523 + DOT_SQ * self.p.heavy), outer=True))
    return self


def _install_dot():
    import glyphs as GL

    GL.G.dot = _round_dot
    orig = GL.comma_shape

    def comma_shape(g, d, x, top, depth, *a, **k):
        # the tail follows the dot's size in Sans: with Thin's dot doubled it ran under the line box (-335 at opsz 8)
        return orig(g, d, x, top, min(depth, COMMA_DEPTH), *a, **k)

    GL.comma_shape = comma_shape


_install_dot()


def _wider(name, attr, k):
    """Redraw Sans's `name` with p.<attr> k times p's: f and t are drawn from the n's counter (cn) or width (nw), and Sans's narrow
    f and t (ink 0.5 of the cell, JetBrains Mono's 0.8) left holes either side of them in `fn`, `let`, `for`."""
    import glyphs as GL

    orig = GL.GLYPHS[name][1]

    @_hooks.override(name)
    def draw(g, p):
        q = copy.copy(p)
        setattr(q, attr, getattr(p, attr) * k)
        _drawn_with(g, q, lambda: orig(g, q))


F_WIDE, T_WIDE = 2.2, 1.6  # t's foot curve folds (a kink) past 1.6
_wider('f', 'cn', F_WIDE)
_wider('t', 'cn', T_WIDE)


# ------------------------------------------------------------------------------------------------
# redrawn for the cell: m w M W fit in their own strokes (lighter pen, lower middle apex) instead of being squeezed


def _pen(p, k):
    """A copy of p whose stem and contrast pen are k of p's (p.heavy unchanged): glyphs that carry more strokes than the cell holds."""
    q = copy.copy(p)
    q.V, q.H, q.bar = p.V * k, p.H * k, p.bar * k
    return q


def _drawn_with(g, q, draw):
    """Draw with q's metrics and pen: every stroke without its own pen or width gets q's."""
    old, n0 = g.p, len(g.strokes)
    g.p = q
    try:
        draw()
    finally:
        g.p = old
    for st in g.strokes[n0:]:
        if st.pen is None and st.w is None:
            st.pen = (q.V, q.H)


INK_LC, INK_CAP = 520, 530  # m w and M W ink width, every weight


@_hooks.override('m')
def _m(g, p):
    import glyphs as GL

    # three stems in 600 units: a lighter pen (JetBrains Mono's m stems are about 0.8 of its n's), the counters what is left
    q = _pen(p, 0.86 - 0.06 * p.heavy)
    c = (INK_LC + 20 * p.heavy - 3 * q.V) / 2  # Black's m takes 20 more units of the cell: its counters were slots
    top = p.xh + p.ov * 0.4

    def draw():
        g.vstem(0, 0, p.xh)
        GL.shoulder(g, 0, c + q.V, top, ry_k=1.12)
        GL.shoulder(g, c + q.V, 2 * c + 2 * q.V, top, ry_k=1.12)

    _drawn_with(g, q, draw)


def _lighter(name, k, wider=0.0, base=0.0):
    """Redraw Sans's `name` with a pen k (at Black; 1 at Regular) of the stem, its n counter `base` (Regular) to `wider` (Black) wider."""
    import glyphs as GL

    orig = GL.GLYPHS[name][1]

    @_hooks.override(name)
    def draw(g, p):
        q = _pen(p, 1 - (1 - k) * p.heavy)
        q.cn = p.cn * (1 + base + (wider - base) * p.heavy)
        _drawn_with(g, q, lambda: orig(g, q))
        g.stem_v = q.V


# Black's 5 6 9 closed their counters in the cell and the r's arm was a stub: a lighter pen, and at every weight a longer arm (R_WIDE
# of the n's counter more; Sans's narrow r left a wide white beside it in the cell)
R_WIDE = 0.6
for _n in ('five', 'six', 'nine'):
    _lighter(_n, 0.94)
_lighter('r', 0.94, wider=R_WIDE + 0.15, base=R_WIDE)


def _vee(g, q, w, top, apex, ws):
    """w and W: four diagonals, outer feet at w/4 and 3w/4, the middle apex at `apex` (under `top`, so the two inner strokes end
    clear of the outer ones and the counters stay open)."""
    import glyphs as GL

    def draw():
        wj = 1 - (1 - GL.W_JOIN) * q.heavy
        g.diag(0, top, w * 0.25, 0, 'l', 'c', ws=ws, taper=(1, wj))
        g.diag(w / 2, apex, w * 0.25, 0, 'c', 'c', ws=ws, taper=(1, wj))
        g.diag(w / 2, apex, w * 0.75, 0, 'c', 'c', ws=ws, taper=(1, wj))
        g.diag(w, top, w * 0.75, 0, 'r', 'c', ws=ws, taper=(1, wj))

    _drawn_with(g, q, draw)


@_hooks.override('w')
def _w(g, p):
    _vee(g, _pen(p, 0.97 - 0.04 * p.heavy), INK_LC, p.xh, p.xh * (0.74 - 0.04 * p.heavy), 0.86)


@_hooks.override('W')
def _W(g, p):
    _vee(g, _pen(p, 0.99 - 0.04 * p.heavy), INK_CAP, p.cap, p.cap * (0.66 - 0.04 * p.heavy), 0.9)
    g.ht = 'c'


@_hooks.override('M')
def _M(g, p):
    q = _pen(p, 1.0 - 0.12 * p.heavy)
    w = INK_CAP
    yv = p.cap * (0.3 + 0.04 * p.heavy)  # the vertex stands off the baseline, so the diagonals stay steep and the counters open

    def draw():
        g.vstem(0, 0, p.cap).vstem(w - q.V, 0, p.cap)
        g.diag(0, p.cap, w / 2, yv, 'l', 'c', ws=0.9)
        g.diag(w, p.cap, w / 2, yv, 'r', 'c', ws=0.9)

    _drawn_with(g, q, draw)
    g.ht = 'c'


ZERO_DOT = 1.3  # the oval a little larger than the bar it replaced: an oval of the same box carries ~0.8 of its ink
ZERO_HEAVY = -0.03  # Black's 0 was 530 of ink (JetBrains Mono's 480) and squeezed in the cell: narrower, it keeps its own stems


@_hooks.override('exclam')
def _exclam(g, p):
    # Sans's stem stops at 0.27 cap height, under Black's 197-unit dot: the two touched and `!` read as l at 700-900
    d = p.dot
    gap = max(EXCL_GAP, d * 0.45)
    g.line((d / 2, p.cap), (d / 2, d + gap), w=p.V * 1.04, taper=(1, 0.78))
    g.dot(d / 2, 0)
    g.ht = 'c'


EXCL_GAP = 70


@_hooks.override('zero')
def _zero(g, p):
    """Dotted zero (JetBrains Mono's): the slash met the ring at Black and read as O, and the slashed Ø is a letter of its own."""
    import glyphs as GL

    w = GL.fw(p) * (1.01 + ZERO_HEAVY * p.heavy)
    g.oval(0, -p.ov, w, p.cap + p.ov, k=p.k + GL.CAP_O_SQUARE * p.heavy)
    cw = w - 2 * p.V
    # JetBrains Mono's: about a stem wide and half again as tall; at Black no more than 0.4 of the counter, or the white
    # around it closes at text sizes and the 0 reads as a blot
    dw = min(0.4 * cw, max(70.0, p.V * 1.15))  # 70: Thin's dot still reads at 12 px (its period is 53)
    dh = dw * 1.6
    cy = p.cap / 2
    from geom import arc, orient

    # an oval, squarer toward Black as the period is (a sharp-cornered bar read as a foreign mark in the ring)
    g.raw.append(orient(arc(w / 2, cy, dw * ZERO_DOT / 2, dh * ZERO_DOT / 2, 0, 360, k=0.5523 + DOT_SQ * p.heavy), outer=True))
    g.tab = True
    g.ht = 'c'


@_hooks.override('slash')
def _slash(g, p):
    # JetBrains Mono's / is 0.7-0.8 of the cell wide over 940 units; Sans's 0.42 cap height made a steep stroke that read as l at Black
    g.diag(0, SLASH_Y0, SLASH_W, SLASH_Y1, 'l', 'r', ws=SLASH_WS)


@_hooks.override('backslash')
def _backslash(g, p):
    g.diag(0, SLASH_Y1, SLASH_W, SLASH_Y0, 'l', 'r', ws=SLASH_WS)


SLASH_W, SLASH_Y0, SLASH_Y1, SLASH_WS = 430, -150, 800, 0.66


# ------------------------------------------------------------------------------------------------
# terminal punctuation: the cell's math axis, and the rules that tile across cells

ASC, DESC = 1000, -300  # the line box (build.py's hhea and typo metrics): a terminal's cell at line-height 1


def _axis(p):
    return p.cap * 0.42  # glyphs._mathy's: + - = < > x and the minus centre here


def _dash(w):
    def draw(g, p):
        t = p.H * 1.1
        g.hbar(0, w(p), _axis(p) - t / 2, h=t)  # on the operators' axis, not at mid x-height: in code - is a minus
    return draw


# hyphen 0.49 of the cell (JetBrains Mono's 0.53, Plex's 0.48), en dash 0.70, em dash the whole cell (FULL_X): three distinct lengths
_hooks.override('hyphen')(_dash(lambda p: 270 + p.V * 0.3))
_hooks.override('endash')(_dash(lambda p: 420))
_hooks.override('emdash')(_dash(lambda p: 520))


BAR_K = 0.74  # round 6: at 0.9 of the stem, over the whole line box, | outweighed every letter beside it (`|n|`, `il1I|`)


@_hooks.override('bar')
def _bar(g, p):
    g.line((p.V * 0.45, DESC), (p.V * 0.45, ASC), w=p.V * BAR_K)  # the whole line box: stacked | join into one rule


@_hooks.override('brokenbar')
def _brokenbar(g, p):
    x, gap = p.V * 0.45, 70 + p.V * 0.3
    g.line((x, DESC), (x, (ASC + DESC) / 2 - gap), w=p.V * BAR_K)
    g.line((x, (ASC + DESC) / 2 + gap), (x, ASC), w=p.V * 0.9)


@_hooks.override('asterisk')
def _asterisk(g, p):
    import math

    # Sans's star sits at the cap height (530 here); JetBrains Mono's, Plex Mono's and Fira Code's centre 320-360, beside the math
    # axis, where `a * b` reads as an operator. Larger too: 0.34 em of ink was 0.65x theirs.
    r = 228 + 26 * p.heavy  # round 7: 200 -> 228, the star was 0.76x JetBrains Mono's (402 of ink, theirs 530)
    cy = _axis(p) + 50
    for ang in (90, 18, -54, -126, 162):
        a = math.radians(ang)
        g.line((r, cy), (r + r * math.cos(a), cy + r * math.sin(a)), w=p.V * (0.82 - 0.18 * p.heavy), caps=('b', 'b'))


FULL_X = ('underscore', 'emdash')  # stretched to the cell's edges after centring: ___ and —— join


def _load_box():
    spec = importlib.util.spec_from_file_location('cascivo_mono_box', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'box.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


BOX = {f'uni{cp:04X}': cs for cp, cs in _load_box().glyphs().items()}


def _register_box():
    import glyphs as GL

    for name, cs in BOX.items():
        cp = int(name[3:], 16)

        def draw(g, p, cs=cs):
            g.raw += cs
            g.tab = True

        GL.glyph(name, cp)(draw)


_register_box()


def _math_ops():
    """≤ ≥ ≠ (no ligatures: `<=` stays two glyphs, these are the characters). Drawn on Sans's operator geometry (glyphs._mathy)."""
    import glyphs as GL

    def rel(sign):
        def draw(g, p):
            w, cy, t = GL._mathy(p)
            h = w * 0.36
            cy += t * 0.7  # the chevron rides above the bar, the pair centred on the axis
            a, b = (w, 0) if sign < 0 else (0, w)
            g.line((a, cy + h), (b, cy), w=t, caps=('b', 'b'))
            g.line((b, cy), (a, cy - h), w=t, caps=('b', 'b'))
            g.hbar(0, w, cy - h - t * 1.9, h=t)
            g.tab = True
        return draw

    def notequal(g, p):
        w, cy, t = GL._mathy(p)
        gap = w * 0.17 + t / 2
        g.hbar(0, w, cy - gap - t / 2, h=t).hbar(0, w, cy + gap - t / 2, h=t)
        r = w * 0.5
        g.line((w / 2 - r * 0.42, cy - r), (w / 2 + r * 0.42, cy + r), w=t, caps=('b', 'b'))
        g.tab = True

    GL.glyph('lessequal', 0x2264)(rel(-1))
    GL.glyph('greaterequal', 0x2265)(rel(1))
    GL.glyph('notequal', 0x2260)(notequal)


_math_ops()

CHECK_W = 500  # ✓ ✗ ink width (JetBrains Mono's ✓ about 0.8 of the cell)
BALLOT_H = 600  # ✗'s height: above the x-height (570), under the cap height (730)


def _marks():
    """✓ U+2713 and ✗ U+2717: test runners, linters and CLI status lines print them; they were tofu."""
    import glyphs as GL

    def check(g, p):
        top, w = p.cap * 1.02, CHECK_W
        xv = w * 0.36  # the vertex: a short left arm, a long right one
        g.diag(0, p.cap * 0.52, xv, 0, 'l', 'c', ws=0.9)
        g.diag(w, top, xv, 0, 'r', 'c', ws=0.9)
        g.ht = 'c'

    def ballot(g, p):
        # tilted and smaller than the capital, between the x-height and the cap height (JetBrains Mono's sits there too): a
        # cap-height cross read as X in `// fail ✗`
        w, top = CHECK_W * 0.8, BALLOT_H
        g.diag(w * 0.06, top * 0.96, w, 0, 'l', 'r', ws=0.9)
        g.diag(w, top * 1.04, 0, top * 0.04, 'r', 'l', ws=0.9)
        g.ht = 'c'

    GL.glyph('uni2713', 0x2713)(check)
    GL.glyph('uni2717', 0x2717)(ballot)


_marks()


def fea(text):
    # kerning is meaningless on one advance; kern_fea is also stubbed out in _patch
    return re.sub(r'feature kern \{.*?\} kern;', '', text, flags=re.S)


# ------------------------------------------------------------------------------------------------
# the cell


def _bounds(B, cs):
    bx = [B.contour_bounds(c) for c in cs]
    return min(b[0] for b in bx), min(b[1] for b in bx), max(b[2] for b in bx), max(b[3] for b in bx)


def mono(o, scale=True, keep=()):
    """Centre every spacing glyph's ink in one W cell (squeezing ink wider than MAXW when `scale`).
    Composites follow their first component (accents land where the anchors moved), or are centred
    as a whole. `keep`: glyphs already in the cell (identity transform)."""
    B = sys.modules['__main__']
    T = {}  # name -> (s, off): x' = s x + off
    old_b = {}
    for n, cs in o.contours.items():
        if not cs:
            continue
        b = _bounds(B, cs)
        old_b[n] = b
        if o.adv.get(n, 0) == 0 or o.kind.get(n) == 'mark' or n in keep:
            T[n] = (1.0, 0.0)
            continue
        w = b[2] - b[0]
        s = min(1.0, MAXW / w) if scale and w > MAXW else 1.0
        cx = (b[0] + b[2]) / 2
        T[n] = (s, round(W / 2 - s * cx))

    def ap(t, x):
        return t[0] * x + t[1]

    TC = {}
    for n, parts in o.comps.items():
        if o.adv.get(n, 0) == 0 or n in keep:
            TC[n] = (1.0, 0.0)
            continue
        g0, ox0, _, a0 = parts[0]
        if abs(ox0) < 1e-6 and a0 == 1 and g0 in T and len(parts) <= 4 and all(p[0] == g0 or o.kind.get(p[0]) == 'mark' for p in parts):
            TC[n] = T[g0]
            continue
        xs = []
        for g, ox, _, a in parts:
            if g in old_b:
                xs += [ox + a * old_b[g][0], ox + a * old_b[g][2]]
        cx = (min(xs) + max(xs)) / 2 if xs else W / 2
        TC[n] = (1.0, round(W / 2 - cx))
    # outlines
    for n, t in T.items():
        if t == (1.0, 0.0):
            continue
        o.contours[n] = [B.transform_contour(c, lambda q, t=t: (ap(t, q[0]), q[1])) for c in o.contours[n]]
        b = old_b[n]
        o.bounds[n] = (ap(t, b[0]), b[1], ap(t, b[2]), b[3])
        if n in o.topleft:
            o.topleft[n] = ap(t, o.topleft[n])
    # composites: each component's old centre lands where the composite's transform takes it
    for n, parts in o.comps.items():
        tc = TC[n]
        new = []
        for g, ox, oy, a in parts:
            if g in old_b:
                c_old = (old_b[g][0] + old_b[g][2]) / 2
                c_new = ap(T[g], c_old)
            else:
                c_old = c_new = 0.0
            new.append((g, ap(tc, ox + a * c_old) - a * c_new, oy, a))
        o.comps[n] = new
    for n in list(o.anchors):
        t = T.get(n) or TC.get(n)
        if t and t != (1.0, 0.0):
            o.anchors[n] = {k: (ap(t, v[0]), v[1]) for k, v in o.anchors[n].items()}
        else:
            o.anchors[n] = dict(o.anchors[n])
    for n, a in o.adv.items():
        if a != 0:
            o.adv[n] = W


_patched = False


LATIN_TERMINAL = ',U+2260,U+2713,U+2717,U+2264-2265,U+2500-259F,U+E0B0-E0B3'


def _patch():
    """Wrap build.py functions this family needs changed (the engine stays untouched on disk)."""
    global _patched
    if _patched:
        return
    _patched = True
    B = sys.modules['__main__']
    orig_mid = B.mid_master
    orig_subset = B._subset_latin

    def subset_latin(font, unicodes=B.LATIN):
        # the Latin slice is what a site serves: it carries the terminal set too (box drawing, blocks, Powerline, ≠ ≤ ≥)
        return orig_subset(font, unicodes + LATIN_TERMINAL if unicodes == B.LATIN else unicodes)

    B._subset_latin = subset_latin

    def mid_master(reg, black, nat):
        m = orig_mid(reg, black, nat)
        # Bold is drawn by build_glyf as lerp(Regular, Black) + o.shift: both are in the cell already, so
        # drop the squeeze and the sidebearing shift and re-centre the plain interpolation.
        t = (nat.p.wght - reg.p.wght) / (black.p.wght - reg.p.wght)
        lerp = lambda a, b: a + (b - a) * t  # noqa: E731
        own = set(B.BOLD_OWN)
        for n, rc in reg.contours.items():
            if n in own or n not in black.contours or not rc:
                if n in own:
                    m.contours[n], m.anchors[n] = nat.contours[n], dict(nat.anchors.get(n, {}))
                continue
            m.contours[n] = B._lerp_contours(rc, black.contours[n], t)
            ra, ba = reg.anchors.get(n, {}), black.anchors.get(n, {})
            m.anchors[n] = {k: (lerp(ra[k][0], ba[k][0]), lerp(ra[k][1], ba[k][1])) for k in ra}
        for n, parts in reg.comps.items():
            if parts[0][0] in own:
                m.comps[n] = nat.comps[n]
                continue
            m.comps[n] = [(g, lerp(ox, bx), lerp(oy, by), lerp(a, ba_)) for (g, ox, oy, a), (_, bx, by, ba_) in zip(parts, black.comps[n])]
        m.squeeze = {}
        before = {n: [c for c in cs] for n, cs in m.contours.items()}
        mono(m, scale=False, keep=own | set(BOX))
        # build_glyf ignores Bold's own contours (outside BOLD_OWN): carry the centring as o.shift
        sh = {}
        for n, cs in m.contours.items():
            if n in own or not cs or cs is before[n]:
                continue
            b0 = _bounds(B, before[n])
            b1 = _bounds(B, cs)
            sh[n] = round(b1[0] - b0[0])
        m.shift = sh
        return m

    B.mid_master = mid_master
    B.kern_fea = lambda o: ''
    for mod in ('georgian', 'armenian', 'hebrew'):
        if hasattr(B, mod) and hasattr(getattr(B, mod), 'kern_fea'):
            getattr(B, mod).kern_fea = lambda o: ''
    orig_bmf = B.build_master_font

    def build_master_font(o, glyf, order):
        f = orig_bmf(o, glyf, order)
        hm = f['hmtx'].metrics
        hm['.notdef'] = (W, hm['.notdef'][1])
        return f

    B.build_master_font = build_master_font
    orig_glyf = B.build_glyf

    def build_glyf(outs, order):
        _flatten(outs)
        return orig_glyf(outs, order)

    B.build_glyf = build_glyf


# Round 7: Sans's proportional ( ) [ ] { } sat in the 600 cell at 0.31-0.45 of it (JetBrains Mono's 0.41-0.72): `{}` and `()`
# read as slivers in code. Widened without thickening a stem: brackets and braces lengthen only the points outside their stems
# (arms, hooks, the brace's cusp), parens bend (the middle moves out, the tips stay). All six also reach higher, toward JetBrains
# Mono's -120..840: ink here from -161..751 to about -173..807.
BRACKET_ARM = 55  # units added to [ ] arms
BRACE_REACH = 62  # units added to { } hooks and cusp, each side
PAREN_BEND = 40  # units the ( ) middle moves out
DELIM_TALL = 1.075  # vertical stretch about the baseline
# side of the ink box whose points move: -1 left, +1 right; 0 = both (brace), 'bend' = paren, sign = which way the middle goes
DELIMS = {'bracketleft': (1, BRACKET_ARM), 'bracketright': (-1, BRACKET_ARM), 'braceleft': (0, BRACE_REACH),
          'braceright': (0, BRACE_REACH), 'parenleft': ('bend', -PAREN_BEND), 'parenright': ('bend', PAREN_BEND)}
# Round 7: ~ ^ were flat and small beside the letters (~ 530 x 160 of ink, JetBrains Mono's 470 x 205; ^ 397 x 284, theirs 440 x 390)
OPS_SCALE = {'asciitilde': (0.9, 1.28), 'asciicircum': (1.1, 1.3)}


def _delims(o):
    B = sys.modules['__main__']
    for n, (side, d) in DELIMS.items():
        cs = o.contours.get(n)
        if not cs:
            continue
        x0, y0, x1, y1 = _bounds(B, cs)
        w, ym, hh = x1 - x0, (y0 + y1) / 2, (y1 - y0) / 2

        def f(q, side=side, d=d, x0=x0, w=w, ym=ym, hh=hh):
            x, y = q[0], q[1]
            if side == 'bend':
                x += d * (1 - ((y - ym) / hh) ** 2)
            else:
                t = (x - x0) / w
                if t > 0.7 and side >= 0:
                    x += d
                elif t < 0.3 and side <= 0:
                    x -= d
            return (x, y * DELIM_TALL)  # about the baseline: the reach goes mostly up, where theirs does
        o.contours[n] = [B.transform_contour(c, f) for c in cs]
        o.bounds[n] = _bounds(B, o.contours[n])
    for n, (sx, sy) in OPS_SCALE.items():
        cs = o.contours.get(n)
        if not cs:
            continue
        x0, y0, x1, y1 = _bounds(B, cs)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        o.contours[n] = [B.transform_contour(c, lambda q, cx=cx, cy=cy, sx=sx, sy=sy: (cx + (q[0] - cx) * sx, cy + (q[1] - cy) * sy)) for c in cs]
        o.bounds[n] = _bounds(B, o.contours[n])


def master(o):
    _patch()
    _delims(o)
    mono(o, keep=BOX)
    cell(o)
    _OVER.update(n for n in o.comps if _overflows(o, n))


# Composites whose ink leaves the cell (Ð Ø ¼ Œ ” ǆ, Vietnamese stacked accents, Greek capitals with breathings): mono() can only move
# a composite's parts, not narrow them. Every master's overflowing set is collected, and before build_glyf the union is drawn out
# as outlines in every master (the masters stay compatible) and squeezed into the cell like any wide glyph.
_OVER = set()


def _comp_bounds(o, n, B):
    if n not in o.comps:
        return o.bounds.get(n)
    bs = []
    for g, ox, oy, a in o.comps[n]:
        b = _comp_bounds(o, g, B)
        if b:
            bs.append((ox + a * b[0], oy + a * b[1], ox + a * b[2], oy + a * b[3]))
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)) if bs else None


def _overflows(o, n):
    b = _comp_bounds(o, n, sys.modules['__main__'])
    # half a margin of slack: the corners no master sits on (900 at opsz 8) add the weight and size deltas and reach further out
    return o.adv.get(n, 0) != 0 and b is not None and (b[0] < MARGIN / 2 or b[2] > W - MARGIN / 2)


def _outlines(o, n, B):
    if n not in o.comps:
        return o.contours.get(n, [])
    out = []
    for g, ox, oy, a in o.comps[n]:
        out += [B.transform_contour(c, lambda q, ox=ox, oy=oy, a=a: (ox + a * q[0], oy + a * q[1])) for c in _outlines(o, g, B)]
    return out


def _flatten(outs):
    B = sys.modules['__main__']
    names = sorted(n for n in _OVER if all(n in o.comps for o in outs))
    for o in outs:
        cs = {n: _outlines(o, n, B) for n in names}
        for n in names:
            del o.comps[n]
            b = _bounds(B, cs[n])
            s = min(1.0, MAXW / (b[2] - b[0]))
            off = W / 2 - s * (b[0] + b[2]) / 2
            o.contours[n] = [B.transform_contour(c, lambda q, s=s, off=off: (s * q[0] + off, q[1])) for c in cs[n]]
            o.bounds[n] = (s * b[0] + off, b[1], s * b[2] + off, b[3])


def cell(o):
    """After centring: the box glyphs back on their own coordinates, the rules stretched to the cell's edges."""
    B = sys.modules['__main__']
    for n, cs in BOX.items():
        o.contours[n] = list(cs)
        o.bounds[n] = _bounds(B, cs)
        o.adv[n] = W
    for n in FULL_X:
        b = o.bounds[n]
        s, off = W / (b[2] - b[0]), -W * b[0] / (b[2] - b[0])
        o.contours[n] = [B.transform_contour(c, lambda q, s=s, off=off: (s * q[0] + off, q[1])) for c in o.contours[n]]
        o.bounds[n] = (0, b[1], W, b[3])

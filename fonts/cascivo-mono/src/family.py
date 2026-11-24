"""Cascivo Mono v1: Cascivo Sans's engine, every spacing glyph on one advance (fonts/PLAN-families.md).

Loaded by fonts/cascivo-sans/src/family.py when CASCIVO_FAMILY=mono. The engine is not edited: the hooks
below narrow the counters (tune), add slabs to i j l r (glyph), centre every glyph in one cell (master),
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
CAP_HEAVY = 0.16  # the capitals' extra counter narrowing at Black (H 611 -> about 530 of ink)
FIG_HEAVY = 45  # units Black's figure width gives up (0 ink 598 -> about 520)
_frozen = {}
# Terminal legibility at 12-14 px: JetBrains Mono's x-height is 550, Geist Mono's 530, Sans's 528. Units added to every master's.
XH_UP = 22


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
    p.V *= f
    p.H *= f
    p.bar *= f
    # narrower counters so the typical letter fits a 600 cell (Sans n 578, H 748, O 775 at Regular)
    p.cn *= 0.92
    p.cH *= 0.76 * (1 - CAP_HEAVY * h)
    p.cHd *= 0.76 * (1 - CAP_HEAVY * h)
    p.fig_adv -= FIG_HEAVY * h
    p.xh += XH_UP


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
    elif name == 'r':
        # foot only: with Sans's short arm the top serif made r read as a small-cap I in `drwxr-xr-x` (Plex Mono's r has the same
        # trouble; JetBrains Mono's has neither serif)
        g.hbar(-e * 0.8, V + e * 0.8, 0, h)
    elif name == 'dotlessj':
        x = g.anchors.get('top_x', V * 0.5 + 70)
        g.hbar(x - V / 2 - e * 0.85, x, p.xh - h, h)


def glyph(g, p, name):
    _slabs(g, p, name)


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
R_WIDE = 0.4
for _n in ('five', 'six', 'nine'):
    _lighter(_n, 0.94)
_lighter('r', 0.94, wider=0.45, base=R_WIDE)


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
    _vee(g, _pen(p, 0.9 - 0.04 * p.heavy), INK_LC, p.xh, p.xh * (0.74 - 0.04 * p.heavy), 0.86)


@_hooks.override('W')
def _W(g, p):
    _vee(g, _pen(p, 0.92 - 0.04 * p.heavy), INK_CAP, p.cap, p.cap * (0.66 - 0.04 * p.heavy), 0.9)
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


@_hooks.override('zero')
def _zero(g, p):
    """Dotted zero (JetBrains Mono's): the slash met the ring at Black and read as O, and the slashed Ø is a letter of its own."""
    import glyphs as GL

    w = GL.fw(p) * (1.01 + 0.03 * p.heavy)
    g.oval(0, -p.ov, w, p.cap + p.ov, k=p.k + GL.CAP_O_SQUARE * p.heavy)
    cw = w - 2 * p.V
    # JetBrains Mono's: about a stem wide and half again as tall; at Black no more than 0.4 of the counter, or the white
    # around it closes at text sizes and the 0 reads as a blot
    dw = min(0.4 * cw, max(70.0, p.V * 1.15))  # 70: Thin's dot still reads at 12 px (its period is 53)
    dh = dw * 1.6
    cy = p.cap / 2
    g.line((w / 2 - dw / 2, cy), (w / 2 + dw / 2, cy), w=dh)  # drawn across: run along its height, Black's thick dot came out hollow
    g.tab = True
    g.ht = 'c'


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


@_hooks.override('bar')
def _bar(g, p):
    g.line((p.V * 0.45, DESC), (p.V * 0.45, ASC), w=p.V * 0.9)  # the whole line box: stacked | join into one rule


@_hooks.override('brokenbar')
def _brokenbar(g, p):
    x, gap = p.V * 0.45, 70 + p.V * 0.3
    g.line((x, DESC), (x, (ASC + DESC) / 2 - gap), w=p.V * 0.9)
    g.line((x, (ASC + DESC) / 2 + gap), (x, ASC), w=p.V * 0.9)


@_hooks.override('asterisk')
def _asterisk(g, p):
    import math

    # Sans's star sits at the cap height (530 here); JetBrains Mono's, Plex Mono's and Fira Code's centre 320-360, beside the math
    # axis, where `a * b` reads as an operator. Larger too: 0.34 em of ink was 0.65x theirs.
    r = 200 + 26 * p.heavy
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

    for name in BOX:
        cp = int(name[3:], 16)

        def draw(g, p, name=name):
            g.raw += BOX[name]
            g.tab = True

        GL.glyph(name, cp)(draw)


_register_box()


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


def _patch():
    """Wrap build.py functions this family needs changed (the engine stays untouched on disk)."""
    global _patched
    if _patched:
        return
    _patched = True
    B = sys.modules['__main__']
    orig_mid = B.mid_master

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


def master(o):
    _patch()
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
        o.contours[n] = [B.transform_contour(c, lambda q: (s * q[0] + off, q[1])) for c in o.contours[n]]
        o.bounds[n] = (0, b[1], W, b[3])

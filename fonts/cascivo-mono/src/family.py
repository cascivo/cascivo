"""Cascivo Mono v1: Cascivo Sans's engine, every spacing glyph on one advance (fonts/PLAN-families.md).

Loaded by fonts/cascivo-sans/src/family.py when CASCIVO_FAMILY=mono. The engine is not edited: the hooks
below narrow the counters (tune), add slabs to i j l r (glyph), centre every glyph in one cell (master),
and, because the Bold master's outlines are re-derived from Regular's and Black's points plus o.shift in
build_glyf, a few build.py functions are wrapped on the first master() call (see _patch).
"""

import re
import sys

NAME = 'Cascivo Mono'
PS = 'CascivoMono'
ITALIC = False

W = 600  # the one advance, at every weight and optical size
MARGIN = 35  # ink wider than W - 2 MARGIN is squeezed horizontally to fit (m, w, M, W, dashes)
MAXW = W - 2 * MARGIN


def tune(p):
    # narrower counters so the typical letter fits a 600 cell (Sans n 578, H 748, O 775 at Regular)
    p.cn *= 0.92
    p.cH *= 0.76
    p.cHd *= 0.76


def _slabs(g, p, name):
    h = p.H * (1 - 0.26 * p.heavy)
    e = max(70.0, (420 - p.V) / 2)  # serif reach a side of the stem: the foot is ~420 units at every weight
    V = p.V
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
        g.hbar(-e * 0.8, V + e * 0.8, 0, h)
        g.hbar(-e * 0.7, V / 2, p.xh - h, h)
    elif name == 'dotlessj':
        x = g.anchors.get('top_x', V * 0.5 + 70)
        g.hbar(x - V / 2 - e * 0.85, x, p.xh - h, h)


def glyph(g, p, name):
    _slabs(g, p, name)


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
        mono(m, scale=False, keep=own)
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


def master(o):
    _patch()
    mono(o)
    if 'zero.slash' in o.adv:  # code wants 0 and O apart: the slashed zero is the default (Sans's `zero` feature glyph)
        o.cmap[0x30] = 'zero.slash'

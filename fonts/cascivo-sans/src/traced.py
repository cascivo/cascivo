"""Letters drawn from centre lines traced off a reference font (trace_noto.py): the scripts none of
Inter, Geist or Plex has, Georgian and Armenian. Each script module hands its traced data here.

A letter's data are its Thin centre lines and the same points moved toward the reference's Black
(as far as this font's pen draws them cleanly); the masters blend between them by stem weight.
That is how the reference's Black keeps the Latin stem and still has room for its bowls: they
open, and the letter barely widens. This font's pen then draws the centre lines at every weight,
as it draws the Latin. The tracing keeps the reference's structure, which readers rely on; the
contrast and weight are this font's, and the x-height is this font's x-height.
"""

import math

from geom import arc, norm, orient, pen_thickness, seg_point
from params import BLACK_STEM, P

V_THIN = P(100, 14).V


def blend3(values, t):
    """A value given at Thin, Regular and Black (t = 0, 0.37, 1), at blend t."""
    v0, v1, v2 = values
    return v0 + (v1 - v0) * t / 0.37 if t <= 0.37 else v1 + (v2 - v1) * (t - 0.37) / 0.63


def scale(p, ref):
    """A master's blend between the Thin and Black references (by stem weight: Thin 0, Regular
    0.37, Black 1), the horizontal scale from reference units, and the blended levels. The unit
    letter's ink is the reference's at this weight, in proportion to the x-heights: the reference
    sets its letters' width against its own Latin, and this font's x-height is the Latin's."""
    t = min(1.0, max(0.0, (p.V - V_THIN) / (BLACK_STEM - V_THIN)))
    lv = {k: v + (ref['black'][k] - v) * t for k, v in ref['thin'].items()}
    ink = blend3(ref['unit_ink'], t) * p.xh / ref['lines']['xh']
    return t, (ink - p.V) / lv['unit'], lv


def _y_map(p, H, ref, ht):
    """Reference centre-line levels onto this font's: round strokes ride half a stroke inside the
    line, less their overshoot."""
    if ht == 'c':
        src = (ref['base'], ref['cap'])
        dst = (-p.ov + H / 2, p.cap + p.ov - H / 2)
    else:
        src = (ref['desc'], ref['base'], ref['xh'], ref['asc'])
        dst = (p.desc + H / 2, -p.ov + H / 2, p.xh + p.ov - H / 2, p.asc - H / 4)

    def f(y):
        i = sum(y >= s for s in src[1:-1])
        return dst[i] + (y - src[i]) * (dst[i + 1] - dst[i]) / (src[i + 1] - src[i])

    return f


def _line(p, lines, y_ref):
    """The baseline, x-height, ascender, descender or cap height a stem's end in the reference
    sits on."""
    for ref, line in ((0, 0), (lines['xh'], p.xh), (lines['asc'], p.asc), (lines['desc'], p.desc), (lines['cap'], p.cap)):
        if abs(y_ref - ref) < 20:
            return line
    return None


def _snap(line, end, handle):
    """A stem's end sits on its line exactly. The level map is for the centre of a round stroke,
    which rides half a stroke inside the line; a cut end does not. A steep end also arrives square
    to the line, its handle straight above or below it: a leg meeting the baseline on a slant (Ჩ's,
    ჩ's) left the flat cut more to trim than it may, and a corner hung below the line."""
    dy = line - end[1]
    steep = abs(end[0] - handle[0]) < abs(end[1] - handle[1])  # a shallow end (შ's, წ's) would fold if squared
    return (end[0], line), (end[0] if steep else handle[0], handle[1] + dy)


def _into(end, handle, d):
    """A stroke that ends on another runs on into it by a share of the stem, so the join has no
    notch at heavy weights; at Thin that share stays inside the other stroke."""
    v = (end[0] - handle[0], end[1] - handle[1])
    n = math.hypot(*v) or 1.0
    dx, dy = v[0] / n * d, v[1] / n * d
    return (end[0] + dx, end[1] + dy), (handle[0] + dx, handle[1] + dy)


def _profile(o, name, ox=0.0, oy=0.0, a=1.0, out=None):
    """Each 10-unit band's leftmost and rightmost ink, as kern.py's profile, but sampled every few
    units: kern.py samples a curve 24 times, which suits the Latin's short segments and leaves
    gaps of whole bands along a traced letter's long ones (օ's side went missing)."""
    from kern import BAND

    lo, hi = out or ({}, {})
    for c in o.contours.get(name, []):
        for sg in c:
            n = 2 + int(sum(math.dist(q, r) for q, r in zip(sg[1:], sg[2:])) / 4)  # the control polygon's length
            for j in range(n + 1):
                x, y = seg_point(sg, j / n)
                x, y = ox + a * x, oy + a * y
                b = int(y // BAND)
                lo[b] = min(lo.get(b, x), x)
                hi[b] = max(hi.get(b, x), x)
    for g, cx, cy, ca in o.comps.get(name, []):
        _profile(o, g, ox + a * cx, oy + a * cy, a * ca, (lo, hi))
    return lo, hi


def _gap(o, a, b, prof):
    """The closest the two glyphs come, unkerned, in the bands both have ink in (None if none)."""
    hi, lo = prof[o, a][1], prof[o, b][0]
    bands = hi.keys() & lo.keys()
    return min(o.adv[a] - hi[k] + lo[k] for k in bands) if bands else None


_OPENED = {}  # (lookup, masters) -> the pairs something needs opened: one pair set for every master


def kern_fea(o, ref, kern, lookup, masters=(), corners=None, floor=0.2, cps=()):
    """The reference's own kerning, at this master's blend of its Thin, Regular and Black values and
    scaled with the letters: the letters are its centre lines with its spacing, so its kerning fits
    them. (The measure kern.py fits to Latin kerned Georgian twice as hard as Noto does.)

    With `masters` (every master's outlines), no pair of the glyphs `cps` comes closer than `floor`
    S: this pen's Black is not Noto's, and Noto tucks Armenian's ՛ over ւ (ու՛) by more than our
    taller ւ allows. Only ever opens. A variable font's masters share one pair set, so the pairs are
    chosen over them all; each value is measured on its own master. `corners` (optical-size master
    name -> its Black and Thin corners, build.py) are kept clear as kern.py keeps Display Black:
    the optical-size master takes what makes the interpolated corner reach its own need."""
    names = [f'uni{cp:04X}' for cp in sorted(cps)]
    corners = corners or {}
    prof = {}

    def own(m, pair):
        t, sx, _ = scale(m.p, ref)
        v = round(blend3(kern[pair], t) * sx) if pair in kern else 0
        if pair in opened:
            for n in pair.split():
                if (m, n) not in prof:
                    prof[m, n] = _profile(m, n)
            gap = _gap(m, *pair.split(), prof)
            if gap is not None:
                v = max(v, math.ceil(floor * m.p.S - gap))
        return v

    key = (lookup, tuple(masters))  # the masters themselves: held, so no id is reused
    if masters and key not in _OPENED:
        every = list(masters) + [c for pair in corners.values() for c in pair]
        prof.update({(m, n): _profile(m, n) for m in every for n in names})
        found = set()
        for m in every:
            for a in names:
                for b in names:
                    t, sx, _ = scale(m.p, ref)
                    v = round(blend3(kern[f'{a} {b}'], t) * sx) if f'{a} {b}' in kern else 0
                    gap = _gap(m, a, b, prof)
                    if gap is not None and gap + v < floor * m.p.S:
                        found.add(f'{a} {b}')
        _OPENED[key] = found
    opened = _OPENED.get(key, set())
    at = {(m.loc['wght'], m.loc['opsz']): m for m in masters}
    vals = {}
    for pair in sorted(kern.keys() | opened):
        v = own(o, pair)
        if pair in opened and getattr(o, 'name', None) in corners:
            # corner value = R + (B - R) + (M - R) = B + M - R, for the Black and the Thin corner
            reg = own(at[400, 14], pair)
            for corner, weight in zip(corners[o.name], (at[900, 14], at[100, 14])):
                v = max(v, own(corner, pair) - own(weight, pair) + reg)
        vals[pair] = v
    lines = ['feature kern {', f'  lookup {lookup} {{']
    lines += [f'    pos {pair} {v};' for pair, v in vals.items()]
    lines += [f'  }} {lookup};', '} kern;']
    return '\n'.join(lines)


def draw_letter(g, p, entry, ref):
    """One letter from its traced data. The masters blend the Thin and Black centre lines by stem
    weight; the tracer has already held each stroke back from Black as far as this pen needs to
    draw it cleanly."""
    sbl, sbr, ht, strokes = entry
    t, sx, lv = scale(p, ref)
    V, H = p.V, p.H
    fy = _y_map(p, H, lv, ht)
    for closed, ends, thin, black, pen, cut in strokes:
        sw = 1 - (1 - pen) * p.heavy  # 1, but where the tracer found the full pen folds
        pts = [((a + (b - a) * t) * sx + V / 2, fy(c + (d - c) * t)) for a, c, b, d in zip(thin[::2], thin[1::2], black[::2], black[1::2])]
        caps = ['b', 'b']
        if not closed:
            for k, (end, handle, y_ref) in enumerate(((0, 1, thin[1]), (-1, -2, thin[-1]))):
                line = _line(p, ref['lines'], y_ref)
                if ends[k] in ('join', 'corner'):  # a round joint, where square ends would notch
                    w = pen_thickness(norm((pts[end][0] - pts[handle][0], pts[end][1] - pts[handle][1])), V, H) * sw
                    g.raw.append(orient(arc(*pts[end], w / 2, w / 2, 90, 450), outer=True))
                if ends[k] == 'join':
                    pts[end], pts[handle] = _into(pts[end], pts[handle], 0.4 * V)
                elif ends[k] == 'free' and line is not None:  # a stem's end: cut flat on its line
                    pts[end], pts[handle] = _snap(line, pts[end], pts[handle])
                    caps[k] = 'h'
        segs = [('C', *pts[i : i + 4]) for i in range(0, len(pts) - 1, 3)]
        g.stroke(segs, closed=closed, ws=sw, cut=cut, caps=tuple(caps))
    g.ht = ht
    # the reference's own spacing, scaled with the outline: this font's Latin tightens more at
    # Black than Noto's does, and Georgian set in the Latin's units touched there
    u = min(1.0, max(0.0, (t - 0.37) / 0.63))
    unit = p.Sc if ht == 'c' else p.S
    g.sb = tuple((a + (b - a) * u) * sx / unit for a, b in (sbl, sbr))


def register(trace, ref):
    """Every traced letter, as a glyph drawn at each master."""
    from glyphs import glyph

    for cp, entry in trace.items():
        glyph(f'uni{cp:04X}', cp)(lambda g, p, entry=entry: draw_letter(g, p, entry, ref))

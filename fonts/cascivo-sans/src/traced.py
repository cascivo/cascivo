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


def x_height(p, ref):
    """Where the script's x-height lines sit: this font's x-height, scaled by `height` where the
    reference sets its letters taller than its Latin x-height (Noto's Hebrew: 593 against 536)."""
    return p.xh * ref.get('height', 1.0)


def scale(p, ref):
    """A master's blend between the Thin and Black references (by stem weight: Thin 0, Regular
    0.37, Black 1), the horizontal scale from reference units, and the blended levels. The unit
    letter's ink is the reference's at this weight, in proportion to the x-heights: the reference
    sets its letters' width against its own Latin, and this font's x-height is the Latin's."""
    t = min(1.0, max(0.0, (p.V - V_THIN) / (BLACK_STEM - V_THIN)))
    lv = {k: v + (ref['black'][k] - v) * t for k, v in ref['thin'].items()}
    lv['height'] = ref.get('height', 1.0)  # for the level map
    ink = blend3(ref['unit_ink'], t) * x_height(p, ref) / ref['lines']['xh']
    return t, (ink - p.V) / lv['unit'], lv


def _y_map(p, H, ref, ht):
    """Reference centre-line levels onto this font's: round strokes ride half a stroke inside the
    line, less their overshoot."""
    if ht == 'c':
        src = (ref['base'], ref['cap'])
        dst = (-p.ov + H / 2, p.cap + p.ov - H / 2)
    else:
        src = (ref['desc'], ref['base'], ref['xh'], ref['asc'])
        dst = (p.desc + H / 2, -p.ov + H / 2, x_height(p, ref) + p.ov - H / 2, p.asc - H / 4)

    def f(y):
        i = sum(y >= s for s in src[1:-1])
        return dst[i] + (y - src[i]) * (dst[i + 1] - dst[i]) / (src[i + 1] - src[i])

    return f


def _line(p, ref, y_ref, end, prev):
    """The baseline, x-height, ascender, descender or cap height a stem's end in the reference
    sits on. A level end is no stem's: its centre line rides half a stroke off the line (ւ's foot,
    Hebrew's bars), and moving it onto the line tipped the stroke. Only a steep end is a stem's on
    the x-height, where a shallow one is a flat top's."""
    lines = ref['lines']
    dx, dy = abs(end[0] - prev[0]), abs(end[1] - prev[1])
    if dy < 0.3 * dx:
        return None
    for at, line in ((0, 0), (lines['xh'], x_height(p, ref)), (lines['asc'], p.asc), (lines['desc'], p.desc), (lines['cap'], p.cap)):
        if abs(y_ref - at) < 20:
            if at == lines['xh'] and dx >= dy:
                return None
            return line
    return None


def _snap(line, end, handle, prev):
    """A stem's end sits on its line exactly. The level map is for the centre of a round stroke,
    which rides half a stroke inside the line; a cut end does not. A steep end also arrives square
    to the line, its handle straight above or below it: a leg meeting the baseline on a slant (Ჩ's,
    ჩ's) left the flat cut more to trim than it may, and a corner hung below the line. Steep is the
    last curve's chord, not its handle: ჩ's leg curls in at Black, its handle shallow, and the flat
    cut turned vertical and hung 83 units under the baseline. A squared handle reaches a third of
    the chord, so the turn into it is not sudden."""
    dy = line - end[1]
    if abs(end[0] - prev[0]) >= abs(end[1] - prev[1]):  # a shallow end (შ's, წ's) would fold if squared
        return (end[0], line), (handle[0], handle[1] + dy)
    rise = max(abs(handle[1] - end[1]), abs(prev[1] - end[1]) / 3)
    return (end[0], line), (end[0], line + math.copysign(rise, prev[1] - end[1]))


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


def _met(p, q, others):
    """Where a join lands on the nearest other stroke's centre line, and how thick that stroke is
    there. A stem standing on Hebrew's thin base (ב, נ) ran on, and set its joint, by its own
    width, and both came out under the base; and where the strokes blend toward Black by different
    amounts, the join's end is no longer on the other stroke at all."""
    best, thick, at_best = None, p.V, q
    for pts, sw in others:
        for i in range(0, len(pts) - 1, 3):
            seg = ('C', *pts[i : i + 4])
            t0 = min((j / 16 for j in range(17)), key=lambda t: math.dist(seg_point(seg, t), q))
            lo, hi = max(0.0, t0 - 1 / 16), min(1.0, t0 + 1 / 16)
            for _ in range(24):  # the nearest point itself, not the nearest sample
                m1, m2 = lo + (hi - lo) / 3, hi - (hi - lo) / 3
                if math.dist(seg_point(seg, m1), q) < math.dist(seg_point(seg, m2), q):
                    hi = m2
                else:
                    lo = m1
            t = (lo + hi) / 2
            at = seg_point(seg, t)
            d = math.dist(at, q)
            if best is None or d < best:
                nxt, prv = seg_point(seg, min(1.0, t + 0.02)), seg_point(seg, max(0.0, t - 0.02))
                best, thick, at_best = d, pen_thickness(norm((nxt[0] - prv[0], nxt[1] - prv[1])), p.V, p.H) * sw, at
    return thick, at_best


def kern_fea(o, ref, kern, lookup, masters=(), corners=None, floor=0.2, cps=(), rtl=False):
    """The reference's own kerning, at this master's blend of its Thin, Regular and Black values and
    scaled with the letters: the letters are its centre lines with its spacing, so its kerning fits
    them. (The measure kern.py fits to Latin kerned Georgian twice as hard as Noto does.)

    With `masters` (every master's outlines), no pair of the glyphs `cps` comes closer than `floor`
    S: this pen's Black is not Noto's, and Noto tucks Armenian's ՛ over ւ (ու՛) by more than our
    taller ւ allows. Only ever opens. A variable font's masters share one pair set, so the pairs are
    chosen over them all; each value is measured on its own master. `corners` (optical-size master
    name -> its Black and Thin corners, build.py) are kept clear as kern.py keeps Display Black:
    the optical-size master takes what makes the interpolated corner reach its own need.

    `rtl` (Hebrew): a pair's second glyph sets to the left of its first, so the floor is measured
    that way round and the value moves the first glyph as well as its advance, and the script's letters are kept clear of punctuation and figures here, not
    in kern.py, whose pairs are measured left to right."""
    from kern import TRACED_NEIGHBOURS

    names = [f'uni{cp:04X}' for cp in sorted(cps)]
    marks = [n for n in TRACED_NEIGHBOURS if n in o.adv] if rtl else []
    pairs = [(a, b) for a in names for b in names] + [q for a in names for m in marks for q in ((a, m), (m, a))]
    corners = corners or {}
    prof = {}

    def own(m, pair):
        t, sx, _ = scale(m.p, ref)
        v = round(blend3(kern[pair], t) * sx) if pair in kern else 0
        if pair in opened:
            for n in pair.split():
                if (m, n) not in prof:
                    prof[m, n] = _profile(m, n)
            a, b = pair.split()
            gap = _gap(m, b, a, prof) if rtl else _gap(m, a, b, prof)
            if gap is not None:
                v = max(v, math.ceil(floor * m.p.S - gap))
        return v

    key = (lookup, tuple(masters))  # the masters themselves: held, so no id is reused
    if masters and key not in _OPENED:
        every = list(masters) + [c for pair in corners.values() for c in pair]
        prof.update({(m, n): _profile(m, n) for m in every for n in names + marks})
        found = set()
        for m in every:
            t, sx, _ = scale(m.p, ref)
            for a, b in pairs:
                v = round(blend3(kern[f'{a} {b}'], t) * sx) if f'{a} {b}' in kern else 0
                gap = _gap(m, b, a, prof) if rtl else _gap(m, a, b, prof)
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
    lines = ['feature kern {', f'  lookup {lookup} {{'] + (['    lookupflag IgnoreMarks;'] if rtl else [])  # a pointed letter kerns as a bare one
    # in a right-to-left run the first glyph stands on the right: its advance alone would move only
    # its outer side, so it also moves itself over (Noto's own Hebrew pairs are written the same way)
    lines += [f'    pos {pair} <{v} 0 {v} 0>;' if rtl else f'    pos {pair} {v};' for pair, v in vals.items()]
    lines += [f'  }} {lookup};', '} kern;']
    return '\n'.join(lines)


def draw_letter(g, p, entry, ref):
    """One letter from its traced data. The masters blend the Thin and Black centre lines by stem
    weight; the tracer has already held each stroke back from Black as far as this pen needs to
    draw it cleanly."""
    sbl, sbr, ht, strokes, *extra = entry
    extra = extra[0] if extra else {}
    t, sx, lv = scale(p, ref)
    V, H = p.V, p.H
    fy = _y_map(p, H, lv, ht)

    def at(xt, yt, xb, yb):  # a point given at the Thin and the Black, as the centre lines map
        return (xt + (xb - xt) * t) * sx + V / 2, fy(yt + (yb - yt) * t)

    # a mark is drawn with the point it attaches by at the origin, as the Latin marks are
    ox, oy = (0.0, 0.0)
    if 'mark' in extra:
        ax, ay = at(*extra['mark'][1])
        ox, oy = -ax, -ay
        g.mark = True
    for cls, a in extra.get('anchors', {}).items():
        g.anchors['mk_' + cls] = at(*a)
    for xt, yt, rt, xb, yb, rb in extra.get('dots', []):
        cx, cy = at(xt, yt, xb, yb)
        r = (rt + (rb - rt) * t) * sx
        g.raw.append(orient(arc(cx + ox, cy + oy, r, r, 90, 450), outer=True))
    weights = [1 - (1 - pen) * p.heavy for *_, pen, _ in strokes]  # 1, but where the tracer found the full pen folds
    # a mark's strokes are as thick as Noto's points' bars at this weight, not this pen's
    mark_w = blend3(ref['mark_w'], t) * x_height(p, ref) / ref['lines']['xh'] if 'mark' in extra else None
    centres = [[(x + ox, y + oy) for x, y in (at(a, c, b, d) for a, c, b, d in zip(thin[::2], thin[1::2], black[::2], black[1::2]))] for _, _, thin, black, _, _ in strokes]
    # a corner's two ends meet, however far toward Black each half was let go (נ's foot went all the
    # way and its stem stayed at the Thin, and they parted)
    meets = {}
    for i, (closed, ends, thin, *_) in enumerate(strokes):
        for k, (end, handle) in enumerate(((0, 1), (-1, -2))):
            if not closed and ends[k] == 'corner':
                meets.setdefault((thin[0], thin[1]) if end == 0 else (thin[-2], thin[-1]), []).append((i, end, handle))
    joint = {}  # a corner's joint is as wide as its thinner half: נ's stem's ran under its foot
    for group in meets.values():
        mid = tuple(sum(centres[i][e][a] for i, e, _ in group) / len(group) for a in (0, 1))
        for i, e, h in group:
            dx, dy = mid[0] - centres[i][e][0], mid[1] - centres[i][e][1]
            centres[i][e], centres[i][h] = mid, (centres[i][h][0] + dx, centres[i][h][1] + dy)
        w = mark_w or min(pen_thickness(norm((centres[i][e][0] - centres[i][h][0], centres[i][e][1] - centres[i][h][1])), V, H) * weights[i] for i, e, h in group)
        joint.update({(i, e): w for i, e, _ in group})
    for i, ((closed, ends, thin, _, _, cut), sw) in enumerate(zip(strokes, weights)):
        pts = list(centres[i])
        caps = ['b', 'b']
        if not closed:
            for k, (end, handle, y_ref) in enumerate(((0, 1, thin[1]), (-1, -2, thin[-1]))):
                line = _line(p, ref, y_ref, pts[end], pts[3 if end == 0 else -4])
                met = None
                if ends[k] == 'join':
                    met, on = _met(p, pts[end], [(c, ws) for j, (c, ws) in enumerate(zip(centres, weights)) if j != i])
                    met = mark_w or met
                    dx, dy = on[0] - pts[end][0], on[1] - pts[end][1]
                    pts[end], pts[handle] = on, (pts[handle][0] + dx, pts[handle][1] + dy)
                if ends[k] in ('join', 'corner'):  # a round joint, where square ends would notch
                    w = mark_w or pen_thickness(norm((pts[end][0] - pts[handle][0], pts[end][1] - pts[handle][1])), V, H) * sw
                    met = met or joint.get((i, end), w)
                    r = min(w, met) / 2
                    g.raw.append(orient(arc(*pts[end], r, r, 90, 450), outer=True))
                if ends[k] == 'join':
                    pts[end], pts[handle] = _into(pts[end], pts[handle], 0.4 * min(V, met))
                elif ends[k] == 'free' and line is not None:  # a stem's end: cut flat on its line
                    pts[end], pts[handle] = _snap(line, pts[end], pts[handle], pts[3 if end == 0 else -4])
                    caps[k] = 'h'
        segs = [('C', *pts[i : i + 4]) for i in range(0, len(pts) - 1, 3)]
        g.stroke(segs, closed=closed, ws=sw, cut=cut, caps=tuple(caps), w=mark_w)
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

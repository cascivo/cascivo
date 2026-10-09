"""Stroke geometry: centerline paths expanded into outlines with an angle-driven pen.

Every glyph is drawn as centerline strokes. A stroke's thickness at any point depends on the
direction of travel (vertical = full stem, horizontal = thinner hairline), which is what gives
a grotesque its quiet modulation without anyone drawing it twice. Because the *structure* of
every outline (number of contours, segments, segment kinds) depends only on the glyph code and
never on the master parameters, every master is point-compatible by construction — which is
what a variable font needs.
"""

import math

Pt = tuple  # (x, y)


def lerp(a, b, t):
    return a + (b - a) * t


def add(p, q):
    return (p[0] + q[0], p[1] + q[1])


def sub(p, q):
    return (p[0] - q[0], p[1] - q[1])


def mul(p, k):
    return (p[0] * k, p[1] * k)


def norm(v):
    d = math.hypot(v[0], v[1])
    return (v[0] / d, v[1] / d) if d > 1e-9 else (0.0, 1.0)


def left_normal(t):
    return (-t[1], t[0])


# --- segments -------------------------------------------------------------------------------
# A segment is ('L', p0, p1) or ('C', p0, p1, p2, p3).


def L(p0, p1):
    return ('L', p0, p1)


def C(p0, p1, p2, p3):
    return ('C', p0, p1, p2, p3)


def seg_point(s, t):
    if s[0] == 'L':
        return (lerp(s[1][0], s[2][0], t), lerp(s[1][1], s[2][1], t))
    _, a, b, c, d = s
    mt = 1 - t
    return (
        mt**3 * a[0] + 3 * mt * mt * t * b[0] + 3 * mt * t * t * c[0] + t**3 * d[0],
        mt**3 * a[1] + 3 * mt * mt * t * b[1] + 3 * mt * t * t * c[1] + t**3 * d[1],
    )


def seg_tangent(s, t):
    if s[0] == 'L':
        return norm(sub(s[2], s[1]))
    _, a, b, c, d = s
    mt = 1 - t
    v = (
        3 * mt * mt * (b[0] - a[0]) + 6 * mt * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]),
        3 * mt * mt * (b[1] - a[1]) + 6 * mt * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]),
    )
    if math.hypot(*v) < 1e-6:  # degenerate handle: fall back to the chord
        return norm(sub(d, a)) if t < 0.5 else norm(sub(d, a))
    return norm(v)


def split_cubic(s, t):
    _, a, b, c, d = s
    ab, bc, cd = (lerp(a[0], b[0], t), lerp(a[1], b[1], t)), (lerp(b[0], c[0], t), lerp(b[1], c[1], t)), (lerp(c[0], d[0], t), lerp(c[1], d[1], t))
    abc, bcd = (lerp(ab[0], bc[0], t), lerp(ab[1], bc[1], t)), (lerp(bc[0], cd[0], t), lerp(bc[1], cd[1], t))
    m = (lerp(abc[0], bcd[0], t), lerp(abc[1], bcd[1], t))
    return C(a, ab, abc, m), C(m, bcd, cd, d)


def arc(cx, cy, rx, ry, a0, a1, k=0.5523):
    """Elliptical arc from angle a0 to a1 (degrees, CCW positive) on the centerline ellipse.

    k is the handle ratio of each quarter: 0.5523 is a circle, larger is squarer (grotesque
    bowls sit around 0.58-0.62). Splits at every quadrant boundary, so the segment count only
    depends on which quadrants a0/a1 fall in — keep those stable across masters.
    """
    eps = 1e-6
    up = a1 > a0
    cuts = [a0]
    q = (math.floor(a0 / 90 + eps) + 1) * 90 if up else (math.ceil(a0 / 90 - eps) - 1) * 90
    while (q < a1 - eps) if up else (q > a1 + eps):
        cuts.append(q)
        q += 90 if up else -90
    cuts.append(a1)
    out = []
    for sa, sb in zip(cuts, cuts[1:]):
        mid = (sa + sb) / 2
        qa = math.floor(mid / 90) * 90 if up else math.ceil(mid / 90) * 90
        qb = qa + 90 if up else qa - 90
        seg = _quarter(cx, cy, rx, ry, qa, qb, k)
        out.append(_sub_cubic(seg, _t_at(seg, cx, cy, rx, ry, sa, qa, qb), _t_at(seg, cx, cy, rx, ry, sb, qa, qb)))
    return out


def _cs(ang):
    r = math.radians(ang)
    return round(math.cos(r)), round(math.sin(r))


def _quarter(cx, cy, rx, ry, qa, qb, k):
    d = 1 if qb > qa else -1
    ca, sa = _cs(qa)
    cb, sb = _cs(qb)
    p0 = (cx + rx * ca, cy + ry * sa)
    p3 = (cx + rx * cb, cy + ry * sb)
    t0 = (-sa * rx * d, ca * ry * d)
    t3 = (-sb * rx * d, cb * ry * d)
    return C(p0, add(p0, mul(t0, k)), sub(p3, mul(t3, k)), p3)


def _t_at(seg, cx, cy, rx, ry, ang, qa, qb):
    """Parameter on a quarter cubic whose normalized polar angle equals ang (bisection)."""
    if abs(ang - qa) < 1e-9:
        return 0.0
    if abs(ang - qb) < 1e-9:
        return 1.0
    mid = (qa + qb) / 2

    def angle_of(t):
        p = seg_point(seg, t)
        a = math.degrees(math.atan2((p[1] - cy) / ry, (p[0] - cx) / rx))
        while a - mid > 180:
            a -= 360
        while a - mid < -180:
            a += 360
        return a

    lo, hi = 0.0, 1.0
    up = qb > qa
    for _ in range(48):
        m = (lo + hi) / 2
        if (angle_of(m) < ang) == up:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def _sub_cubic(seg, ta, tb):
    if ta <= 1e-9 and tb >= 1 - 1e-9:
        return seg
    s = seg
    if tb < 1 - 1e-9:
        s, _ = split_cubic(s, tb)
    if ta > 1e-9:
        _, s = split_cubic(s, ta / tb if tb > 1e-9 else 0)
    return s


# --- stroke expansion -----------------------------------------------------------------------


class Stroke:
    """A centerline path plus how to pen it.

    caps: per end, 'b' butt (perpendicular; every curved terminal uses it), 'h' cut along a
          horizontal through the end point (straight strokes, joins),
          'v' cut along a vertical through the end point.
    taper: per end, thickness multiplier at that end (ramps to 1 across the end segment) —
           used for the thinned joins where an arch leaves a stem.
    w: constant thickness override (dots, hairline marks); ws: scale on the angle pen.
    slant: tan of the italic angle; the pen's stress axis leans by it (0 upright).
    """

    def __init__(self, segs, caps=('b', 'b'), taper=(1.0, 1.0), w=None, ws=1.0, closed=False, pen=None, slant=0.0):
        self.segs = segs
        self.slant = slant
        self.caps = caps
        self.taper = taper
        self.w = w
        self.ws = ws
        self.closed = closed
        self.pen = pen  # (V, H) override

    def transformed(self, f, slant=None):
        segs = [(s[0],) + tuple(f(p) for p in s[1:]) for s in self.segs]
        return Stroke(segs, self.caps, self.taper, self.w, self.ws, self.closed, self.pen, self.slant if slant is None else slant)


def pen_thickness(tangent, V, H, slant=0.0):
    """Full stem along the stress axis, hairline across it. Upright, the axis is vertical; in the
    italic it leans with the slant, so curves get their thick and thin parts where a drawn italic
    has them instead of where a sheared upright would put them."""
    ax = norm((slant, 1.0))
    s = abs(tangent[0] * ax[0] + tangent[1] * ax[1])
    return H + (V - H) * s**1.3


def _thick(stroke, i, t, tan, V, H):
    if stroke.w is not None:
        w = stroke.w
    else:
        pv, ph = stroke.pen if stroke.pen else (V, H)
        w = pen_thickness(tan, pv, ph, stroke.slant) * stroke.ws
    n = len(stroke.segs)
    if i == 0 and stroke.taper[0] != 1.0:
        w *= lerp(stroke.taper[0], 1.0, _ease(t, stroke.segs[i][0]))
    if i == n - 1 and stroke.taper[1] != 1.0:
        w *= lerp(stroke.taper[1], 1.0, _ease(1 - t, stroke.segs[i][0]))
    return w


def _ease(t, kind):
    if kind == 'L':
        return t  # linear keeps an offset line straight
    t = min(1.0, t * 1.6)
    return t * t * (3 - 2 * t)


def _fit_offset(seg, sign, stroke, i, V, H, q0=None, q3=None):
    """Offset one centerline segment to one side; returns a segment of the same kind."""

    def off(t):
        tan = seg_tangent(seg, t)
        w = _thick(stroke, i, t, tan, V, H)
        n = left_normal(tan)
        p = seg_point(seg, t)
        return (p[0] + sign * n[0] * w / 2, p[1] + sign * n[1] * w / 2)

    a = q0 if q0 is not None else off(0.0)
    d = q3 if q3 is not None else off(1.0)
    if seg[0] == 'L':
        return L(a, d)
    # End tangents come from the centerline, not the offset: on a tight inner curve the
    # offset's own derivative collapses toward the centre of curvature and flips, which is
    # what produced the little notches on heavy terminals.
    t0 = seg_tangent(seg, 0.0)
    t3 = seg_tangent(seg, 1.0)
    samples = [off(j / 16) for j in range(1, 16)]
    # chord-length parameterization
    pts = [a] + samples + [d]
    lens = [0.0]
    for j in range(1, len(pts)):
        lens.append(lens[-1] + math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]))
    total = lens[-1] or 1.0
    A11 = A12 = A22 = B1 = B2 = 0.0
    for j in range(1, len(pts) - 1):
        u = lens[j] / total
        b0, b1, b2, b3 = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u**3
        base = (a[0] * (b0 + b1) + d[0] * (b2 + b3), a[1] * (b0 + b1) + d[1] * (b2 + b3))
        r = sub(pts[j], base)
        c1 = mul(t0, b1)
        c2 = mul(t3, -b2)
        A11 += c1[0] * c1[0] + c1[1] * c1[1]
        A12 += c1[0] * c2[0] + c1[1] * c2[1]
        A22 += c2[0] * c2[0] + c2[1] * c2[1]
        B1 += c1[0] * r[0] + c1[1] * r[1]
        B2 += c2[0] * r[0] + c2[1] * r[1]
    det = A11 * A22 - A12 * A12
    chord = math.hypot(d[0] - a[0], d[1] - a[1])
    if abs(det) < 1e-9:
        al = be = chord / 3
    else:
        al = (B1 * A22 - B2 * A12) / det
        be = (A11 * B2 - A12 * B1) / det
    lo = chord * 0.05
    al = max(lo, al)
    be = max(lo, be)
    return C(a, add(a, mul(t0, al)), sub(d, mul(t3, be)), d)


def _node_offsets(stroke, sign, V, H):
    """Shared offset points at every node so adjacent segments meet exactly."""
    segs = stroke.segs
    nodes = []
    for i, s in enumerate(segs):
        tan = seg_tangent(s, 0.0)
        w = _thick(stroke, i, 0.0, tan, V, H)
        n = left_normal(tan)
        nodes.append((s[1][0] + sign * n[0] * w / 2, s[1][1] + sign * n[1] * w / 2))
    last = segs[-1]
    tan = seg_tangent(last, 1.0)
    w = _thick(stroke, len(segs) - 1, 1.0, tan, V, H)
    n = left_normal(tan)
    end = last[-1]
    nodes.append((end[0] + sign * n[0] * w / 2, end[1] + sign * n[1] * w / 2))
    return nodes


def _side(stroke, sign, V, H):
    nodes = _node_offsets(stroke, sign, V, H)
    return [_fit_offset(s, sign, stroke, i, V, H, nodes[i], nodes[i + 1]) for i, s in enumerate(stroke.segs)]


def _move_end(side, at_start, axis, value, limit):
    """Slide a side's first/last point along its end tangent until coordinate[axis] == value.

    The slide is clamped to `limit`, so a cut that would run far along a shallow tangent
    degrades into an angled cut instead of a spike.
    """
    s = side[0] if at_start else side[-1]
    p = s[1] if at_start else s[-1]
    if s[0] == 'L':
        tan = norm(sub(s[2], s[1]))
    else:
        tan = norm(sub(s[2], s[1])) if at_start else norm(sub(s[4], s[3]))
    if abs(tan[axis]) < 0.08:
        return side
    k = (value - p[axis]) / tan[axis]
    # Moving *into* the stroke: trim the curve at the cut line instead of dragging the end
    # point backwards past its own handle (which loops the outline).
    inward = k > 0 if at_start else k < 0
    if inward and s[0] == 'C':
        t = _cut_param(s, axis, value, at_start)
        if t is not None:
            a, b = split_cubic(s, t)
            side = list(side)
            if at_start:
                side[0] = b
            else:
                side[-1] = a
            return side
    k = max(-limit, min(limit, k))
    dv = mul(tan, k)
    if s[0] == 'L':
        ns = L(add(s[1], dv), s[2]) if at_start else L(s[1], add(s[2], dv))
    # extending: move only the end point along its own tangent; the handle stays put, so it
    # simply lengthens on the same line and the curve cannot fold back on itself
    elif at_start:
        ns = C(add(s[1], dv), s[2], s[3], s[4])
    else:
        ns = C(s[1], s[2], s[3], add(s[4], dv))
    side = list(side)
    if at_start:
        side[0] = ns
    else:
        side[-1] = ns
    return side


def _cut_param(s, axis, value, at_start):
    """Parameter where a cubic crosses coordinate[axis] == value, searched from the end being cut."""
    n = 64
    vals = [seg_point(s, j / n)[axis] - value for j in range(n + 1)]
    rng = range(n, 0, -1) if not at_start else range(0, n)
    for j in rng:
        a, b = (j - 1, j) if not at_start else (j, j + 1)
        if vals[a] == 0 or vals[a] * vals[b] < 0:
            lo, hi = a / n, b / n
            for _ in range(40):
                m = (lo + hi) / 2
                if (seg_point(s, m)[axis] - value) * vals[a] > 0:
                    lo = m
                else:
                    hi = m
            t = (lo + hi) / 2
            return t if 0.02 < t < 0.98 else None
    return None


def reverse_seg(s):
    return (s[0],) + tuple(reversed(s[1:]))


def expand(stroke, V, H):
    """Return a list of contours; a contour is a list of segments forming a closed loop."""
    left = _side(stroke, +1, V, H)
    right = _side(stroke, -1, V, H)
    if stroke.closed:
        outer, inner = (left, right) if abs(_area(left)) > abs(_area(right)) else (right, left)
        return [orient(outer, outer=True), orient(inner, outer=False)]
    start_c = stroke.segs[0][1]
    end_c = stroke.segs[-1][-1]
    n = len(stroke.segs)
    for at_start, cap, c in ((True, stroke.caps[0], start_c), (False, stroke.caps[1], end_c)):
        if cap in ('h', 'v'):
            seg = stroke.segs[0] if at_start else stroke.segs[-1]
            t = 0.0 if at_start else 1.0
            tan = seg_tangent(seg, t)
            axis = 1 if cap == 'h' else 0
            # a horizontal cut across a near-horizontal stroke is a sliver: cut the other way
            if abs(tan[axis]) < 0.45:
                axis = 1 - axis
            limit = _thick(stroke, 0 if at_start else n - 1, t, tan, V, H) * 0.6
            left = _move_end(left, at_start, axis, c[axis], limit)
            right = _move_end(right, at_start, axis, c[axis], limit)
    contour = list(left)
    contour.append(L(left[-1][-1], right[-1][-1]))
    contour += [reverse_seg(s) for s in reversed(right)]
    contour.append(L(right[0][1], left[0][1]))
    return [orient(contour, outer=True)]


def _area(contour):
    """Signed area (y-up: positive = counter-clockwise), using sampled curves."""
    pts = []
    for s in contour:
        if s[0] == 'L':
            pts.append(s[1])
        else:
            for j in range(8):
                pts.append(seg_point(s, j / 8))
    a = 0.0
    for j in range(len(pts)):
        x0, y0 = pts[j]
        x1, y1 = pts[(j + 1) % len(pts)]
        a += x0 * y1 - x1 * y0
    return a / 2


def reverse_contour(contour):
    return [reverse_seg(s) for s in reversed(contour)]


def orient(contour, outer):
    """TrueType convention: outer contours clockwise (negative area in y-up), counters CCW."""
    a = _area(contour)
    if (outer and a > 0) or (not outer and a < 0):
        return reverse_contour(contour)
    return contour


def contour_bounds(contour):
    xs, ys = [], []
    for s in contour:
        for j in range(9) if s[0] == 'C' else (0, 8):
            p = seg_point(s, j / 8)
            xs.append(p[0])
            ys.append(p[1])
    return min(xs), min(ys), max(xs), max(ys)


def transform_contour(contour, f):
    return [(s[0],) + tuple(f(p) for p in s[1:]) for s in contour]


def flatten(contour, steps=12):
    pts = []
    for s in contour:
        if s[0] == 'L':
            pts.append(s[1])
        else:
            for j in range(steps):
                pts.append(seg_point(s, j / steps))
    return pts

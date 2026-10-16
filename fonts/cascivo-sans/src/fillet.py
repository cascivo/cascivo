"""Round the pointed tips of a counter where two strokes cross.

A stroke's inner edge folds when the stroke is wider than twice its centreline's radius, and the s's
counters, the a's mouth and the æ's a-half all end where such an edge meets a neighbouring stroke at about
90 degrees. Inter's end in a round. Moving the strokes cannot fix that (the radius is set by the letter's
proportions), so a small patch is added: a fillet arc tangent to both edges, closed by two lines that run
deep into the ink, so it never shows beyond the arc.

The patch is worked out from the finished outlines of the two strokes (upright or italic), so it fits
whatever the pen did. Its structure is always one cubic and two lines, which keeps every master compatible.
"""

import math

from geom import _area, flatten, reverse_contour, seg_point


def _poly(contour, steps=48):
    return flatten(contour, steps)


def _winding(pt, poly):
    x, y = pt
    wn = 0
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % n]
        if (y0 <= y) != (y1 <= y):
            t = (y - y0) / (y1 - y0)
            if x0 + t * (x1 - x0) > x:
                wn += 1 if y1 > y0 else -1
    return wn


def _cum(poly):
    cum = [0.0]
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        cum.append(cum[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return cum


def _at(poly, cum, s):
    """Point and unit tangent (direction of increasing s) at arclength s, wrapping."""
    total = cum[-1]
    s %= total
    lo, hi = 0, len(cum) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if cum[mid] <= s:
            lo = mid
        else:
            hi = mid
    a, b = poly[lo], poly[(lo + 1) % len(poly)]
    seg = max(cum[lo + 1] - cum[lo], 1e-9)
    t = (s - cum[lo]) / seg
    tx, ty = (b[0] - a[0]) / seg, (b[1] - a[1]) / seg
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), (tx, ty)


def _crossings(pa, ca, pb, cb):
    """[(point, sA, sB)] where the closed polylines cross."""
    out = []
    na, nb = len(pa), len(pb)
    for i in range(na):
        p, q = pa[i], pa[(i + 1) % na]
        for j in range(nb):
            r, s = pb[j], pb[(j + 1) % nb]
            d1 = (q[0] - p[0], q[1] - p[1])
            d2 = (s[0] - r[0], s[1] - r[1])
            den = d1[0] * d2[1] - d1[1] * d2[0]
            if abs(den) < 1e-12:
                continue
            u = ((r[0] - p[0]) * d2[1] - (r[1] - p[1]) * d2[0]) / den
            v = ((r[0] - p[0]) * d1[1] - (r[1] - p[1]) * d1[0]) / den
            if 0 <= u <= 1 and 0 <= v <= 1:
                pt = (p[0] + d1[0] * u, p[1] + d1[1] * u)
                out.append((pt, ca[i] + u * (ca[i + 1] - ca[i]), cb[j] + v * (cb[j + 1] - cb[j])))
    return out


def _visible(poly, other, near, span):
    """Points of `poly` within `span` of `near` that are not buried in `other`'s ink: the edge that shows."""
    # dense, so the nearest point is accurate to a tenth of a unit
    out = []
    n = len(poly)
    for i in range(n):
        p, q = poly[i], poly[(i + 1) % n]
        k = max(1, int(math.dist(p, q) / 0.5))
        for j in range(k):
            pt = (p[0] + (q[0] - p[0]) * j / k, p[1] + (q[1] - p[1]) * j / k)
            if math.dist(pt, near) <= span and _winding(pt, other) == 0:
                out.append(pt)
    return out


def _nearest(pts, c):
    best = min(pts, key=lambda q: (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2)
    return best, math.dist(best, c)


def _solve(contour_a, contour_b, near, r, reach=80.0):
    """(t1, t2, tip): the tangent points of the circle of radius r that fits the white wedge where the two contours cross
    nearest `near`, and the tip itself; None when they do not cross within `reach`."""
    pa, pb = _poly(contour_a), _poly(contour_b)
    ca, cb = _cum(pa), _cum(pb)
    cands = [c for c in _crossings(pa, ca, pb, cb) if math.dist(c[0], near) <= reach]
    if not cands:
        return None
    tip = min(cands, key=lambda c: math.dist(c[0], near))[0]
    span = 3.0 * r
    ea, eb = _visible(pa, pb, tip, span), _visible(pb, pa, tip, span)
    if not ea or not eb:
        return None
    # start the circle's centre inside the wedge: on the bisector of the two edges as they leave the tip
    va = _nearest_at(ea, tip, r)
    vb = _nearest_at(eb, tip, r)
    bis = (va[0] + vb[0], va[1] + vb[1])
    bl = math.hypot(*bis) or 1.0
    c = (tip[0] + bis[0] / bl * r, tip[1] + bis[1] / bl * r)
    for _ in range(60):
        qa, da = _nearest(ea, c)
        qb, db = _nearest(eb, c)
        ua = ((c[0] - qa[0]) / max(da, 1e-9), (c[1] - qa[1]) / max(da, 1e-9))
        ub = ((c[0] - qb[0]) / max(db, 1e-9), (c[1] - qb[1]) / max(db, 1e-9))
        c = (c[0] + 0.5 * ((r - da) * ua[0] + (r - db) * ub[0]), c[1] + 0.5 * ((r - da) * ua[1] + (r - db) * ub[1]))
    t1, _ = _nearest(ea, c)
    t2, _ = _nearest(eb, c)
    return t1, t2, tip


def _walk(contour, j, s):
    """The point and the unit tangent (in the contour's direction) at arclength `s` from the start of segment j, walking on
    round the closed contour in its direction when s > 0 and against it when s < 0."""
    n = len(contour)
    steps = 64

    def seg_pts(i):
        return [seg_point(contour[i % n], k / steps) for k in range(steps + 1)]

    def seg_len(pts):
        return sum(math.dist(pts[k], pts[k + 1]) for k in range(steps))

    i = j % n
    pts = seg_pts(i)
    if s >= 0:
        while s > seg_len(pts) and n:
            s -= seg_len(pts)
            i = (i + 1) % n
            pts = seg_pts(i)
        run = 0.0
        for k in range(steps):
            d = math.dist(pts[k], pts[k + 1])
            if run + d >= s:
                u = (s - run) / d if d else 0.0
                p = (pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u)
                return p, ((pts[k + 1][0] - pts[k][0]) / d, (pts[k + 1][1] - pts[k][1]) / d)
            run += d
        return pts[-1], (0.0, 0.0)
    s = -s
    i = (i - 1) % n
    pts = seg_pts(i)
    while s > seg_len(pts):
        s -= seg_len(pts)
        i = (i - 1) % n
        pts = seg_pts(i)
    run = 0.0
    for k in range(steps, 0, -1):
        d = math.dist(pts[k], pts[k - 1])
        if run + d >= s:
            u = (s - run) / d if d else 0.0
            p = (pts[k][0] + (pts[k - 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k - 1][1] - pts[k][1]) * u)
            return p, ((pts[k][0] - pts[k - 1][0]) / d, (pts[k][1] - pts[k - 1][1]) / d)
        run += d
    return pts[0], (0.0, 0.0)


def _anchor(contour, pt):
    """(j, s): the vertex j (a segment's start) nearest `pt` along the contour, and the signed arclength from it to `pt`."""
    n = len(contour)
    steps = 64
    best = None
    total = 0.0
    starts = []
    for i, sg in enumerate(contour):
        starts.append(total)
        prev = seg_point(sg, 0.0)
        for k in range(1, steps + 1):
            q = seg_point(sg, k / steps)
            d = math.dist(prev, q)
            # nearest point on this little chord
            vx, vy = q[0] - prev[0], q[1] - prev[1]
            u = 0.0 if d == 0 else max(0.0, min(1.0, ((pt[0] - prev[0]) * vx + (pt[1] - prev[1]) * vy) / (d * d)))
            c = (prev[0] + vx * u, prev[1] + vy * u)
            dd = math.dist(c, pt)
            if best is None or dd < best[0]:
                best = (dd, total + d * u)
            total += d
            prev = q
    starts.append(total)
    spos = best[1]
    # the vertex nearest in arclength, either way round the closed contour
    cands = []
    for j in range(n):
        for wrap in (-total, 0.0, total):
            cands.append((abs(spos - (starts[j] + wrap)), j, spos - (starts[j] + wrap)))
    _, j, s = min(cands)
    return j, s


def reference(contour_a, contour_b, near, r, unit):
    """Where the fillet's tangent points sit on the two edges, as a vertex of each contour (a segment's start, which every
    master has) and an arclength from it in units of `unit` (the stem), plus the sign of the direction toward the tip: read once,
    on the master where the tip is a real point (Black), and used by every master. A tangent point found afresh in each
    master slid along the edge between masters, and at the weights in between the patch fell several units off it. A point
    a short way from a vertex stays on the edge as the masters interpolate."""
    sol = _solve(contour_a, contour_b, near, r)
    if sol is None:
        return None
    t1, t2, tip = sol
    out = []
    for contour, pt in ((contour_a, t1), (contour_b, t2)):
        j, s = _anchor(contour, pt)
        _, d = _walk(contour, j, s)
        v = (tip[0] - pt[0], tip[1] - pt[1])
        out.append((j, s / unit, 1.0 if d[0] * v[0] + d[1] * v[1] >= 0 else -1.0))
    # which way round the patch runs, so that it adds ink: fixed here, because the sign of a nearly flat patch could flip in
    # another master and break its compatibility
    # the tip itself, as a point on the second edge: the lines close the patch there, pushed a little into the ink
    j, s = _anchor(contour_b, tip)
    out.append((j, s / unit))
    return (*out, _area(patch(contour_a, contour_b, (*out, False), unit)) > 0)


def patch(contour_a, contour_b, ref, unit, lam=1.0):
    """The patch contour for the tangent points `ref` (see `reference`): a cubic from the first point to the second, tangent to
    both edges (leaving along the first toward the tip, arriving along the second away from it), closed by two lines that
    go to the tip, on the second edge, and a little past it into the ink."""
    pts = []
    flip = ref[3]
    for contour, (j, s, sg) in zip((contour_a, contour_b), ref[:2]):
        p, d = _walk(contour, j, s * unit)
        pts.append((p, (d[0] * sg, d[1] * sg)))
    (t1, u1), (t2, u2) = pts
    u2 = (-u2[0], -u2[1])  # at t2 the edge is followed from the tip outward: arrive along the direction away from it
    chord = math.dist(t1, t2) or 1e-6
    beta = math.acos(max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1])))
    # handles: those of a circular arc through both points with these tangents, which tends to a third of the chord for a
    # straight edge
    k = chord * (4.0 / 3.0 * math.tan(beta / 4.0) / (2.0 * math.sin(beta / 2.0)) if beta > 1e-3 else 1.0 / 3.0)
    arc = ('C', t1, (t1[0] + u1[0] * k, t1[1] + u1[1] * k), (t2[0] - u2[0] * k, t2[1] - u2[1] * k), t2)
    # The lines run on along the tangents, to where they meet and a little past it into the ink. A line to a point deep in the
    # stroke would cut across it at the weights between the masters, and one hugging the edge leaves a hairline of white
    # between it and the edge (the edge bulges away from its chord).
    mid = ((t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2)
    cross = u1[0] * u2[1] - u1[1] * u2[0]
    if abs(cross) > 0.1:
        a_ = ((t2[0] - t1[0]) * u2[1] - (t2[1] - t1[1]) * u2[0]) / cross
        x = (t1[0] + u1[0] * a_, t1[1] + u1[1] * a_)
    else:
        x = (mid[0] + (u1[0] - u2[0]) * chord / 4, mid[1] + (u1[1] - u2[1]) * chord / 4)
    ax, ay = x[0] - mid[0], x[1] - mid[1]
    al = math.hypot(ax, ay) or 1.0
    push = unit * 0.35  # deep enough to lie inside a stroke whatever its weight
    apex = (x[0] + ax / al * push, x[1] + ay / al * push)
    if lam != 1.0:  # shrunk toward the apex, deeper into the ink
        shrink = lambda q: (apex[0] + lam * (q[0] - apex[0]), apex[1] + lam * (q[1] - apex[1]))  # noqa: E731
        arc = ('C',) + tuple(shrink(q) for q in arc[1:])
        t1, t2 = shrink(t1), shrink(t2)
    out = [arc, ('L', t2, apex), ('L', apex, t1)]
    return reverse_contour(out) if flip else out


def _nearest_at(pts, tip, dist):
    """Unit vector from `tip` to the visible edge point at about `dist` from it."""
    q = min(pts, key=lambda p: abs(math.dist(p, tip) - dist))
    d = math.dist(q, tip) or 1.0
    return ((q[0] - tip[0]) / d, (q[1] - tip[1]) / d)

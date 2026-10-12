"""Trace a script's centre lines from Noto Sans: `georgian_paths.py` from Noto Sans Georgian,
`armenian_paths.py` from Noto Sans Armenian, with each one's kerning.

Each letter of the Thin weight is rasterized and skeletonized; the skeleton is split into strokes
at its junctions (joining the pairs that run on smoothly), and each stroke is fitted with cubics.
The same points are then moved onto the Black weight's centre line, so the heavy masters follow
Noto's Black, which opens its bowls rather than lightening its stems, each stroke only as far as
this font's pen still draws it cleanly. Capitals are traced the same way. Sidebearings come from
the Regular and Black weights. Not part of the build, and its dependencies are not in
requirements.txt:

    pip install scikit-image skia-pathops
    python3 -I src/trace_noto.py georgian NotoSansGeorgian-{Thin,Regular,Black}.ttf
    python3 -I src/trace_noto.py armenian NotoSansArmenian-{Thin,Regular,Black}.ttf

(the fontsource woff2 files of `@fontsource/noto-sans-georgian` and `-armenian` 5.x work as well).
"""
import json
import math
import os
import sys

import numpy as np
import pathops
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # the build's modules, for the lint

SC = 2  # raster pixels per font unit
PAD = 40
JOIN_TRIM = 40  # font units cut from an end at a junction, where the skeleton bends
END_TRIM = 18  # font units cut from each open end, and put back along the tangent
BEND_TRIM = 24  # font units cut from each side of a rounded-off bend, and put back the same way
TRIM = 24  # px either side of a joined junction
Y0, Y1 = -300, 820


class PolyPen(BasePen):
    def __init__(self, gs):
        super().__init__(gs)
        self.polys, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, a, b, c):
        p0 = self.cur[-1]
        for i in range(1, 17):
            t = i / 16
            mt = 1 - t
            self.cur.append(tuple(mt**3 * p0[k] + 3 * mt * mt * t * a[k] + 3 * mt * t * t * b[k] + t**3 * c[k] for k in (0, 1)))

    def _qCurveToOne(self, a, b):
        p0 = self.cur[-1]
        for i in range(1, 17):
            t = i / 16
            mt = 1 - t
            self.cur.append(tuple(mt * mt * p0[k] + 2 * mt * t * a[k] + t * t * b[k] for k in (0, 1)))

    def _closePath(self):
        self.polys.append(self.cur)
        self.cur = []


def raster(gs, name):
    # contours unioned first: Noto Sans Armenian overlaps its strokes, and an even-odd fill of
    # overlapping contours punches holes the skeleton then runs round
    path = pathops.Path()
    gs[name].draw(path.getPen())
    path.simplify(fix_winding=True)
    pen = PolyPen(gs)
    path.draw(pen)
    w = int((gs[name].width + 2 * PAD) * SC)
    h = int((Y1 - Y0) * SC)
    # even-odd fill via XOR of each contour
    acc = np.zeros((h, w), bool)
    for poly in pen.polys:
        im = Image.new('1', (w, h), 0)
        ImageDraw.Draw(im).polygon([((x + PAD) * SC, (Y1 - y) * SC) for x, y in poly], fill=1)
        acc ^= np.array(im, bool)
    return acc


def to_font(px):
    r, c = px
    return (c / SC - PAD, Y1 - r / SC)


NB = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def graph(sk):
    pts = set(zip(*np.nonzero(sk)))
    nbr = {p: [(p[0] + dr, p[1] + dc) for dr, dc in NB if (p[0] + dr, p[1] + dc) in pts] for p in pts}
    return pts, nbr


def edges(pts, nbr):
    nodes = {p for p in pts if len(nbr[p]) != 2}
    seen = set()
    out = []
    for n in nodes:
        for q in nbr[n]:
            if (n, q) in seen:
                continue
            path = [n, q]
            seen.add((n, q))
            prev, cur = n, q
            while cur not in nodes:
                nxt = [x for x in nbr[cur] if x != prev]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]
                path.append(cur)
            seen.add((path[-1], path[-2]))
            out.append(path)
    # pure cycles (no nodes)
    rest = {p for p in pts if p not in nodes} - {p for e in out for p in e}
    while rest:
        s = rest.pop()
        path = [s]
        prev, cur = None, s
        while True:
            nxt = [x for x in nbr[cur] if x != prev and x != s or (x == s and len(path) > 2)]
            nxt = [x for x in nxt if x in rest or x == s]
            if not nxt:
                break
            if s in nxt and len(path) > 2:
                path.append(s)
                break
            prev, cur = cur, nxt[0]
            rest.discard(cur)
            path.append(cur)
        out.append(path)
    return out


def length(path):
    return sum(math.dist(path[i], path[i + 1]) for i in range(len(path) - 1))


def merge_junctions(paths, prune):
    """Drop short spurs: a path with one free end whose other end meets other paths."""
    while True:
        ends = {}
        for pth in paths:
            for q in (pth[0], pth[-1]):
                ends[q] = ends.get(q, 0) + 1

        def deg(q):  # ends within 3 px, so a junction cluster counts as one
            return sum(n for e, n in ends.items() if math.dist(e, q) <= 3)

        spur = next((i for i, pth in enumerate(paths) if length(pth) < prune and sorted((deg(pth[0]), deg(pth[-1]))) [0] == 1 and max(deg(pth[0]), deg(pth[-1])) >= 3), None)
        if spur is None:
            return paths
        paths.pop(spur)


def direction(path, k, n=12):
    pth = path if k == 0 else path[::-1]
    a, b = pth[0], pth[min(n, len(pth) - 1)]
    return (b[0] - a[0], b[1] - a[1])


def crosses(a, ka, b, kb):
    """Would joining these make a path that crosses itself? A pen cannot draw that as one
    clean outline, so the two stay separate strokes."""
    a = a if ka == -1 else a[::-1]
    b = b if kb == 0 else b[::-1]
    pa = np.array(a[: max(1, len(a) - 12)], float)
    pb = np.array(b[12:], float)
    if not len(pa) or not len(pb):
        return False
    d = np.sqrt(((pa[:, None, :] - pb[None, :, :]) ** 2).sum(-1))
    return bool((d < 2).any())


def join(paths, near=6):
    """Join paths meeting at a common end (within `near` px) where they continue smoothly."""
    while True:
        best = None
        for i in range(len(paths)):
            for j in range(len(paths)):
                if i >= j:
                    continue
                for ki in (0, -1):
                    for kj in (0, -1):
                        if math.dist(paths[i][ki], paths[j][kj]) > near:
                            continue
                        # how many other ends meet here
                        di, dj = direction(paths[i], ki), direction(paths[j], kj)
                        cos = -(di[0] * dj[0] + di[1] * dj[1]) / (math.hypot(*di) * math.hypot(*dj) + 1e-9)
                        if cos > 0.5 and (best is None or cos > best[0]) and not crosses(paths[i], ki, paths[j], kj):
                            best = (cos, i, ki, j, kj)
        if best is None:
            return paths
        _, i, ki, j, kj = best
        a = paths[i] if ki == -1 else paths[i][::-1]
        b = paths[j] if kj == 0 else paths[j][::-1]
        # a skeleton wobbles where it passes a junction: bridge it with the fit instead
        trim = min(TRIM, len(a) // 4, len(b) // 4)
        merged = a[: len(a) - trim] + b[trim:]
        paths = [p for n, p in enumerate(paths) if n not in (i, j)] + [merged]


def smooth(pts, k=5):
    arr = np.array(pts, float)
    closed = len(pts) > 3 and math.dist(pts[0], pts[-1]) < 2
    out = arr.copy()
    for i in range(len(arr)):
        lo, hi = i - k, i + k + 1
        if closed:
            idx = [(j % (len(arr) - 1)) for j in range(lo, hi)]
        else:
            idx = list(range(max(0, lo), min(len(arr), hi)))
        out[i] = arr[idx].mean(0)
    if not closed:
        out[0], out[-1] = arr[0], arr[-1]
    return out


# --- Schneider cubic fitting --------------------------------------------------------------------


def bez(c, t):
    mt = 1 - t
    return mt**3 * c[0] + 3 * mt * mt * t * c[1] + 3 * mt * t * t * c[2] + t**3 * c[3]


def chord_params(p):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))]
    return d / d[-1]


def fit_one(p, t, t1, t2):
    a1 = np.outer(3 * t * (1 - t) ** 2, t1)
    a2 = np.outer(3 * t * t * (1 - t), t2)
    c11, c12, c22 = (a1 * a1).sum(), (a1 * a2).sum(), (a2 * a2).sum()
    tmp = p - np.outer((1 - t) ** 3 + 3 * t * (1 - t) ** 2, p[0]) - np.outer(3 * t * t * (1 - t) + t**3, p[-1])
    x1, x2 = (a1 * tmp).sum(), (a2 * tmp).sum()
    det = c11 * c22 - c12 * c12
    seg = np.linalg.norm(p[-1] - p[0])
    if abs(det) < 1e-9:
        al = ar = seg / 3
    else:
        al = (x1 * c22 - x2 * c12) / det
        ar = (c11 * x2 - c12 * x1) / det
    if al < seg * 1e-3 or ar < seg * 1e-3:
        al = ar = seg / 3
    return np.array([p[0], p[0] + t1 * al, p[-1] + t2 * ar, p[-1]])


def fit(p, t1, t2, tol, depth=0):
    t = chord_params(p)
    c = fit_one(p, t, t1, t2)
    for _ in range(4):  # reparameterize
        c = fit_one(p, t, t1, t2)
        errs = np.linalg.norm(np.array([bez(c, x) for x in t]) - p, axis=1)
    errs = np.linalg.norm(np.array([bez(c, x) for x in t]) - p, axis=1)
    if errs.max() <= tol or len(p) < 8 or depth > 6:
        return [c]
    k = int(np.argmax(errs))
    k = min(max(k, 3), len(p) - 4)
    tm = p[k + 1] - p[k - 1]
    tm = tm / (np.linalg.norm(tm) + 1e-9)
    return fit(p[: k + 1], t1, -tm, tol, depth + 1) + fit(p[k:], tm, t2, tol, depth + 1)


def tangent(p, at_start, n=8):
    if at_start:
        v = p[min(n, len(p) - 1)] - p[0]
    else:
        v = p[-1 - min(n, len(p) - 1)] - p[-1]
    return v / (np.linalg.norm(v) + 1e-9)


def split_self(f, touch=16, apart=80):
    """A path whose end comes back to its own middle (a bowl closing on its stem) cannot be one
    clean outline: split it there, so the bowl becomes a closed loop and the stem a stroke."""
    arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(f, axis=0), axis=1))]
    if math.dist(f[0], f[-1]) < 3:
        return [f]
    for end in (len(f) - 1, 0):
        d = np.linalg.norm(f - f[end], axis=1)
        far = np.abs(arc - arc[end]) > apart
        hit = np.nonzero(far & (d < touch))[0]
        if len(hit):
            m = hit[np.argmin(d[hit])]
            if end:
                return [f[: m + 1], np.vstack([f[m:], f[m : m + 1]])]
            return [np.vstack([f[m : m + 1], f[: m + 1]]), f[m:]]
    # a path that crosses itself in the middle (Ჩ's loop over its tail): the loop between the two
    # passes becomes closed, and the parts before and after it strokes of their own
    sub = f[::4]
    sa = arc[::4]
    d = np.linalg.norm(sub[:, None, :] - sub[None, :, :], axis=2)
    far = (sa[None, :] - sa[:, None]) > apart
    hit = np.argwhere(far & (d < touch / 2))
    if len(hit):
        i, j = hit[np.argmin(d[hit[:, 0], hit[:, 1]])] * 4
        return [f[: i + 1], np.vstack([f[i : j + 1], f[i : i + 1]]), f[j:]]
    return [f]


def _corner(piece, w=8, reach=40, bend=0.55):
    """Where a closed loop turns by more than about 100 degrees, if anywhere; failing that, where
    it bends by more than about 55 degrees within `reach` units either side (Գ's bowl where it
    meets the stem, Ծ's peak under its crossbar, which the skeleton rounds off)."""
    ring = piece[:-1]
    v1 = ring - np.roll(ring, w, axis=0)
    v2 = np.roll(ring, -w, axis=0) - ring
    cos = (v1 * v2).sum(1) / (np.linalg.norm(v1, axis=1) * np.linalg.norm(v2, axis=1) + 1e-9)
    if cos.min() < -0.2:
        return int(np.argmin(cos))
    step = np.linalg.norm(np.diff(piece, axis=0), axis=1).mean()
    n = max(w, int(reach / step))
    if 2 * n >= len(ring):
        return None
    v1 = ring - np.roll(ring, n, axis=0)
    v2 = np.roll(ring, -n, axis=0) - ring
    cos = (v1 * v2).sum(1) / (np.linalg.norm(v1, axis=1) * np.linalg.norm(v2, axis=1) + 1e-9)
    return int(np.argmin(cos)) if cos.min() < bend else None


def _open_corners(piece, reach=60, margin=45, apart=60):
    """Where an open stroke turns by more than 60 degrees within `reach` units either side (a bend
    tighter than the Black pen's half width, which its inner side folds round),
    away from its ends: the sample indices, in order."""
    arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(piece, axis=0), axis=1))]
    back = np.searchsorted(arc, arc - reach).clip(0, len(piece) - 1)
    fwd = np.searchsorted(arc, arc + reach).clip(0, len(piece) - 1)
    v1, v2 = piece - piece[back], piece[fwd] - piece
    cos = (v1 * v2).sum(1) / (np.linalg.norm(v1, axis=1) * np.linalg.norm(v2, axis=1) + 1e-9)
    cos[(arc < margin) | (arc > arc[-1] - margin)] = 1
    cuts = []
    for i in np.argsort(cos):
        if cos[i] >= 0.5:
            break
        if all(abs(arc[i] - arc[j]) > apart for j in cuts):
            cuts.append(int(i))
    return sorted(cuts)


def trace(gs, name, prune=30, tol=8):
    sk = skeletonize(raster(gs, name))
    pts, nbr = graph(sk)
    paths = edges(pts, nbr)
    paths = [p for p in paths if len(p) > 1]
    paths = merge_junctions(paths, prune * SC)
    paths = join(paths)
    pieces = []
    for pth in paths:
        if length(pth) < prune * SC * 0.6:
            continue
        f = np.array([to_font(q) for q in pth])
        f = smooth(f, 12)
        for piece in split_self(f):
            closed = math.dist(piece[0], piece[-1]) < 90 and length(piece) > 250  # a loop whose ends meet or cross (ზ's) is closed
            if not closed and math.dist(piece[0], piece[-1]) < 3:
                continue  # a knot the skeleton ties where strokes cross (Ջ's): no stroke at all
            if closed and math.dist(piece[0], piece[-1]) >= 3:
                piece = np.vstack([piece, piece[:1]])
            if closed:
                piece[-1] = piece[0]
            corner = _corner(piece) if closed else None
            if corner is not None:
                # a pen folds inside a closed loop's corner (Ჩ's bowl, where it dips into the stem):
                # draw it as two halves that meet at the corner instead
                # (or more pieces, where the loop has other corners: Ճ's peak)
                ring = piece[:-1]
                ring = np.vstack([ring[corner:], ring[: corner + 1]])
                cuts = _open_corners(ring)
                at = 'bend' if cuts else True  # halved where it runs smoothly, the halves meet exactly
                cuts = cuts or [len(ring) // 2]
                for i, (a, b) in enumerate(zip([0] + cuts, cuts + [len(ring) - 1])):
                    pieces.append((False, ring[a : b + 1], (True if i == 0 else at, True if b == len(ring) - 1 else at)))
                continue
            if closed:
                pieces.append((closed, piece, (False, False)))
                continue
            # a pen folds round a sharp corner in an open stroke too (Լ's foot, Ն's shoulder):
            # split it there, the halves meeting at the corner
            cuts = _open_corners(piece)
            arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(piece, axis=0), axis=1))]
            if not cuts and math.dist(piece[0], piece[-1]) < 150 and arc[-1] > 600:
                # a loop whose two ends come back to the same place (Ց's bowl, both ends on the
                # bar) folds where its ends overlap: halve it, so each half is its own stroke
                cuts = [int(np.searchsorted(arc, arc[-1] / 2))]
            for i, (a, b) in enumerate(zip([0] + cuts, cuts + [len(piece) - 1])):
                pieces.append((False, piece[a : b + 1], ('bend' if i > 0 else False, 'bend' if b != len(piece) - 1 else False)))

    # where two loops cross (ზ's waist) the skeleton leaves a short piece between them: the
    # closed loops already cover it
    loops = [pc for c, pc, _ in pieces if c]
    pieces = [(c, pc, cn) for c, pc, cn in pieces if c or length(pc) > 120 or not all(any(np.linalg.norm(lp - pc[e], axis=1).min() < 15 for lp in loops) for e in (0, -1))]

    def kind(k, end):
        """'join' if this end lands on another stroke, else 'free' (a split loop's corner is 'corner')."""
        q = pieces[k][1][end]
        near = any(np.linalg.norm(pc - q, axis=1).min() < 20 for j, (_, pc, _) in enumerate(pieces) if j != k)
        return 'join' if near else 'free'

    strokes = []
    for k, (closed, piece, corners) in enumerate(pieces):
        ends = ['', '']
        if closed:  # start as far as possible from any other stroke, with one tangent through the seam
            arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(piece, axis=0), axis=1))]
            keep = (arc > 20) & (arc < arc[-1] - 20)  # the seam is where a split doubled back
            piece = np.vstack([piece[keep], piece[keep][:1]])
            others = [pc for j, (_, pc, _) in enumerate(pieces) if j != k]
            if others:
                rest = np.vstack(others)
                i = int(np.argmax([np.linalg.norm(rest - q, axis=1).min() for q in piece[:-1]]))
            else:
                i = int(np.argmin(piece[:-1, 1]))
            piece = np.vstack([piece[i:-1], piece[: i + 1]])
            tn = piece[min(8, len(piece) - 1)] - piece[-1 - min(8, len(piece) - 1)]
            tn = tn / (np.linalg.norm(tn) + 1e-9)
            cs = fit(piece, tn, -tn, tol)
            trims = [0, 0]
        else:
            ends = ['corner' if corners[0] else kind(k, 0), 'corner' if corners[1] else kind(k, -1)]
            arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(piece, axis=0), axis=1))]
            # a skeleton forks at a blunt end and bends into a junction: cut both back (more at a
            # junction), and the generator runs the end on along the cut's tangent
            # a loop's corner is exact; a bend the skeleton rounds off is cut back like an end, and
            # the halves run on along their tangents into the corner the reference draws
            trims = [JOIN_TRIM if e == 'join' else BEND_TRIM if c == 'bend' else 0 if e == 'corner' else END_TRIM for e, c in zip(ends, corners)]
            if arc[-1] > 2 * sum(trims) + 20:
                piece = piece[(arc >= trims[0]) & (arc <= arc[-1] - trims[1])]
            else:
                trims = [0, 0]
            short = arc[-1] < 260  # a stub or half a crossbar is one curve: a heavy pen folds on more
            cs = fit(piece, tangent(piece, True), tangent(piece, False), 40 if short else tol)
        strokes.append({'closed': bool(closed), 'ends': ends, 'trims': trims, 'cubics': [[[round(float(v), 1) for v in pt] for pt in c] for c in cs]})
    return strokes


EXT = 12.5  # the thin reference's half stroke: a skeleton stops this short of the ink
HEADER = '''"""{name} centre lines, generated by `trace_noto.py {key}` from Noto Sans {name} (SIL OFL 1.1;
{copyright}). Do not edit by hand: re-run the tracer.

Each letter: (left and right sidebearing, each as Noto's Regular and Black space it; 'x', 'c' or
'a' for the letter's height; strokes). A stroke is (closed; each end's kind: 'free', 'join' where it
runs into another stroke, or 'corner' where a cornered loop was split; the Thin centre line; the
same points moved toward Noto Black's centre line, as far as this font's pen draws them cleanly;
that pen's weight at Black, 1 but where even the Thin centre line folds under the full pen; a heavy
terminal's cut, 'n' square or 'h' turned toward flat where a square end folds). A centre line is
flat points: the start point, then each cubic's two handles and end point, in the reference's
units. `REF` holds each reference's levels, its lines and its unit letter's width, which
traced.py maps onto this font's metrics.
"""

'''


def skeleton_points(ink):
    return np.array([to_font(q) for q in zip(*np.nonzero(skeletonize(ink)))])


def onto(points, skel):
    """The nearest point of a skeleton to each point."""
    d = ((points[:, None, :] - skel[None, :, :]) ** 2).sum(-1)
    return skel[d.argmin(1)]


def across(ink, q, n, reach=160, widest=260):
    """The middle of the ink crossed along the normal `n` through `q`, or None where that crossing
    is wider than a stroke (a junction) or finds no ink."""
    ts = np.arange(-reach, reach + 0.5, 0.5)
    xs = ((q[0] + n[0] * ts + PAD) * SC).round().astype(int)
    ys = ((Y1 - (q[1] + n[1] * ts)) * SC).round().astype(int)
    ok = (xs >= 0) & (xs < ink.shape[1]) & (ys >= 0) & (ys < ink.shape[0])
    on = np.zeros(len(ts), bool)
    on[ok] = ink[ys[ok], xs[ok]]
    if not on.any():
        return None
    runs = np.diff(np.r_[0, on.astype(int), 0])
    starts, stops = np.nonzero(runs == 1)[0], np.nonzero(runs == -1)[0] - 1
    k = int(np.argmin([0 if a <= len(ts) // 2 <= b else min(abs(a - len(ts) // 2), abs(b - len(ts) // 2)) for a, b in zip(starts, stops)]))
    a, b = ts[starts[k]], ts[stops[k]]
    if b - a > widest:
        return None
    return q + n * (a + b) / 2


def to_black(cs, ends, ink, skel, closed=False, n=24):
    """The same cubics moved onto Noto Black's centre line. Each cubic is sampled; each sample moves
    to the middle of the Black stroke across it. Where a crossing finds no clean stroke (an end
    past the ink, a junction) the sample takes its nearest clean neighbour's move. The moves are
    smoothed along the stroke and deform the Thin cubics, so the structure stays the Thin's."""
    ts = np.linspace(0, 1, n)
    samples, normals = [], []
    for c in cs:
        for t in ts:
            samples.append(bez(c, t))
            mt = 1 - t
            d = 3 * mt * mt * (c[1] - c[0]) + 6 * mt * t * (c[2] - c[1]) + 3 * t * t * (c[3] - c[2])
            d = d / (np.linalg.norm(d) + 1e-9)
            normals.append(np.array([-d[1], d[0]]))
    samples = np.array(samples)
    move = [None if (m := across(ink, q, nv)) is None else m - q for q, nv in zip(samples, normals)]
    found = [m for m in move if m is not None]
    if found:  # a crossing that caught the other stroke at a junction moves far from its neighbours'
        # (the neighbours', not the whole stroke's: round a heavy loop every move points inward,
        # and the stroke's median move is none of them)
        w = 12
        idx = [i for i, m in enumerate(move) if m is not None]
        meds = {}
        for i in idx:
            near = [move[j] for j in idx if (min(abs(j - i), len(move) - abs(j - i)) if closed else abs(j - i)) <= w]
            meds[i] = np.median(near, axis=0)
        move = [None if m is None or np.linalg.norm(m - meds[i]) > 70 else m for i, m in enumerate(move)]
    good = [i for i, m in enumerate(move) if m is not None]
    if not good:
        move = list(onto(samples, skel) - samples)
    else:
        move = [move[i] if move[i] is not None else move[min(good, key=lambda g: abs(g - i))] for i in range(len(move))]
    move = np.array(move)
    k = 8  # smooth the moves along the stroke (round a loop's seam, so the loop still meets)
    if closed:
        sm = np.array([move[[(j % len(move)) for j in range(i - k, i + k + 1)]].mean(0) for i in range(len(move))])
        sm[0] = sm[-1] = (sm[0] + sm[-1]) / 2
    else:
        sm = np.array([move[max(0, i - k) : i + k + 1].mean(0) for i in range(len(move))])
    # deform the Thin cubics by the smooth move field: an on-curve point by the move where it
    # sits, a handle by the move a third of the way along, so the curve stays smooth
    out = []
    for j, c in enumerate(cs):
        at = j * n
        start = sm[at] if j == 0 else (sm[at] + sm[at - 1]) / 2
        end = sm[at + n - 1] if j == len(cs) - 1 else (sm[at + n - 1] + sm[at + n]) / 2
        out.append(np.array([c[0] + start, c[1] + sm[at + n // 3], c[2] + sm[at + 2 * n // 3], c[3] + end]))
    # a free end runs on (or back) along its tangent to where the Black's ink ends: the moves are
    # across the stroke, and Noto's Black lengthens its terminals as it widens (ւ's foot)
    for k, (c, e, h) in enumerate(((out[0], 0, 1), (out[-1], 3, 2))):
        if closed or ends[k] != 'free':
            continue
        v = c[e] - c[h]
        v = v / (np.linalg.norm(v) + 1e-9)
        ts = np.arange(-60, 120.5, 0.5)
        pts = c[e] + np.outer(ts, v)
        xs = ((pts[:, 0] + PAD) * SC).round().astype(int)
        ys = ((Y1 - pts[:, 1]) * SC).round().astype(int)
        ok = (xs >= 0) & (xs < ink.shape[1]) & (ys >= 0) & (ys < ink.shape[0])
        on = np.zeros(len(ts), bool)
        on[ok] = ink[ys[ok], xs[ok]]
        i0 = int(np.searchsorted(ts, 0))
        if not on[: i0 + 1].any():
            continue  # no ink behind the end either: leave it
        last = max(i for i in range(i0 + 1) if on[i])  # the ink nearest the end, at or behind it
        while last + 1 < len(ts) and on[last + 1]:
            last += 1  # and on to where that run of ink stops
        c[e], c[h] = c[e] + v * ts[last], c[h] + v * ts[last]
    return out


PENS = (1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.72, 0.68, 0.64, 0.6)  # lighter only where nothing heavier draws cleanly
LAST_PENS = (0.5, 0.4)  # with either cut, only where no pen above draws cleanly with either (Armenian's ՞)
BLENDS = (1.0, 0.8, 0.6, 0.4, 0.2, 0.0)
CUTS = ('n', 'h')  # a heavy terminal's cut: square, or turned toward flat where a square end folds


def clean_reach(entry, ref, k):
    """How far toward Black stroke k may go, and with how heavy a pen: the heaviest pen, then the
    largest blend, whose outline draws without folding (the outline lint's test) at every master,
    upright and italic. Noto's Black has inner corners tighter than half its stem, which an
    outline font can draw and a pen cannot."""
    from build import italicize
    from geom import expand, flatten
    from traced import draw_letter
    from glyphs import G
    from lint import self_intersects
    from params import ITALIC_MASTERS, MASTERS, P

    closed, ends, thin, black, _, _ = entry[3][k]
    for cut, pen in [(c, q) for c in CUTS for q in PENS] + [(c, q) for c in CUTS for q in LAST_PENS]:
        for b in BLENDS:
            blend = [(round(x + (bx - x) * b), round(y + (by - y) * b)) for (x, y), (bx, by) in zip(thin, black)]
            strokes = [(c, j, _flat(th), _flat(blend if i == k else bl), pen if i == k else pn, cut if i == k else ct) for i, (c, j, th, bl, pn, ct) in enumerate(entry[3])]
            ok = True
            for _, loc in MASTERS + ITALIC_MASTERS:
                p = P(**loc)
                g = G(p)
                draw_letter(g, p, (*entry[:3], strokes), ref)
                st = italicize(g.strokes, p)[k]
                if any(self_intersects(flatten(c, 16)) for c in expand(st, p.V, p.H)):
                    ok = False
                    break
            if ok:
                return pen, b, blend, cut
    return pen, 0.0, thin, cut


def _flat(pts):
    return [v for q in pts for v in q]


def _tie_corners(out):
    """Strokes that meet at a corner in the Thin meet there in the Black too. Each is moved onto
    the Black on its own, and a crossing at a corner catches the other stroke's ink (ւ's foot
    landed 72 units above its stem's end). Each stroke's move across itself is the one to trust,
    so the corner goes where both agree: the stem's x, the foot's y. A rounded-off bend's halves,
    each run on along its tangent, meet at the corner their lines make, in the Thin as well."""
    groups = []
    for i, (closed, kinds, thin, _) in enumerate(out):
        for k, (e, h) in enumerate(((0, 1), (-1, -2))):
            if not closed and kinds[k] == 'corner':
                g = next((g for g in groups if math.dist(out[g[0][0]][2][g[0][1]], thin[e]) < BEND_TRIM * 2), None)
                if g is None:
                    groups.append([(i, e, h)])
                else:
                    g.append((i, e, h))
    for group in groups:
        if len(group) < 2:
            continue
        for which in (2, 3):
            rows, rhs, mean = [], [], np.zeros(2)
            for i, e, h in group:
                b = out[i][which]
                d = np.asarray(b[e], float) - np.asarray(b[3 if e == 0 else -4], float)  # the end cubic's chord: its handle bends into the corner
                n = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-9)
                rows.append(n)
                rhs.append(n @ np.asarray(b[e], float))
                mean += np.asarray(b[e], float) / len(group)
            a = np.array(rows)
            # where the strokes cross at an angle, the point on both their lines; where they run
            # on smoothly (a loop halved at no corner), their mean
            target = np.linalg.lstsq(a, np.array(rhs), rcond=None)[0] if abs(np.linalg.det(a[:2] @ a[:2].T)) > 0.25 else mean
            for i, e, h in group:
                b = out[i][which]
                delta = target - np.asarray(b[e], float)
                b[e], b[h] = target.copy(), np.asarray(b[h], float) + delta


def letter(cp, fonts, caps):
    thin, reg, black = fonts
    strokes = trace(thin.getGlyphSet(), thin.getBestCmap()[cp])
    ink = raster(black.getGlyphSet(), black.getBestCmap()[cp])
    skel = skeleton_points(ink)
    gs_reg = reg.getGlyphSet()
    g = gs_reg[reg.getBestCmap()[cp]]
    bp = BoundsPen(gs_reg)
    g.draw(bp)
    x0, _, x1, y1 = bp.bounds
    gs_black = black.getGlyphSet()
    gb = gs_black[black.getBestCmap()[cp]]
    bpb = BoundsPen(gs_black)
    gb.draw(bpb)
    bx0, _, bx1, _ = bpb.bounds
    out = []
    for s in strokes:
        cs = [np.array(c, float) for c in s['cubics']]
        ends = s['ends'] if not s['closed'] else ['', '']
        if not s['closed']:  # put back what the tracer cut, along the end's tangent
            for k, first in enumerate((True, False)):
                c = cs[0] if first else cs[-1]
                end, nxt = (c[0], c[1]) if first else (c[3], c[2])
                ext = s['trims'][k] + (EXT if ends[k] == 'free' else 0)
                v = end - nxt
                v = v / (np.linalg.norm(v) + 1e-9)
                if first:
                    c[0], c[1] = end + v * ext, c[1] + v * ext
                else:
                    c[3], c[2] = end + v * ext, c[2] + v * ext
        flat = [cs[0][0]] + [q for c in cs for q in c[1:]]
        bl = to_black(cs, ends, ink, skel, s['closed'])
        flat_b = [bl[0][0]] + [q for c in bl for q in c[1:]]
        out.append((s['closed'], tuple(ends) if not s['closed'] else ('', ''), flat, flat_b))
    _tie_corners(out)
    xmin = min(q[0] for st in out for q in st[2])
    xmin_b = min(q[0] for st in out for q in st[3])
    ht = 'c' if caps[0] <= cp <= caps[1] else 'a' if y1 > 650 else 'x'
    return {'sb': ((round(x0), round(bx0)), (round(g.width - x1), round(gb.width - bx1))), 'ht': ht, 'strokes': [(c, j, [(q[0] - xmin, q[1]) for q in f], [(q[0] - xmin_b, q[1]) for q in fb]) for c, j, f, fb in out]}


def levels(data, which, at):
    """Each reference's centre-line levels, read off the letters that show them (`at`: level ->
    (letter, closed strokes only or open only or either, 'min' or 'max', offset))."""
    def curve(cp, closed=None):
        pts = []
        for c, _, f, fb in data[cp]['strokes']:
            if closed is None or c == closed:
                f = np.array(fb if which else f)
                pts += [bez(f[i : i + 4], t) for i in range(0, len(f) - 1, 3) for t in np.linspace(0, 1, 20)]
        return np.array(pts)

    out = {k: (curve(cp, closed)[:, 1].min() if how == 'min' else curve(cp, closed)[:, 1].max()) + off for k, (cp, closed, how, off) in at.items() if k != 'unit'}
    out['unit'] = np.ptp(curve(at['unit'][0])[:, 0])  # the unit letter's width: the horizontal scale
    return out


def ink_lines(fonts, lines, unit):
    """The lines a stem ends on, from the Thin's ink; the x-height (Noto's round top less its 10
    units of overshoot); and the unit letter's ink width at Thin, Regular and Black."""
    def bounds(font, cp):
        gs = font.getGlyphSet()
        bp = BoundsPen(gs)
        gs[font.getBestCmap()[cp]].draw(bp)
        return bp.bounds

    thin = fonts[0]
    return {
        'asc': round(bounds(thin, lines['asc'])[3]),
        'desc': round(bounds(thin, lines['desc'])[1]),
        'cap': round(bounds(thin, lines['cap'])[3]),
        'xh': round(bounds(thin, lines['xh'])[3]) - 10,
    }, [round(bounds(f, unit)[2] - bounds(f, unit)[0]) for f in fonts]


def fmt(pts):
    return '(' + ', '.join(f'{round(x)}, {round(y)}' for x, y in pts) + ',)'


def noto_kerning(fonts, cps):
    """The letter pairs Noto kerns, with its values at Thin, Regular and Black. These letters are
    Noto's centre lines with Noto's spacing, so Noto's kerning fits them as it stands; traced.py
    scales it with the letters and blends it by weight as the outlines are."""
    import io

    import uharfbuzz as hb

    shapers = []
    for font in fonts:
        font = TTFont(font.reader.file.name)
        font.flavor = None
        buf = io.BytesIO()
        font.save(buf)
        shapers.append(hb.Font(hb.Face(buf.getvalue())))

    def advance(hbf, text, kern):
        b = hb.Buffer()
        b.add_str(text)
        b.guess_segment_properties()
        hb.shape(hbf, b, {'kern': kern})
        return sum(p.x_advance for p in b.glyph_positions)

    out = {}
    for a in cps:
        for b in cps:
            pair = chr(a) + chr(b)
            vals = [advance(h, pair, True) - advance(h, pair, False) for h in shapers]
            if any(abs(v) >= 10 for v in vals):
                out[f'uni{a:04X} uni{b:04X}'] = vals
    return out


SCRIPTS = {
    'georgian': {
        'name': 'Georgian',
        'cps': list(range(0x10D0, 0x10F1)) + list(range(0x1C90, 0x1CB1)),  # Mkhedruli and their Mtavruli
        'caps': (0x1C90, 0x1CBF),
        'levels': {  # level: (letter, closed strokes only / open only / either, min or max, offset)
            'desc': (0x10D2, None, 'min', 0),  # გ's bowl
            'base': (0x10D1, True, 'min', 0),  # ბ's bowl
            'xh': (0x10DD, None, 'max', 0),  # ო's arch
            'asc': (0x10D1, False, 'max', 6),  # ბ's hook, between a round top and a cut end
            'cap': (0x1C9D, None, 'max', 0),  # Ო's arch
            'unit': (0x10D8, None, None, 0),  # ი
        },
        'lines': {'asc': 0x10D1, 'desc': 0x10D2, 'cap': 0x1C90, 'xh': 0x10DD},
    },
    'armenian': {
        'name': 'Armenian',
        # capitals, lowercase with և, the marks, and the dram sign; ։ and ֊ are this font's colon
        # and hyphen (armenian.py), and two dots trace to nothing
        'cps': list(range(0x531, 0x557)) + list(range(0x559, 0x589)) + [0x58F],
        'caps': (0x531, 0x556),
        'levels': {
            'desc': (0x584, None, 'min', 0),  # ք's stem
            'base': (0x585, True, 'min', 0),  # օ's bowl
            'xh': (0x585, None, 'max', 0),  # օ's bowl
            'asc': (0x565, None, 'max', 6),  # ե's top
            'cap': (0x555, None, 'max', 0),  # Օ's bowl
            'unit': (0x578, None, None, 0),  # ո
        },
        'lines': {'asc': 0x565, 'desc': 0x584, 'cap': 0x531, 'xh': 0x585},
    },
}


if __name__ == '__main__':
    key = sys.argv[1]
    cfg = SCRIPTS[key]
    fonts = [TTFont(p) for p in sys.argv[2:5]]
    cps = cfg['cps']
    data = {cp: letter(cp, fonts, cfg['caps']) for cp in cps}
    ref = {name: {k: round(float(v), 1) for k, v in levels(data, i, cfg['levels']).items()} for i, name in enumerate(('thin', 'black'))}
    ref['lines'], ref['unit_ink'] = ink_lines(fonts, cfg['lines'], cfg['levels']['unit'][0])
    held = []
    for cp, d in data.items():
        # each stroke is searched in turn, against the ones before it as already settled; a stroke
        # not yet searched is drawn at its Thin centre line, which every pen draws cleanly
        rounded = [(c, j, [(round(x), round(y)) for x, y in f], [(round(x), round(y)) for x, y in fb], 1.0, 'n') for c, j, f, fb in d['strokes']]
        settled = [(c, j, th, th, 0.72, 'h') for c, j, th, _, _, _ in rounded]
        for k in range(len(rounded)):
            entry = (d['sb'][0], d['sb'][1], d['ht'], settled[:k] + [rounded[k]] + settled[k + 1 :])
            pen, b, blend, cut = clean_reach(entry, ref, k)
            if (pen, b, cut) != (1.0, 1.0, 'n'):
                held.append(f'{chr(cp)}{k}:{b:.1f}' + (f'@{pen}' if pen < 1 else '') + (f'/{cut}' if cut != 'n' else ''))
            settled[k] = (*rounded[k][:3], blend, pen, cut)
        d['strokes'] = settled
    print('held back from Black:', ' '.join(held))
    notice = fonts[1]['name'].getDebugName(0)
    lines = [HEADER.format(name=cfg['name'], key=key, copyright=notice) + f'REF = {ref!r}\n\nTRACE = {{']
    for cp, d in data.items():
        body = ',\n        '.join(f'({c}, {j}, {fmt(f)}, {fmt(fb)}, {pen}, {cut!r})' for c, j, f, fb, pen, cut in d['strokes'])
        lines.append(f"    0x{cp:04X}: ({d['sb'][0]}, {d['sb'][1]}, '{d['ht']}', [  # {chr(cp)}\n        {body},\n    ]),")
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, f'{key}_paths.py'), 'w') as f:
        f.write('\n'.join(lines) + '\n}\n')
    with open(os.path.join(here, f'kern_{key}.json'), 'w', encoding='utf-8') as f:
        kern = noto_kerning(fonts, cps)
        f.write('{\n' + ',\n'.join(f'  "{k}": {json.dumps(v)}' for k, v in sorted(kern.items())) + '\n}\n')  # the formatter's layout

"""Trace the Georgian centre lines in `georgian_paths.py` from Noto Sans Georgian.

Each letter of the Thin weight is rasterized and skeletonized; the skeleton is split into strokes
at its junctions (joining the pairs that run on smoothly), and each stroke is fitted with cubics.
Sidebearings come from the Regular weight. Not part of the build, and its dependencies are not in
requirements.txt:

    pip install scikit-image
    python3 -I src/trace_georgian.py NotoSansGeorgian-Thin.ttf NotoSansGeorgian-Regular.ttf

(the fontsource woff2 files of `@fontsource/noto-sans-georgian` 5.x work as well).
"""
import math
import os
import sys

import numpy as np
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize

SC = 2  # raster pixels per font unit
PAD = 40
JOIN_TRIM = 40  # font units cut from an end at a junction, where the skeleton bends
END_TRIM = 18  # font units cut from each open end, and put back along the tangent
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
    pen = PolyPen(gs)
    gs[name].draw(pen)
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
    return [f]


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
            if closed and math.dist(piece[0], piece[-1]) >= 3:
                piece = np.vstack([piece, piece[:1]])
            if closed:
                piece[-1] = piece[0]
            pieces.append((closed, piece))

    # where two loops cross (ზ's waist) the skeleton leaves a short piece between them: the
    # closed loops already cover it
    loops = [pc for c, pc in pieces if c]
    pieces = [(c, pc) for c, pc in pieces if c or length(pc) > 120 or not all(any(np.linalg.norm(lp - pc[e], axis=1).min() < 15 for lp in loops) for e in (0, -1))]

    def kind(k, end):
        """'join' if this end lands on another stroke, else 'free'."""
        q = pieces[k][1][end]
        near = any(np.linalg.norm(pc - q, axis=1).min() < 20 for j, (_, pc) in enumerate(pieces) if j != k)
        return 'join' if near else 'free'

    strokes = []
    for k, (closed, piece) in enumerate(pieces):
        ends = ['', '']
        if closed:  # start at the bottom, away from any junction, with one tangent through the seam
            arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(piece, axis=0), axis=1))]
            keep = (arc > 20) & (arc < arc[-1] - 20)  # the seam is where a split doubled back
            piece = np.vstack([piece[keep], piece[keep][:1]])
            i = int(np.argmin(piece[:-1, 1]))
            piece = np.vstack([piece[i:-1], piece[: i + 1]])
            tn = piece[min(8, len(piece) - 1)] - piece[-1 - min(8, len(piece) - 1)]
            tn = tn / (np.linalg.norm(tn) + 1e-9)
            cs = fit(piece, tn, -tn, tol)
            trims = [0, 0]
        else:
            ends = [kind(k, 0), kind(k, -1)]
            arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(piece, axis=0), axis=1))]
            # a skeleton forks at a blunt end and bends into a junction: cut both back (more at a
            # junction), and the generator runs the end on along the cut's tangent
            trims = [JOIN_TRIM if e == 'join' else END_TRIM for e in ends]
            if arc[-1] > 2 * sum(trims) + 20:
                piece = piece[(arc >= trims[0]) & (arc <= arc[-1] - trims[1])]
            else:
                trims = [0, 0]
            short = arc[-1] < 260  # a stub or half a crossbar is one curve: a heavy pen folds on more
            cs = fit(piece, tangent(piece, True), tangent(piece, False), 40 if short else tol)
        strokes.append({'closed': bool(closed), 'ends': ends, 'trims': trims, 'cubics': [[[round(float(v), 1) for v in pt] for pt in c] for c in cs]})
    return strokes


EXT = 12.5  # the thin reference's half stroke: a skeleton stops this short of the ink
HEADER = '''"""Georgian centre lines, generated by `trace_georgian.py` from Noto Sans Georgian Thin (SIL OFL
1.1; Copyright 2022 The Noto Project Authors, https://github.com/notofonts/georgian). Do not edit
by hand: re-run the tracer.

Each letter: (left and right sidebearing in units of the straight-stem sidebearing, as Noto's
Regular spaces it; 'x' or 'a' for the letter's height; strokes). A stroke is (closed; whether
each end joins another stroke; flat points: the start point, then each cubic's two handles and
end point). Units are the thin reference's; `georgian.py` maps them onto this font's metrics.
"""

TRACE = {
'''


def letter(ch, gs_thin, gs_reg, cm_thin, cm_reg):
    strokes = trace(gs_thin, cm_thin[ord(ch)])
    reg = gs_reg[cm_reg[ord(ch)]]
    bp = BoundsPen(gs_reg)
    reg.draw(bp)
    x0, _, x1, y1 = bp.bounds
    n_sb = 85  # Noto Sans Regular n's sidebearing: the straight-stem unit
    out, pts_all = [], []
    for s in strokes:
        cs = [np.array(c, float) for c in s['cubics']]
        if not s['closed']:  # put back what the tracer cut, along the end's tangent
            for k, first in enumerate((True, False)):
                c = cs[0] if first else cs[-1]
                end, nxt = (c[0], c[1]) if first else (c[3], c[2])
                ext = s['trims'][k] + (EXT if s['ends'][k] == 'free' else 0)
                v = end - nxt
                v = v / (np.linalg.norm(v) + 1e-9)
                if first:
                    c[0], c[1] = end + v * ext, c[1] + v * ext
                else:
                    c[3], c[2] = end + v * ext, c[2] + v * ext
        flat = [cs[0][0]] + [q for c in cs for q in c[1:]]
        joins = tuple(e == 'join' for e in s['ends']) if not s['closed'] else (False, False)
        out.append((s['closed'], joins, flat))
        pts_all += flat
    xmin = min(q[0] for q in pts_all)
    body = [f'({closed}, {joins}, ({", ".join(f"{round(q[0] - xmin)}, {round(q[1])}" for q in flat)},))' for closed, joins, flat in out]
    ht = 'a' if y1 > 650 else 'x'
    return f"    0x{ord(ch):04X}: ({x0 / n_sb:.2f}, {(reg.width - x1) / n_sb:.2f}, '{ht}', [  # {ch}\n        " + ',\n        '.join(body) + ',\n    ]),'


if __name__ == '__main__':
    thin, regular = TTFont(sys.argv[1]), TTFont(sys.argv[2])
    chars = ''.join(chr(c) for c in range(0x10D0, 0x10F1))
    lines = [letter(ch, thin.getGlyphSet(), regular.getGlyphSet(), thin.getBestCmap(), regular.getBestCmap()) for ch in chars]
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'georgian_paths.py')
    with open(path, 'w') as f:
        f.write(HEADER + '\n'.join(lines) + '\n}\n')

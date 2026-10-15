"""Quality metrics for the Latin pass: measurements on rendered ink, thresholds, and `check_all`.

The shipped font is judged the way a reader sees it, not the way the engine draws it: glyphs are
instanced at a location, rasterized at 1 px per font unit, and measured. Joins, counters and
slivers are compared with Inter's values for the same glyph and weight (REF, measured once, so no
test needs the reference font); ink and sidebearings are absolute.

    python3 -I src/quality.py [upright.ttf italic.ttf]
"""

import functools
import os
import string
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np  # noqa: E402
from fontTools.pens.basePen import BasePen  # noqa: E402
from fontTools.pens.boundsPen import BoundsPen  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.varLib.instancer import instantiateVariableFont  # noqa: E402
from scipy import ndimage as ndi  # noqa: E402
from skimage.draw import polygon as fill_polygon  # noqa: E402
from skimage.morphology import disk, skeletonize  # noqa: E402

MARGIN = 10
STEM_THIN = 22  # params.P stem at wght 100

LOWER = string.ascii_lowercase
UPPER = string.ascii_uppercase
DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
THIN_INK_GLYPHS = list(LOWER + UPPER) + DIGITS + ['comma', 'semicolon', 'quoteright', 'quotedblright', 'quoteleft', 'quotedblleft']
LATIN = list(LOWER + UPPER) + DIGITS
JOIN_GLYPHS = {'a': 'right', 'b': 'left', 'd': 'right', 'g': 'right', 'p': 'left', 'q': 'right', 'n': 'left', 'm': 'left', 'h': 'left', 'u': 'right', 'r': 'left'}
JOIN_WEIGHTS = (400, 900)
# The double-storey a's bowl and stem form one ink run at mid x-height, so its stem width (and so
# its join) cannot be read off a raster; Inter's own value flips between weights. Skipped.
JOIN_UNMEASURABLE = {'a'}
COUNTER_GLYPHS = ['o', 'e', 'a']
SB_GLYPHS = [c for c in LOWER if c not in 'fj']
MASTER_LOCATIONS = [(400, 14), (100, 14), (900, 14), (400, 8), (400, 48)]

# Thresholds (the table in the plan).
THIN_INK_MAX = 2.5 * STEM_THIN
JOIN_SLACK = 0.10  # join_ratio may sit this far under Inter's
CUT_MAX_DEG = 35.0  # a heavy curved terminal's cut, from horizontal: angled like Inter, never flat by rule
COUNTER_MIN_SHARE = 0.70
JOIN_SKIP = 0.3  # stem widths: the junction itself is skeleton noise, the join is what follows it
X_SB_MIN = 25  # x at Regular: its diagonals must not touch the neighbours

# Reference values, measured from Inter (Version 4.001;git-9221beed3, name ID 5) at opsz 14 on
# 2026-10-15 with `python3 -I src/quality.py --measure-ref Inter.ttf InterItalic.ttf`; keys are
# (glyph, wght), upright and italic apart because their constructions differ. None = no
# meaningful value, skipped: the double-storey a (see JOIN_UNMEASURABLE), and joins that read at
# the skeleton's noise floor (below 0.25, where the window caught a spur and not the join: the
# slanted stems of Inter Italic's d p n m h u r at Regular, and r at Black).
REF = {
    'join': {
        ('a', 400): None, ('b', 400): 0.587, ('d', 400): 0.581, ('g', 400): 0.592, ('p', 400): 0.586, ('q', 400): 0.587,
        ('n', 400): 0.508, ('m', 400): 0.472, ('h', 400): 0.508, ('u', 400): 0.498, ('r', 400): 0.706,
        ('a', 900): None, ('b', 900): 0.463, ('d', 900): 0.462, ('g', 900): 0.545, ('p', 900): 0.466, ('q', 900): 0.463,
        ('n', 900): 0.451, ('m', 900): 0.503, ('h', 900): 0.448, ('u', 900): 0.442, ('r', 900): None,
    },
    'counter': {('o', 900): 0.1215, ('e', 900): 0.0471, ('a', 900): 0.0428},
    'sliver': 46,  # px^2 at 1000 upm: the largest piece of ink a radius-6 disk cannot fit, over Latin at 900
    'join_italic': {
        ('a', 400): None, ('b', 400): 0.512, ('d', 400): None, ('g', 400): 0.555, ('p', 400): None, ('q', 400): 0.508,
        ('n', 400): None, ('m', 400): None, ('h', 400): None, ('u', 400): None, ('r', 400): None,
        ('a', 900): None, ('b', 900): 0.408, ('d', 900): 0.419, ('g', 900): 0.447, ('p', 900): 0.407, ('q', 900): 0.427,
        ('n', 900): 0.389, ('m', 900): 0.458, ('h', 900): 0.380, ('u', 900): 0.356, ('r', 900): None,
    },
    'counter_italic': {('o', 900): 0.1225, ('e', 900): 0.0458, ('a', 900): 0.1219},
    'sliver_italic': 62,
}


# -- rendering -----------------------------------------------------------------------------------


class Ink(np.ndarray):
    """A bool ink mask that remembers where the baseline is and how tall the x-height is (px)."""

    baseline = None
    x_height = None

    def __array_finalize__(self, obj):
        if obj is not None:
            self.baseline = getattr(obj, 'baseline', None)
            self.x_height = getattr(obj, 'x_height', None)


class _Flatten(BasePen):
    """Collects closed contours as point lists, curves flattened."""

    STEPS = 12

    def __init__(self, glyph_set):
        super().__init__(glyph_set)
        self.contours = []
        self._cur = None

    def _moveTo(self, p):
        self._cur = [p]

    def _lineTo(self, p):
        self._cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self._cur[-1]
        for i in range(1, self.STEPS + 1):
            t = i / self.STEPS
            u = 1 - t
            self._cur.append(
                (
                    u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
                )
            )

    def _qCurveToOne(self, p1, p2):
        p0 = self._cur[-1]
        for i in range(1, self.STEPS + 1):
            t = i / self.STEPS
            u = 1 - t
            self._cur.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))

    def _closePath(self):
        if self._cur and len(self._cur) > 2:
            self.contours.append(self._cur)
        self._cur = None

    _endPath = _closePath


_INSTANCES = {}


def instance(font_path, wght, opsz=14):
    """The font instanced at a location (cached); fonts without an opsz axis ignore it."""
    key = (font_path, wght, opsz)
    if key not in _INSTANCES:
        font = TTFont(font_path)
        for tag in ('GPOS', 'GSUB', 'GDEF'):  # layout is not measured, and merging it is most of the time
            if tag in font:
                del font[tag]
        axes = {a.axisTag for a in font['fvar'].axes}
        loc = {k: v for k, v in (('wght', wght), ('opsz', opsz)) if k in axes}
        _INSTANCES[key] = instantiateVariableFont(font, loc, inplace=False)
    return _INSTANCES[key]


def ref_scale(font_path):
    """Pixels per font unit that puts a font on Cascivo's 1000-unit em."""
    return 1000 / TTFont(font_path)['head'].unitsPerEm


def x_height_of(font, scale=1.0):
    pen = BoundsPen(font.getGlyphSet())
    font.getGlyphSet()['x'].draw(pen)
    return pen.bounds[3] * scale


@functools.cache
def raster(font_path, glyph, wght, opsz=14, scale=1.0):
    """Bool ink mask of the instanced glyph (nonzero fill), 1 px per font unit x `scale`, with a
    10 px margin. Winding is summed per contour so overlapping strokes fill and counters stay
    white, whatever the font does about overlaps. Cached: the masks are only ever read."""
    font = instance(font_path, wght, opsz)
    gs = font.getGlyphSet()
    pen = _Flatten(gs)
    gs[glyph].draw(pen)
    xh = x_height_of(font, scale)
    if not pen.contours:
        m = np.zeros((2 * MARGIN, 2 * MARGIN), bool).view(Ink)
        m.baseline, m.x_height = MARGIN, xh
        return m
    pts = [np.array(c) * scale for c in pen.contours]
    allp = np.concatenate(pts)
    x0, x1 = allp[:, 0].min(), allp[:, 0].max()
    y0, y1 = min(allp[:, 1].min(), 0), max(allp[:, 1].max(), xh)
    w = int(np.ceil(x1 - x0)) + 2 * MARGIN
    top = y1 + MARGIN
    h = int(np.ceil(top - (y0 - MARGIN)))
    wind = np.zeros((h, w), np.int16)
    for c in pts:
        xs, ys = c[:, 0] - x0 + MARGIN, top - c[:, 1]
        area = 0.5 * np.sum(xs * np.roll(ys, -1) - np.roll(xs, -1) * ys)
        rr, cc = fill_polygon(ys - 0.5, xs - 0.5, wind.shape)
        wind[rr, cc] += 1 if area > 0 else -1
    mask = (wind != 0).view(Ink)
    mask.baseline = top
    mask.x_height = xh
    return mask


# -- metrics -------------------------------------------------------------------------------------


def _split_dots(mask):
    """(mask without dots, labels): a dot is a component that fills >= 85% of a near-square bbox."""
    labels, n = ndi.label(mask)
    keep = np.asarray(mask).copy()
    for i, sl in enumerate(ndi.find_objects(labels), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = int((labels[sl] == i).sum())
        if area >= 0.85 * h * w and 0.7 <= w / h <= 1.4:
            keep[labels == i] = False
    return keep


def max_ink(mask):
    """Largest inscribed diameter (2 x max EDT) outside dot contours: how heavy the heaviest part
    is. A hairline weight with a blob (a comma's head) fails here."""
    body = _split_dots(mask)
    if not body.any():
        return 0.0
    return float(2 * ndi.distance_transform_edt(body).max())


def _stem_run(mask, row, stem_side):
    """(start, stop) columns of the ink run touching stem_side at a row."""
    cols = np.flatnonzero(np.asarray(mask)[row])
    if not len(cols):
        return None
    if stem_side == 'left':
        start = cols[0]
        stop = start
        while stop + 1 < mask.shape[1] and mask[row, stop + 1]:
            stop += 1
        return start, stop + 1
    stop = cols[-1]
    start = stop
    while start - 1 >= 0 and mask[row, start - 1]:
        start -= 1
    return start, stop + 1


def prune(skel, n):
    """Delete skeleton branches shorter than n px: strip endpoints n times, then grow the
    survivors' ends back along the original skeleton so long branches keep their length."""
    kernel = np.ones((3, 3), np.uint8)
    kernel[1, 1] = 0

    def ends_of(a):
        return a & (ndi.convolve(a.view(np.uint8), kernel, mode='constant') <= 1)

    cur = skel.copy()
    for _ in range(n):
        cur = cur & ~ends_of(cur)
    grown = cur
    for _ in range(n):
        grown = grown | (ndi.binary_dilation(ends_of(grown), structure=np.ones((3, 3))) & skel)
    return grown


def join_ratio(mask, stem_side, x_height=None, baseline=None):
    """How much a bowl/arch thins where it meets its stem, relative to the bowl itself.

    Skeletonize; thickness = 2 x EDT on skeleton pixels. The numerator is the thinnest skeleton
    point in a window of 1.5 stem widths beside the stem (within the x-height band, and short of
    the next counter's far side); the denominator is the median thickness of the bowl's skeleton
    (everything outside the stem). Stem width is the ink run at mid x-height on stem_side. The
    skeleton sprouts short spurs into every corner and tapers to nothing there; branches shorter
    than half a stem are pruned and points thinner than a tenth of the stem ignored, so only the
    body of the join is measured, starting JOIN_SKIP stems out from the stem edge."""
    x_height = getattr(mask, 'x_height', None) if x_height is None else x_height
    baseline = getattr(mask, 'baseline', None) if baseline is None else baseline
    if x_height is None or baseline is None:
        raise ValueError('join_ratio needs a raster() mask, or x_height and baseline')
    m = np.asarray(mask)
    mid = int(round(baseline - x_height / 2))
    run = _stem_run(m, mid, stem_side)
    if run is None:
        return float('nan')
    a, b = run
    stem = b - a
    edt = ndi.distance_transform_edt(m)
    skel = prune(skeletonize(m), int(0.5 * stem))
    thick = 2 * edt
    top = int(baseline - x_height)
    band = np.zeros_like(m)
    band[max(top, 0) : int(baseline) + 1, :] = True
    spur = skel & (thick >= 0.1 * stem)
    cols = np.arange(m.shape[1])
    if stem_side == 'left':
        reach = min(b + 1.5 * stem, _far_edge(m, mid, b, +1))
        win = (cols >= b + JOIN_SKIP * stem) & (cols < reach)
        bowl = cols >= b
    else:
        reach = max(a - 1.5 * stem, _far_edge(m, mid, a, -1))
        win = (cols < a - JOIN_SKIP * stem) & (cols >= reach)
        bowl = cols < a
    near = spur & band & win[None, :]
    far = spur & bowl[None, :]
    if not near.any() or not far.any():
        return float('nan')
    return float(thick[near].min() / np.median(thick[far]))


def _far_edge(m, row, col, step):
    """Column halfway across the gap that starts at `col` on a row, so a window beside one stem
    never reaches the glyph's other stem."""
    c0 = col
    while 0 <= c0 < m.shape[1] and m[row, c0]:
        c0 += step
    c1 = c0
    while 0 <= c1 < m.shape[1] and not m[row, c1]:
        c1 += step
    return (c0 + c1) / 2 if 0 <= c1 < m.shape[1] else float(c0 + step * 10**6)


def counter_area(mask, x_height):
    """Largest enclosed white component, as a share of x_height squared (so it is comparable
    across fonts and weights)."""
    m = np.asarray(mask)
    labels, n = ndi.label(~m)
    if n == 0:
        return 0.0
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])))
    sizes = ndi.sum(np.ones_like(labels), labels, index=np.arange(1, n + 1))
    inner = [s for i, s in enumerate(sizes, 1) if i not in border]
    return float(max(inner, default=0) / x_height**2)


def sliver_area(mask, r=6):
    """Area of the largest piece of ink that a disk of radius r cannot fit in: spikes, wedges and
    hairline tails, the places a heavy weight's joins and terminals go wrong."""
    m = np.asarray(mask)
    thin = m & ~ndi.binary_opening(m, structure=disk(r))
    labels, n = ndi.label(thin)
    if n == 0:
        return 0
    return int(ndi.sum(thin, labels, index=np.arange(1, n + 1)).max())


def cap_angles(p):
    """(glyph, degrees from horizontal) for every curved end with cap 'b' whose end tangent is
    within 50 degrees of vertical, read off the engine's own cap lines for master `p`."""
    import math

    import glyphs as GL
    from build import italicize
    from geom import cap_lines, seg_tangent

    out = []
    for name in LATIN:
        if name not in GL.GLYPHS:
            continue
        g = GL.G(p)
        GL.GLYPHS[name][1](g, p)
        for s in italicize(g.strokes, p):
            if s.closed:
                continue
            end_cap, start_cap = cap_lines(s, p.V, p.H)
            for seg, t, cap, line in ((s.segs[-1], 1.0, s.caps[1], end_cap), (s.segs[0], 0.0, s.caps[0], start_cap)):
                if cap != 'b' or seg[0] != 'C':
                    continue
                tan = seg_tangent(seg, t)
                if math.degrees(math.atan2(abs(tan[0]), abs(tan[1]))) > 50:
                    continue
                dx, dy = line[2][0] - line[1][0], line[2][1] - line[1][1]
                out.append((name, math.degrees(math.atan2(abs(dy), abs(dx)))))
    return out


# -- measuring Inter -----------------------------------------------------------------------------


def measure(font_path, italic=False):
    """The REF numbers for a reference font: join and counter per glyph and weight, and the worst
    sliver over Latin at wght 900."""
    sc = ref_scale(font_path)
    join, counter = {}, {}
    for w in JOIN_WEIGHTS:
        for g, side in JOIN_GLYPHS.items():
            join[(g, w)] = None if g in JOIN_UNMEASURABLE else round(join_ratio(raster(font_path, g, w, 14, sc), side), 3)
    for g in COUNTER_GLYPHS:
        m = raster(font_path, g, 900, 14, sc)
        counter[(g, 900)] = round(counter_area(m, m.x_height), 4)
    sliver = max(sliver_area(raster(font_path, g, 900, 14, sc)) for g in LATIN)
    return join, counter, sliver


# -- the checks ----------------------------------------------------------------------------------


def _glyph_bounds(font, name):
    gs = font.getGlyphSet()
    pen = BoundsPen(gs)
    gs[name].draw(pen)
    return pen.bounds, font['hmtx'][name][0]


def check_all(upright_vf, italic_vf):
    """Human-readable failures across both families; empty when everything passes."""
    from params import P

    fails = []
    for label, path, italic in (('', upright_vf, False), ('italic ', italic_vf, True)):
        suffix = '_italic' if italic else ''
        join_ref, counter_ref, sliver_ref = REF['join' + suffix], REF['counter' + suffix], REF['sliver' + suffix]
        for g in THIN_INK_GLYPHS:
            v = max_ink(raster(path, g, 100))
            if v > THIN_INK_MAX:
                fails.append(f'{label}thin ink: {g} is {v:.1f} thick at wght 100, over {THIN_INK_MAX:.1f}')
        for w in JOIN_WEIGHTS:
            for g, side in JOIN_GLYPHS.items():
                ref = join_ref.get((g, w))
                if ref is None:
                    continue
                v = join_ratio(raster(path, g, w), side)
                if not v >= ref - JOIN_SLACK:
                    fails.append(f'{label}join: {g} at wght {w} is {v:.2f}, under Inter {ref:.2f} - {JOIN_SLACK}')
        for name, deg in cap_angles(P(wght=900, opsz=14, italic=italic)):
            if deg > CUT_MAX_DEG:
                fails.append(f'{label}terminal cut: {name} is {deg:.1f} deg from horizontal at Black, over {CUT_MAX_DEG:.0f}')
        for g in COUNTER_GLYPHS:
            ref = counter_ref.get((g, 900))
            m = raster(path, g, 900)
            v = counter_area(m, m.x_height)
            if ref is not None and v < COUNTER_MIN_SHARE * ref:
                fails.append(f'{label}counter: {g} at wght 900 is {v:.4f}, under {COUNTER_MIN_SHARE} x Inter {ref:.4f}')
        worst = max(((sliver_area(raster(path, g, 900)), g) for g in LATIN))
        if sliver_ref and worst[0] > sliver_ref:
            fails.append(f'{label}sliver: {worst[1]} at wght 900 has {worst[0]} px^2, over Inter {sliver_ref}')
        # upright only: a slanted stem overhangs its advance by design (Inter Italic's i, k, v, w, x too)
        for wght, opsz in MASTER_LOCATIONS if not italic else []:
            font = instance(path, wght, opsz)
            for g in SB_GLYPHS:
                (x0, _, x1, _), adv = _glyph_bounds(font, g)
                lsb, rsb = x0, adv - x1
                need = X_SB_MIN if (g == 'x' and (wght, opsz) == (400, 14)) else 0
                if lsb < need or rsb < need:
                    fails.append(f'{label}sidebearings: {g} at wght {wght} opsz {opsz} has lsb {lsb:.0f} rsb {rsb:.0f}, needs >= {need}')
    return fails


if __name__ == '__main__':
    here = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fonts')
    if sys.argv[1:2] == ['--measure-ref']:
        for f, it in ((sys.argv[2], False), (sys.argv[3], True)):
            j, c, s = measure(f, it)
            print('join' + ('_italic' if it else ''), j)
            print('counter' + ('_italic' if it else ''), c)
            print('sliver' + ('_italic' if it else ''), s)
        sys.exit(0)
    up = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'CascivoSans[opsz,wght].ttf')
    it = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, 'CascivoSans-Italic[opsz,wght].ttf')
    out = check_all(up, it)
    print('\n'.join(out))
    print(f'{len(out)} quality failures')

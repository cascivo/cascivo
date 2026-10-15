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
THIN_PUNCT = {'comma': 'comma', 'semicolon': 'comma', 'quoteright': 'quoteright', 'quotedblright': 'quotedblright', 'quoteleft': 'quoteleft', 'quotedblleft': 'quotedblleft'}
# semicolon is judged against Inter's comma: Inter's round dot is not a "dot" to max_ink (it fills
# 78% of its box, not 85%), so Inter's semicolon value would be the dot and not the tail.
THIN_INK_GLYPHS = list(LOWER + UPPER) + DIGITS
LATIN = list(LOWER + UPPER) + DIGITS
JOIN_GLYPHS = {'a': 'right', 'b': 'left', 'd': 'right', 'g': 'right', 'p': 'left', 'q': 'right', 'n': 'left', 'm': 'left', 'h': 'left', 'u': 'right', 'r': 'left'}
JOIN_WEIGHTS = (400, 900)
# The double-storey a's bowl and stem form one ink run at mid x-height, so its stem width (and so
# its join) cannot be read off a raster; Inter's own value flips between weights. Skipped.
JOIN_UNMEASURABLE = {'a'}
# Where each glyph's counter meets a stem: (stem side, which end of the counter). The double-
# storey a is skipped in both families (its bowl and stem are one ink run at mid x-height, and
# Inter's own reading flips between weights); m is read at its first arch only.
ANGLE_JUNCTIONS = {
    'b': [('left', 'bottom')], 'p': [('left', 'bottom')], 'd': [('right', 'top')], 'q': [('right', 'top')], 'g': [('right', 'top')],
    'n': [('left', 'top'), ('right', 'top')], 'h': [('left', 'top'), ('right', 'top')], 'm': [('left', 'top')],
    'u': [('right', 'bottom'), ('left', 'bottom')], 'r': [('left', 'top')],
}
ITALIC_TAN = 0.1763  # tan 10 deg: Inter Italic's and ours; measured stems lean 10-11
ANGLE_SLACK = 10.0  # degrees counter_join_angle may sit under Inter's
COUNTER_GLYPHS = ['o', 'e', 'a']
SB_GLYPHS = [c for c in LOWER if c not in 'fj']
MASTER_LOCATIONS = [(400, 14), (100, 14), (900, 14), (400, 8), (400, 48)]

# Thresholds (the table in the plan).
THIN_INK_MAX = 2.5 * STEM_THIN
THIN_PUNCT_SHARE = 1.25  # punctuation may be this much heavier than Inter's, scaled to the Thin stem
NOTCH_SLACK = 0.03  # notch_depth may sit this far over Inter's, and never under NOTCH_FLOOR
NOTCH_FLOOR = 0.12
NOTCH_MARGIN = 24  # px above and below the x-height band that the notch box reads: it must clear the
# bowl's overshoot (13 px at Regular and up), or the box edge clips the ink and the hull of a slanted
# d or p spans the clip, reading 1.8 stems for a notch of 0.8
APERTURE_GLYPHS = ['c', 'e', 's', 'a', 'g', 'S', 'C', 'G', 'three', 'five', 'six', 'nine', 'question', 'ampersand']
CUT_FACE = (0.8, 1.15)  # a terminal's cut face is about one stroke thick: shorter lines are
# joins and bar ends, longer ones stems
JOIN_SLACK = 0.10  # join_ratio may sit this far under Inter's
CUT_MAX_DEG = 35.0  # a heavy curved terminal's cut face, from horizontal: angled like Inter, never flat by rule
COUNTER_MIN_SHARE = 0.70
JOIN_SKIP = 0.3  # stem widths: the junction itself is skeleton noise, the join is what follows it
PRUNE_SHARE = 0.5  # skeleton branches shorter than this many stems are spurs
X_SB_MIN = 25  # x at Regular: its diagonals must not touch the neighbours

# Reference values, measured from Inter (Version 4.001;git-9221beed3, name ID 5) at opsz 14 on
# 2026-10-15 with `python3 -I src/quality.py --measure-ref Inter.ttf InterItalic.ttf`; keys are
# (glyph, wght), upright and italic apart because their constructions differ. None = no
# meaningful value, skipped: the double-storey a (see JOIN_UNMEASURABLE), and joins that read at
# the skeleton's noise floor (below 0.25, where the window caught a spur and not the join: the
# slanted stems of Inter Italic's d p n m h u r at Regular, and r at Black). Italic b and q at
# Regular (Inter 0.51) are skipped for Cascivo's sake: the skeleton of a join with a sharp outer
# notch runs through the notch's corner, 5 px from the edge, and the window reads that point (0.13)
# whatever the stroke's thickness (0.85 at the bowl); the notch and angle checks cover the join.
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
        ('a', 400): None, ('b', 400): None, ('d', 400): None, ('g', 400): 0.555, ('p', 400): None, ('q', 400): None,
        ('n', 400): None, ('m', 400): None, ('h', 400): None, ('u', 400): None, ('r', 400): None,
        ('a', 900): None, ('b', 900): 0.408, ('d', 900): 0.419, ('g', 900): 0.447, ('p', 900): 0.407, ('q', 900): 0.427,
        ('n', 900): 0.389, ('m', 900): 0.458, ('h', 900): 0.380, ('u', 900): 0.356, ('r', 900): None,
    },
    'counter_italic': {('o', 900): 0.1225, ('e', 900): 0.0458, ('a', 900): 0.1219},
    'sliver_italic': 62,
    # notch_depth (stem widths, NOTCH_MARGIN 24, remeasured when the margin grew from 12: Inter's d and p
    # italic read 1.15 clipped); n m h u at 900 read ~1.4 because the box's hull spans the arch's
    # shoulder, a property of the construction that Cascivo shares: only the difference counts.
    'notch': {
        ('a', 400): None, ('b', 400): 0.98, ('d', 400): 0.98, ('g', 400): 0.997, ('p', 400): 0.968, ('q', 400): 0.968,
        ('n', 400): 0.922, ('m', 400): 0.907, ('h', 400): 0.967, ('u', 400): 0.927, ('r', 400): 0.939,
        ('a', 900): None, ('b', 900): 0.622, ('d', 900): 0.622, ('g', 900): 0.596, ('p', 900): 0.586, ('q', 900): 0.586,
        ('n', 900): 1.429, ('m', 900): 1.426, ('h', 900): 1.508, ('u', 900): 1.429, ('r', 900): 0.551,
    },
    'notch_italic': {
        ('a', 400): None, ('b', 400): 1.008, ('d', 400): 1.192, ('g', 400): 1.046, ('p', 400): 1.18, ('q', 400): 1.08,
        ('n', 400): 0.722, ('m', 400): 0.686, ('h', 400): 0.704, ('u', 400): 0.706, ('r', 400): 0.727,
        ('a', 900): None, ('b', 900): 0.635, ('d', 900): 0.64, ('g', 900): 0.617, ('p', 900): 0.609, ('q', 900): 0.579,
        ('n', 900): 1.423, ('m', 900): 1.423, ('h', 900): 1.476, ('u', 900): 1.418, ('r', 900): 0.551,
    },
    # counter_join_angle (degrees from horizontal) per (glyph, wght, stem side, end), measured the same
    # way (`--measure-ref Inter.ttf InterItalic.ttf --angle`, same Inter version): 90 would be a counter
    # arriving tangent to the stem; Inter's read 62-73 at Regular and 34-48 at Black, since the window
    # sits 0.04-0.30 stems out, where the arch is already turning. The italic is read with its rows
    # shifted back by tan 10 deg (ITALIC_TAN), so its stems are vertical like the upright's.
    'angle': {
        ('b', 400, 'left', 'bottom'): 72.4, ('p', 400, 'left', 'bottom'): 72.3, ('d', 400, 'right', 'top'): 71.0, ('q', 400, 'right', 'top'): 70.9,
        ('g', 400, 'right', 'top'): 70.6, ('n', 400, 'left', 'top'): 66.3, ('n', 400, 'right', 'top'): 64.6, ('h', 400, 'left', 'top'): 66.2,
        ('h', 400, 'right', 'top'): 64.7, ('m', 400, 'left', 'top'): 64.2, ('u', 400, 'right', 'bottom'): 65.5, ('u', 400, 'left', 'bottom'): 65.3,
        ('r', 400, 'left', 'top'): 62.8, ('b', 900, 'left', 'bottom'): 50.6, ('p', 900, 'left', 'bottom'): 50.7, ('d', 900, 'right', 'top'): 48.8,
        ('q', 900, 'right', 'top'): 49.0, ('g', 900, 'right', 'top'): 49.2, ('n', 900, 'left', 'top'): 38.9, ('n', 900, 'right', 'top'): 37.0,
        ('h', 900, 'left', 'top'): 38.7, ('h', 900, 'right', 'top'): 36.7, ('m', 900, 'left', 'top'): 33.2, ('u', 900, 'right', 'bottom'): 38.0,
        ('u', 900, 'left', 'bottom'): 38.1, ('r', 900, 'left', 'top'): 44.4,
    },
    'angle_italic': {
        ('b', 400, 'left', 'bottom'): 72.8, ('p', 400, 'left', 'bottom'): 72.1, ('d', 400, 'right', 'top'): 71.6, ('q', 400, 'right', 'top'): 71.3,
        ('g', 400, 'right', 'top'): 71.5, ('n', 400, 'left', 'top'): 66.4, ('n', 400, 'right', 'top'): 66.5, ('h', 400, 'left', 'top'): 64.8,
        ('h', 400, 'right', 'top'): 64.9, ('m', 400, 'left', 'top'): 63.9, ('u', 400, 'right', 'bottom'): 64.3, ('u', 400, 'left', 'bottom'): 66.6,
        ('r', 400, 'left', 'top'): 62.2, ('b', 900, 'left', 'bottom'): 48.1, ('p', 900, 'left', 'bottom'): 47.6, ('d', 900, 'right', 'top'): 44.4,
        ('q', 900, 'right', 'top'): 44.8, ('g', 900, 'right', 'top'): 46.3, ('n', 900, 'left', 'top'): 39.5, ('n', 900, 'right', 'top'): 34.1,
        ('h', 900, 'left', 'top'): 37.6, ('h', 900, 'right', 'top'): 37.8, ('m', 900, 'left', 'top'): 36.9, ('u', 900, 'right', 'bottom'): 36.4,
        ('u', 900, 'left', 'bottom'): 40.1, ('r', 900, 'left', 'top'): 44.1,
    },
    # terminal_thickness: the median thickness of Inter's terminals over TERMINAL_GLYPHS (`--measure-ref
    # Inter.ttf InterItalic.ttf --terminal`, same Inter version), at 1000 upm. A terminal under 0.8 of it
    # is a tongue or a hook: its face runs on into the curve, or the stroke thins to the cut.
    'terminal': {400: 89.3, 900: 188.1},
    'terminal_italic': {400: 88.4, 900: 186.7},
    # Thin ink of Inter's punctuation (max_ink at wght 100) and of its Thin stem (`l`)
    'thin_punct': {'comma': 24.0, 'quoteright': 24.1, 'quotedblright': 24.1, 'quoteleft': 24.1, 'quotedblleft': 24.1},
    'thin_punct_italic': {'comma': 22.8, 'quoteright': 22.8, 'quotedblright': 22.8, 'quoteleft': 22.8, 'quotedblleft': 22.8},
    'thin_stem': 22.0,
    'thin_stem_italic': 22.4,
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
    skel = prune(skeletonize(m), int(PRUNE_SHARE * stem))
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


def cut_faces(font_path, glyph, wght, opsz=14, scale=1.0):
    """(length, degrees from horizontal) of the cut faces on the instanced outline: straight
    segments about one stroke thick (CUT_FACE x the stem) whose neighbours on the contour are
    both curves, i.e. where a curved stroke ends. The closing segment of a contour counts. `scale`
    brings a reference font to 1000 upm."""
    import math

    from fontTools.pens.recordingPen import DecomposingRecordingPen

    from params import P

    stem = P(wght=wght, opsz=opsz).V
    gs = instance(font_path, wght, opsz).getGlyphSet()
    pen = DecomposingRecordingPen(gs)
    gs[glyph].draw(pen)
    contours, cur = [], None
    for op, args in pen.value:
        if op == 'moveTo':
            cur = (args[0], [])
        elif op == 'lineTo':
            cur[1].append(('L', args[0]))
        elif op in ('qCurveTo', 'curveTo'):
            cur[1].append(('C', args[-1]))
        elif op in ('closePath', 'endPath') and cur:
            contours.append(cur)
    return _cut_faces(contours, CUT_FACE[0] * stem, CUT_FACE[1] * stem, scale)


def _cut_faces(contours, lo, hi, scale=1.0):
    """The face finder on plain data: contours are (start, [(kind, end), ...]) with kind 'L' or
    'C'. Segments are cyclic, the implicit closing line included, so the neighbours of the first
    and last segment are the real ones."""
    import math

    out = []
    for start, ops in contours:
        segs, prev = [], start
        for kind, end in ops:
            segs.append((kind, prev, end))
            prev = end
        if prev != start:
            segs.append(('L', prev, start))
        n = len(segs)
        for i, (kind, p0, p1) in enumerate(segs):
            if kind != 'L' or segs[i - 1][0] == 'L' or segs[(i + 1) % n][0] == 'L':
                continue
            length = math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * scale
            if lo <= length <= hi:
                out.append((length, math.degrees(math.atan2(abs(p1[1] - p0[1]), abs(p1[0] - p0[0])))))
    return out


# a face shorter than this many stems is a corner chamfer, not a terminal
TERMINAL_FACE = 0.25
TERMINAL_FACE_MAX = 1.5  # longer straight edges between curves are a stroke's side, not its cut
TERMINAL_STEEP = 60.0  # degrees from horizontal
TERMINAL_MIN = 0.8  # a terminal's thickness may be this share of Inter's, and no less
TERMINAL_NONE = {('a', True)}  # the single-storey italic a has no terminal: a bowl closed by a stem
TERMINAL_GLYPHS = [g for g in APERTURE_GLYPHS if g != 'ampersand']  # Inter's & ends in diagonal strokes, not curved terminals


def outline_segments(font_path, glyph, wght, opsz=14):
    """The instanced outline as contours of ('L'|'C', [points]) segments: a quadratic keeps its
    off-curve point, a cubic its two; an implied on-curve point between off-curve points is made
    explicit. The closing line is a segment."""
    from fontTools.pens.recordingPen import DecomposingRecordingPen

    gs = instance(font_path, wght, opsz).getGlyphSet()
    pen = DecomposingRecordingPen(gs)
    gs[glyph].draw(pen)
    contours, cur, pos, start = [], None, None, None
    for op, args in pen.value:
        if op == 'moveTo':
            cur, pos, start = [], args[0], args[0]
            contours.append(cur)
        elif op == 'lineTo':
            cur.append(('L', [pos, args[0]]))
            pos = args[0]
        elif op == 'curveTo':
            cur.append(('C', [pos, *args]))
            pos = args[-1]
        elif op == 'qCurveTo':
            offs, end = list(args[:-1]), args[-1]
            p0 = pos
            for i, o in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((o[0] + offs[i + 1][0]) / 2, (o[1] + offs[i + 1][1]) / 2)
                cur.append(('C', [p0, o, nxt]))
                p0 = nxt
            pos = end
        elif op in ('closePath', 'endPath') and cur is not None and pos != start:
            cur.append(('L', [pos, start]))
    return contours


def _leaving(seg, at_end):
    """Direction in which a segment leaves its first (or, at_end, its last) point, as seen from
    that point: the first control point that is not the point itself."""
    pts = seg[1][::-1] if at_end else seg[1]
    for q in pts[1:]:
        if q != pts[0]:
            return (q[0] - pts[0][0], q[1] - pts[0][1])
    return (0.0, 0.0)


def _winding(point, polys):
    """Nonzero-winding count of `point` over closed polygons (lists of points)."""
    wn = 0
    x, y = point
    for poly in polys:
        for i, (x0, y0) in enumerate(poly):
            x1, y1 = poly[(i + 1) % len(poly)]
            if (y0 <= y) != (y1 <= y):
                t = (y - y0) / (y1 - y0)
                if x0 + t * (x1 - x0) > x:
                    wn += 1 if y1 > y0 else -1
    return wn


def _flat(segs, steps=8):
    pts = []
    for kind, p in segs:
        if kind == 'L':
            pts.append(p[0])
        else:
            for j in range(steps):
                t = j / steps
                if len(p) == 3:
                    pts.append(tuple((1 - t) ** 2 * p[0][k] + 2 * (1 - t) * t * p[1][k] + t * t * p[2][k] for k in (0, 1)))
                else:
                    pts.append(tuple((1 - t) ** 3 * p[0][k] + 3 * (1 - t) ** 2 * t * p[1][k] + 3 * (1 - t) * t * t * p[2][k] + t**3 * p[3][k] for k in (0, 1)))
    return pts


def _terminal_widths(contours, stem, scale=1.0):
    """(length, thickness) of every terminal's cut face. A terminal is a straight segment between
    two curves with a convex corner at both ends (a notch where two strokes meet is concave), that
    shows: a face with other ink right behind its outside is a join buried in a stem (a bowl's
    tapered end, the 5's bowl start). Faces are not told apart by length, so a stroke that thins to
    its cut (a short face) is measured; only faces under TERMINAL_FACE x the stem, which are
    corner chamfers, and over TERMINAL_FACE_MAX, which are a stroke's straight side, and faces steeper than TERMINAL_STEEP, which are bar and stem ends (a
    terminal's own cut is held to CUT_MAX_DEG by the terminal-cut check), are left out.
    Thickness is the stroke's width across the cut seen from the narrower end: the face times the
    sine of its corner, which is the whole face for a square cut and a sliver for a tongue, where the
    face runs on into the curve instead of turning. Ink lies on the right of an outline's direction."""
    import math

    polys = [_flat(c) for c in contours]
    out = []
    for segs in contours:
        n = len(segs)
        for i, (kind, pts) in enumerate(segs):
            prv, nxt = segs[i - 1], segs[(i + 1) % n]
            if kind != 'L' or prv[0] == 'L' or nxt[0] == 'L':
                continue
            a, b = pts
            face = (b[0] - a[0], b[1] - a[1])
            length = math.hypot(*face) * scale
            if not TERMINAL_FACE * stem <= length <= TERMINAL_FACE_MAX * stem:
                continue
            if math.degrees(math.atan2(abs(face[1]), abs(face[0]))) > TERMINAL_STEEP:
                continue
            into_a = _leaving(prv, True)  # points back along the previous segment: it arrives at a
            out_b = _leaving(nxt, False)
            # a right turn is convex: cross(arrive, face) < 0 and cross(face, leave) < 0
            if not (-into_a[0] * face[1] + into_a[1] * face[0] < 0 and face[0] * out_b[1] - face[1] * out_b[0] < 0):
                continue
            # the outside is on the left of the direction of travel; a point 3 px out that is ink is a buried join
            mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            nx, ny = -face[1] / math.hypot(*face), face[0] / math.hypot(*face)
            if _winding((mid[0] + 3 / scale * nx, mid[1] + 3 / scale * ny), polys):
                continue
            corner_a = _angle(face, into_a)
            corner_b = _angle((-face[0], -face[1]), out_b)
            out.append((length, length * min(math.sin(corner_a), math.sin(corner_b))))
    return out


def _angle(u, v):
    import math

    d = (u[0] * v[0] + u[1] * v[1]) / (math.hypot(*u) * math.hypot(*v))
    return math.acos(max(-1.0, min(1.0, d)))


def terminal_thickness(font_path, glyph, wght, opsz=14, scale=1.0):
    """[(face length, thickness)] of the terminals on the instanced outline, in px at 1000 upm
    (see `_terminal_widths`); `scale` brings a reference font there."""
    from params import P

    return _terminal_widths(outline_segments(font_path, glyph, wght, opsz), P(wght=wght, opsz=opsz).V, scale)


def notch_depth(mask, stem_side, x_height=None, baseline=None):
    """How deep the outside reaches into the bowl/arch-stem junction, in stem widths.

    In a box from one stem width either side of the stem's edge, in the x-height band (the upper
    and lower join are taken separately), take the convex hull of the ink; the depth is the
    largest distance from the hull's boundary to white that is connected to the outside (not an
    enclosed counter). Every bowl meets its stem with some concavity, so this is compared with
    Inter's for the same glyph."""
    from skimage.morphology import convex_hull_image

    x_height = getattr(mask, 'x_height', None) if x_height is None else x_height
    baseline = getattr(mask, 'baseline', None) if baseline is None else baseline
    if x_height is None or baseline is None:
        raise ValueError('notch_depth needs a raster() mask, or x_height and baseline')
    m = np.asarray(mask)
    mid = int(round(baseline - x_height / 2))
    run = _stem_run(m, mid, stem_side)
    if run is None:
        return float('nan')
    a, b = run
    stem = b - a
    edge = b if stem_side == 'left' else a
    c0, c1 = max(int(edge - stem), 0), min(int(edge + stem), m.shape[1])
    labels, _ = ndi.label(~m)
    outer = np.isin(labels, [v for v in np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])) if v])
    top, base = int(baseline - x_height), int(baseline)
    best = 0.0
    for r0, r1 in ((top - NOTCH_MARGIN, mid), (mid, base + NOTCH_MARGIN)):
        r0, r1 = max(r0, 0), min(r1, m.shape[0])
        box = np.zeros_like(m)
        box[r0:r1, c0:c1] = True
        ink = m & box
        if not ink.any():
            continue
        # outside the box counts as hull, so the box's own edges are not measured as notches
        hull = convex_hull_image(ink)
        dist = ndi.distance_transform_edt(hull | ~box)
        inside = hull & outer & box
        if inside.any():
            best = max(best, float(dist[inside].max()))
    return best / stem


ANGLE_REACH = (0.04, 0.30)  # stem widths from the stem's inner edge: where the outline's direction is read


def counter_join_angle(mask, stem_side, end='top', slant=0.0, x_height=None, baseline=None):
    """The angle, in degrees from horizontal, of the counter's outline where it meets the stem's
    inner edge: 90 = it arrives tangent to the stem (a round arch flowing into the stem), small =
    a chamfer (an oblique cut) or a square corner (0).

    The counter is the white region beside the stem at mid x-height. Its outline at `end` ('top':
    the ceiling, 'bottom': the floor) is sampled in the columns ANGLE_REACH stem widths out from
    the stem edge (the last pixel columns are the stem's own edge, which is vertical by
    construction), and the angle is that of the line fitted through those points. `slant` is the
    tangent of the italic angle: the rows are shifted back by it first, so a slanted stem reads as
    a vertical one and the window sits beside the stem at the junction's own height."""
    x_height = getattr(mask, 'x_height', None) if x_height is None else x_height
    baseline = getattr(mask, 'baseline', None) if baseline is None else baseline
    if x_height is None or baseline is None:
        raise ValueError('counter_join_angle needs a raster() mask, or x_height and baseline')
    m = np.asarray(mask)
    mid = int(round(baseline - x_height / 2))
    if slant:
        pad = int(np.ceil(abs(slant) * m.shape[0]))
        m = np.pad(m, ((0, 0), (pad, pad)))
        m = np.stack([np.roll(row, -int(round((mid - r) * slant))) for r, row in enumerate(m)])
    run = _stem_run(m, mid, stem_side)
    if run is None:
        return float('nan')
    a, b = run
    stem = b - a
    step = 1 if stem_side == 'left' else -1
    edge = b if stem_side == 'left' else a - 1
    probe = edge + step * 2
    if not 0 <= probe < m.shape[1] or m[mid, probe]:
        return float('nan')
    labels, _ = ndi.label(~m)
    counter = labels == labels[mid, probe]
    cols = [int(edge + step * c * stem) for c in np.linspace(ANGLE_REACH[0], ANGLE_REACH[1], 12)]
    xs, ys = [], []
    for c in sorted(set(cols)):
        if not counter[mid, c]:
            continue
        r = mid  # walk out from mid height: an open counter (n, u) is joined to the outside beyond its ceiling
        while 0 < r < m.shape[0] - 1 and counter[r + (-1 if end == 'top' else 1), c]:
            r += -1 if end == 'top' else 1
        xs.append(c)
        ys.append(r)
    if len(xs) < 3 or len(set(xs)) < 2:
        return float('nan')
    slope = np.polyfit(xs, ys, 1)[0]
    return float(np.degrees(np.arctan(abs(slope))))


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


def measure_angle(font_path, italic=False):
    """counter_join_angle per (glyph, wght, stem side, end) for a reference font."""
    sc = ref_scale(font_path)
    return {
        (g, w, side, end): round(counter_join_angle(raster(font_path, g, w, 14, sc), side, end, ITALIC_TAN if italic else 0.0), 1)
        for w in JOIN_WEIGHTS
        for g, js in ANGLE_JUNCTIONS.items()
        for side, end in js
    }


def measure_terminal(font_path):
    """Inter's terminal thickness per weight: the median over the aperture glyphs' faces, found the same
    way as ours. Inter's faces of no thickness (a face that runs on into its curve) are left out of the
    median: in Inter they are straight stretches of a smooth join, not cuts, and counting them would pull
    the reference to nothing; in Cascivo such a face is a tongue, and is a failure."""
    import statistics

    sc = ref_scale(font_path)
    return {
        w: round(statistics.median(t for g in TERMINAL_GLYPHS for _, t in terminal_thickness(font_path, g, w, 14, sc) if t > 1), 1)
        for w in JOIN_WEIGHTS
    }


def measure_notch_thin(font_path):
    """(notch depth per (glyph, wght), Thin ink per punctuation glyph, Thin stem) for a reference."""
    sc = ref_scale(font_path)
    notch = {}
    for w in JOIN_WEIGHTS:
        for g, side in JOIN_GLYPHS.items():
            notch[(g, w)] = None if g in JOIN_UNMEASURABLE else round(notch_depth(raster(font_path, g, w, 14, sc), side), 3)
    punct = {g: round(max_ink(raster(font_path, g, 100, 14, sc)), 1) for g in sorted(set(THIN_PUNCT.values()))}
    return notch, punct, round(max_ink(raster(font_path, 'l', 100, 14, sc)), 1)


# -- the checks ----------------------------------------------------------------------------------


def _glyph_bounds(font, name):
    gs = font.getGlyphSet()
    pen = BoundsPen(gs)
    gs[name].draw(pen)
    return pen.bounds, font['hmtx'][name][0]


def check_all(upright_vf, italic_vf):
    """Human-readable failures across both families; empty when everything passes."""
    fails = []
    for label, path, italic in (('', upright_vf, False), ('italic ', italic_vf, True)):
        suffix = '_italic' if italic else ''
        join_ref, counter_ref, sliver_ref = REF['join' + suffix], REF['counter' + suffix], REF['sliver' + suffix]
        for g in THIN_INK_GLYPHS:
            v = max_ink(raster(path, g, 100))
            if v > THIN_INK_MAX:
                fails.append(f'{label}thin ink: {g} is {v:.1f} thick at wght 100, over {THIN_INK_MAX:.1f}')
        for g, ref_g in THIN_PUNCT.items():
            limit = THIN_PUNCT_SHARE * REF['thin_punct' + suffix][ref_g] * STEM_THIN / REF['thin_stem' + suffix]
            v = max_ink(raster(path, g, 100))
            if v > limit:
                fails.append(f'{label}thin ink: {g} is {v:.1f} thick at wght 100, over {limit:.1f} ({THIN_PUNCT_SHARE} x Inter {ref_g})')
        for w in JOIN_WEIGHTS:
            for g, side in JOIN_GLYPHS.items():
                ref = join_ref.get((g, w))
                if ref is None:
                    continue
                v = join_ratio(raster(path, g, w), side)
                if not v >= ref - JOIN_SLACK:
                    fails.append(f'{label}join: {g} at wght {w} is {v:.2f}, under Inter {ref:.2f} - {JOIN_SLACK}')
        notch_ref = REF['notch' + suffix]
        for w in JOIN_WEIGHTS:
            for g, side in JOIN_GLYPHS.items():
                ref = notch_ref.get((g, w))
                if ref is None:
                    continue
                v = notch_depth(raster(path, g, w), side)
                limit = max(NOTCH_FLOOR, ref + NOTCH_SLACK)
                if not v <= limit:
                    fails.append(f'{label}notch: {g} at wght {w} is {v:.3f} stems deep, over {limit:.3f} (Inter {ref:.3f})')
        angle_ref = REF['angle' + suffix]
        for w in JOIN_WEIGHTS:
            for g, js in ANGLE_JUNCTIONS.items():
                for side, end in js:
                    ref = angle_ref.get((g, w, side, end))
                    if ref is None:
                        continue
                    v = counter_join_angle(raster(path, g, w), side, end, ITALIC_TAN if italic else 0.0)
                    if not v >= ref - ANGLE_SLACK:
                        fails.append(f'{label}join angle: {g} at wght {w} meets its stem ({side} {end}) at {v:.0f} deg, under Inter {ref:.0f} - {ANGLE_SLACK:.0f}')
        for g in APERTURE_GLYPHS:
            for length, deg in cut_faces(path, g, 900):
                if deg > CUT_MAX_DEG:
                    fails.append(f'{label}terminal cut: {g} is {deg:.1f} deg from horizontal at Black (face {length:.0f} long), over {CUT_MAX_DEG:.0f}')
        for w in JOIN_WEIGHTS:
            limit = TERMINAL_MIN * REF['terminal' + suffix][w]
            for g in TERMINAL_GLYPHS:
                widths = [t for _, t in terminal_thickness(path, g, w)]
                if not widths and (g, italic) not in TERMINAL_NONE:
                    fails.append(f'{label}terminal thickness: {g} at wght {w} has no terminal to measure')
                elif widths and min(widths) < limit:
                    fails.append(f'{label}terminal thickness: {g} at wght {w} ends {min(widths):.0f} thick, under {limit:.0f} ({TERMINAL_MIN} x Inter {REF["terminal" + suffix][w]:.0f})')
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
        if sys.argv[4:5] == ['--angle']:
            for f, it in ((sys.argv[2], False), (sys.argv[3], True)):
                print(measure_angle(f, it))
            sys.exit(0)
        if sys.argv[4:5] == ['--terminal']:
            for f in sys.argv[2:4]:
                print(measure_terminal(f))
            sys.exit(0)
        if sys.argv[4:5] == ['--notch-thin']:
            for f in sys.argv[2:4]:
                print(measure_notch_thin(f))
            sys.exit(0)
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

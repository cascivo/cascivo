"""Round 7, defect 11 leftovers (JUDGING.md): the G's spur at 800-900, the Q's tail at 400, Black's 5 foot, Regular's a bowl and the
Caption Black counters. Each test measures the defect against Inter (opsz 14, same wght) or against Cascivo's own Text master."""

import math
import os
import unittest

import numpy as np
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont

import quality as Q
from test_font import VF, ink_rows

INTER = os.environ.get('INTER_REF', '/tmp/refs/Inter.woff2')


def _rows(path, ch, wght, opsz=14):
    """ink_rows of a character on a 1000-unit em: [(y, [(x0, x1), ...]), ...]."""
    f = TTFont(path)
    gs = f.getGlyphSet(location={'wght': wght, 'opsz': opsz}, normalized=False)
    k = 1000 / f['head'].unitsPerEm
    return [(y * k, [(a * k, b * k) for a, b in runs]) for y, runs in ink_rows(gs, f.getBestCmap()[ord(ch)])]


def _mask(path, ch, wght, opsz=14, scale=1.0):
    return Q.raster(path, TTFont(path).getBestCmap()[ord(ch)], wght, opsz, scale=Q.ref_scale(path) * scale)


def g_spur_drift(path, wght):
    """Units the G's counter edge runs left over the first 40 units under the bar: 0 for a spur that stands upright there."""
    rows = _rows(path, 'G', wght)
    xmax = max(b for _, runs in rows for _, b in runs)
    bar = [y for y, runs in rows if 200 < y < 500 and len(runs) >= 2 and runs[-1][0] < xmax * 0.62]
    yb = min(bar)
    edge = {round(yb - y): runs[-1][0] for y, runs in rows if yb - 45 <= y < yb and len(runs) >= 2}
    return edge[min(edge)] - edge[min(edge, key=lambda d: abs(d - 40))]


def q_tail(path, wght):
    """(angle from horizontal, thickness, lowest point) of the Q's tail, the contour that reaches lowest, in 1000-unit em."""
    f = TTFont(path)
    gs = f.getGlyphSet(location={'wght': wght, 'opsz': 14}, normalized=False)
    pen = DecomposingRecordingPen(gs)
    gs[f.getBestCmap()[ord('Q')]].draw(pen)
    contours, cur = [], []
    for op, args in pen.value:
        if op == 'moveTo':
            cur = list(args)
        elif op in ('closePath', 'endPath'):
            contours.append(cur)
        else:
            cur += list(args)
    k = 1000 / f['head'].unitsPerEm
    tail = np.unique(np.array(min(contours, key=lambda c: min(p[1] for p in c)), float) * k, axis=0)
    c = tail - tail.mean(0)
    _, _, vt = np.linalg.svd(c)
    along, across = vt[0], vt[1]
    # Inter's tail ends on horizontal cuts, so its corners stand off the stroke: its thickness is read square to the stroke at
    # the middle of its long sides (the straight lines between the corners), not over every point
    if path == INTER:
        thick = abs(np.dot([96, 0], across))  # Inter Regular's cut is 96 units wide (outline: x 353-449 at y 228)
    else:
        thick = float(np.ptp(c @ across))
    return math.degrees(math.atan2(abs(along[1]), abs(along[0]))), thick, float(tail[:, 1].min())


def five_foot(path, wght):
    """The underside of the 5's stem: {x: lowest y} for each column of the stem, walking down from under the bar while the column stays
    inked (the stem's left part ends on its foot; its right part runs on through the bowl's start to the counter's top)."""
    rows = dict((round(y), runs) for y, runs in _rows(path, '5', wght))
    x0, x1 = rows[500][0]  # under the bar and over the bowl only the stem has ink
    lo = {}
    for x in range(int(x0) + 1, int(x1)):
        y = 500
        while y - 1 in rows and any(a <= x <= b for a, b in rows[y - 1]):
            y -= 1
        lo[x] = y
    return lo


def a_bowl_top(path, wght, at):
    """Height of the a's bowl top (its outer edge), in x-heights, at `at` of the glyph's ink width from the left."""
    m = _mask(path, 'a', wght)
    a = np.asarray(m)
    cols = np.flatnonzero(a.any(0))
    col = a[:, int(cols.min() + at * (cols.max() - cols.min()))]
    ink = np.flatnonzero(col)[::-1]  # bottom up
    runs, start, prev = [], ink[0], ink[0]
    for r in ink[1:]:
        if r != prev - 1:
            runs.append((start, prev))
            start = r
        prev = r
    runs.append((start, prev))
    return (m.baseline - runs[1][1]) / m.x_height  # the second run from the baseline is the bowl's top


def counter(path, ch, wght, opsz):
    """Largest enclosed white, in units^2 (not scaled to the x-height: a figure's height does not change with it)."""
    m = _mask(path, ch, wght, opsz)
    return Q.counter_area(m, m.x_height) * m.x_height**2


def s_upper(path, wght, opsz):
    """The s's upper counter (Q.pocket_areas), as a share of the x-height squared."""
    m = _mask(path, 's', wght, opsz, 0.5)
    return Q.pocket_areas(m)[0] / (m.x_height * 2) ** 2


@unittest.skipUnless(os.path.exists(INTER), 'the Inter reference (INTER_REF) is not here')
class R7Latin(unittest.TestCase):
    def test_g_spur_stands_upright_under_the_bar(self):
        # Before: the counter's edge ran 18 (800) and 23 (900) units left over the first 40 under the bar, an acute notch where
        # it met the bar's underside; Inter Black's runs 6 and 8.
        for w in (800, 900):
            own, ref = g_spur_drift(VF, w), g_spur_drift(INTER, w)
            self.assertLessEqual(own, max(12.0, 1.5 * ref), f'G at {w}: the spur falls away {own:.0f} units under the bar (Inter {ref:.0f})')

    def test_q_tail_reads_as_a_tail_at_regular(self):
        # Before: a 41-degree stick 71 units thick (Inter's falls at 53 degrees on a 77-unit stroke and ends 68 under the baseline).
        a, t, low = q_tail(VF, 400)
        ia, it, ilow = q_tail(INTER, 400)
        self.assertGreaterEqual(a, ia - 7, f'Q tail at 400 falls at {a:.1f} deg (Inter {ia:.1f})')
        self.assertGreaterEqual(t, 0.98 * it, f'Q tail at 400 is {t:.0f} thick (Inter {it:.0f})')
        self.assertLessEqual(low, ilow, f'Q tail at 400 reaches {low:.0f} (Inter {ilow:.0f})')
        # Black's tail is not touched (its counter gate in quality.py holds it out of the counter)
        a9, t9, low9 = q_tail(VF, 900)
        self.assertAlmostEqual(a9, 37.4, delta=0.5)
        self.assertAlmostEqual(low9, -138, delta=1.5)

    def test_black_five_foot_leans(self):
        # Before: the stem's foot was flat (a shelf level with the counter's top, the white under it a slit) and the bowl's start
        # read as a swelling there; Inter Black's foot rises 0.2 to the left, the white under it a wedge.
        for w in (800, 900):
            lo = five_foot(VF, w)
            xs = sorted(lo)[:-2]  # the stem's last columns run down its right edge
            run = (xs[-1] - xs[0]) // 2
            rise = (lo[xs[0] + 5] - lo[xs[0] + 5 + run]) / run
            self.assertGreaterEqual(rise, 0.12, f'5 at {w}: the foot rises {rise:.2f} to the left')
            # and, at Black, falls evenly: no tooth or step along it (the bowl's start must stay hidden above it). Bold's stem corner
            # stands 9 units under the counter's top at its right edge, as before this round (Regular ends its stem inside the bowl)
            if w == 900:
                steps = [lo[x] - lo[x + 1] for x in xs[:-1]]
                self.assertGreaterEqual(min(steps), -2.0, f'5 at {w}: the foot has a step of {-min(steps):.1f} units')

    def test_regular_a_bowl_stands_as_high_as_inters(self):
        # Before: at 400 the bowl's top sat 0.007-0.014 x-heights under Inter's (0.528 / 0.555 / 0.568 against 0.542 / 0.562 / 0.575)
        for w in (400, 500):
            for at in (0.35, 0.45):
                own, ref = a_bowl_top(VF, w, at), a_bowl_top(INTER, w, at)
                self.assertGreaterEqual(own, ref - 0.002, f'a at {w}: bowl top at {at} of its width is {own:.3f} x-heights (Inter {ref:.3f})')
        # Black's bowl is not moved
        self.assertAlmostEqual(a_bowl_top(VF, 900, 0.35), 0.58, delta=0.003)
        self.assertAlmostEqual(a_bowl_top(VF, 900, 0.45), 0.591, delta=0.003)

    def test_caption_black_counters_stay_open(self):
        # Before: at 900 / opsz 8 the 6 and 9 counters were 0.83x Text Black's (28.5k units^2 against 34.4k) and the s's upper
        # counter 0.87x as a share of the x-height squared: Caption's flatter contrast filled in their horizontals.
        for ch in '69':
            cap, text = counter(VF, ch, 900, 8), counter(VF, ch, 900, 14)
            self.assertGreaterEqual(cap / text, 0.97, f'{ch} at 900/8: counter {cap:.0f} against Text Black {text:.0f}')
        cap, text = s_upper(VF, 900, 8), s_upper(VF, 900, 14)
        self.assertGreaterEqual(cap / text, 0.97, f's at 900/8: upper counter {cap:.4f} against Text Black {text:.4f}')


if __name__ == '__main__':
    unittest.main()

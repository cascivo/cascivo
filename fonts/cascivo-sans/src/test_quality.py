"""Guards for the quality metrics themselves, and the starting point they document.

    python3 -I -m unittest discover -s src
"""

import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402

import glyphs as GL  # noqa: E402
import quality as Q  # noqa: E402
from build import italicize  # noqa: E402
from geom import cap_lines, expand, reverse_seg  # noqa: E402
from params import P  # noqa: E402

DIST = os.path.join(HERE, '..', 'fonts')
VF = os.path.join(DIST, 'CascivoSans[opsz,wght].ttf')
VFI = os.path.join(DIST, 'CascivoSans-Italic[opsz,wght].ttf')


def pad(a, n=10):
    return np.pad(a, n)


class Metrics(unittest.TestCase):
    def test_metrics_on_synthetic_shapes(self):
        bar = pad(np.ones((20, 100), bool))
        self.assertAlmostEqual(Q.max_ink(bar), 20, delta=1)

        ring = np.ones((100, 100), bool)
        ring[30:70, 30:70] = False
        self.assertGreater(Q.counter_area(pad(ring), 50.0), 0)
        self.assertEqual(Q.counter_area(pad(np.ones((40, 40), bool)), 50.0), 0)

        sq = np.zeros((100, 100), bool)
        sq[30:80, 30:80] = True
        spiked = sq.copy()
        spiked[54:56, 80:98] = True  # a 2 px spike, 36 px^2: all but its root, where the disk still fits
        self.assertLess(Q.sliver_area(pad(sq)), 20)  # a sharp corner leaves a few px, not a spike
        self.assertGreaterEqual(Q.sliver_area(pad(spiked)), 30)

    def test_max_ink_ignores_dots(self):
        m = np.zeros((120, 120), bool)
        m[10:40, 10:40] = True  # a 30 px square dot
        m[60:70, 10:110] = True  # a 10 px bar
        self.assertAlmostEqual(Q.max_ink(m), 10, delta=1)

    def test_cap_lines_match_expand(self):
        p = P(wght=400, opsz=14)
        checked = 0
        for name in GL.ORDER:
            g = GL.G(p)
            GL.GLYPHS[name][1](g, p)
            for s in italicize(g.strokes, p):
                if s.closed:
                    continue
                caps = cap_lines(s, p.V, p.H)
                self.assertEqual(len(caps), 2)
                (contour,) = expand(s, p.V, p.H)
                have = set(contour) | {reverse_seg(c) for c in contour}
                for c in caps:
                    self.assertIn(c, have)
                checked += 1
            if checked >= 20:
                break
        self.assertGreaterEqual(checked, 20)

    def test_raster_has_counters_and_baseline(self):
        o = Q.raster(VF, 'o', 400)
        self.assertGreater(Q.counter_area(o, o.x_height), 0.05)
        i = Q.raster(VF, 'i', 400)
        self.assertLess(Q.max_ink(i), 100)  # the tittle is a dot and is left out; the stem governs


@unittest.skipUnless(os.path.exists(VF) and os.path.exists(VFI), 'fonts not built')
class StartingPoint(unittest.TestCase):
    def test_current_font_fails_the_new_checks(self):
        """Documents today's defects; WP5 flips this to test_font_passes_quality_checks.

        Measured, not assumed: of the defects the plan expected, `comma` stays under the Thin ink
        limit (42 of 55), no upright join falls under Inter's, and `s` and `c` cuts are already
        within 35 degrees; the metrics were not bent to make them fail."""
        failures = Q.check_all(VF, VFI)
        text = '\n'.join(failures)
        for needle in ('thin ink: t ', 'terminal cut: d ', 'terminal cut: a ', 'sidebearings: x ', 'sidebearings: l '):
            self.assertIn(needle, text)


if __name__ == '__main__':
    unittest.main()

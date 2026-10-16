"""Guards for fillet.py, the rounding of counter tips.

    python3 -I -m unittest discover -s src
"""

import math
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402
from skimage.draw import polygon  # noqa: E402

import fillet  # noqa: E402
from geom import L, flatten  # noqa: E402


def poly(pts):
    return [L(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts))]


def rect(x0, y0, x1, y1):
    """A clockwise (outer, y up) rectangle as segments."""
    return poly([(x0, y0), (x0, y1), (x1, y1), (x1, y0)])


def ink(contours, size=1600):
    """Ink at 4 px per unit, offset a quarter pixel so that no edge runs through a pixel centre."""
    wind = np.zeros((size, size), int)
    for c in contours:
        pts = np.array(flatten(c, 32)) * 4 + 0.25
        area = 0.5 * np.sum(pts[:, 0] * np.roll(pts[:, 1], -1) - np.roll(pts[:, 0], -1) * pts[:, 1])
        rr, cc = polygon(pts[:, 1], pts[:, 0], wind.shape)
        wind[rr, cc] += 1 if area > 0 else -1
    return wind != 0


class Fillet(unittest.TestCase):
    # two bars cross as an L: the white quadrant beyond (100, 100) ends in a right-angled point
    # (each has a vertex at the corner, as a stroke's edge has at its cap: the round is measured from it)
    A = poly([(0, 0), (0, 300), (100, 300), (100, 100), (100, 0)])
    B = poly([(0, 0), (0, 100), (100, 100), (300, 100), (300, 0)])
    NEAR = (100, 100)

    def test_a_right_angle_gets_a_circular_round(self):
        r = 20.0
        ref = fillet.reference(self.A, self.B, self.NEAR, r, 100.0)
        patch = fillet.patch(self.A, self.B, ref, 100.0)
        before, after = ink([self.A, self.B]), ink([self.A, self.B, patch])
        self.assertTrue(np.all(after >= before), 'the patch only adds ink')
        added = (after & ~before).sum() / 16
        self.assertAlmostEqual(added, r * r * (1 - math.pi / 4), delta=0.12 * r * r * (1 - math.pi / 4))
        ys, xs = np.nonzero(after & ~before)
        self.assertLessEqual(xs.max() / 4, 100 + 21)
        self.assertLessEqual(ys.max() / 4, 100 + 21)  # nothing beyond the corner's own square

    def test_the_patch_has_one_cubic_and_two_lines_whatever_the_size(self):
        for r in (4.0, 20.0, 40.0):
            ref = fillet.reference(self.A, self.B, self.NEAR, r, 100.0)
            kinds = ''.join(s[0] for s in fillet.patch(self.A, self.B, ref, 100.0))
            self.assertIn(kinds, ('CLL', 'LLC'))  # which way round is fixed by the reference, not by the size
            self.assertEqual(kinds, ''.join(s[0] for s in fillet.patch(self.A, self.B, ref, 60.0)))

    def test_a_smaller_unit_gives_a_smaller_round(self):
        ref = fillet.reference(self.A, self.B, self.NEAR, 30.0, 100.0)
        areas = [(ink([self.A, self.B, fillet.patch(self.A, self.B, ref, u)]) & ~ink([self.A, self.B])).sum() / 16 for u in (100.0, 50.0)]
        self.assertGreater(areas[0], 3 * areas[1])

    def test_no_crossing_near_the_tip_is_reported(self):
        self.assertIsNone(fillet.reference(self.A, rect(200, 200, 300, 300), (250, 250), 20.0, 100.0))


if __name__ == '__main__':
    unittest.main()

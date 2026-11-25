"""Round 7: Ч ч Ћ Ђ ђ and α are drawn on the Latin n h u d q constructions (glyphs.shoulder, u_arch, _bowl_lc), so their
joins read as the Latin letters' at every weight, upright and italic. Each is measured with quality.py's own join_ratio and
notch_depth, the same way for the Cyrillic or Greek glyph and its Latin counterpart.

    python3 -I -m unittest test_r7_cyrgreek      (after a build)
"""

import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402

import quality as Q  # noqa: E402
from test_font import VF, VFI  # noqa: E402

CAP = 700  # Cascivo's cap height (the Ћ's arch sits at CAP * 0.62, glyphs._tshe)


def run_thickness(mask, last):
    """Ink run, in px, in the column midway across the glyph, the first from the top (an arch's crown) or the last (a u's floor)."""
    a = np.asarray(mask)
    cols = np.flatnonzero(a.any(0))
    rows = np.flatnonzero(a[:, (cols[0] + cols[-1]) // 2])
    breaks = np.flatnonzero(np.diff(rows) > 1)
    starts = np.r_[rows[0], rows[breaks + 1]]
    ends = np.r_[rows[breaks], rows[-1]]
    return int((ends[-1] - starts[-1] if last else ends[0] - starts[0]) + 1)


def hung_arch(mask):
    """Ч ч's arch as a u: the rows down to the arch's floor (the lowest ink midway across), which quality.py reads as a u whose
    baseline is that floor. Returns (mask, baseline)."""
    a = np.asarray(mask)
    cols = np.flatnonzero(a.any(0))
    floor = np.flatnonzero(a[:, (cols[0] + cols[-1]) // 2])[-1]
    return a[: floor + 1].copy(), floor + 1


class CyrGreekJoins(unittest.TestCase):
    def test_dje_shoulder_is_the_h_shoulder(self):
        # ђ's arch was its own g.arc (taper 0.5, no drawn edge): at Black its join read 0.81 where h's reads 0.40
        for path, weights in ((VF, (100, 400, 700, 900)), (VFI, (400, 700, 900))):
            for w in weights:
                h, dje = Q.raster(path, 'h', w), Q.raster(path, 'uni0452', w)
                with self.subTest(font=os.path.basename(path), wght=w):
                    self.assertAlmostEqual(Q.join_ratio(dje, 'left'), Q.join_ratio(h, 'left'), delta=0.10)
                    self.assertAlmostEqual(Q.notch_depth(dje, 'left'), Q.notch_depth(h, 'left'), delta=0.15)

    def test_tshe_shoulder_is_the_h_shoulder(self):
        # Ћ's arch sits under the capital's bar (0.62 of the cap), so it is read in its own band; its join and notch are h's
        for path, weights in ((VF, (100, 400, 700, 900)), (VFI, (700, 900))):
            for w in weights:
                h, tshe = Q.raster(path, 'h', w), Q.raster(path, 'uni040B', w)
                with self.subTest(font=os.path.basename(path), wght=w):
                    self.assertAlmostEqual(Q.join_ratio(tshe, 'left', CAP * 0.62, tshe.baseline), Q.join_ratio(h, 'left'), delta=0.10)
                    self.assertAlmostEqual(Q.notch_depth(tshe, 'left', CAP * 0.62, tshe.baseline), Q.notch_depth(h, 'left'), delta=0.30)

    def test_che_join_is_the_u_join(self):
        # ч and Ч are the u's arch hung from the top. Black's ч was 0.24 em narrower than Inter's and its counter had closed
        # to 88 units, so its join could not be read at all (nan); the join is u's within 0.10
        for w in (100, 400, 600, 700, 900):
            u = Q.raster(VF, 'u', w)
            for name, height in (('uni0447', 528 * 0.70), ('uni0427', CAP * 0.70)):
                m, baseline = hung_arch(Q.raster(VF, name, w))
                with self.subTest(glyph=name, wght=w):
                    self.assertAlmostEqual(Q.join_ratio(m, 'right', height, baseline), Q.join_ratio(u, 'right'), delta=0.10)

    def test_che_arch_is_as_thick_as_the_u_floor(self):
        for path, weights in ((VF, (100, 400, 700, 900)), (VFI, (100, 400))):
            for w in weights:
                u = run_thickness(Q.raster(path, 'u', w), True)
                for name in ('uni0447', 'uni0427'):
                    with self.subTest(font=os.path.basename(path), glyph=name, wght=w):
                        self.assertAlmostEqual(run_thickness(Q.raster(path, name, w), True), u, delta=max(4, 0.07 * u))

    def test_alpha_bowl_joins_like_d_and_q(self):
        # α's bowl was a bare arc at taper 0.55 meeting the stem at 28 degrees: Black read 0.85 (d 0.39) and 25 degrees (d 54)
        for path, weights in ((VF, (100, 400, 700, 900)), (VFI, (400, 900))):
            for w in weights:
                alpha, d, q = (Q.raster(path, n, w) for n in ('alpha', 'd', 'q'))
                with self.subTest(font=os.path.basename(path), wght=w):
                    self.assertAlmostEqual(Q.join_ratio(alpha, 'right'), Q.join_ratio(q, 'right'), delta=0.10)
                    self.assertLessEqual(Q.notch_depth(alpha, 'right'), Q.notch_depth(d, 'right') + 0.10)
        a, d = Q.raster(VF, 'alpha', 900), Q.raster(VF, 'd', 900)
        self.assertGreaterEqual(Q.counter_join_angle(a, 'right', 'top'), Q.counter_join_angle(d, 'right', 'top') - 10)

    def test_no_slivers_beyond_the_latin_letters(self):
        # a spur or a crack at a join is where the redrawn edge went wrong: no more thin ink than the h, u and d they follow
        for path in (VF, VFI):
            for w in (100, 400, 900):
                for name, latin in (('uni0452', 'h'), ('uni040B', 'h'), ('uni0447', 'u'), ('uni0427', 'u'), ('alpha', 'd')):
                    with self.subTest(font=os.path.basename(path), glyph=name, wght=w):
                        self.assertLessEqual(Q.sliver_area(Q.raster(path, name, w)), Q.sliver_area(Q.raster(path, latin, w)) + 6)

    def test_ч_keeps_its_regular_width(self):
        # the Black widening (cyrillic.CHE_HEAVY) is heavy-only: Regular's advance is a855b5e0's (test_font pins every glyph's)
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont

        f = instantiateVariableFont(TTFont(VF), {'wght': 400, 'opsz': 14})
        self.assertEqual(f['hmtx']['uni0447'][0], 520)


if __name__ == '__main__':
    unittest.main()

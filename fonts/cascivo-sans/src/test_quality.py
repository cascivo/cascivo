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


class CounterJoinAngle(unittest.TestCase):
    @staticmethod
    def stem_with_ceiling(ceiling):
        """A 40 px stem on the left and a ceiling over a counter on its right; ceiling(x) is the row
        the ink reaches down to at column x (rows grow downward)."""
        m = np.zeros((260, 240), bool)
        m[30:230, 0:40] = True
        for x in range(40, 240):
            m[30 : int(ceiling(x)), x] = True
        mask = m.view(Q.Ink)
        mask.baseline, mask.x_height = 230, 200
        return mask

    def test_square_corner_chamfer_and_tangent_arch_read_apart(self):
        square = self.stem_with_ceiling(lambda x: 60)
        chamfer = self.stem_with_ceiling(lambda x: max(60, 120 - (x - 40)))
        arch = self.stem_with_ceiling(lambda x: max(60, 120 - 4 * (x - 40)))
        a = [Q.counter_join_angle(m, 'left', 'top') for m in (square, chamfer, arch)]
        self.assertAlmostEqual(a[0], 0, delta=3)
        self.assertAlmostEqual(a[1], 45, delta=6)
        self.assertAlmostEqual(a[2], 76, delta=6)

    def test_slant_is_undone_before_reading(self):
        upright = self.stem_with_ceiling(lambda x: max(60, 120 - 4 * (x - 40)))
        tan = 0.1763
        shifted = np.stack([np.roll(np.pad(row, 40), int(round((130 - r) * tan))) for r, row in enumerate(np.asarray(upright))]).view(Q.Ink)
        shifted.baseline, shifted.x_height = 230, 200
        self.assertAlmostEqual(Q.counter_join_angle(shifted, 'left', 'top', tan), Q.counter_join_angle(upright, 'left', 'top'), delta=8)


@unittest.skipUnless(os.path.exists(VF) and os.path.exists(VFI), 'fonts not built')
class StartingPoint(unittest.TestCase):
    def test_current_font_fails_the_new_checks(self):
        """Documents today's defects; WP5 flips this to test_font_passes_quality_checks.

        WP2 fixed the terminals and WP3 the Thin ink, so those checks are not among them any more."""
        failures = Q.check_all(VF, VFI)
        text = '\n'.join(failures)
        for needle in ('sidebearings: x ',):
            self.assertIn(needle, text)

    def test_thin_punctuation_and_t_foot_follow_the_hairline(self):
        """WP3: at Thin the comma, semicolon and quotes are ticks (not wedges as thick as a dot), the t's foot
        does not clot, and the a's bowl does not swell beside its stem, in both families."""
        text = '\n'.join(Q.check_all(VF, VFI))
        self.assertNotIn('thin ink:', text)

    def test_joins_flow_into_the_stem(self):
        """WP1: bowls and arches leave their stems tangentially, in both families, at every checked weight."""
        text = '\n'.join(Q.check_all(VF, VFI))
        for needle in ('join:', 'notch:', 'join angle:'):
            self.assertNotIn(needle, text)

    def test_heavy_terminals_are_clean_cuts(self):
        """WP2: aperture terminals are cut across the stroke within 35 degrees of flat and are a stroke thick
        (no tongue, no blade), at Black and at the weights Inter is measured at, in both families."""
        text = '\n'.join(Q.check_all(VF, VFI))
        for needle in ('terminal cut:', 'terminal thickness:'):
            self.assertNotIn(needle, text)

    def test_italic_nine_ends_in_a_clean_cut(self):
        """The italic nine's tail was cut at 80 degrees (a vertical face); it ends like the six's hook turned round."""
        (face,) = Q.cut_faces(VFI, 'nine', 900)
        self.assertLessEqual(face[1], Q.CUT_MAX_DEG)

    def test_eng_and_mu_share_the_arch_of_n_and_u(self):
        """The join construction is shared, not copied: eng's arch is n's and mu's bowl, at its right join, is u's.
        Compared as ink in the band they share, at wght 400 and 900 (the masters) and 250 and 650 (between)."""

        def band(path, glyph, wght, lo, hi):
            m = Q.raster(path, glyph, wght)
            xh = m.x_height
            # right third only: u's left stem and bowl are one continuous stroke, but mu's left stem is a
            # separate stem the bowl joins (thinned by join_taper), so the left halves differ by design
            return np.asarray(m)[int(m.baseline - hi * xh) : int(m.baseline - lo * xh), m.shape[1] * 2 // 3 :]

        for wght in (250, 400, 650, 900):
            for a, b, lo, hi in (('n', 'eng', 0.55, 1.0), ('u', 'mu', 0.0, 0.45)):
                ra, rb = band(VF, a, wght, lo, hi), band(VF, b, wght, lo, hi)
                self.assertEqual(ra.shape, rb.shape, f'{b} and {a} differ in size at wght {wght}')
                # a few px of fit difference (u is one continuous stroke, mu two); the old construction differed by thousands
                self.assertLessEqual(int((ra ^ rb).sum()), 16, f'{b} at wght {wght} does not match {a}')

    def test_cut_faces_of_shallow_and_steep_cuts(self):
        shallow = ((0, 0), [('C', (100, 50)), ('L', (290, 80)), ('C', (400, 200))])  # ~9 degrees, 192 long
        steep = ((0, 0), [('C', (100, 50)), ('L', (200, 215)), ('C', (400, 200))])  # ~59 degrees, 193 long
        (face,) = Q._cut_faces([shallow], 150, 220)
        self.assertAlmostEqual(face[1], 9.0, delta=1)
        (face,) = Q._cut_faces([steep], 150, 220)
        self.assertAlmostEqual(face[1], 59.0, delta=1)
        self.assertEqual(Q._cut_faces([shallow], 250, 300), [])  # too long or too short is not a cut face

    def test_cut_faces_neighbours_wrap_around_the_contour(self):
        # starts on a line next to a stem-length line: the closing line's next segment is that
        # first line, so it is a stem edge and not a face (the moveTo is not a segment)
        c = ((0, 0), [('L', (200, 0)), ('C', (300, 100)), ('C', (200, 190)), ('L', (0, 190))])
        self.assertEqual(Q._cut_faces([c], 150, 220), [])
        self.assertEqual(Q._cut_faces([((0, 0), [('L', (0, 190)), ('C', (100, 300)), ('C', (200, 0))])], 150, 220), [])

    def test_terminal_width_square_cut_and_tongue(self):
        # a 190 stem ending in a square cut between two curves, wound clockwise (ink on the right)
        square = [[('C', [(0, 0), (50, 60), (100, 190)]), ('L', [(100, 190), (290, 190)]), ('C', [(290, 190), (330, 100), (300, -50)]), ('L', [(300, -50), (0, 0)])]]
        # the same cut running on into the curve behind it: the tongue of a heavy s
        tongue = [[('C', [(0, 0), (50, 60), (100, 190)]), ('L', [(100, 190), (290, 190)]), ('C', [(290, 190), (390, 188), (480, 170)]), ('L', [(480, 170), (0, 0)])]]
        (face,) = Q._terminal_widths(square, 190)
        self.assertGreater(face[1], 0.9 * 190)  # a (nearly) square cut keeps its whole face
        (face,) = Q._terminal_widths(tongue, 190)
        self.assertLess(face[1], 0.4 * 190)  # a face that runs on into the curve has no thickness
        # a notch (a concave corner) is where two strokes meet, not a terminal
        notch = [[('C', [(100, 190), (50, 60), (0, 0)]), ('L', [(0, 0), (190, 0)]), ('C', [(190, 0), (300, 100), (290, 190)]), ('L', [(290, 190), (100, 190)])]]
        self.assertEqual(Q._terminal_widths(notch, 190), [])

    def test_terminal_width_ignores_buried_joins_and_short_tongues_count(self):
        square = [('C', [(0, 0), (50, 60), (100, 190)]), ('L', [(100, 190), (290, 190)]), ('C', [(290, 190), (330, 100), (300, -50)]), ('L', [(300, -50), (0, 0)])]
        # a stem covering the face's outside: the face is a join hidden in it
        stem = [('L', [(60, 230), (330, 230)]), ('L', [(330, 230), (330, 192)]), ('L', [(330, 192), (60, 192)]), ('L', [(60, 192), (60, 230)])]
        self.assertEqual(Q._terminal_widths([square, stem], 190), [])
        # a short face is measured, not skipped for its length: a stroke thinned to its cut
        thin = [('C', [(0, 0), (50, 60), (100, 190)]), ('L', [(100, 190), (180, 190)]), ('C', [(180, 190), (220, 100), (190, -50)]), ('L', [(190, -50), (0, 0)])]
        (face,) = [f for f in Q._terminal_widths([thin], 190) if f[0] < 100]
        self.assertLess(face[1], 0.8 * 190)
        # a steep face is a bar or stem end, not a terminal
        bar = [('C', [(0, 0), (50, 60), (100, 190)]), ('L', [(100, 190), (110, 380)]), ('C', [(110, 380), (200, 300), (300, 0)]), ('L', [(300, 0), (0, 0)])]
        self.assertEqual(Q._terminal_widths([bar], 190), [])

    def test_terminal_thickness_on_the_built_font(self):
        """Inter's terminals are a stem thick; so are ours."""
        widths = [t for _, t in Q.terminal_thickness(VF, 'c', 900)]
        self.assertEqual(len(widths), 2)
        self.assertTrue(all(t > 0.9 * 190 * 0.9 for t in widths))
        # every aperture glyph has terminals to measure (the single-storey italic a is the one exception),
        # tongues and all: a glyph measuring nothing must fail, not pass for want of a face
        for g in Q.TERMINAL_GLYPHS:
            self.assertTrue(Q.terminal_thickness(VF, g, 900), g)
            self.assertTrue(Q.terminal_thickness(VFI, g, 900) or (g, True) in Q.TERMINAL_NONE, g)

    def test_cut_faces_found_on_the_built_font(self):
        faces = Q.cut_faces(VF, 'c', 900)
        self.assertEqual(len(faces), 2)
        self.assertTrue(all(deg <= Q.CUT_MAX_DEG for _, deg in faces))


if __name__ == '__main__':
    unittest.main()

"""Guards for the quality metrics themselves, and the starting point they document.

    python3 -I -m unittest discover -s src
"""

import os
import sys
import unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402
from fontTools.pens.boundsPen import BoundsPen  # noqa: E402

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


class TerminalLeans(unittest.TestCase):
    """A horizontal cut passes silently only as the e's bar face; on any other letter it reads lean 0."""

    def leans(self, glyph, face_y):
        stem = 150.0
        a, b = (0, face_y - 200), (200, face_y)
        d, e = (200 + stem, face_y), (500, face_y - 200)
        contour = [('C', [a, (0, face_y - 50), (100, face_y), b]), ('L', [b, d]), ('C', [d, (400, face_y), (500, face_y - 50), e]),
                   ('C', [e, (500, face_y - 450), (0, face_y - 450), a])]
        with mock.patch.object(Q, 'outline_segments', return_value=[contour]), mock.patch.object(Q, '_stem', return_value=stem):
            return Q.terminal_leans('unused.ttf', glyph, 900)

    def test_flat_cut_on_a_curve_letter_is_reported(self):
        self.assertEqual(self.leans('s', 500), [0.0])
        self.assertEqual(self.leans('s', 264), [-0.0])  # near mid x-height too: only the e is exempt
        self.assertEqual(self.leans('e', 500), [0.0])

    def test_the_e_bar_face_is_skipped(self):
        self.assertEqual(self.leans('e', 264), [])


@unittest.skipUnless(os.path.exists(VF) and os.path.exists(VFI), 'fonts not built')
class StartingPoint(unittest.TestCase):
    def test_font_passes_quality_checks(self):
        self.assertEqual(Q.check_all(VF, VFI), [])

    def test_thin_punctuation_and_t_foot_follow_the_hairline(self):
        """WP3: at Thin the comma, semicolon and quotes are ticks (not wedges as thick as a dot), the t's foot
        does not clot, and the a's bowl does not swell beside its stem, in both families."""
        text = '\n'.join(Q.check_all(VF, VFI))
        self.assertNotIn('thin ink:', text)
        for path in (VF, VFI):
            # the generic limit (2.5 stems) is above the base a (40) and t (61): these are glyph-specific
            # upright base a was 40 and is 28 now. The italic a is the single-storey bowl d, b and p share, and
            # its tangent join is as heavy as Inter's own (Inter Italic a 38.8, d 38.5; ours 37.9, d 38.1): unchanged
            # by WP3, so it is held to Inter's, not to the upright's.
            limit = 32 if path == VF else 38.8
            self.assertLessEqual(Q.max_ink(Q.raster(path, 'a', 100)), limit, f'{path}: a swells beside its stem')
            self.assertLessEqual(Q.max_ink(Q.raster(path, 't', 100)), 1.6 * Q.STEM_THIN, f'{path}: t clots in its foot')

    def test_thin_comma_and_quotes_are_long_enough_to_read(self):
        """A tick narrowed to the hairline must not also shrink to a speck: at 14 px a 30 x 88 unit comma read as a
        period. Inter's Thin comma descends 0.267 x-heights and is 0.403 tall (quotes: 0.403 tall); ours keeps >= 0.7 of that."""
        for path in (VF, VFI):
            font = Q.instance(path, 100)
            xh = Q.x_height_of(font)
            gs = font.getGlyphSet()

            def bounds(name):
                pen = BoundsPen(gs)
                gs[name].draw(pen)
                return pen.bounds

            for name in ('comma', 'semicolon'):
                self.assertLessEqual(bounds(name)[1], -0.7 * 0.267 * xh, f'{path}: {name} does not descend')
            for name in ('comma', 'quoteright', 'quotedblright', 'quoteleft', 'quotedblleft'):
                b = bounds(name)
                self.assertGreaterEqual(b[3] - b[1], 0.7 * 0.403 * xh, f'{path}: {name} is a speck')

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

    def test_black_counters_and_letters_pass_the_wp4_checks(self):
        """WP4: Black counters keep Inter's proportions; a joins its stem like b and d, a, g and 9 end in a flat
        face, f has no bite, t has a flat top, l keeps its tail inside its advance, 1 has a short flag, 0 is wide."""
        text = '\n'.join(Q.check_all(VF, VFI))
        for needle in ('counter:', 'notch: a ', 'join: a ', 'join angle: a ', 'flat terminal:', 'terminal corners:', 'aperture:', 'crevice:', 't top:', 'zero width:', 'flag:', 'sidebearings: l '):
            self.assertNotIn(needle, text)

    def test_black_a_keeps_its_terminal_over_the_bowl_and_opens_its_counter(self):
        """The a's top arc ends inside the bowl's width and its counter rises toward the stem, at 650 and Black, as Inter's do."""
        for w, (_, ref_area, ref_slope, ref_aspect) in Q.REF['a_shape'].items():
            over, area, slope, aspect = Q.a_shape(Q.raster(VF, 'a', w))
            self.assertGreaterEqual(aspect, Q.A_ASPECT_MIN_SHARE * ref_aspect, f'a wide teardrop, not a slot, at {w}')
            self.assertLessEqual(over, Q.A_OVERHANG_MAX, f'overhang at {w}')
            self.assertGreaterEqual(area, Q.A_COUNTER_MIN_SHARE * ref_area, f'counter at {w}')
            self.assertLessEqual(area, Q.COUNTER_MAX['a'] * ref_area, f'counter at {w} stays within the cap')
            self.assertGreaterEqual(slope, Q.A_SLOPE_MIN, f'slope at {w}')

    def test_a_shape_reads_a_beak_and_a_box(self):
        """A mask whose top bar hangs left of a small box reads as an overhang, a flat-topped hole as no slope."""
        m = np.zeros((200, 200), bool)
        m[40:70, 20:150] = True   # top bar from x=20
        m[70:170, 60:150] = True  # body from x=60
        m[100:150, 90:120] = False  # a flat-topped hole
        m = m.view(Q.Ink)
        m.x_height, m.baseline = 130, 170
        over, area, slope, aspect = Q.a_shape(m)
        self.assertAlmostEqual(over, 40 / 130, places=2)
        self.assertAlmostEqual(slope, 0.0, places=1)
        self.assertGreater(area, 0)

    def test_per_stroke_tilt_flattens_only_its_own_terminal(self):
        """A stroke's tilt replaces the shared HEAVY_TILT for its cut='t' ends, and nothing else."""
        from geom import HEAVY_TILT, _heavy_cut
        import math

        tan = (math.cos(math.radians(-60)), math.sin(math.radians(-60)))
        shared = _heavy_cut(tan, 190, 0.0, 't')
        flat = _heavy_cut(tan, 190, 0.0, 't', 15)
        face = lambda c: math.degrees(math.atan2(abs(c[0]), abs(c[1])))  # noqa: E731  the cut line is perpendicular to its normal
        self.assertAlmostEqual(face(shared), math.degrees(HEAVY_TILT), delta=0.5)
        self.assertAlmostEqual(face(flat), 15, delta=0.5)
        self.assertEqual(_heavy_cut(tan, 190, 0.0, 't', None), shared)

    def test_l_tail_ends_square_and_y_tail_ends_flat(self):
        """The l's tail ends in a vertical face and the y's curl ends horizontal (a vertical face), at every master."""
        for wght, opsz in ((100, 14), (400, 14), (900, 14), (400, 8), (400, 48)):
            p = P(wght=wght, opsz=opsz)
            g = GL.G(p)
            GL.GLYPHS['l'][1](g, p)
            (a, b) = cap_lines(g.strokes[0], p.V, p.H)[0][1:]
            self.assertAlmostEqual(a[0], b[0], delta=0.5, msg=f'l tail face at wght {wght} opsz {opsz}')
            g = GL.G(p)
            GL.GLYPHS['y'][1](g, p)
            tail = [s for s in g.strokes if s.segs[-1][0] == 'C'][0]
            (a, b) = cap_lines(tail, p.V, p.H)[0][1:]
            self.assertLessEqual(abs(a[0] - b[0]), 0.09 * abs(a[1] - b[1]), f'y tail face at wght {wght} opsz {opsz}')  # vertical within 5 degrees
            self.assertGreaterEqual(min(a[1], b[1]), p.desc - 1, f'y tail clears the descender at wght {wght} opsz {opsz}')

    def test_y_tail_never_turns_back(self):
        """The y's tail curls one way, from Thin to Black: its direction never turns the other way (an S-kink at
        wght 100-300 once did) and its x never reverses."""
        from geom import seg_point

        for wght in (100, 175, 250, 325, 400, 900):
            p = P(wght=wght, opsz=14)
            g = GL.G(p)
            GL.GLYPHS['y'][1](g, p)
            tail = [s for s in g.strokes if s.segs[-1][0] == 'C'][0]
            pts = [seg_point(tail.segs[-1], i / 40) for i in range(41)]
            xs = [q[0] for q in pts]
            self.assertTrue(all(b <= a + 0.5 for a, b in zip(xs, xs[1:])), f'y tail reverses at wght {wght}')
            cross = [(b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) for a, b, c in zip(pts, pts[1:], pts[2:])]
            # one-sided, give or take the tail's own slight S where its end turns to horizontal (0.22 of the main
            # turn at Thin; the straight-to-curl blend it replaces read 0.4-0.74 from wght 100 to 250)
            self.assertLessEqual(max(cross), 0.25 * -min(cross), f'y tail S-kinks at wght {wght}')

    def test_pocket_areas_tell_a_slit_from_an_open_counter(self):
        # a C-shape whose mouth is 24 px wide: the closing disk fills it, and a slit (4 px) encloses far less
        wide, slit = np.ones((120, 120), bool), np.ones((120, 120), bool)
        wide[30:90, 30:100] = False
        wide[30:90, 100:] = False
        slit[55:65, 30:100] = False
        slit[55:65, 100:] = False
        self.assertGreater(sum(Q.pocket_areas(pad(wide))), 4 * sum(Q.pocket_areas(pad(slit))))

    def test_enclosed_areas_are_ordered_left_to_right(self):
        m = np.ones((60, 120), bool)
        m[10:50, 10:40] = False  # 1200
        m[20:40, 60:110] = False  # 1000
        self.assertEqual(Q.enclosed_areas(m), [1200, 1000])
        self.assertEqual(Q.enclosed_areas(m, count=1), [1200])

    def test_counter_solidity_sees_ink_poking_in(self):
        m = np.ones((100, 100), bool)
        m[20:80, 20:80] = False
        full = Q.counter_solidity(m)
        m[50:80, 45:55] = True  # a spur from the bottom edge
        self.assertGreater(full, 0.99)
        self.assertLess(Q.counter_solidity(m), 0.95)

    def test_black_e_s_ae_end_in_square_terminals(self):
        for path in (VF, VFI):
            for g in ('e', 's', 'ae'):
                corners = Q.terminal_corners(path, g, 900)
                self.assertTrue(corners, f'{g} has a terminal')
                for ca, cb in corners:
                    self.assertLessEqual(max(abs(ca - 90), abs(cb - 90)), Q.SQUARE_TOL, f'{g} terminal corners {ca:.0f}/{cb:.0f}')

    def test_black_five_has_no_hook_and_one_no_spur(self):
        for path in (VF, VFI):
            self.assertGreaterEqual(min(Q.exposed_corners(path, 'five', 900)), Q.SHARP_MIN)
            for w in (100, 400, 900):
                (_, _, _, top), _ = Q._glyph_bounds(Q.instance(path, w, 14), 'one')
                self.assertLessEqual(top, 700 + Q.ONE_TOP_SLACK, f'1 at wght {w}')

    def test_black_s_counters_are_open(self):
        for path, suffix in ((VF, ''), (VFI, '_italic')):
            ref = Q.REF['pocket' + suffix]['s']
            got = Q.pocket_areas(Q.raster(path, 's', 900, 14, 0.5))
            self.assertEqual(len(got), 2)
            for v, r in zip(got, ref):
                self.assertGreaterEqual(v, Q.POCKET_MIN_SHARE * r)

    def test_cut_faces_found_on_the_built_font(self):
        faces = Q.cut_faces(VF, 'c', 900)
        self.assertEqual(len(faces), 2)
        self.assertTrue(all(deg <= Q.CUT_MAX_DEG for _, deg in faces))


if __name__ == '__main__':
    unittest.main()

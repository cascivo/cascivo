"""Guards for the shipped font. Run from fonts/cascivo-sans/ after a build:

    python3 -I src/build.py && python3 -I -m unittest discover -s src
"""

import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from fontTools.ttLib import TTFont  # noqa: E402

import lint  # noqa: E402

DIST = os.path.join(HERE, '..', 'fonts')
VF = os.path.join(DIST, 'CascivoSans[opsz,wght].ttf')
VFI = os.path.join(DIST, 'CascivoSans-Italic[opsz,wght].ttf')

# Size budgets (bytes). A regression past these is a design decision, not an accident.
# The italic runs larger: every point that moves vertically between masters also moves
# horizontally once slanted, so it carries more variation data.
BUDGETS = {
    'CascivoSans[opsz,wght].woff2': 36_000,
    'CascivoSans-Latin[opsz,wght].woff2': 30_000,
    'CascivoSans-Latin[wght].woff2': 22_500,
    'CascivoSans-Regular.woff2': 12_000,
    'CascivoSans-Italic[opsz,wght].woff2': 40_000,
    'CascivoSans-Italic-Latin[opsz,wght].woff2': 34_000,
    'CascivoSans-Italic-Latin[wght].woff2': 25_000,
}


class Font(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (os.path.exists(VF) and os.path.exists(VFI)):
            raise unittest.SkipTest('run src/build.py first')
        cls.f = TTFont(VF)
        cls.fi = TTFont(VFI)

    def test_outlines_are_simple(self):
        self.assertEqual(lint.main(), 0)

    def test_axes(self):
        for f in (self.f, self.fi):
            axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in f['fvar'].axes}
            self.assertEqual(axes, {'wght': (100, 400, 900), 'opsz': (8, 14, 48)})
            self.assertIn('avar', f)
            self.assertEqual(len(f['fvar'].instances), 9)

    def test_italic_is_a_linked_italic(self):
        fi, f = self.fi, self.f
        self.assertEqual(fi['post'].italicAngle, -10)
        self.assertTrue(fi['OS/2'].fsSelection & 1, 'ITALIC bit')
        self.assertFalse(fi['OS/2'].fsSelection & (1 << 6), 'not REGULAR')
        self.assertTrue(fi['head'].macStyle & 2)
        self.assertEqual(f['post'].italicAngle, 0)

        def ital(font):
            stat = font['STAT'].table
            tags = [a.AxisTag for a in stat.DesignAxisRecord.Axis]
            return [v.Value for v in stat.AxisValueArray.AxisValue if v.AxisIndex == tags.index('ital')]

        self.assertEqual(ital(f), [0])
        self.assertEqual(ital(fi), [1])

    def test_italic_letterforms_are_drawn(self):
        def bounds(font, ch):
            g = font['glyf'][font.getBestCmap()[ord(ch)]]
            g.recalcBounds(font['glyf'])
            return g

        for ch in 'f\u017f\u00df':  # f, long s and sharp s
            self.assertLess(bounds(self.fi, ch).yMin, -100, f'the italic {ch} descends')
            self.assertGreaterEqual(bounds(self.f, ch).yMin, 0)
        # stems are cut flat on the baseline and x-height, not square to the slant (which dipped
        # 7 units below the baseline and pushed the scaled stems in ™ outside its bounding box)
        for ch in 'HMTnhimr1':
            self.assertEqual(bounds(self.fi, ch).yMin, 0, f'italic {ch} sits on the baseline')
        # single-storey a: one contour is a bare stem from baseline to x-height. In the upright
        # a, that contour carries on over the top into the terminal, so it is wide.
        def has_bare_stem(font, ch='a'):
            g = font['glyf'][font.getBestCmap()[ord(ch)]]
            coords, ends, _ = g.getCoordinates(font['glyf'])
            adv = font['hmtx'][font.getBestCmap()[ord(ch)]][0] / (2 if ch == '\u00e6' else 1)
            start = 0
            for e in ends:
                xs = [x for x, _ in coords[start:e + 1]]
                ys = [y for _, y in coords[start:e + 1]]
                start = e + 1
                if min(ys) <= 0 and max(ys) >= 520 and max(xs) - min(xs) < 0.45 * adv:
                    return True
            return False

        self.assertTrue(has_bare_stem(self.fi), 'italic a is single-storey')
        self.assertFalse(has_bare_stem(self.f), 'upright a is double-storey')
        self.assertTrue(has_bare_stem(self.fi, '\u00e6'), 'italic \u00e6 matches the italic a')
        self.assertFalse(has_bare_stem(self.f, '\u00e6'))

    def test_coverage(self):
        cmap = self.f.getBestCmap()
        want = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | set(range(0x100, 0x180))
        want |= {0x218, 0x219, 0x21A, 0x21B, 0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2022, 0x2026, 0x2039, 0x203A, 0x20AC, 0x2122, 0x2212}
        want -= {0xAD}  # soft hyphen is deliberately unmapped
        self.assertEqual(sorted(want - set(cmap)), [])

    def test_features(self):
        gsub = {r.FeatureTag for r in self.f['GSUB'].table.FeatureList.FeatureRecord}
        gpos = {r.FeatureTag for r in self.f['GPOS'].table.FeatureList.FeatureRecord}
        self.assertLessEqual({'ccmp', 'locl', 'pnum', 'tnum', 'zero', 'sups', 'sinf', 'subs', 'numr', 'dnom', 'frac', 'ordn', 'case', 'ss01'}, gsub)
        self.assertLessEqual({'kern', 'mark'}, gpos)

    def test_figures_proportional_by_default_tabular_on_request(self):
        cmap, hmtx = self.f.getBestCmap(), self.f['hmtx']
        default = {hmtx[cmap[ord(c)]][0] for c in '0123456789'}
        self.assertGreater(len(default), 1, 'running text should get proportional figures')
        tnum = {}
        for fr in self.f['GSUB'].table.FeatureList.FeatureRecord:
            if fr.FeatureTag == 'tnum':
                for li in fr.Feature.LookupListIndex:
                    for st in self.f['GSUB'].table.LookupList.Lookup[li].SubTable:
                        tnum.update(st.mapping)
        tabular = {hmtx[tnum[cmap[ord(c)]]][0] for c in '0123456789'}
        self.assertEqual(len(tabular), 1, 'tnum must give every figure one width')

    def test_default_line_height(self):
        os2, upm = self.f['OS/2'], self.f['head'].unitsPerEm
        self.assertTrue(os2.fsSelection & (1 << 7), 'USE_TYPO_METRICS')
        self.assertAlmostEqual((os2.sTypoAscender - os2.sTypoDescender + os2.sTypoLineGap) / upm, 1.30, places=2)
        hhea = self.f['hhea']
        self.assertAlmostEqual((hhea.ascent - hhea.descent + hhea.lineGap) / upm, 1.30, places=2)

    def test_weight_changes_do_not_reflow_text(self):
        # Bold on hover or an active tab must not rewrap a line. Geist spans 0.96x-1.11x of its
        # Regular width from Thin to Black; before the hand review this font spanned 0.73x-1.35x.
        from fontTools.varLib.instancer import instantiateVariableFont

        text = 'the settings page lets you rename a team assign seats and set the default theme'

        def width(w, path=VF):
            f = instantiateVariableFont(TTFont(path), {'wght': w, 'opsz': 14})
            cmap, hmtx = f.getBestCmap(), f['hmtx']
            return sum(hmtx[cmap[ord(c)]][0] for c in text)

        for path in (VF, VFI):
            regular = width(400, path)
            self.assertGreaterEqual(width(100, path) / regular, 0.92)
            self.assertLessEqual(width(700, path) / regular, 1.09)
            self.assertLessEqual(width(900, path) / regular, 1.16)

    def test_heavy_weights_keep_their_rhythm(self):
        # Black looked spotty beside Geist and Inter: its sidebearings stayed at Regular's while
        # the counters shrank (gap between letters = gap inside them), and its horizontals thinned
        # to 0.6 of a stem. Both references tighten ~30% by Black and keep horizontals >= 0.7.
        from fontTools.varLib.instancer import instantiateVariableFont

        def at(w):
            return instantiateVariableFont(TTFont(VF), {'wght': w, 'opsz': 14})

        def n_sidebearing(f):
            name = f.getBestCmap()[ord('n')]
            g = f['glyf'][name]
            g.recalcBounds(f['glyf'])
            adv, lsb = f['hmtx'][name]
            return (lsb + adv - g.xMax) / 2

        def o_contrast(f):
            name = f.getBestCmap()[ord('o')]
            g = f['glyf'][name]
            coords, ends, _ = g.getCoordinates(f['glyf'])
            boxes, start = [], 0
            for e in ends:
                xs = [x for x, _ in coords[start:e + 1]]
                ys = [y for _, y in coords[start:e + 1]]
                boxes.append((min(xs), min(ys), max(xs), max(ys)))
                start = e + 1
            outer, inner = sorted(boxes, key=lambda b: b[2] - b[0], reverse=True)[:2]
            return (outer[3] - inner[3]) / (inner[0] - outer[0])

        regular, black = at(400), at(900)
        self.assertLessEqual(n_sidebearing(black) / n_sidebearing(regular), 0.8)
        self.assertGreaterEqual(o_contrast(black), 0.68)

    def test_heavy_question_mark_hook_clears_its_dot(self):
        # Black's dot is 227 units tall; with the hook ending at a fixed 27% of cap height, the two
        # touched and read as a notch.
        from fontTools.varLib.instancer import instantiateVariableFont

        f = instantiateVariableFont(TTFont(VF), {'wght': 900, 'opsz': 14})
        g = f['glyf'][f.getBestCmap()[ord('?')]]
        coords, ends, _ = g.getCoordinates(f['glyf'])
        boxes, start = [], 0
        for e in ends:
            ys = [y for _, y in coords[start:e + 1]]
            boxes.append((min(ys), max(ys)))
            start = e + 1
        dot = min(boxes)  # the contour that sits on the baseline
        hook_bottom = min(lo for lo, hi in boxes if (lo, hi) != dot)
        self.assertGreater(hook_bottom - dot[1], 30)

    def test_kerning(self):
        try:
            import uharfbuzz as hb
        except ImportError:
            self.skipTest('pip install uharfbuzz')
        with open(VF, 'rb') as fh:
            font = hb.Font(hb.Face(fh.read()))

        def kern(s):
            def advance(on):
                buf = hb.Buffer()
                buf.add_str(s)
                buf.guess_segment_properties()
                hb.shape(font, buf, {'kern': on})
                return sum(p.x_advance for p in buf.glyph_positions)

            return advance(True) - advance(False)

        for pair in ('To', 'Ty', 'AV', 'VA', 'Av', 'LT', 'T.', 'F.', 'Yo', '\u201cA', 'A\u201d', 'Áv'):
            self.assertLess(kern(pair), -10, f'{pair} should be kerned')
        for pair in ('nn', 'HH', 'oo', 'LM', 'FG'):
            self.assertEqual(kern(pair), 0, f'{pair} needs no kerning')
        self.assertGreater(kern('l.'), 0, 'the tailed l opens before low punctuation')

    def test_no_nested_components(self):
        glyf = self.f['glyf']
        for name in self.f.getGlyphOrder():
            g = glyf[name]
            if g.isComposite():
                for c in g.components:
                    self.assertFalse(glyf[c.glyphName].isComposite(), f'{name} nests {c.glyphName}')

    def test_size_budgets(self):
        for fn, limit in BUDGETS.items():
            size = os.path.getsize(os.path.join(DIST, fn))
            self.assertLessEqual(size, limit, f'{fn} is {size} B, budget {limit} B')

    def test_browser_sanitizer(self):
        try:
            import ots
        except ImportError:
            self.skipTest('pip install opentype-sanitizer')
        for fn in sorted(os.listdir(DIST)):
            r = ots.sanitize(os.path.join(DIST, fn), os.devnull, capture_output=True)
            self.assertEqual(r.returncode, 0, f'OTS rejects {fn}: {r.stderr.decode()[:300]}')


if __name__ == '__main__':
    unittest.main()

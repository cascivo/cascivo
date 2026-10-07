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
VF = os.path.join(DIST, 'CascivoSans[opsz,slnt,wght].ttf')

# Size budgets (bytes). A regression past these is a design decision, not an accident.
BUDGETS = {
    'CascivoSans[opsz,slnt,wght].woff2': 40_000,
    'CascivoSans-Latin[opsz,slnt,wght].woff2': 34_000,
    'CascivoSans-Latin[opsz,wght].woff2': 30_000,
    'CascivoSans-Latin[wght].woff2': 22_000,
    'CascivoSans-Regular.woff2': 12_000,
}


class Font(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.path.exists(VF):
            raise unittest.SkipTest('run src/build.py first')
        cls.f = TTFont(VF)

    def test_outlines_are_simple(self):
        self.assertEqual(lint.main(), 0)

    def test_axes(self):
        axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in self.f['fvar'].axes}
        self.assertEqual(axes, {'wght': (100, 400, 900), 'opsz': (8, 14, 48), 'slnt': (-12, 0, 0)})
        self.assertIn('avar', self.f)
        self.assertEqual(len(self.f['fvar'].instances), 18)

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

    def test_tabular_figures_by_default(self):
        cmap, hmtx = self.f.getBestCmap(), self.f['hmtx']
        widths = {hmtx[cmap[ord(c)]][0] for c in '0123456789'}
        self.assertEqual(len(widths), 1)

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

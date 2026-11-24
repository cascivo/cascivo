"""Cascivo Mono v1 gates: python3 -I -m unittest discover -s fonts/cascivo-mono/src"""
import os
import unittest

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
FONTS = os.path.join(ROOT, 'fonts')
TTF = os.path.join(FONTS, 'CascivoMono[opsz,wght].ttf')
SANS = os.path.join(ROOT, '..', 'cascivo-sans', 'fonts', 'CascivoSans[opsz,wght].ttf')
LATIN = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100))
CELL = 600


class MonoFont(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.font = TTFont(TTF)

    def test_loads_with_names(self):
        self.assertEqual(self.font['name'].getDebugName(1), 'Cascivo Mono')
        self.assertEqual(sorted(a.axisTag for a in self.font['fvar'].axes), ['opsz', 'wght'])

    def test_covers_sans_latin(self):
        want = LATIN & set(TTFont(SANS).getBestCmap()) if os.path.exists(SANS) else LATIN - {0xAD}
        missing = want - set(self.font.getBestCmap())
        self.assertFalse(missing, sorted(hex(c) for c in missing))

    def test_one_advance_at_every_weight(self):
        marks = None
        for w in (100, 400, 900):
            for z in (8, 14, 48):
                inst = instantiateVariableFont(TTFont(TTF), {'wght': w, 'opsz': z})
                adv = {n: a for n, (a, _) in inst['hmtx'].metrics.items()}
                zero = {n for n, a in adv.items() if a == 0}
                bad = {n: a for n, a in adv.items() if a not in (0, CELL)}
                self.assertFalse(bad, f'wght {w} opsz {z}: {dict(list(bad.items())[:10])}')
                if marks is None:
                    marks = zero
                self.assertEqual(zero, marks, f'zero-width set moved at wght {w} opsz {z}')
        cmap = self.font.getBestCmap()
        for cp in LATIN & set(cmap):
            if cp != 0xAD:
                self.assertNotIn(cmap[cp], marks, hex(cp))

    def test_no_kerning(self):
        if 'GPOS' in self.font:
            tags = {r.FeatureTag for r in self.font['GPOS'].table.FeatureList.FeatureRecord}
            self.assertNotIn('kern', tags)

    def test_ots(self):
        try:
            import ots
        except ImportError:
            self.skipTest('opentype-sanitizer not installed')
        r = ots.sanitize(TTF, os.devnull, capture_output=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_woff2_budget(self):
        self.assertLess(os.path.getsize(os.path.join(FONTS, 'CascivoMono[opsz,wght].woff2')), 120_000)
        self.assertLess(os.path.getsize(os.path.join(FONTS, 'CascivoMono-Latin[opsz,wght].woff2')), 45_000)


if __name__ == '__main__':
    unittest.main()

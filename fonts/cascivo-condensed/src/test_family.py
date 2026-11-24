"""Gates for Cascivo Condensed v2 (fonts/PLAN-families.md). Run: python3 -I -m unittest discover -s fonts/cascivo-condensed/src"""

import io
import os
import string
import unittest

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, '..', 'fonts')
TTF = os.path.join(FONTS, 'CascivoCondensed[opsz,wght].ttf')
SANS = os.path.join(HERE, '..', '..', 'cascivo-sans', 'fonts', 'CascivoSans[opsz,wght].ttf')


def mean_advance(path, wght):
    f = instancer.instantiateVariableFont(TTFont(path), {'wght': wght, 'opsz': 14})
    cmap, hmtx = f.getBestCmap(), f['hmtx']
    return sum(hmtx[cmap[ord(c)]][0] for c in string.ascii_letters) / 52


def pil_font(size, wght, opsz):
    f = ImageFont.truetype(TTF, size, layout_engine=ImageFont.Layout.RAQM)
    vals = [wght if 'eight' in str(a['name']) else opsz for a in f.get_variation_axes()]
    f.set_variation_by_axes(vals)
    return f


def has_counter(ch, wght, opsz):
    """True when the glyph's ink encloses white that a flood fill from outside cannot reach."""
    f = pil_font(200, wght, opsz)
    im = Image.new('L', (300, 300), 255)
    ImageDraw.Draw(im).text((50, 20), ch, font=f, fill=0)
    im = im.point(lambda v: 0 if v < 128 else 255)
    ImageDraw.floodfill(im, (0, 0), 128)
    return sum(1 for v in im.getdata() if v == 255) > 40


class CondensedTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.font = TTFont(TTF)

    def test_loads_as_variable(self):
        self.assertEqual([a.axisTag for a in self.font['fvar'].axes], ['wght', 'opsz'])
        self.assertIn('Cascivo Condensed', self.font['name'].getDebugName(1))

    def test_cmap_covers_latin1(self):
        cmap = self.font.getBestCmap()
        # U+00AD soft hyphen is left unmapped, as in Cascivo Sans: it is a line-break hint, never drawn
        missing = [hex(c) for c in list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) if c not in cmap and c != 0xAD]
        self.assertEqual(missing, [])

    def test_cmap_matches_sans(self):
        self.assertEqual(set(self.font.getBestCmap()), set(TTFont(SANS).getBestCmap()))

    def test_condensed_width(self):
        r = mean_advance(TTF, 400) / mean_advance(SANS, 400)
        # v2 targets 0.78-0.82 of Sans (Roboto Condensed sits at 0.84, Inter Tight at 0.94)
        self.assertGreaterEqual(r, 0.76)
        self.assertLessEqual(r, 0.84)

    def test_condensed_width_holds_across_weights(self):
        # v1 condensed Black least (0.93x): its stems kept Sans's weight. v2 thins them, so every weight sits near Regular's ratio
        for w in (100, 900):
            r = mean_advance(TTF, w) / mean_advance(SANS, w)
            self.assertGreaterEqual(r, 0.76, w)
            self.assertLessEqual(r, 0.84, w)

    def test_counters_stay_open_at_black(self):
        for opsz in (14, 48):
            for ch in 'oeaBdgbpq&6890':  # the bowl joins thinned at Black (family.BLACK_JOIN) must not fill a counter in
                self.assertTrue(has_counter(ch, 900, opsz), f'{ch} closed at 900 / opsz {opsz}')

    def test_ots_sanitize(self):
        try:
            import ots
        except ImportError:
            self.skipTest('ots not installed')
        for name in os.listdir(FONTS):
            r = ots.sanitize(os.path.join(FONTS, name), os.devnull, capture_output=True)
            self.assertEqual(r.returncode, 0, f'{name}: {r.stderr}')

    def test_woff2_budget(self):
        self.assertLess(os.path.getsize(os.path.join(FONTS, 'CascivoCondensed[opsz,wght].woff2')), 110_000)
        self.assertLess(os.path.getsize(os.path.join(FONTS, 'CascivoCondensed-Latin[opsz,wght].woff2')), 45_000)


if __name__ == '__main__':
    unittest.main()

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

    def test_proportional_one_stays_inside_its_advance(self):
        # v2 shifted the 1's outline into the default (proportional) 1's right sidebearing: -7 units at 400, -44 at 900 (12 and 1l collided)
        from fontTools.pens.boundsPen import BoundsPen

        for w in (100, 400, 700, 900):
            f = instancer.instantiateVariableFont(TTFont(TTF), {'wght': w, 'opsz': 14})
            g = f.getBestCmap()[ord('1')]
            pen = BoundsPen(f.getGlyphSet())
            f.getGlyphSet()[g].draw(pen)
            self.assertGreater(f['hmtx'][g][0] - pen.bounds[2], 20, w)

    def test_dashes_condensed(self):
        cmap, hmtx = self.font.getBestCmap(), self.font['hmtx']
        self.assertLess(hmtx[cmap[0x2014]][0], 800)  # Sans's em dash is 1000
        self.assertLess(hmtx[cmap[0x2013]][0], hmtx[cmap[0x2014]][0] * 0.65)

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


    # ---- round 6 regressions ----

    def instance(self, w):
        from fontTools.pens.boundsPen import BoundsPen

        f = instancer.instantiateVariableFont(TTFont(TTF), {'wght': w, 'opsz': 14})
        cmap, gs = f.getBestCmap(), f.getGlyphSet()

        def bounds(ch):
            pen = BoundsPen(gs)
            gs[cmap[ord(ch)]].draw(pen)
            return pen.bounds

        return f, cmap, bounds

    def test_black_word_space_and_stem(self):
        # 72 px Black headlines ran their words together (space 204) and their stems filled a e s g at 12 px (l stem 218)
        f, cmap, bounds = self.instance(900)
        self.assertGreaterEqual(f['hmtx'][cmap[32]][0], 215)
        l = bounds('l')
        self.assertLessEqual(l[2] - l[0], 212)

    def test_t_clears_the_next_letter(self):
        # t's crossbar met the next letter at 12 px ("ts", "t able"): right sidebearing at least 20 units at every weight
        for w in (100, 400, 700, 900):
            f, cmap, bounds = self.instance(w)
            self.assertGreaterEqual(f['hmtx'][cmap[ord('t')]][0] - bounds('t')[2], 20, w)

    def test_dots_larger_than_sans(self):
        # Sans's dots read small beside the narrower letters
        _, _, bounds = self.instance(400)
        p = bounds('.')
        self.assertGreaterEqual(p[2] - p[0], 110)

    def test_proportional_one_sits_close(self):
        # round 7: the 1's left sidebearing (106 units at 400) left a hole after 0 in "01 ·" eyebrows and "1,513" (Roboto Condensed 79)
        for w in (400, 700, 900):
            f, cmap, bounds = self.instance(w)
            self.assertLessEqual(bounds('1')[0], 85, w)
            self.assertGreaterEqual(bounds('1')[0], 60, w)  # still clear of l and I at 11 px

    def test_comma_tail_short(self):
        # round 7: the comma hung 173 units under the baseline (Roboto Condensed 142) and read as a blob at 48 px
        for w in (400, 900):
            _, _, bounds = self.instance(w)
            for ch in ',;':
                self.assertGreaterEqual(bounds(ch)[1], -150, (ch, w))
                self.assertLessEqual(bounds(ch)[1], -100, (ch, w))  # still a comma, not a dot

    # ---- round 8 regressions ----

    def test_t_clears_the_letter_before(self):
        # round 8: Black t's left sidebearing was 11 units (n's 35), and st, ct, rt touched at 12-16 px Bold and Black
        for w in (700, 900):
            for opsz in (14, 48):
                f = instancer.instantiateVariableFont(TTFont(TTF), {'wght': w, 'opsz': opsz})
                self.assertGreaterEqual(self.bounds_in(f, 't')[0], 18, (w, opsz))

    def test_black_c_and_e_open_on_the_right(self):
        # round 8: Black c and e kept 12-16 units on the right (o 27-30), and cc, ce, ee clumped at 12-14 px
        for opsz in (14, 48):
            f = instancer.instantiateVariableFont(TTFont(TTF), {'wght': 900, 'opsz': opsz})
            for ch in 'ce':
                adv = f['hmtx'][f.getBestCmap()[ord(ch)]][0]
                self.assertGreaterEqual(adv - self.bounds_in(f, ch)[2], 16, (ch, opsz))

    def test_tabular_three_fits_its_cell(self):
        # round 8: the tabular 3 (Sans draws it 1.08 of the figure width at Black) inked 475 units in a 493 cell, 30 more than the 2
        # and 9 units from each edge at display Black, so "33" ran together in tables. Now about the 0's width.
        from fontTools.pens.boundsPen import BoundsPen

        gsub = self.font['GSUB'].table
        tnum = {}
        for fr in gsub.FeatureList.FeatureRecord:
            if fr.FeatureTag == 'tnum':
                for li in fr.Feature.LookupListIndex:
                    for st in gsub.LookupList.Lookup[li].SubTable:
                        tnum.update(st.mapping)
        for w in (700, 900):
            f = instancer.instantiateVariableFont(TTFont(TTF), {'wght': w, 'opsz': 48})
            gs, cmap = f.getGlyphSet(), f.getBestCmap()

            def b(ch):
                pen = BoundsPen(gs)
                gs[tnum[cmap[ord(ch)]]].draw(pen)
                return pen.bounds

            three, zero = b('3'), b('0')
            self.assertGreaterEqual(three[0], 14, w)
            self.assertLessEqual(three[2] - three[0], zero[2] - zero[0] + 6, w)

    def test_woff2_transforms_hmtx_losslessly(self):
        # round 8 bytes: WOFF2's hmtx transform (-0.9 KB full, -0.3 KB Latin) must decode to the TTF's metrics exactly
        for name in ('CascivoCondensed[opsz,wght].woff2', 'CascivoCondensed-Latin[opsz,wght].woff2'):
            w = TTFont(os.path.join(FONTS, name))
            self.assertIn('hmtx', w.flavorData.transformedTables, name)
        w = TTFont(os.path.join(FONTS, 'CascivoCondensed[opsz,wght].woff2'))
        self.assertEqual(dict(w['hmtx'].metrics), dict(self.font['hmtx'].metrics))
        self.assertEqual(w['gvar'].compile(w), self.font['gvar'].compile(self.font))

    @staticmethod
    def bounds_in(f, ch):
        from fontTools.pens.boundsPen import BoundsPen

        gs = f.getGlyphSet()
        pen = BoundsPen(gs)
        gs[f.getBestCmap()[ord(ch)]].draw(pen)
        return pen.bounds


if __name__ == '__main__':
    unittest.main()

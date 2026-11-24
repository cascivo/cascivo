"""Cascivo Serif v1 gates: python3 -I -m unittest discover -s fonts/cascivo-serif/src"""
import os
import unittest

import numpy as np
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, '..', 'fonts')
TTF = os.path.join(FONTS, 'CascivoSerif[opsz,wght].ttf')
SANS = os.path.join(HERE, '..', '..', 'cascivo-sans', 'fonts', 'CascivoSans[opsz,wght].ttf')


def foot_span(path, name, wght=400):
    """Width from the leftmost to the rightmost on-curve point lying on the baseline."""
    f = TTFont(path)
    pen = DecomposingRecordingPen(f.getGlyphSet(location={'wght': wght, 'opsz': 14}))
    f.getGlyphSet(location={'wght': wght, 'opsz': 14})[name].draw(pen)
    xs = [x for _, args in pen.value for x, y in args if abs(y) < 1]
    return max(xs) - min(xs)


def contours(path, name, wght):
    """On-curve points per contour (composites decomposed), at opsz 14."""
    gs = TTFont(path).getGlyphSet(location={'wght': wght, 'opsz': 14})
    pen = DecomposingRecordingPen(gs)
    gs[name].draw(pen)
    out, cur = [], []
    for op, args in pen.value:
        if op in ('moveTo', 'lineTo', 'curveTo', 'qCurveTo') and args:
            cur.append(args[-1])
        if op in ('closePath', 'endPath'):
            out.append(np.array(cur))
            cur = []
    return out


def raster(path, ch, wght=400, size=800):
    font = ImageFont.truetype(path, size)
    font.set_variation_by_axes([wght if b'Weight' in a['name'] else 14 for a in font.get_variation_axes()])
    im = Image.new('L', (size * 2, size * 2), 0)
    ImageDraw.Draw(im).text((size // 2, size // 4), ch, font=font, fill=255)
    return np.array(im) > 127


def o_contrast(path, wght=400):
    a = raster(path, 'o', wght)
    ys, xs = np.nonzero(a)
    col = a[:, (xs.min() + xs.max()) // 2]
    row = a[(ys.min() + ys.max()) // 2, :]
    top = np.flatnonzero(col)
    top = top[: np.argmax(np.diff(top) > 1) + 1]  # first ink run from the top
    side = np.flatnonzero(row)
    side = side[: np.argmax(np.diff(side) > 1) + 1]
    return len(top) / len(side)


class SerifFamily(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.f = TTFont(TTF)

    def test_names_and_axes(self):
        self.assertEqual(self.f['name'].getDebugName(1), 'Cascivo Serif')
        self.assertEqual(sorted(a.axisTag for a in self.f['fvar'].axes), ['opsz', 'wght'])

    def test_latin_coverage(self):
        cmap = self.f.getBestCmap()
        need = (set(range(0x20, 0x7F)) | set(range(0xA0, 0x100))) - {0xAD}  # soft hyphen: unmapped in Sans too
        self.assertEqual(need - set(cmap), set())
        self.assertEqual(set(cmap), set(TTFont(SANS).getBestCmap()))

    def test_serifs_present(self):
        for wght in (100, 400, 900):
            for name, ref in (('n', 'n'), ('H', 'H'), ('i', 'i'), ('l', 'i'), ('I', 'i')):  # Sans's l is tailed and its I slabbed
                with self.subTest(wght=wght, name=name):
                    self.assertGreater(foot_span(TTF, name, wght), foot_span(SANS, ref, wght) + 40)

    def test_more_contours_than_sans(self):
        sans = TTFont(SANS)
        for name in ('n', 'H', 'h', 'm', 'E'):
            with self.subTest(name=name):
                self.assertGreater(self.f['glyf'][name].numberOfContours, sans['glyf'][name].numberOfContours)

    def test_higher_contrast_than_sans(self):
        for wght in (400, 900):
            with self.subTest(wght=wght):
                self.assertLess(o_contrast(TTF, wght), o_contrast(SANS, wght) - 0.05)

    def test_round_dots_without_serifs(self):
        # The serif pass took the engine's dot (a short vertical stroke from the baseline) for a stem foot: . : ; ! ? and the ellipsis
        # carried a slab and brackets. Punctuation keeps Sans's contours, and every dot is one round contour.
        for name in ('period', 'colon', 'semicolon', 'ellipsis', 'exclam', 'question', 'exclamdown', 'questiondown', 'quotesingle', 'quotedbl', 'bar', 'brokenbar', 'comma', 'quoteright', 'quotedblleft'):
            with self.subTest(name=name):
                self.assertEqual(len(contours(TTF, name, 400)), len(contours(SANS, name, 400)))
        for wght in (100, 400, 700, 900):
            for name, n in (('period', 1), ('colon', 2), ('ellipsis', 3), ('exclam', 1), ('question', 1), ('dotaccent', 1)):
                cs = contours(TTF, name, wght)
                dots = sorted(cs, key=lambda c: c[:, 1].min())[:n] if name != 'dotaccent' else cs
                for c in dots:
                    with self.subTest(wght=wght, name=name):
                        ctr = (c.max(0) + c.min(0)) / 2
                        r = np.hypot(*(c - ctr).T)
                        self.assertLess(r.max() / r.min(), 1.03)  # a circle: no slab corner, no bracket

    def test_ots_sanitize(self):
        try:
            import ots
        except ImportError:
            self.skipTest('ots not installed')
        r = ots.sanitize(TTF, os.devnull, capture_output=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_woff2_budget(self):
        self.assertLess(os.path.getsize(os.path.join(FONTS, 'CascivoSerif[opsz,wght].woff2')), 120_000)
        self.assertLess(os.path.getsize(os.path.join(FONTS, 'CascivoSerif-Latin[opsz,wght].woff2')), 50_000)


if __name__ == '__main__':
    unittest.main()

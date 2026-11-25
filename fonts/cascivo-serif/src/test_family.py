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
        # Round 4: a comma (and every curly quote, built from it) adds one round head per comma, the period's dot.
        heads = {'semicolon': 1, 'comma': 1, 'quoteright': 1, 'quotedblleft': 2}
        for name in ('period', 'colon', 'semicolon', 'ellipsis', 'exclam', 'question', 'exclamdown', 'questiondown', 'quotesingle', 'quotedbl', 'bar', 'brokenbar', 'comma', 'quoteright', 'quotedblleft'):
            with self.subTest(name=name):
                self.assertEqual(len(contours(TTF, name, 400)), len(contours(SANS, name, 400)) + heads.get(name, 0))
        for wght in (100, 400, 900):
            for name in ('comma', 'quoteright'):
                head = max(contours(TTF, name, wght), key=lambda c: c[:, 1].max())  # the head is the top of a comma
                ctr = (head.max(0) + head.min(0)) / 2
                r = np.hypot(*(head - ctr).T)
                with self.subTest(wght=wght, name=name, part='head'):
                    self.assertLess(r.max() / r.min(), 1.03)
        for wght in (100, 400, 700, 900):
            for name, n in (('period', 1), ('colon', 2), ('ellipsis', 3), ('exclam', 1), ('question', 1), ('dotaccent', 1)):
                cs = contours(TTF, name, wght)
                dots = sorted(cs, key=lambda c: c[:, 1].min())[:n] if name != 'dotaccent' else cs
                for c in dots:
                    with self.subTest(wght=wght, name=name):
                        ctr = (c.max(0) + c.min(0)) / 2
                        r = np.hypot(*(c - ctr).T)
                        self.assertLess(r.max() / r.min(), 1.03)  # a circle: no slab corner, no bracket

    def test_served_dots_are_circles(self):
        # The landing page's display face is the site's Latin web file, at opsz 48 for the hero. Its period, colon, i tittle and
        # the dots of ! ? must be circles at every weight and optical size: bbox square, every sampled outline point (curves
        # included, not just on-curve points) at one radius from the centre.
        from fontTools.pens.basePen import BasePen

        class Sample(BasePen):
            def __init__(self, gs):
                super().__init__(gs)
                self.out = []

            def _moveTo(self, p):
                self.out.append([p])

            def _lineTo(self, p):
                self.out[-1].append(p)

            def _qCurveToOne(self, p1, p2):
                p0 = self.out[-1][-1]
                for k in range(1, 9):
                    t = k / 8
                    self.out[-1].append(tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c for a, b, c in zip(p0, p1, p2)))

        web = os.path.join(HERE, '..', '..', '..', 'apps', 'site', 'public', 'fonts', 'cascivo-serif', 'CascivoSerif-Latin[opsz,wght].woff2')
        f = TTFont(web)
        cmap = f.getBestCmap()
        for opsz in (8, 14, 48):
            for wght in (100, 400, 700, 900):
                gs = f.getGlyphSet(location={'wght': wght, 'opsz': opsz})
                for ch, n in (('.', 1), (':', 2), ('i', 1), ('!', 1), ('?', 1)):
                    pen = Sample(gs)
                    gs[cmap[ord(ch)]].draw(pen)
                    cs = sorted((np.array(c) for c in pen.out), key=lambda c: c[:, 1].min())
                    dots = cs[-n:] if ch == 'i' else cs[:n]
                    for c in dots:
                        with self.subTest(ch=ch, wght=wght, opsz=opsz):
                            # 3%, or 2 units: Thin's dot is ~60 units wide and the masters' deltas round to whole units
                            w, h = c.max(0) - c.min(0)
                            self.assertLessEqual(abs(w - h), max(0.03 * h, 2.0))
                            r = np.hypot(*(c - (c.max(0) + c.min(0)) / 2).T)
                            self.assertLessEqual(r.max() - r.min(), max(0.03 * r.mean(), 2.0))

    def test_ink_grows_with_weight(self):
        # Round 4 review: Black's Z read a weight lighter than its neighbours (its diagonal drawn near a hairline). Every letter and
        # figure gains ink at each step of wght, and no glyph falls behind the alphabet's growth from Regular to Black by much.
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        ink = {ch: [int(raster(TTF, ch, w, 120).sum()) for w in range(100, 1000, 100)] for ch in chars}
        for ch, row in ink.items():
            with self.subTest(ch=ch):
                self.assertTrue(all(b > a for a, b in zip(row, row[1:])), row)
        growth = {ch: row[-1] / row[3] for ch, row in ink.items()}
        median = float(np.median(list(growth.values())))
        for ch, g in growth.items():
            with self.subTest(ch=ch, growth=round(g, 2)):
                self.assertGreater(g, median * 0.8)

    def test_z_diagonal_is_thick(self):
        # A serif Z's diagonal is its thick stroke (Source Serif's): measured square to the stroke it is at least 0.75 of H's stem
        # at every weight. The engine's angle pen drew it near a hairline (0.5 of the stem at Black).
        def diag(wght):
            a = raster(TTF, 'Z', wght)
            ys = np.nonzero(a.any(1))[0]
            mid, h = (ys.min() + ys.max()) // 2, ys.max() - ys.min()
            runs = []
            for y in (mid - h // 8, mid + h // 8):
                xs = np.flatnonzero(a[y])
                runs.append((xs.min(), xs.max()))
            (l0, r0), (l1, r1) = runs
            dx, dy = ((l1 + r1) - (l0 + r0)) / 2, h / 4
            return (r0 - l0 + 1) * dy / np.hypot(dx, dy)

        def stem(wght):
            a = raster(TTF, 'H', wght)
            ys = np.nonzero(a.any(1))[0]
            xs = np.flatnonzero(a[(ys.min() + ys.max()) // 2 - (ys.max() - ys.min()) // 4])
            return int(np.argmax(np.diff(xs) > 1)) + 1

        for wght in (400, 700, 900):
            with self.subTest(wght=wght):
                self.assertGreater(diag(wght), stem(wght) * 0.75)

    def test_c_beak_vertical(self):
        # Round 6: the C's top ran on until its stroke fell near vertical, was cut flat and carried a thin barb hanging to 0.48-0.54 of
        # the cap height: a claw curling into the counter. A serif C (Source Serif 4, Merriweather) drops a beak with a vertical
        # outer side from a stroke still running out to the right, its tip near 0.66 of the height. Here: on C c G, at every
        # weight, a vertical outline edge in the upper half at least 0.15 of the height long, its foot at 0.58-0.72 of it.
        for ch in 'CcG':
            for wght in (100, 400, 700, 900):
                cs = contours(TTF, ch, wght)
                h = max(c[:, 1].max() for c in cs)
                best = max(((abs(a[1] - b[1]) / h, min(a[1], b[1]) / h) for c in cs for a, b in zip(c, np.roll(c, -1, 0))
                            if abs(a[0] - b[0]) < 1 and min(a[1], b[1]) > 0.45 * h), default=(0, 0))
                with self.subTest(ch=ch, wght=wght, edge=round(best[0], 3), foot=round(best[1], 3)):
                    self.assertGreater(best[0], 0.15)
                    self.assertTrue(0.58 < best[1] < 0.72)

    def test_no_winding_holes(self):
        # Serif, beak and spur contours overlap the strokes; one wound the wrong way, or crossing itself, cuts a white sliver into
        # the ink (round 6's first c beak at Black). Every white region of these letters must reach the edge, or be a counter.
        from scipy import ndimage
        counters = {'C': 0, 'c': 0, 'G': 0, 'S': 0, 's': 0, 'a': 1, 'e': 1, 'g': 1, 'r': 0, 'f': 0, 'j': 0, 'y': 0, 'E': 0, 'T': 0, 'Z': 0}
        for ch, n in counters.items():
            for wght in (100, 400, 700, 900):
                white = ~raster(TTF, ch, wght, size=400)
                lab, count = ndimage.label(white)
                sizes = np.bincount(lab.ravel())[1:]
                # under 300 px (0.05% of the 800 px square): Thin a's bowl meets its stem in a pinpoint pocket, engine-drawn
                with self.subTest(ch=ch, wght=wght):
                    self.assertEqual(int((sizes >= 300).sum()) - 1, n)

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

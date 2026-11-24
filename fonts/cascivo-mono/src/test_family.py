"""Cascivo Mono gates: python3 -I -m unittest discover -s fonts/cascivo-mono/src"""
import os
import unittest

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
FONTS = os.path.join(ROOT, 'fonts')
TTF = os.path.join(FONTS, 'CascivoMono[opsz,wght].ttf')
SANS = os.path.join(ROOT, '..', 'cascivo-sans', 'fonts', 'CascivoSans[opsz,wght].ttf')
LATIN = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100))
CELL = 600
ASC, DESC = 1000, -300  # the line box: a terminal's cell at line-height 1
BOX = set(range(0x2500, 0x25A0)) | set(range(0xE0B0, 0xE0B4))
# every master and the corners between them (900 at opsz 8 adds both deltas), plus Bold, a terminal's other workhorse
LOCATIONS = [{'wght': w, 'opsz': z} for w in (100, 400, 700, 900) for z in (8, 14, 48)]


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
        for w in (100, 400, 700, 900):
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

    def bounds(self, loc, ch):
        gs = self.font.getGlyphSet(location=loc)
        bp = BoundsPen(gs)
        gs[self.font.getBestCmap()[ord(ch) if isinstance(ch, str) else ch]].draw(bp)
        return bp.bounds

    def mid(self, loc, ch):
        b = self.bounds(loc, ch)
        return (b[1] + b[3]) / 2

    def width(self, loc, ch):
        b = self.bounds(loc, ch)
        return b[2] - b[0]

    def test_terminal_line_metrics(self):
        hhea, os2 = self.font['hhea'], self.font['OS/2']
        self.assertEqual((hhea.ascent, hhea.descent, hhea.lineGap), (ASC, DESC, 0))
        self.assertEqual((os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap), (ASC, DESC, 0))
        self.assertTrue(os2.fsSelection & 1 << 7, 'USE_TYPO_METRICS')
        hi = lo = 0
        for loc in LOCATIONS:
            gs = self.font.getGlyphSet(location=loc)
            for n in self.font.getGlyphOrder():
                bp = BoundsPen(gs)
                gs[n].draw(bp)
                if bp.bounds:
                    hi, lo = max(hi, bp.bounds[3]), min(lo, bp.bounds[1])
        # Windows clips to the win metrics: they hold every glyph, the box glyphs' overshoot and stacked accents included
        self.assertGreaterEqual(os2.usWinAscent, hi)
        self.assertGreaterEqual(os2.usWinDescent, -lo)

    def test_text_glyphs_inside_the_line_box(self):
        # the hhea line box holds ASCII, Latin-1 and the cell glyphs' cell (only the box lines' overshoot leaves it)
        for loc in LOCATIONS:
            for cp in sorted((LATIN | {0x2013, 0x2014, 0x2212}) & set(self.font.getBestCmap())):
                b = self.bounds(loc, cp)
                if b:
                    self.assertGreaterEqual(b[1], DESC, f'{chr(cp)} {loc}')
                    self.assertLessEqual(b[3], ASC, f'{chr(cp)} {loc}')

    def test_every_glyph_inside_its_cell(self):
        cmap = self.font.getBestCmap()
        adv = self.font['hmtx'].metrics
        for loc in LOCATIONS:
            gs = self.font.getGlyphSet(location=loc)
            for cp, n in cmap.items():
                if cp in BOX or adv[n][0] == 0:
                    continue
                bp = BoundsPen(gs)
                gs[n].draw(bp)
                if bp.bounds:
                    self.assertGreaterEqual(bp.bounds[0], 0, f'{n} U+{cp:04X} {loc}')
                    self.assertLessEqual(bp.bounds[2], CELL, f'{n} U+{cp:04X} {loc}')

    def test_box_drawing_spans_the_cell(self):
        reach = {'─': 'LR', '━': 'LR', '│': 'UD', '┃': 'UD', '┌': 'RD', '┐': 'LD', '└': 'RU', '┘': 'LU', '├': 'RUD', '┤': 'LUD',
                 '┬': 'LRD', '┴': 'LRU', '┼': 'LRUD', '═': 'LR', '║': 'UD', '╔': 'RD', '╝': 'LU', '╬': 'LRUD', '╭': 'RD', '╮': 'LD',
                 '╯': 'LU', '╰': 'RU'}
        for loc in LOCATIONS:
            for ch, arms in reach.items():
                x0, y0, x1, y1 = self.bounds(loc, ch)
                for d, ok in (('L', x0 <= 0), ('R', x1 >= CELL), ('U', y1 >= ASC), ('D', y0 <= DESC)):
                    if d in arms:
                        self.assertTrue(ok, f'{ch} {d} {loc}: {(x0, y0, x1, y1)}')
                # an arm that is not there stays off that edge
                for d, off in (('L', x0 > 0), ('R', x1 < CELL), ('U', y1 < ASC), ('D', y0 > DESC)):
                    if d not in arms:
                        self.assertTrue(off, f'{ch} {d} {loc}')
            # horizontal lines on one centre, so ─┼─ and ═╬═ meet
            ys = {ch: sum(self.bounds(loc, ch)[1::2]) / 2 for ch in '─━┄═'}
            self.assertEqual(len({round(v) for v in ys.values()}), 1, ys)

    def test_blocks_fill_the_cell(self):
        for loc in ({'wght': 400, 'opsz': 14}, {'wght': 700, 'opsz': 14}):
            self.assertEqual(self.bounds(loc, '█'), (0, DESC, CELL, ASC))
            upper, lower = self.bounds(loc, '▀'), self.bounds(loc, '▄')
            self.assertEqual((upper[3], lower[1]), (ASC, DESC))
            self.assertEqual(upper[1], lower[3], 'half blocks meet')
            for ch in '░▒▓▌▐▖▗▘▝':
                x0, y0, x1, y1 = self.bounds(loc, ch)
                self.assertTrue(0 <= x0 and x1 <= CELL and DESC <= y0 and y1 <= ASC, ch)

    def test_operators_share_the_math_axis(self):
        for loc in LOCATIONS:
            mid = {ch: self.mid(loc, ch) for ch in '-=+<>×÷−~–'}
            self.assertLess(max(mid.values()) - min(mid.values()), 4, f'{loc} {mid}')
            a = self.mid(loc, '*')
            self.assertLess(abs(a - mid['=']), 120, f'* centre {a} far off the operators\' axis {loc}')

    def test_rules_reach_the_cell_edges(self):
        for loc in LOCATIONS:
            b = self.bounds(loc, '|')
            self.assertEqual((b[1], b[3]), (DESC, ASC), loc)
            for ch in '_—':
                b = self.bounds(loc, ch)
                self.assertEqual((b[0], b[2]), (0, CELL), f'{ch} {loc}')
            widths = [self.width(loc, ch) for ch in '-–—']
            self.assertTrue(widths[0] + 60 < widths[1] < widths[2] - 60, f'- – — lengths {widths} {loc}')

    def test_ambiguous_pairs_differ(self):
        from fontTools.pens.recordingPen import DecomposingRecordingPen

        def contours(ch):
            gs = self.font.getGlyphSet()
            pen = DecomposingRecordingPen(gs)
            gs[self.font.getBestCmap()[ord(ch)]].draw(pen)
            return sum(1 for op, _ in pen.value if op == 'closePath')

        self.assertGreater(contours('0'), contours('O'), 'dotted zero')
        for loc in ({'wght': 400, 'opsz': 14}, {'wght': 700, 'opsz': 14}):
            self.assertGreater(self.width(loc, 'r'), 0.7 * self.width(loc, 'n'), 'r arm reaches across the cell')

    def ink_run(self, loc, ch, y=None, x=None):
        """Units of ink along a horizontal (y=...) or vertical (x=...) line through the glyph, sampled every 4."""
        from fontTools.pens.pointInsidePen import PointInsidePen

        gs = self.font.getGlyphSet(location=loc)
        g = gs[self.font.getBestCmap()[ord(ch)]]
        pts = [(t, y) for t in range(0, CELL, 4)] if y is not None else [(x, t) for t in range(DESC, ASC, 4)]
        inside = []
        for pt in pts:
            pen = PointInsidePen(gs, pt)
            g.draw(pen)
            inside.append(pen.getResult())
        return inside

    def test_relations_on_the_math_axis(self):
        for loc in LOCATIONS:
            eq = self.mid(loc, '=')
            for ch in '≤≥≠':
                self.assertLess(abs(self.mid(loc, ch) - eq), 15, f'{ch} {loc}')

    def test_code_letters_fill_the_cell(self):
        for loc in LOCATIONS:
            # r has no foot serif (it read as a small-cap I): along the baseline it is one stem, n two
            self.assertLess(sum(self.ink_run(loc, 'r', y=20)), 0.6 * sum(self.ink_run(loc, 'n', y=20)), f'r foot {loc}')
            self.assertGreater(self.width(loc, 'f'), 0.6 * CELL, f'f {loc}')
            self.assertGreater(self.width(loc, 't'), 0.55 * CELL, f't {loc}')
            self.assertGreater(self.width(loc, '/'), 0.65 * CELL, f'/ {loc}')

    def test_dots_round_and_clear(self):
        for loc in LOCATIONS:
            b = self.bounds(loc, '.')
            d = b[2] - b[0]
            # a corner of the dot's box is white: round at Thin, a rounded square at Black, never Sans's sharp square
            self.assertFalse(self.ink_run(loc, '.', y=b[1] + d * 0.05)[int((b[0] + d * 0.05) // 4)], f'. corner {loc}')
            # ! keeps white between its stem and its dot (Black's touched)
            col = self.ink_run(loc, '!', x=CELL // 2)
            dot_top = col.index(True) + col[col.index(True):].index(False)
            gap = col[dot_top:].index(True)
            self.assertGreater(gap * 4, 40, f'! gap {loc}')

    def test_latin_slice_has_the_terminal_set(self):
        cmap = TTFont(os.path.join(FONTS, 'CascivoMono-Latin[opsz,wght].woff2')).getBestCmap()
        self.assertFalse((BOX | {0x2260, 0x2264, 0x2265}) - set(cmap))

    def test_no_ligatures_or_contextual_alternates(self):
        # terminals shape runs of text: a ligature or a contextual swap can change a glyph the user typed
        if 'GSUB' in self.font:
            tags = {r.FeatureTag for r in self.font['GSUB'].table.FeatureList.FeatureRecord}
            self.assertFalse(tags & {'liga', 'dlig', 'calt', 'clig', 'rlig'}, tags)

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

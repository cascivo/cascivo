"""Round 8 design items (JUDGING.md): the 700 bend of T V W X Y Z on the weight axis, the italic Black Q's tail and the white after
the Black l's tail. Each test measures the built fonts against their round-7 numbers; the last checks the sibling families keep their
round-7 outlines (every round-8 knob is Sans only, glyphs.R8)."""

import json
import os
import subprocess
import sys
import unittest

import numpy as np
from fontTools.ttLib import TTFont
from scipy import ndimage

from test_font import VF, VFI, pair_white

HERE = os.path.dirname(os.path.abspath(__file__))


def advances(path, chars, wghts):
    """{wght: {char: advance}} at opsz 14, in font units (1000 per em)."""
    f = TTFont(path)
    cmap = f.getBestCmap()
    out = {}
    for w in wghts:
        gs = f.getGlyphSet(location={'wght': w, 'opsz': 14}, normalized=False)
        out[w] = {c: gs[cmap[ord(c)]].width for c in chars}
    return out


def counter_over_ink(path, ch, wght, size=200):
    """Enclosed white over ink area of a glyph rendered at `size` px (score.py's counter metric)."""
    import score

    ink = score.Face(path).mask(ch, size, wght) > 0.5
    lab, n = ndimage.label(~ink)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    return sum(int((lab == i).sum()) for i in range(1, n + 1) if i not in edge) / ink.sum()


class R8Design(unittest.TestCase):
    def test_diagonal_capitals_bend_less_at_bold(self):
        # Before: T V W X Y Z widened only from Bold (glyphs.CAPW_START at Bold's own coordinate), so their advances stayed flat from
        # 400 to 700 and rose 40-50 units a step to 900: |a600 - 2 a700 + a800| 21-36 upright and italic (Inter, Geist, Plex 0-4).
        # Now 12-21 upright (the 600 width cap on all-caps text holds it there) and 4-6 italic.
        for path, limit in ((VF, 22), (VFI, 8)):
            a = advances(path, 'TVWXYZ', (600, 700, 800))
            for c in 'TVWXYZ':
                with self.subTest(font=os.path.basename(path), glyph=c):
                    self.assertLessEqual(abs(a[600][c] - 2 * a[700][c] + a[800][c]), limit)

    def test_diagonal_capitals_narrow_a_little_at_thin(self):
        # glyphs.CAPW_THIN: the upright six give up a fifth of their Black widening at Thin (Inter's, Geist's, Plex's set 3-9% narrower
        # at Thin than at Regular; ours were 1-2%). Thin's kerning floors (test_font) hold it there; the italic keeps its Thin.
        a = advances(VF, 'TVWXYZ', (100, 400))
        for c in 'TVWXYZ':
            with self.subTest(glyph=c):
                self.assertLess(a[100][c], a[400][c] * 0.995)

    def test_italic_black_q_tail_crosses_its_counter(self):
        # Before: the italic Black Q's tail started in the ring's wall, so the Q kept its O's counter with a stub hung on it: counter
        # over ink 0.378 at 900, 0.94x the O's (Inter Italic 0.246, 0.82x its O's). The tail now starts inside the counter (glyphs
        # Q_CROSS_IT): 0.271, 0.67x. Regular italic and the upright Q (quality.py's counter gate) are not moved.
        q, o = counter_over_ink(VFI, 'Q', 900), counter_over_ink(VFI, 'O', 900)
        self.assertLessEqual(q, 0.30)
        self.assertLessEqual(q / o, 0.8)
        q4, o4 = counter_over_ink(VFI, 'Q', 400), counter_over_ink(VFI, 'O', 400)
        self.assertAlmostEqual(q4 / o4, 0.895, delta=0.01, msg='the Regular italic Q keeps its tail out of the counter (0.895 before)')

    def test_black_l_tail_leaves_the_next_letter_its_white(self):
        # Before: the white after the l's tail (ln, lm, rows 0-100) was 0.83 / 0.87 / 0.94x the nn gap at 700 / 800 / 900 upright and
        # 0.81 / 0.90 / 1.00x italic: at 16-22 px the tail ran into the next letter (hello, skills, calm). Now 0.92-1.0x in both.
        try:
            import uharfbuzz as hb
        except ImportError:
            self.skipTest('pip install uharfbuzz')
        for path in (VF, VFI):
            for w in (700, 800, 900):
                nn = pair_white(hb, path, 'nn', w, 238, 290)
                for pair in ('ln', 'lm'):
                    with self.subTest(font=os.path.basename(path), wght=w, pair=pair):
                        self.assertGreaterEqual(pair_white(hb, path, pair, w, 0, 100), 0.91 * nn)

    def test_siblings_keep_their_round_7_knobs(self):
        # Every round-8 knob is Sans only: with a sibling family active (CASCIVO_FAMILY) glyphs.py loads its round-7 values.
        code = (
            'import json, glyphs, params\n'
            'print(json.dumps([glyphs.R8, list(glyphs.CAPW_START), list(glyphs.CAPW_THIN), list(glyphs.Q_CROSS_IT), glyphs.L_RSB,'
            ' glyphs.L_BOLD_OPEN, glyphs.L_BOLD_OPEN_IT, params.MID_WGHT]))\n'
        )
        for fam in ('mono', 'serif', 'condensed'):
            env = dict(os.environ, CASCIVO_FAMILY=fam)
            out = subprocess.run([sys.executable, '-I', '-c', f'import sys; sys.path.insert(0, {HERE!r})\n' + code], env=env, capture_output=True, text=True, check=True)
            r8, start, thin, cross, rsb, bold_open, bold_open_it, mid = json.loads(out.stdout.strip().splitlines()[-1])
            with self.subTest(family=fam):
                self.assertFalse(r8)
                self.assertEqual(start, [mid, mid])
                self.assertEqual(thin, [0.0, 0.0])
                self.assertEqual(cross, [0.0, 0.0])
                self.assertEqual((rsb, bold_open, bold_open_it), (0.6, 1.0, 0.0))


if __name__ == '__main__':
    unittest.main()

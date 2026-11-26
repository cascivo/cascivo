"""Round 9 design items (JUDGING.md): the 700 bend of m w g on the weight axis and the heavy J's hook. Each test
measures the built fonts against their round-8 numbers; the last checks the sibling families keep their round-8 outlines (every
round-9 knob is Sans only, glyphs.R9 and build.BOLD_ADV_BLEND_LETTERS)."""

import json
import os
import subprocess
import sys
import unittest

from test_font import VF, VFI
from test_r8_design import advances

HERE = os.path.dirname(os.path.abspath(__file__))


def bend(row, w):
    """|2nd difference| of the advance at w over its neighbours 100 units apart (score.py wstep)."""
    return abs(row[w - 100] - 2 * row[w] + row[w + 100])


@unittest.skipUnless(os.path.exists(VF) and os.path.exists(VFI), 'fonts not built')
class Round9Design(unittest.TestCase):
    def test_m_w_g_bend_less_at_bold(self):
        # Round 8: the Bold master kept m w g at their natural Bold advance, a bend of 23-32 units at 700 (Inter, Geist, Plex 1-2).
        # Round 9 moves them half way to the Regular-Black line: 11-16 units.
        for path in (VF, VFI):
            a = advances(path, 'mwg', (600, 700, 800))
            for c in 'mwg':
                with self.subTest(font=os.path.basename(path), char=c):
                    self.assertLessEqual(bend({w: a[w][c] for w in a}, 700), 17)

    def test_heavy_j_carries_more_ink(self):
        # Round 8: the J at 900 carried 0.263 (upright) and 0.273 (italic) of ink per advance at score.py's size; Inter 0.339 / 0.337.
        import score

        for path, floor in ((VF, 0.268), (VFI, 0.278)):
            with self.subTest(font=os.path.basename(path)):
                self.assertGreaterEqual(float(score.m_color(score.Face(path), 900)['J']), floor)

    def test_siblings_keep_their_round_8_knobs(self):
        code = (
            'import json, glyphs\n'
            'print(json.dumps([glyphs.R9, list(glyphs.A_THIN), list(glyphs.J_HEAVY)]))\n'
        )
        for fam in ('mono', 'serif', 'condensed'):
            env = dict(os.environ, CASCIVO_FAMILY=fam)
            out = subprocess.run([sys.executable, '-I', '-c', f'import sys; sys.path.insert(0, {HERE!r})\n' + code], env=env, capture_output=True, text=True, check=True)
            r9, thin, j = json.loads(out.stdout.strip().splitlines()[-1])
            with self.subTest(family=fam):
                self.assertFalse(r9)
                self.assertEqual(thin, [0.0, 0.0])
                self.assertEqual(j, [0.0, 0.0])


if __name__ == '__main__':
    unittest.main()

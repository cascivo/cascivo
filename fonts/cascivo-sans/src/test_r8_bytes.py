"""Round 8 bytes: the cu2qu tolerance and the like-for-like size fields in comparison.json.

    python3 -I src/build.py && python3 -I -m unittest src/test_r8_bytes.py
"""
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import build  # noqa: E402
import glyphs as GL  # noqa: E402


class Tolerance(unittest.TestCase):
    def test_held_glyphs_are_drawn_glyphs(self):
        # MAX_ERR_GLYPH is keyed by the build's own names (alpha is uni03B1 until finish() renames it): a key that names
        # no drawn glyph silently converts that glyph at the looser MAX_ERR, which is how round 8 first missed alpha
        for name in build.MAX_ERR_GLYPH:
            self.assertIn(name, GL.GLYPHS, name)
            self.assertLess(build.MAX_ERR_GLYPH[name], build.MAX_ERR)


class Comparison(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(os.path.join(HERE, '..', 'comparison.json'), encoding='utf-8') as fh:
            cls.entry = json.load(fh)['fonts'][0]

    def test_like_for_like_fields(self):
        # the references are unhinted wght-only slices (Inter, Geist): the unhinted field is the one to set beside them,
        # and keeping opsz costs bytes on top of the hinted slice
        e = self.entry
        for side in ('upright', 'italic'):
            hinted, unhinted = e[f'latin_wght_{side}_bytes'], e[f'latin_wght_unhinted_{side}_bytes']
            self.assertLess(unhinted, hinted)
            self.assertGreater(e[f'latin_opsz_wght_{side}_bytes'], hinted)

    def test_round8_sizes_hold(self):
        # round 7 measured 32,540 / 35,328 (hinted) and 26,752 / 29,116 (unhinted); budgets are the round-8 sizes + 1%
        e = self.entry
        self.assertLessEqual(e['latin_wght_upright_bytes'], 31_810)
        self.assertLessEqual(e['latin_wght_italic_bytes'], 34_990)
        self.assertLessEqual(e['latin_wght_unhinted_upright_bytes'], 25_880)
        self.assertLessEqual(e['latin_wght_unhinted_italic_bytes'], 28_710)


if __name__ == '__main__':
    unittest.main()

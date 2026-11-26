"""Round 10 (engine) design items (JUDGING.md): the narrower Thin A with its A pairs kerned by hand, the bar's sidebearings and
Black's Q tail. Each test measures the built fonts against their round-9 numbers; the last checks the sibling families keep their
round-9 outlines (every round-10 knob is Sans only, glyphs.R10)."""

import json
import os
import subprocess
import sys
import unittest

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

from test_font import VF, VFI

HERE = os.path.dirname(os.path.abspath(__file__))


def glyph_metrics(path, wght, char):
    """(advance, left sidebearing, right sidebearing, yMin) of char at wght, opsz 14, in font units."""
    f = instantiateVariableFont(TTFont(path), {'wght': wght, 'opsz': 14})
    gs = f.getGlyphSet()
    name = f.getBestCmap()[ord(char)]
    pen = BoundsPen(gs)
    gs[name].draw(pen)
    x0, y0, x1, _ = pen.bounds
    adv = f['hmtx'][name][0]
    return adv, x0, adv - x1, y0


@unittest.skipUnless(os.path.exists(VF) and os.path.exists(VFI), 'fonts not built')
class Round10Design(unittest.TestCase):
    def test_thin_a_is_narrower_than_regular(self):
        # Round 9: Thin's A was 0.98x its Regular's upright (Inter and Geist 0.89-0.90x), a 19-unit bend at 400 on the weight axis.
        # Upright only: the italic keeps its A (glyphs.A_THIN).
        self.assertLessEqual(glyph_metrics(VF, 100, 'A')[0] / glyph_metrics(VF, 400, 'A')[0], 0.94)

    def test_bar_keeps_its_distance(self):
        # Round 9: the upright bar kept 80 units a side at Regular (Inter 128) and 78 at Black (Inter 107); `1|` read as one mark.
        for wght, floor in ((400, 100), (900, 90)):
            _, lsb, rsb, _ = glyph_metrics(VF, wght, '|')
            with self.subTest(wght=wght):
                self.assertGreaterEqual(min(lsb, rsb), floor)

    def test_black_q_tail_stops_nearer_the_line(self):
        # Round 9: Black's Q tail reached 144 under the baseline upright and 130 italic (Inter Black 54); test_font keeps it >= 110.
        for path in (VF, VFI):
            with self.subTest(font=os.path.basename(path)):
                self.assertGreaterEqual(glyph_metrics(path, 900, 'Q')[3], -120)

    def test_siblings_keep_their_round_9_knobs(self):
        code = 'import json, glyphs\nprint(json.dumps([glyphs.R10, list(glyphs.A_THIN), glyphs.BAR_SB, list(glyphs.Q_HEAVY_RISE)]))\n'
        for fam in ('mono', 'serif', 'condensed'):
            env = dict(os.environ, CASCIVO_FAMILY=fam)
            out = subprocess.run([sys.executable, '-I', '-c', f'import sys; sys.path.insert(0, {HERE!r})\n' + code], env=env, capture_output=True, text=True, check=True)
            r10, thin, bar, rise = json.loads(out.stdout.strip().splitlines()[-1])
            with self.subTest(family=fam):
                self.assertFalse(r10)
                self.assertEqual(thin, [0.0, 0.0])
                self.assertEqual(bar, 1.1)
                self.assertEqual(rise, [0, 0])


if __name__ == '__main__':
    unittest.main()

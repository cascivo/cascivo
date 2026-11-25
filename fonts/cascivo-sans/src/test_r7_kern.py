"""Round 7 kerning gates (the open items of JUDGING.md, Round 6 (engine))."""

import unittest

from test_font import INTER_KERNING, VF, VFI, pair_kerning, shaped_gaps


class R7Kerning(unittest.TestCase):
    def setUp(self):
        try:
            import uharfbuzz as hb
        except ImportError:
            self.skipTest('pip install uharfbuzz')
        self.hb = hb

    def test_display_black_t_pairs_keep_their_white(self):
        # The italic t's crossbar reaches over the next letter: ta td tq kept 22-23 units at 900 / opsz 48, tg 28 and Rt 14, under the 30
        # that test_display_black_keeps_its_white asks of the other strings. Inter Black at its largest optical size keeps 44-54.
        for kind, path in (('upright', VF), ('italic', VFI)):
            for text in ('ta', 'td', 'tq', 'tg', 'Rt'):
                with self.subTest(kind=kind, text=text):
                    (gap,), _ = shaped_gaps(self.hb, path, text, 900, 48)
                    self.assertGreaterEqual(gap, 30, f'{text} keeps {gap:.0f} at 900/48')

    def test_display_black_t_pairs_do_not_loosen(self):
        # The opening stops short of a hole: at most 1.3x Inter Black's white at opsz 32 (ta 52, td tq 50, tg 49, Rt 44), read as 1000 units.
        limit = {'ta': 52, 'td': 50, 'tq': 50, 'tg': 49, 'Rt': 44}
        for text, inter in limit.items():
            with self.subTest(text=text):
                (gap,), _ = shaped_gaps(self.hb, VFI, text, 900, 48)
                self.assertLessEqual(gap, 1.3 * inter, f'{text} keeps {gap:.0f} at 900/48, Inter {inter}')

    def test_t_pairs_below_black_stay_unkerned(self):
        # None in the override table would give the pair the machine's -32 to -41 at Thin and Regular (it adds the pair); 0 keeps them as shipped.
        for text in ('ta', 'td', 'tq', 'tg'):
            for wght in (100, 400):
                with self.subTest(text=text, wght=wght):
                    self.assertEqual(pair_kerning(self.hb, VFI, text, wght), 0)

    def test_rt_keeps_clear_of_the_bar_below_black(self):
        # Rt joined kern_overrides.py, whose pairs keep 0.3x the HH gap (test_hand_kerning_keeps_clear); the unkerned italic Rt read 52 at 400
        # (HH 192) and Thin 68-ish against Inter's 68 and 85. Thin and Regular open a little (15, 10), Black 20 for the Display gate.
        for wght, floor in ((100, 80), (400, 60)):
            with self.subTest(wght=wght):
                (gap,), _ = shaped_gaps(self.hb, VFI, 'Rt', wght)
                self.assertGreaterEqual(gap, floor, f'Rt keeps {gap:.0f} at {wght}')

    def test_thin_va_kerns_three_quarters_of_inter(self):
        # Italic Thin VA kerned -45 (0.66x Inter's -68), the weakest Thin pair; -53 is 0.78x, the white 0.88x of Inter's as AV's.
        for kind, path in (('upright', VF), ('italic', VFI)):
            for pair in ('VA', 'AV'):
                inter = INTER_KERNING[kind][pair][100]
                with self.subTest(kind=kind, pair=pair):
                    got = -pair_kerning(self.hb, path, pair, 100)
                    self.assertGreaterEqual(got, 0.75 * inter, f'{pair} kerns {got} at Thin, Inter {inter}')


if __name__ == '__main__':
    unittest.main()

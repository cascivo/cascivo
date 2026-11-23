"""Deterministic tests for score.py and tune.py. They use the committed font as its own reference, so they need no downloads."""

import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402

import score  # noqa: E402
import tune  # noqa: E402

VF = score.OWN[False]


@unittest.skipUnless(os.path.exists(VF), 'build the font first')
class ScoreTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.overall, cls.items, cls.bad, cls.rows = score.run(font=VF, ref_paths=[VF, VF], weights=(300, 400, 500))

    def test_font_against_itself_is_perfect(self):
        self.assertAlmostEqual(self.overall, 10.0, places=6)
        self.assertTrue(all(v == 10.0 for v in self.items.values()), self.items)

    def test_deterministic(self):
        again = score.run(font=VF, ref_paths=[VF, VF], weights=(300, 400, 500))
        self.assertEqual(again[0], self.overall)
        self.assertEqual(again[2], self.bad)

    def test_every_metric_is_covered(self):
        self.assertEqual(set(self.rows), {'color', 'counter', 'spacing', 'wstep', 'stem', 'ambig', 'overshoot', 'opsz', 'kink'})

    def test_signature_glyphs_are_not_rows(self):
        for d in self.rows.values():
            self.assertFalse([k for k in d if isinstance(k[0], str) and len(k[0]) == 1 and k[0] in score.SIGNATURE])

    def test_different_weight_reference_scores_lower(self):
        own = score.Face(VF)
        light = score.m_color(own, 300)
        bold = score.m_color(own, 700)
        self.assertGreater(sum(bold.values()), sum(light.values()))
        zs = score.zscore(bold, [light], 'color')
        self.assertLess(score.summarise({'color': zs})[1]['colour'], 10)

    def test_runs(self):
        line = np.array([0, 1, 1, 0, 0, 1, 0, 1, 1, 1], dtype=bool)
        self.assertEqual(score.runs(line), ([2, 1, 3], [2, 1]))

    def test_counters_found(self):
        c = score.m_counter(score.Face(VF), 400)
        self.assertIn('o', c)
        self.assertNotIn('l', c)
        self.assertGreater(c['O'], 0)

    def test_run_is_fast_enough(self):
        import time
        t = time.time()
        score.run(font=VF, ref_paths=[VF, VF])
        self.assertLess(time.time() - t, 60)


class ZScoreTest(unittest.TestCase):
    def test_spread_is_floored(self):
        z = score.zscore({'a': 1.0}, [{'a': 1.0}, {'a': 1.0}], 'spacing')['a'][0]
        self.assertEqual(z, 0.0)
        z = score.zscore({'a': 1.12}, [{'a': 1.0}, {'a': 1.0}], 'spacing')['a'][0]
        self.assertAlmostEqual(z, 0.12 / 0.1)

    def test_one_sided_metric_ignores_better_than_reference(self):
        self.assertEqual(score.zscore({'a': 0.1}, [{'a': 0.5}], 'ambig')['a'][0], 0.0)
        self.assertGreater(score.zscore({'a': 0.9}, [{'a': 0.5}], 'ambig')['a'][0], 1)

    def test_excess_is_monotone(self):
        mk = lambda zs: {i: (z, 0, 0) for i, z in enumerate(zs)}  # noqa: E731
        self.assertEqual(score.excess(mk([0.2, -0.4])), 0)
        self.assertLess(score.excess(mk([1, 1, 1])), score.excess(mk([2, 2, 2])))


class TuneTest(unittest.TestCase):
    def test_set_get_dict_tuple_list(self):
        self.assertEqual(tune._set({'a': 1, 'b': 2}, 'b', 5), {'a': 1, 'b': 5})
        self.assertEqual(tune._set((1, 2, 3), '1', 9), (1, 9, 3))
        self.assertEqual(tune._get({'k': [1, 2]}, 'k.1'), 2)
        self.assertEqual(tune._set({'k': [1, 2]}, 'k.0', 7), {'k': [7, 2]})

    def test_patch_scalar_and_restore(self):
        import params
        old = params.HEAVY_TIGHTEN
        try:
            tune.patch('HEAVY_TIGHTEN', 0.4)
            self.assertEqual(params.HEAVY_TIGHTEN, 0.4)
            self.assertEqual(tune.read('HEAVY_TIGHTEN'), 0.4)
        finally:
            tune.patch('HEAVY_TIGHTEN', old)
        self.assertEqual(params.HEAVY_TIGHTEN, old)

    def test_linspace(self):
        self.assertEqual(tune.linspace(0, 1, 5), [0, 0.25, 0.5, 0.75, 1])
        self.assertEqual(tune.linspace(2, 3, 1), [2])

    def test_unknown_constant_exits(self):
        with self.assertRaises(SystemExit):
            tune.read('NO_SUCH_CONSTANT')

    def test_tune_picks_best_scoring_value(self):
        """Stub the build and the score: the best-scoring grid value that passes the gates wins; a failing gate falls through."""
        import params
        old = params.HEAVY_TIGHTEN
        calls = {}
        real = (tune._build_and_score, tune.gates, tune.cf.ProcessPoolExecutor)

        class Serial:
            def __init__(self, **kw): pass
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def map(self, fn, it): return [fn(x) for x in it]

        def fake_build(args):
            patches = args[0]
            x = dict(patches)['HEAVY_TIGHTEN']
            return 10 - abs(x - 0.45) * 10, f'/fake/{x}'

        def fake_gates(path, italic):
            calls[path] = 1
            return 'boom' if path.endswith('0.45') else ''

        tune._build_and_score, tune.gates, tune.cf.ProcessPoolExecutor = fake_build, fake_gates, Serial
        try:
            res = tune.tune(['HEAVY_TIGHTEN'], [(0.4, 0.5)], steps=5)
        finally:
            tune._build_and_score, tune.gates, tune.cf.ProcessPoolExecutor = real
            tune.patch('HEAVY_TIGHTEN', old)
        spec, base, best, bs, ns, note = res[0]
        self.assertEqual(spec, 'HEAVY_TIGHTEN')
        self.assertIn(best, (0.425, 0.475))  # 0.45 was best but failed its gate
        self.assertGreater(ns, bs - 1e-9)
        self.assertIn('/fake/0.45', calls)


if __name__ == '__main__':
    unittest.main()

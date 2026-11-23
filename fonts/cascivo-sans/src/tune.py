"""Tune named build constants against score.py, behind the test_font.py gates.

    python3 -I src/tune.py --param HEAVY_TIGHTEN --range 0.40:0.60 [--steps 5]
    python3 -I src/tune.py --param HEAVY_TIGHTEN --range 0.4:0.6 --param BOLD_TIGHTEN --range 0.2:0.5

A parameter is NAME (a module-level number in params.py, glyphs.py or build.py) or NAME.KEY (an entry
of a dict, list or tuple constant: KEY is a dict key or an index). Parameters are swept one after the
other (coordinate descent, one pass); each sweep builds the upright variable font once per grid point,
in parallel, to a temp directory, and scores it with score.py. The grid points are then tried best
first against the gates (test_font.py on the candidate plus the woff2 size budget); the first that
passes wins. Nothing in the repository is written. Prints the best value and the delta, nothing more.
"""

import argparse
import concurrent.futures as cf
import importlib
import multiprocessing
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

MODULES = ('params', 'glyphs', 'build')


def _find(name):
    mod = [importlib.import_module(m) for m in MODULES]
    for m in mod:
        if hasattr(m, name):
            return m
    raise SystemExit(f'tune: no constant {name} in {", ".join(MODULES)}')


def _key(container, k):
    if isinstance(container, dict):
        return k if k in container else int(k) if int(k) in container else k
    return int(k)


def read(spec):
    name, _, key = spec.partition('.')
    v = getattr(_find(name), name)
    return _get(v, key) if key else v


def _get(v, key):
    for k in key.split('.'):
        v = v[_key(v, k)]
    return v


def _set(v, key, x):
    """A copy of v with the entry at key set to x (tuples stay tuples)."""
    k, _, rest = key.partition('.')
    k = _key(v, k)
    new = _set(v[k], rest, x) if rest else x
    if isinstance(v, dict):
        return {**v, k: new}
    out = list(v)
    out[k] = new
    return tuple(out) if isinstance(v, tuple) else out


def patch(spec, x):
    """Set the constant in the module that defines it and in every loaded module that imported the same value."""
    name, _, key = spec.partition('.')
    home = _find(name)
    old = getattr(home, name)
    new = _set(old, key, x) if key else x
    for m in list(sys.modules.values()):
        if getattr(m, name, None) is old:
            setattr(m, name, new)


def _build_and_score(args):
    """Worker: patch, build the upright VF to a temp file, score it. Returns (score, path)."""
    patches, tmp, tag, refs, italic = args
    import build
    import score
    for spec, x in patches:
        patch(spec, x)
    vf = build.build(italic=italic)
    path = os.path.join(tmp, f'{tag}.ttf')
    vf.save(path)
    overall, _, _, _ = score.run(font=path, italic=italic, refs=refs)
    return overall, path


def gates(path, italic):
    """test_font.py against the candidate, plus the full woff2 budget. Returns '' if clean, else the first failure."""
    import test_font
    from fontTools.ttLib import TTFont
    if italic:
        test_font.VFI = path
    else:
        test_font.VF = path
    suite = unittest.defaultTestLoader.loadTestsFromModule(test_font)
    res = unittest.TextTestRunner(stream=open(os.devnull, 'w'), verbosity=0).run(suite)
    bad = [str(t[0]) for t in res.failures + res.errors]
    f = TTFont(path)
    f.flavor = 'woff2'
    out = path + '.woff2'
    f.save(out)
    stem = 'CascivoSans-Italic[opsz,wght].woff2' if italic else 'CascivoSans[opsz,wght].woff2'
    if os.path.getsize(out) > test_font.BUDGETS[stem]:
        bad.append(f'budget {stem}: {os.path.getsize(out)} > {test_font.BUDGETS[stem]}')
    return bad[0] if bad else ''


def linspace(lo, hi, n):
    return [lo + (hi - lo) * i / (n - 1) for i in range(n)] if n > 1 else [lo]


def tune(params, ranges, steps=5, refs='/tmp/refs', italic=False, check_gates=True, jobs=4, log=None):
    """Coordinate descent over params. Returns [(spec, baseline, best, base_score, best_score, gate_note)]."""
    results, fixed = [], []
    ctx = multiprocessing.get_context('fork')
    with tempfile.TemporaryDirectory() as tmp:
        for spec, (lo, hi) in zip(params, ranges):
            base = read(spec)
            grid = sorted({round(x, 6) for x in linspace(lo, hi, steps)} | {base})
            jobs_args = [(fixed + [(spec, x)], tmp, f'{spec}-{i}', refs, italic) for i, x in enumerate(grid)]
            with cf.ProcessPoolExecutor(max_workers=jobs, mp_context=ctx) as ex:
                scored = list(ex.map(_build_and_score, jobs_args))
            table = sorted(zip(grid, scored), key=lambda r: -r[1][0])
            base_score = next(s[0] for x, s in zip(grid, scored) if x == base)
            best, note = base, 'baseline kept'
            for x, (s, path) in table:
                if x == base:
                    break  # nothing above the baseline passes: keep it
                bad = gates(path, italic) if check_gates else ''
                if not bad:
                    best, note = x, 'gates ok' if check_gates else 'gates skipped'
                    break
                note = f'gate failed at {x}: {bad}'
            best_score = next(s[0] for x, s in zip(grid, scored) if x == best)
            if log:
                log(table)
            fixed.append((spec, best))
            results.append((spec, base, best, base_score, best_score, note))
    return results


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--param', action='append', required=True)
    ap.add_argument('--range', action='append', required=True, help='LO:HI, once per --param')
    ap.add_argument('--steps', type=int, default=5)
    ap.add_argument('--refs', default='/tmp/refs')
    ap.add_argument('--italic', action='store_true', help='tune the italic font instead')
    ap.add_argument('--no-gates', action='store_true', help='skip test_font.py (a final check is still needed)')
    ap.add_argument('--jobs', type=int, default=4)
    a = ap.parse_args(argv)
    if len(a.param) != len(a.range):
        raise SystemExit('tune: one --range per --param')
    ranges = [tuple(float(x) for x in r.split(':')) for r in a.range]
    for spec, base, best, bs, ns, note in tune(a.param, ranges, a.steps, a.refs, a.italic, not a.no_gates, a.jobs):
        print(f'{spec} best {best:g} (was {base:g}, {best - base:+g})  score {ns:.3f} ({ns - bs:+.3f})  {note}')


if __name__ == '__main__':
    main()

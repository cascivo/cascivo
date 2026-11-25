"""Round 7 bytes: what the hinted variable fonts spend on instructions and how the stream is packed.

    python3 -I src/build.py && python3 -I -m unittest src/test_r7_bytes.py
"""
import io
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.ttLib.tables import ttProgram  # noqa: E402

from test_font import DIST, VF, VFI  # noqa: E402


def _calls(program):
    """The (args, ...) of every push group a program ends a CALL on: [(values, ...)] in order, as ints."""
    p = ttProgram.Program()
    p.fromBytecode(program.getBytecode())
    groups, cur, out = [], None, []
    for a in p.getAssembly():
        a = a.split('\t')[0]
        if a.startswith(('PUSH', 'NPUSH')):
            cur = []
        elif a.lstrip('-').isdigit():
            cur.append(int(a))
        else:
            if a.startswith('CALL') and cur:
                out.append(cur)
            cur = None
    return out


def _fdefs(fpgm):
    p = ttProgram.Program()
    p.fromBytecode(fpgm.getBytecode())
    asm, defs, last = [a.split('\t')[0] for a in p.getAssembly()], [], None
    for a in asm:
        if a.lstrip('-').isdigit():
            last = int(a)
        elif a.startswith('FDEF'):
            defs.append(last)
    return defs


class MarkClear(unittest.TestCase):
    """build._keep_marks_clear moves a mark up to a pixel clear of the glyph below it. A mark's points are
    consecutive, so a call carries the first point and the count, not every point (each list cost bytes in every
    accented glyph of the full fonts); the loop that walks them lives in the helper function after it."""

    @classmethod
    def setUpClass(cls):
        if not (os.path.exists(VF) and os.path.exists(VFI)):
            raise unittest.SkipTest('run src/build.py first')

    def test_calls_carry_first_point_and_count(self):
        for path in (VF, VFI):
            font = TTFont(path)
            glyf, maxp = font['glyf'], font['maxp']
            defs = _fdefs(font['fpgm'].program)
            fn = defs[-2]  # the clear function; its point-walking helper is defined right after it
            self.assertEqual(defs[-1], fn + 1, path)
            self.assertEqual(maxp.maxFunctionDefs, fn + 2, path)
            seen = 0
            for name in font.getGlyphOrder():
                g = glyf[name]
                if not g.isComposite() or not getattr(g, 'program', None):
                    continue
                marks = [c for c in _calls(g.program) if len(c) >= 5 and c[-1] == fn]
                if not marks:
                    continue
                ranges, start = [], 0
                for c in g.components:
                    n = len(glyf[c.glyphName].getCoordinates(glyf)[0])
                    ranges.append(range(start, start + n))
                    start += n
                for first, count, bottom, top, _ in marks:
                    seen += 1
                    # the call's points are one component's whole range: the mark stacked on what lies below it
                    mark = next((r for r in ranges[1:] if r.start == first), None)
                    self.assertIsNotNone(mark, f'{path} {name}: first point {first} starts no component')
                    self.assertEqual(count, len(mark), f'{path} {name}')
                    self.assertIn(bottom, mark, f'{path} {name}')
                    self.assertLess(top, first, f'{path} {name}')
            self.assertGreater(seen, 300, path)  # the accented letters still carry it

    def test_storage_slots_are_reserved(self):
        """The clear function keeps the shift and the next point in two storage slots past ttfautohint's."""
        for path in (VF, VFI):
            font = TTFont(path)
            p = ttProgram.Program()
            p.fromBytecode(font['fpgm'].program.getBytecode())
            asm = [a.split('\t')[0] for a in p.getAssembly()]
            slots = {int(asm[i - 1]) for i, a in enumerate(asm) if a.startswith(('WS', 'RS')) and asm[i - 1].isdigit() and i > len(asm) - 60}
            self.assertTrue(slots, path)
            self.assertLess(max(slots), font['maxp'].maxStorage, path)


class Woff2Stream(unittest.TestCase):
    """build._save_woff2 tries a few brotli settings and keeps the smallest stream (the same bytes pack up to
    0.3% apart by block size): never larger than the library's default, and a stream any decoder reads."""

    def test_keeps_the_smallest_stream(self):
        import tempfile

        from fontTools.ttLib import woff2

        import build
        src = os.path.join(DIST, 'CascivoSans-Bold.ttf')
        if not os.path.exists(src):
            self.skipTest('run src/build.py first')
        self.assertIn({}, build.BROTLI_TRIES)  # the library's own default is always a candidate
        self.assertTrue(all(t.get('lgwin', 22) <= 24 for t in build.BROTLI_TRIES))
        real, sizes = woff2.brotli.compress, []

        def spy(data, **kw):
            out = real(data, **kw)
            sizes.append(len(out))
            return out
        old_dist = build.DIST
        with tempfile.TemporaryDirectory() as tmp:
            build.DIST = tmp
            woff2.brotli.compress = spy
            try:
                build._save_woff2(TTFont(src), 'x.woff2')
            finally:
                woff2.brotli.compress, build.DIST = real, old_dist
            data = open(os.path.join(tmp, 'x.woff2'), 'rb').read()
            self.assertEqual(len(sizes), len(build.BROTLI_TRIES))
            # header, table directory and padding are the same for every candidate
            overhead = len(data) - min(sizes)
            self.assertLess(overhead, 1500)
            self.assertLessEqual(len(data), max(sizes) + overhead)
            self.assertEqual(TTFont(io.BytesIO(data)).getGlyphOrder(), TTFont(src).getGlyphOrder())


if __name__ == '__main__':
    unittest.main()

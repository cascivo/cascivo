"""Outline lint: every stroke contour must be a simple (non-self-intersecting) loop.

A self-intersecting stroke outline renders with notches or holes once overlaps and winding
interact, and it is the typical failure of naive stroke expansion on tight inner curves.

    python3 -I src/lint.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import glyphs as GL  # noqa: E402
from geom import expand, flatten  # noqa: E402
from build import italicize  # noqa: E402
from params import ITALIC_MASTERS, MASTERS, P  # noqa: E402


def _cross(a, b, c, d):
    def orient(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])

    d1, d2 = orient(c, d, a), orient(c, d, b)
    d3, d4 = orient(a, b, c), orient(a, b, d)
    return d1 * d2 < -1e-6 and d3 * d4 < -1e-6


def self_intersects(pts):
    n = len(pts)
    edges = [(pts[i], pts[(i + 1) % n]) for i in range(n)]
    for i in range(n):
        a, b = edges[i]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            c, d = edges[j]
            if max(a[0], b[0]) < min(c[0], d[0]) or max(c[0], d[0]) < min(a[0], b[0]):
                continue
            if max(a[1], b[1]) < min(c[1], d[1]) or max(c[1], d[1]) < min(a[1], b[1]):
                continue
            if _cross(a, b, c, d):
                return True
    return False


def main():
    bad = []
    for mname, loc in MASTERS + ITALIC_MASTERS:
        p = P(**loc)
        for name in GL.ORDER:
            g = GL.G(p)
            GL.GLYPHS[name][1](g, p)
            for si, s in enumerate(italicize(g.strokes, p)):
                for c in expand(s, p.V, p.H):
                    if self_intersects(flatten(c, 16)):
                        bad.append((mname, name, si))
    for b in bad:
        print('self-intersecting:', *b)
    print(f'{len(bad)} problem contours')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())

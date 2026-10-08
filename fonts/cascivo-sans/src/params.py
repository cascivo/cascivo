"""Master parameters. Everything a glyph knows about weight, optical size and slant comes from here.

Axes: wght 100–900 (default 400), opsz 8–48 (default 14), slnt -12–0 (default 0).
Masters are the default plus one extreme per axis end; the variation model adds their deltas,
which is what keeps a three-axis family to six masters instead of a 3×3×2 grid.
"""

import math

DEFAULT = dict(wght=400, opsz=14, slnt=0)

MASTERS = [
    ('Regular', dict(wght=400, opsz=14, slnt=0)),
    ('Thin', dict(wght=100, opsz=14, slnt=0)),
    ('Black', dict(wght=900, opsz=14, slnt=0)),
    ('Caption', dict(wght=400, opsz=8, slnt=0)),
    ('Display', dict(wght=400, opsz=48, slnt=0)),
    ('Oblique', dict(wght=400, opsz=14, slnt=-12)),
]


def _pw(x, table):
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    raise ValueError(x)


class P:
    def __init__(self, wght, opsz, slnt):
        self.wght, self.opsz, self.slnt = wght, opsz, slnt
        V = _pw(wght, [(100, 22), (400, 90), (900, 178)])
        contrast = _pw(wght, [(100, 0.96), (400, 0.87), (900, 0.6)])
        xh, spacing, counter, k, aperture = 528, 1.0, 1.0, 0.585, 0.0
        if opsz == 8:  # caption: bigger x-height, looser, wider, flatter contrast, open apertures
            V += 5
            contrast = min(0.95, contrast + 0.07)
            xh += 14
            spacing, counter, k, aperture = 1.24, 1.06, 0.575, 7.0
        elif opsz == 48:  # display: tighter, slightly narrower, crisper contrast, closed apertures
            V -= 3
            contrast -= 0.05
            xh -= 10
            spacing, counter, k, aperture = 0.8, 0.97, 0.60, -5.0
        self.V = V
        self.H = V * contrast
        # crossbars (e, A, H...) thin faster than bowls as weight rises, or heavy counters close
        self.bar = self.H * (1 - 0.22 * max(0.0, (V - 90) / 88))
        self.cap = 700
        self.asc = 742
        self.desc = -212
        self.xh = xh
        self.ov = 10 + V * 0.04  # round overshoot grows with weight so bold rounds don't look short
        self.k = k
        self.ap = aperture  # degrees added to terminal angles: + opens c/e/s/a
        # Width across weights: a UI font must not reflow when text turns bold (hover, active
        # tab), so total width may grow only ~5% per 300 weight units (Geist: 0.96x Thin, 1.11x
        # Black). Spacing therefore stays nearly constant and the counters absorb stem growth.
        self.S = (62 + 0.08 * V) * spacing  # stem sidebearing unit (lowercase, figures, punctuation)
        self.Sc = self.S * 1.3  # capitals carry more space: their counters are bigger
        self.cw = counter
        self.cn = _pw(V, [(20, 400), (90, 284), (182, 168)]) * counter  # n counter
        self.cH = self.cn * 418 / 284  # H counter, in proportion to n
        self.dot = V * 1.12 + 14  # i dot / period: never thinner than a readable square
        self.mt = V * 0.86 + 6  # accent stroke
        self.fig_adv = round(580 + 0.55 * (V - 90) + (spacing - 1) * 60)  # tabular figure advance
        self.slant = math.tan(math.radians(-slnt))

    @property
    def nw(self):
        return self.cn + 2 * self.V

    @property
    def Hw(self):
        return self.cH + 2 * self.V

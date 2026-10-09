"""Master parameters. Everything a glyph knows about weight, optical size and italic comes from here.

Two variable fonts, each with axes wght 100–900 (default 400) and opsz 8–48 (default 14): the
upright and the italic. The italic is a separate font, not a slant axis: its letters have
different structures (a single-storey a, a descending f), and masters on one axis must share
structure. Each font's masters are the default plus one extreme per axis end; the variation model
adds their deltas, which keeps a two-axis family to five masters instead of a 3×3 grid.
"""

import math

DEFAULT = dict(wght=400, opsz=14)
# Black's stem: 36% of the x-height, as Geist's and Inter's Black. At 178 (34%) Black was
# visibly lighter than both.
BLACK_STEM = 190
ITALIC_ANGLE = 10  # degrees; Plex and Inter italics sit near 10-11

MASTERS = [
    ('Regular', dict(wght=400, opsz=14)),
    ('Thin', dict(wght=100, opsz=14)),
    ('Black', dict(wght=900, opsz=14)),
    ('Caption', dict(wght=400, opsz=8)),
    ('Display', dict(wght=400, opsz=48)),
]
ITALIC_MASTERS = [(('Italic' if n == 'Regular' else f'{n} Italic'), dict(loc, italic=True)) for n, loc in MASTERS]


def _pw(x, table):
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    raise ValueError(x)


class P:
    def __init__(self, wght, opsz, italic=False):
        self.wght, self.opsz, self.italic = wght, opsz, italic
        V = _pw(wght, [(100, 22), (400, 84), (900, BLACK_STEM)])  # Regular 84: Geist-like color in text
        # heavy weights keep their horizontals: at 0.6 Black's arches, bars and s spine went thin
        # beside the stems and letters looked pinched (Geist 0.70, Inter 0.73 at Black)
        contrast = _pw(wght, [(100, 0.96), (400, 0.87), (900, 0.72)])
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
        self.bar = self.H * (1 - 0.22 * self.heavy)
        self.cap = 700
        self.asc = 742
        self.desc = -212
        self.xh = xh
        self.ov = 10 + V * 0.04  # round overshoot grows with weight so bold rounds don't look short
        self.k = k
        self.ap = aperture  # degrees added to terminal angles: + opens c/e/s/a
        # Width across weights: a UI font must not reflow when text turns bold (hover, active
        # tab), so total width may grow only ~5% per 300 weight units (Geist: 0.96x Thin, 1.11x
        # Black). Counters absorb most of the stem growth, and spacing tightens to keep rhythm.
        # Sidebearings tighten as stems thicken, as in every heavy grotesque: Geist and Inter lose
        # about 30% of their Regular sidebearing by Black. Held nearly constant, Black's gaps
        # between letters matched the space inside them and words broke into separate blobs.
        self.S = (77.1 - (0.03 if V < 84 else 0.25) * (V - 84)) * spacing  # stem sidebearing unit (lowercase, figures, punctuation)
        self.Sc = self.S * 1.3  # capitals carry more space: their counters are bigger
        self.cw = counter
        # n is 0.82 x-heights wide at Regular (Geist 0.79, Inter 0.80). It was 0.88 with tighter
        # spacing, which set the same line length but read as wide, close-set letters.
        self.cn = _pw(V, [(20, 374), (84, 270), (BLACK_STEM + 4, 145)]) * counter  # n counter
        if italic:
            self.cn *= 0.95  # italics run slightly narrower: the slant already adds movement
        self.cH = self.cn * 418 / 284  # H counter, in proportion to n
        # i dot / period: never thinner than a readable square. Against Geist's and Inter's, a
        # stem-proportional dot made punctuation 0.89x their ink at Regular and 1.6x at Black
        # (commas 1.7x as tall): Regular's grows a little, the heavy ones much less.
        self.dot = (V * 1.12 + 14) * 1.06 - 60 * self.heavy
        self.mt = V * 0.86 + 6  # accent stroke
        self.fig_adv = round(580 + 0.55 * (V - 90) + (spacing - 1) * 60)  # tabular figure advance
        self.slant = math.tan(math.radians(ITALIC_ANGLE)) if italic else 0.0

    @property
    def heavy(self):
        """0 up to Regular, 1 at Black: how far a heavy-weight adjustment applies. The variable
        font has masters only at Regular and Black, so only those two values ever take effect."""
        return max(0.0, (self.V - 90) / (BLACK_STEM - 90))

    @property
    def nw(self):
        return self.cn + 2 * self.V

    @property
    def Hw(self):
        return self.cH + 2 * self.V

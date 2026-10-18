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
THIN_STEM = 24  # Thin sits 2 above the old 22 so the first weight step is a full 20 (build.NAMED_STEMS)
BOLD_STEM = 146  # build.NAMED_STEMS at 700
MID_WGHT = round(400 + (BOLD_STEM - 84) / (BLACK_STEM - 84) * 500, 1)  # Bold's design coordinate (build._wght_map)
ITALIC_ANGLE = 10  # degrees; Plex and Inter italics sit near 10-11

MASTERS = [
    ('Regular', dict(wght=400, opsz=14)),
    ('Thin', dict(wght=100, opsz=14)),
    ('Black', dict(wght=900, opsz=14)),
    ('Bold', dict(wght=MID_WGHT, opsz=14)),
    ('Caption', dict(wght=400, opsz=8)),
    ('Display', dict(wght=400, opsz=48)),
]
ITALIC_MASTERS = [(('Italic' if n == 'Regular' else f'{n} Italic'), dict(loc, italic=True)) for n, loc in MASTERS]


def _pw(x, table):
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    raise ValueError(x)


# Width across weights: 100-700 stay within +-2% of Regular's, 750-900 within +5% (-2%), for mixed case and all caps. Stems
# add ~11% to a text line by Black; the sidebearings give back what they can and the guarded counters give back nothing.
# What that leaves at Black: a word gap 0.99x Inter's and a letter gap 0.43x (n sidebearing 22 against Inter's 50): as
# tight as the +5% allows. Interpolation between Regular and Black would put Bold (700) 58% of the way up Black's gain,
# so Bold is a master of its own that bends the sidebearing line (build.mid_master): it keeps the interpolated outline,
# moved half the way its advance shortens, and so stores only a shift per glyph.
# HEAVY_TIGHTEN and BOLD_TIGHTEN: the share of the stem sidebearing lost at Black and at Bold.
HEAVY_TIGHTEN = 0.53
BOLD_TIGHTEN = 0.35
# CH_THIN and CH_BLACK: the capitals' own counter (H's, in units; Regular's is 397, the lowercase n's scaled), at stem
#   20 and at stem 194. Capitals set their sidebearings from the lowercase's (Sc = 1.3 S at every weight, as Inter and
#   Geist keep them in proportion), so their width has to hold in the counter: it narrowed with n's, which cut an
#   all-caps line by 12% at Black, and at Thin it ran wide (n's 374 would put H 4% over Regular's with 26% more white).
CH_THIN = 470
CHD_THIN = 0.93  # the same narrowing, as a share, for the round and diagonal capitals
CH_BLACK = 300
# DIAG_TRIM: units the diagonal letters v w x y z lose from their width at Black. Their counters are open white,
#   not guarded, and they carried the widest ink growth beside the s and e.
DIAG_TRIM = 90
THIN_OPEN = 0.30  # share of the stem sidebearing Thin opens by, see P.__init__; 0.30 is held by the italic mixed-case line at Thin (-2.7% at 0.23), which the reflow test covers


class P:
    def __init__(self, wght, opsz, italic=False, loose=False):
        # `loose`: spacing without HEAVY_TIGHTEN, the reference kern.py takes the Display and Caption masters' opening from
        self.wght, self.opsz, self.italic = wght, opsz, italic
        V = V0 = _pw(wght, [(100, THIN_STEM), (400, 84), (900, BLACK_STEM)])  # Regular 84: Geist-like color in text
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
            spacing, counter, k, aperture = 0.88, 0.97, 0.60, -5.0  # 0.8 until Black's own tightening (HEAVY_TIGHTEN) met it: the two deltas add at 900/48, which left OO oo ss SS at 9-14 units and the italic GO overlapping
        self.V = V
        self.H = V * contrast
        # crossbars (e, A, H...) thin faster than bowls as weight rises, or heavy counters close
        self.bar = self.H * (1 - 0.22 * self.heavy)
        self.cap = 700
        self.asc = 742
        self.desc = -212
        self.xh = xh
        # round overshoot grows up to Regular, then holds: Inter's and Geist's stay constant by
        # weight, and growing on to Black (0.034 x-height) made Bold's and Black's counters taller
        self.ov = 10 + min(V, 84) * 0.04
        self.k = k
        self.ap = aperture  # degrees added to terminal angles: + opens c/e/s/a
        # Width across weights: a UI font must not reflow when text turns bold (hover, active
        # tab), so total width may grow only ~5% per 300 weight units (Geist: 0.96x Thin, 1.11x
        # Black). Counters absorb most of the stem growth, and spacing tightens to keep rhythm.
        # Sidebearings tighten as stems thicken, as in every heavy grotesque: Geist and Inter lose
        # about 30% of their Regular sidebearing by Black. Held nearly constant, Black's gaps
        # between letters matched the space inside them and words broke into separate blobs.
        self.S = (77.1 - (0.03 if V < 84 else 0.25) * (V - 84)) * spacing  # stem sidebearing unit (lowercase, figures, punctuation)
        # Set against Geist and Inter at equal x-height, text ran 3% long: letters 2-3% wider by
        # design, and an nn gap 10% wider at every weight. The gap closes; the letters stay. The
        # italic matched at Regular but ran 15-40% loose in its white by Black.
        # (Heavy weights tighten a little less: at Display Black, where the opsz and weight deltas
        # add up, the full amount closed lz, YT and xt.)
        # Thin's hairline stems left it 25% tighter than Inter's Thin (n sidebearing 72 against 97), so the
        # white opens as the weight falls below Regular; Regular and heavier are unchanged.
        self.opened = opened = 1 + THIN_OPEN * max(0.0, (400 - wght) / 300)  # 1 from Regular up
        self.S *= opened
        self.S *= (0.97 - 0.04 * self.heavy) if italic else (0.91 + 0.04 * self.heavy)
        self.Sfig = self.S  # figures and math signs keep their ink: their advance is fixed, so a tighter S would widen them
        tighten = lambda bold, black: 1 - (_pw(wght, [(400, 0.0), (MID_WGHT, bold), (900, black)]) if wght >= 400 and not loose else 0.0)  # noqa: E731
        self.S *= tighten(BOLD_TIGHTEN, HEAVY_TIGHTEN)
        self.Sc = self.S * 1.3  # capitals carry more space: their counters are bigger
        self.cw = counter
        # n is 0.82 x-heights wide at Regular (Geist 0.79, Inter 0.80). It was 0.88 with tighter
        # spacing, which set the same line length but read as wide, close-set letters.
        self.cn = _pw(V, [(20, 374), (84, 270), (BLACK_STEM + 4, 145)]) * counter  # n counter
        if italic:
            self.cn *= 0.95  # italics run slightly narrower: the slant already adds movement
        # Capitals' counters: the straight-sided ones (H E N B ...) have their own curve, see CH_THIN; the round and diagonal ones
        # (O C G S A V W X Y Z J) follow n's, which they were fitted to, narrowing with the lowercase
        # The curves are read off the weight's own stem (V0), not the optical size's: Caption's stem is V0+5 and Display's V0-3,
        # and reading those moved every capital at the Regular masters (H +-4) and closed Dï and Bî below kern.py's clearance
        # at Display Black. The optical size still reaches them through `counter` and, for H, through n's own shift.
        self.cHd = self.cn * 418 / 284 * _pw(V0, [(20, CHD_THIN), (84, 1.0), (BLACK_STEM + 4, 1.0)])
        n_curve = [(20, 374), (84, 270), (BLACK_STEM + 4, 145)]
        n_shift = _pw(V, n_curve) - _pw(V0, n_curve)
        self.cH = (_pw(V0, [(20, CH_THIN), (84, 270 * 418 / 284), (BLACK_STEM + 4, CH_BLACK)]) + n_shift * 418 / 284) * counter * (0.95 if italic else 1.0)
        # i dot / period: never thinner than a readable square. Against Geist's and Inter's, a
        # stem-proportional dot made punctuation 0.89x their ink at Regular and 1.6x at Black
        # (commas 1.7x as tall): Regular's grows a little, the heavy ones much less.
        self.dot = (V * 1.12 + 14) * 1.06 - 60 * self.heavy
        self.mt = V * 0.86 + 6  # accent stroke
        self.fig_adv = round(580 + 0.55 * (V - 90) + (spacing - 1) * 60 + 1.3 * self.S * (1 - 1 / opened))  # tabular figure advance; Thin's opened white is added outside the figures' ink, which the math signs share
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
    def dnw(self):
        return self.nw - DIAG_TRIM * self.heavy

    @property
    def Hd(self):
        """Width of a round or diagonal capital: its counter follows the lowercase."""
        return self.cHd + 2 * self.V

    @property
    def Hw(self):
        return self.cH + 2 * self.V

"""Cascivo Condensed v2: a condensed sibling of Cascivo Sans (fonts/PLAN-families.md).

Mostly `tune`: nearly every width in glyphs.py derives from the n counter (cn) or the capital
counters (cH, cHd), so narrowing those three narrows the letters, diagonals included (W, M, w,
m are multiples of Hd, Hw, dnw, cn). v1 kept Sans's stems, so Black (stem-dominated) condensed
least (0.93x); v2 sets counter, sidebearing and stem factors per weight so every weight sits near
0.80x Sans, thins Black's stems, horizontals and bowl joins so its counters stay open, and squares
the rounds further (higher k).
"""

NAME = 'Cascivo Condensed'
PS = 'CascivoCondensed'
ITALIC = False

WIDTH = (0.76, 0.70, 0.58)  # counter factor at Thin, Regular, Black
SPACE = (0.86, 0.78, 0.72)  # sidebearing factor at Thin, Regular, Black
STEM = (1.0, 0.95, 0.92)  # stem factor at Thin, Regular, Black
FIG = 0.82  # tabular figure advance
SQUARE = 0.08  # superellipse factor added: condensed rounds read straighter-sided
BLACK_H = 0.08  # share of the horizontals Black loses


# Sans's Black / Regular value of each scaled quantity at opsz 14 (params.P): its n counter, stem and sidebearing all run
# linearly in the stem between Regular and Black, so a factor that itself ran linearly would bend them (a product of two lines)
# and the Bold master would leave the Regular-Black line (a width kink at 700, score wstep). by_weight keeps the product linear.
R_COUNTER, R_STEM, R_SPACE = 0.55, 190 / 84, 0.6


def by_weight(p, f, r):
    """f (Thin, Regular, Black) at this master, as a factor on a quantity whose Black value is r x its Regular one."""
    if p.wght <= 400:
        return f[1] + (f[0] - f[1]) * (400 - p.wght) / 300
    t = (p.wght - 400) / 500  # the master's place on the stem line (Bold sits at MID_WGHT)
    return (f[1] + (f[2] * r - f[1]) * t) / (1 + (r - 1) * t)


def tune(p):
    h = p.heavy  # read before the stem changes: p.heavy derives from p.V
    w, sp = by_weight(p, WIDTH, R_COUNTER), by_weight(p, SPACE, R_SPACE)
    p.cn *= w
    p.cH *= w
    p.cHd *= w
    p.S *= sp
    p.Sc *= sp
    p.Sfig *= sp
    p.fig_adv = round(p.fig_adv * FIG)
    p.k += SQUARE
    p.V *= by_weight(p, STEM, R_STEM)
    p.H *= 1 - BLACK_H * h
    p.bar *= 1 - BLACK_H * h


import glyphs as _GL  # noqa: E402  the engine has loaded glyphs.py before this module (family.load)

# Black's bowl and arch joins (glyphs.BLACK_JOIN, Sans 0.45): narrower counters put the d b p q a g 9 6 joins closer to the
# far side, and at 12-14 px Black the crotches filled in. Set for this family's build only.
_GL.BLACK_JOIN = BLACK_JOIN = 0.36

R_OPEN = 0.25  # extra right sidebearing on r (in S units): condensed rn otherwise reads as m at 11-12 px
C_OPEN = 0.35  # extra right sidebearing on c at Thin (in S units, fading out by Regular): close-set hairline cl read as d at 11 px
ONE_SHIFT = (0.10, 0.12, 0.16)  # (Thin, Regular, Black) 1's ink moved right in its tabular advance (share of it): narrowed and centred, its stem sat on l's and I's at Bold


def glyph(g, p, name):
    if name == 'r':
        g.sb = (g.sb[0], g.sb[1] + R_OPEN)
    elif name == 'c':
        g.sb = (g.sb[0], g.sb[1] + C_OPEN * max(0.0, (400 - p.wght) / 300))


def master(o):
    from geom import transform_contour

    dx = by_weight(o.p, ONE_SHIFT, 1.0) * o.p.fig_adv
    o.contours['one'] = [transform_contour(c, lambda q: (q[0] + dx, q[1])) for c in o.contours['one']]
    x0, y0, x1, y1 = o.bounds['one']
    o.bounds['one'] = (x0 + dx, y0, x1 + dx, y1)
    o.topleft['one'] += dx
    o.anchors['one'] = {k: (v[0] + dx, v[1]) for k, v in o.anchors['one'].items()}

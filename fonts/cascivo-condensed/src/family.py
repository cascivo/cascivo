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
FIG = (0.82, 0.82, 0.786)  # tabular figure advance at Thin, Regular, Black: Black's figure ink ran 13% wider than Roboto Condensed Black's (0 495 vs 427 units)
SFIG = (0.86, 0.78, 0.90)  # figure (and math sign, word space) sidebearing factor: Black's 0123 sat 30 units apart (RC 40) and its figures read as one bar
SQUARE = 0.08  # superellipse factor added: condensed rounds read straighter-sided
BLACK_H = 0.08  # share of the horizontals Black loses


# Sans's Black / Regular value of each scaled quantity at opsz 14 (params.P): its n counter, stem and sidebearing all run
# linearly in the stem between Regular and Black, so a factor that itself ran linearly would bend them (a product of two lines)
# and the Bold master would leave the Regular-Black line (a width kink at 700, score wstep). by_weight keeps the product linear.
R_COUNTER, R_STEM, R_SPACE = 0.55, 190 / 84, 0.6
R_FIG, R_SFIG = 635 / 577, 48.1 / 70.2  # Sans's fig_adv and Sfig, Black over Regular


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
    p.Sfig *= by_weight(p, SFIG, R_SFIG)
    p.fig_adv = round(p.fig_adv * by_weight(p, FIG, R_FIG))
    p.k += SQUARE
    p.V *= by_weight(p, STEM, R_STEM)
    p.H *= 1 - BLACK_H * h
    p.bar *= 1 - BLACK_H * h


import glyphs as _GL  # noqa: E402  the engine has loaded glyphs.py before this module (family.load)

# Black's bowl and arch joins (glyphs.BLACK_JOIN, Sans 0.45): narrower counters put the d b p q a g 9 6 joins closer to the
# far side, and at 12-14 px Black the crotches filled in. Set for this family's build only.
_GL.BLACK_JOIN = BLACK_JOIN = 0.36

# Double quotes' pitch at Black (Sans +0.08 of a mark): 572 units wide against Roboto Condensed's 408, its two wedges read as two blobs
_GL.QUOTE_GAP_HEAVY = QUOTE_GAP_HEAVY = -0.22

R_OPEN = 0.25  # extra right sidebearing on r (in S units): condensed rn otherwise reads as m at 11-12 px
C_OPEN = 0.35  # extra right sidebearing on c at Thin (in S units, fading out by Regular): close-set hairline cl read as d at 11 px


def glyph(g, p, name):
    if name == 'r':
        g.sb = (g.sb[0], g.sb[1] + R_OPEN)
    elif name == 'c':
        g.sb = (g.sb[0], g.sb[1] + C_OPEN * max(0.0, (400 - p.wght) / 300))
    elif name in ('space', 'nbspace'):
        g.adv_fixed += round(SPACE_BLACK_ADD * p.heavy)


ONE_SHIFT = (0.10, 0.12, 0.12)  # (Thin, Regular, Black) left sidebearing added to the proportional 1 (share of the tabular advance): narrowed, its stem sat on l's and I's at 11 px
SPACE_BLACK_ADD = 20  # units added to Black's word space: at 170 (RC 230, Inter Tight 210) Black words ran together


def _pnum_left(p, name):
    # v2 moved the 1's outline right by this much, and the proportional 1 (the default figure, a composite of it) overhung its
    # right side (-7 units at Regular, -44 at Black: 12, 1l and 1/2 collided). Its advance now carries the shift on the left,
    # through the engine's hook, and the tabular 1 stays as Sans centres it.
    return by_weight(p, ONE_SHIFT, R_FIG * FIG[2] / FIG[1]) * p.fig_adv if name == 'one' else 0.0  # linear in the stem: no Bold kink


_GL.pnum_left = _pnum_left

MIDDOT = 0.8  # periodcentered drawn at this share of the full stop's dot, about its centre: between tracked caps ("01 · WHAT") it was a blob at Bold and Black
DASH = {'endash': 0.84, 'emdash': 0.72}  # Sans's 500 and 1000 unit dashes: the em dash set as a double-width bar between condensed letters (RC 660)


def master(o):
    from geom import transform_contour

    for name, f in DASH.items():
        a = o.adv[name]
        o.contours[name] = [transform_contour(c, lambda q: (q[0] * f, q[1])) for c in o.contours[name]]
        x0, y0, x1, y1 = o.bounds[name]
        o.bounds[name] = (x0 * f, y0, x1 * f, y1)
        o.adv[name] = round(a * f)
    x0, y0, x1, y1 = o.bounds['periodcentered']
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    o.contours['periodcentered'] = [transform_contour(c, lambda q: (cx + (q[0] - cx) * MIDDOT, cy + (q[1] - cy) * MIDDOT)) for c in o.contours['periodcentered']]
    o.bounds['periodcentered'] = (cx + (x0 - cx) * MIDDOT, cy + (y0 - cy) * MIDDOT, cx + (x1 - cx) * MIDDOT, cy + (y1 - cy) * MIDDOT)

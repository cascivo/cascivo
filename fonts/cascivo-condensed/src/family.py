"""Cascivo Condensed v1: a condensed sibling of Cascivo Sans (fonts/PLAN-families.md).

Only `tune`: nearly every width in glyphs.py derives from the n counter (cn) or the capital
counters (cH, cHd), so narrowing those three narrows the letters, diagonals included (W, M, w,
m are multiples of Hd, Hw, dnw, cn). Stems keep their weight, so the condensing comes out of the
white; rounds square up (higher k) so the narrower bowls keep their counter area.
"""

NAME = 'Cascivo Condensed'
PS = 'CascivoCondensed'
ITALIC = False

WIDTH = 0.82  # counter factor (Inter Tight / Roboto Condensed sit about here against Inter / Roboto)
SPACE = 0.9  # sidebearings: narrower counters need less white between letters
FIG = 0.85  # tabular figure advance
SQUARE = 0.03  # superellipse factor added: condensed rounds read straighter-sided


def tune(p):
    p.cn *= WIDTH
    p.cH *= WIDTH
    p.cHd *= WIDTH
    p.S *= SPACE
    p.Sc *= SPACE
    p.Sfig *= SPACE
    p.fig_adv = round(p.fig_adv * FIG)
    p.k += SQUARE

R_OPEN = 0.25  # extra right sidebearing on r (in S units): condensed rn otherwise reads as m at 11-12 px
ONE_SHIFT = 0.07  # 1's ink moved right in its tabular advance (share of it): narrowed and centred, its stem sat on l's and I's at Bold


def glyph(g, p, name):
    if name == 'r':
        g.sb = (g.sb[0], g.sb[1] + R_OPEN)


def master(o):
    from geom import transform_contour

    dx = ONE_SHIFT * o.p.fig_adv
    o.contours['one'] = [transform_contour(c, lambda q: (q[0] + dx, q[1])) for c in o.contours['one']]
    x0, y0, x1, y1 = o.bounds['one']
    o.bounds['one'] = (x0 + dx, y0, x1 + dx, y1)
    o.topleft['one'] += dx
    o.anchors['one'] = {k: (v[0] + dx, v[1]) for k, v in o.anchors['one'].items()}

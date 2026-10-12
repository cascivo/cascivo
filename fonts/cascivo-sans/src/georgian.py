"""Georgian: the 33 letters of modern Mkhedruli (U+10D0-10F0), and ჻ (U+10FB). A DRAFT: built only
with CASCIVO_GEORGIAN=1, and not shipped until the Mtavruli capitals are drawn and a native
reader has reviewed it.

None of Inter, Geist or Plex has Georgian. The letters' centre lines are traced from Noto Sans
Georgian Thin (`georgian_paths.py`, made by `trace_georgian.py`); this font's pen then draws them
at every weight, as it draws the Latin. The tracing keeps Noto's structure, which Georgian
readers rely on (where a loop closes, which way a curl turns); the metrics, contrast and weight
are this font's. The Mtavruli capitals (U+1C90), which Unicode pairs with these as upper case,
are not drawn yet.
"""

import math

from georgian_paths import TRACE
from glyphs import glyph

# The reference's centre-line levels: round bottom, round top at the x-height, ascender (Noto's
# ink at -10, 538 and 760, less half its thin stroke), and the descender's round bottom.
REF_DESC, REF_BASE, REF_XH, REF_ASC = -238, 2.5, 526, 754
REF_I = 387  # ი's centre-line width: the unit for the horizontal scale
# Georgian stacks two or three bowls into the height where Latin has one, so at the heavy
# weights its pen is lighter than the Latin's, or the counters close. (Noto's Black keeps the
# Latin stem and redraws its bowls; a traced centre line cannot.)
HEAVY_PEN = 0.72


def _y_map(p, H):
    src = (REF_DESC, REF_BASE, REF_XH, REF_ASC)
    dst = (p.desc + H / 2, -p.ov + H / 2, p.xh + p.ov - H / 2, p.asc - H / 4)

    def f(y):
        i = 0 if y < src[1] else 1 if y < src[2] else 2
        return dst[i] + (y - src[i]) * (dst[i + 1] - dst[i]) / (src[i + 1] - src[i])

    return f


def _line(p, y_ref):
    """The baseline, ascender or descender a stem's end in the reference sits on, if any."""
    for ref, line in ((0, 0), (760, p.asc), (-250, p.desc)):
        if abs(y_ref - ref) < 20:
            return line
    return None


def _snap(line, end, handle):
    """A stem's end sits on its line exactly. The level map is for the centre of a round stroke,
    which rides half a stroke inside the line; a cut end does not."""
    dy = line - end[1]
    return (end[0], line), (handle[0], handle[1] + dy)


def _into(end, handle, d):
    """A stroke that ends on another runs on into it by a share of the stem, so the join has no
    notch at heavy weights; at Thin that share stays inside the other stroke."""
    v = (end[0] - handle[0], end[1] - handle[1])
    n = math.hypot(*v) or 1.0
    dx, dy = v[0] / n * d, v[1] / n * d
    return (end[0] + dx, end[1] + dy), (handle[0] + dx, handle[1] + dy)


def _draw(cp):
    sbl, sbr, ht, strokes = TRACE[cp]

    def draw(g, p):
        ws = 1 - (1 - HEAVY_PEN) * p.heavy
        V, H = p.V * ws, p.H * ws
        sx = (1.08 * (p.nw - 2 * p.V + 2 * V) - V) / REF_I  # ი as wide as 1.08 n, as the reference's is
        fy = _y_map(p, H)
        for closed, joins, flat in strokes:
            pts = [(flat[i] * sx + V / 2, fy(flat[i + 1])) for i in range(0, len(flat), 2)]
            caps = ['b', 'b']
            if not closed:
                for k, (end, handle, y_ref) in enumerate(((0, 1, flat[1]), (-1, -2, flat[-1]))):
                    if joins[k]:
                        pts[end], pts[handle] = _into(pts[end], pts[handle], 0.4 * V)
                    elif _line(p, y_ref) is not None:  # a stem's end: cut flat on its line
                        pts[end], pts[handle] = _snap(_line(p, y_ref), pts[end], pts[handle])
                        caps[k] = 'h'
            segs = [('C', *pts[i : i + 4]) for i in range(0, len(pts) - 1, 3)]
            g.stroke(segs, closed=closed, ws=ws, cut='h', caps=tuple(caps))
        g.ht = ht
        g.sb = (sbl, sbr)

    return draw


for _cp in TRACE:
    glyph(f'uni{_cp:04X}', _cp)(_draw(_cp))


@glyph('uni10FB', 0x10FB)
def _paragraph(g, p):
    """჻: three dots in a triangle, the Georgian paragraph separator."""
    d = p.dot
    g.dot(d * 0.5, p.xh - d, d).dot(d * 2.1, p.xh - d, d).dot(d * 1.3, p.xh * 0.45 - d, d)
    g.sb = (0.6, 0.6)

"""Georgian: the 33 letters of modern Mkhedruli (U+10D0-10F0), their Mtavruli capitals
(U+1C90-1CB0), and ჻ (U+10FB). A DRAFT: built only with CASCIVO_GEORGIAN=1, and not shipped until
a native reader has reviewed it.

None of Inter, Geist or Plex has Georgian. The letters' centre lines are traced from Noto Sans
Georgian (`georgian_paths.py`, made by `trace_georgian.py`): from its Thin, and the same points
moved onto its Black, which the heavy masters blend toward by stem weight. That is how Noto's
Black keeps the Latin stem and still has room for two or three bowls: they open, and the letter
barely widens. This font's pen then draws the centre lines at every weight, as it draws the
Latin. The tracing keeps Noto's structure, which Georgian readers rely on (where a loop closes,
which way a curl turns); the metrics, contrast and weight are this font's.
"""

import math

from geom import arc, norm, orient, pen_thickness
from georgian_paths import REF, TRACE
from glyphs import glyph
from params import BLACK_STEM, P

V_THIN = P(100, 14).V


def _y_map(p, H, ref, ht):
    """Reference centre-line levels onto this font's: round strokes ride half a stroke inside the
    line, less their overshoot."""
    if ht == 'c':
        src = (ref['base'], ref['cap'])
        dst = (-p.ov + H / 2, p.cap + p.ov - H / 2)
    else:
        src = (ref['desc'], ref['base'], ref['xh'], ref['asc'])
        dst = (p.desc + H / 2, -p.ov + H / 2, p.xh + p.ov - H / 2, p.asc - H / 4)

    def f(y):
        i = sum(y >= s for s in src[1:-1])
        return dst[i] + (y - src[i]) * (dst[i + 1] - dst[i]) / (src[i + 1] - src[i])

    return f


def _line(p, y_ref):
    """The baseline, ascender, descender or cap height a stem's end in the reference sits on."""
    for ref, line in ((0, 0), (760, p.asc), (-250, p.desc), (714, p.cap)):
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


def _i_to_n(t):
    """How much wider ი's ink is than this font's n at blend t: what makes it as wide as Noto's ი
    at Thin (1.00), Regular (1.06) and Black (1.02), against this font's n at each."""
    return 1.0 + 0.06 * t / 0.37 if t <= 0.37 else 1.06 - 0.04 * (t - 0.37) / 0.63


def draw_letter(g, p, entry, ref=REF):
    """One letter from its traced data. The masters blend the Thin and Black centre lines by stem
    weight; the tracer has already held each stroke back from Black as far as this pen needs to
    draw it cleanly."""
    sbl, sbr, ht, strokes = entry
    t = min(1.0, max(0.0, (p.V - V_THIN) / (BLACK_STEM - V_THIN)))  # Thin 0, Regular 0.37, Black 1
    lv = {k: v + (ref['black'][k] - v) * t for k, v in ref['thin'].items()}
    V, H = p.V, p.H
    sx = (_i_to_n(t) * p.nw - V) / lv['i']
    fy = _y_map(p, H, lv, ht)
    for closed, ends, thin, black, pen in strokes:
        sw = 1 - (1 - pen) * p.heavy  # 1, but where the tracer found the full pen folds
        pts = [((a + (b - a) * t) * sx + V / 2, fy(c + (d - c) * t)) for a, c, b, d in zip(thin[::2], thin[1::2], black[::2], black[1::2])]
        caps = ['b', 'b']
        if not closed:
            for k, (end, handle, y_ref) in enumerate(((0, 1, thin[1]), (-1, -2, thin[-1]))):
                if ends[k] in ('join', 'corner'):  # a round joint, where square ends would notch
                    w = pen_thickness(norm((pts[end][0] - pts[handle][0], pts[end][1] - pts[handle][1])), V, H) * sw
                    g.raw.append(orient(arc(*pts[end], w / 2, w / 2, 90, 450), outer=True))
                if ends[k] == 'join':
                    pts[end], pts[handle] = _into(pts[end], pts[handle], 0.4 * V)
                elif ends[k] == 'free' and _line(p, y_ref) is not None:  # a stem's end: cut flat on its line
                    pts[end], pts[handle] = _snap(_line(p, y_ref), pts[end], pts[handle])
                    caps[k] = 'h'
        segs = [('C', *pts[i : i + 4]) for i in range(0, len(pts) - 1, 3)]
        g.stroke(segs, closed=closed, ws=sw, cut='h', caps=tuple(caps))
    g.ht = ht
    # Noto's own spacing, scaled with the outline: this font's Latin tightens more at Black than
    # Noto's does, and Georgian set in the Latin's units touched there
    u = min(1.0, max(0.0, (t - 0.37) / 0.63))
    unit = p.Sc if ht == 'c' else p.S
    g.sb = tuple((a + (b - a) * u) * sx / unit for a, b in (sbl, sbr))


def _draw(cp):
    return lambda g, p: draw_letter(g, p, TRACE[cp])


for _cp in TRACE:
    glyph(f'uni{_cp:04X}', _cp)(_draw(_cp))  # Mkhedruli, and their Mtavruli capitals


@glyph('uni10FB', 0x10FB)
def _paragraph(g, p):
    """჻: three dots in a triangle, the Georgian paragraph separator."""
    d = p.dot
    g.dot(d * 0.5, p.xh - d, d).dot(d * 2.1, p.xh - d, d).dot(d * 1.3, p.xh * 0.45 - d, d)
    g.sb = (0.6, 0.6)

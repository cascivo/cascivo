"""Build Cascivo Sans: six masters -> one variable TTF -> WOFF2 (+ Latin subset, static instances).

    python3 -I src/build.py            # from fonts/cascivo-sans/

Deterministic: same source, same bytes.
"""

import io
import math
import os
import sys

# Reproducible bytes: fontTools stamps head.created/modified from this when it is set.
os.environ.setdefault('SOURCE_DATE_EPOCH', '1791331200')  # 2026-10-07
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from fontTools import subset  # noqa: E402
from fontTools.cu2qu import curves_to_quadratic  # noqa: E402
from fontTools.designspaceLib import AxisDescriptor, DesignSpaceDocument, SourceDescriptor  # noqa: E402
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString  # noqa: E402
from fontTools.fontBuilder import FontBuilder  # noqa: E402
from fontTools.otlLib.builder import buildStatTable  # noqa: E402
from fontTools.pens.ttGlyphPen import TTGlyphPen  # noqa: E402
from fontTools.ttLib import TTFont, newTable  # noqa: E402
from fontTools.ttLib.tables import ttProgram  # noqa: E402
from fontTools import varLib  # noqa: E402
from fontTools.varLib import instancer  # noqa: E402

import glyphs as GL  # noqa: E402
from composites import BOTTOM, SPECIAL, accented_chars, glyph_name  # noqa: E402
from geom import contour_bounds, expand, transform_contour  # noqa: E402
import kern  # noqa: E402
from kern import kern_fea  # noqa: E402
from params import ITALIC_ANGLE, ITALIC_MASTERS, MASTERS, P  # noqa: E402

FAMILY = 'Cascivo Sans'
PS = 'CascivoSans'
VERSION = '0.1.0'
DIST = os.path.join(HERE, '..', 'fonts')  # not dist/: the repo ignores dist/, and these files ship
MAX_ERR = 1.5  # cu2qu tolerance in font units: 1.5/1000 em is sub-pixel below ~700px
IUP_TOLERANCE = 1.0  # gvar deltas the rasterizer can re-infer within 1 unit are dropped


# ---------------------------------------------------------------------------------------------
# per-master drawing
# ---------------------------------------------------------------------------------------------


class Out:
    """One master's glyph data: outlines, advances, anchors, composites."""

    def __init__(self, p):
        self.p = p
        self.contours = {}
        self.adv = {}
        self.anchors = {}
        self.comps = {}
        self.cmap = {}
        self.bounds = {}


def italicize(strokes, p):
    """Slant centerlines around mid-x-height *before* the pen expands them, with the pen's stress
    axis leaning by the same angle: a drawn italic's curves, not a sheared upright's."""
    if not p.slant:
        return strokes
    yc = p.xh / 2
    out = []
    for st in strokes:
        it = st.transformed(lambda q: (q[0] + (q[1] - yc) * p.slant, q[1]), slant=p.slant)
        # A square cut on a slanted stem dips below the baseline and pokes above the x-height
        # (7 units at Regular). Upright vertical stems are cut flat instead, as in any drawn italic.
        # Decided by segment type, never by value, so every master gets the same structure.
        if not st.closed:
            ends = (st.segs[0], st.segs[-1])
            it.caps = tuple('h' if c == 'b' and e[0] == 'L' and e[1][0] == e[-1][0] else c for c, e in zip(st.caps, ends))
        out.append(it)
    return out


def draw_master(p):
    o = Out(p)
    for name in GL.ORDER:
        cps, fn = GL.GLYPHS[name]
        g = GL.G(p)
        fn(g, p)
        cs = []
        for s in g.strokes:
            cs += expand(s, p.V, p.H)
        cs += g.raw
        # Spacing is measured on the upright drawing; the italic outlines replace it afterwards,
        # slanted around mid-x-height so that spacing carries over.
        italic_cs = [c for s in italicize(g.strokes, p) for c in expand(s, p.V, p.H)] if p.slant else None
        for cp in cps:
            o.cmap[cp] = name
        if g.adv_fixed is not None:
            o.contours[name], o.adv[name] = [], g.adv_fixed
            continue
        bx = [contour_bounds(c) for c in cs]
        xmin, ymin = min(b[0] for b in bx), min(b[1] for b in bx)
        xmax, ymax = max(b[2] for b in bx), max(b[3] for b in bx)
        if g.mark:
            dx, adv = 0.0, 0
        elif g.tab:
            adv = p.fig_adv
            dx = (adv - (xmax - xmin)) / 2 - xmin
        else:
            unit = p.Sc if name[0].isupper() else p.S
            l, r = g.sb[0] * unit, g.sb[1] * unit
            dx = l - xmin
            adv = l + (xmax - xmin) + r
        cs = [transform_contour(c, lambda q, dx=dx: (q[0] + dx, q[1])) for c in (italic_cs if italic_cs is not None else cs)]
        o.contours[name] = cs
        o.adv[name] = round(adv)
        o.bounds[name] = (xmin + dx, ymin, xmax + dx, ymax)
        top_y = {'x': p.xh, 'c': p.cap, 'a': p.asc}[g.ht] + (68 if g.ht == 'x' else 42)
        cx = (xmin + xmax) / 2 + dx
        a = {
            'top': (g.anchors.get('top_x', cx - dx) + dx, top_y),
            'bottom': (cx, 0),
            'ogonek': (xmax + dx - 70 - p.V * 0.3, 0),
            'topright': ((g.anchors['topright_x'] + dx) if 'topright_x' in g.anchors else xmax + dx + p.S * 0.35, p.asc if g.ht == 'a' else p.cap),
        }
        o.anchors[name] = a
    add_composites(o)
    return o


def add_composites(o):
    p = o.p
    C = o.comps

    def comp(name, parts, adv, cp=None):
        C[name] = parts  # [(glyph, dx, dy, scale)]
        o.adv[name] = round(adv)
        if cp is not None:
            o.cmap[cp] = name

    def at(base, mark, anchor):
        bx, by = o.anchors[base][anchor]
        return (mark, bx, by, 1)

    # i and j are dotless + dot so every accent on them is consistent
    comp('i', [('dotlessi', 0, 0, 1), at('dotlessi', 'dotaccentcomb', 'top')], o.adv['dotlessi'], ord('i'))
    comp('j', [('dotlessj', 0, 0, 1), at('dotlessj', 'dotaccentcomb', 'top')], o.adv['dotlessj'], ord('j'))
    o.anchors['i'] = o.anchors['dotlessi']
    o.anchors['j'] = o.anchors['dotlessj']
    # turned comma above (ģ)
    cadv = o.adv['comma']
    comp('commaturnedabovecomb', [('commaaccentcomb', 0, -40, -1)], 0)

    # Every accented I and l also gets a plain variant, so ss01 switches Í and ľ along with I
    # and l instead of leaving a mixed word.
    accents = accented_chars()
    accents += [(ch, base, marks, '.ss01') for ch, base, marks in accents if base in 'Il']
    for ch, base, marks, *alt in accents:
        sfx = alt[0] if alt else ''
        b = {'i': 'dotlessi', 'j': 'dotlessj'}.get(base, base) + sfx
        parts = [(b, 0, 0, 1)]
        for m in marks:
            if m == 'caroncomb.alt':
                bx, by = o.anchors[b]['topright']
                parts.append((m, bx, by, 1))
            elif m in BOTTOM:
                parts.append(at(b, m, BOTTOM[m]))
            elif m == 'commaturnedabovecomb':
                parts.append(at(b, m, 'top'))
            else:
                mk = m + '.case' if base.isupper() else m
                bx, by = o.anchors[b]['top']
                parts.append((mk, bx, by + (len(parts) - 1) * 0, 1))
        comp(glyph_name(ch) + sfx, parts, o.adv[b], None if sfx else ord(ch))
        o.anchors[glyph_name(ch) + sfx] = o.anchors[b]

    S = p.S
    ov = lambda name: o.adv[name]  # noqa: E731
    comp('colon', [('period', 0, 0, 1), ('period', 0, p.xh - p.dot, 1)], ov('period'), ord(':'))
    comp('semicolon', [('comma', 0, 0, 1), ('period', 0, p.xh - p.dot, 1)], ov('comma'), ord(';'))
    comp('exclamdown', [('exclam', ov('exclam'), p.xh, -1)], ov('exclam'), 0xA1)
    comp('questiondown', [('question', ov('question'), p.xh + 10, -1)], ov('question'), 0xBF)
    d = p.dot
    comp('quoteright', [('comma', 0, p.cap - d, 1)], cadv, 0x2019)
    comp('quoteleft', [('comma', cadv, p.cap - 1.25 * d, -1)], cadv, 0x2018)
    comp('quotesinglbase', [('comma', 0, 0, 1)], cadv, 0x201A)
    gap = d + S * 0.55
    comp('quotedblright', [('comma', 0, p.cap - d, 1), ('comma', gap, p.cap - d, 1)], cadv + gap, 0x201D)
    comp('quotedblleft', [('comma', cadv, p.cap - 1.25 * d, -1), ('comma', cadv + gap, p.cap - 1.25 * d, -1)], cadv + gap, 0x201C)
    comp('quotedblbase', [('comma', 0, 0, 1), ('comma', gap, 0, 1)], cadv + gap, 0x201E)

    # stroked / combined letters
    comp('Eth', [('D', 0, 0, 1), ('barcomp.D', 0, 0, 1)], ov('D'), 0xD0)
    comp('Dcroat', [('D', 0, 0, 1), ('barcomp.D', 0, 0, 1)], ov('D'), 0x110)
    comp('dcroat', [('d', 0, 0, 1), ('barcomp.d', o.bounds['d'][0], 0, 1)], ov('d'), 0x111)
    comp('Hbar', [('H', 0, 0, 1), ('barcomp.H', o.bounds['H'][0], 0, 1)], ov('H'), 0x126)
    comp('hbar', [('h', 0, 0, 1), ('barcomp.h', o.bounds['h'][0], 0, 1)], ov('h'), 0x127)
    b = o.bounds['T']
    comp('Tbar', [('T', 0, 0, 1), ('barcomp.T', (b[0] + b[2]) / 2, 0, 1)], ov('T'), 0x166)
    tx = o.bounds['t'][0] + p.nw * 0.6 * 0.24 + p.V * 0.12 + p.V / 2  # mirrors _t's stem position
    comp('tbar', [('t', 0, 0, 1), ('barcomp.t', tx, 0, 1)], ov('t'), 0x167)
    stem = o.bounds['L'][0] + p.V / 2
    comp('Lslash', [('L', S * 0.5, 0, 1), ('lslash.comp', stem + S * 0.5, 0, 1)], ov('L') + S * 0.5, 0x141)
    for sfx in ('', '.ss01'):
        stem = o.bounds['l' + sfx][0] + p.V / 2
        comp('lslash' + sfx, [('l' + sfx, S * 0.6, 0, 1), ('lslash.comp', stem + S * 0.6, 0, 1)], ov('l' + sfx) + S * 1.2, None if sfx else 0x142)
    comp('Ldot', [('L', 0, 0, 1), ('periodcentered', o.bounds['L'][0] + p.V + S * 0.5 - S * 0.9, p.cap * 0.5 - p.xh * 0.5, 1)], ov('L'), 0x13F)
    for sfx in ('', '.ss01'):
        comp('ldot' + sfx, [('l' + sfx, 0, 0, 1), ('periodcentered', ov('l' + sfx) - S * 0.6, 0, 1)], ov('l' + sfx) + ov('periodcentered') - S * 0.6, None if sfx else 0x140)
    comp('Oslash', [('O', 0, 0, 1), ('slashcomp.cap', o.bounds['O'][0], 0, 1)], ov('O'), 0xD8)
    comp('oslash', [('o', 0, 0, 1), ('slashcomp.lc', o.bounds['o'][0], 0, 1)], ov('o'), 0xF8)
    ox = o.bounds['O'][2] - p.V * 1.15 - o.bounds['E'][0]
    comp('OE', [('O', 0, 0, 1), ('E', ox, 0, 1)], ox + ov('E'), 0x152)
    ox = o.bounds['o'][2] - p.V * 1.2 - o.bounds['e'][0]
    comp('oe', [('o', 0, 0, 1), ('e', ox, 0, 1)], ox + ov('e'), 0x153)
    for sfx in ('', '.ss01'):
        comp('IJ' + sfx, [('I' + sfx, 0, 0, 1), ('J', ov('I' + sfx) - S * 0.4, 0, 1)], ov('I' + sfx) + ov('J') - S * 0.4, None if sfx else 0x132)
    comp('ij', [('i', 0, 0, 1), ('j', ov('i') - S * 0.4, 0, 1)], ov('i') + ov('j') - S * 0.4, 0x133)
    comp('napostrophe', [('quoteright', 0, 0, 1), ('n', cadv - S * 0.4, 0, 1)], cadv - S * 0.4 + ov('n'), 0x149)

    # spacing accents
    for name, cp in ((n, sp) for n, _c, _f, sp in GL.MARKS if sp):
        b = name in GL.TOP_MARKS
        w = 170 + p.V * 0.5 + 2 * S * 0.6
        comp(name.replace('comb', '') if name != 'dotaccentcomb' else 'dotaccent', [(name, w / 2, p.xh + 68 if b else 0, 1)], w, cp)

    # figures: proportional, superior/inferior, numerator/denominator — all from the same outlines
    figs = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
    k = 0.6
    sup_y = p.cap - p.cap * k
    for f in figs:
        b = o.bounds[f]
        tight = {'one': 0.9}.get(f, 0.62)
        l = S * tight
        comp(f + '.pnum', [(f, l - b[0], 0, 1)], l + (b[2] - b[0]) + S * tight)
        sw = o.adv[f] * k * 0.92
        lx = (sw - o.adv[f] * k) / 2
        comp(f + '.sups', [(f, lx, sup_y, k)], sw)
        comp(f + '.sinf', [(f, lx, -p.cap * 0.14, k)], sw)
        comp(f + '.numr', [(f, lx, sup_y, k)], sw)
        comp(f + '.dnom', [(f, lx, 0, k)], sw)
    comp('zero.zero.pnum', [('zero.slash', S * 0.62 - o.bounds['zero.slash'][0], 0, 1)], o.adv['zero.pnum'])
    # 1. Proportional figures by default: running text is the common case, and a tabular "1"
    # in a sentence leaves a hole ("$1, 117"). Tables opt in with font-variant-numeric:
    # tabular-nums, which cascivo's own table components already set.
    for f in figs:
        o.cmap[ord('0') + figs.index(f)] = f + '.pnum'
    o.cmap[0xB9] = 'one.sups'
    o.cmap[0xB2] = 'two.sups'
    o.cmap[0xB3] = 'three.sups'
    fw = o.adv['one.sups']
    fr = o.adv['fraction']
    for cp, a, b in ((0xBC, 'one', 'four'), (0xBD, 'one', 'two'), (0xBE, 'three', 'four')):
        comp(f'{a}{b}frac', [(a + '.numr', 0, 0, 1), ('fraction', fw - fr * 0.5 - S * 0.2, 0, 1), (b + '.dnom', fw + fr * 0.2, 0, 1)], 2 * fw + fr * 0.2, cp)
    comp('ordfeminine', [('a', 0, sup_y + 20, k)], o.adv['a'] * k + S * 0.3, 0xAA)
    comp('ordmasculine', [('o', 0, sup_y + 20, k)], o.adv['o'] * k + S * 0.3, 0xBA)
    tk = 0.5
    comp('trademark', [('T', 0, p.cap * (1 - tk), tk), ('M', o.adv['T'] * tk, p.cap * (1 - tk), tk)], (o.adv['T'] + o.adv['M']) * tk + S, 0x2122)
    rc = o.adv['ring.circle']
    for name, cp, letter in (('copyright', 0xA9, 'C'), ('registered', 0xAE, 'R')):
        s = 0.5
        lw = o.bounds[letter][2] - o.bounds[letter][0]
        lx = rc / 2 - (o.bounds[letter][0] + lw / 2) * s
        comp(name, [('ring.circle', 0, 0, 1), (letter, lx, p.cap * (1 - s) / 2, s)], rc, cp)

    # case-sensitive forms: punctuation centred on capitals instead of lowercase
    lift = (p.cap - p.xh) / 2
    for n in ('hyphen', 'endash', 'emdash', 'guilsinglleft', 'guilsinglright', 'guillemotleft', 'guillemotright', 'periodcentered', 'bullet'):
        comp(n + '.case', [(n, 0, lift, 1)], o.adv[n])
    for n in ('parenleft', 'parenright', 'bracketleft', 'bracketright', 'braceleft', 'braceright'):
        comp(n + '.case', [(n, 0, 36, 1)], o.adv[n])
    comp('at.case', [('at', 0, 50, 1)], o.adv['at'])
    o.cmap.pop(0xAD, None)  # soft hyphen should never render; leave it unmapped

    # flatten: a composite of composites is resolved to outline components only (some
    # rasterizers and validators reject nesting, and it saves an indirection per glyph)
    def flat(parts):
        out = []
        for g, ox, oy, a in parts:
            if g in C:
                out += [(g2, ox + a * x2, oy + a * y2, a * a2) for g2, x2, y2, a2 in flat(C[g])]
            else:
                out.append((g, ox, oy, a))
        return out

    for n in list(C):
        C[n] = flat(C[n])
    del C['commaturnedabovecomb'], o.adv['commaturnedabovecomb']  # build-time helper only


# ---------------------------------------------------------------------------------------------
# slant: skew outlines, re-place composites so the skew stays affine-consistent
# ---------------------------------------------------------------------------------------------


def apply_slant(o):
    """Outlines are already slanted (draw_master); anchors and composite offsets follow here."""
    s = o.p.slant
    if not s:
        return
    yc = o.p.xh / 2
    sk = lambda q: (q[0] + (q[1] - yc) * s, q[1])  # noqa: E731
    for n, a in o.anchors.items():
        o.anchors[n] = {k: sk(v) for k, v in a.items()}
    for n, parts in o.comps.items():
        # final = Sk(a*q + off): component data is Sk(q), so off' = off + (oy - yc)s + a*yc*s
        o.comps[n] = [(g, ox + (oy - yc) * s + a * yc * s, oy, a) for g, ox, oy, a in parts]
    o.mark_origin = (-yc * s, 0)


# ---------------------------------------------------------------------------------------------
# font assembly
# ---------------------------------------------------------------------------------------------


def glyph_order(o):
    order = ['.notdef'] + [n for n in GL.ORDER] + [n for n in o.comps if n not in GL.GLYPHS]
    return order


def build_glyf(outs, order):
    """Convert every master's cubic outlines to quadratic *jointly* so the masters stay compatible."""
    per_master = [dict() for _ in outs]
    for name in order:
        if name == '.notdef':
            for m, o in enumerate(outs):
                pen = TTGlyphPen(None)
                w, h = 500, 700
                for (x0, y0, x1, y1), rev in (((50, 0, w - 50, h), False), ((100, 50, w - 100, h - 50), True)):
                    pts = [(x0, y0), (x0, y1), (x1, y1), (x1, y0)]
                    if rev:
                        pts.reverse()
                    pen.moveTo(pts[0])
                    for q in pts[1:]:
                        pen.lineTo(q)
                    pen.closePath()
                per_master[m][name] = pen.glyph()
            continue
        if name in outs[0].comps:
            for m, o in enumerate(outs):
                pen = TTGlyphPen(set(order))
                for g, ox, oy, a in o.comps[name]:
                    pen.addComponent(g, (a, 0, 0, a, round(ox), round(oy)))
                per_master[m][name] = pen.glyph()
            continue
        pens = [TTGlyphPen(None) for _ in outs]
        ncont = len(outs[0].contours[name])
        for o in outs:
            assert len(o.contours[name]) == ncont, f'{name}: contour count differs between masters'
        for ci in range(ncont):
            segs_m = [o.contours[name][ci] for o in outs]
            n = len(segs_m[0])
            assert all(len(s) == n for s in segs_m), f'{name}: segment count differs'
            for pen, segs in zip(pens, segs_m):
                pen.moveTo(segs[0][1])
            for si in range(n):
                kinds = {s[si][0] for s in segs_m}
                assert len(kinds) == 1, f'{name}: segment kind differs'
                kind = kinds.pop()
                last = si == n - 1
                if kind == 'L':
                    if last:
                        continue  # closePath draws it
                    for pen, segs in zip(pens, segs_m):
                        pen.lineTo(segs[si][2])
                else:
                    curves = [s[si][1:] for s in segs_m]
                    if last:  # close exactly on the start point in every master
                        curves = [c[:3] + (s[0][1],) for c, s in zip(curves, segs_m)]
                    quads = curves_to_quadratic(curves, [MAX_ERR] * len(curves))
                    for pen, q in zip(pens, quads):
                        pen.qCurveTo(*q[1:])
            for pen in pens:
                pen.closePath()
        for m, pen in enumerate(pens):
            per_master[m][name] = pen.glyph()
    return per_master


def mark_fea(o):
    """GPOS mark attachment for decomposed text (base + combining mark)."""
    mo = getattr(o, 'mark_origin', (0, 0))
    top = sorted(GL.TOP_MARKS)
    bot = ['cedillacomb', 'commaaccentcomb']
    lines = [
        f'markClass [{" ".join(top)}] <anchor {round(mo[0])} {round(mo[1])}> @MC_top;',
        f'markClass [{" ".join(bot)}] <anchor {round(mo[0])} {round(mo[1])}> @MC_bottom;',
        f'markClass [ogonekcomb] <anchor {round(mo[0])} {round(mo[1])}> @MC_ogonek;',
        'feature mark {',
    ]
    bases = [n for n in o.anchors if n in GL.GLYPHS and not GL.GLYPHS[n][0] == [] and n.isalpha() and len(n) == 1] + ['dotlessi', 'dotlessj']
    for b in bases:
        a = o.anchors[b]
        lines.append(f'  pos base {b} <anchor {round(a["top"][0])} {round(a["top"][1])}> mark @MC_top <anchor {round(a["bottom"][0])} {round(a["bottom"][1])}> mark @MC_bottom <anchor {round(a["ogonek"][0])} {round(a["ogonek"][1])}> mark @MC_ogonek;')
    lines.append('} mark;')
    return '\n'.join(lines)


GSUB_FEA = """
languagesystem DFLT dflt;
languagesystem latn dflt;
languagesystem latn ROM;
languagesystem latn MOL;

@figs = [zero one two three four five six seven eight nine];
@pnum = [zero.pnum one.pnum two.pnum three.pnum four.pnum five.pnum six.pnum seven.pnum eight.pnum nine.pnum];
@sups = [zero.sups one.sups two.sups three.sups four.sups five.sups six.sups seven.sups eight.sups nine.sups];
@sinf = [zero.sinf one.sinf two.sinf three.sinf four.sinf five.sinf six.sinf seven.sinf eight.sinf nine.sinf];
@numr = [zero.numr one.numr two.numr three.numr four.numr five.numr six.numr seven.numr eight.numr nine.numr];
@dnom = [zero.dnom one.dnom two.dnom three.dnom four.dnom five.dnom six.dnom seven.dnom eight.dnom nine.dnom];
@topmarks = [gravecomb acutecomb circumflexcomb tildecomb macroncomb brevecomb dotaccentcomb dieresiscomb ringcomb hungarumlautcomb caroncomb];
@case_in = [hyphen endash emdash guilsinglleft guilsinglright guillemotleft guillemotright periodcentered bullet parenleft parenright bracketleft bracketright braceleft braceright at];
@case_out = [hyphen.case endash.case emdash.case guilsinglleft.case guilsinglright.case guillemotleft.case guillemotright.case periodcentered.case bullet.case parenleft.case parenright.case bracketleft.case bracketright.case braceleft.case braceright.case at.case];

lookup DOTLESS { sub i by dotlessi; sub j by dotlessj; } DOTLESS;
feature ccmp { sub [i j]' lookup DOTLESS @topmarks; } ccmp;

feature locl {
  script latn;
  language ROM; sub uni015E by uni0218; sub uni015F by uni0219; sub uni0162 by uni021A; sub uni0163 by uni021B;
  language MOL; sub uni015E by uni0218; sub uni015F by uni0219; sub uni0162 by uni021A; sub uni0163 by uni021B;
} locl;

feature pnum { sub @figs by @pnum; sub zero.slash by zero.zero.pnum; } pnum;
feature tnum { sub @pnum by @figs; sub zero.zero.pnum by zero.slash; } tnum;
feature zero { sub zero by zero.slash; sub zero.pnum by zero.zero.pnum; } zero;
feature sups { sub @figs by @sups; sub @pnum by @sups; } sups;
feature sinf { sub @figs by @sinf; sub @pnum by @sinf; } sinf;
feature subs { sub @figs by @sinf; sub @pnum by @sinf; } subs;
feature numr { sub @figs by @numr; sub @pnum by @numr; } numr;
feature dnom { sub @figs by @dnom; sub @pnum by @dnom; } dnom;
feature frac {
  lookup FRAC_NUMR { sub @figs by @numr; sub @pnum by @numr; } FRAC_NUMR;
  lookup FRAC_SLASH { sub slash by fraction; } FRAC_SLASH;
  lookup FRAC_DNOM { sub [fraction @dnom] @numr' by @dnom; } FRAC_DNOM;
} frac;
feature ordn { sub [@figs @pnum] [a o]' by [ordfeminine ordmasculine]; } ordn;
feature case { sub @case_in by @case_out; } case;

"""


def build_master_font(o, glyf, order):
    p = o.p
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(dict(o.cmap))
    fb.setupGlyf(glyf)
    gtab = fb.font['glyf']
    metrics = {}
    for n in order:
        g = gtab[n]
        g.recalcBounds(gtab)
        adv = 500 if n == '.notdef' else o.adv[n]
        metrics[n] = (adv, getattr(g, 'xMin', 0))
    fb.setupHorizontalMetrics(metrics)
    # 1.30 em default line box (Geist and Plex: 1.30). The space sits in ascent/descent rather
    # than lineGap, so it is split evenly above and below the text in every engine.
    fb.setupHorizontalHeader(ascent=1000, descent=-300, lineGap=0)
    fb.setupNameTable({
        'familyName': FAMILY,
        'styleName': 'Italic' if p.italic else 'Regular',
        'uniqueFontIdentifier': f'{VERSION};CSCV;{PS}',
        'fullName': f'{FAMILY} Italic' if p.italic else f'{FAMILY} Regular',
        'psName': f'{PS}-Italic' if p.italic else f'{PS}-Regular',
        'version': f'Version {VERSION}',
        'copyright': 'Copyright 2026 The Cascivo Sans Project Authors',
        'licenseDescription': 'This Font Software is licensed under the SIL Open Font License, Version 1.1.',
        'licenseInfoURL': 'https://openfontlicense.org',
        'manufacturer': 'cascivo',
        'designer': 'cascivo (generated from parametric source)',
    }, mac=False)
    fb.setupOS2(version=4, 
        sTypoAscender=1000, sTypoDescender=-300, sTypoLineGap=0,
        usWinAscent=1000, usWinDescent=300, sxHeight=round(p.xh), sCapHeight=p.cap,
        usWeightClass=p.wght, achVendID='CSCV', fsType=0, fsSelection=0x40 | 0x80,
        ulUnicodeRange1=(1 << 0) | (1 << 1) | (1 << 2), ulCodePageRange1=(1 << 0) | (1 << 1),
        yStrikeoutPosition=round(p.xh * 0.5), yStrikeoutSize=round(p.H),
        ySubscriptYOffset=140, ySuperscriptYOffset=round(p.cap * 0.4),
    )
    fb.setupPost(keepGlyphNames=True, underlinePosition=-110, underlineThickness=round(p.H))
    ss01 = sorted(n[:-5] for n in o.comps.keys() | o.contours.keys() if n.endswith('.ss01') and n[:-5] in o.adv)
    fea = GSUB_FEA + '\nfeature ss01 {\n  featureNames { name "Plain I and l (as in Helvetica)"; };\n'
    fea += ''.join(f'  sub {n} by {n}.ss01;\n' for n in ss01) + '} ss01;\n'
    fea += '\n' + kern_fea(o) + '\n' + mark_fea(o)
    addOpenTypeFeaturesFromString(fb.font, fea)
    # smart dropout control: keeps thin strokes from vanishing in unhinted rasterization
    prep = newTable('prep')
    prep.program = ttProgram.Program()
    prep.program.fromBytecode(bytes([0xB8, 0x01, 0xFF, 0x85, 0xB0, 0x04, 0x8D]))
    fb.font['prep'] = prep
    gasp = newTable('gasp')
    gasp.version = 1
    gasp.gaspRange = {0xFFFF: 0x000F}
    fb.font['gasp'] = gasp
    return fb.font


# Stem at each named weight (Regular 84, Black 178 are the masters). The light half uses equal
# stem *ratios*, since linear interpolation crowds it (Thin->ExtraLight is a doubling). The heavy
# half front-loads weight as Geist and Inter do, so Bold reads as clearly bold next to Regular:
# with equal ratios Bold's stem was 132 and it was only 1.31x as dark as Regular (Geist 1.45x).
NAMED_STEMS = [(100, 22), (200, 34.4), (300, 53.7), (400, 84), (500, 104), (600, 124), (700, 144), (800, 163), (900, 178)]


def _wght_map():
    """avar segments: user weight -> the design coordinate whose linear master stem is the target."""
    out = []
    for w, stem in NAMED_STEMS:
        if stem <= 84:
            d = 100 + (stem - 22) / (84 - 22) * 300
        else:
            d = 400 + (stem - 84) / (178 - 84) * 500
        out.append((w, round(d, 1)))
    return out


WGHT_MAP = _wght_map()


def build(italic=False):
    os.makedirs(DIST, exist_ok=True)
    kern.reset()
    outs = []
    for name, loc in ITALIC_MASTERS if italic else MASTERS:
        p = P(**loc)
        o = draw_master(p)
        o.name, o.loc = name, loc
        outs.append(o)
    for o in outs:
        apply_slant(o)
    order = glyph_order(outs[0])
    glyfs = build_glyf(outs, order)
    ds = DesignSpaceDocument()
    for tag, name, lo, df, hi in (('wght', 'Weight', 100, 400, 900), ('opsz', 'Optical size', 8, 14, 48)):
        a = AxisDescriptor()
        a.tag, a.name, a.minimum, a.default, a.maximum = tag, name, lo, df, hi
        if tag == 'wght':
            a.map = WGHT_MAP
        ds.addAxis(a)
    for o, glyf in zip(outs, glyfs):
        s = SourceDescriptor()
        s.font = build_master_font(o, glyf, order)
        s.location = {'Weight': o.loc['wght'], 'Optical size': o.loc['opsz']}
        s.name = o.name
        ds.addSource(s)
    add_gvar = varLib._add_gvar
    varLib._add_gvar = lambda *a, **k: add_gvar(*a, **{**k, 'tolerance': IUP_TOLERANCE})
    try:
        vf, _, _ = varLib.build(ds, exclude=['STAT'], optimize=True)
    finally:
        varLib._add_gvar = add_gvar
    finish(vf, italic)
    return vf


WEIGHTS = [(100, 'Thin'), (200, 'ExtraLight'), (300, 'Light'), (400, 'Regular'), (500, 'Medium'), (600, 'SemiBold'), (700, 'Bold'), (800, 'ExtraBold'), (900, 'Black')]


def finish(vf, italic=False):
    from fontTools.ttLib.tables._f_v_a_r import NamedInstance
    from fontTools.ttLib.tables._g_l_y_f import OVERLAP_COMPOUND, flagOverlapSimple

    # Stroke-built glyphs overlap by design. These flags tell rasterizers so (CoreText needs them
    # to anti-alias overlaps without seams); fontmake sets them on variable fonts for the same reason.
    glyf = vf['glyf']
    for gn in vf.getGlyphOrder():
        g = glyf[gn]
        if g.isComposite():
            g.components[0].flags |= OVERLAP_COMPOUND
        elif g.numberOfContours > 0:
            g.flags[0] |= flagOverlapSimple

    name = vf['name']
    fvar = vf['fvar']
    fvar.instances = []
    for w, wn in WEIGHTS:
        if italic:
            sub = 'Italic' if wn == 'Regular' else f'{wn} Italic'
        else:
            sub = wn
        inst = NamedInstance()
        inst.subfamilyNameID = name.addMultilingualName({'en': sub}, minNameID=256, mac=False)
        inst.postscriptNameID = name.addMultilingualName({'en': f'{PS}-{sub.replace(" ", "")}'}, minNameID=256, mac=False)
        inst.coordinates = {'wght': w, 'opsz': 14}
        fvar.instances.append(inst)
    buildStatTable(vf, [
        dict(tag='wght', name='Weight', values=[dict(value=w, name=n, flags=0x2 if w == 400 else 0, **({'linkedValue': 700} if w == 400 else {})) for w, n in WEIGHTS]),
        # opsz is applied automatically by CSS (font-optical-sizing: auto), so it never needs
        # to be part of a style name: every value is elidable
        dict(tag='opsz', name='Optical size', values=[dict(value=8, name='Caption', flags=0x2), dict(value=14, name='Text', flags=0x2), dict(value=48, name='Display', flags=0x2)]),
        # ital is a STAT-only axis: it links the two files so apps group them as one family
        dict(tag='ital', name='Italic', values=[dict(value=1, name='Italic')] if italic else [dict(value=0, name='Roman', flags=0x2, linkedValue=1)]),
    ], elidedFallbackName='Regular', macNames=False)
    name.removeNames(platformID=1)
    # post v3: glyph names are build-time only; dropping them saves ~2 KB in the shipped file
    vf['post'].formatType = 3.0
    vf['head'].fontRevision = float(VERSION.rsplit('.', 1)[0])
    vf['head'].flags |= 1 << 3  # integer ppem scaling
    vf['OS/2'].fsSelection |= 1 << 7  # USE_TYPO_METRICS
    if italic:
        vf['OS/2'].fsSelection = (vf['OS/2'].fsSelection | 1) & ~(1 << 6)  # ITALIC, not REGULAR
        vf['head'].macStyle |= 1 << 1
        vf['post'].italicAngle = -float(ITALIC_ANGLE)
        vf['hhea'].caretSlopeRise, vf['hhea'].caretSlopeRun = 1000, round(1000 * math.tan(math.radians(ITALIC_ANGLE)))


LATIN = 'U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2039-203A,U+20AC,U+2122,U+2212'


def _roundtrip(font):
    """Instancer output keeps lazy tables the subsetter trips over; a save/load normalizes it."""
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return TTFont(buf)


def _subset_latin(font):
    font = _roundtrip(font)
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=subset.parse_unicodes(LATIN))
    s.subset(font)
    return font


def _save_woff2(font, fn):
    font.flavor = 'woff2'
    font.save(os.path.join(DIST, fn))


def save_all(upright, italic):
    for fn in os.listdir(DIST):  # outputs are fully regenerated; stale names must not linger
        os.remove(os.path.join(DIST, fn))
    for vf, stem in ((upright, PS), (italic, f'{PS}-Italic')):
        path = os.path.join(DIST, f'{stem}[opsz,wght].ttf')
        vf.flavor = None
        vf.save(path)
        load = lambda path=path: TTFont(path)  # noqa: E731
        _save_woff2(load(), f'{stem}[opsz,wght].woff2')
        # Latin slices: the files a website actually serves (unicode-range splits the rest off)
        _save_woff2(_subset_latin(load()), f'{stem}-Latin[opsz,wght].woff2')
        _save_woff2(_subset_latin(instancer.instantiateVariableFont(load(), {'opsz': 14})), f'{stem}-Latin[wght].woff2')
    # static Regular, full character set: the static-vs-static comparison
    _save_woff2(instancer.instantiateVariableFont(TTFont(os.path.join(DIST, f'{PS}[opsz,wght].ttf')), {'wght': 400, 'opsz': 14}), f'{PS}-Regular.woff2')
    for fn in sorted(os.listdir(DIST)):
        print(f'{os.path.getsize(os.path.join(DIST, fn)):>8}  {fn}')


if __name__ == '__main__':
    save_all(build(), build(italic=True))

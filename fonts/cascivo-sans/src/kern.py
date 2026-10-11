"""Measured class kerning.

Which pairs: src/kern_candidates.json, the character pairs that two independently kerned fonts
(Geist and Inter) both kern in the same direction, plus the pairs first chosen by hand (see
kern_oracle.py). Only the list is borrowed. Every value is measured here from Cascivo's own
outlines, in every master, and a candidate is dropped when that measurement disagrees in sign
or is too small to see. Measuring every possible pair instead "works" numerically but kerns
open shapes the eye already accepts (it once tightened LM and FG).

How much: the gap between the first glyph's right profile and the second glyph's left profile
is measured in 10-unit bands, depth-limited (a deep hole only counts so much, as for the eye),
and compared with the gap between two straight stems. Two more terms: the closest point, and how
far both facing sides lean the same way (parallel diagonals, as in AV or Av, read looser than
their gap says). The weights were fitted by least squares on 70% of the candidates so that,
applied to Cascivo's own outlines, the result best matches the Geist/Inter average. On the
held-out 30% it is off by 15 units on average with correlation 0.61; Geist and Inter differ from
each other by 21 (correlation 0.45). It undershoots the strongest pairs (about -56 where the
references use -78), which errs toward loose rather than colliding.
"""

import json
import os
import unicodedata

from composites import ALIAS, GREEK_ACCENTED, GREEK_POLY, accented_chars, glyph_name, is_cap, script_glyph
from geom import seg_point

BAND = 10
MIN_KERN = 10  # units; smaller corrections are invisible at text sizes
DEPTH = 1.04  # depth cap, in stem sidebearings (fitted)
W_GAP, W_CLOSEST, W_LEAN = 0.605, 0.077, -0.525  # fitted, see module docstring

CHAR_GLYPH = {
    '.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon', "'": 'quotesingle', '"': 'quotedbl',
    '\u2018': 'quoteleft', '\u2019': 'quoteright', '\u201c': 'quotedblleft', '\u201d': 'quotedblright',
    '-': 'hyphen', '\u2013': 'endash', '\u2014': 'emdash', '(': 'parenleft', ')': 'parenright',
    '[': 'bracketleft', ']': 'bracketright', '{': 'braceleft', '}': 'braceright', '/': 'slash',
    '?': 'question', '!': 'exclam', '\u00ab': 'guillemotleft', '\u00bb': 'guillemotright',
    '\u2039': 'guilsinglleft', '\u203a': 'guilsinglright', '&': 'ampersand', '*': 'asterisk', '@': 'at',
}
FIGS = 'zero one two three four five six seven eight nine'.split()
for _i, _n in enumerate(FIGS):
    CHAR_GLYPH[str(_i)] = _n + '.pnum'  # proportional figures are the default; tabular ones never kern


# Pairs no reference font can vouch for, because the shape is Cascivo's own: the tailed l tucks
# its tail under the next letter, which brings it too close to low punctuation ("all.") and into
# the feet of A, X and x; the italic f hooks its descender under the letter before it, into the
# feet of diagonal letters and r. Only a pair whose measurement opens it is kept.
OWN_SHAPE_PAIRS = {(a, b): 1 for a, b in [('l', 'period'), ('l', 'comma'), ('l', 'ellipsis'), ('l', 'A'), ('l', 'X'), ('l', 'x')]}
OWN_SHAPE_PAIRS.update({(a, 'f'): 1 for a in 'kvwxyr'})
# Clear at Regular but closing at the heavy corners (Display Black: the opsz and weight deltas add
# up): the tailed l into z, the italic t's crossbar under a diagonal, top-heavy capitals into T.
OWN_SHAPE_PAIRS.update({(a, b): 1 for a, b in [('l', 'z'), ('x', 't'), ('k', 't'), ('y', 't'), ('v', 't'), ('w', 't'), ('r', 't'), ('t', 'z'), ('V', 'T'), ('W', 'T'), ('Y', 'T'), ('X', 'T'), ('f', 'T')]})

# Cyrillic, same kind: ħ's bar (and ћ, the same glyph) overhangs to the left at the height of a
# T's or Г's bar, and Ъ Ђ Ћ start with a bar at the top left; at the heavy corners each met the
# letter before it (Тћ -14, VЪ and УТ 0 at Display Black italic).
OWN_SHAPE_PAIRS.update({(a, 'hbar'): 1 for a in ['T', 'V', 'Y', 'X', 'E', 'uni0413', 'uni0414', 'uni0423', 'uni0490', 'uni0491']})
OWN_SHAPE_PAIRS.update({(a, b): 1 for a in ['V', 'Y', 'uni0423'] for b in ['T', 'uni0402', 'uni040B', 'uni042A']})
OWN_SHAPE_PAIRS.update({(a, 'uni044A'): 1 for a in ['uni0436', 'x', 'kgreenlandic', 'y']})
OWN_SHAPE_PAIRS.update({(a, 'uni03C4'): 1 for a in ['uni03C7', 'kgreenlandic']})  # χτ κτ, as Latin xt kt

# An accent wider than i overhangs it (ï î ĩ ī ĭ, and ї): at Black ï met an ascender beside it by
# 39 units (dï, ïl), f by 59 and a T or V bar by 90, and Tï touched at Regular. These leave i's class
# and kern open against every tall letter on either side, as Inter's and Plex's do (Inter: Tï +91,
# ïï +166 per 1000). They also keep every pair i has.
I_WIDE = ['uni00EF', 'uni00EE', 'uni0129', 'uni012B', 'uni012D']  # ï î ĩ ī ĭ
# every capital and ascender reaches the dots' height (X's and Z's arms met them by 88 at Display
# Black), and so do i's and j's own dots
TALL = list('ABCDEFGHIJKLMNOPQRSTUVWXYZbdfhklt') + ['i', 'j'] + I_WIDE
OWN_SHAPE_PAIRS.update({(a, b): 1 for i in I_WIDE for a, b in [(t, i) for t in TALL] + [(i, t) for t in TALL]})

# Closing pairs no reference list carries, kept when the measurement agrees: tt, whose two
# crossbars Inter and Plex let nearly meet (ours sat 1.3x their white at Bold).
OWN_CLOSING_PAIRS = {('t', 't'): -1}


def _glyph(ch):
    if ch in CHAR_GLYPH:
        return CHAR_GLYPH[ch]
    if 0x370 <= ord(ch) < 0x530:  # А and Α are kerned as A: they are A, and share A's classes
        return script_glyph(ch)
    return ch


def _candidates():
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, 'kern_candidates.json'), encoding='utf-8') as fh:
        return {(_glyph(k[0]), _glyph(k[1])): v for k, v in json.load(fh).items()}


def _members(base, glyphs, acc):
    """A base glyph plus its accented forms: they share a side, so they share kerning."""
    return [g for g in [base] + acc.get(base, []) if g in glyphs]


def _points(o, name, ox=0.0, oy=0.0, a=1.0):
    pts = []
    for c in o.contours.get(name, []):
        for s in c:
            if s[0] == 'L':
                (x0, y0), (x1, y1) = s[1], s[2]
                n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) / 5))
                pts += [(x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n) for j in range(n)]
            else:
                pts += [seg_point(s, j / 24) for j in range(24)]
    out = [(ox + a * x, oy + a * y) for x, y in pts]
    for g, cx, cy, ca in o.comps.get(name, []):
        out += _points(o, g, ox + a * cx, oy + a * cy, a * ca)
    return out


def _profile(o, name):
    lo, hi = {}, {}
    for x, y in _points(o, name):
        b = int(y // BAND)
        lo[b] = min(lo.get(b, x), x)
        hi[b] = max(hi.get(b, x), x)
    return lo, hi


def _slope(profile, bands):
    """dx/dy of a side profile (least squares): 0 for a stem, about +-0.4 for a diagonal."""
    n = len(bands)
    ys = [b * BAND for b in bands]
    xs = [profile[b] for b in bands]
    my, mx = sum(ys) / n, sum(xs) / n
    var = sum((y - my) ** 2 for y in ys)
    return sum((y - my) * (x - mx) for y, x in zip(ys, xs)) / var if var else 0.0


def measure(o, left_glyph, right_glyph, most=40):
    p = o.p
    _, hi = _profile(o, left_glyph)
    lo, _ = _profile(o, right_glyph)
    adv = o.adv[left_glyph]
    bands = sorted(set(hi) & set(lo))
    if len(bands) < 3:
        return 0
    gaps = [(adv - hi[b]) + lo[b] for b in bands]
    ref = (p.Sc if is_cap(left_glyph) else p.S) + (p.Sc if is_cap(right_glyph) else p.S)
    depth = DEPTH * p.S
    eff = sum(min(g, ref + depth) for g in gaps) / len(gaps)
    sa, sb = _slope(hi, bands), _slope(lo, bands)
    lean = min(abs(sa), abs(sb)) if sa * sb > 0 else 0.0
    k = W_GAP * (ref - eff) + W_CLOSEST * (ref - min(gaps)) + W_LEAN * lean * p.S
    floor = 0.55 * p.S - min(gaps)  # never let the closest point get nearer than this
    k = max(k, floor)
    return int(round(max(-140, min(most, k))))


def kern_pairs(o):
    glyphs = set(o.contours) | set(o.comps)
    acc = {}
    for ch, base, _m in accented_chars():
        acc.setdefault(base, []).append(glyph_name(ch))
    for cp, latin in ALIAS.items():
        acc.setdefault(latin, []).append('uni%04X' % cp)
    # lowercase Greek with tonos or dialytika kern as their letter; a capital's tonos stands
    # out to its left, so Ά is not kerned as Α
    for cp in GREEK_POLY:  # lowercase polytonic letters kern as their letter (capitals' marks stand before)
        d = unicodedata.normalize('NFD', chr(cp))
        if chr(cp).islower() and len(d) > 1 and 0x370 <= ord(d[0]) < 0x400:
            acc.setdefault(script_glyph(d[0]), []).append('uni%04X' % cp)
    for cp in GREEK_ACCENTED:
        # ΐ ΰ are widened to hold their dots (build.py) and take no closing kern: as υ, ΰ's dots
        # ran into a T's bar (-32 at Display Black italic)
        if chr(cp).islower() and cp not in (0x390, 0x3B0):
            acc.setdefault(script_glyph(unicodedata.normalize('NFD', chr(cp))[0]), []).append('uni%04X' % cp)
    # ї is ï in Ukrainian: it leaves i's class too, and side grouping puts it with ï
    acc['i'] = [g for g in acc.get('i', []) if g not in I_WIDE and g != 'uni0457']
    cands = {k: v for k, v in _candidates().items() if k[0] in glyphs and k[1] in glyphs}
    for (a, b), v in list(cands.items()):
        for w in I_WIDE:
            if a == 'i':
                cands.setdefault((w, b), v)
            if b == 'i':
                cands.setdefault((a, w), v)
    cands.update(OWN_SHAPE_PAIRS)
    cands.update(OWN_CLOSING_PAIRS)
    # a wide i opens as far as it must: ïï needs about 190 at Black (Inter's is 166/1000)
    pairs = {(a, b): (measure(o, a, b, 250 if a in I_WIDE or b in I_WIDE else 40), sign) for (a, b), sign in cands.items()}
    # an own-shape pair only ever opens, by however much each master measures it needs
    pairs.update({k: (max(0, pairs[k][0]), 1) for k in OWN_SHAPE_PAIRS if k in pairs})
    return acc, glyphs, pairs


_SELECTED = None
_REGULAR = None  # values measured on the Regular master
_GROUPS = None  # (right-side rep, left-side rep) of each Cyrillic and Greek glyph


def reset():
    """Each font (upright, italic) measures and selects its own pairs."""
    global _SELECTED, _REGULAR, _BLACK, _GROUPS
    _SELECTED = _REGULAR = _BLACK = _GROUPS = None


def _non_latin(name):
    return name[:5] in ('uni03', 'uni04')


def _side_groups(o, glyphs, acc, keys):
    """Cyrillic and Greek glyphs whose side matches another glyph's ink to 3 units in every band
    share that glyph's class on that side: Б Г П Ш Ь all start with H's stem, ц and щ end like u.
    That shrank the kerning by a third, and gives the letters no reference kerns (Қ, the Bulgarian
    forms) the kerning of the glyph they match. A Latin match is preferred, the one with the most
    pairs on that side."""
    members = {m for ms in acc.values() for m in ms}
    profiles = {}

    def side(name, right):
        if (name, right) not in profiles:
            lo, hi = _profile(o, name)
            prof = {b: o.adv[name] - x for b, x in hi.items()} if right else lo
            profiles[name, right] = prof
        return profiles[name, right]

    def same(a, b, right):
        pa, pb = side(a, right), side(b, right)
        return pa.keys() == pb.keys() and len(pa) >= 3 and all(abs(pa[k] - pb[k]) <= 3 for k in pa)

    groups = {}
    for right, idx in ((True, 0), (False, 1)):
        count = {}
        for k in keys:
            count[k[idx]] = count.get(k[idx], 0) + 1
        latin = sorted((g for g in count if not _non_latin(g)), key=lambda g: (-count[g], g))
        reps = []
        for g in sorted(n for n in glyphs if _non_latin(n) and n not in members and n in o.adv):
            rep = next((r for r in latin if same(g, r, right)), None) or next((r for r in reps if same(g, r, right)), None)
            if rep is None:
                reps.append(g)
                rep = g
            groups.setdefault(g, [g, g])[idx] = rep
    return groups


_BLACK = None  # values measured on the Black master
_CORNERS = {}  # optical-size master name -> its corner with Black (outlines Black + it - Regular)


_HEAVY = []  # Black and the corners: where an own-shape pair may need opening when Regular doesn't


def set_corners(corners, black):
    """build.py hands over the Black master and the Black corners of the optical-size masters."""
    _CORNERS.clear()
    _CORNERS.update(corners)
    _HEAVY[:] = [black] + list(corners.values())


def _values(o, pairs):
    """Kerning follows weight, but optical size barely changes it: those masters reuse
    Regular's values, so their deltas vanish (1.6 KB of WOFF2, measured).

    Except where a pair only ever opens: at Display Black the weight's and the size's outline
    deltas add up to a corner no master contains, and pairs Regular, Black and Display each
    kept clear touched there (ĩF -5, ïï -7). Such a pair is measured on the corner itself, and
    the optical-size master takes whatever value makes the interpolated corner reach it."""
    global _REGULAR, _BLACK
    # The measure is fitted at Regular. Heavier, the references kern harder than it says: Bold
    # carried 0.87 and Black 0.76 of Inter's and Geist's total kerning, most of it short in the
    # strong pairs (AW, LT, LY, TJ). Closing pairs grow with weight; opening ones stay.
    boost = 1 + 0.3 * o.p.heavy
    vals = {k: round(v[0] * boost) if v[0] < 0 else v[0] for k, v in pairs.items()}
    loc = getattr(o, 'loc', {'wght': 400, 'opsz': 14})
    if loc.get('wght') == 400 and loc.get('opsz') == 14:
        _REGULAR = vals
    elif loc.get('wght') == 900 and loc.get('opsz') == 14:
        _BLACK = vals
    elif loc.get('wght') == 400 and _REGULAR is not None:
        out = dict(_REGULAR)
        corner = _CORNERS.get(getattr(o, 'name', None))
        if corner is not None and _BLACK is not None:
            for k in pairs:
                if k in OWN_SHAPE_PAIRS or k[0] in I_WIDE or k[1] in I_WIDE:
                    need = max(0, measure(corner, *k, 250 if k[0] in I_WIDE or k[1] in I_WIDE else 40))
                    # corner value = R + (B - R) + (M - R) = B + M - R
                    out[k] = max(out[k], need - _BLACK[k] + _REGULAR[k])
        return out
    return vals


def kern_fea(o):
    """Same pair set for every master (structure must match); values measured per master."""
    global _SELECTED, _GROUPS
    acc, glyphs, pairs = kern_pairs(o)
    if _GROUPS is None:  # the default master decides the classes, as it does the pairs
        _GROUPS = _side_groups(o, glyphs, acc, list(pairs))
    rr = lambda g: _GROUPS.get(g, (g, g))[0]  # noqa: E731
    rl = lambda g: _GROUPS.get(g, (g, g))[1]  # noqa: E731
    # A pair moves to its sides' representatives. One that lands on Latin on both sides only
    # because of a Cyrillic or Greek glyph is dropped: Latin's own list decides Latin shapes.
    moved = {}
    for (a, b), v in pairs.items():
        k = (rr(a), rl(b))
        if (a, b) != k and not _non_latin(k[0]) and not _non_latin(k[1]):
            continue
        if k not in moved or (a, b) == k:
            moved[k] = v
    pairs = {k: (measure(o, *k, 250 if k[0] in I_WIDE or k[1] in I_WIDE else 40), v[1]) if k not in pairs else pairs[k] for k, v in moved.items()}
    if _SELECTED is None:  # the first (default) master decides which pairs exist
        keep = []
        for (a, b), (k, sign) in pairs.items():
            # own-shape pairs stay where Regular needs nothing but Black or a heavy corner does
            if abs(k) >= MIN_KERN and (k < 0) == (sign < 0):
                keep.append((a, b))
            elif (a, b) in OWN_SHAPE_PAIRS:
                most = 250 if a in I_WIDE or b in I_WIDE else 40
                if k > 0 or not _HEAVY or any(measure(h, a, b, most) > 0 for h in _HEAVY):
                    keep.append((a, b))
        _SELECTED = sorted(keep)
    firsts = sorted({a for a, _ in _SELECTED})
    seconds = sorted({b for _, b in _SELECTED})
    joined_r, joined_l = {}, {}
    for g, (r, l) in _GROUPS.items():
        if r != g:
            joined_r.setdefault(r, []).append(g)
        if l != g:
            joined_l.setdefault(l, []).append(g)
    cls = lambda g: g.replace('.', '_')  # noqa: E731
    lines = [f'@kR_{cls(g)} = [{" ".join(_members(g, glyphs, acc) + sorted(joined_r.get(g, [])))}];' for g in firsts]
    lines += [f'@kL_{cls(g)} = [{" ".join(_members(g, glyphs, acc) + sorted(joined_l.get(g, [])))}];' for g in seconds]
    lines.append('feature kern {')
    vals = _values(o, pairs)
    for a, b in _SELECTED:
        lines.append(f'  pos @kR_{cls(a)} @kL_{cls(b)} {vals[(a, b)]};')
    lines.append('} kern;')
    return '\n'.join(lines)

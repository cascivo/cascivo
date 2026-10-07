"""Measured class kerning.

Pairs are not hand-tuned: for each class pair the gap between the first glyph's right profile and
the second glyph's left profile is measured in 10-unit bands, depth-limited (a deep hole only
counts so much — that's what the eye does), and compared with the gap of two straight stems.
Only pairs involving an irregular side (diagonal, open, overhanging, punctuation) are kerned;
stem/round combinations are already balanced by the sidebearings.
"""

from composites import accented_chars, glyph_name
from geom import seg_point

BAND = 10

# representative -> members (first glyph of a pair; its RIGHT side)
RIGHT = {
    'A': 'A', 'C': 'C', 'E': 'E AE OE', 'F': 'F', 'G': 'G', 'K': 'K X', 'L': 'L', 'P': 'P Thorn',
    'R': 'R', 'S': 'S', 'T': 'T', 'V': 'V W', 'Y': 'Y', 'Z': 'Z', 'B': 'B',
    'H': 'H I M N U J', 'O': 'O D Q Oslash Eth Dcroat',
    'n': 'n a d i l u g q m h dotlessi', 'o': 'o b p thorn oslash', 'c': 'c', 'e': 'e ae oe',
    'f': 'f', 'k': 'k x', 'r': 'r', 's': 's', 't': 't', 'v': 'v w y', 'z': 'z',
    'period': 'period comma ellipsis', 'quoteright': 'quoteright quotedblright quotesingle quotedbl',
    'hyphen': 'hyphen endash emdash', 'parenleft': 'parenleft bracketleft braceleft',
}
# representative -> members (second glyph; its LEFT side)
LEFT = {
    'A': 'A AE', 'H': 'H B D E F I K L M N P R U Thorn Eth Dcroat', 'O': 'O C G Q Oslash OE', 'J': 'J',
    'S': 'S', 'T': 'T', 'V': 'V W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
    'n': 'n b h k l i m p r u thorn dotlessi', 'o': 'o c d e q g oslash oe', 'a': 'a ae',
    'f': 'f', 's': 's', 't': 't', 'v': 'v w y', 'x': 'x', 'z': 'z', 'j': 'j',
    'period': 'period comma ellipsis', 'quoteleft': 'quoteleft quotedblleft quotesingle quotedbl',
    'hyphen': 'hyphen endash emdash', 'parenright': 'parenright bracketright braceright',
}
# Which class pairs get kerned at all. Measuring every pair "works" numerically but kerns
# open shapes (E, L, F against stems) that the eye already accepts — professional kerning is a
# short list of genuinely awkward combinations, so the list is explicit.
ALLOWED = {
    'A': 'T V Y O quoteleft v t hyphen',
    'L': 'T V Y O quoteleft v hyphen',
    'T': 'A O J period hyphen a o n s v x z',
    'V': 'A O J period hyphen a o n s',
    'Y': 'A O J period hyphen a o n s v x',
    'P': 'A J period a o',
    'F': 'A J period a o',
    'K': 'O o hyphen v',
    'R': 'T V Y',
    'O': 'A V Y T X J period',
    'r': 'period hyphen a o',
    'f': 'period quoteleft o',
    't': 'o',
    'v': 'period a o',
    'k': 'o hyphen',
    'o': 'v x period quoteleft',
    'e': 'v x',
    'period': 'quoteleft T V Y v',
    'quoteright': 'A a o',
    'hyphen': 'T V Y A',
}


def _expand_members(table, glyphs):
    acc = {}
    for ch, base, _m in accented_chars():
        acc.setdefault(base, []).append(glyph_name(ch))
    out = {}
    seen = set()
    for rep, members in table.items():
        ms = []
        for m in members.split():
            for g in [m] + acc.get(m, []):
                if g in glyphs and g not in seen:
                    ms.append(g)
                    seen.add(g)
        out[rep] = ms
    return out


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


def measure(o, left_glyph, right_glyph):
    p = o.p
    _, hi = _profile(o, left_glyph)
    lo, _ = _profile(o, right_glyph)
    adv = o.adv[left_glyph]
    bands = sorted(set(hi) & set(lo))
    if len(bands) < 3:
        return 0
    gaps = [(adv - hi[b]) + lo[b] for b in bands]
    ref = (p.Sc if left_glyph[0].isupper() else p.S) + (p.Sc if right_glyph[0].isupper() else p.S)
    depth = 110 + p.S * 0.3
    eff = sum(min(g, ref + depth) for g in gaps) / len(gaps)
    k = 0.72 * (ref - eff)
    floor = 0.55 * p.S - min(gaps)  # never let the closest point get nearer than this
    k = max(k, floor)
    return int(round(max(-140, min(40, k))))


def kern_pairs(o):
    glyphs = set(o.contours) | set(o.comps)
    R = _expand_members(RIGHT, glyphs)
    Lc = _expand_members(LEFT, glyphs)
    pairs = {}
    for r in R:
        for left in Lc:
            if left not in ALLOWED.get(r, '').split():
                continue
            pairs[(r, left)] = measure(o, r, left)
    return R, Lc, pairs


_SELECTED = None


def kern_fea(o):
    """Same pair set for every master (structure must match); values measured per master."""
    global _SELECTED
    R, Lc, pairs = kern_pairs(o)
    if _SELECTED is None:  # the first (default) master decides which pairs exist
        _SELECTED = sorted(k for k, v in pairs.items() if abs(v) >= 10)
    lines = []
    for rep, ms in R.items():
        lines.append(f'@kR_{rep} = [{" ".join(ms)}];')
    for rep, ms in Lc.items():
        lines.append(f'@kL_{rep} = [{" ".join(ms)}];')
    lines.append('feature kern {')
    for r, left in _SELECTED:
        lines.append(f'  pos @kR_{r} @kL_{left} {pairs[(r, left)]};')
    lines.append('} kern;')
    return '\n'.join(lines)

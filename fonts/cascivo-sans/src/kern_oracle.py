"""Regenerate kern_candidates.json: which character pairs deserve kerning at all.

A pair is a candidate when two independent, professionally kerned fonts (Geist and Inter, both
OFL) each kern it by at least 12/1000 em in the same direction. Only the *pair list* is stored;
every value in Cascivo Sans is measured from its own outlines (kern.py), and a candidate is
dropped when that measurement disagrees. The pairs chosen by hand before this list existed are
kept as well.

    python3 -I src/kern_oracle.py path/to/Geist[wght].woff2 path/to/Inter[wght].woff2
"""

import io
import json
import os
import sys

import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

CHARS = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    '.,:;\'"‘’“”-–—()[]{}/?!«»‹›&*@'
    'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзиклмнопрстуфхцчшщъыьэюя'  # й Й: kerned as и И
)
THRESHOLD = 12
# Geist kerns straight quotes against letters ("A, 'A) but not curly ones; Inter kerns both. A
# font's opinion on the straight form counts for the curly forms too, or the most common quote
# pairs in real text (“A, A”) would fall out of the list.
STRAIGHT = {'\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"'}
# Pairs kerned by hand before the candidate list existed (kept: each was checked visually).
LEGACY = (
    'AT AV AY AO A‘ Av At A- LT LV LY LO L‘ Lv L- TA TO TJ T. T- Ta To Tn Ts Tv Tx Tz VA VO VJ V. V- Va'
    ' Vo Vn Vs YA YO YJ Y. Y- Ya Yo Yn Ys Yv Yx PA PJ P. Pa Po FA FJ F. Fa Fo KO Ko K- Kv RT RV RY OA'
    ' OV OY OT OX OJ O. r. r- ra ro f. f‘ fo to v. va vo ko k- ov ox o. o‘ ev ex .‘ .T .V .Y .v ’A ’a'
    ' ’o -T -V -Y -A'
).split()


def kerned_pairs(path):
    f = TTFont(path)
    if 'fvar' in f:
        f = instantiateVariableFont(f, {'wght': 400})
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    face = hb.Face(buf.getvalue())
    font = hb.Font(face)

    def advance(s, kern):
        b = hb.Buffer()
        b.add_str(s)
        b.guess_segment_properties()
        hb.shape(font, b, {'kern': kern})
        return sum(p.x_advance for p in b.glyph_positions)

    out = {}
    for a in CHARS:
        for c in CHARS:
            k = (advance(a + c, True) - advance(a + c, False)) * 1000 / face.upem
            if abs(k) >= THRESHOLD:
                out[a + c] = k
    return out


def _with_straight_quotes(kerns):
    out = dict(kerns)
    for a in CHARS:
        for c in CHARS:
            straight = STRAIGHT.get(a, a) + STRAIGHT.get(c, c)
            if a + c not in out and straight != a + c and straight in kerns:
                out[a + c] = kerns[straight]
    return out


def main(geist, inter):
    g, i = _with_straight_quotes(kerned_pairs(geist)), _with_straight_quotes(kerned_pairs(inter))
    both = {p: (-1 if g[p] < 0 else 1) for p in g if p in i and (g[p] < 0) == (i[p] < 0)}
    for p in LEGACY:
        both.setdefault(p, -1)
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kern_candidates.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(dict(sorted(both.items())), fh, ensure_ascii=False, indent=0)
    print(f'{len(both)} candidate pairs -> {path}')


if __name__ == '__main__':
    main(*sys.argv[1:3])

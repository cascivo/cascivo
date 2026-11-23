"""Numeric stand-in for the blind judge of JUDGING.md: Cascivo Sans against Inter, Geist and Plex.

    python3 -I src/score.py [--font PATH] [--italic] [--refs /tmp/refs] [--json] [--weights 100,...]

Every metric is a value per (glyph or pair, weight). Each value becomes a z-score against the
reference fonts' mean and spread at the same weight (spread floored, so three fonts that happen to
agree do not make the scale infinite). A z inside +-1 is "as good as the references" and costs
nothing; the excess costs points. Rubric items are 10 minus a scaled mix of the mean and the
90th-percentile excess ("score each criterion at the worst place"). Signature glyphs are left out
of every "match the references" metric. Prints one summary line and the 10 worst rows.
"""

import argparse
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, '..', 'fonts')
OWN = {False: os.path.join(DIST, 'CascivoSans[opsz,wght].ttf'), True: os.path.join(DIST, 'CascivoSans-Italic[opsz,wght].ttf')}
REF_FILES = {False: ('Inter.woff2', 'Geist.woff2', 'Plex.woff2'), True: ('InterItalic.woff2', 'PlexItalic.woff2')}

WEIGHTS = tuple(range(100, 1000, 100))
LOWER = 'abcdefghijklmnopqrstuvwxyz'
UPPER = LOWER.upper()
FIGURES = '0123456789'
GLYPHS = LOWER + UPPER + FIGURES
# Identity glyphs: the serifed I, the G spur, the tailed l (JUDGING.md "Character"); glyphs.py has no marker for them.
SIGNATURE = frozenset('IGl')
SIZE = 200  # px for shape metrics: 1 px = 5 units
Z_FLOOR = 0.10  # a spread below this share of |mean| (or ABS_FLOOR) is not trusted
ABS_FLOOR = {'color': 0.01, 'counter': 0.015, 'spacing': 0.06, 'wstep': 4.0, 'stem': 3.0, 'ambig': 0.04, 'opsz': 5.0, 'kink': 1.0, 'overshoot': 6.0}
# rubric item -> (weight, metrics); the item score is 10 minus SCALE x excess
ITEMS = {
    'rhythm': (15, ('spacing',)),
    'weight axis': (12, ('wstep', 'stem')),
    'shape': (15, ('counter', 'kink', 'overshoot')),
    'colour': (12, ('color',)),
    'small sizes': (10, ('ambig',)),
    'optical sizes': (4, ('opsz',)),
}
ONE_SIDED = {'ambig': 1, 'kink': 1}  # only a worse-than-reference value costs (+1: higher is worse)
SCALE = 2.0
TOL = 0.5  # z inside this costs nothing


class Face:
    """One font file at one (wght, opsz): glyph masks and advances, cached."""

    def __init__(self, path):
        t = TTFont(path)
        self.ranges = {a.axisTag: (a.minValue, a.maxValue) for a in t['fvar'].axes}
        self.tt = t
        t.flavor = None
        buf = io.BytesIO()
        t.save(buf)
        self.data = buf.getvalue()
        self.fonts = {}
        self.cache = {}
        self.name = os.path.basename(path)

    def font(self, size, wght, opsz=14):
        key = (size, wght, opsz)
        if key not in self.fonts:
            f = ImageFont.truetype(io.BytesIO(self.data), size, layout_engine=ImageFont.Layout.RAQM)
            vals = []
            for a in f.get_variation_axes():
                n = str(a['name']).lower()
                if 'weight' in n:
                    lo, hi = self.ranges.get('wght', (100, 900))
                    vals.append(min(max(wght, lo), hi))
                elif 'optical' in n:
                    lo, hi = self.ranges.get('opsz', (8, 48))
                    vals.append(min(max(opsz, lo), hi))
                else:
                    vals.append(a['default'])
            f.set_variation_by_axes(vals)
            self.fonts[key] = f
        return self.fonts[key]

    def has_weight(self, w):
        lo, hi = self.ranges.get('wght', (100, 900))
        return lo <= w <= hi

    def mask(self, text, size, wght, opsz=14, w=None, h=None):
        """Coverage 0..1; origin x = size/2, baseline y = 1.4 size (anchor ls)."""
        key = ('m', text, size, wght, opsz)
        if key not in self.cache:
            W, H = w or 2 * size, h or 2 * size
            im = Image.new('L', (W, H), 0)
            ImageDraw.Draw(im).text((size // 2, int(1.4 * size)), text, font=self.font(size, wght, opsz), fill=255, anchor='ls')
            self.cache[key] = np.asarray(im, dtype=np.float32) / 255
        return self.cache[key]

    def adv(self, ch, wght, opsz=14):
        return self.font(1000, wght, opsz).getlength(ch)

    def xheight(self, wght, opsz=14):
        return self.bounds('x', wght, opsz)[1]

    def bounds(self, ch, wght, opsz=14):
        """(ymin, ymax) of the ink, in units above the baseline."""
        m = self.mask(ch, SIZE, wght, opsz) > 0.5
        rows = np.flatnonzero(m.any(1))
        base = int(1.4 * SIZE)
        return (base - rows.max() - 1) / SIZE * 1000, (base - rows.min()) / SIZE * 1000


def runs(line):
    """Lengths of ink runs and the white runs between them on a boolean scanline, in px."""
    xs = np.flatnonzero(line)
    if not len(xs):
        return [], []
    seg = line[xs[0]:xs[-1] + 1].astype(np.int8)
    edges = np.flatnonzero(np.diff(seg)) + 1
    parts = np.diff(np.concatenate(([0], edges, [len(seg)])))
    first_ink = seg[0] == 1
    ink = parts[0::2] if first_ink else parts[1::2]
    white = parts[1::2] if first_ink else parts[0::2]
    return list(ink), list(white)


# ---- per-glyph metrics -------------------------------------------------------------------------

def m_color(face, w, size=SIZE):
    out = {}
    for ch in GLYPHS:
        a = face.adv(ch, w) / 1000
        out[ch] = face.mask(ch, size, w).sum() / size ** 2 / max(a, 0.2)
    return out


def m_counter(face, w, size=SIZE):
    """Counter area over ink area; glyphs without a counter are absent."""
    out = {}
    for ch in GLYPHS:
        ink = face.mask(ch, size, w) > 0.5
        lab, n = ndimage.label(~ink)
        if n < 2:
            continue
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
        area = sum(int((lab == i).sum()) for i in range(1, n + 1) if i not in edge)
        if area:
            out[ch] = area / ink.sum()
    return out


def _sb(face, ch, w, band, size=SIZE):
    """Left and right white depth of ch inside its advance, averaged over rows 0..band units, capped, in em."""
    ink = face.mask(ch, size, w) > 0.5
    base, x0 = int(1.4 * size), size // 2
    adv = face.adv(ch, w) / 1000 * size
    cap = 0.15 * size
    ls, rs = [], []
    top = int(base - band / 1000 * size)
    for y in range(top, base):
        xs = np.flatnonzero(ink[y])
        if len(xs):
            ls.append(min(max(xs[0] - x0, 0), cap))
            rs.append(min(max(x0 + adv - xs[-1] - 1, 0), cap))
        else:
            ls.append(cap)
            rs.append(cap)
    return float(np.mean(ls)) / size, float(np.mean(rs)) / size


def _counter_width(face, ch, w, band_frac, size=SIZE):
    ink = face.mask(ch, size, w) > 0.5
    y = int(1.4 * size - band_frac * face.bounds('x' if ch.islower() else 'H', w)[1] / 1000 * size)
    _, white = runs(ink[y])
    return (max(white) if white else 0) / size


LC_PAIRS = ('nn', 'no', 'on', 'oo', 'hn', 'nu', 'un', 'mn', 'nm', 'ou', 'ho', 'uo')
UC_PAIRS = ('HH', 'HO', 'OH', 'OO', 'HE', 'EH', 'HN', 'NH', 'NM', 'OD', 'DO', 'MH')


def m_spacing(face, w):
    """Gap between two letters (right sb + left sb, depth-capped) over the n counter, per pair."""
    out = {}
    xh, ch_ = face.xheight(w), face.bounds('H', w)[1]
    cn = _counter_width(face, 'n', w, 0.5)
    ch2 = _counter_width(face, 'H', w, 0.3)  # below the crossbar
    for pairs, band, cnt in ((LC_PAIRS, xh, cn), (UC_PAIRS, ch_, ch2)):
        for p in pairs:
            gap = _sb(face, p[0], w, band)[1] + _sb(face, p[1], w, band)[0]
            out[p] = gap / cnt if cnt else 0
    return out


def m_wstep(face, ws):
    """|2nd difference| of the advance over the weights, per glyph at the middle weight of each triple."""
    out = {}
    for ch in GLYPHS:
        a = [face.adv(ch, w) for w in ws]
        for i in range(1, len(ws) - 1):
            if all(face.has_weight(ws[j]) for j in (i - 1, i, i + 1)):
                out[(ch, ws[i])] = abs(a[i - 1] - 2 * a[i] + a[i + 1])
    return out


def _stem(face, ch, w, size=SIZE):
    ink = face.mask(ch, size, w) > 0.5
    b = face.bounds(ch, w)
    y = int(1.4 * size - b[1] * 0.5 / 1000 * size)
    r, _ = runs(ink[y])
    return r[0] / size * 1000 if r else 0


def m_stem(face, ws):
    out = {}
    for ch in 'HEnorD':
        s = [_stem(face, ch, w) for w in ws]
        for i in range(1, len(ws) - 1):
            if all(face.has_weight(ws[j]) for j in (i - 1, i, i + 1)):
                out[(ch, ws[i])] = abs(s[i - 1] - 2 * s[i] + s[i + 1])
    return out


AMBIG = (('O', '0'), ('I', 'l'), ('l', '1'), ('I', '1'), ('rn', 'm'), ('cl', 'd'))


def m_ambig(face, w):
    """Pixel IoU of confusable pairs rendered at 11 and 12 px, origins aligned (high = confusable)."""
    out = {}
    for px in (11, 12):
        for a, b in AMBIG:
            ma = face.mask(a, px, w, w=4 * px, h=3 * px)
            mb = face.mask(b, px, w, w=4 * px, h=3 * px)
            out[f'{a}/{b}@{px}'] = float(np.minimum(ma, mb).sum() / max(np.maximum(ma, mb).sum(), 1e-6))
    return out


def m_opsz(face, w, hi):
    """Change of the n and o spacing and of the x-height from opsz 14 to hi, in units."""
    out = {}
    for ch in 'noH':
        sb = lambda o: sum(_sb(face, ch, w, face.xheight(w, o) if ch != 'H' else face.bounds('H', w, o)[1]))  # noqa: E731
        out[ch + ' spacing'] = (sb(hi) - sb(14)) * 1000
    out['x-height'] = face.xheight(w, hi) - face.xheight(w, 14)
    return out


def _outline_stats(face, w):
    """Kinks at smooth on-curve points (degrees) and overshoots (units) from the instanced outlines."""
    gs = face.tt.getGlyphSet(location={'wght': min(max(w, face.ranges['wght'][0]), face.ranges['wght'][1])})
    cmap = face.tt.getBestCmap()
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    kinks = {}
    for ch in GLYPHS:
        pen = DecomposingRecordingPen(gs)
        gs[cmap[ord(ch)]].draw(pen)
        worst = 0.0
        for contour in _contours(pen.value):
            n = len(contour)
            for i, (pt, on) in enumerate(contour):
                p, q = contour[i - 1], contour[(i + 1) % n]
                if on and not p[1] and not q[1]:
                    a1 = np.degrees(np.arctan2(pt[1] - p[0][1], pt[0] - p[0][0]))
                    a2 = np.degrees(np.arctan2(q[0][1] - pt[1], q[0][0] - pt[0]))
                    worst = max(worst, abs((a2 - a1 + 180) % 360 - 180))
        kinks[ch] = worst
    return kinks


def _contours(value):
    """RecordingPen value -> contours of ((x, y), on_curve?) with on-curve flags marking only smooth-candidate points
    that sit between two off-curve control points (cubic handles)."""
    contours, cur = [], []
    for op, args in value:
        if op == 'moveTo':
            cur = [(args[0], True)]
        elif op == 'lineTo':
            cur.append((args[0], True))
        elif op == 'curveTo':
            cur.extend([(args[0], False), (args[1], False), (args[2], True)])
        elif op == 'qCurveTo':
            cur.extend([(a, False) for a in args[:-1]])
            cur.append((args[-1], True) if args[-1] is not None else (args[-2], True))
        elif op in ('closePath', 'endPath'):
            if len(cur) > 1 and cur[0][0] == cur[-1][0]:
                cur.pop()
            contours.append(cur)
            cur = []
    return contours


def m_kink(face, w):
    return _outline_stats(face, w)


def m_overshoot(face, w):
    """Round overshoot above x-height / cap height and below the baseline, in units."""
    out = {}
    for rnd, flat in (('o', 'x'), ('O', 'H')):
        out[f'{rnd} top'] = face.bounds(rnd, w)[1] - face.bounds(flat, w)[1]
        out[f'{rnd} bottom'] = -(face.bounds(rnd, w)[0] - face.bounds(flat, w)[0])
    return out


# ---- scoring -----------------------------------------------------------------------------------

def zscore(own, refs, metric):
    """Per-key z against the reference mean; refs is a list of dicts. Returns {key: (z, own, ref_mean)}."""
    out = {}
    for k, v in own.items():
        rv = [r[k] for r in refs if k in r]
        if not rv:
            continue
        mean = float(np.mean(rv))
        spread = max(float(np.std(rv)), Z_FLOOR * abs(mean), ABS_FLOOR[metric])
        z = (v - mean) / spread
        if metric in ONE_SIDED:
            z = max(z, 0.0)
        out[k] = (z, v, mean)
    return out


def excess(zs):
    e = np.array([max(abs(z) - TOL, 0.0) for z, _, _ in zs.values()]) if zs else np.zeros(1)
    return 0.3 * e.mean() + 0.7 * np.percentile(e, 90)


def collect(own_face, ref_faces, weights, italic):
    """{metric: {(key, weight): (z, own, ref)}}"""
    rows = {}

    def add(metric, w, own, refs):
        for k, t in zscore(own, refs, metric).items():
            rows.setdefault(metric, {})[(k, w)] = t

    for w in weights:
        refs_w = [r for r in ref_faces if r.has_weight(w)]
        if not refs_w:
            continue
        add('color', w, m_color(own_face, w), [m_color(r, w) for r in refs_w])
        add('counter', w, m_counter(own_face, w), [m_counter(r, w) for r in refs_w])
        add('spacing', w, m_spacing(own_face, w), [m_spacing(r, w) for r in refs_w])
        add('ambig', w, m_ambig(own_face, w), [m_ambig(r, w) for r in refs_w])
        if not italic:
            add('overshoot', w, m_overshoot(own_face, w), [m_overshoot(r, w) for r in refs_w])
    for metric, fn in (('wstep', m_wstep), ('stem', m_stem)):
        own = fn(own_face, weights)
        refs = [fn(r, weights) for r in ref_faces]
        for k, t in zscore(own, refs, metric).items():
            rows.setdefault(metric, {})[k] = t
    if not italic:
        inter = ref_faces[0]
        for w in (300, 400, 700, 900):
            add('opsz', w, m_opsz(own_face, w, 32), [m_opsz(inter, w, 32)])
        for w in (100, 400, 900):
            refs_w = [r for r in ref_faces if r.has_weight(w)]
            add('kink', w, m_kink(own_face, w), [m_kink(r, w) for r in refs_w])
    return rows


def summarise(rows):
    scores = {}
    for name, (wt, metrics) in ITEMS.items():
        parts = [excess(rows[m]) for m in metrics if m in rows]
        if parts:
            scores[name] = max(0.0, 10 - SCALE * float(np.mean(parts)))
    tot = sum(ITEMS[n][0] for n in scores)
    overall = sum(ITEMS[n][0] * s for n, s in scores.items()) / tot if tot else 0.0
    return overall, scores


def worst(rows, n=10):
    flat = []
    for metric, d in rows.items():
        for (k, w), (z, own, ref) in d.items():
            if isinstance(k, str) and len(k) == 1 and k in SIGNATURE:
                continue
            flat.append((abs(z), str(k), w, metric, own, ref))
    flat.sort(key=lambda r: -r[0])
    return flat[:n]


def run(font=None, italic=False, refs='/tmp/refs', weights=WEIGHTS, ref_paths=None):
    own = Face(font or OWN[italic])
    ref_faces = [Face(p) for p in (ref_paths or [os.path.join(refs, f) for f in REF_FILES[italic]])]
    rows = collect(own, ref_faces, tuple(weights), italic)
    for d in rows.values():  # signature glyphs do not count toward "match the references"
        for k in [k for k in d if isinstance(k[0], str) and len(k[0]) == 1 and k[0] in SIGNATURE]:
            del d[k]
    overall, scores = summarise(rows)
    return overall, scores, worst(rows), rows


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--font')
    ap.add_argument('--italic', action='store_true')
    ap.add_argument('--refs', default='/tmp/refs')
    ap.add_argument('--weights', default=','.join(map(str, WEIGHTS)))
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args(argv)
    overall, scores, bad, _ = run(a.font, a.italic, a.refs, [int(x) for x in a.weights.split(',')])
    if a.json:
        print(json.dumps({'overall': round(overall, 3), 'items': {k: round(v, 2) for k, v in scores.items()},
                          'worst': [dict(z=round(z, 2), key=k, wght=w, metric=m, own=round(o, 4), ref=round(r, 4)) for z, k, w, m, o, r in bad]}))
        return
    print(f'score {overall:.2f}  ' + '  '.join(f'{k} {v:.1f}' for k, v in scores.items()))
    for z, k, w, m, o, r in bad:
        print(f'  {k:<14} {w:>4} {m:<9} z={z:5.1f}  own {o:.3f}  ref {r:.3f}')


if __name__ == '__main__':
    main()

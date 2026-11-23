"""Numeric score for polish rounds (JUDGING.md round 6): no proof reading, only measurements.

    python3 -I src/score.py [--detail]

Six sub-scores, 0 to 10, for the upright and the italic variable font, and their mean. Each is a
formula over renders or outlines, so a round can be tuned against it and a regression shows as a
number. They are proxies, not taste: a score near 10 means "no measured defect", not "beautiful".

  rhythm  white between n's over white inside one n, flat across weights (rhythm.py), and a smooth
          width step: advances of Y X W w Z m are on a straight-ish line across 100..900
  weight  stems (width of l at half x-height) rise evenly 100..900
  shape   quality.check_all failures, and Black counters (o e a g b d p q 0 6 8 9) against Inter's
  colour  ink density of text rises evenly with weight (no jump, no plateau)
  small   at 11 and 12 px I l 1 and O 0 stay apart as pixels
  opsz    the opsz axis makes stems and sidebearings differ the right way (Caption heavier, Display lighter)
"""

import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

import quality  # noqa: E402

FONTS = os.path.join(HERE, '..', 'fonts')
UPRIGHT = os.path.join(FONTS, 'CascivoSans[opsz,wght].ttf')
ITALIC = os.path.join(FONTS, 'CascivoSans-Italic[opsz,wght].ttf')
WEIGHTS = range(100, 1000, 100)
FAST = '--fast' in sys.argv  # skips the 5-minute quality.check_all: shape then counts counters only
KINK = ['Y', 'X', 'W', 'w', 'Z', 'm']


def clip(x):
    return float(max(0.0, min(10.0, x)))


def _font(path, size, wght, opsz=14):
    f = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
    axes = f.get_variation_axes()
    vals = [wght if 'weight' in str(a['name']).lower() else opsz if 'optical' in str(a['name']).lower() else a['default'] for a in axes]
    f.set_variation_by_axes(vals)
    return f


def _ink(path, text, size, wght, opsz=14, w=None, h=None):
    f = _font(path, size, wght, opsz)
    im = Image.new('L', (w or size * len(text) * 2, h or size * 2), 255)
    ImageDraw.Draw(im).text((size // 2, size // 4), text, font=f, fill=0)
    return 1 - np.asarray(im, float) / 255


def rhythm_flat(path):
    import rhythm

    # The level falls with weight on purpose (HEAVY_TIGHTEN buys Black's +5% line budget), so only the
    # curve's smoothness is scored: a bend in it is a master out of line with its neighbours.
    r = np.array([rhythm.ratio(path, w) for w in WEIGHTS])
    r = r[3:]  # 400 and up: below it the line is flat by design
    return clip(10 - 40 * np.abs(np.diff(r, 2)).max() / r.mean())


def width_step(path):
    """Advances of the kink glyphs across weight: a smooth family has small second differences."""
    cmap = TTFont(path).getBestCmap()
    worst = []
    adv = {g: [quality.instance(path, w)['hmtx'][cmap[ord(g)]][0] for w in WEIGHTS] for g in KINK}
    for g, a in adv.items():
        a = np.array(a, float)
        d1 = np.diff(a)
        # the step may fall or rise but must not reverse: flat then jump is the kink
        worst.append(np.abs(np.diff(d1)).max() / a.mean())
    return clip(10 - 90 * max(worst)), dict(zip(KINK, np.round(worst, 4)))


def rhythm(path):
    a = rhythm_flat(path)
    b, _ = width_step(path)
    return (a + b) / 2


def _stem(path, w, opsz=14):
    m = quality.raster(path, 'l', w, opsz)
    row = m[int(m.baseline - m.x_height / 2)]
    return row.sum()


def weight(path):
    s = np.array([_stem(path, w) for w in WEIGHTS], float)
    d = np.diff(s)
    cv = d.std() / d.mean()
    return clip(10 - 12 * cv - (10 if (d <= 0).any() else 0))


def colour(path):
    dens = []
    for w in WEIGHTS:
        a = _ink(path, 'nnoenaenoun', 64, w)
        rows = np.where(a.any(1))[0]
        dens.append(a[rows.min():rows.max() + 1].mean())
    d = np.diff(dens)
    cv = d.std() / d.mean()
    return clip(10 - 10 * cv - (10 if (d <= 0).any() else 0))


def _cell(path, ch, size, opsz=14, wght=400):
    a = _ink(path, ch, size, wght, opsz, w=size * 2, h=size * 2)
    rows, cols = np.where(a > 0.05)
    out = np.zeros((size * 2, size * 2))
    if len(rows):
        sub = a[rows.min():rows.max() + 1, cols.min():cols.max() + 1]
        out[:sub.shape[0], :sub.shape[1]] = sub
    return out


def small(path):
    worst = 1.0
    for size in (11, 12):
        for wght in (400, 700, 900):
            cells = {c: _cell(path, c, size, 8 if size < 12 else 14, wght) for c in 'Il1O0'}
            for grp in ('Il1', 'O0'):
                for i, x in enumerate(grp):
                    for y in grp[i + 1:]:
                        d = np.abs(cells[x] - cells[y]).sum() / max(cells[x].sum(), cells[y].sum())
                        worst = min(worst, d)
    return clip(10 * worst / 0.35)  # 0.35 of the ink differs: clearly apart at this size


def shape(path, italic):
    fails = [] if FAST else (quality.check_all(UPRIGHT, ITALIC) if not hasattr(shape, '_f') else shape._f)
    shape._f = fails
    mine = [f for f in fails if f.startswith('italic ') == italic]
    pen = 0.5 * len(mine)
    ratios = []
    ref = quality.REF['counter_italic' if italic else 'counter']
    for g in ('o', 'e', 'a', 'g', 'b', 'd', 'p', 'q', 'zero', 'six', 'eight', 'nine'):
        r = ref.get((g, 900))
        if r:
            m = quality.raster(path, g, 900)
            ratios.append(quality.counter_area(m, m.x_height) / r)
    short = sum(max(0, 1.2 - r) for r in ratios)  # Black counters should sit at or above 1.2x Inter's
    return clip(10 - pen - 4 * short / max(1, len(ratios)) * 3), ratios


def opsz(path):
    s8, s14, s48 = (_stem(path, 400, o) for o in (8, 14, 48))
    ok = s8 > s14 > s48
    spread = (s8 - s48) / s14
    return clip(10 * min(1, spread / 0.12) - (0 if ok else 5))


def score(path, italic):
    sh, _ = shape(path, italic)
    parts = dict(rhythm=rhythm(path), weight=weight(path), shape=sh, colour=colour(path), small=small(path), opsz=opsz(path))
    parts['score'] = float(np.mean(list(parts.values())))
    return parts


if __name__ == '__main__':
    detail = '--detail' in sys.argv
    for label, path, it in (('upright', UPRIGHT, False), ('italic ', ITALIC, True)):
        p = score(path, it)
        print(label, 'score %.2f ' % p.pop('score') + ' '.join(f'{k} {v:.1f}' for k, v in p.items()))
        if detail:
            print('  width kinks', width_step(path)[1], 'rhythm', round(rhythm_flat(path), 2))
            print('  counters', np.round(shape(path, it)[1], 2))

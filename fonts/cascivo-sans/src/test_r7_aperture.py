"""Round 7, apertures: Black's c e a (upright) and C (upright and italic) mouths against Inter's at the same weight (opsz 14).

The mouth is the least white between a letter's two open ends: its ink on the open side of the letter's middle (right for c e C,
left for the a's top arc over its bowl) falls into two pieces, and the mouth is the shortest distance between them. Italics are
sheared upright first (tan 10 deg about mid x-height). Read per x-height, so the two fonts' proportions compare."""

import os
import unittest

import numpy as np
from fontTools.ttLib import TTFont
from scipy import ndimage as ndi

import quality as Q
from test_font import VF, VFI

INTER = os.environ.get('INTER_REF', '/tmp/refs/Inter.woff2')
INTER_IT = os.environ.get('INTER_ITALIC_REF', '/tmp/refs/InterItalic.woff2')


def _upright_mask(path, ch, wght, italic):
    """(ink mask on a 1000-unit em, x-height): the italic's rows shifted back by its slant."""
    m = Q.raster(path, TTFont(path).getBestCmap()[ord(ch)], wght, 14, scale=Q.ref_scale(path))
    a = np.asarray(m)
    if not italic:
        return a, m.x_height
    mid = m.baseline - m.x_height / 2
    out = np.zeros((a.shape[0], a.shape[1] + 200), bool)
    for r in range(a.shape[0]):
        s = int(round((r - mid) * Q.ITALIC_TAN)) + 100
        out[r, s : s + a.shape[1]] = a[r]
    return out, m.x_height


def mouth(path, ch, wght, side='right', italic=False):
    """The least white between the two ink pieces on `side` of the letter's middle, per 1000 of the x-height."""
    a, xh = _upright_mask(path, ch, wght, italic)
    xs = np.nonzero(a)[1]
    cut = int((xs.min() + xs.max()) / 2)
    half = a.copy()
    if side == 'right':
        half[:, :cut] = False
    else:
        half[:, cut:] = False
    labels, n = ndi.label(half)
    sizes = ndi.sum(half, labels, range(1, n + 1))
    big = np.argsort(sizes)[::-1][:2] + 1
    if len(big) < 2:
        return 0.0
    return float(ndi.distance_transform_edt(labels != big[0])[labels == big[1]].min()) / xh * 1000


# (character, open side, italic): Black's mouths that measured under Inter's. Before round 7 (per 1000 of the x-height, Inter in
# brackets): c 131 (169), e 89 (97), a 59 (84), C 309 (363), italic C 277 (363); after: 176, 98, 85, 366, 369.
OPENED = (('c', 'right', False), ('e', 'right', False), ('a', 'left', False), ('C', 'right', False), ('C', 'right', True))
# Regular's own mouths (per 1000 of the x-height), which the round leaves where they were
REGULAR = {('c', False): 403, ('e', False): 199, ('a', False): 229, ('C', False): 422, ('C', True): 428}


class Aperture(unittest.TestCase):
    def test_black_mouths_open_like_inter(self):
        for ch, side, italic in OPENED:
            own = mouth(VFI if italic else VF, ch, 900, side, italic)
            ref = mouth(INTER_IT if italic else INTER, ch, 900, side, italic)
            with self.subTest(glyph=ch, italic=italic):
                self.assertGreaterEqual(own, 0.97 * ref, f'{ch} at 900: mouth {own:.0f} per 1000 x-height, Inter {ref:.0f}')

    def test_regular_mouths_do_not_move(self):
        for (ch, italic), was in REGULAR.items():
            side = dict((c, s) for c, s, _ in OPENED)[ch]
            with self.subTest(glyph=ch, italic=italic):
                self.assertAlmostEqual(mouth(VFI if italic else VF, ch, 400, side, italic), was, delta=3)


if __name__ == '__main__':
    unittest.main()

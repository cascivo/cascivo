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
import math
import os
import unicodedata

from params import MID_WGHT, WGHT_MAP, P  # noqa: E402
from composites import ALIAS, GREEK_ACCENTED, GREEK_POLY, accented_chars, glyph_name, is_cap, script_glyph
from geom import seg_point

BAND = 10
# Black's sidebearing was ~20 units before round 4 (params.HEAVY_TIGHTEN; 44 now), so 0.55 S would keep pairs 11 units apart, and a band
# profile reads +-2: the closest point never gets nearer than this, whatever S is.
KEEP_CLEAR = 16
MIN_KERN = 10  # units; smaller corrections are invisible at text sizes
DEPTH = 1.04  # depth cap, in stem sidebearings (fitted)
W_GAP, W_CLOSEST, W_LEAN = 0.605, 0.077, -0.525  # fitted, see module docstring
REGULAR_S = P(400, 14).S  # Regular's stem sidebearing unit: the reference of STRONG's reach
# The pairs the fitted measure undershoots most, because it counts a hole only down to DEPTH sidebearings: LT, To, Wa, the V and Y
# pairs with the same round letters, and A beside V, W and Y, with the letters that share their sides (Inter kerns LT -96, To -78, Wa -51 at Regular; this measure gave -59 / -54 / -30). The room
# under a T's bar or beside an L is the same size at every weight, only the sidebearings around it shrink, so for these pairs the hole
# counts down to `reach` Regular sidebearings at every weight (and Black's total is not boosted again: Inter's LT, To and Wa hold
# -96 .. -86, -78, -51 .. -63 from Thin to Black). Still measured from the outlines, still floored by the closest point. The values
# sit at 0.8-1.0x Inter's at Regular and mostly at the other weights (test_key_pairs_kern_like_inter lists the exceptions); italic Thin Wa stays short of 0.8x, as the outline measure only
# reads -17 there against Inter's -51 (the pair's facing sides lean together, and the Thin a is open).
# (left glyphs, right glyphs, reach at Regular, reach added by Black, gain on a closing value, limit). One rule for the limit: a class
# never closes harder than the hardest value Inter has for it at any weight (read from Inter 4.001 in the audit: LT -96, To -78,
# W+a -63, V+a -69, Y+round -138, A beside V/W/Y -88); those numbers are hand-set here, they are not derived. Without it the closest-point
# floor is the only brake at Black, and W beside a round letter read -90 there (Inter -49) with the two nearly touching. Y's reach grows
# with the weight because Inter's Y kerns harder as it gets heavier (-77 at Regular, -138 at Black); the others' stays put. (1.1: Black's
# looser sidebearings (round 1's counter trim) left Yo at 110 against the 0.8 x 138 floor at 1.0; 1.3 and the A pairs' 0.8 after round 2's, which
# left Yo at 108-110 and the italic's Bold AW at 56 against 57.6; the A pairs' 1.4 after round 4's looser Bold, whose italic AW read 54.)
STRONG_CLASSES = [
    (['L', 'Lslash'], ['T'], 1.8, 0.0, 1.0, 96),
    (['T'], ['o', 'c', 'e', 'd', 'q', 'g', 'a', 's', 'ae', 'oe'], 1.4, 0.0, 1.0, 78),
    (['W'], ['a', 'c', 'e', 'o', 'd', 'ae', 'oe'], 2.4, 0.0, 1.1, 63),
    (['V'], ['a', 'c', 'e', 'o', 'd', 'q', 'g', 'ae', 'oe'], 1.4, 0.0, 1.0, 69),
    (['Y'], ['a', 'c', 'e', 'o', 'd', 'q', 'g', 'ae', 'oe'], 1.4, 1.3, 1.0, 138),
    (['A'], ['V', 'W', 'Y'], 1.2, 1.4, 1.0, 88),
    (['V', 'W', 'Y'], ['A'], 1.2, 1.4, 1.0, 88),
]
# Thin's V beside a round letter: a hairline diagonal leaves the widest white of any weight beside it, and the hole was counted no
# deeper than Regular's, so Vo, Ve, Vc read 0.6 to 0.75x Inter's. The hole counts THIN_REACH Regular sidebearings deeper at Thin, fading
# to none at Regular (whose values do not move): 0.8 to 1.08x Inter's now. W beside a round letter and A beside W do not answer to it
# (tried with 4 and 1.5, and with a lower closest-point floor): their white is spread over every band, which the measure reads as
# spacing, not as a hole. They stay in test_font.KERNING_SHORT.
THIN_REACH = {('V', b): 2.0 for b in ['c', 'e', 'o', 'q', 'g', 'oe']}
STRONG = {(a, b): (reach, more, gain, limit) for lefts, rights, reach, more, gain, limit in STRONG_CLASSES for a in lefts for b in rights}

# Round 4: the pairs the brief names, fitted to Inter's white, computed from the outlines of every master. A pair's white is the gap between the two
# shapes' profiles in 5-unit rows, each row counted down to WHITE_DEPTH beyond the closest one, per em (test_font.pair_white_profile reads the same);
# the pair must read WHITE_BAND (0.85-1.1x) of Inter's at the same weight, and its closest row WHITE_LEAST (0.75x). Kerning units do not carry that
# from Inter to this font (the sidebearings differ letter by letter: Thin W V Y and A pairs read 0.72-0.85x of Inter's white, Black LY 7, 7. 1.1-1.3x,
# y. y, r. F. 0.62-0.83x, Kv Ky at Regular 0.80-0.83x, T- 1.4-1.8x at Thin, f) 1.26x at Black), so each pair's value on a master is moved the least that
# brings the weights the table lists inside a narrower band (AIM_BAND, AIM_LEAST: margin for the interpolation and the rounding). Only the
# reference is hand-set, like STRONG's limits: Inter 4.001's mean and closest white of the pair at the weight, {pair: {wght: (mean, least)}}. A
# redrawn T, V, W, Y or f changes the white and the value follows; nothing here is a unit count. Thin (100) carries the weights up to 400, Black (900) the
# ones above, Regular (400) its own; between masters the white interpolates linearly in the design space (200 is 2/3 Thin; above 400 the avar map),
# and Bold, whose outlines are its own, refits 500-800 against Regular and Black (_fit_white_bold).
# Round 4, merge 2: ff fl at 500-700, ft at 700 and cf at 700 (upright), after the f was redrawn; ff at 400 too, which OWN_CLOSING_PAIRS closes
# (1.04x Inter's: its -32 stays). ft read 1.15-1.16x Inter's white at 500-700. Inter lets ft's crossbars nearly meet (closest row 2-10 units), this
# f keeps them 0.3x the nn gap apart (test_font.test_heavy_f_leaves_no_hole), so ft closes at Bold only as far as AIM_OWN's 1.09x: at the 1.06x aim
# they came to 0.28x, and with 500-600 listed too (Regular's -33 holds them; Bold carries 600 two-thirds, 500 one-third) to 0.19x. Not fi: its closest
# row is the hook over the i's dot (0.56-0.71x Inter's at 500-700: this f's hook is its right edge, Inter's crossbar reaches past it), and
# opening it to the 0.75x floor (+22 at Bold) set the stems 1.23x Inter's white apart (test_ff_and_its_pairs_fit_like_inter: under 1.2x).
WHITE_DEPTH, WHITE_BAND, WHITE_LEAST = 400, (0.85, 1.1), 0.75
AIM_BAND, AIM_LEAST = (0.88, 1.06), 0.78
AIM_OWN = {('f', 't'): (0.88, 1.09)}
WHITE_REF = {
    'upright': {
        'Wa': {100: (275, 131), 200: (259, 127)},
        'We': {100: (216, 159), 200: (209, 151)},
        'Wo': {100: (216, 159), 200: (209, 151)},
        'Wc': {100: (217, 158), 200: (209, 151)},
        'Wq': {100: (211, 157), 200: (204, 149)},
        'Wg': {100: (213, 157), 200: (208, 149)},
        'Va': {100: (316, 157), 200: (299, 152)},
        'Ve': {100: (257, 190), 200: (249, 182)},
        'Vo': {100: (257, 190), 200: (249, 182)},
        'Vc': {100: (257, 189), 200: (249, 182)},
        'Vq': {100: (252, 187), 200: (245, 179)},
        'Vg': {100: (254, 187), 200: (248, 179)},
        'Ya': {100: (375, 228), 200: (355, 218)},
        'Ye': {100: (310, 266), 200: (299, 251)},
        'Yo': {100: (310, 266), 200: (299, 251)},
        'Yc': {100: (311, 266), 200: (299, 250)},
        'Yq': {100: (305, 259), 200: (294, 244)},
        'Yg': {100: (307, 259), 200: (298, 244)},
        'Ta': {100: (390, 277), 200: (370, 267)},
        'Te': {100: (326, 282), 200: (315, 271)},
        'To': {100: (326, 282), 200: (315, 271)},
        'Tc': {100: (326, 282), 200: (315, 271)},
        'Tq': {100: (321, 282), 200: (311, 271)},
        'Tg': {100: (323, 282), 200: (315, 271)},
        'WA': {100: (246, 213), 200: (240, 207)},
        'VA': {100: (268, 267), 200: (260, 260)},
        'YA': {100: (330, 263), 200: (319, 255)},
        'TA': {100: (372, 244), 200: (355, 235)},
        'AV': {100: (268, 268), 200: (262, 261)},
        'AW': {100: (247, 213), 200: (240, 206)},
        'AT': {100: (372, 244), 200: (356, 235)},
        'AY': {100: (331, 263), 200: (320, 257)},
        'LT': {100: (606, 263), 200: (570, 252)},
        'LY': {100: (571, 294), 200: (555, 298), 800: (375, 217), 900: (329, 189)},
        'LV': {100: (514, 291), 200: (488, 275)},
        'Ty': {100: (387, 283), 200: (372, 269)},
        'Tr': {100: (339, 337), 200: (326, 323)},
        'T-': {100: (307, 307), 200: (296, 296)},
        '7,': {800: (266, 245), 900: (249, 227)},
        '7.': {800: (259, 234), 900: (245, 218)},
        'y.': {800: (254, 227), 900: (251, 223)},
        'y,': {800: (284, 237), 900: (285, 231)},
        'r.': {800: (231, 215), 900: (228, 211)},
        'r,': {800: (223, 215), 900: (215, 207)},
        'F.': {800: (423, 407), 900: (410, 392)},
        'F,': {800: (409, 401), 900: (390, 382)},
        'P,': {800: (475, 467), 900: (463, 455)},
        'f)': {800: (204, 46), 900: (185, 37)},
        'f]': {800: (221, 53), 900: (199, 46)},
        'f}': {800: (242, 53), 900: (224, 46)},
        'ff': {400: (208, 10), 500: (194, 6), 600: (179, 3), 700: (166, 0)},
        'fl': {500: (202, 91), 600: (188, 84), 700: (174, 76)},
        'ft': {700: (157, 2)},
        'cf': {700: (248, 69)},
        'Kv': {400: (286, 185)},
        'Ky': {400: (285, 185)},
        'Kw': {400: (249, 164)},
    },
    'italic': {
        'Wa': {100: (211, 157), 200: (205, 149)},
        'We': {100: (216, 156), 200: (209, 149)},
        'Wo': {100: (216, 158), 200: (209, 151)},
        'Wc': {100: (217, 158), 200: (209, 151)},
        'Wq': {100: (211, 157), 200: (204, 149)},
        'Wg': {100: (213, 157), 200: (208, 149)},
        'Va': {100: (252, 187), 200: (245, 180)},
        'Ve': {100: (257, 187), 200: (249, 180)},
        'Vo': {100: (257, 189), 200: (249, 181)},
        'Vc': {100: (257, 189), 200: (250, 181)},
        'Vq': {100: (252, 187), 200: (245, 179)},
        'Vg': {100: (254, 186), 200: (248, 179)},
        'Ya': {100: (306, 259), 200: (295, 245)},
        'Ye': {100: (310, 262), 200: (299, 247)},
        'Yo': {100: (310, 265), 200: (299, 249)},
        'Yc': {100: (311, 265), 200: (299, 249)},
        'Yq': {100: (305, 257), 200: (294, 243)},
        'Yg': {100: (308, 257), 200: (298, 243)},
        'Ta': {100: (321, 282), 200: (311, 271)},
        'Te': {100: (326, 282), 200: (316, 271)},
        'To': {100: (326, 282), 200: (315, 270)},
        'Tc': {100: (327, 282), 200: (315, 271)},
        'Tq': {100: (321, 282), 200: (311, 271)},
        'Tg': {100: (323, 282), 200: (315, 271)},
        'WA': {100: (246, 213), 200: (239, 206)},
        'VA': {100: (267, 267), 200: (260, 260)},
        'YA': {100: (329, 263), 200: (318, 255)},
        'TA': {100: (371, 244), 200: (355, 234)},
        'AV': {100: (268, 268), 200: (262, 262)},
        'AW': {100: (247, 214), 200: (240, 206)},
        'AT': {100: (372, 245), 200: (356, 236)},
        'AY': {100: (331, 263), 200: (320, 257)},
        'LT': {100: (606, 263), 200: (570, 252)},
        'LY': {100: (571, 293), 200: (555, 298), 800: (375, 217), 900: (329, 189)},
        'LV': {100: (513, 291), 200: (488, 274)},
        'Ty': {100: (388, 284), 200: (373, 269)},
        'Tr': {100: (339, 337), 200: (326, 323)},
        'T-': {100: (307, 307), 200: (296, 296)},
        '7,': {800: (265, 244), 900: (249, 227)},
        '7.': {800: (259, 229), 900: (245, 213)},
        'y.': {800: (253, 223), 900: (251, 218)},
        'y,': {800: (284, 237), 900: (284, 230)},
        'r.': {800: (231, 215), 900: (228, 211)},
        'r,': {800: (223, 215), 900: (215, 207)},
        'F.': {800: (423, 407), 900: (409, 392)},
        'F,': {800: (409, 401), 900: (390, 382)},
        'P,': {800: (475, 467), 900: (462, 454)},
        'f)': {800: (208, 47), 900: (190, 38)},
        'f]': {800: (224, 59), 900: (204, 53)},
        'f}': {800: (241, 58), 900: (225, 53)},
        'Kv': {400: (286, 184)},
        'Ky': {400: (286, 184)},
        'Kw': {400: (250, 165)},
    },
}
# Black's proportional 0 then 1 left 1.35x the HH gap upright and 1.46x italic (Inter 0.89x): it closes by what its closest white has beyond FIT_HH x
# the HH gap, at Black only (Thin and Regular keep their figure spacing; the pair is no reference list's).
# Pairs no list kerned before WHITE_REF named them (fl cf, round 4, merge 2): they start from no kerning on every master, so only the fit moves them,
# and Thin and Regular keep theirs (none).
WHITE_ONLY = {('f', 'l'), ('c', 'f')}
# 0 then 2 the same (round 4, merge 2: 1.18x the HH gap at Black upright; the italic's 1.02x stays unkerned).
FIT_HH = {('zero.pnum', 'one.pnum'): 1.04, ('zero.pnum', 'two.pnum'): 1.04}
FIT_HEAVY_ONLY = set(FIT_HH)


CHAR_GLYPH = {
    '.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon', "'": 'quotesingle', '"': 'quotedbl',
    '\u2018': 'quoteleft', '\u2019': 'quoteright', '\u201c': 'quotedblleft', '\u201d': 'quotedblright',
    '-': 'hyphen', '\u2013': 'endash', '\u2014': 'emdash', '(': 'parenleft', ')': 'parenright',
    '[': 'bracketleft', ']': 'bracketright', '{': 'braceleft', '}': 'braceright', '/': 'slash',
    '?': 'question', '!': 'exclam', '\u00ab': 'guillemotleft', '\u00bb': 'guillemotright',
    '\u2039': 'guilsinglleft', '\u203a': 'guilsinglright', '&': 'ampersand', '*': 'asterisk', '@': 'at',
    '\u0141': 'Lslash', '\u00e6': 'ae', '\u0153': 'oe',  # the glyph names of Ł æ œ (the candidates list them as characters)
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
# and into the descenders of g, j and q (round 5): Black's qf kept 9-15 units of white and jf 15-20, a touch at display sizes. The
# upright f does not descend: its pairs measure open and are not kept.
OWN_SHAPE_PAIRS.update({(a, 'f'): 1 for a in 'gjq'})
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
# Round pairs at the Display and Caption Black corners: Black's sidebearing (HEAVY_TIGHTEN) plus Display's opening leave OO, oo,
# ss, SS and rv 4-14 units apart and the italic GO overlapping (a855b5e0: 20-63). They open there as far as KEEP_CLEAR asks.
ROUND_PAIRS = {('O', 'O'), ('o', 'o'), ('s', 's'), ('S', 'S'), ('r', 'v'), ('G', 'O')}
OWN_SHAPE_PAIRS.update({k: 1 for k in ROUND_PAIRS})
OWN_SHAPE_PAIRS.update({(a, b): 1 for i in I_WIDE for a, b in [(t, i) for t in TALL] + [(i, t) for t in TALL]})

# The italic's slanted bars and feet reach under the next capital: these closed at Black once its sidebearing
# tightened (params.HEAVY_TIGHTEN), and Greek's Δ Ω feet and Cyrillic's italic bars the same.
OWN_SHAPE_PAIRS.update({(a, b): 1 for a, b in [('z', 'A'), ('z', 'X'), ('L', 'X'), ('Z', 'X')]})
HEAVY_ONLY = {(script_glyph(a), script_glyph(b)) for a, b in ['Δλ', 'ΔΧ', 'Ωλ', 'ιλ', 'Γΰ', 'Τΰ', 'ΰΤ', 'ΐΐ']} | {('z', 'A'), ('z', 'X'), ('L', 'X'), ('Z', 'X')}
OWN_SHAPE_PAIRS.update({k: 1 for k in HEAVY_ONLY})  # opened at the heavy masters only: Regular's spacing is unchanged

TRACED_NEIGHBOURS = ['period', 'comma', 'ellipsis', 'colon', 'semicolon', 'exclam', 'question', 'hyphen', 'endash', 'emdash', 'slash',
                      'parenleft', 'parenright', 'bracketleft', 'bracketright', 'guillemotleft', 'guillemotright',
                      'quoteleft', 'quoteright', 'quotedblleft', 'quotedblright', 'quotedblbase', 'quotesingle', 'quotedbl'] + [f + '.pnum' for f in FIGS]

# Closing pairs no reference list carries, kept when the measurement agrees: tt, whose two
# crossbars Inter and Plex let nearly meet (ours sat 1.3x their white at Bold); f before a closing
# bracket, whose white under the crossbar opened into a hole at Black once its sidebearing did (round 4): heavy masters only, as
# HEAVY_ONLY, so Regular's f) is unchanged.
# And ff (round 4, cycle 2), as tt: Inter lets its crossbars nearly meet (ff -39 at 400, -41 at 600). With the white beside each f's
# crossbar held for the letters before and after it, the white between the two stems read 1.26x Inter's at 400 and 1.41x at 600,
# a hole in "off"; kerned, 1.1-1.2x. Upright only (UPRIGHT_ONLY): the italic's crossbars, closer already, came within 0.28x the nn gap.
F_BRACKETS = {('f', 'parenright'), ('f', 'bracketright'), ('f', 'braceright')}
UPRIGHT_ONLY = {('f', 'f')}
OWN_CLOSING_PAIRS = {('t', 't'): -1, ('f', 'f'): -1, **{k: -1 for k in F_BRACKETS}}


def _glyph(ch):
    if ch in CHAR_GLYPH:
        return CHAR_GLYPH[ch]
    if 0x370 <= ord(ch) < 0x530:  # А and Α are kerned as A: they are A, and share A's classes
        return script_glyph(ch)
    return ch


def white_ref(italic):
    """{(first glyph, second glyph): {wght: (mean, least)}} of WHITE_REF for the upright or the italic."""
    return {(_glyph(p[0]), _glyph(p[1])): by for p, by in WHITE_REF['italic' if italic else 'upright'].items()}


def _candidates():
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, 'kern_candidates.json'), encoding='utf-8') as fh:
        return {(_glyph(k[0]), _glyph(k[1])): v for k, v in json.load(fh).items()}


def _members(base, glyphs, acc):
    """A base glyph plus its accented forms: they share a side, so they share kerning."""
    return [g for g in [base] + acc.get(base, []) if g in glyphs]


def _points(o, name, ox=0.0, oy=0.0, a=1.0, fine=False):
    pts = []
    for c in o.contours.get(name, []):
        for s in c:
            if s[0] == 'L':
                (x0, y0), (x1, y1) = s[1], s[2]
                n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) / (1 if fine else 5)))  # fine: a slanted edge read every unit, so a row's edge is exact to one unit
                pts += [(x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n) for j in range(n)]
            else:
                # `fine`: a heavy bowl is one long segment, and 24 samples leave its extreme up to 4 units short
                n = max(24, int(sum(abs(c[i] - d[i]) for c, d in zip(s[1:], s[2:]) for i in (0, 1)) / 2)) if fine else 24
                pts += [seg_point(s, j / n) for j in range(n)]
    out = [(ox + a * x, oy + a * y) for x, y in pts]
    for g, cx, cy, ca in o.comps.get(name, []):
        out += _points(o, g, ox + a * cx, oy + a * cy, a * ca, fine)
    return out


def _profile(o, name, fine=False, band=BAND):
    lo, hi = {}, {}
    for x, y in _points(o, name, fine=fine):
        b = int(y // band)
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


QUANT = 8  # units: letters whose corrections differ by less share a class
MIN_FIX = 12  # units: a smaller correction is inside the floor's own margin (the floor is 16 units, a touch is 0)
_FIX = None  # (strong pairs' accented second letters in classes of equal correction, the first letters they are corrected for): see _strong_fix


def _cached_profile(o, name):
    cache = o.__dict__.setdefault('_profiles', {})
    if name not in cache:
        cache[name] = _profile(o, name)
    return cache[name]


def _room(o, a, b):
    """The kerning measure()'s floor sets for a pair: it may not close further than this (positive: it must open by that much)."""
    _, hi = _cached_profile(o, a)
    lo, _ = _cached_profile(o, b)
    shared = set(hi) & set(lo)
    if not shared:
        return -999
    return max(0.55 * o.p.S, KEEP_CLEAR) - min((o.adv[a] - hi[x]) + lo[x] for x in shared)


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
    reach, more, gain, limit = STRONG.get((left_glyph, right_glyph), (None, 0.0, 1.0, 140))
    depth = DEPTH * p.S if reach is None else (reach + more * p.heavy) * REGULAR_S
    if reach is not None:
        depth += THIN_REACH.get((left_glyph, right_glyph), 0.0) * max(0.0, (400 - p.wght) / 300) * REGULAR_S
    eff = sum(min(g, ref + depth) for g in gaps) / len(gaps)
    sa, sb = _slope(hi, bands), _slope(lo, bands)
    lean = min(abs(sa), abs(sb)) if sa * sb > 0 else 0.0
    k = W_GAP * (ref - eff) + W_CLOSEST * (ref - min(gaps)) + W_LEAN * lean * p.S
    if k < 0:
        k = max(k * gain, -limit)
    floor = max(0.55 * p.S, KEEP_CLEAR) - min(gaps)  # never let the closest point get nearer than this
    # When the floor is about to decide, read the closest point off a finer outline. The cause is _points sampling a curve segment
    # 24 times, which under-reads a heavy bowl's extreme by up to 4 units (Dï at Display Black sat 4 short of KEEP_CLEAR). It is
    # restricted to the own-shape pairs (wide i, round pairs, bars), at heavy masters, because the same fix for every pair cost 36 bytes of Latin[wght]; solving
    # each curve for its extreme instead of sampling it is the follow-up.
    if floor > k - 6 and p.heavy > 0.5 and (left_glyph in I_WIDE or right_glyph in I_WIDE or (left_glyph, right_glyph) in OWN_SHAPE_PAIRS):
        _, hi_f = _profile(o, left_glyph, True)
        lo_f, _ = _profile(o, right_glyph, True)
        floor = max(0.55 * p.S, KEEP_CLEAR) - min((adv - hi_f[b]) + lo_f[b] for b in bands if b in hi_f and b in lo_f)
    if p.heavy > 0.5 and (left_glyph, right_glyph) in OWN_SHAPE_PAIRS:
        # a slanted pair (an italic У beside ћ) clear in 10-unit bands can still touch in 25-unit ones. This mirrors test_shaped_pairs_keep_clear's
        # coarse band reading (25-unit bands), so a pair that test would call touching gets the 2 units the fine reading leaves out.
        _, hi_c = _profile(o, left_glyph, True, 25)
        lo_c, _ = _profile(o, right_glyph, True, 25)
        coarse = [(adv - hi_c[b]) + lo_c[b] for b in set(hi_c) & set(lo_c)]
        if coarse:
            floor = max(floor, 2 - min(coarse))
    k = max(k, floor)
    return int(round(max(-140, min(most, k))))


# Pairs measured for clearance alone: the fitted measure would open every dash beside a round
# Georgian letter by its full 40 units, where only შ's and წ's curls come near one.
CLEAR_ONLY = set()


def clearance(o, left_glyph, right_glyph):
    """Just enough opening to keep the closest point the measure's floor apart (0.55 S)."""
    _, hi = _profile(o, left_glyph)
    lo, _ = _profile(o, right_glyph)
    bands = sorted(set(hi) & set(lo))
    if not bands:
        return 0
    closest = min(o.adv[left_glyph] - hi[b] + lo[b] for b in bands)
    return max(0, int(round(max(0.55 * o.p.S, KEEP_CLEAR) - closest)))


def _need(o, a, b, before=False):
    """`before`: with the caps the opening had before Black's sidebearing tightened (the reference for Display and Caption)."""
    if (a, b) in CLEAR_ONLY:
        return clearance(o, a, b)
    # an own-shape pair may need more than the fitted 40 once Black's sidebearing is ~20 (Tħ, Тћ at Display Black)
    wide = a in I_WIDE or b in I_WIDE
    if before or not o.p.heavy:  # Regular and lighter keep the fitted caps, so their kerning is what it was
        return measure(o, a, b, 250 if wide else 40)
    return measure(o, a, b, 400 if wide else 90 if (a, b) in OWN_SHAPE_PAIRS else 40)


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
    cands.update({k: v for k, v in OWN_CLOSING_PAIRS.items() if not (o.p.italic and k in UPRIGHT_ONLY)})
    cands.update({k: -1 for k in list(white_ref(o.p.italic)) + list(FIT_HH) if k[0] in glyphs and k[1] in glyphs})
    # Georgian and Armenian against punctuation and figures: neither Noto nor DejaVu kerns these,
    # but at Black შ's and წ's curls reach a dash's height (–შ touched at Display Black italic).
    # Opening only. (։ and ֊ are the colon and hyphen themselves.)
    georgian = [g for g in glyphs if g.startswith(('uni10D', 'uni10E', 'uni10F', 'uni1C9', 'uni1CA', 'uni1CB', 'uni053', 'uni054', 'uni055', 'uni056', 'uni057', 'uni058')) and g not in ('uni0589', 'uni058A')]
    if georgian:
        marks = [g for g in TRACED_NEIGHBOURS if g in glyphs]
        OWN_SHAPE_PAIRS.update({p: 1 for g in georgian for m in marks for p in ((g, m), (m, g))})
        CLEAR_ONLY.update(p for g in georgian for m in marks for p in ((g, m), (m, g)))
        cands.update({p: 1 for g in georgian for m in marks for p in ((g, m), (m, g))})
    # a wide i opens as far as it must: ïï needs about 190 at Black (Inter's is 166/1000)
    pairs = {(a, b): (_need(o, a, b), sign) for (a, b), sign in cands.items()}
    # an own-shape pair only ever opens, by however much each master measures it needs
    pairs.update({k: (max(0, pairs[k][0]), 1) for k in OWN_SHAPE_PAIRS if k in pairs})
    return acc, glyphs, pairs


_SELECTED = None
_HEAVY_KEYS = set()  # HEAVY_ONLY moved to the classes' representatives
_REGULAR = None  # values measured on the Regular master
_GROUPS = None  # (right-side rep, left-side rep) of each Cyrillic and Greek glyph


def reset():
    """Each font (upright, italic) measures and selects its own pairs."""
    global _SELECTED, _REGULAR, _BLACK, _GROUPS, _FIX, _DIAG
    _SELECTED = _REGULAR = _BLACK = _GROUPS = _FIX = _DIAG = None
    _WHITE0.clear()
    _FIT_O.clear()


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


_REF_BLACK = None
_REF_CORNERS = {}
_EXCESS = {}  # optical-size master name -> {pair: opening it carries over Regular}


def set_reference(black, corners):
    """Black and its corners drawn with the sidebearings Black had before HEAVY_TIGHTEN."""
    global _REF_BLACK
    _REF_BLACK = black
    _REF_CORNERS.clear()
    _REF_CORNERS.update(corners)
    _EXCESS.clear()


_WHITE0 = {}  # (pair, wght) -> (mean white, least white, value) of a pair on the master of that weight, read when it was fitted


def _white0(o, a, b):
    """(mean, least) of the white between a and b's profiles with no kerning, per em: what pair_white_profile reads, on the master's own outline."""
    _, hi = _cached_fine(o, a)
    lo, _ = _cached_fine(o, b)
    gaps = [o.adv[a] - hi[x] + lo[x] for x in set(hi) & set(lo)]
    least = min(gaps)
    return sum(min(g, least + WHITE_DEPTH) for g in gaps) / len(gaps), least


def _design(w):
    """The design coordinate of a user weight (the avar map): 800 sits halfway between Bold (700) and Black, not 4/5 of the way to Black."""
    for (u0, d0), (u1, d1) in zip(WGHT_MAP, WGHT_MAP[1:]):
        if u0 <= w <= u1:
            return d0 + (d1 - d0) * (w - u0) / (u1 - u0)
    raise ValueError(w)


def _clamp_white(refs, value, mean0, least0, share, aim=AIM_BAND):
    """The value nearest `value` that puts the white inside AIM_BAND of Inter's at the weights `share` reads, and its closest row over AIM_LEAST.
    share(w) is None for a weight this master does not carry, else (this master's share of it, the other master's mean and least, kerned)."""
    def bounds(band, least_aim):
        lo, hi = -math.inf, math.inf
        for w, (i_mean, i_least) in refs.items():
            s = share(w)
            if s is None:
                continue
            f, base_mean, base_least = s
            lo = max(lo, (band[0] * i_mean - base_mean) / f - mean0, (least_aim * i_least - base_least) / f - least0)
            hi = min(hi, (band[1] * i_mean - base_mean) / f - mean0)
        return lo, hi

    aim_lo, aim_hi = lo, hi = bounds(aim, AIM_LEAST)
    if lo > hi:  # a pair whose closest row and whose mean pull apart at two weights: the margins go before the band does
        lo, hi = bounds(WHITE_BAND, WHITE_LEAST + 0.01)
    if lo > hi:  # and when they still do, the shapes decide (f) at Black: its hook is the nearest ink and the hole under the bar stays): the closest row wins
        lo = hi = aim_lo
    if lo > -math.inf or hi < math.inf:
        return int(round(min(max(value, lo), hi)))
    return value


def _fit_white(o, vals, loc):
    """Move each WHITE_REF pair's value on this master (Thin, Regular or Black) the least that puts the white at the weights it carries inside
    AIM_BAND of Inter's, and its closest row over AIM_LEAST. The weights between a master and Regular read an interpolation of the two (Black's
    estimate: Bold, a master of its own outlines, refits the weights from 500 to 800 in _fit_white_bold)."""
    w0 = loc.get('wght')
    if w0 not in (100, 400, 900):
        return
    for (a, b), refs in white_ref(o.p.italic).items():
        if (a, b) not in vals or a not in o.adv or b not in o.adv:
            continue
        mean0, least0 = _white0(o, a, b)

        def share(w):
            if (w > 400) - (w < 400) != (w0 > 400) - (w0 < 400):
                return None
            if w0 == 400:
                return 1.0, 0.0, 0.0
            d = _design(w)
            if MID_WGHT >= d > 400:  # Bold's own (_fit_white_bold)
                return None
            f = (400 - d) / 300 if w < 400 else (d - 400) / 500
            m4, l4, v4 = _WHITE0[(a, b), 400]
            return f, (1 - f) * (m4 + v4), (1 - f) * (l4 + v4)

        vals[(a, b)] = _clamp_white(refs, vals[(a, b)], mean0, least0, share, AIM_OWN.get((a, b), AIM_BAND))
        _WHITE0[(a, b), w0] = (mean0, least0, vals[(a, b)])
    _FIT_O[w0] = o
    for (a, b), by in FIT_HH.items():
        if (a, b) in vals:
            vals[(a, b)] = 0
            if w0 == 900:
                _, hi_h = _cached_fine(o, 'H')
                lo_h, _ = _cached_fine(o, 'H')
                hh = min(o.adv['H'] - hi_h[x] + lo_h[x] for x in set(hi_h) & set(lo_h))
                vals[(a, b)] = -max(0, int(round(_gap(o, a, b) - by * hh)))


_FIT_O = {}  # wght -> the master _fit_white last fitted there (Regular, Black): _fit_white_bold reads the outlines between them and Bold


class _Between:
    """The glyphs a pair draws, interpolated a share t of the way from master o to master p: what the font draws at a weight between two masters."""

    def __init__(self, o, p, t, names):
        self.contours, self.comps, self.adv = {}, {}, {}
        lerp = lambda u, v: u + (v - u) * t  # noqa: E731
        todo = list(names)
        while todo:
            g = todo.pop()
            if g in self.adv:
                continue
            self.adv[g] = lerp(o.adv[g], p.adv[g])
            self.contours[g] = [[(s[0],) + tuple((lerp(u[0], v[0]), lerp(u[1], v[1])) for u, v in zip(s[1:], q[1:])) for s, q in zip(c, d)]
                                for c, d in zip(o.contours.get(g, []), p.contours.get(g, []))]
            self.comps[g] = [(c, lerp(x, x2), lerp(y, y2), lerp(k, k2)) for (c, x, y, k), (_, x2, y2, k2) in zip(o.comps.get(g, []), p.comps.get(g, []))]
            todo += [c for c, *_ in self.comps[g]]


def _fit_white_bold(o, vals):
    """Bold's outlines are not Regular's and Black's interpolated (its own spacing and counters, build.mid_master), so the white of a WHITE_REF pair
    between 400 and 900 bends at 700: 500-600 read Regular and Bold, 800 Bold and Black. Bold's value moves the least that puts those weights inside
    AIM_BAND (f) at 800 read 0.73x Inter's closest row with the straight-line estimate)."""
    for (a, b), refs in white_ref(o.p.italic).items():
        if (a, b) not in vals or a not in o.adv or b not in o.adv or ((a, b), 400) not in _WHITE0 or ((a, b), 900) not in _WHITE0:
            continue
        mean0, least0 = _white0(o, a, b)
        m4, l4, v4 = _WHITE0[(a, b), 400]
        m9, l9, v9 = _WHITE0[(a, b), 900]

        def share(w):
            # the white of the outlines the font draws there, unkerned, plus the kerning interpolated: Bold's share f of it is this value
            d = _design(w)
            if not 400 < d < 900:
                return None
            if d == MID_WGHT:
                return 1.0, 0.0, 0.0
            if d < MID_WGHT:
                f, other, v_other = (d - 400) / (MID_WGHT - 400), _FIT_O[400], v4
            else:
                f, other, v_other = (900 - d) / (900 - MID_WGHT), _FIT_O[900], v9
            mean_d, least_d = _white0(_Between(other, o, f, (a, b)), a, b)
            return f, mean_d + (1 - f) * v_other - f * mean0, least_d + (1 - f) * v_other - f * least0

        vals[(a, b)] = _clamp_white(refs, vals[(a, b)], mean0, least0, share, AIM_OWN.get((a, b), AIM_BAND))


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
    vals = {k: round(v[0] * (1 if k in STRONG else boost)) if v[0] < 0 else v[0] for k, v in pairs.items()}
    if o.p.wght <= 400:
        vals.update({k: 0 for k in _HEAVY_KEYS if k in vals})
    vals.update({k: 0 for k in WHITE_ONLY if k in vals})
    loc = getattr(o, 'loc', {'wght': 400, 'opsz': 14})
    if loc.get('opsz') == 14:
        _fit_white(o, vals, loc)
    if loc.get('wght') == 400 and loc.get('opsz') == 14:
        _REGULAR = vals
    elif loc.get('wght') == 900 and loc.get('opsz') == 14:
        # Display and Caption Black are corners no master contains (Black's and that master's changes from Regular
        # added). An own-shape pair that needs more opening there than Black has takes it on the Black master, which
        # leaves the optical-size masters on Regular's values: a Regular at Display or Caption kerns as Regular does.
        for name, corner in _CORNERS.items():
            _EXCESS[name] = {}
            for k in pairs:
                if k in OWN_SHAPE_PAIRS or k[0] in I_WIDE or k[1] in I_WIDE:
                    # what the optical-size master opened this pair by against Black's old sidebearings, and still does
                    old_black = max(0, _need(_REF_BLACK, *k, before=True))
                    old_black = round(old_black * (1 + 0.3 * _REF_BLACK.p.heavy)) if old_black < 0 else old_black
                    held = 0 if k in _HEAVY_KEYS else max(0, max(0, _need(_REF_CORNERS[name], *k, before=True)) - old_black)
                    _EXCESS[name][k] = held
                    vals[k] = max(vals[k], _need(corner, *k) - held)
        _BLACK = vals
    elif loc.get('wght') == 400 and _REGULAR is not None:
        out = dict(_REGULAR)
        for k, held in _EXCESS.get(getattr(o, 'name', None), {}).items():
            out[k] = out[k] + held
        return out
    elif loc.get('wght') == MID_WGHT and _REGULAR is not None and _BLACK is not None:
        # Bold kerns as Regular and Black interpolated, so the master adds no kerning data; a pair that
        # its own spacing (tighter than that line) would bring too close is opened by what it needs
        t = (MID_WGHT - 400) / 500
        out = {k: round(_REGULAR[k] + (_BLACK[k] - _REGULAR[k]) * t) for k in vals}
        _fit_white_bold(o, out)
        for k in pairs:
            if k in OWN_SHAPE_PAIRS or k[0] in I_WIDE or k[1] in I_WIDE:
                out[k] = max(out[k], _need(o, *k))
        return out
    return vals


def _strong_fix(o, vals, first_of, second_of):
    """What a strong class pair must be opened by for the accented forms that cannot close as far as their base: Tö, Wä and Yö have a mark
    where the bar or diagonal comes in (and ĽT's caron is in the way even unkerned), so the class value, which suits the letter, would
    bring them nearer than the floor. Inter kerns them apart from the base for the same reason (Tö -51, To -78). The correction is a
    second lookup that adds to the class pair, between classes of letters that need the same correction in every master that knows them
    (first letters and second letters each), so the strong value in `vals` stays the base letters' and the table stays small.
    Returns (first clusters, second clusters, {(first, second): opening for this master})."""
    global _FIX
    strong = {k for k in STRONG if k in vals}
    first_base = {a: ra for ra in sorted({a for a, _ in strong}) for a in first_of(ra)}
    second_base = {b: rb for rb in sorted({b for _, b in strong}) for b in second_of(rb)}

    def need(m, v, a, b):
        if a not in m.adv or b not in m.adv:
            return 0
        return max(0, _room(m, a, b) - v)

    if _FIX is None:  # the default master and the heavy corners decide which letters differ; the other masters follow the same classes
        masters = [o] + list(_HEAVY)
        strong_value = {(m_i, k): measure(m, *k) for m_i, m in enumerate(masters) for k in strong}

        def signature(letter, side):
            vec = []
            for m_i, m in enumerate(masters):
                for other in (second_base if side == 0 else first_base):
                    pair = (first_base[letter], second_base[other]) if side == 0 else (first_base[other], second_base[letter])
                    vec.append(round(need(m, strong_value[m_i, pair], *((letter, other) if side == 0 else (other, letter))) / QUANT) if pair in strong else 0)
            return tuple(vec)

        _FIX = []
        for side, letters in ((0, first_base), (1, second_base)):
            groups = {}
            for letter in sorted(letters):
                sig = signature(letter, side)
                if max(sig, default=0) * QUANT >= MIN_FIX:
                    groups.setdefault(sig, []).append(letter)
            _FIX.append(sorted(groups.values()))
    firsts, seconds = _FIX
    # Display and Caption Black are corners no master draws: they take Black's value plus Regular's optical-size deltas (none here), so the Black
    # master opens by what the corners need as well, as it does for the own-shape pairs
    # (Only the Black master takes this: Bold's interpolation toward it could fall short at 800/48. The reviewer measured it and it did not,
    # and test_pairs_keep_their_clearance_at_the_black_corners guards 900/48 only.)
    loc = getattr(o, 'loc', {})
    where = [o] + (list(_HEAVY[1:]) if loc.get('wght') == 900 and loc.get('opsz') == 14 else [])
    values = {}
    for i, fa in enumerate(firsts):
        for j, sb in enumerate(seconds):
            values[i, j] = int(math.ceil(max((need(m, vals[(first_base[a], second_base[b])], a, b) for m in where for a in fa for b in sb if (first_base[a], second_base[b]) in strong), default=0)))
    return firsts, seconds, values


# Capital diagonals beside each other (VV, VW, AX, RA, KA, Ax ...) and beside a stem or bar (KT, XH in the italic): Black's sidebearing
# (HEAVY_TIGHTEN) leaves two diagonals that face each other 2-3 units of white at 900/48 and 5-6 at 900/14 (fb62663c: 7-8 and 10-12), and the
# italic's slant brings a diagonal's arm into the next stem. They are opened by what the shaped pair needs to reach a floor of white, measured
# per master on the outlines as the closest point in 5-unit rows (test_diagonal_capitals_keep_clear_at_heavy_weights reads the same rows).
# The set is built by glyph class, as the kerning classes are: each base letter with its accented forms and the Cyrillic and Greek letters that
# share its side (К Х А Т Κ Χ Υ Α Τ, Á Ý), and an own-shape capital that draws a diagonal and comes within the floor of one (Ж У Δ); classes whose
# estimated needs are the same share a class, so the matrix stays small. Opening only, on the heavy masters only, so Regular's and Thin's
# kerning is unchanged. The floors are what the test asks (12 at the Black corners and at 700/48, 16 in text Black) plus a unit where the 5-unit
# rows read an edge a little long: 13 at the corners, 17 in text Black and for the Bold master (read at 700/14, where 700/48 is 2-3 units
# tighter). Values are rounded up to steps of 4, which compresses better than exact ones.
DIAG_CAPS = 'AVWXYKRZTHMN'
# Round 3 (JUDGING.md): at 17 / 13 AVATAR and Kv still read as touching in a Black headline (0.8 px of white at 48 px), so the floors are 27 in
# text Black, 19 at the corners and 21 / 23 for Bold; the test asks 26, 18 and 16.
DIAG_FLOOR = {'text': 27, 'corner': 19, 'bold': 21, 'bold_italic': 23}  # units of white (the italic's Bold: with its looser sidebearings 700/48 reads 5-6 tighter than 700/14, and ZΔ kept 11)


def _gap(o, a, b):
    _, hi = _cached_fine(o, a)
    lo, _ = _cached_fine(o, b)
    shared = [x for x in set(hi) & set(lo) if x >= 0]  # above the baseline: an ogonek or a descender hanging below it is not the letters' bodies meeting
    return min((o.adv[a] - hi[x]) + lo[x] for x in shared) if shared else None


def _cached_fine(o, name):
    cache = o.__dict__.setdefault('_profiles5', {})
    if name not in cache:
        cache[name] = _profile(o, name, True, 5)
    return cache[name]


_DIAG = None  # (classes {base: (first-side glyphs, second-side glyphs)}, [(first base, second base)])


def _has_diagonal(o, name, lean):
    """Does the glyph draw a straight stroke at a real angle to its stems (a K's arm, a Ж's, a У's)? `lean` is the stems' dx/dy (the italic's)."""
    for c in o.contours.get(name, []):
        for seg in c:
            if seg[0] == 'L':
                (x0, y0), (x1, y1) = seg[1], seg[2]
                dy = y1 - y0
                if abs(dy) >= 100 and 0.3 <= abs((x1 - x0) - lean * dy) / abs(dy) <= 2.5:
                    return True
    return False


def _diagonal_classes(o, glyphs, acc, joined_r, joined_l):
    """The glyph classes the capital diagonals are opened by, built as the kerning classes are: a base letter with its accented forms and the
    Cyrillic and Greek letters that share its side (joined_r, joined_l, from _side_groups), so Á Ý К Х Κ Υ Δ-like forms get what A, Y, K, X get.
    A Cyrillic or Greek capital that shares no side with a Latin one is its own class when it comes nearer than the floor to a Latin diagonal."""
    classes, seen_r, seen_l = {}, set(), set()
    extras = []
    for b in DIAG_CAPS + 'xvwyk':
        if b in glyphs:
            classes[b] = ([g for g in _members(b, glyphs, acc) + sorted(joined_r.get(b, [])) if g not in seen_r], [g for g in _members(b, glyphs, acc) + sorted(joined_l.get(b, [])) if g not in seen_l])
            seen_r.update(classes[b][0])
            seen_l.update(classes[b][1])
    lo_h, hi_h = _profile(o, 'H')  # an upright stem leans by the italic angle in the italic: a stroke is diagonal by how far it leans from a stem's
    bands_h = sorted(set(lo_h) & set(hi_h))
    lean_h = _slope(hi_h, bands_h)
    heavy = [(_HEAVY[0], DIAG_FLOOR['text'])] + [(c, DIAG_FLOOR['corner']) for c in _HEAVY[1:]]
    for g in sorted(glyphs):
        if g in seen_r and g in seen_l or not (_non_latin(g) and is_cap(g)) or g not in o.adv or g in classes:
            continue
        # a capital of its own shape is in the set when it draws a diagonal and, unkerned, it comes nearer than the floor to a Latin
        # diagonal on a heavy master (Г and Е have bars and stems only; Ж, У and Δ lean)
        if _has_diagonal(o, g, lean_h) and any((gap := _gap(m, x, y)) is not None and gap < floor for m, floor in heavy for b in DIAG_CAPS if b in classes for x, y in ((g, b), (b, g)) if x in m.adv and y in m.adv):
            extras.append(g)
    for g in extras:
        classes[g] = ([g] if g not in seen_r else [], [g] if g not in seen_l else [])
    caps = [b for b in list(DIAG_CAPS) + extras if b in classes]
    domain = [(a, b) for a in caps for b in caps] + [(a, b) for a in 'AKRVWXYZ' for b in 'xvwyk' if a in classes and b in classes]
    domain += [(a, b) for a in extras for b in 'xvwyk' if b in classes]
    return classes, domain


def _diag_have(vals, firsts_fix, seconds_fix, fix, selected, a, b, ga, gb):
    """Kerning a glyph pair has already: its class pair (a, b), and what STRONG_FIX adds."""
    have = vals.get((a, b), 0) if (a, b) in selected else 0
    for i, fa in enumerate(firsts_fix):
        if ga in fa:
            for j, sb in enumerate(seconds_fix):
                if gb in sb:
                    have += fix[i, j]
    return have


def _diagonal_setup(classes, domain):
    """Cluster the classes: bases whose estimated needs (the class kerning alone, on each heavy master, in steps of 4 units) are the same
    against every other base share a class on that side, so the matrix stays the size of what differs (the way _strong_fix groups
    letters). Returns (first clusters, second clusters, the cluster pairs that fall short of their floor on a heavy master). STRONG_FIX only
    opens further, so the estimate is a superset of what each master then needs."""
    selected = set(_SELECTED)
    masters = [(_HEAVY[0], DIAG_FLOOR['text'])] + [(c, DIAG_FLOOR['corner']) for c in _HEAVY[1:]]
    est = {}
    for a, b in domain:
        vec = []
        for m, floor in masters:
            v = _need(m, a, b) if (a, b) in selected else 0
            have = round(v * (1 + 0.3 * m.p.heavy)) if v < 0 and (a, b) not in STRONG else v
            gaps = [_gap(m, ga, gb) for ga in classes[a][0] for gb in classes[b][1] if ga in m.adv and gb in m.adv]
            vec.append(max((floor - (g + have) for g in gaps if g is not None), default=0))
        if max(vec) > 0:
            est[a, b] = tuple(max(0, math.ceil(x / 8)) for x in vec)
    zero = (0,) * len(masters)
    firsts_of = sorted({a for a, _ in est})
    seconds_of = sorted({b for _, b in est})

    def cluster(bases, key):
        groups = {}
        for x in bases:
            groups.setdefault(key(x), []).append(x)
        return sorted(groups.values())

    first_clusters = cluster(firsts_of, lambda a: tuple((b, est[a, b]) for b in seconds_of if (a, b) in est))
    second_clusters = cluster(seconds_of, lambda b: tuple((a, est[a, b]) for a in firsts_of if (a, b) in est))
    pairs = [(i, j) for i, fa in enumerate(first_clusters) for j, sb in enumerate(second_clusters) if any((a, b) in est for a in fa for b in sb)]
    return first_clusters, second_clusters, pairs


def _diagonal_fix(o, vals, classes, setup, firsts_fix, seconds_fix, fix):
    """{(first cluster, second cluster): opening} on this master, on top of the class kerning and STRONG_FIX the glyph pair already has."""
    loc = getattr(o, 'loc', {})
    if loc.get('wght') == 900 and loc.get('opsz') == 14:
        where = [(o, DIAG_FLOOR['text'])] + [(c, DIAG_FLOOR['corner']) for c in _HEAVY[1:]]
    elif loc.get('wght') == MID_WGHT:
        where = [(o, DIAG_FLOOR['bold_italic' if o.p.italic else 'bold'])]
    else:
        return {}
    selected = set(_SELECTED)
    first_clusters, second_clusters, pairs = setup
    out = {}
    for i, j in pairs:
        need = 0
        for m, floor in where:
            for a in first_clusters[i]:
                for b in second_clusters[j]:
                    for ga in classes[a][0]:
                        for gb in classes[b][1]:
                            if ga in m.adv and gb in m.adv and (gap := _gap(m, ga, gb)) is not None:
                                need = max(need, floor - (gap + _diag_have(vals, firsts_fix, seconds_fix, fix, selected, a, b, ga, gb)))
        out[i, j] = 4 * int(math.ceil(max(0, need) / 4))  # steps of 4: the same few values compress
    return out


# The tailed l before a word space: its tail sits L_SPACE_SHARE of the n's sidebearing closer to the space than the n's stem does
# (Regular: 20 units of white against 70), and "small sizes" read as one word at 16 px. It opens by L_SPACE_SHARE of the difference,
# so the white after the tail and after the stem split it (Regular +25: tail 0.93x n + space, stem 1.06x).
L_TAILED = 'lĺļł'
L_SPACE_SHARE = 0.5


def l_space(o):
    rsb = lambda g: o.adv[g] - o.bounds[g][2]  # noqa: E731
    return max(0, round(L_SPACE_SHARE * (rsb('n') - rsb('l'))))


def kern_fea(o):
    """Same pair set for every master (structure must match); values measured per master."""
    global _SELECTED, _GROUPS, _HEAVY_KEYS, _DIAG
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
    pairs = {k: (_need(o, *k), v[1]) if k not in pairs else pairs[k] for k, v in moved.items()}
    if _SELECTED is None:  # the first (default) master decides which pairs exist
        keep = []
        for (a, b), (k, sign) in pairs.items():
            # own-shape pairs stay where Regular needs nothing but Black or a heavy corner does
            if abs(k) >= MIN_KERN and (k < 0) == (sign < 0):
                keep.append((a, b))
            elif (a, b) in OWN_SHAPE_PAIRS:
                if k > 0 or not _HEAVY or any(_need(h, a, b) > 0 for h in _HEAVY):
                    keep.append((a, b))
            elif (a, b) in white_ref(o.p.italic) or (a, b) in FIT_HH:
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
    _HEAVY_KEYS = {(rr(a), rl(b)) for a, b in HEAVY_ONLY | F_BRACKETS} | HEAVY_ONLY | F_BRACKETS | {(rr(a), rl(b)) for a, b in FIT_HEAVY_ONLY} | FIT_HEAVY_ONLY
    vals = _values(o, pairs)
    first_of = lambda ra: _members(ra, glyphs, acc) + sorted(joined_r.get(ra, []))  # noqa: E731
    second_of = lambda rb: _members(rb, glyphs, acc) + sorted(joined_l.get(rb, []))  # noqa: E731
    firsts_fix, seconds_fix, fix = _strong_fix(o, vals, first_of, second_of)
    lines += [f'@kG_{i} = [{" ".join(cluster)}];' for i, cluster in enumerate(firsts_fix)]
    lines += [f'@kF_{j} = [{" ".join(cluster)}];' for j, cluster in enumerate(seconds_fix)]
    if _DIAG is None:  # the first master decides the classes and the pairs (every master lists the same ones): those a heavy master could need to open
        classes, domain = _diagonal_classes(o, glyphs, acc, joined_r, joined_l)
        _DIAG = (classes, _diagonal_setup(classes, domain))
    classes, setup = _DIAG
    diag = _diagonal_fix(o, vals, classes, setup, firsts_fix, seconds_fix, fix)
    dfirst, dsecond, pairs_diag = setup
    lines += [f'@dR_{i} = [{" ".join(g for a in dfirst[i] for g in classes[a][0])}];' for i in sorted({i for i, _ in pairs_diag})]
    lines += [f'@dL_{j} = [{" ".join(g for b in dsecond[j] for g in classes[b][1])}];' for j in sorted({j for _, j in pairs_diag})]
    lines.append('feature kern {')
    for a, b in _SELECTED:
        lines.append(f'  pos @kR_{cls(a)} @kL_{cls(b)} {vals[(a, b)]};')
    if firsts_fix and seconds_fix:
        lines.append('  lookup STRONG_FIX {')
        lines += [f'    pos @kG_{i} @kF_{j} {fix[i, j]};' for i in range(len(firsts_fix)) for j in range(len(seconds_fix))]
        lines.append('  } STRONG_FIX;')
    lines.append('  lookup DIAGONAL_FIX {')
    lines += [f'    pos @dR_{i} @dL_{j} {diag.get((i, j), 0)};' for i, j in pairs_diag]
    lines.append('  } DIAGONAL_FIX;')
    lines.append('  lookup L_SPACE {')
    tailed = [o.cmap[ord(c)] for c in L_TAILED if ord(c) in o.cmap]
    spaces = [o.cmap[c] for c in (0x20, 0xA0) if c in o.cmap]
    lines.append(f'    pos [{" ".join(tailed)}] [{" ".join(spaces)}] {l_space(o)};')
    lines.append('  } L_SPACE;')
    lines.append('} kern;')
    return '\n'.join(lines)

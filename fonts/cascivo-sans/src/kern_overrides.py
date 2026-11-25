"""Hand-tuned kerning, applied over the measured kerning of kern.py (round 6, JUDGING.md defect 9 and the site's "measured by machine,
not tuned pair by pair").

Each entry is a character pair -> (Thin, Regular, Black): the value the pair ships at that master, opsz 14, in units per 1000. None
keeps the machine's value at that master. An optional fourth value is a Display opening: what the pair adds at opsz 48 over its opsz-14
value, at every weight (the Display master carries it; Display Black has no master of its own, so this and Black's value are the only
levers there). An entry replaces the measured value (after kern._fit_white), or adds the pair when the
machine does not kern it. The other masters follow the usual machinery: Bold interpolates Regular and Black (and refits its own white
for the round-4 WHITE_REF pairs), the optical sizes take Regular's values, the Display and Caption corners Black's. Weights between
masters interpolate, so the table is set at three weights only.

How the values were set: each pair was read against Inter 4 (opsz 14, same weight) with kern_oracle-style shaping, as kern units and
as the closest white between the two shapes (test_font.shaped_gaps) and, where test_font.INTER_WHITE lists it, as the white profile
(test_font.pair_white_profile); the value is what brings the white to Inter's, rounded to 5 as a person would. Kerning units do not carry
over from Inter (the sidebearings differ letter by letter), so a value can sit far from Inter's and still be right.

Sans only: the siblings' outlines differ (serifs, narrower capitals), so a family keeps the measured kerning unless its family.py
defines its own KERN_OVERRIDES with this shape.
"""

OVERRIDES = {
    'upright': {
        # Thin W beside a round letter, and A beside W (JUDGING 9, test_font.KERNING_SHORT): the hairline diagonal leaves its white spread
        # over every band, which the measure reads as spacing, so We Wo Wc Wœ shipped -26 to -31 against Inter's -51 and AW WA -36 against
        # -57. Closed as far as ExtraLight's white allows (200 carries two thirds of Thin, and its white sits 0.92x Inter's): about 0.75x
        # Inter's units now, the white 0.88-0.92x. Wa and the V pairs read 0.67-1.0x and keep the machine's.
        # At Black the same W pairs closed -63 and left 59-69 units of white where Inter keeps 88-112: they read as one blob, so they ease to
        # Inter's own value (Wa Wæ still 0.82x Inter's -63).
        'We': (-40, None, -50),
        'Wo': (-40, None, -50),
        'Wc': (-35, None, -50),
        'Wœ': (-40, None, -50),
        'Wd': (None, None, -50),
        'Wa': (None, None, -52),
        'Wæ': (None, None, -52),
        'AW': (-45, None, None),
        'WA': (-45, None, None),
        # Black capitals beside A and L: the measure caps its depth, so the open triangle under P, T, F and beside L's arm is undercounted
        # at Black, where Inter kerns PA -91, TA -92, FA -91, LV -85, LW -68 and these pairs kept 1.3-1.8x Inter's closest white. Closed to
        # about 1.1-1.5x of it (our A and L carry more sidebearing than Inter's). RT: Inter does not kern it; the legacy pair closed the
        # R's bowl to 57 units of the T's bar at Regular (Inter 150), so it eases.
        'PA': (None, None, -80),
        'TA': (None, None, -75),
        'AT': (None, None, -70),
        'FA': (None, None, -70),
        'LV': (None, None, -80),
        'LW': (0, 0, -40),
        'RT': (-25, -10, 0),
        # Figures: 71 left 1.5x Inter's white (the 7's bar overhangs the 1's flag less than Inter's); 77 is opened as Inter opens it (+20),
        # the 7's bar meets the next one's top at 86 units where Inter keeps 115. 7. and 7, at Regular kept 1.1x Inter's white (the Black
        # pair is fitted to Inter's white by kern.WHITE_REF and stays).
        '71': (-20, -35, -25),
        '77': (10, 15, 10),
        '7.': (None, -75, None),
        '7,': (None, -80, None),
        # Punctuation: L’ at Black 1.3x Inter's white (Inter -137); V, at Black 1.1x; r. r, at Thin 1.3x (Inter -62 with a heavier
        # comma head); f’ f” at Black came 85 units from the f's hook (Inter 109) and open. The apostrophe before s was not kerned at all
        # (Inter -77): 1.6x Inter's white at Regular. T. T, Y. P. P, F. F, read at or under Inter's white and keep the machine's.
        'L’': (None, None, -110),
        'L”': (None, None, -110),
        'V,': (None, None, -70),
        'r.': (-90, None, None),
        'r,': (-95, None, None),
        'f’': (0, 0, 20),
        'f”': (0, 0, 20),
        '’s': (-60, -60, -35),
        # r beside a round letter at Black, display size (JUDGING 8): Display Black is a corner no master draws (Black's outlines plus Display's
        # changes from Regular), and there the r's arm tip moves half as far as its advance, so ra rd rg rq kept 12-14 units of white at
        # 900 / opsz 48 (Inter's opsz 32: 29-43) and "Hamburgefonstiv" read rg as one shape. Black's -30 eases to -15 (900/14: 41-53 units,
        # 0.35-0.45 of HH's white, Inter 0.31-0.38) and opsz 48 opens 5 more at every weight (Regular 48: 101-105, Inter's 32: 97-101).
        **{'r' + b: (None, None, -15, 5) for b in 'acdegoq'},
        'rs': (0, 0, 5, 5),
        'fs': (None, None, -20),  # 29 units at 900/14 (Inter 52), 24 at 900/48
        # Quotes beside A at Thin: 1.2x Inter's white (“A -75 against -96, A” -62 against -102); Regular and Black read like Inter's.
        '“A': (-95, None, None),
        '‘A': (-95, None, None),
        'A”': (-80, None, None),
        'A’': (-80, None, None),
    },
    'italic': {
        # Thin W and V (JUDGING 9): the italic's W leans with the round letter after it, which the measure counts as looser still, so the
        # Thin pairs shipped -14 to -22 (Inter -51) and AW -3 (Inter -57). Closed as far as the white at Thin and ExtraLight allows: Inter's
        # white 0.88-0.95x. At Black the W pairs left 40-49 units beside a round letter (Inter 105-112): eased to Inter's -49 (Wa Wæ -52).
        'Wa': (-40, None, -52),
        'We': (-35, None, -45),
        'Wo': (-35, None, -45),
        'Wc': (-35, None, -45),
        'Wœ': (-35, None, -45),
        'Wæ': (-35, None, -52),
        'Wd': (None, None, -45),
        'Va': (-45, None, None),
        'Væ': (-45, None, None),
        'AV': (-55, None, None),
        'VA': (-53, None, None),  # -45 was 0.66x Inter's -68; the white (0.88x of Inter's, as AV's) is what limits it
        'AW': (-40, None, None),
        'WA': (-40, None, None),
        # Black capitals: as the upright's.
        'PA': (None, None, -80),
        'TA': (None, None, -75),
        'AT': (None, None, -70),
        'FA': (None, None, -70),
        'LV': (None, None, -80),
        'LW': (0, 0, -50),
        'RT': (-25, -10, 0),
        # t after R and before a round letter at Black, display size (JUDGING 6, open item): the italic t's crossbar reaches over the next
        # letter, so ta td tq tg kept 22-28 units at 900 / opsz 48 and Rt 14 (Inter Black's opsz 32: 44-54; the gate asks 30). Black opens
        # 15 (Rt 20): 900/14 49 (Inter 68-70) and 900/48 about 37; Thin and Regular stay unkerned (0: None would add the machine's -32 to -41).
        **{'t' + b: (0, 0, 15) for b in 'adq'},
        'tg': (0, 0, 10),
        'Rt': (15, 10, 20),
        # Figures: the italic 1's flag leans away from the 7, 71 kept 1.4-2.3x Inter's white.
        '71': (-30, -35, -50),
        '77': (10, 15, 10),
        '7.': (None, -80, None),
        '7,': (None, -90, None),
        # Punctuation: as the upright's; the italic apostrophe already leans over the s, so ’s closes less and not at Black (125 units, Inter 154).
        'L’': (None, None, -110),
        'L”': (None, None, -110),
        'r.': (-100, None, None),
        'r,': (-105, None, None),
        'f’': (0, 0, 25),
        'f”': (0, 0, 25),
        '’s': (-50, -25, 0),
        # r and t beside a round letter at Black, display size (JUDGING 8): as the upright's, but the italic r's arm overhangs further and
        # ra rd rq overlapped at 900 / opsz 48 (-3 to -1 units; to 6, ts 12, rs 15). Black eases to -10 (to 0, ts rs open 15) and opsz 48 opens 15 more
        # (10, 5) at every weight: 900/48 30-40 units, 900/14 37-48 (0.35-0.45 of HH's), Regular 48 100-103 (Inter's 32: 94-98).
        **{'r' + b: (None, None, -10, 15) for b in 'acdegoq'},
        'to': (None, None, 0, 10),
        'ts': (0, 0, 15, 5),
        'rs': (0, 0, 15, 5),
        # The italic f's hook reaches over the next letter: at Black f beside a round letter kept 24-39 units (Inter 61-71) and 14-29 at
        # opsz 48 (fd 14). Black's -29 to -39 eases to -20 (fs -10): 900/14 37-43, 900/48 32-41.
        **{'f' + b: (None, None, -20) for b in 'acdegoq'},
        'fs': (None, None, -10),
        # Quotes: Black “A and Regular and Black A” kept 1.1-1.2x Inter's white.
        '“A': (None, None, -75),
        '‘A': (None, None, -75),
        'A”': (-80, -70, -75),
        'A’': (-80, -70, -75),
    },
}
MASTER_WGHT = (100, 400, 900)

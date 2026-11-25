# Cascivo Condensed v2.1

Condensed sibling of Cascivo Sans, built by the Sans engine through the family hooks (`fonts/PLAN-families.md`).

Build (about 30 s): `cd fonts/cascivo-sans && CASCIVO_FAMILY=condensed python3 -I src/build.py`
Test: `python3 -I -m unittest discover -s fonts/cascivo-condensed/src` (loads, Latin-1 cmap = Sans's, width 0.76-0.84
of Sans at 100, 400 and 900, o e a B d g b p q & 6 8 9 0 counters open at 900 / opsz 14 and 48, OTS, woff2 budget).
Specimen (Regular and Black, plus Black at 12/14/16 px): `python3 -I fonts/cascivo-condensed/src/specimen.py` -> `specimen.png`.

## v2.1 (round 3: by eye, against Roboto and Barlow Condensed)

Specimens: `specimens/round-next/` (before/after: labels tracked 0.2em, display, text, digits, zoom, 11 px caps).
Score 8.15 -> **8.20** (rhythm 8.97, weight axis 8.27, shape 8.84, colour 8.74, small sizes 7.97 -> 8.18).

- The 1: v2 shifted its outline, and the proportional 1 (the default figure) overhung its right side by 7 units at Regular
  and 44 at Black, so 12, 1l and 1/2 collided. Now the proportional 1 gets extra left sidebearing through a new engine hook,
  `glyphs.pnum_left`, and the tabular 1 is centred as in Sans.
- Black figures are narrower (tabular advance 0.82 -> 0.786 at Black) and looser (`SFIG`): the ink of Black 0 was 495 units,
  against Roboto Condensed's 427, and 0123 sat 30 units apart.
- Black word space +20 units (170 -> 204; RC 230): Black words ran together.
- The em dash is 0.72 of Sans's and the en dash 0.84: the em dash set as a double-width bar.
- The middle dot is 0.8 of the full stop's dot: between tracked caps it was a blob at Bold and Black.
- Black's double quotes are tighter (`glyphs.QUOTE_GAP_HEAVY`, a new engine constant; 572 -> 516 units, RC 408).

Tried and dropped: Black sidebearings 0.72 -> 0.76 or 0.80, and Black stems 0.92 -> 0.89. Display Black opened only a
little, and rhythm fell 0.1-0.2.

## v2 (round 2)

Mean a-zA-Z advance vs Sans (opsz 14): **0.80 at 100, 0.79 at 400, 0.80 at 900** (v1: 0.85, 0.89, 0.93).
Refs at 400: Roboto Condensed 0.84, Inter Tight 0.94 of Sans; at 900 RC 0.78.

Score (`score.run`, refs Inter Tight + Roboto Condensed, variable woff2 from @fontsource-variable 5.2.6):

|     | overall  | rhythm | weight axis | shape | colour | small sizes | optical sizes |
| --- | -------- | ------ | ----------- | ----- | ------ | ----------- | ------------- |
| v1  | 8.08     | 9.16   | 8.20        | 8.88  | 8.71   | 7.15        | 1.17          |
| v2  | **8.15** | 8.97   | 8.26        | 8.75  | 8.73   | 7.97        | 1.19          |

(v1's 8.06 in round 1 was against a slightly different download of the refs; 8.08 is v1 re-measured with these.)

What changed (`src/family.py`, no engine edits):

- `tune` factors per weight (Thin, Regular, Black): counters `WIDTH` (0.76, 0.70, 0.58), sidebearings `SPACE`
  (0.86, 0.78, 0.72), stems `STEM` (1.0, 0.95, 0.92); Black's horizontals and bars -8% (`BLACK_H`). Above Regular the
  factor is set so the product stays linear in the stem (`by_weight`, `R_*`): a plain linear factor times Sans's linear
  counter bent the Bold master off the Regular-Black line (a width kink at 700, the score's wstep). Thin keeps more white,
  as narrow hairline counters closed (score counter z -2 at 200-300).
- Rounds: superellipse `k` +0.08 (v1 +0.03): O C S s G read straighter-sided.
- Black joins: `glyphs.BLACK_JOIN` 0.45 -> 0.36 for this build only (module attribute set from family.py), so the bowl and
  arch joins of d b p q a g 6 9 thin more where they meet the stem. Together with the thinner Black stems and horizontals,
  e a s $ 8 & 6 9 stay open at 12-16 px (specimen bottom lines); v1's Black at Sans's stem weight crowded them.
- Small sizes: c gets +0.35 S on its right at Thin (fading to 0 at Regular; tight hairline cl read as d at 11 px),
  the 1's ink shift is per weight (0.10, 0.12, 0.16 of the figure advance; v1 0.07) as I/1 and l/1 overlapped at 11 px.
- Figures 0.82 of Sans's tabular advance (v1 0.85). r's +0.25 S right sidebearing kept.

Known gaps:

- Rhythm and shape dropped a little (9.16 -> 8.97, 8.88 -> 8.75): v2 is narrower than both refs at Regular, so its
  gap/counter and counter/ink ratios sit at the refs' edge. Counters at 500-900 read +0.7-0.8 z (open), at 200-300 -1.2 z.
- I/1 still overlaps more than the refs at 11-12 px (z 2-3.6), O/0 at 11 px Black (z 3.2): the 0 is narrower than O.
- Display Black (opsz 33-48) still looks crowded next to Roboto Condensed Black (mb, rg, bu). Looser sidebearings alone do
  not fix it (see v2.1). It needs wider Black counters or a lighter Black, so the score's rhythm will have to give.
- Black parentheses and brackets keep Sans's width (( 397 against RC 325, [ 352 against 268), and so does the straight
  double quote at Black (457 against 317).
- The 1 at Black still has a wide left sidebearing (it carries the 11 px I/1 gate), so "$1" opens a little.
- Optical-sizes score stays low (1.19), as for Sans against these refs. No italic; no glyph redraws; no site wiring.

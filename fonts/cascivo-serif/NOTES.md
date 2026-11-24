# Cascivo Serif v1

Serif sibling of Cascivo Sans, built by the Sans engine through the family hooks (fonts/PLAN-families.md).
Upright only, axes wght 100-900 and opsz 8-48, same cmap as Sans, engine kerning kept.

What `src/family.py` does:

- `tune(p)`: hairlines (`H`) at 0.84 (Thin) / 0.62 (Regular) / 0.48 (Black) of Sans's, crossbars (`bar`) at that factor ^0.6 (thin bars opened P R e counters past Source Serif's); sidebearings +4%. o's H/V contrast at 400 / 900 is 0.54 / 0.36 (Source Serif 0.54 / 0.32; v1 0.61 / 0.45).
- `glyph(g, p, name)`: every straight vertical open-stroke end on the baseline, descender, x-height, cap height or ascender gets a slab plus bracket fillet (one raw contour). Lowercase tops get a left head serif only (and at the x-height only on the leftmost stem), wedged (its tip drops 0.6 of the slab); a side already covered by a bar or bowl leaving the stem is skipped. The plan (which ends, which sides, outer or inner) is made once per glyph at the first master and reused, so masters stay compatible.
- Serif sizes: outer reach 43 / 62 / 74 (Thin / Regular / Black; 0.75 x stem at Regular, 0.39 at Black), inner reach capped at 57 at Black so two still leave n's counter about 30; capitals x1.2. Slab 0.95 H, bracket a concave fillet 0.9 x reach tall running out to 0.6 x reach along the slab top. The outer reach keeps v1's slope bend at Regular, or the advances kink at 400 (wstep row).
- Spacing: a lowercase side with an outer serif gives back 0 / 10 / 24 units (Thin / Regular / Black) of its sidebearing, else heavy nn set at 1.29 gap/counter (Source Serif 1.14; now 1.14).
- Overrides: `l` and `I` become plain stems (the serifs replace the Sans tail and slab); `l`'s left sidebearing 0.8 S so its stem sits off I's at 11-12 px.
- No engine edits, no monkeypatching.

Build: `cd fonts/cascivo-sans && CASCIVO_FAMILY=serif python3 -I src/build.py` (~1 min) -> `fonts/CascivoSerif[opsz,wght].ttf`, `.woff2`, `-Latin[opsz,wght].woff2`.
Test: `python3 -I -m unittest discover -s fonts/cascivo-serif/src` (coverage, serifs vs Sans, o contrast vs Sans, OTS, woff2 budget).
Specimen: `python3 -I fonts/cascivo-serif/src/specimen.py [IBMPlexSerif-Regular.ttf]`.

Score vs Source Serif 4 (score.run, ref fontsource `@fontsource-variable/source-serif-4` 5.3.1 `source-serif-4-latin-wght-normal.woff2`):

- round 2: overall 5.68 (v1 5.61 recorded, 5.65 re-measured on the same build). rhythm 6.92 -> 8.13, weight axis 0.88 -> 0.85, shape 6.84 -> 6.28, colour 6.80 -> 6.73, small sizes 8.04 -> 7.40, optical sizes 1.30 -> 1.28.
- v1: overall 5.61 (Cascivo Sans against the same ref: 4.41). rhythm 6.92, weight axis 0.83, shape 6.88, colour 6.80, small sizes 7.76, optical sizes 1.30.

Round 2 costs: shape falls with the contrast (thinner hairlines leave less ink, so the P R 8 counter/ink ratios at 700-900 sit further above Source Serif's); small sizes is pixel-snapping noise on I/l and I/1 at 11-12 px (Source Serif's own I/l jumps 0.17 -> 0.75 between 400 at 11 and 12 px).

Known gaps (v2):

- No serifs on diagonals (A V W X Y K k v w x y z), arm/bar ends (E F T L Z), curved terminals (a c f r s j), or C G S beaks.
- Brackets are one fixed curve; Thin's serifs are a little heavy for the hairline.
- Sans skeleton kept (Sans a, single-storey g, round shapes, e): serif a / g / e overrides not done in round 2.
- Heavy capitals' P R B counters run open against Source Serif (shape row); rounds (oo, OO) set tighter than Source Serif's.
- Weight axis and opsz rows score low (engine-wide, inherited from Sans).

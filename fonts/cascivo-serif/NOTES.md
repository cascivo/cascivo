# Cascivo Serif v1

Serif sibling of Cascivo Sans, built by the Sans engine through the family hooks (fonts/PLAN-families.md).
Upright only, axes wght 100-900 and opsz 8-48, same cmap as Sans, engine kerning kept.

What `src/family.py` does:

- `tune(p)`: hairlines (`H`) at 0.84 (Thin) / 0.62 (Regular) / 0.48 (Black) of Sans's, crossbars (`bar`) at that factor ^0.6 (thin bars opened P R e counters past Source Serif's); sidebearings +4%. o's H/V contrast at 400 / 900 is 0.54 / 0.36 (Source Serif 0.54 / 0.32; v1 0.61 / 0.45).
- `glyph(g, p, name)`: every straight vertical open-stroke end on the baseline, descender, x-height, cap height or ascender gets a slab plus bracket fillet (one raw contour). Lowercase tops get a left head serif only (and at the x-height only on the leftmost stem), wedged (its tip drops 0.6 of the slab); a side already covered by a bar or bowl leaving the stem is skipped. The plan (which ends, which sides, outer or inner) is made once per glyph at the first master and reused, so masters stay compatible.
- Serif sizes: outer reach 43 / 62 / 74 (Thin / Regular / Black; 0.75 x stem at Regular, 0.39 at Black), inner reach capped at 57 at Black so two still leave n's counter about 30; capitals x1.2. Slab 0.95 H, bracket a concave fillet 0.9 x reach tall running out to 0.6 x reach along the slab top. The outer reach keeps v1's slope bend at Regular, or the advances kink at 400 (wstep row).
- Spacing: a lowercase side with an outer serif gives back 0 / 10 / 24 units (Thin / Regular / Black) of its sidebearing, else heavy nn set at 1.29 gap/counter (Source Serif 1.14; now 1.14).
- Serifs go on letters and digits only (Unicode category L or N): a straight quote, `| ¦` or the stem of `!` is a vertical stroke on a metric too.
- Dots: the engine draws a dot as a short vertical stroke as wide as it is tall (`Glyph.dot`); from the baseline the serif pass took it for a stem foot, so `. : ; … ! ?` carried slabs and brackets (round 3 fix). Dot strokes are skipped by the serif pass and redrawn as round contours, 1.12x the Sans square's width (same ink), in punctuation, the i/j tittles and the dot accents. Gate: `test_round_dots_without_serifs`.
- Overrides: `l` and `I` become plain stems (the serifs replace the Sans tail and slab); `l`'s left sidebearing 0.8 S so its stem sits off I's at 11-12 px.
- No engine edits, no monkeypatching.

Round 4 (display round, specimens in `specimens/round-next/`): at 400 a headline read as a sans with stem feet. Added, all in `family.py`:

- Diagonal serifs (`_diag_ends`, `_diag_serif`): a bracketed slab on every free diagonal end on a metric (A K V W X Y k v w x y; vertices such as V's foot or M's corners are skipped). The walls lean with the stroke; the obtuse side keeps a short bracket (`DIAG_LEAN`). The letter's skeleton is squeezed toward its middle by 0.75 of the slabs' added width (`DIAG_TAKE`): unsqueezed, A set 771 at 400 against Source Serif's 712.
- Arm serifs (`_arm_ends`, `_spur`): a bracketed vertical wedge on the free ends of cap-height, x-height (z only) and baseline bars (E F L T Z z, Cyrillic Г Т Е); that side's sidebearing gains a quarter of the wedge (`SPUR_SB`).
- Curved terminals (`_terminals`, `_terminal`): beaks (a vertical barb along the outer side, on the engine's own end face) on C G S c s tops and S s feet; balls on a r f and the j y tails, tangent to the face's outer corner (`BALL_R` 0.75 / 0.56 / 0.36 stems at Thin / Regular / Black).
- Round comma head (`_comma_heads`): the period's disc with the tail leaving its foot; every curly quote follows (built from the comma). `test_round_dots_without_serifs` counts the heads and checks they are circles.
- Heavier serifs for text sizes: slab 1.12 H, bracket 1.1 reach (`SLAB`, `BRACKET`; were 0.95, 0.9).
- Overshoot grows past Regular (`tune`: 11.5 / 13.4 / 16.5 units), as Source Serif's.

Score (same ref as below): 5.675 -> 5.683. rhythm 8.11 -> 7.86 (serifs fill the white the spacing row measures), weight axis 0.90 -> 0.99, shape 6.35 -> 6.52, colour 6.77 -> 6.85, small sizes 7.19 -> 7.17, optical sizes 1.28 -> 1.23. woff2 87_904 / Latin 37_136 (budgets 120_000 / 50_000).

Build: `cd fonts/cascivo-sans && CASCIVO_FAMILY=serif python3 -I src/build.py` (~1 min) -> `fonts/CascivoSerif[opsz,wght].ttf`, `.woff2`, `-Latin[opsz,wght].woff2`.
Test: `python3 -I -m unittest discover -s fonts/cascivo-serif/src` (coverage, serifs vs Sans, o contrast vs Sans, OTS, woff2 budget).
Specimen: `python3 -I fonts/cascivo-serif/src/specimen.py [IBMPlexSerif-Regular.ttf]`.

Score vs Source Serif 4 (score.run, ref fontsource `@fontsource-variable/source-serif-4` 5.3.1 `source-serif-4-latin-wght-normal.woff2`):

- round 2: overall 5.68 (v1 5.61 recorded, 5.65 re-measured on the same build). rhythm 6.92 -> 8.13, weight axis 0.88 -> 0.85, shape 6.84 -> 6.28, colour 6.80 -> 6.73, small sizes 8.04 -> 7.40, optical sizes 1.30 -> 1.28.
- v1: overall 5.61 (Cascivo Sans against the same ref: 4.41). rhythm 6.92, weight axis 0.83, shape 6.88, colour 6.80, small sizes 7.76, optical sizes 1.30.

Round 2 costs: shape falls with the contrast (thinner hairlines leave less ink, so the P R 8 counter/ink ratios at 700-900 sit further above Source Serif's); small sizes is pixel-snapping noise on I/l and I/1 at 11-12 px (Source Serif's own I/l jumps 0.17 -> 0.75 between 400 at 11 and 12 px).

Known gaps (v2):

- Still bare: z's diagonal, the middle arms of E F, the 7's bar, C G's foot terminals, e's terminal, the g's ear and the figures' terminals (2 3 5 6 9).
- Text sets wider than Source Serif (Sans widths and x-height 528 vs ~475); the serifs add texture but a paragraph still reads as a wide serif.
- Thin's beaks and balls are barely visible; Black's a ball and S top beak are a little lumpy.
- Brackets are one fixed curve; Thin's serifs are a little heavy for the hairline.
- Sans skeleton kept (Sans a, single-storey g, round shapes, e): serif a / g / e overrides not done in round 2.
- Heavy capitals' P R B counters run open against Source Serif (shape row); rounds (oo, OO) set tighter than Source Serif's.
- Weight axis and opsz rows score low (engine-wide, inherited from Sans).

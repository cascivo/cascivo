# Cascivo Serif v1

Serif sibling of Cascivo Sans, built by the Sans engine through the family hooks (fonts/PLAN-families.md).
Upright and (round 7) italic, axes wght 100-900 and opsz 8-48, same cmap as Sans, engine kerning kept.

What `src/family.py` does:

- `tune(p)`: hairlines (`H`) at 0.84 (Thin) / 0.62 (Regular) / 0.48 (Black) of Sans's, crossbars (`bar`) at that factor ^0.6 (thin bars opened P R e counters past Source Serif's); sidebearings +4%. o's H/V contrast at 400 / 900 is 0.54 / 0.36 (Source Serif 0.54 / 0.32; v1 0.61 / 0.45).
- `glyph(g, p, name)`: every straight vertical open-stroke end on the baseline, descender, x-height, cap height or ascender gets a slab plus bracket fillet (one raw contour). Lowercase tops get a left head serif only (and at the x-height only on the leftmost stem), wedged (its tip drops 0.6 of the slab); a side already covered by a bar or bowl leaving the stem is skipped. The plan (which ends, which sides, outer or inner) is made once per glyph at the first master and reused, so masters stay compatible.
- Serif sizes: outer reach 43 / 62 / 74 (Thin / Regular / Black; 0.75 x stem at Regular, 0.39 at Black), inner reach capped at 57 at Black so two still leave n's counter about 30; capitals x1.2. Slab 0.95 H, bracket a concave fillet 0.9 x reach tall running out to 0.6 x reach along the slab top. The outer reach keeps v1's slope bend at Regular, or the advances kink at 400 (wstep row).
- Spacing: a lowercase side with an outer serif gives back 0 / 10 / 24 units (Thin / Regular / Black) of its sidebearing, else heavy nn set at 1.29 gap/counter (Source Serif 1.14; now 1.14).
- Serifs go on letters and digits only (Unicode category L or N): a straight quote, `| ¦` or the stem of `!` is a vertical stroke on a metric too.
- Dots: the engine draws a dot as a short vertical stroke as wide as it is tall (`Glyph.dot`); from the baseline the serif pass took it for a stem foot, so `. : ; … ! ?` carried slabs and brackets (round 3 fix). Dot strokes are skipped by the serif pass and redrawn as round contours, 1.12x the Sans square's width (same ink), in punctuation, the i/j tittles and the dot accents. Gate: `test_round_dots_without_serifs`.
- Overrides: `l` and `I` become plain stems (the serifs replace the Sans tail and slab); `l`'s left sidebearing 0.8 S so its stem sits off I's at 11-12 px.
- No engine edits, no monkeypatching (round 7: one read-only hook, `WGHT_MAP`).

Round 4 (display round, specimens in `specimens/round-next/`): at 400 a headline read as a sans with stem feet. Added, all in `family.py`:

- Diagonal serifs (`_diag_ends`, `_diag_serif`): a bracketed slab on every free diagonal end on a metric (A K V W X Y k v w x y; vertices such as V's foot or M's corners are skipped). The walls lean with the stroke; the obtuse side keeps a short bracket (`DIAG_LEAN`). The letter's skeleton is squeezed toward its middle by 0.75 of the slabs' added width (`DIAG_TAKE`): unsqueezed, A set 771 at 400 against Source Serif's 712.
- Arm serifs (`_arm_ends`, `_spur`): a bracketed vertical wedge on the free ends of cap-height, x-height (z only) and baseline bars (E F L T Z z, Cyrillic Г Т Е); that side's sidebearing gains a quarter of the wedge (`SPUR_SB`).
- Curved terminals (`_terminals`, `_terminal`): beaks (a vertical barb along the outer side, on the engine's own end face) on C G S c s tops and S s feet; balls on a r f and the j y tails, tangent to the face's outer corner (`BALL_R` 0.75 / 0.56 / 0.36 stems at Thin / Regular / Black).
- Round comma head (`_comma_heads`): the period's disc with the tail leaving its foot; every curly quote follows (built from the comma). `test_round_dots_without_serifs` counts the heads and checks they are circles.
- Heavier serifs for text sizes: slab 1.12 H, bracket 1.1 reach (`SLAB`, `BRACKET`; were 0.95, 0.9).
- Overshoot grows past Regular (`tune`: 11.5 / 13.4 / 16.5 units), as Source Serif's.
- Review pass: diagonal contrast (`_thin_slashes`): a / stroke is thin (max of 1.15 H and 0.45 V), a \\ stroke thick, Z z excepted. Black's X carried 1.11-1.24x E's ink density (Source Serif 0.91), so a Z beside it looked light; the Z itself matches Source Serif (0.98 of E). Gates: `test_ink_grows_with_weight` (every letter and figure gains ink at each wght step, none lags the alphabet's 400 -> 900 growth by over 20%) and `test_z_diagonal_is_thick`.
- Thin floor: slab at least 16 units, arm wedges 14 (were 12 / ~10). A longer Thin reach was tried and dropped: it moved the advances' bend off Regular (wstep row).
- Word space (`SPACE`): -37 / -13 / +42 units at Thin / Regular / Black, so space over n is 0.39 / 0.37 / 0.32 (Source Serif's; Sans's 0.44 / 0.39 / 0.26).

Score (same ref as below): 5.675 -> 5.691. rhythm 8.11 -> 7.86 (serifs fill the white the spacing row measures), weight axis 0.90 -> 0.88, shape 6.35 -> 6.50, colour 6.77 -> 7.03, small sizes 7.19 -> 7.17, optical sizes 1.28 -> 1.23. woff2 87_928 (budgets 120_000 / 50_000).

Build: `cd fonts/cascivo-sans && CASCIVO_FAMILY=serif python3 -I src/build.py` (~1 min) -> `fonts/CascivoSerif[opsz,wght].ttf`, `.woff2`, `-Latin[opsz,wght].woff2`.
Test: `python3 -I -m unittest discover -s fonts/cascivo-serif/src` (coverage, serifs vs Sans, o contrast vs Sans, OTS, woff2 budget).
Specimen: `python3 -I fonts/cascivo-serif/src/specimen.py [IBMPlexSerif-Regular.ttf]`.

Round 6 (specimens in `specimens/round6/`, `before.png` / `after.png`, Source Serif 4 in grey under each line; `src/specimen_full.py`):

- Capital C (user report: "looks strange"): the Sans C ran on until its stroke fell near vertical, was cut flat and the serif pass hung a thin barb under the face to 0.48-0.54 of the cap height: a claw curling into the counter. Now (`_vbeak`, `VBEAK*`) the top arm of C G c stops 16 degrees earlier, cut vertical, and drops a bracketed beak whose outer side is vertical, its tip at 0.62-0.66 of the height (Source Serif's ~0.66); C's lower end gets a short upward spur (Merriweather's). The wedge closes through the stroke, not along its face (no seam), and stops short of the inner side's extreme (c's narrow counter at Black cut a hole). Gates: `test_c_beak_vertical`, `test_no_winding_holes`.
- Widths (`SB_K`, `CAP_SB_K`, `CAP_H_K`, `CAP_ROUND_K`, `LC_K` in `tune`): against Source Serif 4 the caps set 1.08x (Regular) to 1.17x (Black), text 1.03x / 1.065x. Now caps 1.04x / 1.10x, text 1.02x (400), 1.00x (700), 1.04x (900). Black resists: the Bold master is interpolated, and more narrowing at Black moved little and cost the weight-axis row.
- Double-storey g (`_g2`, `G2`): small upper bowl, ear at the x-height, hairline link, wide lower loop. Gate: `test_g_double_storey`.
- Figures: tabular glyphs skipped the serif pass, so 0-9 read as Sans; now they take it (1 and 4 get feet). Gate: `test_figures_serifed`.
- Score vs Source Serif 4 (same ref): 5.699 -> 5.992. rhythm 7.86 -> 8.69, weight axis 0.88 -> 1.52, shape 6.54 -> 6.81, colour 7.03 -> 6.92, small sizes 7.17 -> 6.88 (I/1 at 11 px, 800-900: the 1's new foot), optical sizes 1.23 -> 1.22.
- Critique (subagent, vs Source Serif 4) items left: contrast at text sizes reads lower than Source Serif's; 2 3 5 7 9 terminals still Sans; e's terminal and a's bowl kept (judged close enough at 400); no italic yet.

Round 7 (specimens in `specimens/round7/`, `before.png` / `after.png`; italic rows at the end of `after.png`, Source Serif 4 Italic in grey):

- Measured first. Against Source Serif 4 at 400 the n stem was 85 (92), Bold's 145 (168), 200's 46 (31); x-height 528 (~495); P B S U N 1.13-1.17x wide. The critique's "contrast too low" did not hold: o's top was 45 units (Source Serif 50) and P B R 6 8 bowls 1.5x its counter over ink, so hairlines got heavier, not thinner.
- Weight spacing (`NAMED_STEMS`, `WGHT_MAP`): the family's own avar map puts the named weights on Source Serif 4's n stems (31 / 53.5 / 92 / 110 / 128 / 168 / 183 at 200-800). Engine hook: `build.py` and `kern.py` read `family.get('WGHT_MAP', WGHT_MAP)`, a no-op for Sans, Mono and Condensed. Gate: `test_named_weight_stems`.
- Stems and hairlines (`STEM_K`, `HAIR_K`): Regular stem x1.09, Thin x0.92, Black unchanged (Black above 190 breaks u's master compatibility in the engine's drawn shoulder); hairlines 0.68 / 0.56 of Sans's at Regular / Black (were 0.62 / 0.48).
- x-height (`XH_K` 0.95): 528 -> 502. Gate: `test_x_height`.
- Widths: `NARROW` (skeleton factors, stroke weights kept) for B P U N S D E F H M R C K J; `NARROW_W` for t (wider at Thin, narrower at Regular: the new map left a 300 -> 400 jump); Thin sidebearings x1.12 (`SB_K`); Black capital sidebearings x0.8 (`CAP_SB_K`, HH gap over counter 1.22 -> Source Serif's 0.92); figures x0.93 (`FIG_K`). Gates: `test_narrow_capitals`, `test_light_weights_hold_width`, `test_figures_narrower`.
- `I` sidebearings 0.8 (it set 1.11x Source Serif's).
- Italic (`ITALIC = True`): the engine's italic skeleton with the serif pass, sheared. Lowercase feet become a one-sided exit flick (`ITALIC_FOOT`, the left reach 0 so masters stay compatible); italic counters x0.93 (`ITALIC_CN`). Gate: `test_italic` (angle, cmap, flick, OTS, woff2 budgets). Score vs Source Serif 4 Italic (`score.run(italic=True)`, ref `source-serif-4-latin-wght-italic.woff2`): 6.46.
- Score vs Source Serif 4 (same ref): 5.992 -> 6.985. rhythm 8.69 -> 8.26, weight axis 1.52 -> 5.01, shape 6.81 -> 8.32, colour 6.92 -> 8.39, small sizes 6.88 -> 6.03, optical sizes 1.22 -> 1.29.
- Costs and caveats: small sizes is I/1 and I/l pixel overlap at 11-12 px; the stems sit within 20 units of Source Serif's, so the rest is pixel phase (a shorter 1 foot moved it 0.83 -> 0.80 and was dropped). Optical sizes compares against a reference with no opsz axis: any Display x-height change costs. Weight axis and wstep still carry single-reference noise (Source Serif's own stem steps run 25-35 units).
- Left: 2 3 5 7 9 terminals still Sans; italic a / e / f still the Sans italic's; italic sets ~1.05x Source Serif Italic; Black g heavy at 72 px.

Round 8 (specimens in `specimens/round8/`, `before.png` / `after.png`: Regular, Bold, Italic at 12 / 16 / 48 px, Source Serif 4
in grey under each line):

- Bug: the serif plans (`_PLAN`, `_DPLAN`, `_TPLAN`, `_DOTS`) were keyed by glyph name, and `build.py` builds the upright and
  then the italic in one process, so the italic reused the upright's stroke indices wherever its drawing differs. The italic f
  carried the upright's stem foot, a slab, on its descender tip (the "blocky f" of the round 7 critique). Now keyed by
  (name, italic). Gate: `test_italic_plans_its_own_strokes` (fails on the round 7 fonts).
- Italic f: the tail takes a ball (`BALL_TAIL`), as Source Serif 4 Italic's; the top kept its ball. Italic a and e judged close
  enough once the stray serifs left (a's foot is the exit flick).
- Figures (`FIG_BALL`, `FIG_ARM`): 2 3 5 6 9 end in a ball (0.72 of the letters' ball; at Black it moves onto the face's middle
  and takes the face's width, `FIG_BALL_MID`, or it read as a knob with a notch behind it); 7's bar hangs a spur from its free
  end. A flag on 5's bar was tried and dropped (5 already ran over Source Serif's ink). Gates: `test_figure_terminals_balled`,
  `test_seven_bar_spur`.
- Rhythm: Bold's lowercase set loose (nn 1.18 gap over counter at 700, Source Serif 1.01): `TUCK` gains a Bold point; u looser
  still (nu 1.34 / 1.36 at 700 / 900, 1.15 italic at 400): `U_LSB`. Black's round capitals set tight (OO 0.61 at 900, Source
  Serif 0.94; O's sidebearing 27 beside H's 43, Source Serif 37 beside 28): `ROUND_SB_K`, upright only (the italic's heavy
  rounds already matched; its light ones set loose, `ROUND_SB_IT`). A smoother `ROUND_SB_K` (rising from Thin) was tried and
  dropped: rhythm 9.03 -> 8.88. Gate: `test_heavy_spacing`.
- t and f advances (`NARROW_W`): Thin t and f were narrow (t 333 / 398 at 100 / 400), a jump at 300 -> 400 (wstep t 40, italic 54).
- Score vs Source Serif 4 (same ref): 6.985 -> 7.111. rhythm 8.26 -> 9.03, weight axis 5.01 -> 4.80, shape 8.32 -> 8.32,
  colour 8.39 -> 8.34, small sizes 6.03 -> 6.04, optical sizes 1.29 -> 1.29.
- Italic vs Source Serif 4 Italic: 6.464 -> 6.547. rhythm 8.07 -> 8.58, weight axis 3.79 -> 3.77, shape 6.82 -> 6.73, colour
  6.91 -> 6.55, small sizes 6.21 -> 6.55.
- Costs: the balls add ink to 3 and 5 (colour row, worst in the italic); the Bold sidebearing points add advance kinks at 600
  (weight axis). WOFF2: upright 89_296 -> 90_112, italic 98_932 -> 98_544 (the stray italic serifs went); GPOS compaction
  (`fontTools.otlLib.optimize`, levels 1-9) was measured and grows the WOFF2 (89_908 -> 90_260+), so nothing was free there.
- Left: small sizes is still I/l and I/1 at 11-12 px, 200-400 (pixel phase); wstep at 600 on X Y V W A (the Bold master sits
  between the named 600 and 700, whose design coordinates are uneven, 585 / 788); Black 6 and 9 show a hairline notch in the
  counter at opsz 48 (round 7 fonts too; engine).

Round 9 (specimens in `specimens/round9/`: `before.png` / `after.png`, 300 / 400 / 700 / 900 upright and italic at 12 / 16 / 48 /
96 px, Source Serif 4 in grey and IBM Plex Serif (400 / 700 only, static) in blue under each line; `display-*.png`: Black upright
and the italic at 170 px beside Source Serif 4. `specimens/round9/specimen.py`, `SERIF_FONTS=dir` renders another build):

- Heavy feet (`HEAVY_TRIM`, `TRIM_BACK`): round 8's `TUCK` set Bold and Black's stems at Source Serif's distance but kept the
  slabs' reach, so neighbouring foot serifs all but touched (nn foot to foot 22 / 29 units at 900 / 700, opsz 48; Source Serif
  47 / 54; at 96 px Rn, nm, mb ran together). The upright lowercase outer reach gives up 14 / 16 units at Bold / Black and the
  tuck half of it: feet 30 -> 44 (900, opsz 14), 21 -> 35 (opsz 48). Giving the tuck all of it back (stems held) cost the rhythm
  row 9.03 -> 8.86; half holds it. Gate: `test_heavy_feet_apart`; `test_heavy_spacing` now measures the white beside n's stems
  at half height, not the outline's sidebearings, which the shorter feet widen on purpose.
- Italic weight (`ITALIC_STEM_K`): the italic carried the upright's stems (n 93 / 171 at 400 / 700; Source Serif 4 Italic 84 /
  156), so at text sizes it read a grade darker than its roman. Now 85 / 162, x0.90-0.96 of the upright's.
- Italic width (`ITALIC_CN`, now weight-keyed 0.84 / 0.88 / 1.03 / 0.99 at Thin / Regular / Bold / Black): a sentence set
  1.09x / 1.06x Source Serif 4 Italic's at 300 / 400; now 1.03x / 1.01x, Bold and Black 0.99x / 1.00x.
- Italic heads (`ITALIC_HEAD` 0.7, `HEAD_BACK` 0.5): lowercase head serifs were the upright's full slabs and crowded the
  x-height at Bold and Black (un, in 73 units apart at 900, opsz 48; Source Serif 4 Italic 114, short entry wedges). The
  engine spaces the ink's extremes, so a shorter head alone pulled the stem in by what it gave up; the left sidebearing takes
  half back (un 73 -> 84; all of it, 94, cost small sizes 7.71 -> 7.31). Gate: `test_italic_lighter_and_narrower`.
- Score vs Source Serif 4 (same ref; round 8 fonts re-measured 7.129, the engine's round 8 changed them since NOTES' 7.111):
  7.129 -> 7.158. rhythm 9.03 -> 9.03, weight axis 4.83 -> 4.89, shape 8.33 -> 8.32, colour 8.36 -> 8.36, small sizes 6.09 ->
  6.23, optical sizes 1.29 -> 1.29.
- Italic vs Source Serif 4 Italic: 6.549 -> 6.624. rhythm 8.59 -> 8.35, weight axis 3.79 -> 3.58, shape 6.73 -> 6.44, colour
  6.54 -> 7.10, small sizes 6.54 -> 7.40. Rhythm and shape fall with the lighter stems (n's counter over ink, P R B bowls).
- WOFF2: upright 88_672 -> 88_444, Latin 37_844 -> 37_756; italic 96_276 -> 96_344 (+68), Latin 41_380 -> 41_360.
- Left: italic a / e are still the sheared Sans italic's shapes (not redrawn this round); the italic sets its letters further
  apart than Source Serif 4 Italic at 48 px with narrower counters (its feet are exit flicks only, so the white between
  letters reads open); Rn at Black (R's foot and leg serifs, 24 units at opsz 48 against 41; capitals not trimmed); small
  sizes is still I/l and I/1 at 11-12 px, 200-400; wstep at 600 on X Y V W A.

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

# Cascivo Mono (v1, round 4)

Monospaced sibling of Cascivo Sans, built from the Sans engine through the `family.py` hooks (fonts/PLAN-families.md).
Upright only, axes opsz 8-48 and wght 100-900.

What v1 does (`src/family.py`):

- `tune`: counters narrowed (cn x0.92, cH/cHd x0.76) so typical letters fit the cell.
- `glyph`: slabs on i (dotless i), j, l (redrawn as a straight stem), r.
- `master`: every spacing glyph gets a 600 advance at every master; ink centred; ink wider than 530 is
  squeezed horizontally (dashes, arrows; at Black slightly O Q A 6 9 0). Composites follow their base (accents move with the anchors) or
  are centred whole. Marks stay 0.
- Engine workarounds (monkeypatched from family.py at first `master()` call, engine files untouched): `mid_master`
  re-centres Bold as plain lerp(Regular, Black) with no squeeze (build_glyf draws Bold from those points + `o.shift`);
  `kern_fea` (Latin, Georgian, Armenian, Hebrew) returns nothing; `.notdef` advance 500 -> 600. `fea` also strips any kern block.

Build: `cd fonts/cascivo-sans && CASCIVO_FAMILY=mono python3 -I src/build.py` (seconds).
Test: `python3 -I -m unittest discover -s fonts/cascivo-mono/src` (names, Latin cmap, one advance at wght 100/400/900 x
opsz 8/14/48, no kern, OTS, woff2 budget). Specimen: `python3 -I fonts/cascivo-mono/src/specimen.py`.

Round 2 (`src/family.py`, family-level only, engine untouched):

- Black lighter for the cell: stem, contrast and bars x(1 - 0.08 heavy) (190 -> 175), `p.heavy` frozen at Sans's value (instance
  subclass) so every Black-only shape decision still applies; capitals' counters a further 16% narrower at Black, figures 45 units
  narrower. Black's H, n, 2, 5, 8 now fit the cell unsqueezed (H 611 -> ~530 ink); 6 9 0 O A squeeze ~0.9 instead of 0.83.
  BLACK_LIGHT swept 0.04-0.12 against the refs: 0.08 best.
- m redrawn in-stroke: pen 0.86 (Regular) to 0.80 (Black) of the stem, counters from a 520 (Black 540) ink width, no squeeze.
- w and W: four diagonals on a 520/530 ink width, lighter pen (0.90/0.92 -> 0.86/0.88 at Black), middle apex lowered to 0.74 x-height
  (w) and 0.66 cap height (W). M: lighter pen at Black, vertex raised off the baseline (0.30-0.34 cap height), steeper diagonals.
- 0 is a dotted zero (JetBrains-style): a vertical dot, about a stem wide (min 70 units, at most 0.4 of the counter) and 1.6x as
  tall; distinct from O and from the slashed Ø at every weight. The slashed zero stays on the `zero` feature, `ss01` is the Sans dot.
- 5 6 9 drawn with a 0.94 pen at Black (counters stay open in the cell); r drawn with a 0.94 pen and a 45% longer arm at Black, its
  top serif shorter (0.7 -> 0.5 of the reach) so it no longer reads as a second slab beside the arm.

Score vs JetBrains Mono + Geist Mono (fontsource variable latin woff2), round 2: before (v1 font, same refs) 7.74 -> after **7.87**;
rhythm 7.03 -> 8.15, weight axis 9.04 -> 9.03, shape 8.56 -> 8.36, colour 6.69 -> 6.63, small sizes 9.83 -> 9.46, optical sizes
1.27 -> 1.28. Shape and small sizes lose on the dotted 0 (its counter reads bigger than the refs' at 800-900, and O/0 at Thin) and
lighter-than-ref 6 9 counters at Black: trades taken for legibility.

Round 3, terminal and code (`src/family.py`, new `src/box.py`; engine untouched, Sans byte-identical):

- x-height 528 -> 550 (JetBrains Mono's; `XH_UP`). Cap height stays 700: 714 and 724 cost shape against the refs.
- The cell is the line box: hhea = typo = 1000 / -300, line gap 0, USE_TYPO_METRICS (line-height 1.3, JetBrains Mono's 1.32).
  usWinAscent/Descent cover every glyph (1222 / 400: stacked Vietnamese capitals and the box lines' overshoot).
- Box drawing U+2500-257F complete (light, heavy, double and mixed joins parsed from the Unicode names; dashes, arcs, diagonals,
  half lines), block elements U+2580-259F (eighths, quadrants, shades on a tiling 8 x 16 grid) and Powerline U+E0B0-E0B3. Lines
  light 90 / heavy 180 / double 2 x 70, the same at every weight; lines overshoot the cell 20 units across and 100 up and down so a
  rounded pixel cell leaves no seam, blocks and shades stop exactly at the cell.
- Operators on one axis (294, 0.42 cap height): the hyphen and dashes moved up from mid x-height to it. Hyphen 0.49 of the cell,
  en dash 420 units, em dash the whole cell; `*` centred 50 over the axis (was 236 over, at the cap height) and 15% larger;
  `|` and `¦` span the line box (stacked bars join), `_` and `—` the cell's width.
- r: no top serif and a 40% longer arm at every weight: with Sans's short arm, `drwxr-xr-x` read as small-cap I's.
- No glyph leaves its cell at any weight or optical size: composites whose ink overflowed (179: Ð Đ Ø ¼ ½ ¾ Œ œ ” „ Ĳ ǆ, Vietnamese
  stacked accents, Greek tonos and breathings) are collected per master and, before `build_glyf`, drawn out as outlines in every
  master and squeezed into the cell like m and w. WOFF2 54 -> 74 KB (budget 120), Latin slice 24 -> 26 KB.
- No `liga`/`calt`/`dlig` (there never were; now a test).
- Tests (`src/test_family.py`): one advance at 100/400/700/900 x opsz 8/14/48; every glyph's ink inside its cell; line metrics;
  ASCII and Latin-1 inside the line box; box glyphs reach exactly the edges their arms name; blocks fill and halves meet; operators
  within 4 units of one axis; `|` `_` `—` reach the edges and `- – —` differ in length; dotted 0, r's arm; no ligatures.
- Specimens: `specimen.png`, and `specimen-terminal.png` (`python3 -I src/specimen_terminal.py [JetBrainsMono-Regular.ttf ...]`:
  shell prompt, ls -l, code, a box-drawing TUI at line-height 1, Regular, Bold and 14 px, references under it).

Score vs JetBrains Mono + Geist Mono, round 3: 7.88 -> 7.86 overall; rhythm 8.15 -> 8.15, weight axis 9.03 -> 9.03, shape 8.39 -> 8.37,
colour 6.63 -> 6.76, small sizes 9.45 -> 9.71, optical sizes 1.28 -> 0.00. The opsz row is pixel noise (the refs have no opsz axis;
the x-height's step from opsz 14 to 48 rounds to one more pixel). Without it 8.29 -> 8.35. Adding Fira Code as a third reference:
7.79 -> 7.74 (8.21 -> 8.27 without opsz). IBM Plex Mono is static (fontsource has no variable cut), used in the specimens only.

Round 4, visual (`src/family.py`; engine untouched, Sans byte-identical). Judged by eye at 13-20 px and 72 px, 100/400/700/900, against
JetBrains Mono; before/after sheets in `specimens/round-next/`.

- r: no foot serif (with it r read as ɪ/ɾ at Thin and Display); arm R_WIDE 0.4 -> 0.6, and Black's no longer shorter than Regular's.
- f and t drawn on a wider n counter (F_WIDE 2.2, T_WIDE 1.6): ink 0.5 -> 0.7 of the cell, no more holes either side in `fn`, `let`.
  t stops at 1.6: wider, its foot curve folds (score.py `kink`).
- Dots (. , : ; ! ? i j): at least 92 + 0.6 stems (Thin's period 54 -> 106, JetBrains Mono's 146) and round, a rounded square toward
  Black (`DOT_SQ`): enlarged, Sans's sharp square read as a block. The comma's tail is capped (`COMMA_DEPTH`) so it stays in the line box.
- 0's dot: an oval (was a sharp bar), 1.3x the bar's box; Black's 0 3% narrower.
- `!` keeps a gap over its dot (Black's stem ran into it: `!` read as l). `/` and `\` 0.72 of the cell over -150..800 with a lighter
  pen (were 0.49, steep, read as l at Black).
- w and W heavier pens (0.97 and 0.99): their colour was 0.85x JetBrains Mono's relative to n.
- New ≤ ≥ ≠ (U+2264, U+2265, U+2260) on the operators' axis, characters only (still no ligatures).
- The Latin WOFF2 slice now carries box drawing, blocks, Powerline and ≤ ≥ ≠ (25.9 -> 28.4 KB, budget 45).
- Tried and dropped: BLACK_LIGHT 0.11 (Black is ~5% darker than JetBrains Mono's, but lighter cost rhythm and shape); lighter m and M
  pens at Black (no visible gain).

Score vs JetBrains Mono + Geist Mono, round 4: 7.858 -> **7.888**; shape 8.37 -> 8.40, colour 6.76 -> 6.86, small sizes 9.71 -> 9.74,
rhythm and weight axis unchanged.

v1 score vs JetBrains Mono + Geist Mono: overall 7.78; rhythm 7.25, weight axis 9.04, shape 8.56, colour 6.69,
small sizes 9.84, optical sizes 1.27 (the refs have no opsz axis, so that row is not meaningful).

Known gaps: Black's O Q A 6 9 0 are still squeezed slightly (~0.9); wide non-Latin glyphs (Cyrillic Ш Ж, Georgian, Hebrew) and
the flattened composites (Greek capitals with breathings down to ~0.65) are squeezed rather than redrawn; stacked Vietnamese
capitals reach over the line box (to 1206 at Black; the win metrics hold them); Black is a little darker than JetBrains Mono's; f's
crossbar is short on the left; `|` spans the whole line box (by design, it reads tall in code); no ✓ ✗; no statics, no italic.

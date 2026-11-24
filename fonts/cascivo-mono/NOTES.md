# Cascivo Mono (v1, round 2)

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

v1 score vs JetBrains Mono + Geist Mono: overall 7.78; rhythm 7.25, weight axis 9.04, shape 8.56, colour 6.69,
small sizes 9.84, optical sizes 1.27 (the refs have no opsz axis, so that row is not meaningful).

Known gaps: Black's O Q A 6 9 0 are still squeezed slightly (~0.9); Ø's slash overshoots the cell at Black (Sans composite); wide non-Latin glyphs
(Cyrillic Ш Ж, Georgian, Hebrew) are squeezed too and composite digraphs (ǆ, ĳ, ŉ, ™) may overflow the cell;
f and t have no mono-specific redraw; no statics, no italic.

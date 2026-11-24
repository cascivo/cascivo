# Cascivo Mono v1

Monospaced sibling of Cascivo Sans, built from the Sans engine through the `family.py` hooks (fonts/PLAN-families.md).
Upright only, axes opsz 8-48 and wght 100-900.

What v1 does (`src/family.py`):

- `tune`: counters narrowed (cn x0.92, cH/cHd x0.76) so typical letters fit the cell.
- `glyph`: slabs on i (dotless i), j, l (redrawn as a straight stem), r.
- `master`: every spacing glyph gets a 600 advance at every master; ink centred; ink wider than 530 is
  squeezed horizontally (m w M W, dashes, arrows). Composites follow their base (accents move with the anchors) or
  are centred whole. Marks stay 0. `0` maps to the slashed zero.
- Engine workarounds (monkeypatched from family.py at first `master()` call, engine files untouched): `mid_master`
  re-centres Bold as plain lerp(Regular, Black) with no squeeze (build_glyf draws Bold from those points + `o.shift`);
  `kern_fea` (Latin, Georgian, Armenian, Hebrew) returns nothing; `.notdef` advance 500 -> 600. `fea` also strips any kern block.

Build: `cd fonts/cascivo-sans && CASCIVO_FAMILY=mono python3 -I src/build.py` (seconds).
Test: `python3 -I -m unittest discover -s fonts/cascivo-mono/src` (names, Latin cmap, one advance at wght 100/400/900 x
opsz 8/14/48, no kern, OTS, woff2 budget). Specimen: `python3 -I fonts/cascivo-mono/src/specimen.py`.

Score vs JetBrains Mono + Geist Mono: overall 7.78; rhythm 7.25, weight axis 9.04, shape 8.56, colour 6.69,
small sizes 9.84, optical sizes 1.27 (the refs have no opsz axis, so that row is not meaningful).

Known gaps: squeezing thins the verticals of m w M W at Black (no in-stroke redraw yet); wide non-Latin glyphs
(Cyrillic Ш Ж, Georgian, Hebrew) are squeezed too and composite digraphs (ǆ, ĳ, ŉ, ™) may overflow the cell;
f and t have no mono-specific redraw; ss01 (dotted zero) no longer applies since 0 is the slashed zero; no statics,
no italic; Black is heavy for a mono (stem 190).

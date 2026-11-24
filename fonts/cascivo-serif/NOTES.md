# Cascivo Serif v1

Serif sibling of Cascivo Sans, built by the Sans engine through the family hooks (fonts/PLAN-families.md).
Upright only, axes wght 100-900 and opsz 8-48, same cmap as Sans, engine kerning kept.

What `src/family.py` does:

- `tune(p)`: horizontals (`H`, `bar`) at 0.84 (Thin) / 0.70 (Regular) / 0.60 (Black) of Sans's, so contrast rises with weight; sidebearings +4%.
- `glyph(g, p, name)`: every straight vertical open-stroke end on the baseline, descender, x-height, cap height or ascender gets a slab plus bracket fillet (one raw contour). Lowercase tops get a left head serif only (and at the x-height only on the leftmost stem); a side already covered by a bar or bowl leaving the stem is skipped. The plan (which ends, which sides) is made once per glyph at the first master and reused, so masters stay compatible; only reach (30/48/58), slab (0.8 H) and bracket size vary.
- Overrides: `l` and `I` become plain stems (the serifs replace the Sans tail and slab).
- No engine edits, no monkeypatching.

Build: `cd fonts/cascivo-sans && CASCIVO_FAMILY=serif python3 -I src/build.py` (~1 min) -> `fonts/CascivoSerif[opsz,wght].ttf`, `.woff2`, `-Latin[opsz,wght].woff2`.
Test: `python3 -I -m unittest discover -s fonts/cascivo-serif/src` (coverage, serifs vs Sans, o contrast vs Sans, OTS, woff2 budget).
Specimen: `python3 -I fonts/cascivo-serif/src/specimen.py [IBMPlexSerif-Regular.ttf]`.

Score vs Source Serif 4 (score.run): overall 5.61 (Cascivo Sans against the same ref: 4.41).
rhythm 6.92, weight axis 0.83, shape 6.88, colour 6.80, small sizes 7.76, optical sizes 1.30.

Known gaps (v2):

- No serifs on diagonals (A V W X Y K k v w x y z), arm/bar ends (E F T L Z), curved terminals (a c f r s j), or C G S beaks.
- Head serifs are flat, not wedged; brackets are one fixed curve; Thin's serifs are a little heavy for the hairline.
- Sans skeleton kept (geometric a, g, round shapes): it reads as a slab-ish grotesque more than a text serif.
- Weight axis and opsz rows score low (engine-wide, inherited from Sans).

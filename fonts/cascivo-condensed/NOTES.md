# Cascivo Condensed v1

Condensed sibling of Cascivo Sans, built by the Sans engine through the family hooks (`fonts/PLAN-families.md`).

- `src/family.py`: `tune` scales the counters (`cn`, `cH`, `cHd`) by 0.82, sidebearings (`S`, `Sc`, `Sfig`) by 0.9,
  the tabular figure advance by 0.85, and adds 0.03 to the superellipse `k`. Diagonals (W, M, w, m) follow, as their
  widths derive from those counters. Two legibility fixes found by the score's small-size gate:
  `glyph` opens r's right sidebearing (+0.25 S; rn read as m at Bold), `master` moves the 1's ink right by 0.07 of its
  advance (narrowed and centred, its stem sat on l's and I's). No `fea` hook: kerning kept. No engine edits, no overrides.
- Upright only (`ITALIC = False`). Outputs in `fonts/`: `CascivoCondensed[opsz,wght].ttf`, `.woff2`, `-Latin[opsz,wght].woff2`.

Build (about 1 min): `cd fonts/cascivo-sans && CASCIVO_FAMILY=condensed python3 -I src/build.py`
Test: `python3 -I -m unittest discover -s fonts/cascivo-condensed/src` (loads, Latin-1 cmap = Sans's, width 0.78-0.90
of Sans at 400, o e a B d g counters open at 900 / opsz 14 and 48, OTS, woff2 budget).
Specimen: `python3 -I fonts/cascivo-condensed/src/specimen.py` -> `specimen.png`.

Score (`score.run`, refs Inter Tight + Roboto Condensed): overall **8.06** (Sans itself against the same refs: 7.57).
rhythm 9.16, weight axis 8.06, shape 8.88, colour 8.71, small sizes 7.14, optical sizes 1.16.
Before the r / 1 fixes: 7.02 (small sizes 0.0).

Mean a-zA-Z advance vs Sans: 0.85 at 100, 0.89 at 400, 0.93 at 900.

Known gaps:

- Black condenses least (0.93x): stems keep Sans's weight, so the white shrinks but the ink does not. A v2 should
  thin Black's stems a little or narrow its counters further (watch e/a closing).
- 400 sits at 0.89, near the top of the 0.80-0.90 plan band; a WIDTH of about 0.78 would centre it.
- Optical-sizes score is low (1.16), as for Sans against these refs; not addressed.
- No italic; no glyph redraws (round letters are Sans's, squared only via `k`); no site wiring.

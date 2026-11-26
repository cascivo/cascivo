# Cascivo Condensed changelog

## Round 10 (visual)

- Bold and Black t are narrower: their foot was drawn only three quarters of the way to Black's short foot (the thinner stems read as
  a lighter weight), so the t inked wider than Sans's and "started", "Settings" opened a hole after it at 12-16 px.
- Slash, backslash, guillemets and braces are condensed with the letters (they kept 0.88-0.99 of Sans's width; now 0.74-0.85):
  "Read/Write", "«Oui»", "{name}" stop setting loose, and the slash leans like the condensed diagonals.
- WOFF2: full 73,504 -> 73,776 bytes, Latin 31,104 -> 31,132 (+0.3%, brotli noise on the changed outlines).
- Before/after sheets (headlines 48/96 px, UI 12/16 px, tables 12/16/48 px, 100-900): `specimens/round10/` (`src/specimen_round10.py`).

## Round 9 (visual)

- Parentheses, brackets, the straight double quote and the hyphen are condensed with the letters (they kept 0.85-0.95 of Sans's
  width; now 0.77-0.83): "(Mobile)", "[Beta]", "Draft" and 2026-11-25 stop setting loose. Strokes keep their weight.
- WOFF2: full 73,704 -> 73,504 bytes, Latin 31,060 -> 31,104.
- Before/after sheets (headlines 48/96 px, UI 12/16 px, tables 12/16/48 px, 300-900): `specimens/round9/` (`src/specimen_round9.py`).

## Round 8 (visual, bytes)

- Bold and Black t have more room on the left: st, ct, rt stop touching at 12-16 px.
- Black c and e have more room on the right: cc, ce, ee stop clumping at 12-14 px.
- The tabular 3 is as wide as the 0 (it was 16 units wider at Black and nearly filled its cell).
- WOFF2s 1.2% smaller with the same outlines (hmtx transform, brotli tries): full 75,700 -> 74,772 bytes, Latin 31,764 -> 31,496.
- Before/after sheets (UI labels 12/16/48 px, figures, rhythm): `specimens/round8/` (`src/specimen_round8.py`).

## Round 7 (visual)

- The proportional 1 sits closer to its neighbours: left sidebearing 78 units (was 106, Roboto Condensed 79). "01 ·" eyebrows and
  "1,513" lose the hole after 0 and the comma.
- Comma and semicolon tails 20% shorter (-139 under the baseline, was -173): no blob at 48 px.
- Before/after specimens vs Roboto Condensed and Barlow Condensed (headlines 48-96 px, 12 px tracked eyebrows, figures, weights):
  `specimens/round7/` (`src/specimen_round7.py`).

## Round 6 (visual)

- Black stems lighter (0.87 of Sans, was 0.92) and Black spacing looser: 72 px headlines no longer touch (rt, ly, nd).
- Black word space 221 units (was 204).
- t has more right sidebearing (at least 20 units at every weight).
- Dots 8% larger.
- Before/after specimens vs Roboto Condensed and Barlow Condensed: `specimens/round6/`.

## v2.1

- The proportional 1 no longer overhangs: 12, 1l and 1/2 stop colliding. The tabular 1 is centred.
- Black figures are narrower and looser, and Black has a wider word space.
- The em dash, en dash and middle dot are condensed, and Black's double quotes are tighter.
- New engine hooks, which change nothing in Sans: `glyphs.pnum_left` and `glyphs.QUOTE_GAP_HEAVY`.
- Score 8.15 -> 8.20.

## v2

- Every weight is near 0.80 of Sans. Black has thinner stems and joins, and the rounds are squarer (see NOTES.md).

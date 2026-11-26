# Cascivo Mono changelog

## Round 9 (visual)

- Thin 50% heavier at the Thin master, horizontals included (stem 28 -> 36): it was 0.45x JetBrains Mono Thin's ink, grey at 12-14 px.
- `|` and `¦` span -190..850 like the brackets, not the whole line box: in code the full-height bar read as the text cursor.
  Joined vertical rules are U+2502 │.
- `*` larger and heavier at 100-700 (455 -> 500 wide at Regular); `` ` `` 10% smaller at Black (was 1.36x JetBrains Mono's ink).
- WOFF2 70 456 -> 70 360 B, Latin slice 27 292 -> 27 344 B. Sheets: `specimens/round9/` (`src/specimen_round9.py`).

## Round 8 (visual + bytes)

- `{ }` at Bold and Black: lighter pen (0.7 of the stem at Black); the curls had filled into a solid lobe, `{}` 1.4x JetBrains
  Mono's ink, now 0.8x and open.
- I 380 units wide (was 245-313); 1's flag 1.35x longer (265 -> 329 wide); j's hook 1.6x wider, its tail under its top slab.
- `/` `\` heavier pen (0.66 -> 0.8); `#` redrawn full cap height, 18% lighter at Black (was 1.2x JetBrains Mono's ink).
- WOFF2 hmtx transform + Brotli tries (lossless): WOFF2 73 380 -> 72 212 B, Latin slice 28 176 -> 27 832 B.
- Before/after sheets vs JetBrains Mono (code 12/16/48 px at 400/700/900, punctuation, disambiguation, cell grid):
  `specimens/round8/` (`src/specimen_round8.py`).

## Round 7 (visual)

- ( ) [ ] { } fill the cell: braces 0.66 of it (were 0.45), brackets and parens about 0.4 (were 0.31-0.35), and all six reach
  higher (-173..807, were -161..751). Stems keep their weight: only arms, hooks and the brace cusp move, parens bend.
- ~ less flat (0.9 x 1.28), ^ larger (1.1 x 1.3), * 14% larger (radius 228, was 200).
- Before/after specimens vs JetBrains Mono (code 13/14/20 px, punctuation, box drawing, weights, 72 px): `specimens/round7/`
  (`src/specimen_round7.py`).

## Round 6 (visual)

- New ✓ (U+2713) and ✗ (U+2717), also in the Latin WOFF2 slice. ✗ sits under the cap height, so it does not read as X.
- Black 7% lighter on the stem (162 units, was 175); Thin 15% heavier (no longer a grey hairline at 12-14 px).
- `|` thinner (0.74 of the stem, was 0.9); it keeps the full line box.
- Larger dots at 100-700 (Regular period 142, was 131); Black unchanged.
- Before/after specimens vs JetBrains Mono: `specimens/round6/`.

## Round 4 (visual)

- r without a foot serif and a longer arm; wider f and t; round dots (rounded square at Black), larger at Thin; oval dot in 0.
- `!` keeps its gap at Black; wider, lighter `/` and `\`; heavier w and W.
- New ≤ ≥ ≠. The Latin WOFF2 slice includes box drawing, blocks and Powerline.
- score.py vs JetBrains Mono + Geist Mono: 7.858 -> 7.888.

# Cascivo Sans round 4: handover (2026-11-22)

Temporary file. Delete it in the commit that finishes round 4, before the PR is opened.

## Goal and status

Raise the blind-judge score on the `JUDGING.md` rubric toward 9. Everything must end in ONE PR from
`claude/modest-keller-c4uipj`. No PR exists yet.

| State                                   | Commit      | Score (judge 2, one sitting, 2026-11-22) |
| --------------------------------------- | ----------- | ---------------------------------------- |
| main                                    |             | 5.8                                      |
| round 1                                 | `aafe2f9b`  | 5.7                                      |
| round 2                                 | `19acf8ac`  | 5.9                                      |
| round 3                                 | `08d7ce960` | 6.2 (6.7 on the round 3 judge's scale)   |
| round 4 after first merge (R4-M)        | `2d808405d` | 6.7                                      |
| round 4 after second merge (R4-M2)      | `b491141c3` | not judged yet                           |

Per criterion for `2d808405d` (round 3 in brackets): rhythm 7.0 (6.0), weight axis 6.0 (6.5), shape 6.0 (5.5),
proportions 6.5 (6.0), joins 6.5 (5.5), paragraph colour 7.5 (7.0), small sizes 7.5 (7.5), italic 6.5 (5.5),
kerning 6.0 (6.0), optical sizes 8.0 (6.0), character 6.5 (6.5). A 9 is not in reach of one more cycle;
the estimate for a clean cycle 3 is 7.3 to 7.5.

## Branches

- `claude/modest-keller-c4uipj` at `b491141c3` (+ this file): LAST GREEN STATE. Source and built fonts.
  Deterministic build, lint 0 failures, 121 tests OK.
- `font-r4-b6` at `872bd5c48`: WIP, source only (`src/glyphs.py`), branched from `b491141c3`. Builds. Lint and tests NOT run.
- `font-r4-b7` at `98833ca03`: WIP, source only (`src/glyphs.py`), branched from `b491141c3`. Builds. Lint not re-run
  after the last edits; full tests were stopped with about 9 unidentified failures.
- `font-r4-b1` to `font-r4-b5`: already merged; local only, not needed.

## Owner decisions (approved by the user 2026-11-22)

1. Width gate: 100 to 600 within ±2% of Regular; 700 up to +4%, 900 up to +10%, linear between; the −2% floor stays.
2. `quality.py` join-angle gate may judge Black arch joins by join thickness.
3. Pinned Regular advances (`test_advances_at_regular_match_a855b5e0`) may change for `[ ] { }` and the italic diagonals only.
4. `BUDGETS` may rise up to 3% over the values at `08d7ce960`, commented "raised by the user, round 4". Caps:
   full 76,735; Latin[opsz,wght] 32,445; Latin[wght] 25,750; Regular 26,265; italic full 83,945;
   italic Latin[opsz,wght] 36,050; italic Latin[wght] 28,840.

Open question for the user (not answered): the rubric's weight-axis row in `JUDGING.md` still says "±5% at 800 and 900".
The judge marked the approved width release down for it. Proposal: reword the row to decision 1 before the final sitting.

## What round 4 did (all on the work branch)

- R4-A `14c9abb33`: heavy weights released to the new width gate (`BOLD_SQUEEZE`, `HEAVY_TIGHTEN`, `CN_TRIM` removed).
- B1 `38ac2f1f0`: lowercase 500 to 900 (`f`, `l`, `e`, thin arch joins with `geom.Stroke` `reach`, italic `z`, `t`).
- B2 `8035a09e7`: `@ ( ) [ ] { } &`, quotes, `*`, `%`, capitals `O C G Q M I`, `Q` tail, Black figures.
- R4-C `d9cb67b75`: kerning fitted to Inter's white from the master outlines (`kern.WHITE_REF`, `test_fitted_pairs_hold_inter_white`).
- B3 `a989ccb54`: italic `ef` collision, `ff`, caption `f` hook, `b d p q` joins, crotches, `l`.
- B4 `cb024182c`: `a` bowl (all weights), `e` bar, `c`, Black `s` `S`, `g` tail, opsz 8 Black counters.
- B5 `e9ce97712`: guillemets 700 to 900, Thin `%`, Black `T V W X Y Z` (`BOLD_OWN`), `5`, `2`.
- R4-M2 `b491141c3`: merge, kerning fit reads weights through avar, `BOLD_TIGHTEN` 0.12 to 0.125.

State at `b491141c3`: rhythm upright .50/.53/.55/.59, italic .57/.58/.59/.60 (100/400/700/900). Tightest string
("Overview Activity Settings Members Billing") +1.98% at 600, +3.09% at 700, +9.93% at 900: NO room to widen anything.
Bytes built / budget: full 76,360 / 76,400; Latin[opsz,wght] 31,948 / 32,000; Latin[wght] 25,520 / 25,600;
Regular 25,040 / 25,100; italic full 82,788 / 82,800; italic Latin[opsz,wght] 35,348 / 35,400; italic Latin[wght] 28,404 / 28,500.

Regular text differs from round 3 in: `a` and `g` outlines, `ff` kern −32, `l`+space kern +25, `[ ] { }` advances,
`Kv` `Ky` kerning. Advances otherwise pinned.

## Cycle 3 (unfinished): visual cleanup

Reason: the measurements pass but at 230 to 300 px beside Inter the heavy weights showed artefacts (ticks, nibs,
wedges, pointed counters). The sessions were told to render each glyph at 300 px beside Inter, look, fix, look again.
The judge's "jagged curves" finding was a crop artefact (downscaled crops facet); outlines are tangent-continuous.
View display crops at 1:1.

### `font-r4-b6` (curved strokes: `a c e g o s`, `C G O Q S`, `0 2 3 5 6 8 9`, `& @ $ € §`)

- Done: italic 900 `c` `e` lower terminal (flat cut, `_steepen`), italic `C`; `s` `S` nibs at opsz 14; italic 900 `a`
  (whole ring, oval counter), upright 900 `a` notch; italic `5` step and top-left notch; `o O Q 0` squarer at Black
  (`O_SQUARE`, `CAP_O_SQUARE`); `€` Black bars; italic `G` spur; italic `2` foot ledge.
- Not done: Black `3` bump; `s` nib and spine ticks at opsz 48; italic 700 `a` not checked by eye; italic `e` aperture
  at 700/800 not measured; italic `g` counter flat against the stem; italic `6` `9` corner at stem/bowl; italic bar ends
  of `2` `3` vertical; italic `3` lower terminal long.
- No tests written, no lint, no full tests. Italic `a c e` have new point counts (check master compatibility).
- Bytes vs `b491141c3`: full +100, Latin[wght] +204 (over), italic full −52, italic Latin[wght] +16.

### `font-r4-b7` (stems, tails, arches, diagonals, punctuation)

- Done: `l` tail one concave curve into a clean toe (white after `l` not re-measured); `t` inner corner, italic `f` tail
  and hook ends; Black `b d p q` mid-height point; `k` leg straight; italic `v w V W M A` spurs; `r` beak; `u` kink;
  italic `n h m u` counters; `z` `Z` bar ledge; italic `4` spur; bar steps in italic `E F L T Z z B D P R 7`.
- Half done: `f` hook vs crossbar (hook minus crossbar at 900 −16, 800 −1, 700 +14, 500 +43; 500 to 600 need Regular to
  change). `fi` closest row and `f)` white not re-measured (they were unfixable by kerning before: see `kern.py` notes).
- Not done: italic `b` foot notch; diagonal weights vs Inter; italic arch step at the stem top in `n h m`; italic `u`
  spike at the stem foot; Thin `LT` `T-`; Black `ft` at 800 to 900 (1.17× / 1.30× Inter's white).
- Tests not written (the measurements lived in a scratch script outside the repo). Italic `f` pocket 107 against a lint limit of 109.
- Bytes vs `b491141c3`: full +88, Latin[wght] +184 (over), italic full +60, italic Latin[wght] +72.

Both together put Latin[wght] near 25,900 against the 25,750 cap: bytes must be found (point reduction, fewer kerning
cells) or a redraw dropped. Do not raise a cap without asking the user.

## Next steps

1. Finish B6 and B7 (or one session on a merge of both): open items above, a test per fixed artefact in `test_font.py`,
   bytes under the caps, build, lint, full tests.
2. Merge into the work branch, regenerate `comparison.json` (`compare.py --cascivo-only`), rebuild (two builds, same
   bytes), set `BUDGETS` to built size rounded up to 100 within the caps, lint, full tests, commit source plus fonts.
3. Blind judge in a fresh session: main, rounds 1 to 3 and the final round 4 fonts under shuffled labels, one sitting,
   rubric and proof set from `JUDGING.md` only (the judge must not read the results sections), worst-place scoring,
   display crops at 1:1. Build earlier states from their commits and render with `src/proofs.cjs`.
4. If below target and time allows: repeat with the judge's ranked defect list.
5. Docs: `JUDGING.md` round 4 result and known limits (and the rubric row, if the user agrees), `CHANGELOG.md`,
   `README.md` if numbers changed. Then `pnpm fonts:site:sync && pnpm meta:check`, fontbakery, the gate sequence of
   `.github/workflows/fonts.yml`. Delete this file. Push. Open one PR with `gh`.

Known limits to record if they remain: `u`/`µ` arch test loosened to 24 px between masters (IUP tolerance drops some of
`u`'s Thin deltas; needs exact deltas per glyph in the build); `KERNING_SHORT` gained upright `Wa` and italic
`YA Ye Yc Yo` at 100; Bold `T V W X Y Z` not widened (600 gate); judge finds Thin spacing loose (rhythm proxy says the
opposite; the equal-width gate fixes Thin's width); `f` hook weak at 12 to 13 px; Cyrillic `Ч Ћ Ђ ђ` and Greek `α` on
the old arch.

## Environment

- Python: a venv from `fonts/cascivo-sans/requirements.txt`; run everything as `python -I`. A system Python without
  `uharfbuzz`, `ots` and `fontbakery` SKIPS gates silently (the width test among them).
- From `fonts/cascivo-sans`: build `python -I src/build.py` (2 min), lint `python -I src/lint.py` (4.5 min),
  tests `python -I -m unittest discover -s src` (12.5 min; `-k` for single tests), rhythm `python -I src/rhythm.py Inter.woff2`.
- Reference fonts and proofs: see "Proof set" in `JUDGING.md` (`node src/proofs.cjs ABSOLUTE_OUT_DIR --refs DIR`,
  needs Playwright on `NODE_PATH`; a relative out dir fails). Sheets are 3696 px wide: crop before viewing.
- Parallel shape sessions worked well in separate worktrees with source-only commits and an integration session that
  rebuilds; `glyphs.py` merges were conflict-free when sessions kept to their own glyph functions.

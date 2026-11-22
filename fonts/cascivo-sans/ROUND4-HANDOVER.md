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
- Tests not written. The session's measuring script is in appendix B: turn its checks into tests. Italic `f` pocket 107 against a lint limit of 109.
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

## Appendix A: blind judge result, sitting of 2026-11-22 (verbatim)

Label key: T = main, S = round 1, P = round 2, Q = round 3, R = round 4 at `2d808405d` (before the kerning refit, B3, B4, B5).
Two findings are not font defects: "jagged curves" (crop artefact, see above) and "width overrun" (owner decision 1).

# Cascivo Sans: blind review of builds P, Q, R, S, T

Scores are 0–10. Each criterion is scored at its worst place on its sheets.

## 1. Scores

| # | Criterion (weight) | P | Q | R | S | T |
|---|---|---|---|---|---|---|
| 1 | Rhythm and spacing (15) | 5.5 | 6.0 | 7.0 | 4.5 | 4.5 |
| 2 | Weight axis (12) | 5.5 | 6.5 | 6.0 | 5.5 | 6.0 |
| 3 | Shape and curve quality (15) | 5.0 | 5.5 | 6.0 | 5.0 | 5.0 |
| 4 | Proportions (8) | 6.0 | 6.0 | 6.5 | 6.0 | 6.0 |
| 5 | Joins, terminals, contrast (8) | 5.5 | 5.5 | 6.5 | 5.5 | 5.5 |
| 6 | Paragraph colour (12) | 7.0 | 7.0 | 7.5 | 7.0 | 6.5 |
| 7 | Small sizes (10) | 7.5 | 7.5 | 7.5 | 7.5 | 7.5 |
| 8 | Italic (8) | 5.0 | 5.5 | 6.5 | 4.5 | 4.5 |
| 9 | Kerning (5) | 6.5 | 6.0 | 6.0 | 6.5 | 7.0 |
| 10 | Optical sizes (4) | 6.0 | 6.0 | 8.0 | 6.0 | 6.0 |
| 11 | Character without gimmick (3) | 7.0 | 6.5 | 6.5 | 7.0 | 7.0 |
| | **Weighted total** | **5.9** | **6.2** | **6.7** | **5.7** | **5.8** |

**R scores highest.** The builds are identical at 400 and in the light weights. R is better mainly at 700 and 900: its heavy weights are open and evenly spaced, and its italic `z` is clean.

What brings the others down:
- **P and S:** at 700 and 900 the letters are condensed and set too tight, so the counters fill in.
- **S and T:** `( ) [ ]` collide at every weight, with `[]` fused at 700 and 900. In the 900 italic the heavy `z` has spurs and there is a hole in `ge f`.
- **Q:** its heavy weights are better than P's, but it has the `z` spurs, oversized `«»` and kerning holes at `f)` and `7,`.

## 2. Worst place for R, per criterion

1. **Rhythm:** on `spacing` at 100, `nnn` and `HHH` are looser than their counters. At 900, `minimum` is still a little tighter than Inter.
2. **Weight axis:** on `weights` at 800 and 900 (upright and italic), the width grows far past the 100–700 width, and "bold Jim" runs past the measure.
3. **Shape:** on `display` at 900, "Regal Shift" has jagged, faceted outlines on `S`, the `h` shoulder, `f`, `e` and `a`. The `a`, `e` and `c` counters at 900 are slits.
4. **Proportions:** on `glyphs_upright` at 700 and 900, `« »` are oversized and blocky. At 100, `%` is unbalanced (its lower zero is tiny).
5. **Joins:** on `glyphs_upright` at 900, the inner bowl-to-stem joins of `b` and `d` are kinked and flat, and the crotches of `k` and `w` are heavy.
6. **Paragraph colour:** on `text` at 16 and 13 px, weight 600, `off` shows a hole between the two `f`s.
7. **Small sizes:** on `small_1x` at 12 px, weight 400, the `f` in "of" has a weak hook and reads close to `t`. Otherwise `Il1 O0` stay clean.
8. **Italic:** on `weights` and `glyphs_italic` at 900i, the `e` and `f` of `gef` collide, and the `k` crotch clots.
9. **Kerning:** on `kerning` at 900, `f)` and `7,` leave holes. At 100, `LT` and `T-` are loose.
10. **Optical sizes:** on `opsz` at 900, opsz 8, the counters of `a` and `e` are still pinched. Opsz 48 does not touch.
11. **Character:** the blocky `«»` at 700 and 900 call attention to themselves. The family is otherwise consistent: serifed `I`, tailed `l`.

## 3. Defects in R, ranked

1. **Jagged curves** — `display` and `glyphs_*` at 900: `S`, `h`, `f`, `e`, `a`, `2`, `6`. The outlines are stair-stepped and faceted. **Fix:** rebuild the heavy-master curves with fewer on-curve points and tangent-continuous handles. *Heavy-only.*
2. **Black width overruns** — `weights` at 800 and 900, upright and italic. The width grows well beyond ±5%. **Fix:** narrow the 800 and 900 masters and put the added weight inside the letters, not into width. *Heavy-only.*
3. **Closed counters** — `glyphs_upright` at 900: `a`, `e`, `c`, `g`, `G`. Counters are teardrops and the apertures of `e` and `c` are nearly shut. **Fix:** thin the horizontals and the joins, and open the apertures. *Heavy-only.*
4. **`e` and `f` collide** — `glyphs_italic` and `weights` at 900i, in `gef`. The `e` runs into the left arm of the `f` crossbar. **Fix:** shorten the crossbar's left arm or add space to the italic `f` LSB, and add an `e`–`f` kern. *Heavy-only.*
5. **Kinked `b` and `d` counters** — `glyphs_upright` at 900. The inner contour flattens or kinks where the bowl meets the stem. **Fix:** redraw the inner join as a smooth curve, possibly with a small ink trap. *Heavy-only.*
6. **Oversized guillemets** — `glyphs_*` at 700 and 900, `« »`. They are too big and too blocky. **Fix:** scale them down, centre them on the x-height, and lighten them. *Heavy-only.*
7. **Kerning holes** — `kerning`: `f)` and `7,` at 900; `LT` and `T-` at 100. **Fix:** add kern pairs, or a kern class for the `f`–closing-bracket and figure–comma pairs. *All weights.*
8. **`ff` hole** — `text` at 600, 16 and 13 px, in `off`. **Fix:** kern `f`–`f`, or add an `ff` ligature or contextual alternate. *Heavy-only.*
9. **`e` crossbar overshoots** — `glyphs_upright` at 700 and 900. The bar sticks out past the bowl, which leaves a notch. **Fix:** trim the bar to the bowl contour. *Heavy-only.*
10. **`g` tail notch** — `glyphs_upright` at 900, most visible there. There is a step on the inner corner of the descender terminal. **Fix:** smooth the terminal. *All weights.*
11. **`a` bowl too flat** — `glyphs_upright` at 100 and 400. The top of the bowl is a flat straight segment into the stem, and there is a spur at the bottom join. **Fix:** redraw the bowl's top as a curve and make the join tangent. *All weights, worst in the light weights.*
12. **Thin set too loose** — `spacing` at 100. The space between letters is larger than the space inside them. **Fix:** tighten the 100 master's sidebearings by about 5–8%. *Light-only.*
13. **Weak `%`, `?`, `!` at Thin** — `glyphs_upright` at 100. The lower zero of `%` is too small, and the dots of `?` and `!` are tiny squares. **Fix:** rebalance `%` and enlarge the dots. *Light-only.*
14. **Faceted `2`, `6` and `f`** — `display` at 900. The head of `2`, the terminal of `6` and the hook of `f` are faceted. **Fix:** redraw them with a continuous curve and a cleaner cut angle. *Heavy-only.*
15. **Weak `f` hook at small sizes** — `small_1x` and `text` at 12–13 px, in "of" and "craft". The hook is too short, so `f` reads like `t`. **Fix:** lengthen the hook a little in the low-opsz master. *All weights.*

## 4. What separates R from a 9

- **Rhythm (7):** the 100 needs tighter spacing, and the 900 needs to come up to Inter's evenness.
- **Weight axis (6):** the Black has to stay open without growing beyond about 5% in width.
- **Shape (6):** this is the biggest gap. The 900 curves are jagged and faceted, the counters are slits, and `b`, `d` and `g` have kinks. Inter has none of these.
- **Proportions (6.5):** `«»` and `%` need resizing.
- **Joins (6.5):** the heavy crotches and the inner bowl joins need lightening and smoothing.
- **Paragraph colour (7.5):** only the `ff` and `f`-hook issues stand between it and Inter's grey.
- **Small sizes (7.5):** clean, but the `f` hook and the light `a` keep it below Inter.
- **Italic (6.5):** the `gef` collision and the 900 crotches.
- **Kerning (6):** the class kerning around `f`, figures and `T`/`L` is incomplete.
- **Optical sizes (8):** the opsz 8 counters need opening.

## Appendix B: B7's measuring script (scratch, paths are the old machine's)

```python
import sys, math
sys.path.insert(0,'/home/adam/.local/share/opencode/worktree/d59dfa/font-r4-b7/fonts/cascivo-sans/src')
from fontTools.ttLib import TTFont
from test_font import ink_rows
S = math.tan(math.radians(10))
D = {'base': '/tmp/opencode/b7/base/', 'new': '/home/adam/.local/share/opencode/worktree/d59dfa/font-r4-b7/fonts/cascivo-sans/fonts/'}
C = {}
def gs(which, it, w, opsz=14):
    k = (which, it, w, opsz)
    if k not in C:
        f = TTFont(D[which] + ('CascivoSans-Italic[opsz,wght].ttf' if it else 'CascivoSans[opsz,wght].ttf'))
        C[k] = (f.getGlyphSet(location={'wght': w, 'opsz': opsz}, normalized=False), f.getBestCmap())
    return C[k]
def rows(which, it, w, ch, opsz=14):
    g, cmap = gs(which, it, w, opsz)
    n = cmap[ord(ch)] if len(ch) == 1 else ch
    r = dict(ink_rows(g, n))
    if it:
        r = {y: [(a - (y - 264) * S, b - (y - 264) * S) for a, b in v] for y, v in r.items()}  # unslant about mid x-height
    return r
def l_tail(which, it):
    r = rows(which, it, 900, 'l')
    re = {y: r[y][-1][1] for y in r if r[y]}
    stem = sorted(re[y] for y in range(300, 500))[100]
    toe = max(re[y] for y in range(0, 40))
    mono = max(re[y + 1] - re[y] for y in range(0, 300))
    span = sum(1 for y in range(0, 300) if stem + 3 < re[y] < toe - 3)
    return dict(rise=round(mono, 1), span=span)
def t_corner(which, it):
    r = rows(which, it, 900, 't')
    re = {y: r[y][0][1] for y in r if r[y]}
    stem = sorted(re[y] for y in range(200, 300))[50]
    foot = max(re[y] for y in range(10, 60))
    span = sum(1 for y in range(0, 300) if stem + 2 < re[y] < foot - 2)
    return dict(fillet=span)
for which in ('base', 'new'):
    print(which, 'l', l_tail(which, 0), l_tail(which, 1), 't', t_corner(which, 0), t_corner(which, 1))
def f_hook(which, w):
    r = rows(which, 0, w, 'f')
    hook = max(v[-1][1] for y, v in r.items() if y > 560 and v)
    bar = max(v[-1][1] for y, v in r.items() if 400 < y < 520 and v)
    return round(hook - bar, 1)
def f_tail(which):
    r = rows(which, 1, 900, 'f')
    ys = [y for y in r if y < -2 and r[y]]
    lo = min(ys)
    xs = [r[y][0][0] for y in range(lo + 3, lo + int(0.6 * (0 - lo)))]
    return round(max(xs) - min(xs), 1)
def k_leg(which, it):
    r = rows(which, it, 900, 'k')
    # leg left edge: on rows 20..200, the second run's left end (stem is the first run)
    pts = [(y, r[y][1][0]) for y in range(10, 180) if len(r[y]) >= 2]
    (y0, x0), (y1, x1) = pts[0], pts[-1]
    dev = max(abs(x - (x0 + (x1 - x0) * (y - y0) / (y1 - y0))) for y, x in pts)
    return round(dev, 1)
def r_beak(which, it):
    r = rows(which, it, 900, 'r')
    face = max(v[-1][1] for y, v in r.items() if v)
    yf = min(y for y, v in r.items() if v and v[-1][1] >= face - 2)
    yin = min(y for y, v in r.items() if v and any(a <= face - 40 <= b for a, b in v))
    return yin - yf
def z_ledge(which, it, ch, w=900):
    r = rows(which, it, w, ch)
    left = min(v[0][0] for y, v in r.items() if 2 < y < 60 and v)
    g, _ = gs(which, it, w)
    # find bar top: highest row y<250 whose run starts at left (+-2)
    top = max(y for y, v in r.items() if y < 250 and v and v[0][0] <= left + 2)
    return round(r[top + 3][0][0] - left, 1)
def feet(which, it, ch, w=900):
    r = rows(which, it, w, ch)
    worst = 0
    n = len(r[2])
    for i in range(n):
        xs = [r[y][i][0] for y in range(1, 40) if len(r[y]) == n]
        worst = max(worst, max(b - a for a, b in zip(xs, xs[1:])))  # left ends should only move left going up for \ edges... report the largest rightward step
    return round(worst, 1)
def bars(which, ch):
    r = rows(which, 1, 900, ch)
    ys = [y for y, v in r.items() if v]
    return min(ys), max(ys)
for which in ('base', 'new'):
    print(which, 'f hook-bar', [f_hook(which, w) for w in (500, 600, 700, 800, 900)], 'f tail tip spread', f_tail(which))
    print(which, 'k leg dev', k_leg(which, 0), k_leg(which, 1), 'r beak', r_beak(which, 0), r_beak(which, 1))
    print(which, 'z ledge', [z_ledge(which, it, ch) for it in (0, 1) for ch in 'zZ'])
    print(which, 'bars', {ch: bars(which, ch) for ch in 'EFLTZzBDPR7'})
def spur(which, it, ch, w=900, top=False):
    """largest step of a vertex run's left/right end against its neighbours in the 30 rows at the foot (or the apex): a spur is a
    row whose run reaches further out than the edge line through the rows above it"""
    r = rows(which, it, w, ch)
    ys = sorted(y for y, v in r.items() if v)
    band = ys[-30:] if top else ys[:30]
    out = 0
    for y in band:
        pass
    # per run index (same count across the band)
    n = min(len(r[y]) for y in band)
    for i in range(n):
        for side in (0, 1):
            xs = [r[y][i][side] for y in band]
            # second difference: an edge line has none; a spur shows as a jump at the band's end
            d = [xs[j + 1] - xs[j] for j in range(len(xs) - 1)]
            out = max(out, max(abs(d[j + 1] - d[j]) for j in range(len(d) - 1)))
    return round(out, 1)
for which in ('base', 'new'):
    print(which, 'feet', {ch: spur(which, 1, ch) for ch in 'vwVWMA'}, 'apex', {ch: spur(which, 1, ch, top=True) for ch in 'wA'})
    print(which, 'up feet', {ch: spur(which, 0, ch) for ch in 'vwVWMA'})
def spur2(which, it, ch, w=900, top=False):
    r = rows(which, it, w, ch)
    ys = sorted(y for y, v in r.items() if v)
    y_end = ys[-2] if top else ys[1]
    fit = [y_end - k for k in range(12, 36)] if top else [y_end + k for k in range(12, 36)]
    n = len(r[y_end])
    if any(len(r[y]) != n for y in fit):
        return None
    out = 0
    for i in range(n):
        for side, sgn in ((0, -1), (1, 1)):
            pts = [(y, r[y][i][side]) for y in fit]
            (ya, xa), (yb, xb) = pts[0], pts[-1]
            pred = xa + (xb - xa) * (y_end - ya) / (yb - ya)
            out = max(out, sgn * (r[y_end][i][side] - pred))
    return round(out, 1)
for which in ('base', 'new'):
    print(which, 'feet', {ch: spur2(which, 1, ch) for ch in 'vwVWM'}, 'apex', {ch: spur2(which, 1, ch, top=True) for ch in 'A'})
    print(which, 'up feet', {ch: spur2(which, 0, ch) for ch in 'vwVWM'}, {ch: spur2(which, 0, ch, top=True) for ch in 'A'})
```

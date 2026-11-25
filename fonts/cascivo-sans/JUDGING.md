# Judging Cascivo Sans

How each polish round is scored. Every round renders the same proofs, scores them with the same
rubric, and passes every gate below. The baseline was measured on 2026-11-21, version 0.6.1 plus
Unreleased.

## Proof set

```sh
# References: Inter, Geist, IBM Plex Sans (variable woff2, Latin) from npm
mkdir -p /tmp/refs && cd /tmp/refs
for p in inter geist ibm-plex-sans; do npm pack -s @fontsource-variable/$p; done
for t in *.tgz; do tar xzf $t; cp package/files/*-latin-{opsz,wght}-*.woff2 . 2>/dev/null; rm -r package; done
cp inter-latin-opsz-normal.woff2 Inter.woff2; cp inter-latin-opsz-italic.woff2 InterItalic.woff2
cp geist-latin-wght-normal.woff2 Geist.woff2
cp ibm-plex-sans-latin-wght-normal.woff2 Plex.woff2; cp ibm-plex-sans-latin-wght-italic.woff2 PlexItalic.woff2
cd -
node src/proofs.cjs OUT_DIR --refs /tmp/refs   # 10 PNG sheets, Chromium via Playwright
python3 -I src/rhythm.py /tmp/refs/Inter.woff2 /tmp/refs/Geist.woff2 /tmp/refs/Plex.woff2
```

`proofs.cjs` sets Cascivo, then Inter, Geist, Plex and Helvetica\* in rows. Helvetica\* is
Helvetica if it is installed, else Liberation Sans, which has Helvetica's metrics. Geist has no
italic, so it is left out of the italic rows. Use font versions 5.3.0 or later from npm. Write the
sheets of each round to a new directory and keep the earlier rounds' sheets, so that you can
compare them.

| Sheet            | Content                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `glyphs_upright` | a-z, A-Z, figures and punctuation at 64 px; 400, 700, 900, 100                          |
| `glyphs_italic`  | the same in italic (Cascivo, Inter, Plex)                                               |
| `weights`        | one sentence at 44 px, the weights 100 to 900, upright and italic (Cascivo only)        |
| `opsz`           | one string at 48 px with opsz forced to 8, 11, 14, 24, 32 and 48; at 300, 400 and 900   |
| `spacing`        | `nnnonnnooo HHHOHHHOOO minimum illumination 1100110 Il1\|`; 100 to 900; italic 400, 900 |
| `kerning`        | `AVATAR To Ty Wa We LT PA F. P, y. r. Yo “A” Kv 7, f) T- LY`; 100, 400, 900; italic     |
| `ambiguity`      | `Il1\| O0o rn m cl d vv w 5S 2Z 8B 6b 9g q`; 300, 400, 700                              |
| `text`           | a paragraph, 560 px measure, 16 and 13 px at 300, 400 and 600, italic 16 px; opsz auto  |
| `display`        | `Regal Shift 2026` at 120 px; 100, 400, 900                                             |
| `small_1x`       | interface strings at 11 to 14 px and a 12 px paragraph, DPR 1 (all other sheets DPR 2)  |

## Rubric

Give each criterion a score from 0 to 10. The total is the weighted mean. The scores mean:
10 = a professional type designer finds nothing to correct; 8 = shippable retail quality, with
only small corrections; 6 = good, but with defects that a designer sees immediately; 4 = defects
that a reader notices. Score each criterion at the worst place on its sheets, not at the average.

| #   | Criterion (weight)             | Sheet: what to look at                                                                                                                         | Measurable proxy                                                                                                                                                              |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rhythm and spacing (15)        | `spacing`, `glyphs_*`: is the white between letters equal to the white inside them, and the same at every weight? Look for `nnn`, `HHH`, `oo`. | `rhythm.py`: the n gap/counter ratio at 100, 400, 700 and 900. 10 = flat, within ±0.06 of Inter (0.56-0.64). Subtract 1 for each 0.05 that 700 or 900 falls below 0.50        |
| 2   | Weight axis (12)               | `weights`: do the weights step evenly? Do the heavy weights stay open? Does the width hold?                                                    | `test_font.py` (stem steps 20-22, width within ±2% of Regular from 100 to 600, up to +4% at 700 and +10% at 900, linear between, never under −2%); `rhythm.py` at 700 and 900 |
| 3   | Shape and curve quality (15)   | `glyphs_*` at 64 px and `display`: smooth curvature, no flats or kinks, open counters, balanced `a e g s S G R 2 3 5 6 9 &`                    | `lint.py` / `quality.py` (joins, notches, counters, terminals) must pass. The proxy is a floor only: judge by eye                                                             |
| 4   | Proportions (8)                | Caps, lowercase and figures together: x-height and cap widths, round against straight, figure widths, punctuation size                         | `compare.py --cascivo-only` (x-height, widths against `comparison.json`)                                                                                                      |
| 5   | Joins, terminals, contrast (8) | Bowl-to-stem joins at 700 and 900, terminal cuts, crotches of `v w y k x`                                                                      | `quality.py` (join_ratio, CUT_MAX_DEG, notch)                                                                                                                                 |
| 6   | Paragraph colour (12)          | `text`: even grey, no dark spots or holes, word space against letter space; compare with Inter in the row below                                | None. Squint at it, or blur it 3 px, and look for blotches                                                                                                                    |
| 7   | Small sizes (10)               | `small_1x` enlarged 3x with nearest-neighbour: `Il1 O0`, `e c a s` stay open, 600 does not clot                                                | `test_font.py` (opsz stem gates); README Light ink against Inter 0.94-0.99                                                                                                    |
| 8   | Italic (8)                     | `glyphs_italic`, `weights` italic, italic `text`: flow, the `f` and `l` tails, spacing, counters at 900                                        | `rhythm.py` on the italic TTF (400: 0.58, 900: 0.30)                                                                                                                          |
| 9   | Kerning (5)                    | `kerning`: no holes or collisions, the same at 100, 400 and 900                                                                                | `test_font.py` (pairs at least 0.8x Inter's, `KERNING_SHORT`)                                                                                                                 |
| 10  | Optical sizes (4)              | `opsz`: a monotone, smooth change from 8 to 48; 48 is tight but not touching                                                                   | `test_font.py` (opsz stems)                                                                                                                                                   |
| 11  | Character without gimmick (3)  | All sheets: does it look like one family, quiet, with a clear identity (`l` tail, serifed `I`)? Does any feature call attention to itself?     | None                                                                                                                                                                          |

## Numeric scorer and tuner

`src/score.py` is a fast stand-in for the blind judge (about 7 s, no model calls). It compares the
built font with Inter, Geist and Plex (the `/tmp/refs` files above) at wght 100 to 900:

```sh
python3 -I src/score.py [--italic] [--json] [--refs /tmp/refs]   # one summary line + the 10 worst rows
python3 -I src/tune.py --param HEAVY_TIGHTEN --range 0.45:0.60 --steps 5   # prints best value and delta
```

Metrics: ink-density CV (colour), counter/ink area per glyph, HT-style gap/counter ratio over 24
pairs (rhythm), 2nd difference of advances and stems over the weights, pixel IoU of `O/0 I/l/1 rn/m
cl/d` at 11 and 12 px, opsz 14 to 32 spacing and x-height delta against Inter (Inter's opsz stops
at 32), kinks at smooth on-curve points, overshoot. Each value is a z-score against the references'
mean and spread (spread floored); |z| inside 0.5 is free; an item is 10 minus 2 times the excess
(30% mean, 70% 90th percentile). `I G l` (the identity glyphs) are left out. Items map to rubric
rows 1, 2, 3, 6, 7 and 10; 4, 5, 8, 9 and 11 are not scored numerically.

`tune.py` sweeps named constants (`NAME` or `NAME.KEY` in `params.py`, `glyphs.py`, `build.py`),
builds the upright font only, scores every grid point in parallel (about 45 s), then runs the
gates (`test_font.py` plus the full woff2 budget) on the best point, next best on a failure
(about 9 min). `--no-gates` skips them. It writes nothing; copy the printed value into the source,
then run the full gates above. Tests: `python3 -I src/test_score.py`.

Calibration, from the fonts committed at each commit (0.6.1 `5e450f8d`, round 4 `a27d7610`, round
5 `59f5fcf4`): the scorer ranks R5 > R4 > 0.6.1 as the blind judge does (6.84 / 6.69 / 5.09).
Upright 8.14 / 8.11 / 7.53, upright and italic mean 8.04 / 8.01 / 7.60; Pearson r = 0.999 (upright)
and 1.00 (mean), on three points. The range is compressed (0.6 against 1.75 points) and R5 over R4 is a +0.03 step,
inside the noise: trust the sign of a change, not its size. Optical sizes stay at 2.8 in all three
(x-height delta 14 to 32 is -5 units against Inter's -30), which is defect 8, not a scorer error.

## Must not regress

The advantages and their gates. All of them must pass in each round (`.github/workflows/fonts.yml`):

```sh
cd fonts/cascivo-sans
pip install -r requirements.txt
python3 -I src/build.py && git diff --stat -- fonts/   # deterministic: commit what the build writes
python3 -I src/lint.py                                 # strict: self-intersections + Latin quality checks
python3 -I -m unittest discover -s src                 # budgets, interpolation, kerning, coverage, features, OTS
fontbakery check-universal "fonts/CascivoSans[opsz,wght].ttf" "fonts/CascivoSans-Italic[opsz,wght].ttf"  # 0 FAIL
cd ../.. && pnpm fonts:site:sync && pnpm meta:check     # the site copies must match the build
```

- **Size budgets** (`BUDGETS` in `test_font.py`, woff2 bytes). These are nearly used up:
  Latin[wght] 24,944/25,000, full 74,380/74,500, italic full 81,332/81,500. A round that adds
  points or masters must first find bytes elsewhere. To raise a budget is an owner decision.
- **Unambiguous `Il1`** (with the serifed `I` and the tailed `l`, and `ss02` for the plain forms),
  and `O0` (the zero narrower than the O). Check them on `ambiguity` and `small_1x`.
- **Axes**: opsz 8-48 and wght 100-900, upright and a drawn italic (single-storey `a`, descending
  `f`). One rule: a master may move points, but it must never change how many strokes or
  segments a glyph has.
- **Features**: `tnum zero ss01 ss02 onum lnum frac sups sinf ordn case locl kern mark mkmk ccmp`.
- **Script coverage**: Latin Extended-A, Vietnamese, Cyrillic (`locl` bg, sr, mk), Greek
  (polytonic). Every shape change to a Latin base must be checked in its accented, Cyrillic and
  Greek forms.
- **Width across weights**: within ±2% of Regular from 100 to 600; up to +4% at 700 and +10% at 900, linear
  between; never under −2% (owner decision, round 4; it was ±2% to 700 and ±5% at 800 and 900). The old rule was
  the cause of defect 1. To relax it further is an owner decision.

## Baseline (0.6.1 + Unreleased)

`rhythm.py`, n gap/counter (100 / 400 / 700 / 900):

| Font                  | 100  | 400  | 700  | 900  |
| --------------------- | ---- | ---- | ---- | ---- |
| Cascivo               | 0.50 | 0.53 | 0.38 | 0.30 |
| Cascivo Italic        |      | 0.58 |      | 0.30 |
| Inter                 | 0.56 | 0.60 | 0.62 | 0.64 |
| Geist                 | 0.49 | 0.55 | 0.65 | 0.78 |
| Plex (700 is its max) | 0.64 | 0.68 | 0.80 | 0.80 |

| #   | Criterion          | Score   | Why                                                                                                   |
| --- | ------------------ | ------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Rhythm             | 6       | 100 to 400 are close to Inter. 700 and 900 clot: `mn`, `hij`, `HI`, `MN` almost touch                 |
| 2   | Weight axis        | 6       | The steps are even and the width holds (a real advantage), but 800 and 900 go black and blotchy       |
| 3   | Shape              | 7       | 400 is clean and close to Inter. Black `a e g s 4 6 9 A B` counters pinch; the parentheses are stiff  |
| 4   | Proportions        | 7       | Harmonious at 400. The parentheses and brackets are too tall and narrow; `@` is small                 |
| 5   | Joins / terminals  | 7       | Tangent joins are good. Black `a` mouth is a slot; the Black `l` tail runs into the next letter       |
| 6   | Paragraph colour   | 8       | 16 and 13 px at 400 are as even as Inter's. 600 is denser                                             |
| 7   | Small sizes        | 8       | 11 to 14 px are crisp, and `Il1` is clear. 600 at 11 px is cramped against Inter                      |
| 8   | Italic             | 6       | 400 flows well. At 600 to 900 there is a hole before `f` (`ge fon`, `wa fting`); the `l` reads as `(` |
| 9   | Kerning            | 7       | Good at 400 and 900. The Thin W and V pairs are short (`KERNING_SHORT`)                               |
| 10  | Optical sizes      | 7       | Smooth from 8 to 32. 48 is untuned, and Black 48 nearly touches                                       |
| 11  | Character          | 7       | Quiet, and the `l` tail and serifed `I` give it an identity. The Black serifed `I` looks crude        |
|     | **Weighted total** | **6.9** |                                                                                                       |

## Defects, ranked

The most important defects are first. The weights are wght, with opsz 14 unless stated.

1. **Heavy weights clot** (700 to 900, upright and italic; `n m h u a e o d b p q s c`, all caps).
   The gap/counter ratio is 0.38 / 0.30 against Inter's 0.62 / 0.64. The letter bodies keep their
   Regular width while the stems grow, so the sidebearings pay for the weight. Fix: condense the
   heavy bodies (counters about 5% narrower at 700 and 10-12% at 900) and give the units back as
   sidebearings. Keep the advance. Target ≥ 0.50 at 900. The counter guards (`COUNTER_MIN_SHARE`,
   the capital counter curves) must allow narrower and taller counters. They must not forbid
   them.
2. **Black counters and apertures close** (`a` slot, `e` eye, `g` bowl, `s`, `4 6 8 9`, `A B R P`,
   `&`). Fix: thin the bowl-to-stem joins more at 900 (more contrast in the joins), lower the `e`
   bar, open the `a` mouth, and make the `4` crotch smaller. Do this together with defect 1, not
   after it.
3. **Italic `f` hole** (italic 600 to 900, any letter before `f`). The descending hook pushes the
   `f` to the right, so `ef`, `af` and `gef` read as two words. Fix: reduce the `f` LSB at the heavy
   masters, or tuck the hook under the previous letter, and add a left-side `f` kerning class.
4. **Italic `l` tail** (italic 700 and 900). The `l` reads as `(` and touches the next letter
   (`klm`). Fix: a shorter, flatter tail at the heavy masters, and more RSB.
5. **Parentheses and brackets** (all weights; `( ) [ ] { }`). They are tall, narrow, with almost
   straight sides and tight sidebearings. `!(`, `)[` and `][` cluster, and at 900 they touch.
   Fix: a wider curve on `( )` (Inter's ratio), more sidebearing, and the same for `[ ]`.
6. **Upright `l` tail at Black** touches `m`, `l` and `u` (`lm`, `ll` in `illumination`). Fix: as
   for defect 4, at the upright heavy masters.
7. **Black capital spacing** (`HI MN EF IJ PQ ST`). The gap is about half of Inter's. Fix: this
   follows from defect 1 for capitals: narrower capital bodies at 900, and the units go back to
   the sidebearings.
8. **Optical size 48** is untuned. Black 48 nearly touches (`0123Rag`). Fix: Display spacing of
   0.88 is too tight at 900. Use 0.92 to 0.95 at heavy weights only, or apply the Display master
   only from 32.
9. **Thin W and V kerning** (`KERNING_SHORT`). Fix: Thin-specific values. Measure the
   `kern_oracle` again on the Thin outlines.
10. **Black serifed `I`** (700 to 900). The slabs are long and heavy, and look crude next to
    `H J`. Fix: shorter and thinner serifs at the heavy masters. Keep `I` distinct from `l`.
11. **Small details**: the `G` spur and bar join at 900; the `Q` tail is short at 400; `@` is
    smaller than Inter's and sits low; the Black quote marks bunch (`“”‘’`); the `5` has a swell
    at its foot at Black; the 400 `a` bowl is a little small and low; Caption Black counters are
    1.5-5% smaller than Text Black's; the Thin comma below on `ș ț` is short; Cyrillic `Ч Ћ Ђ ђ`
    and Greek `α` use the old arch.

## Rounds

Each round ends with the proof sheets, the scores against this rubric and the gates, and a
changelog entry.

| Round | Theme                                                                                                                                     | Defects                                  | Target |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| 1     | Structure and rhythm: condense the heavy bodies, open the Black counters, fix the italic `f` hole and the `l` tails. Find the bytes first | 1, 2, 3, 4, 6                            | 7.8    |
| 2     | Spacing, kerning, weight and opsz, italic: punctuation shape and spacing, capital spacing at Black, opsz 48, Thin kerning, italic again   | 5, 7, 8, 9, italic counters after 1 to 2 | 8.6    |
| 3     | Polish, small sizes and the extremes: the details at Thin and Black, `small_1x` at 600, Cyrillic and Greek                                | 10, 11                                   | 9.2    |

A round passes when it meets its target, when no criterion is lower than its baseline, and when
`rhythm.py` at 900 is at least 0.45 after round 1 and at least 0.50 after round 2.

## Round 1 result

Scored by an independent reviewer from the proof sheets (before / after), on 2026-11-21. `rhythm.py` gives 100: 0.50,
400: 0.53, 700: 0.46, 900: 0.47. Italic 900 is unchanged at 0.30.

| #   | Criterion          | Before  | After   | Note                                                                                                     |
| --- | ------------------ | ------- | ------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Rhythm             | 6       | 7       | `mn HI MN lm` no longer touch at 700 and 900. Still under 0.50                                           |
| 2   | Weight axis        | 6       | 6       | Width holds. 800 and 900 are still dark, because the counters gave up white too                          |
| 3   | Shape              | 7       | 7       | Black `e a g` counters are still pinched                                                                 |
| 4   | Proportions        | 7       | 7       | No change                                                                                                |
| 5   | Joins / terminals  | 7       | 7       | The Black `l` tail is shorter. The `a` slot is not changed                                               |
| 6   | Paragraph colour   | 8       | 8       | No change                                                                                                |
| 7   | Small sizes        | 8       | 8       | No change                                                                                                |
| 8   | Italic             | 6       | 6       | The 900 `f` hole is closed. At 700 it is smaller, but it is still there. Italic counters are not trimmed |
| 9   | Kerning            | 7       | 7       | 900 `AR` is fixed. Black `Y` + round letters kern a little harder                                        |
| 10  | Optical sizes      | 7       | 8       | Black 48 no longer nearly touches                                                                        |
| 11  | Character          | 7       | 7       | No change                                                                                                |
|     | **Weighted total** | **6.9** | **7.1** | Target 7.8 not met. 900 ≥ 0.45 is met, and no criterion is under its baseline                            |

Fixed: Black lowercase counters 20 units narrower (`CN_TRIM`). The units went to the sidebearings, so the advance did not
change (`HEAVY_TIGHTEN` 0.36, `BOLD_TIGHTEN` 0.25, `CH_BLACK` 280). `m a K` keep their full width and `e g` keep half.
The italic `f` moves left at the heavy weights. The `l` tail is shorter and has more RSB at Black. A new test holds the
700 and 900 ratio at 0.45 or more. Bytes went down (Latin[wght] 24,808).

Why the target was missed:

- The italic trim failed the join-angle gate. A trim of 5 to 12 units put the h and u joins 1 to 6 degrees under the
  floor, and the `s` tips turned sharper.
- A larger upright trim made the `m` and `a` joins fail.
- The sidebearings cannot grow without a narrower body, because of the width gates: Bold "Signals" is at +1.8% against
  a 2% limit, and Black is at +4.5% against 5%.

Re-ranked defects for rounds 2 and 3:

1. Black counters `e a g s 4 6 9 &`. Open them with thinner joins and bars at 900 (defect 2), not with width.
2. Italic heavy rhythm: italic 900 is still 0.30. Redraw the italic arch joins so that they keep their angle when they
   are narrower, then trim the italic as the upright is trimmed.
3. The rest of the italic `f` hole at 600 to 700, and the italic `kl`.
4. Upright 700 and 900 rhythm from 0.47 to 0.50 or more (round 2 gate). This needs 1 and 2 first.
5. Then the round 2 and 3 items as listed: parentheses (5), Black capitals (7), opsz 48 (8), Thin W/V (9), serifed `I` (10), details (11).

## Round 2 result

Scored blind by an independent reviewer on 2026-11-21, from the round 1 and round 2 proof sheets and the rubric only. This
reviewer is stricter than round 1's (it gives the round 1 sheets 5.8, not 7.1), so compare the two columns, not the rounds.
`rhythm.py`: upright 0.50 / 0.53 / 0.47 / 0.53, italic 0.57 / 0.58 / 0.50 / 0.47 (round 1: italic 700 0.39, 900 0.30).

| #   | Criterion          | Before  | After   | Note                                                                                                     |
| --- | ------------------ | ------- | ------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Rhythm             | 4       | 5       | Italic 900 `HHH`, `mini` no longer fuse. Upright 800 and 900 are still too tight (gap a third of a stem) |
| 2   | Weight axis        | 5       | 5.5     | 100 to 700 step evenly and the width holds. 900 still reads as one mass                                  |
| 3   | Shape              | 6       | 6.5     | The brackets are no longer boxes and wedges. Black `e a s g 8 & B` still read small                      |
| 4   | Proportions        | 6.5     | 7       | Parentheses have Inter's width and the brackets' height. Black is more condensed than Inter Black        |
| 5   | Joins / terminals  | 6.5     | 6.5     | No change: Black `v w y` crotches fill, the `l` tail is cramped at 900                                   |
| 6   | Paragraph colour   | 7       | 7.5     | `(a, b; c)` is no longer cramped. Commas, semicolon and quotes are dark spots at 400                     |
| 7   | Small sizes        | 7.5     | 8       | At 12 px the parentheses keep their curve                                                                |
| 8   | Italic             | 4       | 5.5     | 900 is tight but separated (`hij lm qr rs` touched). `ll` tails still crowd the next letter              |
| 9   | Kerning            | 6       | 6.5     | `f)` is clear at 900. `AVATAR` and `Kv` still touch at 900                                               |
| 10  | Optical sizes      | 6.5     | 6.5     | No change: Black at opsz 32 to 48 touches                                                                |
| 11  | Character          | 7       | 7.5     | The box brackets are gone. The blocky Black quotes call attention to themselves                          |
|     | **Weighted total** | **5.8** | **6.4** | Target 8.0 not met. 900 >= 0.50 is met, and no criterion went down                                       |

Fixed (redrawn, not tuned):

- The italic's Black arches `n h m u r`: the crown leans toward the stem the arch leaves, on a taller near quarter
  (`glyphs._arch`, `ARCH_LEAN`). The far quarter is wider, so the ceiling still meets both stems round when the body narrows.
  The italic then takes the upright's rebalance (`CN_TRIM_ITALIC` 20, `HEAVY_TIGHTEN_ITALIC` 0.36, `BOLD_TIGHTEN_ITALIC` 0.25).
- Black `e` bar (eye 0.78x to 1.03x Inter's), Black `A` diagonals and bar (counter 0.57x to about 0.9x), lighter bowl tops and
  bottoms on `b d p q 6 9`. Measured as a share of the x-height squared, `o a g 8 0 4 R P B D` were at 1.0x to 1.6x Inter's
  already: they read small because the letters are narrower, not because the joins are heavy.
- Upright Black: trim 26, `HEAVY_TIGHTEN` 0.30 (0.47 to 0.53).
- Parentheses redrawn (a bow 123 deep; 209 wide at Regular, Inter 211), `( ) [ ] { }` at Inter's 908, wider sidebearings.
- Italic `f` closer at 600 to 700; the italic Black `l` foot is longer and flatter.
- New gates in `test_font.py`: rhythm floors (upright 900 0.50, italic 700 and 900 0.45), Black counters against Inter
  (`e 6 9 b d p q A`), parenthesis width and bracket heights.

Why the target was missed, and what needs the owner:

- **Owner decision: the width gate blocks Black spacing and counters.** `test_weight_changes_do_not_reflow_text` (+5% at 800
  and 900, +2% to 700) is what the reviewer's first two defects come from: at a fixed advance the sidebearings can grow
  only by what the counters give up, and the counters are already the reviewer's second defect. Inter runs to 1.08x its
  Regular width at Black and Geist to 1.11x (the test's own note); Cascivo is held to 1.05x. Bold's 0.47 is held the same way
  (+1.8% of the 2%). A wider limit at 800 and 900 is the only way left to both.
- **Owner decision: the join-angle gate blocks thinner upright arch joins.** `quality.py` asks the counter's ceiling to meet
  the stem within 10 deg of Inter's (29 deg for the Black `n`). A join thinned to 0.6 reads 30 deg and gains no white; a real
  notch (thinned to 0.45, as Inter's 0.45 join ratio) reads 25 deg. Cascivo's reads 43 with a join ratio of 0.79. To thin the
  joins the angle floor must come down, or the measure must read the join's thickness and not the ceiling's slope.
- **Owner decision: `test_advances_at_regular_match_a855b5e0` pins `[ ] { }` at Regular.** Their sidebearings stay 56 / 21
  beside the parentheses' 70 / 31. Add 0x5B, 0x5D, 0x7B, 0x7D to `sized` to open them too.
- Bytes: no budget was raised. Full 74,248 / 74,500, italic full 80,976 / 81,500, Latin[wght] 24,820 / 25,000.

Re-ranked defects for round 3:

1. Upright 800 to 900 spacing and counter size (needs the width decision above; without it, nothing more to gain).
2. Black capital kerning: `AVATAR`, `Kv` touch at 900 upright and italic; italic Black figures `345` touch.
3. Punctuation: `« »` chevrons overlap; comma, semicolon and quotes are heavy at 300 to 600; Black quotes are blocky.
4. Black `e` aperture (a slit), `s`, `8`, `&` lower counter (0.54x Inter's), `2` beak.
5. Black `v w y` crotches; italic Black `Y Z` corner spurs; italic `ll`, `lm` tails.
6. Optical size 32 to 48 at Black touches.
7. The rest of the earlier list: Thin `W V` kerning (9), the serifed `I` at Black (10), the details (11).

## Round 3 result / final

One independent reviewer scored all four states blind in one sitting on 2026-11-21: the same proof set rendered from the committed fonts
of main (baseline), `aafe2f9b` (round 1), `19acf8ac` (round 2) and round 3, under shuffled labels, with the rubric and one shared sheet
of references only. This table replaces the round 1 and round 2 tables for comparison: their reviewers used different scales.
`rhythm.py`: upright 0.50 / 0.53 / 0.47 / 0.53, italic 0.57 / 0.58 / 0.50 / 0.47 (unchanged from round 2).

| #   | Criterion (weight)             | Baseline | Round 1 | Round 2 | Round 3 |
| --- | ------------------------------ | -------- | ------- | ------- | ------- |
| 1   | Rhythm and spacing (15)        | 4        | 6       | 7       | 7       |
| 2   | Weight axis (12)               | 5.5      | 6.5     | 7       | 7       |
| 3   | Shape and curve quality (15)   | 5        | 5.5     | 5.5     | 6.5     |
| 4   | Proportions (8)                | 6        | 6.5     | 6.5     | 6.5     |
| 5   | Joins, terminals, contrast (8) | 6        | 6       | 6       | 6       |
| 6   | Paragraph colour (12)          | 7        | 7       | 7       | 7       |
| 7   | Small sizes (10)               | 7        | 7       | 7       | 7       |
| 8   | Italic (8)                     | 4.5      | 4.5     | 6.5     | 6.5     |
| 9   | Kerning (5)                    | 4.5      | 5       | 5.5     | 5.5     |
| 10  | Optical sizes (4)              | 6        | 7       | 7       | 7       |
| 11  | Character (3)                  | 6.5      | 6.5     | 6.5     | 7       |
|     | **Weighted total**             | **5.5**  | **6.1** | **6.5** | **6.7** |

The targets (7.8 / 8.6 / 9.2) were not met on this scale. No criterion is under its baseline, and Regular text and the small sizes
read the same in all four (the reviewer measured a mean pixel difference of 2 or less on the paragraphs).

Fixed in round 3 (redrawn, each held by a test in `test_font.py`):

- `Y`: the arms run into the stem and end on an upright face inside it. They were cut flat at the join, wider than the stem, and left
  a ledge on both sides (9 units upright, 10 to 18 in the italic). Italic `Z`: the diagonal's ends are placed with the italic's own
  stroke width (`G.hw(exact=True)`), so it no longer stands 4 to 9 units out past the bars.
- Black `v w y`: wider (34 / 70 units) with diagonals a tenth lighter. The white between `v`'s arms is 233 units deep (142).
- Guillemets drawn as outlines on Inter's geometry (a 200-unit run, the arm's width follows the weight): pointed tip, flat ends,
  55 units of white at Black. Two pen strokes met in a notch and ended in corners that pointed at the next chevron.
- Comma (and with it `;` and the curly quotes): the head is half a dot tall before the taper starts, at the same total height.
  Black's double quotes stand 100 units apart (35).
- Black `2` starts with a near-flat cut, not a beak. Black `I` has shorter, thinner slabs (the caps lines keep their width).
- Capital diagonal pairs keep 26 units of white in text Black (16) and 16 to 18 at the corners and Bold.
- Display spacing 0.92 of text (0.88): at 900 / opsz 48 the common pairs keep 28 units or more.
- Italic Black `l`: shorter foot, more room after it. Thin `V` beside `c e o q g œ` kerns 0.8 to 1.08x Inter's (0.6 to 0.75x) and left
  `KERNING_SHORT`.
- Bytes: no budget raised. Full 73,904 / 74,500, Latin[wght] 24,696 / 25,000, italic full 80,528 / 81,500,
  italic Latin[opsz,wght] 34,320 / 35,000, italic Latin[wght] 27,680 / 28,000.

Known limits (the reviewer's list for round 3, most important first, with why each is still there):

1. Upright and italic 800 to 900 are still tight (0.53 and 0.47 against Inter's 0.64) and the Black `e a` counters small. This is the
   width gate (owner decision, round 2 result). It was not approved during round 3, so it is unchanged.
2. Black `e` aperture is a slit. Opening it (`E_RUN` -14 to -6) turns the terminal into a wedge that `quality.py` rejects
   (corners 135 / 68 deg, outside 90 +- 40). It needs a redrawn terminal, not a longer aperture.
3. Black `We` and `Kv` still read as touching to the reviewer. `Kv` keeps the 26-unit floor; `We` is held by Inter's own limit (-63).
4. `&`: the top counter is a dot at 700 to 900. `@` is light beside Black letters.
5. Italic Black `z`: stepped corners on the right (the `exact` anchoring is applied to `Z` and `Y` only, because applying it to every
   italic diagonal moves 60 pinned advances at Regular, `test_advances_at_regular_match_a855b5e0`).
6. Black quotes are still large wedges; `ff` and `ft` open a little at 600 and at display size; Black `LY` is a little loose.
7. Thin `W` beside a round letter and `A` beside `W` still kern 0.4 to 0.6x Inter's (the outline measure reads their white as spacing).
8. Not started: thinner Black arch joins (join-angle gate, owner decision), `[ ] { }` sidebearings (pinned advances, owner decision),
   Cyrillic `Ч Ћ Ђ ђ` and Greek `α` on the old arch, the `G` spur at Black, the `Q` tail at 400.

## Round 4 result / final

One fresh reviewer scored five states blind in one sitting on 2026-11-22: main, `aafe2f9b` (round 1), `19acf8ac` (round 2),
`08d7ce960` (round 3) and the round 4 fonts, rendered from the committed fonts with the same `proofs.cjs`, under shuffled labels. The
reviewer read only the "Proof set" and "Rubric" sections, scored each criterion at its worst place and viewed crops at 1:1. Before the
sitting the weight-axis row was reworded to the owner's round 4 width decision. This table replaces the round 3 table for comparison:
the reviewer's scale is stricter. `rhythm.py`: upright 0.50 / 0.53 / 0.55 / 0.59, italic 0.57 / 0.58 / 0.59 / 0.60 (100 / 400 / 700 / 900).

| #   | Criterion (weight)             | Baseline | Round 1 | Round 2 | Round 3 | Round 4 |
| --- | ------------------------------ | -------- | ------- | ------- | ------- | ------- |
| 1   | Rhythm and spacing (15)        | 3        | 4       | 5       | 6       | 8       |
| 2   | Weight axis (12)               | 4        | 5       | 5       | 6       | 8       |
| 3   | Shape and curve quality (15)   | 4        | 4       | 4       | 5       | 6       |
| 4   | Proportions (8)                | 5        | 5       | 5       | 6       | 7       |
| 5   | Joins, terminals, contrast (8) | 4        | 4       | 5       | 5       | 6       |
| 6   | Paragraph colour (12)          | 6        | 6       | 7       | 7       | 7       |
| 7   | Small sizes (10)               | 7        | 7       | 7       | 7       | 7       |
| 8   | Italic (8)                     | 3        | 3       | 4       | 5       | 6       |
| 9   | Kerning (5)                    | 3        | 4       | 5       | 6       | 7       |
| 10  | Optical sizes (4)              | 4        | 5       | 5       | 6       | 8       |
| 11  | Character (3)                  | 5        | 5       | 6       | 6       | 7       |
|     | **Weighted total**             | **4.4**  | **4.7** | **5.2** | **5.9** | **7.0** |

An earlier sitting the same day (another reviewer) scored round 4 at its first merge 6.7 against round 3's 6.2. The target 9 was not
met. No criterion is under its baseline.

Round 4 did (each change held by a test in `test_font.py` or a gate in `quality.py`):

- Width gate released for the heavy weights (owner decision): Bold and Black keep open counters and Inter-like spacing; the tightest
  string runs +1.98% at 600, +3.1% at 700, +9.9% at 900.
- Black arch and bowl joins thinned (`quality.py` judges them by join thickness, owner decision); `b d p q u µ` joins run round into
  the stem with no mid-height kink.
- Kerning fitted to Inter's white from the master outlines (`kern.WHITE_REF`), Bold refitted on its own outlines.
- Redrawn at the heavy weights: `a e c g s S`, `f` (hook, crossbar, italic tail cut flat), `l` tail (one concave curve), `t` foot,
  `k` leg, `r` beak, `z Z` bars, the italic bars of `E F L T Z z B D P R 7` (no step past the line), italic `v w V W M A` feet and apex,
  squarer Black `o O Q 0`, a lighter `€`, guillemets, quotes, `%`, `@ ( ) [ ] { } &`, Black `T V W X Y Z`, `2 5`.
- Bytes (budgets raised by the user within the round 4 caps): full 76,508 / 76,600, Latin[opsz,wght] 32,080 / 32,100,
  Latin[wght] 25,692 / 25,700, Regular 25,040 / 25,100, italic full 82,904 / 83,000, italic Latin[opsz,wght] 35,284 / 35,300,
  italic Latin[wght] 28,316 / 28,400. Latin[wght] is 58 bytes under its cap: the next redraw that adds points must find bytes first.

Known limits (the reviewer's ranked list, with why each is still there):

1. Italic Black `c` aperture near shut, italic `e` eye and `a` counter small. The cycle-3 redraw of the italic `c` and `s` terminals
   failed `quality.py`'s terminal gates (lean, corners, thickness) and was reverted; it needs a new terminal construction.
2. Black `a`: a notch where the bowl's foot meets the stem; Black `S`: slit upper counter, heavy spine, step at the lower terminal.
3. Punctuation `, ; “ ”` reads heavier than the letters in 400 and 600 text.
4. `f)` at 900 still near touching: the hook is the closest ink (`WHITE_BAND_SHAPE` allows 1.17-1.26x Inter's mean white at 800-900).
5. Black `l` tail: a small flat on its inner curve; Black `r` arm join thin.
6. Width at 700: the reviewer measured +4.8% on the `weights` sentence (the gate's measured strings: +3.1%).
7. Thin: `nnn` and `HHH` loose (0.47 against Inter's 0.40 on the sheet), `T-` and `Kv` loose; 300 pale at 11 px.
8. Italic `f` descender hook reads as fussy at 400; one contact at 900, opsz 32.
9. Carried over: `u`/`µ` arch test at 24 px between masters (IUP tolerance), `KERNING_SHORT` upright `Wa` and italic `YA Ye Yc Yo`
   at 100, the `f` hook weak at 12 to 13 px, Cyrillic `Ч Ћ Ђ ђ` and Greek `α` on the old arch, the Black `3` bump, the italic `g`
   counter flat against the stem, the italic `6 9` stem corner, the italic `b` foot notch and Black `ft` (1.2-1.3x Inter's white).

## Round 5 result / final

One fresh reviewer scored three states blind in one sitting on 2026-11-23: 0.6.1 (`66d88e63`, before the polish rounds), round 4
(`a27d7610`) and round 5, rendered with the same `proofs.cjs` plus a site sheet (the `/cascivo-sans` sample "Signals move fast; the
cascade decides." at 22 and 44 px, 100 to 900, each row above Inter's), under shuffled labels, with only the "Proof set" and "Rubric"
sections. The reviewer's scale differs again (it gives round 4 6.69, not 7.0), so compare the columns. Two earlier sittings during the
round agreed within noise (round 4 6.44 / 6.85 against 6.87 / 6.95 for the sub-rounds). `rhythm.py`: upright 0.48 / 0.53 / 0.59 / 0.59,
italic 0.57 / 0.58 / 0.59 / 0.60 (100 / 400 / 700 / 900).

| #   | Criterion (weight)             | 0.6.1    | Round 4  | Round 5  |
| --- | ------------------------------ | -------- | -------- | -------- |
| 1   | Rhythm and spacing (15)        | 3        | 7        | 8        |
| 2   | Weight axis (12)               | 5        | 7        | 7        |
| 3   | Shape and curve quality (15)   | 5        | 6        | 6        |
| 4   | Proportions (8)                | 7        | 7        | 7        |
| 5   | Joins, terminals, contrast (8) | 5        | 6        | 6        |
| 6   | Paragraph colour (12)          | 6        | 7        | 7        |
| 7   | Small sizes (10)               | 7        | 7        | 7        |
| 8   | Italic (8)                     | 4        | 6        | 6        |
| 9   | Kerning (5)                    | 5        | 7        | 7        |
| 10  | Optical sizes (4)              | 4        | 7        | 7        |
| 11  | Character (3)                  | 6        | 7        | 7        |
|     | **Weighted total**             | **5.09** | **6.69** | **6.84** |

The target 9 was not met. No criterion is under round 4. The owner stopped the round after three drawing sub-rounds (cost).

Round 5 did (each change held by a test in `test_font.py` or a gate in `quality.py`):

- Upright: Black `S` on Inter's columns (top / counter / spine / counter / bottom 164 / 116 / 160 / 122 / 164, Inter 162 / 121 / 170 /
  130 / 162), level terminals; Black `a` with a curved bowl top and a D-shaped counter (0.047 -> 0.055 of x-height squared); Black `l`
  tail one even curve; Black `r` arm join at 0.65 of the stroke; Display `e c g S` terminals cut level (`DISPLAY_FACE`); Caption `i j`
  dots 40 units higher (gap 68 -> 88 at opsz 11, Inter 89-101); Black `o` sidebearings (`O_SB`); Bold round letters 3.7 units more air.
- Punctuation: comma and quote head one stem + 16 (Regular 115 -> 100), full stop 8% smaller at Regular, `;` dot over the comma.
- Spacing and kerning: Thin opening 0.30 -> 0.235 (−1.7% of Regular width); `f)` at 900 47 units of white (35, Inter 37); `“A”` at 800-900
  1.06x Inter's white (1.42x); `|` wider at heavy weights.
- Italic: Black `c` and `e` terminals redrawn (mouth 166 -> 197 and 42 -> 68 units at opsz 14; Inter 89 / 63), Black `a` takes the `d`
  bowl, the heavy rounds `o b d p q 6 9 O Q` turn their sides back before the slant (`ROUND_IT`), `z Z` bars end along the slant, `g`
  bowl closes round on its stem, Regular `f` tail no longer curls back, 700 `l` ends in a foot, `qf jf gf ef` kerned.
- Bytes (owner's round 5 caps): full 76,592 / 76,735, Latin[opsz,wght] 31,968 / 32,445, Latin[wght] 25,672 / 25,750, Regular 25,044 /
  26,265, italic full 82,880 / 83,945, italic Latin[opsz,wght] 35,236 / 36,050, italic Latin[wght] 28,500 / 28,840.

Known limits (the reviewer's ranked list, with what blocks each):

1. Black `0`: the counter pinches to a lemon with pointed ends (Inter: an oval with parallel sides). Not attempted.
2. Black `2`: the spine lands on the base bar with a lump and a kink at the bottom-left join. Not attempted.
3. Black counters `a e 4 6 9` still smaller than Inter's. Blocked by gates: the width cap at 900 (+9.92% of +10% on "Overview…"),
   `COUNTER_MAX['a']` (the `a` counter is 1.28x Inter's by area; it reads small by shape), and the tip gate for a sharper `a` notch.
4. Italic Black `a c e`: the `a` counter still nearly closes, the `c` lower terminal reads curled. The italic width at 900 has 0.1% left.
5. Width step 600 -> 700 -> 800 (on the `weights` sentence +1.0 / +1.6 / +4.5 / +7.5%): blocked by the 600 cap (+1.99% of +2% on
   "Overview…") and the 700 rhythm ceiling 0.59 in `test_black_arch_joins_are_thin` (owner decision; not asked in round 5).
6. Black closing quote a wedge pair; `7,` and italic `f)` loose. The italic `f)` needs a `WHITE_BAND_SHAPE` entry (owner decision).
7. `O0` at 11-12 px at 300-400 (the zero barely narrower), 300 pale at 11 px.
8. Optical sizes: most of the width change is between 8 and 14; 14 to 48 changes little.

## Round 6 result (numeric scorer, no blind judge)

`score.py` upright 8.14 -> 8.67 (rhythm 7.8 -> 8.2, weight axis 7.9 -> 8.1, shape 8.5, colour 9.0, small sizes 9.5 -> 9.4, optical
sizes 2.8 -> 10.0); italic 7.93 unchanged. The target 8.9 was not met.

- `DISPLAY_XH` 10 -> 60 (`tune.py`: score rises to 60, then flat): opsz 32 is 26 units under opsz 14 (Inter 30). Display spacing
  (`DISPLAY_SPACING`) does not move the score; it stays 0.88.
- `CAP_SB_BOLD` 0.1, upright only: Bold capital sidebearings +10% (+0.09). Retuning `HEAVY_TIGHTEN_ITALIC` 0.067 and `BOLD_TIGHTEN_ITALIC` 0.18 gave italic +0.10 but failed six italic gates (n gap 0.54 < 0.56 at 700, brackets, figures, `rf`, `Vo`, capital sidebearings 1.45): reverted.
- Dot accent, `i` and `j` dot: the full stop's size (105; the gate in `test_dot_floor_is_a_params_constant`).
- Gate decisions (owner): 600 width cap +2.5%, 900 +12% (line from 700 +4%), 700 rhythm ceiling 0.63, i-dot 105. Resolved here:
  `COUNTER_MAX['a']` 1.3 -> 1.4; italic `f)` shares the upright's `WHITE_BAND_SHAPE`; the `quality.py` tip gate is unchanged (no
  drawn change this round needed a sharper `a` notch). Italic Light at opsz 48 pinned at 61.7 (62.3), a result of the lower x-height.
- Byte caps (woff2): full 77,600; Latin[opsz,wght] 32,500; Latin[wght] 25,800; Regular 25,200; italic full 83,900; italic Latin
  [opsz,wght] 35,800.

Remaining flaws: the wstep kink at 700 (diagonal capitals and `m w g`: advances flat 400-700, +48 per step to 900; the Bold master's
advance, not a constant, sets it), Black `Q D O B d` counters 1.3-1.5x Inter's by area, the `I/1` ambiguity at 800-900 (identity
glyphs), italic small sizes 7.4 and italic shape 7.2. Black `0 a e 4 6 9` outlines were not redrawn (an outline job for the Opus
tier); `O` against `0` at 11-12 px is unchanged.

Round 6, second sitting (no font change; score still upright 8.67, italic 7.93). Two knobs for the wstep kink were tried with
`tune.py` and removed: a blend of the Bold lowercase advance toward the Regular-Black line (`BOLD_ADV_BLEND`) fails
`test_heavy_f_leaves_no_hole` (`ft` at 700) from 0.2, so `f` and `t` need their own Bold drawing first; an earlier start of the
capitals' widening (`CAPW_START`, `glyphs.capw`) fails `test_weight_changes_do_not_reflow_text` from about 530 (the 600 width cap).
The Bold master's capitals `T V W X Y Z` are `BOLD_OWN`, so no lowercase blend reaches them. Untouched: italic gates, Black counters
(`0 a e 4 6 9`, `Q D O B d`) and `O`/`0` at 11-12 px, which need redrawn outlines, not constants.

Round 6, third sitting (redrawn outlines, numeric scorer). Upright 8.67 -> 8.72, italic 7.93 -> 8.09; target 8.9 not met.

- Kept: Black `D B` heavier tops/bottoms (`CAP_ROUND_H` 0.8, `_B` 0.4; D z 3.9 -> <1.2, B 3.1 -> <1; shape 8.53 -> 8.78). Italic `I` (800-900) shorter, thinner slabs; italic `1` flag reaches further left and ends lower, held 2.5 units lower at Black; small sizes 7.4 -> 8.5 (italic woff2 83,896 B, cap 83,900).
- Reverted: Black `O Q` heavier horizontals (O counter 114k < 130k floor, `test_black_rounds_square_up`); `b d p q` heavier bowls (join_ratio > 0.71 crotch gate). Black `0 a e 4 6 9` left alone (scorer rates them about right). Italic `D B` (bars below baseline, Black Italic `в` self-intersects, byte cap).
- `0` vs `O` at 11-12 px: already better than the references at every weight; a narrower `0` fails `test_advances_at_regular_match_a855b5e0` and `ZERO_MIN_SHARE`. Needs an owner decision (advances fixture exception, or wider sidebearings).
- `BOLD_ADV_BLEND`: a Bold-drawn `t` (`T_BOLD_ARM` 0.6) fixes `ft`, but blends 0.1-1.0 all fail `test_weight_changes_do_not_reflow_text`, `test_tight_letters_open_up`, `test_l_tail_reads_and_keeps_its_white` (700 widens past the +-2% rule). Not kept; the 700 wstep kink stays.
- Not run: the final Sonnet crop check of changed glyphs.

## Round 7: drawn heavy curves (numeric scorer, specimens against Inter)

Owner feedback: at 700-900 the curves looked algorithmic. Upright 8.724 -> 8.724 (held), italic 8.09 unchanged (not touched).
Specimens ("Signals move fast; the cascade decides." and `nmhru dbpqag escs`, Cascivo over Inter) before and after at 700 / 800 /
900: `specimens/round7/`.

- Shoulders (n h m, the u turned over; not Һ, whose arch leaves its stem halfway up): the expanded arch's outer edge left the stem
  0.06 x-heights under its top on a curve as round as the rest (Inter Black 0.26), and the crown stopped 13 units under the stem's
  top. `glyphs.drawn_shoulder` redraws the near quarter's outer edge as one cubic: out of the stem `SHOULDER_NOTCH` 0.16 x-heights
  down at `SHOULDER_ANGLE` 61 deg, into a crown `SHOULDER_CROWN` 0.25 further toward the far stem (Inter's crown sits 0.46 of the
  span from the stem edge; ours sat 0.30) and half an overshoot over the stem's top. Same segment count, blended in by `drawn_h`
  (the upright's heavy), so Regular is unchanged and Bold takes its share. Under the redrawn edge the stroke no longer thins
  (`SHOULDER_JOIN` 1, `shoulder_join`; the edge does the thinning), so the counter meets the stem lower and the join keeps weight:
  Inter's 0.24-0.26 notch over the thinned stroke read 0.26 in `quality.join_ratio` (floor Inter 0.45 - 0.1); now n 0.40, m 0.41.
  A 0.18 notch scored 8.728 but put m at 0.38.
- Bowls (b d p q): the same redraw at both joins (`BOWL_KNOBS`), 0.09 x-heights at 60 deg, crown 0.22 away from the stem (it sat
  0.77 of the way from the round's edge to the stem, Inter 0.58). Inter's own 0.18 pinched our taller counter into a neck at the
  stem and self-intersected the outline (lint); the bowl keeps its height (no lift).
- e and c: Black's terminals run further round (`E_RUN` -8 -> -12, `C_RUN` 12 -> 16). -16 on the e was closer to Inter's length
  but closed the mouth to 37 rows, under `test_black_e_opens`'s 55; -12 reads 56.
- Tried and dropped: centreline knobs alone (crown lean, a taller or squatter near quarter, handle ratios, an oblique start): the
  outer edge's exit never went below 0.88 x-heights (the thinned stroke's outer edge only clears the stem once the stroke has
  turned nearly level). Removed.
- ŋ and µ share the redrawn joins (n's and u's; `test_eng_and_mu_share_the_arch_of_n_and_u`); æ's e half keeps the old terminal
  run (`AE_RUN` -8: at -12 its counter tip against the a turned 45 deg, held to 42). Gates: all 146 pass, lint and quality clean.
- Not done: the r's arm (its own arc) and the s (read as Inter's at these sizes); the italic's heavy arches.

## Round 8: heavy curves in the engine (all families)

Owner feedback: the heavier the weight, the worse the curves (0 5 6 9 $ C s d r at 900), in Sans and the siblings. Fixed in the
engine, every knob scaled by `p.heavy` (Regular's master is unchanged; Bold takes its share). Upright 8.724 -> 8.733; all 91
`test_font.py` gates, lint and quality clean; Mono, Serif and Condensed rebuilt, their `test_family.py` pass. Specimens
("0123456789 $ Csdr nm return columns" at 400/700/900 over Inter, JetBrains Mono, Inter Tight), before and after: `specimens/round8/`.

- Rounds (`geom.Stroke` `fill`, `glyphs.OVAL_FILL` 0.06 of a stem): a closed round's diagonals gain weight (peaking at 45 deg,
  nothing on the axes), so Black's 0 o O Q and the 6 / 9 bowls have an oval counter inside the squarer outline, not the outline's
  own rounded slot. 0.25 read as a lens, 0.1 put O and 0 under `test_black_rounds_square_up...`'s counter floors. Upright only: the
  italic's 6 9 counters and & at 700 sat on their floors. Small rings (% @ °, pen clipped) keep their pen.
- Terminals (`TERM_THIN` 0.12, `term_taper`): C e s S $ 5 6 9 thin into their face, not ending at a full-stem club.
  `TERM_RUN` 6 deg: C 5 6 9 run further round. The c is untouched: its Black face sits between `quality`'s minimum lean (6 deg)
  and `test_display_terminals_cut_flat` (4 deg at 900/48), and either change moved it out. e and S keep their runs (aperture gates).
- r (`R_KNOB` 0.08, upright): the arm thickens toward its end. 0.15 hung a 17-unit beak under the face (gate 12).
- Budget: `CascivoSans[opsz,wght].woff2` 77_600 -> 77_800 (77_760).
- Not done: the 5's stem foot still steps where it meets the bowl's thin start; the n m d joins were round 7's and are unchanged.

## Round 9: heavy figures and the full stop between them

Owner feedback: at 800-900 display sizes the figures look strange; the landing hero ("78.6 KB", "1.9x", Black at ~56 px) has the
full stop crowding its digits and clumsy 6 9 7 1 x. Measured at 900 (units per 1000 of the cap height, `uharfbuzz`): the 6 and 9
hooks were drawn on an ellipse 1.17x the figure width and ran past the bowl, so the proportional 6 9 were 1037 wide (the other
figures 942) and the tabular ones overflowed their advance (side bearings -8 / -13): the dot in "78.6" and "1.9x" sat on them.
The x stood 10 off its neighbours (Geist 63). Fixed, every knob scaled by `p.heavy` (Regular unchanged):

- 6 / 9 (`SIX_HOOK` (0.15, 16) -> (0.08, 12)): the hook's ellipse 1.10x, ending 4 deg higher. Tabular side bearings now 25 / 20,
  proportional advance 971. Narrower still (1.03-1.05x) turned the terminal into a raised nib; a flatter cut (`SIX_HOOK[2]` 5-8)
  left a step under the face; narrowing the whole figure (tried as a knob, removed) nicked the counter where the stem meets the bowl.
- Full stop and comma (`PERIOD_OPEN` 0.25 of the sidebearing unit a side at Black): the dot keeps 68 off each figure (52; Inter 42
  but its dot is round and lighter). Colon and semicolon are built from them and follow.
- x (`X_WIDER` 35 -> 50, `X_SB_HEAVY` 0.2 -> 0.05): Black's x is 5% wider with 18-20 a side (10), so 9x no longer touches.
- Scores: upright 8.73 -> 8.74, italic 8.09 -> 8.10. Specimens ("78.6 KB 1.9x 0123456789 $4.20 12:30" at 400 / 700 / 900, Black
  tabular too, over Inter and Geist): `specimens/round9/`.
- Not done: Inter's 8 upper counter is rounder; the period stays square.

## Round 10: punctuation and Black capitals by eye

Specimens ("Own your stylesheet.", "78.6 KB 1.9× 0", pangrams, punctuation, paragraphs at 100 / 400 / 700 / 900, upright and
italic, over Inter) before and after: `specimens/round-next/`. Measured against Inter at opsz 14 (units per 1000 of the cap height):

- × (`_multiply` r 0.36 -> 0.41 of the operator width): 562 wide at Regular against Inter's 631, now 630; Black 795 (Inter 769).
- Black ? (`Q_MARK_HEAVY_W` 0.14 -> 0.06): 860 wide -> 789 (Inter 713), the hook a round cap, not a flat one with a beak.
- Black Q tail (`Q_HEAVY_WS` 0.25): a full stem. Entering the counter as Inter's does (tried: start 0.04 w left, 30 up) reads
  better but fails `quality.py`'s Q counter gate (0.967 of its hull, floor 0.9955) and lint: not kept.
- Black J (`J_RUN` 20 -> 12): the hook ends 8 deg further round, its butt end no longer a spike.
- Scores: upright 8.74, italic 8.10 (held). All gates pass; Mono, Serif and Condensed rebuilt, their `test_family.py` pass.
- Not done: the thicker Black Q tail reaches 197 under the baseline (176; Inter 74), the `test_q_tail...` floor is 151; Black e terminal overhangs the bowl a little (aperture gates); heavy b d p q O counters stay lighter than Inter's (the
  round-6 attempt broke gates); the 600 -> 700 width step on diagonal capitals (`wstep`) and the I/1 ambiguity at 12 px Black.

## Round 6 (engine): hinted variable fonts, kerning by hand, Display Black

Closes the site's known gaps on hinting, kerning and optical size 48. Specimens before and after: `specimens/round6/`.

- Hinting: the variable fonts are hinted (ttfautohint per master, the CVT varied by `cvar`, `build._autohint_vf`). 96 cases
  (wght 100-900, opsz 8/14/48, 9-16 px): `o x n` tops on one row 83 -> 96, a shared baseline row 0 -> 96 in grey. The i/j dot no
  longer lands on the stem (11 of 32 cases before). Cost about +10 KB per full woff2, +6 KB per Latin slice. Details: RESEARCH.md.
- Font Bakery `transformed_components` (hinted fonts only): the VF masters draw out their scaled, rotated and flipped components
  (superior, inferior, numerator and denominator figures, fractions, ordinals, TM, (C), (R), turned commas, inverted ! ?, g cedilla)
  before hinting; each scaled figure is drawn once and its other uses stay plain-offset components. Cost on top of hinting: full
  woff2 +4.7 KB (87_296 -> 91_964 upright, 94_436 -> 99_140 italic), Latin slices +3.2-4.2 KB, static Regular woff2 +1.5 KB; budgets
  raised to the measured size + 2%. Hinting is the deliberate trade; these outlines are its price.
- Kerning (defect 9): `src/kern_overrides.py`, a hand table over the machine kerning, applied after `_fit_white` on Thin, Regular
  and Black (Bold interpolates; a fourth value is a Display delta). 41 upright and 52 italic pairs: Thin W/V, Black W beside rounds,
  PA TA AT FA LV LW RT, figures 71 77 7. 7, , L' L" V, r. r, f' f" 's, quotes beside A. Values set against Inter's kern and white,
  rounded to 5. Thin W/V as a share of Inter's: upright We Wo .53/.51 -> .78, AW WA .63 -> .79; italic We Wo Wc .27-.33 -> .69,
  AW .05 -> .70, WA .33 -> .70 (test floor 0.65x). Sans only: siblings keep machine kerning unless their `family.py` sets `KERN_OVERRIDES`.
- Optical size 48 (defect 8): the near-touches at 900/48 were `r f t` before rounds (`rd ra rg`), not the figures (`0123Rag`'s
  tightest gap, a-g, is 63). Min gap 12 (upright `rd`) -> 32, italic -3 (`ra`, overlapping) -> 30, by the Display delta in the
  table. A heavy-only `DISPLAY_SPACING` would do nothing: Display Black has no master of its own. Gate: 30 units over `0123Rag`,
  `ns st rg ef OO` and `r f` beside rounds at 900/48.
- Defect 11: Thin comma below on `ș ț` (`COMMA_BELOW_LN` floor 150: bottom -141 -> -208, Inter -241). Black quotes (inner white 104
  against Inter's 86) and `@` (3-4% smaller than Inter's, not low) measured within Inter and left. Not done: G spur at 900, Q tail
  at 400, Black 5 foot, Regular a bowl, Caption Black counters, Cyrillic `Ч Ћ Ђ ђ`, Greek `α`.
- Scores held: upright 8.74, italic 8.10, optical sizes 10.0. Left: italic Black `ta td tq` 22-23 and `Rt` 14 units at 900/48;
  italic Thin `VA` 0.66x Inter's.

## Round 7 (engine): defect 11 leftovers, italic Display Black, Black mouths, bytes

Specimens before and after, each row Cascivo above Inter: `specimens/round7/r7-defects-a-{before,after}.png` (the open items) and
`r7-defects-b-{before,after}.png` (Black `c e a s C G S`). `score.py`: upright 8.43, italic 8.20 before and after (the scorer is Latin
only and reads advances, stems, counters and colour; none of these fixes moved it). A blind sheet review (one sitting, proofs.cjs) rated
the mid-round state about 7.0 and ranked the Black mouths first; they were then opened. Tests: `src/test_r7_*.py`.

- Kerning (`kern_overrides.py`): italic Black `ta td tq tg` +15 and `Rt` (15, 10, 20) at 900 / opsz 48 keep 34-38 units of white
  (14-23; Inter 44-52, gate 30). An override's `None` at Thin or Regular takes the machine's value, so unkerned pairs need an explicit 0.
  Italic Thin `VA` -45 -> -53: 0.66x -> 0.78x Inter's kern (white 0.88x, as `AV`); test floor 0.75x for `VA AV` upright and italic.
- Latin (`glyphs.py`, Sans only via `R7 = not family.ACTIVE`): `G` at 800-900 spur stands 1.2 bar-heights before the bowl (counter
  run-out 23 -> 1.8 units at 900, Inter 7.9); `Q` at 100-400 tail 40 units longer, 10 lower, 0.1 heavier (angle 40.8 -> 47.8 deg, Inter
  51.4; the hull gate holds); Black `5` foot rises 0.19 to the left (Inter 0.19), no step; Regular `a` bowl top +0.015 x-height (0.568 ->
  0.583 at 0.45 of the width, Inter 0.575); Caption Black `6 9` counters 0.83x -> 1.00x of Text Black's, `s` 0.87x -> 0.98x.
- Black mouths (opened only where they measured under Inter): `c` 0.78x -> 1.05x, `e` 0.92x -> 1.01x, `a` arc-to-bowl 0.70x -> 1.01x,
  `C` 0.85x / 0.76x italic -> 1.0x. The `C`'s terminals no longer thin (`CAP_C_THIN` 0; 164 -> 184 units, Inter 199): opened alone, the
  letter went lighter than the references and the colour score dropped. Upright `G`, `s`, `S` and the italic `c e s a` already measure
  1.07-2.2x Inter's and were left; the italic Black `a` reads small because its counter is a tall slot (619 against 473 high, 0.96x wide).
- Cyrillic and Greek: `Ч ч` on the u's arch (`u_arch`, floor 0.30 of the height, Inter 0.31), Black `ч` 12% wider (its counter had shut
  to 88 units); `Ћ Ђ ђ` on the h's `shoulder()` (new `tail` and `xh`), `α` on q's bowl (`_bowl_lc`). Join ratio at 900: `ђ` 0.81 -> 0.41
  (h 0.40), `α` 0.85 -> 0.42 (d 0.39). Siblings keep their v1 drawings (`family.ACTIVE`; their outlines checked identical).
- Bytes: the mark-clear instructions after ttfautohint's (`_keep_marks_clear`) pass a first point and a count to a looping function, not
  every point (rasters identical in FreeType v40, v35 grey and mono, 15 design-space corners, 6-100 ppem); `_save_woff2` keeps the
  smallest of six Brotli settings (Sans only). Full upright 91,964 -> 91,304, italic 99,140 -> 98,928, Latin[opsz,wght] 42,280 -> 42,180,
  Latin[wght] 34,692 -> 34,712, Regular 36,304 -> 35,776, italic Latin 45,820 -> 45,856 / 37,840 -> 37,692 (net of the redraws).
  Budgets lowered to about +2%. Where the rest is: glyph programs 8.3 KB, fpgm 1.7 KB, the drawn-out transformed components 4.8 KB
  (ten scaled figure owners, `¡ ¿ ‘ ģ ª º ™ © ®`: irreducible while Font Bakery forbids scaled components). Tried and rejected:
  `hinting_range_max` 30 (-245 B, rasters change at 36 px and up), dropping the mark-clear calls (-1.6 KB, the i dot lands on the stem
  again), `hint_composites` / `adjust_subglyphs` (+15-20 KB). No glyph program is a no-op.
- Not merged (failed 4+ tests of the full suite, unidentified when the round stopped): a spacing retune that scored upright 8.43 ->
  8.71 and italic 8.20 -> 8.45 (`CN_BLACK` 145 -> 135 lowercase only, `BOLD_TIGHTEN` 0.125 -> 0.08, `CAP_SB_BOLD` 0.1 -> 0.075,
  `CH_BLACK` 300 -> 270 (italic 305 -> 260), `HEAVY_TIGHTEN_ITALIC` 0.09 -> 0.12, `CAP_SB_BOLD_ITALIC` 0.1, `BOLD_OPEN_SB` 0.3 -> 0.2
  for `n h m u o b d p q 0`, Thin figures narrower, Black `1` flag 30 left and 0.14 cap lower). It eased the 700 bend for `n o m` (16
  -> 12, 27 -> 23) and `I/1` at 12 px Black (0.43 -> 0.33 overlap) but left `T V W X Y Z` bending 21-36 units and made `rn`/`m` at
  11 px 800 an offender. Start the next round from it.
- Left: the 700 `wstep` kink (upright weight axis 7.3, italic 7.4), `I/1` at 12 px Black, italic shape 7.2, the Black `ll`/`l` tail and
  `k x y v w` crotches the review flagged, upright `tt` at 900/48 (12 units, a crossbar ligature; Inter overlaps too).

## Round 8 (engine): the 700 bend of T-Z, italic Black Q, Black l tail

Specimens before and after: `specimens/round8/r8-{wstep,q-italic,l-tail}-{before,after}.png`. `score.py`: upright 8.43 -> 8.43 (weight
axis 7.33 -> 7.34), italic 8.20 -> 8.29 (weight axis 7.42 -> 7.53, shape 7.16 -> 7.44). Tests: `src/test_r8_design.py`. Sans only
(`glyphs.R8 = not family.ACTIVE`; the test checks the siblings load round 7's values).

- Weight axis (`glyphs.CAPW_START`, `CAPW_THIN`): T V W X Y Z bent at 700 because their Black widening (`CAPW_BLACK`) started at Bold's
  own coordinate: flat 400-700, then all of it in 700-900. It starts at 615 upright (the most the 600 cap on 'OVERVIEW ACTIVITY SETTINGS'
  allows: +2.41% of +2.5%) and 450 italic. Bend at 700 (|a600 - 2 a700 + a800|): upright 21-36 -> 12-21, italic 21-36 -> 4-6. Part of it moves
  to 400; the upright gives back a fifth of the widening at Thin (`CAPW_THIN` 0.2; Inter, Geist and Plex set these 3-9% narrower at Thin,
  ours 1-2%), as far as Thin's kerning floors allow (AY, Ya at 0.8x Inter's fail at 0.25; the italic's Vc sits at 0.78x, so it keeps its Thin).
  The scorer's upright item barely moves (its 90th percentile now holds the 400 bends and the lowercase `w m g n o` at 700, untouched).
- Italic shape (`glyphs.Q_CROSS_IT` (0.16, 0.25)): the worst italic shape row, Black `Q` counter over ink 0.378 (Inter Italic 0.246, z 5.4),
  a stub hung on the O. Its tail now starts inside the counter at Black, as Inter Italic's crosses its bowl: 0.271 (z 1.0), Q colour 0.89x ->
  0.97x Inter's. Regular italic and the upright Q (quality.py's counter gate, test_r7_latin) are unchanged.
- Black `l` tail (`L_RSB` 0.6 -> 0.72, `L_BOLD_OPEN` 1.0 -> 2.3, new `L_BOLD_OPEN_IT` 1.6): the white after the tail in `ln lm` over the nn gap,
  700 / 800 / 900: upright 0.83 / 0.87 / 0.94 -> 0.93 / 0.95 / 1.00, italic 0.81 / 0.90 / 1.00 -> 0.92 / 0.95 / 1.00. The tail's reach and shape
  hold; 600 sets 'Overview Activity...' at +2.21% (cap 2.5%).
- Not done: `I/1` at 12 px Black (0.43 / 0.455 at 800 / 900). The round-7 retune's Black `1` flag (30 left, 0.14 lower) gets 0.35 but reaches
  209 units left of the stem at 900, over quality.py's `flag` gate (1.05x Inter's 164; ours 167 now), so every flag that is longer or lower
  fails it; one moved right to stay under it is worse (0.47-0.51). The overlap is the stems' alignment: our serifed I puts its stem's centre
  217 units in, the 1's 317 (Inter 165 apart, Geist and Plex 140). A real fix needs a wider Black 1 or shorter I slabs: both are against a gate
  or the identity.
- Not merged: the round-7 spacing retune (CN_BLACK 135 lowercase only, BOLD_TIGHTEN 0.08, CAP_SB_BOLD 0.075, CAP_SB_BOLD_ITALIC 0.1, CH_BLACK
  270 / 260 italic, HEAVY_TIGHTEN_ITALIC 0.12, BOLD_OPEN_SB 0.2; the 1 flag left out, see above; "Thin figures narrower" has no recorded
  values). On top of this round it scores upright 8.64, italic 8.43, and fails 33 subtests in 19 tests of the full suite: the narrower Black
  lowercase counters (`e` counter, `k` crotch and sliver, italic `b d p q` rounds, `m` arch join, italic `s` counter tip, `&`, `@`, `]{`, quotes,
  Caption Black counters, Regular `a` bowl pin), the narrower H against the round capitals (O C G Q over H 1.09-1.11 against Inter's 1.04-1.08,
  the italic H/n sidebearing 1.44 at 700), the tighter spacing at 900/48 (`ra ro fo rg to` 29-31 units against 30-32), the Caption `f` hook at
  600/12 and one outline that is no longer simple. Each needs its own redraw before the spacing can move.
- Left: the lowercase 700 bends (`w m g n o`, 16-33 units, Bold's natural spacing: `BOLD_ADV_BLEND`), Black round-letter counters (italic
  `a b d p q O D` at 900, z 3-5), `I/1` above, `k x y v w` crotches, upright `tt` at 900/48.

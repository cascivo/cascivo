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

| #   | Criterion (weight)             | Sheet: what to look at                                                                                                                         | Measurable proxy                                                                                                                                                       |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rhythm and spacing (15)        | `spacing`, `glyphs_*`: is the white between letters equal to the white inside them, and the same at every weight? Look for `nnn`, `HHH`, `oo`. | `rhythm.py`: the n gap/counter ratio at 100, 400, 700 and 900. 10 = flat, within ±0.06 of Inter (0.56-0.64). Subtract 1 for each 0.05 that 700 or 900 falls below 0.50 |
| 2   | Weight axis (12)               | `weights`: do the weights step evenly? Do the heavy weights stay open? Does the width hold?                                                    | `test_font.py` (stem steps 20-22, width ±2% from 100 to 700 and ±5% at 800 and 900); `rhythm.py` at 700 and 900                                                        |
| 3   | Shape and curve quality (15)   | `glyphs_*` at 64 px and `display`: smooth curvature, no flats or kinks, open counters, balanced `a e g s S G R 2 3 5 6 9 &`                    | `lint.py` / `quality.py` (joins, notches, counters, terminals) must pass. The proxy is a floor only: judge by eye                                                      |
| 4   | Proportions (8)                | Caps, lowercase and figures together: x-height and cap widths, round against straight, figure widths, punctuation size                         | `compare.py --cascivo-only` (x-height, widths against `comparison.json`)                                                                                               |
| 5   | Joins, terminals, contrast (8) | Bowl-to-stem joins at 700 and 900, terminal cuts, crotches of `v w y k x`                                                                      | `quality.py` (join_ratio, CUT_MAX_DEG, notch)                                                                                                                          |
| 6   | Paragraph colour (12)          | `text`: even grey, no dark spots or holes, word space against letter space; compare with Inter in the row below                                | None. Squint at it, or blur it 3 px, and look for blotches                                                                                                             |
| 7   | Small sizes (10)               | `small_1x` enlarged 3x with nearest-neighbour: `Il1 O0`, `e c a s` stay open, 600 does not clot                                                | `test_font.py` (opsz stem gates); README Light ink against Inter 0.94-0.99                                                                                             |
| 8   | Italic (8)                     | `glyphs_italic`, `weights` italic, italic `text`: flow, the `f` and `l` tails, spacing, counters at 900                                        | `rhythm.py` on the italic TTF (400: 0.58, 900: 0.30)                                                                                                                   |
| 9   | Kerning (5)                    | `kerning`: no holes or collisions, the same at 100, 400 and 900                                                                                | `test_font.py` (pairs at least 0.8x Inter's, `KERNING_SHORT`)                                                                                                          |
| 10  | Optical sizes (4)              | `opsz`: a monotone, smooth change from 8 to 48; 48 is tight but not touching                                                                   | `test_font.py` (opsz stems)                                                                                                                                            |
| 11  | Character without gimmick (3)  | All sheets: does it look like one family, quiet, with a clear identity (`l` tail, serifed `I`)? Does any feature call attention to itself?     | None                                                                                                                                                                   |

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
- **Width across weights**: within 2% from 100 to 700, and within 5% at 800 and 900. This rule is
  the cause of defect 1. To relax it is an owner decision. Do not relax it to fix the defect.

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

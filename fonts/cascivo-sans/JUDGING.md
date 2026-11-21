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

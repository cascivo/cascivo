# Designing a modern sans: research notes behind Cascivo Sans

This note covers what "modern" means for a typeface in 2026, and why Helvetica, IBM Plex and
Geist became defaults. It then describes how Cascivo Sans was built, and it finishes with a
scorecard that shows where Cascivo Sans wins and where it loses. All figures were measured
with fontTools, unless a source is cited.

## 1. What "modern" means for a font in 2026

A typeface is now a piece of software. People judge it on six things, and drawing is only the
first one.

| Dimension              | What modern means                                                                                             | Why it matters                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Drawing**            | Large x-height (0.52–0.55 em), open apertures, distinct `Il1` and `0O`, crisp shapes at 11–14 px              | Most text is read on screens at small sizes.                                                       |
| **Axes**               | Variable `wght`, and ideally optical size (`opsz`); `wdth`, `slnt` or `ital` as extras                        | One file covers a whole family. CSS `font-optical-sizing: auto` gives each size a cut made for it. |
| **UI features**        | Tabular figures, slashed zero, `case`, fractions, super/subscripts, stylistic sets, kerning, mark positioning | A design system's tables, prices, codes and buttons rely on these.                                 |
| **Coverage**           | Latin Extended at minimum; Cyrillic, Greek and other scripts for global products                              | When a glyph is missing, the browser uses a fallback font, and the text no longer matches.         |
| **Weight on the wire** | Small WOFF2 files, sensible `unicode-range` splits, composites instead of duplicated outlines                 | Fonts block text rendering. Each kilobyte delays the first paint.                                  |
| **Engineering**        | Open license (OFL), source as code, reproducible builds, validation in CI (Font Bakery, OTS)                  | A font can be maintained, audited and forked only when it has these.                               |

## 2. The three references and why they won

Measured on the shipped files: Geist 1.x and IBM Plex Sans from npm. Helvetica is proprietary,
so FreeSans (a Nimbus Sans/Helvetica derivative) stands in for its proportions.

|                                   | Helvetica                                                                                                     | IBM Plex Sans                                                              | Geist                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Origin                            | 1957, Max Miedinger and Eduard Hoffmann, Haas foundry. Neue Helvetica 1983. Helvetica Now 2019, Variable 2021 | 2017, Mike Abbink with Bold Monday, for IBM's identity. Variable Sans 2019 | 2023, Vercel with Basement Studio. Geist Pixel added Feb 2026 |
| License                           | Commercial                                                                                                    | OFL                                                                        | OFL                                                           |
| x-height / cap                    | 0.72                                                                                                          | 0.74                                                                       | 0.75                                                          |
| x-height (em)                     | 0.52                                                                                                          | 0.52                                                                       | 0.53                                                          |
| Regular stem (em)                 | 0.084                                                                                                         | 0.085                                                                      | 0.090                                                         |
| Figures by default                | tabular                                                                                                       | tabular                                                                    | proportional                                                  |
| Variable axes                     | wght, wdth, opsz (Now Variable; commercial)                                                                   | wght 100–700 (Sans only)                                                   | wght 100–900                                                  |
| Stylistic sets                    | few                                                                                                           | 6 (`ss01`–`ss06`), `zero`, `salt`                                          | 11 (`ss01`–`ss11`)                                            |
| Regular WOFF2, full charset       | n/a                                                                                                           | 63.0 KB / 895 codepoints                                                   | 45.2 KB / 728 codepoints                                      |
| Variable Latin slice (Fontsource) | n/a                                                                                                           | 45.7 KB                                                                    | 29.4 KB                                                       |

**Helvetica** is popular because it is neutral. It has uniform widths, horizontal terminals and
closed apertures, so a block of text looks even and quiet. Brands can put their identity on top
of it. Ubiquity reinforces this: Helvetica ships with macOS and iOS, and a whole generation of
corporate marks used it. On screens, the same qualities become problems. The closed apertures
of `c e s a` close up at small sizes, `I`, `l` and `1` are almost the same, and the default
spacing is tight. Helvetica Now (2019) added optical sizes to fix the small-size problem, but
it is commercial.

**IBM Plex** is popular because it was the first large corporate family under an open license.
IBM replaced Helvetica Neue with its own font and stopped paying licence fees. Plex is a
grotesque with engineered details (angled cuts, a distinctive `t`), so it reads as "IBM"
without a logo. It is also a whole system: Sans, Serif, Mono and Condensed, plus Arabic,
Devanagari, Hebrew, Thai, Japanese and Korean. The costs are large files and a variable
version that stops at 700 and covers only the Sans.

**Geist** is popular because of distribution and taste. It is the default font in Vercel's
templates and `create-next-app`, so millions of projects start with it. The design is Swiss
but tuned for interfaces: large x-height, generous widths, a matching Geist Mono, and 11
stylistic sets. In v1.7.0, the coding ligatures moved to `ss11`, so they are no longer on by
default. Geist Pixel followed in February 2026. Its variable Latin slice is the smallest of
the three references.

The common pattern is this: each one became popular by solving the problem of its time.
Helvetica was neutral for print and corporate identity. Plex was an open corporate system.
Geist was a well-distributed UI font for developers. None of them leads on bytes per glyph, on
optical size in a free license, or on a reproducible source.

## 3. The brief for Cascivo Sans

The targets are the axes where the references leave room:

1. **Optical size in an open font.** A real `opsz` axis (8–48). The Caption cut has a larger
   x-height, looser spacing, flatter contrast and more open apertures. The Display cut is tighter
   and crisper. Before this, you could get optical sizes in a Helvetica-like font only with
   Helvetica Now Variable, which is commercial.
2. **UI defaults.** A serifed `I` and tailed `l` by default, so `Il1` never read alike.
   Proportional figures by default for running text; `tnum` lines numbers up in tables, `zero`
   gives a slashed zero, and `ss01` restores the plain `I` and `l`. `case`, `frac`, `sups`, `sinf`, `ordn` and `mark` are also included.
3. **Small files, by construction.** The aim is the lowest bytes per codepoint of the group.
4. **Source as code.** About 3,000 lines of Python that produce byte-identical output on every
   build. A test suite, Font Bakery and OTS run in the loop.

## 4. How it is built

**A parametric stroke engine, not drawn outlines.** Each glyph is a set of centerline strokes.
A pen expands each stroke to an outline. The pen's thickness depends on the direction of travel:
vertical strokes get the full stem, and horizontal strokes get a thinner hairline. This gives
the slight modulation of a grotesque without drawing every curve by hand. Curved terminals are
cut square to the stroke, as in Geist; straight strokes end flat on the baseline and cap height.
Arches thin where they leave a stem, which is the "crotch" that gives `n` and
`b` their sparkle.

**Five masters per font, with compatibility by construction.** Each font (upright and italic)
has the masters Regular, Thin, Black, Caption and Display. The structure of every outline depends only on the glyph code.
Master parameters move points but never add or remove them. Because of this, each master is
point-compatible with the others automatically, and variable fonts require that. Additive
deltas make two axes cost five masters instead of a 3×3 grid. An `avar` table sets the stem
at each named weight. The light half uses equal stem _ratios_, because a linear scale crowds it
(Thin→ExtraLight is a doubling). The heavy half puts more weight into 500–700, as Geist and Inter
do, so Bold is clearly bold next to Regular.

**Measured kerning, referenced pair list.** Section 9 describes the method. The pair list comes
from two professionally kerned fonts. The values are measured on Cascivo's own outlines with a
model fitted to those fonts' judgement. An early version kerned every pair that "measured
loose". It tightened `LM` and `FG`, which a type designer would never do.

**Automated outline lint.** Naive stroke expansion fails on tight inner curves: the offset
loops back on itself, and you get notches on heavy terminals. `src/lint.py` checks every stroke
contour in every master for self-intersection. The build ships with zero problem contours.

### Where the bytes went (and didn't)

| Technique                                                                                                                                                                                        | Effect                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Composites everywhere**: accents, `i`/`j` (dotless + dot), quotes from the comma, `¡¿` as 180° rotations, `Œœ` from `O`+`E`, all super/subscripts, fractions and ordinals as scaled references | 283 of 455 glyphs (62%) cost a few bytes each instead of a full outline plus 5 delta sets                                                  |
| **Additive master layout** (6 masters, not 18)                                                                                                                                                   | Each extra axis end costs about 4–5 KB WOFF2. Measured by building without each master                                                     |
| **cu2qu tolerance 1.5 units** (1.5/1000 em)                                                                                                                                                      | −4%. Below one pixel up to about 700 px font size                                                                                          |
| **IUP delta tolerance 1.0**                                                                                                                                                                      | −3%. The rasterizer re-infers the dropped deltas within 1 unit                                                                             |
| **`post` format 3** (no glyph names in the shipped file)                                                                                                                                         | −1–2 KB. Names exist at build time only                                                                                                    |
| **Flattened components** (no nesting)                                                                                                                                                            | Removes one indirection per glyph and passes stricter rasterizers                                                                          |
| **Per-axis web builds**                                                                                                                                                                          | `Latin[wght]` 21.8 KB, `Latin[opsz,wght]` 29.1 KB; italic 24.2 / 32.4 KB, loaded only when a page uses italic. Serve only the axes you use |

## 5. Scorecard

### Size

| File                                    | Cascivo Sans           | Geist             | IBM Plex Sans                         | Inter              |
| --------------------------------------- | ---------------------- | ----------------- | ------------------------------------- | ------------------ |
| Variable Latin slice, wght axis         | **21.8 KB** (211 cp)   | 29.4 KB (225 cp)  | 45.7 KB (232 cp)                      | 48.3 KB (230 cp)   |
| Bytes per codepoint (Latin slice)       | **102**                | 131               | 197                                   | 210                |
| Variable, full charset, wght only       | **25.8 KB** (71 B/cp)  | 69.7 KB (96 B/cp) | —                                     | —                  |
| Static Regular, full charset            | **12.8 KB** (27 B/cp)  | 45.2 KB (62 B/cp) | 63.0 KB (70 B/cp)                     | —                  |
| Italic, variable Latin slice, wght axis | **24.2 KB** (115 B/cp) | no italic         | 24.4 KB, one static weight (105 B/cp) | 51.8 KB (225 B/cp) |

The full-charset comparison is not like for like. Geist and Plex cover Cyrillic, Greek and
more, and those glyphs are larger. The Latin slices are the fair comparison, and Cascivo uses
23% fewer bytes per codepoint than Geist. Part of this comes from engineering (composites, the
master layout, tolerances). Part of it comes from simpler drawing: stroke-generated outlines
have fewer points than outlines drawn and refined by hand.

### Everything else

| Dimension       | Cascivo Sans                                                                                                       | Verdict                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Axes            | wght 100–900, **opsz 8–48**, in upright and italic                                                                 | **Ahead** of Geist and Plex. Matches Helvetica Now Variable on opsz, under OFL. No `wdth`                                                                           |
| UI features     | pnum (default), tnum, zero, ss01, case, frac, sups, sinf, subs, numr, dnom, ordn, locl (ROM/MOL), ccmp, kern, mark | **On par.** Geist has more stylistic sets; Plex has `onum`/`salt`                                                                                                   |
| Validation      | Font Bakery universal: 0 fail. OTS: all nine files pass                                                            | **On par or ahead.** Validation runs in the test suite, not just at release                                                                                         |
| Reproducibility | Byte-identical rebuilds (`SOURCE_DATE_EPOCH`), parametric source, 3.5 s build                                      | **Ahead.** No GUI source files, and diffs are reviewable                                                                                                            |
| Coverage        | Latin-1 + Latin Extended-A + Romanian + Vietnamese (479 codepoints)                                                | **Behind.** No Cyrillic or Greek. Plex covers many scripts                                                                                                          |
| Drawing quality | Generated by rule, then reviewed glyph by glyph at Thin, Regular and Black (section 6)                             | **Behind.** One review pass is not years of optical refinement. `&`, `@`, `§`, `ß` and the braces are serviceable, not refined                                      |
| Italic          | Drawn italic, variable, linked by STAT `ital` (section 10)                                                         | **On par with Plex** in form (single-storey `a`, descending `f`). Ahead on size: the whole weight range costs what one Plex italic weight does. Geist has no italic |
| Family          | Sans only                                                                                                          | **Behind.** No Mono (Geist, Plex), Serif or Condensed (Plex)                                                                                                        |
| Hinting         | Unhinted; smart dropout `prep`, `gasp` set                                                                         | On par with Geist. Plex ships hinted TTFs                                                                                                                           |
| Field testing   | None                                                                                                               | **Behind.** All three references have years of production use                                                                                                       |

### The honest bottom line

The goal was "more advanced than all the others in every dimension". This version does not
reach that, and claiming it would be false. Cascivo Sans leads on **file size** (by a wide
margin), on **optical size in an open font**, on **UI-first defaults** and on **reproducible,
tested engineering**. It is behind on **drawing finesse, script coverage and family
breadth**. Those take type designers and years, not a generator, and they are the
reasons the references are trusted.

The useful result is the method, not the claim. The parametric stroke engine with lint and
budget gates gives a font that you can measure, reproduce and change in a pull request. The
next steps follow from the scorecard, in order of value:

1. A second review pass by a trained type designer, especially at 11–14 px, where an automated
   eye is weakest (see section 6).
2. Cyrillic and Greek, which are mostly new strokes. Many glyphs are composites or mirrors of
   Latin ones.
3. `wdth` and a Mono companion that shares the stroke engine.
4. A test in real products at 12–16 px against Geist, with hinting decided from that data.

## 6. Hand-review pass

The most frequent glyphs (`e t a o i n s h r d l c u m f g y p b` and the capitals `T A S R E N C`)
were rendered at 300 px next to Geist, at Thin, Regular and Black, then fixed and checked again.
Running text at 13, 16 and 22 px came last. Every fix was made in the generator (a rule or a
parameter), so it applies to every master and to every glyph built the same way.

| Found                                                                            | Cause                                                                                         | Fix                                                                                                                                                                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Text width ran from 0.73× (Thin) to 1.35× (Black) of Regular. Geist: 0.96×–1.11× | Spacing grew with the stem, and the counters did not give the width back                      | Near-constant spacing, and counters that shrink as stems grow. Now 0.94×–1.14×. A test guards it, so bold text never rewraps a line                                                              |
| Black `e`, `a`, `s` counters nearly closed                                       | Horizontals at 0.68 of the stem; crossbars as heavy as bowls                                  | Black contrast 0.60 (Geist measures about 0.6); crossbars thin by up to 22% more than bowls; heavy `a` bowl rises 5%                                                                             |
| `s` spine too thin at Regular, too heavy at Black                                | The angle pen thins diagonals; a constant stem fills the x-height                             | The spine is its own stroke, with a heavier hairline (1.15 × H)                                                                                                                                  |
| `s` and `S` terminals had a small flag                                           | Near 0°, a short bowl's inner radius is smaller than half the stroke, so the inner edge folds | The terminal sits where the curve is gentler, with a square cut                                                                                                                                  |
| Hairline seam inside `s` and `S`                                                 | Strokes that only touch edge to edge anti-alias into a line                                   | The spine overlaps each bowl by 8 units                                                                                                                                                          |
| `e` crossbar nub and step                                                        | The bar's square end sat outside the curving bowl, 2 units off the stroke end                 | The bar ends on the bowl's centreline, flush with the stroke end                                                                                                                                 |
| `a` tooth at the foot of the stem                                                | A round bowl always crosses the stem about 20 units above the baseline                        | The bowl leaves its curve along its tangent and joins the stem diagonally, as in Geist                                                                                                           |
| `f` hook left a gap ("def ault"), and collapsed at Black                         | Hook radius came from the full glyph width; the width did not follow the stem                 | Hook sized to end over the crossbar; `f` width depends on stem weight                                                                                                                            |
| `y` corner visible at Black                                                      | The left arm was cut exactly at the baseline                                                  | The arm ends below the baseline, inside the right stroke                                                                                                                                         |
| Closing quotes `’ ”` read as straight `' "`                                      | All four curly quotes are built from the comma, which was a straight wedge leaning 8°         | The comma has a square head and a tail that curves down to the left. `’ ”` raise it and `‘ “` turn it, so all four now curl. The comma-below (`ș ț`) and the caron of `ď ľ ť` use the same comma |
| `%`, `&`, `@` rings closed at Black after the width change                       | A full stem pen inside a small ring                                                           | The pen in any ring is at most a third of the ring's size                                                                                                                                        |

All glyphs also carry the TrueType overlap flags, which variable fonts with overlapping
contours should set (CoreText needs them to anti-alias overlaps without seams).

What this pass cannot claim: the review was done by eye on rendered images and by measurement,
not by a trained type designer. It catches structural defects (collapsed counters, kinks,
seams, gaps, width drift) reliably. It is weaker on the last few units of optical balance and
on how text renders at 11–14 px on low-resolution screens. Still open: the bottom of the Black
`a` has a small spur.

A follow-up made two more changes:

- **One terminal rule.** Every curved terminal (`c C G J a e g j r t 2 3 5 6 9 ? @ ¢ £ €`, plus
  `s` and `S`) is cut square to the stroke. Horizontal cuts were dropped rather than extended
  to `s`, because at Black a horizontal cut is what made the `s` inner curve fold. Joins keep
  their flat cut, such as the foot of `2` on its base bar. So do parentheses.
- **Black `f`.** The hook's end angle rises with weight, from 38° at Regular to 72° at Black.
  At Black the hook becomes a flat top stroke with a clean tip, as in Geist, instead of a tight
  turn whose inner edge folded into a pinhole. The angle stays in one quadrant, so the masters
  remain compatible.

## 7. Proportion review

There is no type-design skill available to this project, so this review used the standard
type-design criteria and measured each one against the references. All figures are at
Regular, in units of x-height or cap height.

| Measure                           | Before | After    | Geist | Inter | Plex | Helvetica* |
| --------------------------------- | ------ | -------- | ----- | ----- | ---- | ---------- |
| n width ÷ x-height                | 0.88   | **0.82** | 0.79  | 0.80  | 0.78 | 0.80       |
| H width ÷ cap height              | 0.85   | **0.79** | 0.75  | 0.78  | 0.75 | 0.77       |
| O width ÷ cap height              | 1.00   | **0.92** | 0.91  | 0.89  | 0.85 | 0.97       |
| n sidebearing ÷ x-height          | 0.13   | **0.15** | 0.15  | 0.14  | 0.16 | 0.12       |
| Average advance ÷ x-height (text) | 0.91   | **0.89** | 0.90  | 0.88  | 0.88 | 0.84       |

Before this change, line length was normal but the letters were about 10% too wide and set
too close together. That reads as wide and dense. The letters are now narrower and the spacing
looser, so a line is about 2% shorter. Black got two compensations. First, `s` and `S` gain
width with weight, since three horizontals and a spine in one x-height run out of counter
first. Second, `$` thins its S and bar with weight, because it shares a fixed tabular width.

Texture evenness (the spread of ink density across the lowercase) is 0.150, against 0.151 for
Geist and 0.142 for Inter. Overall color at Regular is darker: 0.43 ink per x-height square,
against 0.39 for Geist and 0.43 for Helvetica.

## 8. Running-text review

The font was first tuned for tables and interfaces. A review of body text against Geist, Inter,
Plex and the Helvetica stand-in led to three changes:

| Issue                 | Before                                                      | After                                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Figures in sentences  | Tabular by default: "$1, 117" and "11 illegal" looked gappy | Proportional by default, as in Geist and Inter. `tnum` gives tabular figures, and every figure feature (`frac`, `sups`, `ordn`, `zero`) accepts both forms                                                   |
| `line-height: normal` | 1.22                                                        | 1.30, as in Geist and Plex. The space sits in ascent and descent, so it is split evenly above and below the text                                                                                             |
| `I` vs `l` at 12 px   | Identical, as in Geist and Inter                            | Serifed `I` and short-tailed `l` by default. The tail grows slower than the stem, so a Black `ill` does not read as `iʟʟ`. `ss01` restores the plain forms, including all 17 accented and composite variants |

A follow-up then changed the weights:

| Measure                                 | Before | After      | Geist | Inter |
| --------------------------------------- | ------ | ---------- | ----- | ----- |
| Regular color (ink per x-height square) | 0.434  | **0.406**  | 0.394 | 0.392 |
| SemiBold vs Regular                     | 1.20×  | **1.32×**  | 1.32× | 1.31× |
| Bold vs Regular                         | 1.31×  | **1.47×**  | 1.45× | 1.45× |
| Bold width vs Regular                   | 1.08×  | **1.075×** | 1.07× | 1.03× |
| Black width vs Regular                  | 1.15×  | **1.12×**  | 1.11× | 1.05× |

- **Regular** stem 90 → 84, with the counters widened so line length is unchanged.
- **Bold** now comes from explicit stems per named weight in `avar` (500: 104, 600: 124,
  700: 144, 800: 163), replacing equal ratios, which had left Bold's stem at 132.
- **Spacing** now tightens slightly as stems thicken; Regular's spacing is unchanged. A heavier
  Bold sits closer to Black on the axis. With the old spacing that grew with weight, Bold set
  10% wider than Regular and failed the no-reflow guard. A separate Bold master would also
  have fixed it, at a cost of about 4–5 KB.

The italic is now drawn (section 10). The remaining gap for body text is a test on
low-DPI screens.

## 9. Kerning

|                                              | Before | After                             | Geist                | Inter  |
| -------------------------------------------- | ------ | --------------------------------- | -------------------- | ------ |
| Class pairs                                  | 101    | **475**                           | 865                  | 706    |
| Glyph pairs (with accented forms)            | 4,628  | **5,274**                         | 14,836               | 20,464 |
| Mean difference from the Geist/Inter average | —      | **12.8 units** (correlation 0.63) | Geist vs Inter: 20.6 |        |

**Which pairs.** `src/kern_candidates.json` lists 489 character pairs: those that Geist and Inter both kern by at least 12 units in the same direction, plus the hand-picked pairs from before. `src/kern_oracle.py` regenerates it. Geist kerns straight quotes against letters ("A) but not curly ones (“A), so a font's vote for the straight form also counts for the curly forms. Without that rule, the most common quote pairs in real text (“A, A”) fell out of the list. Only the list comes from those fonts. A pair is
kept only when Cascivo's own measurement agrees in direction and is at least 10 units. Three
were dropped on direction: `A-`, `-A` and `77`, where our shapes differ.

**How much.** The first model had two biases against the references:

- **Too strong on round letters and punctuation.** `D.` was −84 where the references use −32.
- **Too weak on diagonals.** `AW` was −28 where the references use −81. A shallow depth cap
  also flattened every strong pair to about −52.

The model now has three terms: the depth-capped average gap, the closest point, and how far the
two facing sides lean the same way. Least squares fitted the weights on 70% of the pairs. On the
other 30%, it is off by 15 units on average (correlation 0.61). Geist and Inter differ from each
other by 21 units (correlation 0.45), so the model sits inside expert disagreement. It still
undershoots the strongest pairs (about −56 where the references average −78). That errs toward
loose rather than colliding.

**Two spacing fixes the measurement exposed.**

- **Tailed `l`.** The measurement wanted `l` pulled 40–70 units toward every following letter.
  Its sidebearing reserved room for the tail, which left a hole above it. The tail now tucks
  under the next letter (right sidebearing −0.25 of the spacing unit). Only `l.`, `l,` and `l…`
  are kerned, and they are opened by 40 units.
- **`t` and `f`.** Their crossbars reached left almost to the previous stem at Black (`ht`,
  `at`). Their left sidebearings went from 0.3 to 0.55 and 0.45 of the spacing unit.

**Size.** Kerning varies with weight but barely with optical size or slant, so those masters
reuse Regular's values. That saves 1.6 KB. In total, the larger kerning set costs about 1.8 KB
on the Latin web file (19.6 → 21.5 KB; 21.6 KB after the comma redraw). That is still 102 bytes per character, against 131 for Geist. A regression test checks that the classic pairs are kerned (To, AV, Av, T., “A, A”, Áv), that stem pairs are not (nn, HH, LM, FG), and that `l.` opens.

## 10. The italic

**A separate font, not a slant axis.** A drawn italic changes the structure of some letters, for
example a single-storey `a`. Masters on one variable axis must share structure, so the italic
is its own variable font (`wght`, `opsz`). A STAT `ital` axis links the two fonts, so apps group
them as one family, and CSS maps `font-style: italic` to the italic file. The earlier `slnt` axis
was removed. It offered a second, mechanical slanted style beside the real one, and it cost 4 KB
in the upright file.

**Drawn, not sheared.** Centerlines are slanted 10° around mid-x-height _before_ the pen expands
them. The pen measures direction against the slanted stress axis, not the vertical. Curves get
their thick and thin parts where an italic's stress puts them, instead of where a shear of the
upright would leave them. Spacing is measured on the upright drawing and carried over. Kerning
is measured on the italic outlines, with the same candidate list and model as the upright.

**Italic forms.** `a` is single-storey, and so is the `a` in `æ`. `f` descends and hooks left
under the previous letter, and `ſ` and `ß` descend with the same hook. `y` ends in a curved
tail. Counters are 5% narrower. The italic passes the same no-reflow test as the upright (Thin
0.95×, Bold 1.08×, Black 1.13× of Regular).

**Fixes found while drawing it.**

- The italic `e` bar stops short of the bowl's end. A square cut across a slanted stroke no
  longer covers the bar's corner.
- Straight stems are cut flat on the baseline, x-height and cap height. A cut square to the
  slanted stroke dipped 7 units below the baseline at Regular. It also pushed the half-scale `T`
  and `M` in `™` outside the glyph's bounding box, which Font Bakery reported.
- Heavy `t` hooks end earlier (286° → 272°) and taper to 0.7, so their inside does not fold.
  This also fixed a near-fold in the upright Black `t`. The angle stays in one quadrant, so
  every master keeps the same structure. Heavy italic `t`s are also up to 14% wider, because the
  slant tightens the inside of the hook. Without the extra room, Black kept a small notch there.
- The cedilla is now two overlapping strokes, because one stroke could not offset cleanly round
  its right-angle turn. The capital breve has a minimum depth, because a shallow arc thinner
  than its stroke folds inside.

**Size.** The italic Latin web file is 24.2 KB for every weight, against 21.8 KB for the upright.
The difference is inherent: once outlines are slanted, every point that moves vertically
between masters also moves horizontally, so it carries more variation data. For comparison,
Plex ships 24.4 KB for one static italic weight, and Inter 51.8 KB for its variable italic.

## 11. Heavy weights

Bold and Black looked worse than Geist and Inter at the same weights. The lighter weights did
not. Measured on rasterised `n`, `o` and `e` (percent of x-height, at 900):

| At Black (900)                       | Before | After | Geist | Inter |
| ------------------------------------ | ------ | ----- | ----- | ----- |
| Stem                                 | 33.7   | 36.0  | 35.9  | 36.0  |
| `n` sidebearing                      | 14.0   | 9.7   | 10.4  | 9.1   |
| Gap between letters ÷ gap inside `n` | 1.01   | 0.68  | 0.85  | 0.63  |
| Thin ÷ thick stroke of `o`           | 0.60   | 0.72  | 0.70  | 0.73  |
| `e` crossbar                         | 15.7   | 20.3  | 19.3  | 19.7  |
| Ink density in the x-height band     | 0.57   | 0.62  | 0.65  | 0.65  |

**Four causes, four fixes.**

- **Spacing did not tighten.** Geist and Inter lose about 30% of their Regular sidebearing by
  Black. Ours stayed level while the counters shrank, so at Black the space between letters
  equalled the space inside them, and words fell apart into separate blobs. The spacing unit now
  tightens with the stem above Regular. Total width still meets the no-reflow test.
- **Horizontals thinned too far.** Black contrast was 0.60. Section 6 took that figure for Geist's,
  but a raster measurement of Geist's `o` gives 0.70. Black contrast is now 0.72, so arches,
  bars and the `s` spine no longer pinch.
- **Square cuts became long facets.** A curved terminal cut square to a Black stroke that leaves
  the curve at 30-50° is a long diagonal face, and it made `s`, `a`, `c` and `e` read as
  lightning bolts. Above Regular, the cut now turns toward the vertical (the slant in the
  italic), as Geist and Inter cut their `s`, `a`, `r` and `f`. The `c` and `e` turn toward the
  horizontal instead, and only halfway: a vertical cut narrowed their apertures to slits, and
  Geist and Inter cut them about 20° off flat. The cut pivots on the edge that ends further
  back, so it only trims. A stroke that ends travelling vertically or horizontally keeps its
  square cut, so the joins at bowl extremes are untouched. Regular and lighter keep their square
  cuts unchanged.
- **Black was too light.** Its stem was 178, 34% of the x-height. It is now 190 (36%, as in
  Geist and Inter), set once as `BLACK_STEM`. Every heavy-weight adjustment is scaled by
  `p.heavy`, which is 1 at Black whatever the stem, so the Black tuning carries over. Bold keeps
  its stem, and ExtraBold rises from 163 to 168 so the steps stay even.

**Glyph fixes at heavy weights.**

- `s`: wider, with a heavier spine that lies flatter. The upper bowl takes a little more of the
  height, so its counter stays open at the heavier Black.
- `t`: stem and foot are now one outline drawn directly, not a stroke, so the inner corner can
  be nearly square without folding (a stroke turning tighter than half its width folds inside).
  Its corner radii are master parameters: Regular keeps its round hook, and Black turns with a
  near-square inner corner into a flat foot, as Geist's and Inter's do. The heavy t takes more
  room on its right, because the flat foot now runs along the baseline where the hook used to
  lift away; at Black it touched a following `z`.
- `a`: the bowl is now an outer shape and a counter drawn directly, not a stroke. As a stroke,
  its thickness followed the pen and a straight diagonal join into the stem, and at Black the
  counter was a slit with a nick at its lower right. Drawn, each thickness is a master
  parameter, and the counter's right side runs flat against the stem, as in Geist and Inter.
  The heavy bowl rises a little and its left side lightens. Measured as enclosed area in the
  lower part of the letter (percent of x-height squared), the Black counter is 6.2 against
  Geist's 4.2 and Inter's 4.3: the same area as before, now round instead of a slit, and a
  little more open, like our other counters. The upright `æ` shares the same bowl.
- `c`: 8% wider.
- `&`: rebuilt at every weight, because it was broken, not just heavy. The leg leaves the top
  loop where it runs tangent to it, so it no longer pokes into the loop's counter. The arm rises
  out of the bowl in one stroke and is no longer a separate wedge.

Regular is unchanged except for the `&`, the `t`, whose rebuilt foot keeps Regular's hook but now
ends on a vertical cut, and the `a` and `æ`, whose bowl now meets the stem in a curve rather
than a diagonal. At 500 px, the largest raster difference in any other Regular glyph
is 69 pixels, in `Œ`, from how its overlapping `O` and `E` rasterise after
quadratic conversion. A test checks that Black's sidebearing is at most 0.8 of Regular's, and
that Black's `o` keeps a contrast of at least 0.68.

**Still behind.** Ink density at Black is 0.62 against 0.65, because our counters stay a little
more open than Geist's and Inter's.

## 12. The full alphabet at Black

After section 11, the lowercase held up beside Geist and Inter, but the capitals and figures did
not. Every letter and figure was measured against the mean of Geist and Inter at Black: ink width,
enclosed counter area and total ink, each relative to the x-height.

**Visible defects, now fixed.**

- `3`: the middle bar's square end stuck out left of the bowls as a spur. The bar now starts
  where the bowls end.
- `5`: the stem and the bowl's start sat at different x, leaving a step. The bowl's start angle
  is now solved per master so it begins exactly under the stem (within one quadrant), the stem
  ends flat on it, and the top bar starts at the stem's left edge. Regular had a small step too,
  so Regular's `5` changed.
- `G`: the bar ran to the curve's outer edge, where the curve has already turned inward, and
  overhung it. It now ends inside the curve's stroke.
- `?`: Black's dot is 227 units tall and reached the hook, which ended at a fixed 27% of the cap
  height. The hook now ends a fixed gap above the dot, and its bowl rises with it. A test checks
  the gap at Black.
- `9` and `6`: their terminals were cut toward vertical on a steep stroke and left a step.

**Terminal cuts.** Geist and Inter cut the heavy terminals of `c`, `e`, `s`, `C`, `G`, `S`, `3`,
`5`, `6` and `9` close to horizontal, not vertical. Those now turn halfway toward horizontal (the
italic `6`, `9`, `s` and `S` keep the vertical turn, because the flat cut folds once slanted).
The `a`, `r`, `f`, `j` and `y` keep the vertical turn.

**Proportions at Black** (Cascivo ÷ the Geist/Inter mean):

| Glyph               | Was                      | Now                      | Change                                                         |
| ------------------- | ------------------------ | ------------------------ | -------------------------------------------------------------- |
| `C`                 | width 0.75, ink 0.71     | width 1.04, ink 0.90     | 12% wider, terminals run further round                         |
| `c`                 | width 0.89, ink 0.77     | width 0.97, ink 0.88     | terminals run further round                                    |
| `G`                 | ink 0.85                 | ink 0.91                 | terminal runs further round                                    |
| `S`                 | width 1.12, ink 0.77     | width 1.05, ink 1.02     | terminals run round, half the `s`'s extra width, heavier spine |
| `3`                 | width 0.80, ink 0.80     | width 1.04, ink 0.91     | 8% wider, terminals run further round                          |
| `5`                 | ink 0.84                 | ink 0.89                 | terminal runs further round                                    |
| `e`                 | counter 0.30             | counter 1.05             | the bar drops half its height, opening the eye                 |
| `A`                 | counter 0.38, width 0.93 | counter 0.84, width 0.98 | wider, bar lower                                               |
| `4`                 | counter 0.29             | counter 1.17             | bar lower, lighter diagonal meeting the stem's middle          |
| `P`                 | counter 0.74             | counter 1.02             | bigger bowl                                                    |
| `v` `V` `X` `k` `K` | width 0.87-0.91          | width 0.95-0.99          | 8-10% wider                                                    |

Every change scales with `p.heavy`, so Regular is unchanged except for the `5`. The serifed `I`,
the tailed `l`, the `i` and `j` and the more open round counters (`o`, `b`, `d`, `p`, `q`: 1.2-1.3×)
remain different from Geist and Inter by design.

**The S and s.** Geist's and Inter's heavy S runs each bowl past its widest point and ends on a
near-flat face low on the curve, which keeps the counters small and round. Ours stopped near the
corners, so the S was wide-open and light. Running that far crosses a quadrant boundary, and
`arc()` splits curves at every quadrant, which would change the segment count between masters.
The terminal segment is therefore drawn as one cubic along the ellipse (`_ell_seg`), with
handles scaled from the same squareness, in every master that needs it. The heavy `s` gets the
same terminals (its short upper bowl runs less far, or its inside folds) and takes 70% of its
old extra width, since the terminals now carry part of that job. The S's horizontals are 10%
heavier at Black.

## 13. The full alphabet at Bold

Bold has no master of its own: it is drawn between Regular and Black. The same letter-by-letter
comparison found four defects there that Black did not show, or showed less.

- `e`: the dropped heavy bar's lower right corner showed below the bowl as a step. The bowl now
  starts at the bar's underside, on a flat cut (one cubic below 0°, so the segments match), and
  the æ's `e` ends its bar inside the bowl as `e` does.
- `6` and `9`: the heavy cut trimmed the terminal's inside back almost to the top of the curve,
  and Bold, interpolating that end point along a straight line, cut a dip into the curve. Heavy
  terminals now end higher, so the cut trims little.
- `&`: the leg's tangent point was computed on an ellipse with the full pen, but the loop's pen
  is capped for small rings, so the leg started inside the counter. It now uses the loop's own
  centreline and starts at the loop's width, widening toward the foot.

At Bold, `c` and `C` measured 0.84-0.85 of the references' ink, inherited from Regular, where the
open `c` and `C` were lighter still (0.78-0.79). Their terminals now sit 14° further round at
every weight, and at Regular the `c` is 6% wider and the `C` 5% wider; Black is unchanged. Both
now measure 0.90-0.91 of the references' ink at Regular, Bold and Black. The `G`'s top terminal
follows the `C`'s. The `r`'s long arm makes it wider than Geist's and Inter's at every weight (1.5× at
Regular).

## 14. The full alphabet at Regular

Regular carries about 0.94 of Geist's and Inter's ink overall, by design (section 8). Measured
the same way as Bold and Black, it had no defects, but four groups fell clearly below that
level or out of proportion:

| Glyph               | Was (width, ink)     | Now (width, ink)     | Change                                     |
| ------------------- | -------------------- | -------------------- | ------------------------------------------ |
| `s`                 | 0.90, 0.77           | 0.98, 0.88           | terminals 26° further round, 4% wider      |
| `S`                 | 1.01, 0.80           | 1.03, 0.89           | terminals 26° further round                |
| `3`                 | 0.90, 0.86           | 1.00, 0.94           | terminals 10° further round, 6% wider      |
| `v` `w` `x` `y` `z` | 0.88-0.91, 0.86-0.93 | 0.97-0.99, 0.91-0.96 | 8-10% wider                                |
| `W`                 | 1.02, 0.85           | 1.02, 0.94           | diagonals 96% of the stroke instead of 86% |
| `M`                 | 1.00, 0.87           | 1.00, 0.91           | diagonals 94% of the stroke instead of 86% |
| `Y`                 | 0.97, 0.88           | 0.97, 0.92           | arms 98% of the stroke instead of 92%      |
| `J`                 | 1.05, 0.87           | 1.08, 0.91           | hook runs 12° further round                |

For `s`, `S`, `3`, `W`, `M`, `Y` and `J`, the heavy-weight terms shrink by as much as Regular
moves (for `s` and `S`, `_S`'s `close`), so Black is unchanged. `v` keeps its Black width; `w`,
`x`, `y` and `z` are wider at every weight, which Black's measurements allowed (0.95-1.05 of the
references).

## 15. The italic alphabet

The italic was measured the same way, against Inter's and Plex's italics at Regular and Bold,
and against Inter's alone at Black (Plex stops at Bold). The medians sat at 1.00 for width and
ink at Regular and Bold, and 0.98 at Black. Most flags are deliberate: the serifed `I`, the
`r`, and a `1` measured against Plex's foot serif. Most Black flags (`T`, `Y`, `M`, `V`, `0`,
`6`, `9`) came within 0.93-1.00 of our own upright, so they record Inter's wider Black italic,
not an italic defect. Five things were real:

| Glyph                                   | Was                                    | Now                                   | Change                                               |
| --------------------------------------- | -------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| `s` `S` `3` `5` `6` `J` `G`, Bold-Black | wedge-shaped terminals, seams at joins | clean                                 | heavy terminal cut measured on the unslanted drawing |
| `e`, Regular                            | eye 0.69                               | eye 0.94                              | bar 0.4 of its height lower, short of Black          |
| `4`, Regular                            | counter 0.65 (upright 0.73)            | 0.73, Inter alone 0.80 (upright 0.83) | stem further right, bar lower, in both styles        |
| `A`, Black                              | counter 0.74                           | 0.95                                  | 6% wider at Black                                    |
| `R`, Black                              | counter 0.73                           | 0.87                                  | 6% wider at Black                                    |

**The heavy terminal cut.** Heavy curved terminals turn their cut toward vertical or flat
(section 11). In the italic, the turn was measured on the slanted stroke. A join running along
the slant, where a bowl meets the s's spine, read as 10° off vertical. It was turned, then
trimmed on one edge, which opened a white wedge between the strokes, and the terminals came out
as lopsided wedges. Now the share of the turn is read off the unslanted drawing and applied to
the slanted stroke, toward the slanted vertical. A join, where that share is nothing, keeps the
pen's own end. With that, the italic `s`, `S` and `6` take the flat-leaning cut like the
upright; only the `9`, whose 180° turn makes the slant asymmetric, keeps the vertical one.

The upright is unchanged except for the `4` and the glyphs built from it (`¼`, `¾`, and the alternate fours). Black is unchanged in both styles apart from the italic `A` and `R`.

## 16. The italic alphabet at Bold

At Bold the italic sat at 1.02 of Inter's and Plex's width and 1.01 of their ink (median). Beside
the deliberate differences already noted (the serifed `I`, `1` against Plex's foot serif, the `i`
and `j` dots), six glyphs fell out. Every one was short in our upright against Geist and Inter
too, so all six were fixed in both styles:

| Glyph      | Was, Bold (italic vs Inter / Plex; upright vs Geist and Inter)         | Now                                        | Change                                                                 |
| ---------- | ---------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `r`        | width 1.16 / 1.12; upright 1.19 (1.50 at Regular)                      | italic 1.09; upright 1.11 (1.30)           | arm shorter at Regular; Black unchanged                                |
| `6` `9`    | ink 0.91 / 1.05; upright 0.88-0.90 at every weight, Black counter 0.80 | upright 0.90-0.91, Black counter 0.90-0.93 | bowl 0.63 of the cap height, not 0.60; Regular's hook 8° further round |
| `J`        | ink 0.95 / 0.85; upright 0.88-0.91 at every weight                     | upright 0.95 / 0.92 / 0.90                 | hook taller and 8° further round, 3% wider                             |
| `T`        | width 0.90 vs Inter; ink 0.92 in the upright at every weight           | width 0.99; upright ink 0.94               | 5% wider                                                               |
| `A`        | ink 0.92 vs Inter; upright 0.91 at every weight                        | italic 0.96; upright 0.93-0.96             | Regular's diagonals at the full stroke; Black's unchanged              |
| `4` italic | counter 0.82 / 0.87                                                    | 0.90                                       | stem 2% further right in the italic                                    |

The `J`'s hook stops just short of −180° in every master, so it keeps one segment count where a
master's negative aperture would have taken it past the quadrant.

## 17. Black, text, symbols and optical sizes

Four checks after the Bold round, in this order.

**Black.** Against Inter's Black italic (and Geist's and Inter's Black upright), three glyphs were
still short in both styles:

| Glyph   | Was, Black (upright vs Geist and Inter) | Now                    | Change                                                                |
| ------- | --------------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `6` `9` | ink 0.89-0.90; hook tapering to a point | 0.94-0.95              | hook on a wider ellipse, ending at 58° instead of 72° without folding |
| `A`     | ink 0.90, counter 0.84                  | ink 0.95, counter 0.90 | 4% wider at Black, diagonals 97% of the stroke instead of 93%         |

`T`, `M`, `V`, `Y` and `0` stay narrower than Inter's italic, but within 0.93-1.00 of our own
upright: Inter's Black italic is simply wider.

**Text.** Spacing was measured pair by pair: for the 160 commonest letter pairs of an English
sample plus 30 kerning classics, shaped with kerning by HarfBuzz, the white between the two
glyphs' ink (depth-limited, slant-corrected), in units of the font's own `nn` or `HH` gap. Ours
against the references' mean, summed per letter side, says which sidebearings are off:

| Side                                  | Was (vs references)             | Change                                |
| ------------------------------------- | ------------------------------- | ------------------------------------- |
| `v` `w` `x` `y`, both sides           | 12-20% tight (`wh`, `ow`, `ny`) | sidebearings 0.1 → 0.2-0.42 of a unit |
| `k`, `r`, `f`, right side             | 10-20% tight (`ke`, `ra`, `fo`) | 0.1-0.25 of a unit more               |
| `J`, right side                       | 7% loose                        | 0.1 of a unit less                    |
| italic `t`, both sides; Bold `t` left | 15-25% loose                    | less, short of meeting diagonals      |
| italic `g`, right side                | 10% tight                       | 0.15 of a unit more                   |

The mean pair error fell by 17-26% (Regular 0.071 → 0.059, Bold italic 0.087 → 0.064), and the
pairs off by more than a quarter from 1-11 per style and weight to 0-3. Text sets 2-4% wider
than Geist's and Inter's at the same x-height, as before (the changes add under 0.5%).

A clearance check over every kerned pair found the tailed `l` running into `A`, `X` and `x` (-11
units at Regular, -21 in the italic) and the Black italic `f`'s descender into `k`, `r`, `v`, `w`,
`x` and `y` (-24). The `l` pairs join `OWN_SHAPE_PAIRS` and open by measurement; the heavy italic
`f` gets a left sidebearing, as kerning picks its pairs at Regular, where these do not touch. A
test now keeps them clear. `fT` still touches at Black italic, and `ZX`/`LX` at Display Black
italic; neither occurs in running text.

**Symbols.** Measured against Geist and Inter, punctuation grew too fast with weight: the period
carried 0.89 of their ink at Regular and 1.6 at Black, commas 1.7x as tall. The dot (period, i
and j dots, colon, ellipsis) is now 6% larger at Regular and 25% smaller at Black, and the comma's
tail shallower at Black; the Black `i` is no longer wide (1.19 → 0.98). Commas and quotes still
carry about 1.1x the references' ink: the square head is Cascivo's.

| Glyph           | Was, Regular (Black)                | Now                     |
| --------------- | ----------------------------------- | ----------------------- |
| `•`             | a hollow ring, 0.64 size (0.86)     | a solid disc, 0.97-1.05 |
| `°`             | 0.61 size (0.68)                    | 0.90-1.03               |
| `«` `»` `‹` `›` | 0.78 size (Black's chevrons merged) | 0.90-1.07, open         |
| `-`             | 0.70 long (0.95)                    | 0.92-0.97               |
| `*`             | 0.78 size, high (Black filled in)   | 0.99-1.05               |
| `^`             | 1.5x size                           | 1.05-1.08, raised       |
| `~`             | 0.67 high                           | 0.80-0.95               |

The bullet was a ring because `oval` caps its pen at a third of the ring, so small rings keep a
counter; it is now drawn directly. Left as they are: `®` (cap height, where both references use a
small raised one), `ª` `º`, `€` (narrow on the tabular width), the braces (narrow), and capital
accents, which sit about 0.1 x-height lower than Plex's and 0.06 lower than Geist's and Inter's.
The Latin Extended accents could not be compared: all three reference files are Latin subsets.

**Optical sizes.** No reference has an optical-size axis, so the check is internal: every glyph's
advance and ink at opsz 8 and 48, relative to 14, at Thin, Regular and Black, against the median
glyph. No glyph changed in these rounds stands out; the outliers are structural groups that move
together (narrow glyphs whose advance is mostly sidebearing, Thin's operators, which follow the
horizontal stroke), plus the fraction slash. All corners render without artifacts, and
the clearance check holds at the corners except the Display Black italic pairs above.

## 18. Kerning, spacing, symbols and Latin Extended

Five follow-ups, with full-charset references this time: Inter 4.1 and Geist from npm (`inter-ui`,
`geist`), and Plex's complete static files (`@ibm/plex-sans`); the earlier files were Latin
subsets.

**Kerning.** Measured as kern values (units per x-height) against Inter and Geist on all 327
candidate pairs, Regular matched in total (1.02) but Bold carried 0.87 and Black 0.76 of the
references' kerning, short above all in the strongest pairs (`AW`, `LT`, `LY`, `TJ`, at about half).
The white-gap measure of section 17 had read `A` and `T` as over-kerned; it caps depth, so it
cannot see the open space a pair like `To` closes, and it is not used to judge kerning. Closing
kerns now grow with weight, 1.3x by Black: the totals are 1.00, 0.99 and 0.97. A power curve on
the values would not help at Regular (11.0 → 10.7 units mean error): what is left there is
pair-to-pair scatter, smaller than Inter and Geist differ from each other.

**Spacing.** Set at equal x-height, upright text ran 3% longer than Geist's and Inter's: 2-3%
from wider letters (by design), the rest an `nn` gap 10% wider at every weight. The spacing unit
is 9% tighter (5% at Black), the italic's 3% (7% at Black); the letters are unchanged. Text now
sets 1.009 (Regular), 1.017 (Bold) and 1.025 (Black) of the references' length, and the Regular
`nn` gap is 0.294 x-height against their 0.292. Pair spacing error at Regular fell again (0.059 →
0.052, no pair off by a quarter). The generous heavy-weight sidebearings of section 17 (italic
`t` and `f`) came back in: the pairs they protected are now kerned open per master.

**Collisions.** Kerning picks its pairs at Regular, so a pair clear there but closing at Black
was never kerned. `OWN_SHAPE_PAIRS` are now always kept and only ever open, by however much each
master measures: `lz`, `tz`, the italic `t` after a diagonal (`xt`, `kt`, `yt`, `vt`), and `VT`,
`WT`, `YT`, `XT`, `fT`. The heavy italic `L` and `Z` get right sidebearing for `LX` and `ZX`.
Every letter pair now keeps clear at every weight and optical size (the tightest is 2 units, at
Display Black italic), and the regression test checks Display Black as well.

**Symbols.** `®` is a raised mark two thirds the size of `©`, drawn small at the full stroke
rather than scaled; `ª` `º` are 0.7 of the lowercase with their tops at the cap height; `€` uses
the full figure width; the braces are twice as wide. `©` and `®` were 0.6x the references' ink
at Regular: the circle's stroke is heavier at light weights.

**Latin Extended.** Each accent was isolated as the ink above (or below) its base letter and
compared with Inter's, Geist's and Plex's on all 157 accented letters of Latin-1 and Latin
Extended-A.

| Finding (Regular unless noted)                                    | Was                        | Now                                             |
| ----------------------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| Capital accents, gap above the letter (cap height)                | 0.06 (refs 0.10-0.15)      | 0.09-0.16, within 0.02 of each reference letter |
| Capital accents, size                                             | 0.75x (scaled 0.82)        | 0.97 scale                                      |
| `¨` `˙` `¯` over lowercase, gap (x-height)                        | 0.10-0.13 (refs 0.16-0.22) | 0.16-0.22, within 0.01                          |
| `˜` height, `˚` size, `ˆ` `ˇ` width                               | 0.75x, 0.65x, 0.8x         | matched                                         |
| Bold/Black: `ˆ` `ˇ` height, dots and tildes, cedilla, comma below | fixed sizes and gaps       | follow weight as the references do              |
| `į`                                                               | no dot                     | dotted                                          |

Flagged letters (gap off by 0.04-0.06, size off by a fifth or more) fell from 87, 67 and 66 at
Regular, Bold and Black to 3, 2 and 5; the italic's from 93 to 11. What is left: the Black breve
stays 1.27x tall (lowering it folds the outline), the capital ring is slightly small, and the
rest are measurement artifacts (`ť`'s comma caron, the comma-shaped `ș`). Acutes stay centred
where the references push them right.

## 19. A third reference, the breve, acutes, and the specimen

**Helvetica.** Inter and Geist share a lineage, so the alphabet was also set against a Helvetica
design: FreeSans, GNU FreeFont's derivative of URW's Nimbus Sans (Helvetica Now and Söhne are
commercial). Only consensus outliers count: a glyph off by more than 8% from all three in the same
direction. Stem and horizontal thickness match all three within a few per cent at every weight
(contrast 0.85, 0.76, 0.72 at Regular, Bold, Black against their 0.86-0.97, 0.77-0.82, 0.72-0.75).
What the three agreed on:

| Glyph      | Was (vs Inter / Geist / Helvetica)      | Now          | Change                                                    |
| ---------- | --------------------------------------- | ------------ | --------------------------------------------------------- |
| `e`        | eye 0.78 / 0.79 / 0.73 (Bold 0.83-0.87) | within range | bar lower at every weight short of Black, as the italic's |
| `V` `X`    | ink 0.80-0.91 at Regular                | within range | Regular's diagonals at the full stroke                    |
| `r`        | 1.28-1.34 wide at Regular               | 1.16-1.22    | shorter arm again (Black kept)                            |
| `M`, Black | ink 0.88-0.92                           | heavier      | Black's diagonals at 0.90 of the stroke, not 0.86         |

Left as they are: the serifed `I`, the tailed `l` and the `t`'s crossbar (design), `C` slightly
light at Regular, and the bowl letters at Bold and Black (`b d p q a o D`), whose counters are
16-26% larger than all three's at equal ink. That comes from the bowl drawing, round right into
the stem where the references flatten and thicken the join; changing it is a redraw of every bowl.

**The breve** is drawn directly now, outer and inner half-ellipse, so its depth and the thickness
of its bottom are separate parameters: as a stroke, a shallower one folded. Black's stood 1.27x
as tall as the references'; it is now 0.21 of the cap height against their 0.22, and the italic's
runs deeper, as Inter's and Plex's do.

**Acutes and graves** sit 45 units right and left of the letter's centre, as Inter's, Geist's and
Plex's do (Á, ć, ŕ, Ś within 0.02 of the references' offset), and are steeper (they were 1.4x as
wide). The acute on `Ĺ` sits over the stem. In the heavy italic the macron, tilde and breve keep
their height, as Inter's italic does. Accent flags fell to 3, 2 and 1 upright, and 11, 20 and 8 in
the italic (Regular, Bold, Black).

**Italic Bold spacing.** With collisions now kerned per master, the italic `t`, `f` and `G` came
back in (`wt`, `rt` joined the own-shape pairs). Only `tt` stays loose (1.3x): Inter and Plex let
the two crossbars nearly join.

**The specimen** gained a languages-and-symbols section: Czech, Polish, Hungarian, Romanian and
Turkish samples with weight and italic switches, and a grid of 32 symbols. The page no longer
scrolls sideways on a phone (the size chart's hidden tooltips did not wrap).

## 20. Heavy bowls, tt, comma accents, and the browser

**Heavy bowls.** At Bold and Black the bowl letters' counters ran 16-40% larger than Inter's,
Geist's and Helvetica's at equal ink. The suspected cause, the thin, tapered join into the stem,
was not it: joins at full weight and a longer overlap moved the counters by 1-3%. Rendered, the
counters were both taller (0.64 x-height against 0.59-0.62 at Bold) and wider (0.45 against 0.41),
and the `o`, which has no join, showed the same. Two causes: the overshoot grew with weight (0.025
x-height at Regular, 0.034 at Black) where the references' stays constant, and the bowls are wide.
The overshoot now stops growing at Regular, and `b d p q o` narrow 5% by Black (`D` 4%), which
also brings their widths to the references' (Black `o` was 1.08x Inter's). Regular's widths, a
deliberate choice (section 8), are unchanged. The `a`'s bowl, lifted and lightened at Black in
section 12 to keep it from closing, had overshot to 1.5x the references' counter; it keeps a
smaller lift and its full left side (1.16-1.23x). At Bold no bowl letter is a consensus outlier any more (there were six; `Y`'s ink, unchanged, now sits just past the 8% line), and the italic's bowl counters at Bold from 1.10-1.13 of
Inter's to about 1.01.

**tt.** The kern measure gives it -32 in the italic and -41 upright, but no reference list carries
the pair. It joins as an own closing pair; italic `tt` now has 1.14x the references' white (was
1.30), upright 1.04.

**Comma accents.** The comma below hung 1.2x as deep as Inter's, Geist's and Plex's and sat
0.02-0.04 x-height too close, at every weight; at Black, where an earlier fix had shrunk the whole
comma, it was also too narrow. It now sits lower with a shorter tail and keeps its head wide when
heavy (the italic's head narrows a little: a shorter tail alone folded it). `ť`'s comma reaches the
ascender, as `ď`'s and `ľ`'s and the references' do. The heavy italic macron is thinner (Bold's
was 1.3x Inter's and Plex's). Accent flags now: 3, 3, 2 upright; 7, 3, 4 italic.

**The browser.** In Chromium (the only engine installed here; Firefox and Safari were not tested),
`font-optical-sizing: auto` renders pixel-identically to the explicit `opsz` for the font size at
10, 24 and 48 px, and differently from `opsz` 14, at device pixel ratios 1 and 2: the optical-size
axis is picked up as intended. At 9-16 px, upright and italic, from Light to Bold, the unhinted
outlines render without dropouts and with the density of Inter's.

## 21. Y, C, FreeType, and the 0.2.0 release

**Y and C.** Against all three references the `Y` carried 0.89-0.92 of their ink at every weight
and Black's was 0.87x Inter's width; its arms are now at the full stroke and it widens 5% by
Black (0.93-0.95 of Geist's and Inter's ink). The `C` carried 0.85-0.93; its terminals sit a further
6° round, and `G` with it (`C` 0.93, `G` 0.90-0.93 at every weight, Regular's 0.94 overall being by
design).

**FreeType.** Firefox on Linux renders with FreeType's light autohinter (fontconfig `hintslight`).
Rendered that way and unhinted, at 9-16 px, Regular and Bold, Cascivo Sans lands on the same
whole-pixel x-height as Inter at every size (5 px at 9 px to 9 px at 16 px) and its stems on
Inter's to within 0.07 px, without dropouts. Safari (Core Text) is still untested.

**0.2.0.** The version moves to 0.2.0 ([CHANGELOG.md](./CHANGELOG.md)). Four static TTFs join the
variable ones for apps that link styles by name: Regular, Bold, Italic and Bold Italic at optical
size 14, about 36 KB each, with their family name, weight class and style bits checked by a
test. Font Bakery passes them with no failures; they share one underline, and keep the STAT table.

## 22. Vietnamese and more, and hinting

**Coverage.** 365 codepoints became 479: all of Vietnamese (Ơ ơ Ư ư and Latin Extended Additional
U+1EA0-1EF9), Welsh `Ẁ ẁ Ẃ ẃ Ẅ ẅ Ỳ ỳ`, Azerbaijani `Ə ə`, the Croatian digraph characters
`Ǆ ǅ ǆ Ǉ ǈ ǉ Ǌ ǋ ǌ`, and the combining hook above, horn and dot below. Almost all of it is
composites, so the full web file grew 2.9 KB and costs less per character than before (78 bytes
against 95); the Latin slices are unchanged.

Three marks are new. The hook above is a small question-mark head whose radius follows its stroke
(drawn smaller, it folded); the horn leaves the bowl 40° up its right side on `O o`, and the top of
the right stem on `U u`, from anchors those glyphs name; the dot below hangs as far under the
baseline as the dot accent sits over the x-height, and on `ỵ` sits right of the descender, under
the junction, as Inter's does. Stacked accents follow Vietnamese practice, as Inter and Plex do:
acute, grave and hook sit beside a circumflex, to its right; anything else stacks above the first
mark. `Ə` and `ə` are the `e` turned round its centre. The digraphs are two letters at their
normal spacing, with room after the tailed `l` (a composite is never kerned). The capital sharp
s `ẞ` is still missing.

Setting the Vietnamese showed an older fault: Black's tilde, a wave as thick as the accent stroke,
had closed into a slanted bar that read as a grave (`ñ`, `õ` too). Heavier, it is now wider, thinner
and deeper. The stacked capitals reach 1267 units, so the Windows clipping extent (`usWinAscent`) is
now worked out from every master location of both fonts and shared by the family; line spacing is
unchanged (USE_TYPO_METRICS).

**Hinting.** The four static TTFs are hinted with ttfautohint (`no_info`, so the build stays
byte-reproducible); glyphs built from scaled or turned components (™, the turned commas, the
ordinals) are drawn out first, since hinted fonts must not transform components. Font Bakery passes
them with no failures. Rendered monochrome by FreeType's TrueType interpreter, the nearest thing here
to Windows GDI, the hinted Regular and Bold carry 5-12% more ink at 10-14 px and fewer broken
strokes. The variable fonts stay unhinted, as Inter's and Geist's web fonts are. The statics grow
to about 69 KB each.

## 23. Mark-to-mark, ẞ, and Cyrillic

**Mark-to-mark.** Precomposed Vietnamese stacked correctly (section 22), but text typed as
separate combining marks did not: with only a `mark` feature, a second accent attached to the base
and landed on top of the first. `mkmk` now carries two lookups. In the first, every top mark
stacks above the previous one at the same 0.45-stroke gap the composites use. In the second, an
acute, grave or hook after a circumflex sits to its right; it runs second, so it replaces the
first lookup's attachment. Anchors are computed from the same bounds as the composites and go
through the italic skew, so `x` + U+0302 + U+0301 shapes exactly like `ấ`. A test checks this,
to within 2 units, in five stacks, three masters and both styles (HarfBuzz recomposes `a` + marks
into `ấ`, so the test needs a base with no precomposed form).

**ẞ.** The capital sharp s is drawn as Inter, Geist and Plex draw it: a stem that rounds into a
flat top, a 7-like diagonal, and a bowl. A round-shouldered form reads as B. Black widens by 8%
and drops the diagonal's foot, or the upper counter closes.

**Cyrillic, not Greek.** Cyrillic was chosen as the larger readership: Russian, Ukrainian,
Belarusian, Bulgarian, Serbian and Macedonian.

- **Reused, not redrawn.** 27 letters are composites of the Latin glyph: А В Е К М Н О Р С Т Х
  Ѕ І Ј, а е о р с у х ѕ і ј, к (= ĸ) and ћ (= ħ). They share the Latin letter's kerning
  classes too. Ё Ї Й Ў Ѓ Ќ Ѐ Ѝ and their lowercase come from the same NFD composite path as the
  Latin accents. Ї and ї use the dotless i; capitals take the `.case` marks.
- **Small capitals.** The lowercase в м н т и я are the capitals' own drawings at the
  x-height: `_small` hands the capital function a copy of the parameters with `cap = xh` and
  a lowercase width.
- **Reflections.** И is N reflected, Я is R reflected, and Э is Є reflected. The pen's thickness
  depends only on the stroke's angle, so a reflected stroke is drawn exactly as the original.
- **The italic** follows Plex's drawn italic for и п т, which take the cursive u n m. The rest
  are slanted roman forms, as Inter and Plex draw them.
- **Л's leg** started as a straight diagonal, which read as a lean beside Н and П. It now drops
  straight and curls out to a foot, as in Inter, Geist and Plex. Љ and л follow.
- **Black.** Д widens by 12%, or its counter shut to a slit. The lowercase з and я stack three
  horizontals in an x-height, and their counters closed (both self-intersected at Black italic).
  They take a horizontal pen 25% lighter at Black, as Inter's do.
- **Kerning.** The candidate list now includes the Cyrillic alphabet. Regenerated from the same
  Geist and Inter, the 489 Latin pairs came back identical, plus 1,045 Cyrillic ones. Letters
  that are Latin glyphs map to the Latin pair (АТ is AT). Й was dropped from the list: it already
  sits in И's class, and giving it a class of its own split the lookup and silently dropped `Ty`.
  491 Cyrillic class pairs are kept.
- **Collisions.** A sweep of the Cyrillic and mixed pairs at the four corners found two shapes
  that touch. ħ's bar (and ћ, the same glyph) overhangs into T, Г, У, V and Y: `Тћ` was at -14
  at Display Black italic, and Latin `Tħ` too, which the Latin sweep had never tried. Ъ Ђ Ћ start
  with a bar at the top left, and `VЪ` and `УТ` were at 0. These are own-shape pairs, which only
  ever open. The tightest Cyrillic pair is now 1 unit, the same as Latin `AX`.

**A bug found on the way.** A comment added in section 22 swallowed `sxHeight` and `sCapHeight`
in the OS/2 call, so 0.2.0 shipped both as 0. CSS `font-size-adjust` and fallback matching read
them. They are restored (528 and 700), and a test pins them. OS/2 now also declares Latin
Extended-B, Cyrillic and Latin Extended Additional, and code page 1251.

**Cost.** The full upright woff2 grows from 37.6 to 51.3 KB, and the italic from 41.8 to 56.9 KB.
About half of that is GPOS, which doubled with the Cyrillic kerning and the mark bases. The
Latin subsets are unchanged (21.9 and 29.1 KB; 0.1 KB is the OS/2 fix), so a Latin-only page pays nothing. A build
takes about 30 s.

## Sources

- [Introducing Geist Pixel (Vercel)](https://vercel.com/blog/introducing-geist-pixel) and the
  [Geist font repository](https://gitee.com/mirrors/geist-font) (v1.7.0 notes: coding ligatures
  moved to `ss11`, Cyrillic redrawn)
- [IBM Plex, Wikipedia](https://en.wikipedia.org/wiki/IBM_Plex) (2017 release, Abbink and Bold
  Monday, Sans Variable on 7 April 2019)
- [Helvetica Now Variable, MyFonts](https://www.myfonts.com/collections/helvetica-now-variable-font-monotype-imaging)
  and [Bookmachine on Helvetica Now](https://bookmachine.org/2020/11/23/helvetica-now-a-new-chapter-for-an-iconic-typeface)
  (optical sizes Micro/Text/Display; Variable in July 2021 with weight, width and optical size)
- Measurements: `fontTools` on the npm releases of `geist@1`, `@ibm/plex-sans@1`,
  `@fontsource-variable/{geist,ibm-plex-sans,inter}@5`, and FreeSans as the Helvetica stand-in.

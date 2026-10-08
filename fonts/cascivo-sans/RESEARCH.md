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
2. **UI defaults.** Tabular figures by default, so numbers line up in tables. `pnum` gives
   proportional figures for running text, `zero` gives a slashed zero, and `ss01` makes `I` and
   `l` unambiguous. `case`, `frac`, `sups`, `sinf`, `ordn` and `mark` are also included.
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

**Six masters, with compatibility by construction.** The masters are Regular, Thin, Black,
Caption, Display and Oblique. The structure of every outline depends only on the glyph code.
Master parameters move points but never add or remove them. Because of this, each master is
point-compatible with the others automatically, and variable fonts require that. Additive
deltas make three axes cost six masters instead of a 3×3×2 grid. An `avar` table makes each
named weight a constant _ratio_ of stem thickness. A linear scale crowds the light end
(Thin→ExtraLight is a doubling), and equal ratios look like equal steps.

**Measured kerning, curated pair list.** For each class pair, the gap between glyph profiles
is measured in 10-unit bands. Deep holes count only up to a limit, which matches what the eye
does. The result is compared with the gap between two stems. An explicit whitelist decides
which pairs get kerned: 99 class pairs, which expand to 4,565 glyph pairs. An early version
kerned every pair that "measured loose". It tightened `LM` and `FG`, which a type designer
would never do.

**Automated outline lint.** Naive stroke expansion fails on tight inner curves: the offset
loops back on itself, and you get notches on heavy terminals. `src/lint.py` checks every stroke
contour in every master for self-intersection. The build ships with zero problem contours.

### Where the bytes went (and didn't)

| Technique                                                                                                                                                                                        | Effect                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Composites everywhere**: accents, `i`/`j` (dotless + dot), quotes from the comma, `¡¿` as 180° rotations, `Œœ` from `O`+`E`, all super/subscripts, fractions and ordinals as scaled references | 283 of 455 glyphs (62%) cost a few bytes each instead of a full outline plus 5 delta sets                       |
| **Additive master layout** (6 masters, not 18)                                                                                                                                                   | Each extra axis end costs about 4–5 KB WOFF2. Measured by building without each master                          |
| **cu2qu tolerance 1.5 units** (1.5/1000 em)                                                                                                                                                      | −4%. Below one pixel up to about 700 px font size                                                               |
| **IUP delta tolerance 1.0**                                                                                                                                                                      | −3%. The rasterizer re-infers the dropped deltas within 1 unit                                                  |
| **`post` format 3** (no glyph names in the shipped file)                                                                                                                                         | −1–2 KB. Names exist at build time only                                                                         |
| **Flattened components** (no nesting)                                                                                                                                                            | Removes one indirection per glyph and passes stricter rasterizers                                               |
| **Per-axis web builds**                                                                                                                                                                          | `Latin[wght]` 19.9 KB, `Latin[opsz,wght]` 27.4 KB, `Latin[opsz,slnt,wght]` 30.7 KB. Serve only the axes you use |

## 5. Scorecard

### Size

| File                                                  | Cascivo Sans          | Geist             | IBM Plex Sans     | Inter            |
| ----------------------------------------------------- | --------------------- | ----------------- | ----------------- | ---------------- |
| Variable Latin slice, wght axis                       | **19.9 KB** (211 cp)  | 29.4 KB (225 cp)  | 45.7 KB (232 cp)  | 48.3 KB (230 cp) |
| Bytes per codepoint (Latin slice)                     | **94**                | 131               | 197               | 210              |
| Variable, full charset, wght only                     | **24.2 KB** (66 B/cp) | 69.7 KB (96 B/cp) | —                 | —                |
| Static Regular, full charset                          | **11.0 KB** (30 B/cp) | 45.2 KB (62 B/cp) | 63.0 KB (70 B/cp) | —                |
| Same Latin slice with **two more axes** (opsz + slnt) | 30.7 KB               | n/a               | n/a               | n/a              |

The full-charset comparison is not like for like. Geist and Plex cover Cyrillic, Greek and
more, and those glyphs are larger. The Latin slices are the fair comparison, and Cascivo uses
28% fewer bytes per codepoint than Geist. Part of this comes from engineering (composites, the
master layout, tolerances). Part of it comes from simpler drawing: stroke-generated outlines
have fewer points than outlines drawn and refined by hand.

### Everything else

| Dimension       | Cascivo Sans                                                                                                       | Verdict                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Axes            | wght 100–900, **opsz 8–48**, slnt −12–0                                                                            | **Ahead** of Geist and Plex. Matches Helvetica Now Variable on opsz, under OFL. No `wdth`                                      |
| UI features     | tnum (default), pnum, zero, ss01, case, frac, sups, sinf, subs, numr, dnom, ordn, locl (ROM/MOL), ccmp, kern, mark | **On par.** Geist has more stylistic sets; Plex has `onum`/`salt`                                                              |
| Validation      | Font Bakery universal: 0 fail, 2 intentional warnings. OTS: all six files pass                                     | **On par or ahead.** Validation runs in the test suite, not just at release                                                    |
| Reproducibility | Byte-identical rebuilds (`SOURCE_DATE_EPOCH`), parametric source, 3.5 s build                                      | **Ahead.** No GUI source files, and diffs are reviewable                                                                       |
| Coverage        | Latin-1 + Latin Extended-A + Romanian (365 codepoints)                                                             | **Behind.** No Cyrillic, Greek or Vietnamese. Plex covers many scripts                                                         |
| Drawing quality | Generated by rule, then reviewed glyph by glyph at Thin, Regular and Black (section 6)                             | **Behind.** One review pass is not years of optical refinement. `&`, `@`, `§`, `ß` and the braces are serviceable, not refined |
| Italic          | Oblique (skew) via `slnt`                                                                                          | **Behind.** No true italic forms. A pure skew is close to what a browser can synthesize, and it costs about 4 KB               |
| Family          | Sans only                                                                                                          | **Behind.** No Mono (Geist, Plex), Serif or Condensed (Plex)                                                                   |
| Hinting         | Unhinted; smart dropout `prep`, `gasp` set                                                                         | On par with Geist. Plex ships hinted TTFs                                                                                      |
| Field testing   | None                                                                                                               | **Behind.** All three references have years of production use                                                                  |

### The honest bottom line

The goal was "more advanced than all the others in every dimension". This version does not
reach that, and claiming it would be false. Cascivo Sans leads on **file size** (by a wide
margin), on **optical size in an open font**, on **UI-first defaults** and on **reproducible,
tested engineering**. It is behind on **drawing finesse, script coverage, true italics and
family breadth**. Those take type designers and years, not a generator, and they are the
reasons the references are trusted.

The useful result is the method, not the claim. The parametric stroke engine with lint and
budget gates gives a font that you can measure, reproduce and change in a pull request. The
next steps follow from the scorecard, in order of value:

1. A second review pass by a trained type designer, especially at 11–14 px, where an automated
   eye is weakest (see section 6).
2. Cyrillic and Greek, which are mostly new strokes. Many glyphs are composites or mirrors of
   Latin ones.
3. A true italic master (single-storey `a`, a cursive `f` with a descender), so `slnt` earns
   its 4 KB.
4. `wdth` and a Mono companion that shares the stroke engine.
5. A test in real products at 12–16 px against Geist, with hinting decided from that data.

## 6. Hand-review pass

The most frequent glyphs (`e t a o i n s h r d l c u m f g y p b` and the capitals `T A S R E N C`)
were rendered at 300 px next to Geist, at Thin, Regular and Black, then fixed and checked again.
Running text at 13, 16 and 22 px came last. Every fix was made in the generator (a rule or a
parameter), so it applies to every master and to every glyph built the same way.

| Found                                                                            | Cause                                                                                         | Fix                                                                                                                                 |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Text width ran from 0.73× (Thin) to 1.35× (Black) of Regular. Geist: 0.96×–1.11× | Spacing grew with the stem, and the counters did not give the width back                      | Near-constant spacing, and counters that shrink as stems grow. Now 0.94×–1.14×. A test guards it, so bold text never rewraps a line |
| Black `e`, `a`, `s` counters nearly closed                                       | Horizontals at 0.68 of the stem; crossbars as heavy as bowls                                  | Black contrast 0.60 (Geist measures about 0.6); crossbars thin by up to 22% more than bowls; heavy `a` bowl rises 5%                |
| `s` spine too thin at Regular, too heavy at Black                                | The angle pen thins diagonals; a constant stem fills the x-height                             | The spine is its own stroke, with a heavier hairline (1.15 × H)                                                                     |
| `s` and `S` terminals had a small flag                                           | Near 0°, a short bowl's inner radius is smaller than half the stroke, so the inner edge folds | The terminal sits where the curve is gentler, with a square cut                                                                     |
| Hairline seam inside `s` and `S`                                                 | Strokes that only touch edge to edge anti-alias into a line                                   | The spine overlaps each bowl by 8 units                                                                                             |
| `e` crossbar nub and step                                                        | The bar's square end sat outside the curving bowl, 2 units off the stroke end                 | The bar ends on the bowl's centreline, flush with the stroke end                                                                    |
| `a` tooth at the foot of the stem                                                | A round bowl always crosses the stem about 20 units above the baseline                        | The bowl leaves its curve along its tangent and joins the stem diagonally, as in Geist                                              |
| `f` hook left a gap ("def ault"), and collapsed at Black                         | Hook radius came from the full glyph width; the width did not follow the stem                 | Hook sized to end over the crossbar; `f` width depends on stem weight                                                               |
| `y` corner visible at Black                                                      | The left arm was cut exactly at the baseline                                                  | The arm ends below the baseline, inside the right stroke                                                                            |
| `%`, `&`, `@` rings closed at Black after the width change                       | A full stem pen inside a small ring                                                           | The pen in any ring is at most a third of the ring's size                                                                           |

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

# Cascivo Sans — Latin quality pass and honest comparison (design)

Date: 2026-10-15 · Branch: `claude/cascivo-sans-font` (PR #282) · Status: approved in conversation, awaiting spec review

## Intent

The user reviewed `/cascivo-sans` and will not use the font as it is: at Thin and Black several
letters look "weird, unprofessional, not mature". Goal: make the **Latin** glyphs look
professional at every weight, fixing the causes rather than the reported letters, and add an
**honest comparison** to the page — the size advantage and the current downsides.

User decisions:

- Heavy curve terminals stay **angled, like Inter** (not horizontal like Geist): gentler angle,
  more open apertures, clean joins.
- Approach: **engine-level root-cause fixes + lint guards + targeted hand fixes**, verified
  against Inter and Geist. Not per-glyph patching, not tracing a reference.
- Comparison: **table + honest downsides list**, numbers measured by a script; no visual
  side-by-side and no reference fonts served by the site.
- Square dots stay (a design choice). Optical size 48 refinement is a later round.
- Work runs as subagents: Sonnet implementers, Opus reviewers; sequential for the font.

## Evidence

Reported (screenshots, `/cascivo-sans` tester): Thin — the `t` foot ends in a dark curled
blob, the `;` comma is a heavy wedge, dark build-up where bowl meets stem in `a`/`d`. Black —
chopped, steep curve terminals on `S s c e a`, V-notches at `d a g` joins, a slanted `t` top, a
bite in `f`, a flick on the `g` tail.

A full audit (Chromium renders at 160 px and zoom crops; wght 100/400/900 × opsz 14, plus
opsz 8/48 at 400; upright and italic; Cascivo stacked over Inter and Geist) confirmed these and
found the same classes across the alphabet. Verified independently: `x` sidebearings 14/14 at
Regular (Inter 32), `l` right sidebearing −18 at Regular.

Root causes in the engine (`fonts/cascivo-sans/src`):

| # | Cause | Where | Symptoms |
| - | ----- | ----- | -------- |
| R1 | Heavy curved terminals are turned the full way to vertical (`HEAVY_TURN = 1.0`) and cut long | `geom.py` `_heavy_cut`, `expand` | Black cuts ≈60° from horizontal (Inter ≈5–10° on `s`, ≈30° on `c`/`e`); tongue-like ends; near-closed apertures in `s S c C e a g 3 5 6 8 9 ? &` |
| R2 | Bowls are near-closed ellipses meeting the stem through an oblique cut, thinned to 55 % (`taper=(0.55,…)`) at every weight | `glyphs.py` `_bowl_lc`, `shoulder`, `a`, `g` | "o glued to a stick" at every weight; V-notches ≈35 % of the stem at Black (Inter ≈10 %); dark build-up at Thin |
| R3 | Hairline-scale features use dot-scale widths | `glyphs.py` `comma_shape` (`w = p.dot` at every weight), quotes, `t` foot outline | Thin comma 3–5× the stem; `t` foot pinches into a blob |
| R4 | Stems grow into counters at Black with no compensation | widths per master | Black counters ≈35–60 % of Inter's |
| R5 | Per-letter constructions | `a` (flat bowl top, foot ledge), `g` (spike tail, unrelated ear), `f` (bite), `t` (slanted Black top), `l` (oblique foot, negative rsb), `y` (chopped tail), `1` (long flag), `0` (narrow) | as listed |
| R6 | Spacing and italic | sidebearings; italic expansion | `x` sb 14 (Inter 32); `l` rsb −18; Thin ≈25 % tighter than refs; italic Black slivers on `z t A B R 5 &`; `t`/`z` touching |

## Section 1 — Font changes (Latin)

Six work packages, in this order (each depends on the guards from WP0):

- **WP0 — guards and proof tooling.** New lint checks (below), each written first and seen
  failing on today's font; a proof script that regenerates the audit's comparison sheets.
- **WP1 — joins (R2).** The bowl's curve continues into the stem (the join leaves the stem
  tangentially, like Inter), with a join thinning that scales with weight and never forms a
  sharp V. Applies to `a b d g p q` and the arch joins of `m n h u r`.
- **WP2 — heavy terminals (R1).** At Black, curve terminals cut at ≈15–35° from horizontal
  (Inter-like), shorter, so apertures stay open. Per-glyph `cut` choices stay where they serve.
- **WP3 — Thin hairlines and punctuation (R3).** Comma, semicolon tail and curly quotes thin
  with the stem (a slim tick at Thin, never a block); the `t` foot gets a construction that
  cannot pinch; no dark build-up at joins. Dots stay square, sized to the stem.
- **WP4 — Black counters and letters (R4, R5).** Black counters of `o e a g b d p q` and figures
  grow toward Inter's proportions (incl. modest heavy widening); `a` gets a sloped bowl top and
  no foot ledge; `g` a curved tail end without the spike and an ear that matches; `f` loses the
  bite; Black `t` gets a flat top; `l` a foot that does not collide; `y` a tail with a horizontal
  end; `1` a shorter flag; `0` wider.
- **WP5 — spacing and italic (R6).** `x` sidebearings to ≈Inter's; `l` rsb ≥ 0; Thin spacing
  opened ≈15–20 %; italic Black slivers removed; `t`/`z` no longer touching; kerning re-measured.

### Done means (Thin, Regular, Black; upright and italic)

New `lint.py` checks, all passing on the Latin set (thresholds are constants in `lint.py`):

| Check | Threshold |
| ----- | --------- |
| No folded / self-overlapping outline | 0 |
| Join notch depth (bowl–stem and arch–stem) | ≤ 12 % of the stem |
| Heavy curve terminal cut angle (Black) | ≤ 35° from horizontal |
| Comma / quote maximum width at Thin | ≤ 2.5 × Thin stem |
| Minimum feature width at Black (upright, italic) | ≥ a fixed floor (no slivers) |
| Lowercase sidebearings | ≥ 0 |
| Black counter area of `o e a` | ≥ 70 % of Inter's (Inter values measured once, stored as constants) |

Plus: before/after comparison sheets for every audit sheet, reviewed by eye and shown to the
user before the font files are committed.

### Out of scope

Cyrillic and Greek receive the engine changes and must keep passing lint and Font Bakery, but are
not tuned. No changes to the Georgian, Armenian and Hebrew drafts beyond keeping their gated
builds passing. Optical size 48 (too chunky at display sizes) is a follow-up.

## Section 2 — "How it compares" on `/cascivo-sans`

A new section between "Get the font" and "How it's made".

**Table** — Cascivo Sans vs Inter, Geist, IBM Plex Sans:

| Row | Source |
| --- | ------ |
| Latin variable WOFF2, weight axis, upright | each font subset with fontTools to the **same** Latin codepoint set, `wght` axis only, saved as WOFF2 |
| The same, italic | as above; Geist: "—" (no italic) |
| Bytes per codepoint | from the two rows above |
| Axes | weight; optical size; italic |
| Scripts | Latin, Cyrillic, Greek / per reference |
| Licence | OFL for all four |
| Hinting | Cascivo unhinted; references as shipped |
| In use since | Cascivo 2026; the references' first releases |

- `fonts/cascivo-sans/src/compare.py` measures; it records the reference font versions and the
  codepoint set. Its output is a committed data file read by the page; the site build never
  needs the reference fonts.
- Cascivo's figures are measured by the same script from the shipped build output, and a test
  fails if the committed Cascivo figures do not match the current font files (they change after
  the quality pass).

**"Where it's behind (today)"** — a plain list: no type designer has reviewed it yet (generated
by rule, checked by eye and by measurement); no production use yet; unhinted (matters on Windows
at small sizes); kerning measured by machine, not tuned pair by pair; a sans only (no Mono,
Serif, Condensed); optical size 48 still needs work; Georgian, Armenian and Hebrew are drafts.
The section intro says plainly that smaller does not mean better drawn.

RESEARCH.md §5 (scorecard, outdated: it still says "no Cyrillic or Greek") is updated from the
same measurements.

## Section 3 — Verification and execution

Verification at every step:

1. Existing gates: `python3 -I src/lint.py` (and the gated `CASCIVO_GEORGIAN=1
   CASCIVO_ARMENIAN=1 CASCIVO_HEBREW=1` build), `python3 -I -m unittest discover -s src`,
   Font Bakery 0 FAIL, collision sweeps, kerning IoU, file-size budgets in `test_font.py`.
2. The new lint checks (Section 1), each written first and seen failing on today's font.
3. Proof sheets regenerated after each work package and read.
4. Site: `pnpm fonts:site:sync`, the drift test, `pnpm ready`, and the `/cascivo-sans` browser
   check (`scripts/quality/cascivo-sans-page.ts`).
5. Side effects: Cyrillic and Greek still pass lint and Font Bakery; sizes may move a few
   percent, budgets stay enforced.

Execution:

- Font: six sequential tasks (WP0–WP5) — one Sonnet implementer each, an Opus reviewer before
  the next starts. Sequential because they share `geom.py` and `glyphs.py`.
- Comparison section: one Sonnet implementer in parallel with the font work.
- End: one Opus whole-branch review; docs (RESEARCH §37 + updated §5, CHANGELOG, README); push
  to PR #282.
- User checkpoint: after the font work, the before/after sheets are shown to the user before
  anything is pushed.

## Risks

- **Interpolation compatibility.** Masters must keep the same contours and points; a new join or
  foot construction must keep point structure identical across masters (existing tests catch
  this).
- **Ripple into other scripts.** Engine changes alter Cyrillic, Greek and the traced drafts;
  their gates must stay green.
- **Over-fitting to Inter.** Thresholds are ranges, not Inter's exact values; the angled-terminal
  character is kept.
- **Kerning drift.** Spacing changes invalidate measured kerning; it is re-measured, and IoU and
  collision sweeps must pass.

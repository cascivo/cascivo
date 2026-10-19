# Cascivo Sans: interface brief and QA specimen (design)

Date: 2026-10-17 · Branch: `claude/cascivo-sans-font` (PR #282) · Status: implemented

## Intent

A design brief, provided by the user (a short document with a QA specimen page and its handoff notes),
asks that the typeface hold up in product UI: weights that step evenly, widths that do not reflow when
the weight changes, glyphs that cannot be confused, legible punctuation, even spacing and clean small
sizes. It lists seven pass/fail checks. The brief was written against a generic font, so an audit
measured Cascivo Sans against each check first (the numbers below are from that audit). This spec
covers what the audit found present, plus the specimen page.

User decisions:

- Width across weights: **within ±2% of 400** at 100–700 and **at most +5%** at 800–900, the display weights
  (not uniwidth, not a separate UI font). Amended during implementation: holding ±2% at Black closed its spacing.
- The specimen is a **site page**, `/cascivo-sans/specimen`, linked from `/cascivo-sans`.
- Stylistic sets: **`ss01` = dotted zero**; the plain `I`/`l` alternates move to **`ss02`**; `zero` keeps the
  slashed zero.
- Decisions during implementation (all by the user):
  - Black guillemets stay at **1.08× Inter's width upright and 1.096× italic**, not 0.95–1.0×: that is what
    keeps their stroke weight and the white between the chevrons (Inter's ink and white, a single chevron
    of at least 0.9× Inter's). The test allows up to 1.1×.
  - Italic **AW and WA at Regular kern at 0.47× and 0.60× Inter** (upright stays at 0.77–0.79×): the
    shapes' own white is already as close as the measure's floor allows. `KERNING_SHORT` keeps a lower
    floor for these and the Thin pairs it lists, so none can drop to 0 unnoticed.
  - Capital diagonal pairs (VV, VW, AX, RA, Ax, KA and the like) at Black are opened by the measured
    kerning to at least 12 units of white at 900/48, 900/8 and 700/48 and 16 at 900/14, upright and italic.
  - Size budgets were raised by the user in turn; the final values are in `test_font.py`.
- Out of scope here, each its own later cycle: a deep audit-and-fix of the font (next), then a Condensed
  width axis, then Mono. Serif is not planned without a type designer.

## Audit summary (before)

| # | Brief issue | Cascivo Sans today | Verdict |
| - | ----------- | ------------------ | ------- |
| 1 | Weight steps | `n` stem 22/35/53/84/104/124/144/168/190; steps 13/18/31/20/20/20/24/22 (Inter ≈20 each) | Partly |
| 2 | Width drift | Sample line vs 400: −1.0/−0.9/−0.5 at 100–300; +2.2/+4.5/+6.7/+9.4/+11.9% at 500–900. Tab row +7.5% at 700 | Present (heavy side) |
| 3 | Italic is an oblique | Drawn italic: single-storey a/g, descending f, own k/y; darkness within 1% of upright | Not present |
| 4 | Ambiguous glyphs | `I` slab, `l` tail, `0` 495 vs `O` 661; `zero`/`case`/`tnum` exist; `ss01` = plain I/l (inverse of brief) | Not present (feature naming gap) |
| 5 | Punctuation | minus 0.479em vs en 0.500em; quotes smaller than Inter (Thin 0.12 vs 0.21 wide); dot at 100 0.041em (Inter 0.052); brackets 19 units low with `case` | Partly |
| 6 | Spacing / kerning | even overall; `l` rsb 8, `k` 14, `z` tight (0.35 of nn vs Inter 0.80); LT −59, To −54, Wa −30 vs Inter −96/−78/−51 | Partly |
| 7 | Small sizes | 11px Regular and 12px Light clean at DPR 1 and 2; Light 10–13% paler than Inter Light | Partly (cosmetic) |

## Section 1: font changes

1. **Weight curve (#1).** Respace the weight → stem mapping (instances and the master interpolation the
   engine uses) so each 100-step adds ≈20 units of stem: 100 slightly heavier, 200 clearly apart from
   100, the 300→400 jump reduced. Masters are unchanged except Thin's stem (22 → 24: user 100 is the
   Thin master); Black stays Black.
   *Accept:* `n` stem steps between adjacent named weights all within 15–27 units.
2. **Width within ±2% (#2).** At heavy weights, tighten sidebearings and narrow the widest letters
   slightly so the brief's sample line ("Signals move fast; the cascade decides.", kerning on) and the
   tab row ("Overview Activity Settings Members Billing") set within ±2% of 400 at every weight from 100
   to 700, and within +5% at 800–900 (user decision). Black's counter, notch, mouth, terminal and spur guards from the quality pass must keep
   passing — width is taken from spacing first, then from glyph widths, never by closing counters past
   their guards.
   *Accept:* `test_weight_changes_do_not_reflow_text` tightened to ±2% at 100…700 and +5% at 750…900 (upright and
   italic), both strings.
3. **Ambiguous glyphs (#4).** New dotted zero (`zero.dot`, plus tabular `zero.dot.tf`) behind `ss01`;
   the existing plain `I`/`l` alternates move from `ss01` to `ss02`; `zero` keeps the slashed zero, and
   `tnum`+`zero` / `tnum`+`ss01` both reach tabular forms.
   *Accept:* feature test asserting each substitution; the section 04 pairs and context line read
   unambiguously (already true by default).
4. **Punctuation (#5).**
   - Dashes: hyphen < en dash < em dash, and minus matches the plus advance. At 100–700 its ink is visibly
     shorter than the en dash (≥ 8% shorter). At 800–900 (user decision) it grows to the plus's horizontal
     bar, as Inter's does, so "2−1+3" reads at Black; 700→800 is a straight line, not a step.
   - Quotes (single, double, guillemets): larger, with a larger floor at light weights, measured against
     Inter's size at the same weight (≥ 0.9× Inter's ink box). At Black the guillemets sit at 0.95–1.0×
     Inter's width (they ran 1.11×, low and heavy).
   - Brackets `( ) [ ] { }`: taller, and their `case` forms centred on the cap height (within ±5 units).
   - Dots `. , : ; ! ?` (and the i/j dots, which share the dot size): minimum dot ≥ 0.05 em at 100.
   *Accept:* tests for each inequality above.
5. **Spacing and kerning (#6).** Open `l`, `k`, `j`, `z` sidebearings toward the nn rhythm (z ≥ 0.6 of
   the nn gap); strengthen LT, To, Wa (and their class members) toward Inter (≥ 0.8× Inter's value).
   Kerning is measured from the outlines as today; `test_shaped_pairs_keep_clear` and the IoU test stay
   green.
6. **Small sizes (#7).** Darken Light slightly at opsz 8–12 (≤ 10% stem increase there, none at opsz ≥
   14) toward Inter Light. Document 300 as the lightest text weight and 100–200 as display weights
   (README, font page).
7. **Italic (#3).** No rename. Optional only: exit strokes on `k`/`y` if they read well; dropped if they
   complicate spacing.

All font work keeps the existing gates: strict `quality.check_all() == []`, file-size budgets (none
raised without the user), Font Bakery 0 FAIL, the CI Fonts job (rebuild matches committed fonts),
point-compatible masters. Cyrillic and Greek take whatever the shared engine changes give them and
must keep passing lint and Font Bakery.

## Section 2: QA specimen page

- **Route** `/cascivo-sans/specimen` (Preact, same route registries and font loading as
  `/cascivo-sans`; the font loads only on these two routes). Linked from the font page.
- **Content:** the brief's seven sections, rebuilt from the handoff README (layout, strings, sizes),
  using the site's theme tokens (light and dark) instead of the cream/ink palette, and the site's mono
  stack instead of JetBrains Mono (no external font request). Fixed to Cascivo Sans (no
  `fontFamily`/`fontCssUrl` props).
  - 01: per-weight row with `nHIn`, the sample line, and a live ±2% meter measured with canvas
    `measureText` at 40px (fill turns to the warning colour past ±2%; value shown as `+1.4%`).
  - 02: tab row with 700 on hover, and a button toggling the row 400 ↔ 700.
  - 03–07 as in the brief; section 04/05 also show the `ss01`, `zero` and `case` variants.
- **Data:** strings and pair lists in a `specimen.ts` data module with unit tests.
- **Browser check:** `scripts/quality/cascivo-sans-page.ts` (or a sibling) loads the specimen and
  asserts in Chromium: every weight within ±2% of 400; the tab row's width does not change on hover or
  toggle; hyphen < en < em; no horizontal overflow at 320/360/390/414. It also writes screenshots of the
  seven sections.
- **Accessibility and layout:** WCAG 2.2 AA, logical properties, no `display:none` content on mobile;
  section 01 sample lines may scroll sideways inside their own wrapper (as the README allows), never the
  page.

## Deliverables

- Updated variable fonts (TTF + WOFF2, upright and italic) and static instances.
- Feature list (`ss01` dotted zero, `ss02` plain I/l, `zero`, `case`, `tnum`, `onum`) in the README and
  on the font page.
- Specimen page with screenshots of all seven sections attached to PR #282.
- RESEARCH.md section on the brief (before/after numbers), CHANGELOG entry.

## Execution

Subagent-driven, as before: one subagent implementer per task, an independent reviewer per task, fix rounds as
needed; sequential for font tasks (shared engine files). Order: weight curve → width ±2% → zero/ss
features → punctuation → spacing/kerning → small sizes → specimen page → docs and screenshots → whole-
branch review → push. Pushes to PR #282 after review without a separate user checkpoint (the user's
standing instruction), but the before/after section screenshots are sent to the user.

## Risks

- **Width vs Black quality.** Squeezing Black by ~10% can undo the quality pass (counters, mouths,
  joins). Mitigation: take width from spacing first; the existing Black guards are hard limits.
- **Weight curve vs `opsz`.** The engine already corrects heavy corners along `opsz`
  (`build.py`); a new weight mapping must keep those corrections aligned.
- **Size budgets.** Latin `[wght]` subsets have ~190 B headroom; a new zero, larger punctuation and
  more kerning may need a budget raise — a user decision when it happens.
- **Kerning drift** from spacing changes; re-measured and guarded by existing tests.

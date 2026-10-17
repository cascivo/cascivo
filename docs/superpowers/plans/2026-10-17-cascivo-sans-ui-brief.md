# Cascivo Sans interface brief and QA specimen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Cascivo Sans meet the interface brief (even weight steps, ±2% width across weights, `ss01` dotted zero, legible punctuation, even spacing, darker small Light) and add a `/cascivo-sans/specimen` QA page that checks it live.

**Architecture:** Font changes are made in the Python stroke engine (`fonts/cascivo-sans/src`), each guarded by a test in `test_font.py`/`test_quality.py` and the strict quality gate; fonts are rebuilt, synced to the site with `pnpm fonts:site:sync`. The specimen is a Preact page in `apps/site` registered like `/cascivo-sans`, with a data module and a Chromium browser check.

**Tech Stack:** Python 3.13, fontTools, uharfbuzz, Pillow/numpy (engine and tests); Preact + signals, Vite, Playwright/Chromium (site and browser check); pnpm/vp gates.

**Spec:** `docs/superpowers/specs/2026-10-17-cascivo-sans-ui-brief-design.md`

## Global Constraints

- Width: every weight 100…900 within **±2%** of 400, upright and italic, for "Signals move fast; the cascade decides." and "Overview Activity Settings Members Billing" (kerning on).
- `ss01` = dotted zero; plain `I`/`l` alternates = `ss02`; `zero` = slashed zero (unchanged).
- Weight steps: `n` stem steps between adjacent named weights all within **15–27** units.
- Punctuation: hyphen < en dash < em dash; minus advance = plus advance and minus ≥ 8% shorter (ink) than en dash; quotes ≥ 0.9× Inter's ink box at the same weight; `case` brackets centred on cap height ±5 units; dot ≥ 0.05 em at wght 100.
- Spacing: `z` gap ≥ 0.6× the nn gap; LT, To, Wa kerning ≥ 0.8× Inter's.
- Small sizes: Light (300) stem raised ≤ 10% at opsz 8–12, none at opsz ≥ 14.
- Unchanged gates: `quality.check_all(VF, VFI) == []` (strict), Font Bakery 0 FAIL/0 ERROR, the CI Fonts job (rebuild == committed fonts), point-compatible masters, existing size budgets in `src/test_font.py` (raise only with the user's approval — STOP and report if exceeded).
- After every build: `python3 -I src/compare.py --cascivo-only` (from `fonts/cascivo-sans`) then `pnpm fonts:site:sync` (repo root); commit the regenerated files.
- `pnpm ready` passes before every commit (CLAUDE.md). Commit trailers: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_018GMr8MKJ9kdBTRa5FE88Rj`; no model names elsewhere.
- Site: CLAUDE.md component rules (signals not hooks, `@layer`, logical properties, mobile-first, WCAG 2.2 AA, no `display:none` content on mobile); the font loads only on `/cascivo-sans` and `/cascivo-sans/specimen`.
- Reference fonts (Inter, Geist, Plex) for calibration: `/tmp/claude-0/-home-user-cascivo/684bb259-c9c5-54d1-9b23-6e019baa909a/scratchpad/full/ttf/`. Audit baseline: `…/scratchpad/brief-audit/audit.md`.

## Review Focus

- **Black after squeezing (Task 2):** narrowing heavy weights by ~10% must not reopen the quality-pass defects (counter slot, closed mouth, notch, wedge terminals). Expect: `check_all` stays `[]`; Task 2 adds a render check of `a s e g` at 900 against the pre-task fonts.
- **Intermediate weights (Tasks 1, 2):** a new weight map or heavy-only width rules can kink at 550/650/750/850. Expect smooth progression; Task 2's width test samples every 50 units, not just named weights.
- **Italic parity (Tasks 2, 4, 5):** every width/punctuation/spacing rule applies to the italic too. Expect every Task 2/4/5 test to loop over `(VF, VFI)`.
- **Mobile layout of the specimen (Task 7):** 88px "afegky" and 64px dash rows on a 320px screen. Expect no page overflow; wide sample lines scroll inside their own wrapper. Pinned in the browser check.
- **Composites follow (Task 3):** accented `I`/`l` and Cyrillic/Greek references previously keyed on `.ss01` must move to `.ss02`. Expect the feature test to cover `Í`, `ľ`, and a Cyrillic `І`.

---

### Task 1: Even weight steps

**Files:**
- Modify: `fonts/cascivo-sans/src/build.py:840-857` (`NAMED_STEMS`, `_wght_map`)
- Test: `fonts/cascivo-sans/src/test_font.py`

**Interfaces:**
- Produces: `NAMED_STEMS` with stems `[(100, 24), (200, 44), (300, 64), (400, 84), (500, 104), (600, 124), (700, 146), (800, 168), (900, BLACK_STEM)]` (starting point; tune so the measured steps meet the constraint). `_wght_map()` must handle a user weight whose stem lies above the Thin master's 22 (design coordinate > 100).

- [ ] **Step 1: Write the failing test** `test_named_weights_step_evenly` in `test_font.py`: instance the VF (upright and italic) at opsz 14 for each named weight, measure the `n` stem (horizontal ink run at x-height/2 through the left stem); assert every adjacent step is within 15–27 units.
- [ ] **Step 2: Run** `python3 -I -m unittest src.test_font -k step_evenly` from `fonts/cascivo-sans` → FAIL (today 13/18/31…).
- [ ] **Step 3: Implement** the new `NAMED_STEMS` and adjust `_wght_map()`; rebuild (`python3 -I src/build.py`).
- [ ] **Step 4: Run** the new test, `python3 -I src/lint.py` and the full suite → PASS; check `test_heavy_weights_keep_their_rhythm` still passes.
- [ ] **Step 5: Sync and commit:** compare + `pnpm fonts:site:sync`, `pnpm ready`, commit `fix(fonts): weights step evenly from Thin to Black`.

### Task 2: Width within ±2% across weights

**Files:**
- Modify: `fonts/cascivo-sans/src/params.py` (heavy-weight sidebearing/width terms in `P.__init__`, next to `THIN_OPEN`), `fonts/cascivo-sans/src/glyphs.py` (only where a glyph's own width rule needs a heavy term)
- Test: `fonts/cascivo-sans/src/test_font.py` (`test_weight_changes_do_not_reflow_text`)

**Interfaces:**
- Consumes: Task 1's weight map.
- Produces: a named constant in `params.py` for the heavy-weight tightening (e.g. `HEAVY_TIGHTEN`), documented with its measured effect.

- [ ] **Step 1: Rewrite the failing test** `test_weight_changes_do_not_reflow_text`: shape (uharfbuzz, kerning on) both strings `"Signals move fast; the cascade decides."` and `"Overview Activity Settings Members Billing"` at every weight 100…900 in steps of 50, opsz 14, for `(VF, VFI)`; assert `abs(width / width_400 - 1) <= 0.02`.
- [ ] **Step 2: Run** it → FAIL (900 is +11.9% today).
- [ ] **Step 3: Implement** the heavy tightening: spacing first (heavy sidebearings), then the widest letters' heavy widths; never by changing counters guarded by `quality.py`. Rebuild.
- [ ] **Step 4: Add the Black render check** `test_black_letters_unchanged_in_kind` (or a proof script step): `quality.check_all` stays `[]`; render `a s e g` at 900 before/after/Inter into the scratchpad and look.
- [ ] **Step 5: Run** the full suite, lint, Font Bakery → PASS.
- [ ] **Step 6: Sync and commit** `fix(fonts): text keeps its width (±2%) at every weight`.

### Task 3: Dotted zero (`ss01`) and plain I/l (`ss02`)

**Files:**
- Modify: `fonts/cascivo-sans/src/glyphs.py` (new `zero.dot` and its tabular/old-style counterparts), `fonts/cascivo-sans/src/build.py:273-276,341-353,434-440,734,816-819` (rename `.ss01` alternates to `.ss02`; add `ss01` and the tabular routing)
- Test: `fonts/cascivo-sans/src/test_font.py`

**Interfaces:**
- Produces: glyph names `zero.dot` (proportional), `zero.dot.tf` (tabular); suffix `.ss02` for the plain I/l family (including accented composites and Cyrillic/Greek references); `ss01` featureName "Dotted zero", `ss02` featureName "Plain I and l (as in Helvetica)".

- [ ] **Step 1: Write the failing test** `test_stylistic_sets`: with uharfbuzz, for `(VF, VFI)`: `0` + `ss01` → `zero.dot`; `0` + `tnum` + `ss01` → tabular dotted zero; `0` + `zero` → slashed zero (unchanged); `I`, `l`, `Í`, `ľ`, Cyrillic `І` + `ss02` → their plain forms; `ss01` no longer changes `I`/`l`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `zero.dot` (dot inside the counter, sized like the period's dot at that weight, centred) and the feature/suffix changes.
- [ ] **Step 4: Run** the full suite, lint, Font Bakery → PASS; check size budgets.
- [ ] **Step 5: Sync and commit** `feat(fonts): dotted zero in ss01; plain I and l move to ss02`.

### Task 4: Punctuation

**Files:**
- Modify: `fonts/cascivo-sans/src/glyphs.py` (`minus` ~1407, `hyphen`/`endash`/`emdash` ~1368-1381, quotes and guillemets, `parenleft`/`bracketleft`/braces ~1540-1563 and their `case` forms, `p.dot` floor in `params.py`)
- Test: `fonts/cascivo-sans/src/test_font.py`

**Interfaces:**
- Produces: a dot-size floor constant in `params.py` (e.g. `DOT_MIN_EM = 0.05`), applied to every glyph that uses `p.dot`.

- [ ] **Step 1: Write the failing tests** `test_dash_lengths_differ`, `test_minus_matches_plus`, `test_quotes_hold_their_size`, `test_case_brackets_centre_on_caps`, `test_dots_survive_thin`, each over `(VF, VFI)` and the weights the constraint names, asserting the Global Constraints values (Inter values read from the reference fonts).
- [ ] **Step 2: Run** → FAIL on minus/en, quotes at Thin, case brackets, dot at 100.
- [ ] **Step 3: Implement** the changes; rebuild.
- [ ] **Step 4: Run** the full suite (incl. `test_thin_comma_and_quotes_are_long_enough_to_read`), lint, Font Bakery → PASS.
- [ ] **Step 5: Sync and commit** `fix(fonts): punctuation sized for interfaces`.

### Task 5: Spacing and kerning

**Files:**
- Modify: `fonts/cascivo-sans/src/glyphs.py` (`g.sb` of `l`, `k`, `j`, `z` and their families), `fonts/cascivo-sans/src/kern.py` (pair candidates/strength for LT, To, Wa classes)
- Test: `fonts/cascivo-sans/src/test_font.py`

- [ ] **Step 1: Write the failing tests** `test_tight_letters_open_up` (gap of `nln`, `nkn`, `njn`, `nzn` vs `nnn` ≥ the constraint ratios at 400 and 900, `(VF, VFI)`) and `test_key_pairs_kern_like_inter` (LT, To, Wa ≥ 0.8× Inter at 400).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; rebuild (kerning is re-measured by the build).
- [ ] **Step 4: Run** the full suite incl. `test_shaped_pairs_keep_clear` and `test_kerning`, lint, Font Bakery, and Task 2's width test (spacing changes widths) → PASS.
- [ ] **Step 5: Sync and commit** `fix(fonts): even lowercase spacing; stronger LT, To, Wa`.

### Task 6: Light at small sizes

**Files:**
- Modify: `fonts/cascivo-sans/src/params.py` (stem term for low weights at opsz < 14)
- Test: `fonts/cascivo-sans/src/test_font.py`

- [ ] **Step 1: Write the failing test** `test_light_holds_at_small_sizes`: at wght 300, opsz 8 and 12, the `n` stem is 1.03–1.10× its opsz-14 value; at opsz 14 and 48 unchanged from Task 5's build.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; rebuild; render section-07 strings at 11–14 px (Chromium, DPR 1 and 2) against Inter Light.
- [ ] **Step 4: Run** the full suite, lint, Font Bakery, Task 2's width test → PASS.
- [ ] **Step 5: Sync and commit** `fix(fonts): Light holds up at small sizes`.

### Task 7: Specimen page `/cascivo-sans/specimen`

**Files:**
- Create: `apps/site/src/marketing/pages/CascivoSansSpecimenPage.tsx`, `apps/site/src/marketing/pages/cascivo-sans/specimen.ts` (strings, pairs, weights, sizes), `apps/site/src/marketing/pages/cascivo-sans/specimen.css` (in `@layer`), a unit test next to `specimen.ts` (repo convention), `scripts/quality/cascivo-sans-specimen.ts` (browser check, or extend `cascivo-sans-page.ts`)
- Modify: `apps/site/src/marketing/App.tsx`, `apps/site/src/marketing/route-head.ts`, `apps/site/src/marketing/search/buildIndex.ts`, `apps/site/src/marketing/pages/CascivoSansPage.tsx` (link to the specimen; feature list), `scripts/quality/landing-budget.ts` if it lists font routes

**Interfaces:**
- Produces: `widthDelta(widths: number[], baseIndex: number): { delta: number; label: string; over: boolean }[]` in `specimen.ts` (label `+1.4%` one decimal; `over` when |delta| > 2), used by the page and its unit test.

- [ ] **Step 1: Write the failing unit test** for `widthDelta` (0 / +1.4 / −2.1 / +2.0 boundaries) and for the data lists matching the brief (8 pairs, 4 control strings, sizes 11–14).
- [ ] **Step 2: Run** it → FAIL.
- [ ] **Step 3: Implement** `specimen.ts` and the page (seven sections per the spec; site theme tokens; site mono stack; live canvas measurement after `document.fonts.load` for each weight; `…` until measured; hover/toggle tab rows).
- [ ] **Step 4: Register the route** in the four registries and link it from `/cascivo-sans`.
- [ ] **Step 5: Write the browser check**: loads `/cascivo-sans/specimen`, asserts all nine weights within ±2%, tab row width unchanged on hover and toggle, hyphen < en < em measured, no horizontal overflow at 320/360/390/414, font loads only on the two routes; writes `section-01…07.png` to a given directory.
- [ ] **Step 6: Run** unit test, `pnpm ready`, site build, browser checks (both) → PASS.
- [ ] **Step 7: Commit** `feat(site): Cascivo Sans QA specimen`.

### Task 8: Docs, screenshots and gates

**Files:**
- Modify: `fonts/cascivo-sans/RESEARCH.md` (new section: the interface brief, before/after numbers per item), `fonts/cascivo-sans/CHANGELOG.md`, `fonts/cascivo-sans/README.md` (features `ss01` dotted zero, `ss02` plain I/l, `zero`, `case`, `tnum`, `onum`; 300 lightest text weight, 100–200 display; sizes), `fonts/cascivo-sans/comparison.json` (full `compare.py --refs … --plex-var …`)

- [ ] **Step 1:** Re-run full `compare.py` and `pnpm fonts:site:sync`.
- [ ] **Step 2:** Write the docs from the task reports' measured numbers.
- [ ] **Step 3:** Run the specimen browser check with a screenshot directory; keep the seven PNGs in the scratchpad for the PR.
- [ ] **Step 4:** `pnpm ready`, CI Fonts job steps locally (build + `git diff --exit-code fonts/`, lint, unittest, Font Bakery) → all pass.
- [ ] **Step 5: Commit** `docs(fonts): the interface brief`.

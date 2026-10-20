# Cascivo Sans Latin Quality Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Cascivo Sans' Latin glyphs look professional at Thin, Regular and Black (upright and italic) by fixing six engine-level root causes behind measurable guards, and add an honest, measured "How it compares" section to `/cascivo-sans`.

**Architecture:** WP0 adds a measurement module (`src/quality.py`) that rasterizes instanced glyphs from the built variable fonts and computes the spec's metrics, plus lint checks that fail on today's font, and a proof-sheet renderer. WP1–WP5 change the stroke engine (`geom.py`) and glyph constructions (`glyphs.py`) until those checks pass, rebuilding the fonts each time. A parallel task adds a measuring script (`src/compare.py`) whose JSON output feeds a new page section.

**Tech Stack:** Python 3 (`python3 -I`), fontTools 4.66, numpy, scipy (`ndimage.distance_transform_edt`), scikit-image (`morphology.skeletonize`), Pillow (variable-font rendering for proof sheets); Preact site (`apps/site`), Node `--experimental-strip-types --test`.

**Spec:** `docs/superpowers/specs/2026-10-15-cascivo-sans-quality-pass-design.md`

## Global Constraints

- Latin only is tuned. Cyrillic and Greek must keep passing lint and Font Bakery; the gated Georgian/Armenian/Hebrew builds (`CASCIVO_GEORGIAN=1 CASCIVO_ARMENIAN=1 CASCIVO_HEBREW=1`) must keep passing lint.
- Heavy curve terminals stay **angled like Inter**, not horizontal like Geist: cut face ≤ 35° from horizontal at Black, never 0° by rule.
- Dots stay square. Optical size 48 is out of scope.
- Masters must stay interpolation-compatible: same contours, same points, same order across all five masters of a family (existing build fails otherwise).
- Every Python command runs from `fonts/cascivo-sans/` with `python3 -I`.
- Font gate (run at the end of every font task): `python3 -I src/build.py && python3 -I src/lint.py && python3 -I -m unittest discover -s src && fontbakery check-universal "fonts/CascivoSans[opsz,wght].ttf" "fonts/CascivoSans-Italic[opsz,wght].ttf"` → lint "0 problem contours" and 0 quality failures, all tests OK, Font Bakery 0 FAIL.
- Size budgets in `src/test_font.py` `BUDGETS` stay; raising one is a design decision for the user, not a fix.
- After any font rebuild that will be committed: `pnpm fonts:site:sync` from the repo root, and commit the site copy with the fonts.
- Commit trailers on every commit: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_018GMr8MKJ9kdBTRa5FE88Rj`. Never push; the controller pushes after the user's checkpoint.
- Reference fonts (not in the repo): `$REFS=/tmp/claude-0/-home-user-cascivo/684bb259-c9c5-54d1-9b23-6e019baa909a/scratchpad/full/ttf/` holds `Inter.ttf`, `InterItalic.ttf`, `Geist.ttf`, `Plex.ttf`, `PlexItalic.ttf`. Reference measurements are stored as constants so no test needs these files.

## Review Focus

1. **Italic masters.** Every metric must run on the italic family too (spec: "upright and italic"); an engine change that passes upright and breaks italic interpolation or slivers is the likeliest regression. Each WP's checks run on both families.
2. **Interpolated instances between masters** (e.g. wght 250, 650). A fix tuned at 100/400/900 can kink in between. WP0's proof sheets include 250 and 650 rows; reviewers look at them.
3. **Other scripts riding the engine.** Changing `_heavy_cut` or join tapers alters Cyrillic/Greek (`с е э з`, `ε`) and the traced drafts. The font gate's Font Bakery and the gated lint run cover it; each WP runs the gated lint too.
4. **Small text.** Changes judged at 160 px can hurt 12–16 px. Proof sheets include a 14 px running-text row at 100/400/900.
5. **Kerning after spacing changes.** WP5 alters sidebearings; `test_kerning` and `test_shaped_pairs_keep_clear` must pass on the rebuilt font, not on a stale build.

---

### Task 0: Guards and proof tooling (WP0)

**Files:**
- Create: `fonts/cascivo-sans/src/quality.py`
- Create: `fonts/cascivo-sans/src/proof.py`
- Modify: `fonts/cascivo-sans/src/lint.py` (call the quality checks after the outline check)
- Create: `fonts/cascivo-sans/src/test_quality.py`
- Modify: `fonts/cascivo-sans/requirements.txt` (under `# tests only`: `numpy`, `scipy`, `scikit-image`, `pillow`)

**Interfaces:**
- Produces (`quality.py`):
  - `raster(font_path: str, glyph: str, wght: float, opsz: float = 14, scale: float = 1.0) -> numpy.ndarray` — bool ink mask of the instanced glyph, 1 px per font unit × `scale`, with a 10 px margin.
  - `max_ink(mask) -> float` — largest inscribed diameter (2 × max EDT), excluding "dot" contours: a connected component whose area ≥ 0.85 × its bbox area and bbox aspect within 0.7–1.4.
  - `join_ratio(mask, stem_side: str) -> float` — for the bowl/arch meeting a stem on `stem_side` (`'left'|'right'`): skeletonize; thickness = 2 × EDT on skeleton pixels; ratio = min thickness on skeleton pixels within a window of 1.5 × stem width beside the stem, in the join rows, ÷ median skeleton thickness of the bowl. Stem width = the ink run at y = x-height/2 touching `stem_side`.
  - `counter_area(mask, x_height: float) -> float` — area of the largest enclosed white component ÷ x_height².
  - `sliver_area(mask, r: int = 6) -> int` — area of the largest component of (mask − binary_opening(mask, disk(r))).
  - `cap_angles(p) -> list[tuple[str, float]]` — (glyph, degrees from horizontal) for every curved end with cap `'b'` whose end tangent is within 50° of vertical, from the engine (`geom.cap_lines`).
  - `REF` — dict of reference values measured once from Inter (see Step 3), e.g. `REF['join'][('d', 900)]`, `REF['counter'][('o', 900)]`.
  - `check_all(upright_vf: str, italic_vf: str) -> list[str]` — human-readable failures; empty when all pass.
- Produces (`geom.py`): `cap_lines(stroke, V, H) -> list[tuple[tuple[float, float], tuple[float, float]]]` — the end-cap segments exactly as `expand` builds them (refactor `expand` to use it; output unchanged byte-for-byte this task).
- Produces (`proof.py`): `python3 -I src/proof.py OUT_DIR [--refs $REFS]` writes `cmp_{u|i}_w{100,250,400,650,900}_{lower,upper,figpunct,sentence}.png` (Cascivo over Inter over Geist, Pillow `set_variation_by_axes`) plus `text14_w{100,400,900}.png` (running text at 14 px).

Thresholds `check_all` enforces (constants at the top of `quality.py`):

| Check | Glyphs | Masters | Pass |
| --- | --- | --- | --- |
| Thin ink | a–z, A–Z, 0–9, `comma semicolon quoteright quotedblright quoteleft quotedblleft` | wght 100 | `max_ink ≤ 2.5 × 22` |
| Join | `a b d g p q n m h u r` | 400, 900 | `join_ratio ≥ REF − 0.10` |
| Terminal cut | Latin | Black (upright + italic) | every `cap_angles` value ≤ 35° |
| Counter | `o e a` | 900 | `counter_area ≥ 0.70 × REF` |
| Sliver | Latin | 900 upright + italic | `sliver_area ≤ REF_SLIVER` (max over Inter's Latin at 900, measured in Step 3) |
| Sidebearings | a–z except `f j` | all masters | lsb, rsb ≥ 0; `x` lsb and rsb ≥ 25 at 400 |

- [ ] **Step 1: Write failing tests** in `src/test_quality.py`:
  - `test_metrics_on_synthetic_shapes`: a 100×20 bar → `max_ink` = 20 ± 1; a ring with a 40-unit hole → `counter_area` > 0; a square + 2-px spike → `sliver_area` ≥ the spike area.
  - `test_cap_lines_match_expand`: for 20 Regular glyph strokes, the segments returned by `cap_lines` appear verbatim in `expand`'s contour.
  - `test_current_font_fails_the_new_checks`: `check_all` on today's built fonts returns failures naming at least `t` and `comma` (Thin ink), `d` (join), `s` or `c` (terminal cut), `x` (sidebearings). Mark it `@unittest.expectedFailure` **only after** the work packages make it pass — until then it is a plain assertion that documents the starting point; WP5 flips it to `test_font_passes_quality_checks` asserting `check_all(...) == []`.
- [ ] **Step 2: Run** `python3 -I -m unittest src.test_quality -v` (from `fonts/cascivo-sans`, `-s src` style as the existing suite) → FAIL: `quality` module missing.
- [ ] **Step 3: Implement `quality.py` and `geom.cap_lines`.** Measure Inter (`$REFS/Inter.ttf`, opsz 14) once with the same functions and write the numbers into `REF` with a comment naming the Inter version (name ID 5) and date. Rebuild and confirm the shipped fonts are byte-identical (`python3 -I src/build.py && git status --short fonts/` empty) — this task changes no glyph.
- [ ] **Step 4: Run** the tests → PASS (the "current font fails" test passes because the checks fail as expected; record the failure list in the commit message).
- [ ] **Step 5: Wire into lint.** `lint.py main()` runs `check_all` on the built fonts when they exist and prints `N quality failures`; exit code stays 0 for quality failures **in this task only** (env `CASCIVO_QUALITY=warn`, default `strict` from Task 5 on). Run `python3 -I src/lint.py` → `0 problem contours` and the expected quality failures listed.
- [ ] **Step 6: Implement `proof.py`**; run `python3 -I src/proof.py /tmp/claude-0/-home-user-cascivo/684bb259-c9c5-54d1-9b23-6e019baa909a/scratchpad/proof/wp0 --refs $REFS` and open three sheets to confirm Cascivo, Inter and Geist all render (not a fallback font).
- [ ] **Step 7: Commit** `test(fonts): quality metrics, lint checks and proof sheets for the Latin pass`.

### Task 1: Joins (WP1)

**Files:** Modify `fonts/cascivo-sans/src/glyphs.py` (`_bowl_lc`, `shoulder` and its callers, `a`, `g`, the `n m h u r` arch constructions); `fonts/cascivo-sans/src/geom.py` only if a join helper is shared.

**Interfaces:** Consumes `quality.check_all`, `REF['join']`. Produces `join_taper(p) -> float` in `glyphs.py` — the weight-dependent join thinning every bowl/arch join uses (replacing the literal `0.55`/`0.5`).

- [ ] **Step 1:** Run `python3 -I src/lint.py` and save the join failures (the RED for this task).
- [ ] **Step 2:** Rework joins so the bowl leaves the stem tangentially (the bowl arc's last segment is horizontal-to-vertical into the stem edge, not an oblique cut into an ellipse) and thinning comes from `join_taper(p)`: 1.0 at Thin, about 0.7 at Regular, about 0.8 at Black, so Black never cuts a V. Keep point structure identical across masters.
- [ ] **Step 3:** Font gate (Global Constraints). Expected: no join failures; other quality failures may remain.
- [ ] **Step 4:** `python3 -I src/proof.py …/proof/wp1 --refs $REFS`; look at `cmp_u_w{100,400,900}_lower` and `_sentence`, upright and italic; the `a d b q g` joins match Inter's continuity.
- [ ] **Step 5:** `pnpm fonts:site:sync` (repo root), commit `fix(fonts): bowl and arch joins flow into the stem at every weight`.

### Task 2: Heavy terminals (WP2)

**Files:** Modify `fonts/cascivo-sans/src/geom.py` (`_heavy_cut`, `HEAVY_TURN`, the cap length limit in `expand`), per-glyph `cut=` arguments in `glyphs.py` where a glyph needs a different turn.

**Interfaces:** Consumes `quality.cap_angles`, `geom.cap_lines`.

- [ ] **Step 1:** Lint → save terminal-cut failures (RED).
- [ ] **Step 2:** At Black, turn aperture terminals toward horizontal with an Inter-like residual angle (target 15–35° from horizontal, never 0 by rule) and shorten the slide limit so ends do not run into tongues; terminals heading horizontally keep a vertical cut. Apertures of `s c e a g S C 3 5 6 9 ?` must visibly open (proof sheets).
- [ ] **Step 3:** Font gate → no terminal-cut failures.
- [ ] **Step 4:** Proof sheets `…/proof/wp2`; check `cmp_u_w900_lower`, `_upper`, `_figpunct` and the italic equivalents, plus `w650`.
- [ ] **Step 5:** Sync, commit `fix(fonts): Inter-like heavy terminals that keep apertures open`.

### Task 3: Thin hairlines and punctuation (WP3)

**Files:** Modify `glyphs.py` (`comma_shape`, `comma_depth`, the comma/semicolon/quote glyphs, `t` foot outline, dot sizing).

- [ ] **Step 1:** Lint → save Thin-ink failures (RED; expected `t`, `comma`, `semicolon`, quotes).
- [ ] **Step 2:** Comma and quote tails thin with the stem: tail width interpolates from about 1.6 × V at Thin to the current shape at Regular and Black (a slim tick at Thin, never a block). Rebuild the `t` foot so the inner radius stays below the outer at every master (no pinch); keep its master-parameterized construction. Dots stay square, sized so `max_ink` excludes them.
- [ ] **Step 3:** Font gate → no Thin-ink failures.
- [ ] **Step 4:** Proof `…/proof/wp3`; check `cmp_u_w100_*`, `text14_w100`, italic Thin.
- [ ] **Step 5:** Sync, commit `fix(fonts): Thin comma, quotes and t foot follow the hairline`.

### Task 4: Black counters and specific letters (WP4)

**Files:** Modify `glyphs.py` (`o e a g b d p q` widths at heavy weights, `a`, `g`, `f`, `t`, `l`, `y`, `one`, `zero`), `params.py` only for a heavy-width parameter if one is introduced.

- [ ] **Step 1:** Lint → save counter failures (RED); list the R5 letters from the spec as the visual checklist.
- [ ] **Step 2:** Grow Black counters toward Inter (`counter_area ≥ 0.70 × REF`) with modest heavy widening; `a`: sloped bowl top, no foot ledge; `g`: curved tail end without the spike, an ear that matches the stroke; `f`: no bite by the hook; Black `t`: flat top; `l`: a foot that does not collide (rsb ≥ 0 at every master); `y`: tail ending horizontal; `1`: shorter flag; `0`: wider.
- [ ] **Step 3:** Font gate → no counter failures; `test_heavy_weights_keep_their_rhythm` and `test_weight_changes_do_not_reflow_text` still pass (if a width change trips them, adjust the change, not the test).
- [ ] **Step 4:** Proof `…/proof/wp4`; check every listed letter at 400 and 900, upright and italic.
- [ ] **Step 5:** Sync, commit `fix(fonts): open Black counters; a, g, f, t, l, y, 1, 0 redrawn`.

### Task 5: Spacing and italic (WP5)

**Files:** Modify `glyphs.py` sidebearings (`g.sb`) for `x`, `l` and the Thin master's spacing factor (`params.py` if spacing is a master parameter), italic constructions for `z t A B R five ampersand`; `src/test_quality.py` (flip the starting-point test); `lint.py` (quality default `strict`).

- [ ] **Step 1:** Lint → save sidebearing and sliver failures (RED).
- [ ] **Step 2:** `x` sidebearings ≥ 25 at Regular; `l` rsb ≥ 0; Thin spacing opened 15–20 % (n's sidebearings at Thin within 10 % of Inter's at the same weight, from `REF`); remove italic Black slivers; `t`/`z` no longer touching in italic Black (`test_shaped_pairs_keep_clear` covers pairs, add `tz` there if missing).
- [ ] **Step 3:** Replace `test_current_font_fails_the_new_checks` with `test_font_passes_quality_checks`: `self.assertEqual(quality.check_all(VF, VFI), [])`; make `CASCIVO_QUALITY` default `strict`.
- [ ] **Step 4:** Font gate, plus `CASCIVO_GEORGIAN=1 CASCIVO_ARMENIAN=1 CASCIVO_HEBREW=1 python3 -I src/lint.py` → 0 problem contours; then rebuild without the env vars so shipped fonts are the default build.
- [ ] **Step 5:** Proof `…/proof/wp5` (full set). Controller sends the before (`wp0`) / after (`wp5`) sheets to the user and waits for their verdict before anything is pushed.
- [ ] **Step 6:** Sync, commit `fix(fonts): spacing and italic Black; quality checks now strict`.

### Task C: "How it compares" section (parallel with Tasks 0–5)

**Files:**
- Create: `fonts/cascivo-sans/src/compare.py`
- Create: `fonts/cascivo-sans/comparison.json` (written by the script)
- Modify: `scripts/fonts/sync-site.ts` (also writes `apps/site/src/marketing/pages/cascivo-sans/comparison.generated.ts` from `comparison.json`)
- Modify: `scripts/checks/font-site-sync.test.ts` (asserts the generated TS equals the JSON)
- Modify: `fonts/cascivo-sans/src/test_font.py` (`test_comparison_data_is_current`)
- Modify: `apps/site/src/marketing/pages/CascivoSansPage.tsx`, `apps/site/src/marketing/pages/cascivo-sans/font.css`

**Interfaces:**
- `python3 -I src/compare.py --refs $REFS` writes `comparison.json`: `{ "codepoints": "<build.LATIN>", "measured": "<ISO date>", "fonts": [ { "name", "version", "license", "scripts", "axes", "hinted", "since", "latin_wght_upright_bytes", "latin_wght_italic_bytes" | null, "codepoints_upright" } ] }`. Every font is instanced to drop axes other than `wght` (defaults pinned), subset to `build.LATIN` with fontTools, saved as WOFF2 and measured. Cascivo is read from `fonts/CascivoSans[opsz,wght].ttf` and `fonts/CascivoSans-Italic[opsz,wght].ttf`.
- `measure_cascivo() -> dict` in `compare.py`, reused by the test.
- `comparison.generated.ts` exports `COMPARISON` with the same shape (camelCase not required; keep the JSON keys).

- [ ] **Step 1:** Write `test_comparison_data_is_current` in `test_font.py`: `measure_cascivo()` equals the Cascivo entry in `comparison.json`. Run → FAIL (no script).
- [ ] **Step 2:** Implement `compare.py`; run it with `--refs $REFS`; static facts per font (license, scripts, hinted, since) are a table in the script with a source comment each. Run the test → PASS.
- [ ] **Step 3:** Extend `sync-site.ts` and `font-site-sync.test.ts`; run `pnpm fonts:site:sync` and `node --experimental-strip-types --test scripts/checks/font-site-sync.test.ts` → PASS.
- [ ] **Step 4:** Add the section between "Get the font" and "How it's made": `<section id="cs-compare">`, heading "How it compares", an intro saying smaller does not mean better drawn, a `<table>` (rows exactly as the spec's table; Geist italic "—"; sizes in KB with one decimal; bytes per codepoint rounded), and "Where it's behind (today)" with the spec's seven items verbatim in meaning. Table scrolls horizontally inside its own wrapper at 320 px (no page overflow).
- [ ] **Step 5:** Extend `scripts/quality/cascivo-sans-page.ts`: the table exists, has one row per spec row and one column per font, and the page still has no horizontal overflow at 320–414 px. Build the site and run it (`CHROMIUM_PATH=$(ls /opt/pw-browsers/chromium-1194/chrome-linux*/chrome)`) → all ok.
- [ ] **Step 6:** Commit `feat(site): honest, measured comparison on /cascivo-sans`.

### Task D: Docs, final gates (after Tasks 5 and C)

**Files:** `fonts/cascivo-sans/RESEARCH.md` (new §37 "The Latin quality pass", §5 scorecard updated from `comparison.json`), `fonts/cascivo-sans/CHANGELOG.md` (Unreleased), `fonts/cascivo-sans/README.md` (file sizes table if sizes moved).

- [ ] **Step 1:** Re-run `python3 -I src/compare.py --refs $REFS` against the final fonts; `pnpm fonts:site:sync`.
- [ ] **Step 2:** Write the docs: §37 names each root cause, the fix, and the before/after metric values from `quality.check_all`'s report; §5 replaces the outdated rows (Cyrillic/Greek coverage, sizes).
- [ ] **Step 3:** `pnpm exec vp fmt fonts/` and `pnpm ready` (repo root) → exit 0; browser check → all ok.
- [ ] **Step 4:** Commit `docs(fonts): the Latin quality pass`.

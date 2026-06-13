# v14 Master Plan — Earned Quality (Charts, Honest Performance, Accessibility Depth)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-13-v14-tranche-1.md` … `2026-06-13-v14-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.
>
> **Dependency:** v14 builds on the shipped state of the monorepo as of v13. It does not
> depend on v13's context-layer surfaces, but if v13 has landed, the new
> `AccessibilityMeta` fields (T4) should also flow into the context bundle. Re-verify each
> named file/command at tranche start; if absent, STOP and re-sequence.

**Goal:** Execute `docs/ROADMAP-V14.md` — convert three asserted quality claims into earned
receipts: (1) charts that adapt to every theme with researched CVD-safe per-theme palettes;
(2) one accessible (hover + keyboard) tooltip across all 17 chart types; (3) performance
numbers shown through standalone/incremental/amortized lenses with a fixed baseline and every
`0` explained; (4) WCAG 2.2 AA + per-component APG conformance + forced-colors/contrast audit;
(5) a real assistive-technology support matrix + legal-framework mapping with the axe ceiling
stated.

**Architecture:** No new packages. Palettes are per-theme `--cascivo-chart-1..8` overrides in
`@cascivo/themes` (one source-of-truth base set + ten theme tunings) verified by a
`scripts/checks` test. The tooltip is a primitive in `@cascivo/charts` core, consumed by
every chart in `packages/charts/src/charts/*`. Performance work touches the bench runner
(`apps/bench/runner/src`), the bench matrix apps, and the landing perf page
(`apps/landing/src/pages`). Accessibility type changes land in `@cascivo/core`
(`AccessibilityMeta`), are populated in every `*.meta.ts`, and are enforced by new checks in
`scripts/checks`; the AT matrix + accessibility statement are docs/landing pages.

**Tech stack:** unchanged — React 18+, modern CSS, Preact signals, vitest, vp toolchain,
Playwright (bench). Color math uses oklch (already the token format); CVD verification uses a
small CVD-simulation function (pure, in-repo) — no runtime dep added to shipped packages.

---

## Research findings (ground truth — verified 2026-06-13)

### Charts (verified in the repo)

- **Series colors:** `--cascivo-chart-1` … `--cascivo-chart-8` are oklch values defined in
  `packages/tokens/src/index.css` (lines ~194–201) and `packages/themes/src/light.css`. The
  **dark and warm theme files only override `--cascivo-chart-grid` and `-axis`** (grep:
  2 `cascade-chart-` matches each, both grid/axis) — the eight series colors are **not**
  overridden by any theme. Ten theme files exist: `light, dark, warm, brutalist, corporate,
flat, midnight, minimal, pastel, terminal`.
- **Tooltips:** of 17 chart dirs (`area, bar, boxplot, bubble, bullet, combo, heatmap,
histogram, kpi, line, meter, pie, radar, scatter, sparkline, treemap`), only `line`,
  `heatmap`, `histogram` declare a `tooltip` prop. `line-chart.tsx` implements it ad-hoc:
  a `tooltipRef` div whose `textContent`/`transform`/`opacity` are mutated on pointer move —
  **mouse-only, no keyboard, no `aria`**. `chart-frame.tsx` (the shared frame) has no tooltip
  support. There is no shared chart-tooltip component.
- **Color consumption:** charts read `--cascivo-chart-N` (verify the exact accessor —
  likely a `colorAt(i)` / CSS `var()` per series in each chart's tsx/css).

### External palette research (user asked to study popular systems)

- **Okabe-Ito** — the scientific-standard 8-color CVD-safe palette (orange `#E69F00`, sky
  blue `#56B4E9`, bluish green `#009E73`, yellow `#F0E442`, blue `#0072B2`, vermillion
  `#D55E00`, reddish purple `#CC79A7`, black/grey). Distinguishable under protanopia,
  deuteranopia, tritanopia. Avoids pure red/green. **cascade has exactly 8 slots → 1:1 map.**
- **Tableau 10**, **ColorBrewer** (qualitative sets), **IBM Carbon charts** categorical
  palette, and **shadcn** `--chart-1..5` are the comparison points. Common rules: ≤4
  categories use the highest-pairwise-contrast subset; never rely on color alone — add
  labels/patterns/direct annotation (redundant encoding).
- Sources: [Okabe-Ito reference](https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference),
  [Accessible Color Sequences for Data Viz (arXiv)](https://arxiv.org/pdf/2107.02270),
  [Colorblind-safe palettes (Scidraw)](https://sci-draw.com/blog/colorblind-safe-palettes-okabe-ito-reference),
  [Color in Data Visualization (DataStoryCoach)](https://www.datastorycoach.ai/blog/data-visualization-chart-design/color-in-data-visualization).

### Performance bench (verified in the repo)

- The landing page section "What one component costs" (`apps/landing/src/pages/PerformancePage.tsx`)
  renders `matrixRows()` from `perf-data.ts`, using `cell.incrementalGzKb`. Copy reads:
  _"Incremental cost = a build importing only that component, minus the baseline build."_
- The bench runner computes it in `apps/bench/runner/src/bundle.ts`:
  `incrementalGzKb = Math.round((total − baseline) * 100) / 100`, where `total`/`baseline`
  are gzipped JS+CSS of matrix builds. Matrix builds use `vite.matrix.config.ts` with a
  per-component HTML entry (`matrix/<entry>.html`) and a `baseline` entry. Three apps:
  `app-cascade`, `app-shadcn`, `app-carbon`.
- **Why shadcn tabs = 0 — hypotheses to test in T3:** (a) the shadcn matrix `tabs` entry is a
  stub / not implemented → `total ≈ baseline` → 0; (b) shadcn's Radix shared runtime + the
  Tailwind utility classes tabs uses are already present in the baseline build → near-zero
  marginal; (c) tree-shaking + min+gzip rounds a tiny delta to 0.0. T3 determines which.
- **Why cascade may look big — hypothesis to test:** if the cascade `baseline` matrix entry
  does **not** import `@cascivo/core` + `@cascivo/i18n`, the **first** component's
  incremental absorbs that one-time runtime, inflating every per-component figure. T3 checks
  the baseline entry's imports and fixes the baseline to preload the shared runtime.

### Accessibility (verified in the repo)

- `AccessibilityMeta` (`packages/core/src/types.ts`): `{ role: string; wcag: 'AA' | 'AAA';
keyboard: string[] }`. Every component manifest sets `wcag: 'AA'` (meaning WCAG 2.1 AA, by
  convention — the version is not encoded).
- Landing has an accessibility section (`apps/landing/src/pages/accessibility/*`) with an
  `AxeComparison`, a `CiGate`, and `data.ts` building an `A11Y_ROWS` matrix from the registry
  (`role`, `wcag`, `keyboard`) + an `AXE` slice (axe violations for cascade/shadcn/carbon).
- `prefers-reduced-motion` is handled in ~7 components (spinner, dropdown, progress-bar,
  skeleton, tooltip, progress-circle, status) — **not system-wide**. No `forced-colors` or
  `prefers-contrast` handling found broadly.
- **WCAG 2.2** (current W3C Recommendation) adds, among others (AA): 2.4.11 Focus Not
  Obscured (Minimum), 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum, 24×24px), 3.2.6
  Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication (Minimum).
- **ARIA APG** (Authoring Practices Guide) defines the canonical role/keyboard pattern per
  widget (tabs, dialog, combobox, menu, accordion, slider, …) — the behavioral bar AA leaves
  implicit.
- **Legal:** the European Accessibility Act (EAA) applies from 28 June 2025; EN 301 549 and
  US Section 508 both reference WCAG. axe-core documents that automated testing catches a
  minority (~30–40%) of WCAG issues — AT testing is the complement.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                              | Rationale                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | Base categorical palette derived from Okabe-Ito (8 colors), expressed in oklch, mapped 1:1 onto `--cascivo-chart-1..8`; documented lineage + the "≤4 categories use the high-contrast subset" guidance + redundant-encoding rule                                                                                                                      | CVD-safe scientific standard; matches cascade's 8 slots               |
| 2   | Per-theme overrides: each of the 10 theme CSS files sets all 8 `--cascivo-chart-*`, tuned for that theme's surface (lighter/desaturated for dark themes, etc.), each set independently CVD- and contrast-checked against that theme's `--cascivo-chart-surface`/background                                                                            | "Match the themes" requires per-theme tuning, not one palette         |
| 3   | A `scripts/checks` test (`chart-palette.test.ts`) asserts: every theme defines all 8 series colors; each series color meets a documented contrast ratio vs the theme chart background; adjacent series are distinguishable under simulated protanopia/deuteranopia/tritanopia (a pure in-repo CVD-sim of the oklch→sRGB values)                       | Earned, not asserted; regression-proof                                |
| 4   | One chart-tooltip primitive in `@cascivo/charts` core (`core/chart-tooltip.tsx`): positioned overlay + a focusable data-point layer; pointer hit-detection picks the nearest datum; arrow-key traversal moves a focused datum and the tooltip follows; `role`/`aria-live` announces the datum text via a `formatTooltip` hook                         | Accessible by construction; hover + keyboard; one impl for all charts |
| 5   | Rollout: every chart in `packages/charts/src/charts/*` adopts the primitive via the shared `chart-frame`; the ad-hoc tooltips in line/heatmap/histogram are removed and re-expressed through it; charts where a datum isn't point-identifiable (e.g. meter/kpi single value) document why they opt out                                                | Consistency; remove ad-hoc DOM mutation                               |
| 6   | T3 produces a written diagnosis FIRST (`docs/specs/perf-methodology.md` or a tranche note) answering: is it min+gzip? is shadcn tabs a stub entry or shared-dep amortization? does the cascade baseline preload the runtime? Only then fix                                                                                                            | Investigate before re-presenting (roadmap decision 4)                 |
| 7   | Fix the cascade baseline matrix entry to import `@cascivo/core` + i18n (the shared runtime any real app loads once) so per-component incrementals reflect marginal cost, not first-import runtime; if shadcn/carbon baselines need the analogous shared-runtime preload for fairness, apply symmetrically and document                                | Removes first-component inflation; apples-to-apples                   |
| 8   | Cost table gains three lenses: `standaloneGzKb` (component + its deps, isolated build), `incrementalGzKb` (marginal over runtime-preloaded baseline), `amortizedGzKb` (shared deps spread across the measured component set); each `0`/near-0 cell renders an inline note ("shared runtime already counted"); page copy explains lens vs architecture | Three honest answers > one misleading one                             |
| 9   | `AccessibilityMeta` gains: `wcag: '2.1-AA' \| '2.2-AA' \| '2.2-AAA'` (versioned; default target `'2.2-AA'`), `apgPattern?: string`, `forcedColors?: boolean`, `reducedMotion?: boolean`; existing `'AA'` values migrated to `'2.2-AA'` after the component meets 2.2                                                                                  | Encodes the version + pattern + media-feature support, was implicit   |
| 10  | WCAG 2.2 upgrade: apply the applicable additions — 2.5.8 Target Size (interactive targets ≥ 24×24px or spacing exception), 2.4.11 Focus Not Obscured (sticky/overlay don't hide focus), 2.5.7 Dragging (slider/any drag has a single-pointer alternative); a per-criterion check or documented review per component                                   | The bump is proven, not a string edit (roadmap decision 6)            |
| 11  | APG conformance check (`scripts/checks/apg.test.ts`): a map of `apgPattern → { requiredRoles, requiredKeys }`; for each component declaring a pattern, assert its `accessibility.role` + `keyboard` cover the pattern's requirements; missing key/role fails with the gap                                                                             | APG is the real behavioral bar (roadmap decision 7)                   |
| 12  | Media-feature audit (`scripts/checks/media-features.test.ts`): parse component CSS; every component that animates must have a `prefers-reduced-motion` guard; every interactive component must have a `forced-colors`/`@media (forced-colors: active)` treatment (or be allowlisted as inherently safe); `prefers-contrast` where color conveys state | Forced-colors/contrast/motion audited, not assumed (decision 8)       |
| 13  | AT support matrix (`docs/specs/at-matrix.md` + a landing/docs page): NVDA+Firefox, JAWS+Chrome, VoiceOver+Safari; per representative component, the tested result + notes; a written manual methodology; explicit statement that automated tools catch a minority of issues                                                                           | Real AT testing complements axe (decision 9)                          |
| 14  | Accessibility statement page: maps cascade's conformance to EAA / EN 301 549 / Section 508 (all WCAG-referencing), states what is verified at the component level vs what depends on the consuming app, links the AT matrix + axe results, notes no external VPAT yet                                                                                 | Legal frameworks mapped honestly (decision 10)                        |
| 15  | Receipts: docs themed chart gallery (one chart across all 10 themes), tooltip keyboard demo, the multi-lens perf table, the a11y conformance page; "Why cascade" claims 20–24 each link a receipt                                                                                                                                                     | Receipts-not-adjectives bar (v11–v13)                                 |
| 16  | Deferred: WCAG 2.2 AAA system-wide, diverging/sequential palettes, automated AT-in-CI, third-party VPAT, per-chart bespoke tooltip layouts                                                                                                                                                                                                            | Scope control                                                         |

## Tranche map

| Tranche | File                          | Contents                                                                                                                            | Risk                                                                              |
| ------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| T1      | `2026-06-13-v14-tranche-1.md` | Palette research doc, Okabe-Ito-based base set, per-theme `--cascivo-chart-*` for all 10 themes, CVD+contrast verification test     | Medium (color tuning across 10 themes; CVD-sim correctness)                       |
| T2      | `2026-06-13-v14-tranche-2.md` | Chart-tooltip primitive (hover + keyboard + aria), rollout to all 17 charts, remove ad-hoc tooltips                                 | Medium-high (keyboard traversal + hit-detection across heterogeneous chart types) |
| T3      | `2026-06-13-v14-tranche-3.md` | Bench diagnosis write-up, baseline runtime-preload fix, standalone/amortized metrics, multi-lens table + annotated zeros, page copy | Medium-high (bench methodology + fairness across three libs)                      |
| T4      | `2026-06-13-v14-tranche-4.md` | `AccessibilityMeta` extension, WCAG 2.2 AA upgrades, APG conformance check, forced-colors/contrast/reduced-motion audit + fills     | High (system-wide a11y upgrade + check authoring)                                 |
| T5      | `2026-06-13-v14-tranche-5.md` | AT/screen-reader support matrix + methodology, EAA/EN 301 549/508 mapping, axe-ceiling honesty, accessibility-statement page        | Medium (manual AT testing is real work; honest scoping)                           |
| T6      | `2026-06-13-v14-tranche-6.md` | Themed chart gallery, tooltip demo, multi-lens perf page, a11y conformance page, Why-cascade claims 20–24, README/llms, DoD         | Low                                                                               |

## Cross-cutting rules (every tranche)

1. **Earned, not asserted:** every claim ships with a test or a documented, reproducible
   verification. No metric is "improved" by editing a label — the underlying thing changes.
2. **Honesty in numbers and statements:** the perf page shows lenses that don't all favor
   cascade and says so; the accessibility statement says what is _not_ verified; the AT matrix
   states the automation ceiling. Never overstate.
3. **Color never carries meaning alone:** the palette work documents and (where charts render
   it) enforces redundant encoding (labels/direct annotation/patterns).
4. **Generated artifacts stay generated:** any palette/contrast/AT data surfaced in docs that
   derives from source flows through the regen pipeline + drift gate where one exists.
5. **House component rules** bind all component/docs work (signals, tokens, logical
   properties, i18n chrome strings, `useSignals()` in React apps, no `useEffect`).
6. **Gate before committing** (CLAUDE.md): `vp check` → build → `vp run -r check` → test →
   regen → `vp check --fix` → `git diff --exit-code`. All exit 0.

## Edge cases / risks registry

1. **CVD-sim correctness (T1):** an incorrect simulation gives false confidence. Use a
   documented, citable transform (e.g. the Viénot/Brettel approach or the Okabe-Ito-validated
   matrices) and unit-test it against known pairs; if a faithful sim is too heavy, fall back
   to verifying the chosen palette _is_ the validated Okabe-Ito mapping per theme (which is
   pre-proven CVD-safe) + contrast only, and say so.
2. **Per-theme tuning vs CVD safety (T1):** desaturating colors for dark themes can erode
   distinguishability. The contrast + CVD test gates every theme; if a tuned set fails, the
   theme keeps closer to the validated base rather than shipping a pretty-but-unsafe set.
3. **Keyboard traversal across chart types (T2):** point charts (line/scatter/bubble) have
   discrete data points; area/bar have categories; pie/treemap have segments; meter/kpi have
   one value. The primitive needs a per-chart "data-point provider" adapter — design it so
   each chart supplies its focusable items + positions; charts with no discrete datum opt out
   explicitly.
4. **jsdom can't measure layout (T2):** tooltip positioning depends on geometry jsdom doesn't
   compute. Unit-test the data-point selection + aria text + keyboard index logic (pure);
   verify visual positioning via a Playwright/docs check or screenshot, recorded in the PR.
5. **Bench fairness (T3):** preloading cascade's runtime in its baseline but not adjusting the
   competitors' baselines could itself mislead. Apply the shared-runtime-preload principle
   symmetrically (each lib's baseline preloads the runtime a real app of that lib loads once)
   and document the exact baseline composition per lib.
6. **shadcn tabs = 0 root cause (T3):** if it's a stub/missing matrix entry, the fix is to
   implement the entry (or mark the cell "not measured") — not to invent a number. Whatever
   the cause, the cell must become either a real measurement or an explicit "not measured",
   never an unexplained 0.
7. **`AccessibilityMeta` migration (T4):** changing `wcag: 'AA'` → `'2.2-AA'` across 72
   manifests is mechanical, but the value must only change once the component actually meets
   2.2. Sequence: upgrade component → run the criterion check → then flip the manifest value.
   A component that can't meet a 2.2 criterion keeps `'2.1-AA'` honestly.
8. **Target-size exceptions (T4):** WCAG 2.5.8 has legitimate exceptions (inline, essential,
   spacing). Dense components (e.g. table row actions) may rely on the spacing exception —
   document the exception per component rather than forcing 24px and breaking layouts.
9. **APG pattern fit (T4):** not every cascade component maps cleanly to an APG pattern
   (composites, charts). `apgPattern` is optional; the check only runs where declared. Don't
   force a pattern that doesn't fit.
10. **AT testing scope (T5):** testing all 72 components on three AT stacks is large. Scope to
    a documented representative set (one per APG pattern + the high-risk overlays) and say the
    matrix is representative, not exhaustive — honestly.
11. **Legal mapping overreach (T5):** cascade is a component library, not an application;
    conformance to EAA/508 is a property of the shipped product, not the library alone. The
    statement must scope claims to "component-level conformance under correct usage" and not
    imply the consuming app is automatically compliant.
12. **Palette change visual churn (T1/T6):** changing chart colors shifts every chart
    screenshot/demo. Update demos; record before/after for the themed gallery; ensure the v9
    theme-parity test (key-set) still passes (palette values change, keys don't).

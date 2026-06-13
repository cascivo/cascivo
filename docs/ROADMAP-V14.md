# cascade — Roadmap v14: Earned Quality

**Last updated:** 2026-06-13
**Status:** 📋 Planned (builds on v13 — The Context Layer)
**Plan documents:** `docs/superpowers/plans/2026-06-13-v14-master-plan.md` + tranches 1–6

---

## Vision

cascade's tagline promises three things: **beautiful** (by default), **performant**, and
**accessible** (WCAG AA). v14 stops asserting them and starts _earning_ them — by auditing
each promise against what the code actually does and closing the gap. Three concrete
findings, all real in the repo today, drive it:

1. **Charts don't actually match the themes.** The eight series colors
   (`--cascade-chart-1` … `--cascade-chart-8`) are defined once, tuned for the light theme,
   and **reused unchanged across all ten themes** — only `--cascade-chart-grid`/`-axis`
   adapt. On dark, brutalist, terminal, and pastel themes the palette clashes; it has never
   been verified for color-vision-deficiency (CVD) safety or contrast. And **14 of 17 chart
   types have no tooltip at all** — the three that do (line, heatmap, histogram) are ad-hoc,
   mouse-only, and not keyboard accessible. A chart you can't interrogate is a picture.

2. **The performance numbers mislead — by the project's own framing.** The landing
   "What one component costs" table reports _incremental gzip over a baseline build_
   (`incrementalGzKb = total − baseline`). That metric flatters shared-runtime libraries and
   penalizes cascade's honest per-component CSS: shadcn/ui's **tabs shows `0 KB`** — not
   because it is free, but because its Radix runtime + Tailwind utility classes were already
   paid by the baseline (and possibly because the matrix entry is a stub). Meanwhile
   cascade's first imported component may absorb the one-time `@cascade-ui/core` + i18n
   runtime, inflating it. The honest question — "what does one component cost?" — has more
   than one honest answer, and the page shows only the most misleading one.

3. **Accessibility is a single checkbox.** Every manifest carries `wcag: 'AA'` — meaning
   WCAG **2.1** AA, asserted, not proven per pattern. There is no WCAG **2.2** conformance
   (target size, focus-not-obscured, dragging alternatives), no mapping to the ARIA
   **Authoring Practices** patterns each widget should follow, no real assistive-technology
   testing (axe catches only ~40% of issues), incomplete `forced-colors`/`prefers-contrast`
   support, and no mapping to the legal frameworks customers are now bound by (the European
   Accessibility Act took effect June 2025; EN 301 549; Section 508).

> Concept: **"Earned quality."** Each v14 deliverable converts a claim into a receipt:
> charts that demonstrably adapt to every theme and reveal their data to mouse _and_
> keyboard; performance numbers shown through every honest lens with the zeros explained;
> accessibility measured against WCAG 2.2 AA, the APG patterns, and real screen readers —
> with the limits of automated testing stated out loud.

## The diagnosis (pain → what cascade has → what's missing)

| #   | Pain                                  | cascade today                                                                  | Gap v14 closes                                                                                                          |
| --- | ------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | Chart colors don't adapt to themes    | 8 oklch series tokens defined once; only grid/axis vary per theme              | No per-theme palettes; never CVD-checked or contrast-verified; clashes on dark/brutalist/terminal/pastel                |
| 2   | Charts don't reveal their data        | 3 of 17 charts have ad-hoc, mouse-only tooltips; no shared primitive           | No unified, accessible (hover + keyboard) chart tooltip; 14 chart types show nothing on interaction                     |
| 3   | Performance framing misleads          | One metric: incremental gzip over baseline; shadcn tabs = `0`, unexplained     | Single misleading lens; possible stub matrix entries; first-component runtime inflation; no standalone/amortized views  |
| 4   | Accessibility is asserted, not earned | `wcag: 'AA'` (2.1) on every manifest; axe comparison; partial reduced-motion   | No WCAG 2.2, no APG conformance, no AT/screen-reader matrix, partial forced-colors/contrast, no legal-framework mapping |

## The pitch additions (extends v13's claims 1–19)

| #   | Claim                                          | Substance                                                                                                                       |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 20  | **Charts adapt to every theme**                | Researched, CVD-safe per-theme palettes (Okabe-Ito-grounded), contrast-checked, verified by test across all ten themes.         |
| 21  | **Every chart reveals its data**               | One accessible tooltip primitive — hover _and_ keyboard traversal of data points — across all 17 chart types.                   |
| 22  | **Performance numbers are honest, multi-lens** | Standalone, incremental, and amortized cost shown side by side; baseline fixed so the first import isn't inflated; zeros explained. |
| 23  | **WCAG 2.2 AA + APG, proven per pattern**      | Components meet WCAG 2.2 AA (target size, focus-not-obscured, dragging) and map to their APG pattern with a conformance check.   |
| 24  | **Tested by real AT, mapped to law**           | NVDA/JAWS/VoiceOver support matrix; EAA / EN 301 549 / Section 508 mapping; the axe coverage ceiling stated honestly.            |

## Workstreams

| #   | Workstream            | Tranche | Summary                                                                                                                                          |
| --- | --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | Chart color system    | T1      | Palette research, CVD-safe 8-color base, per-theme `--cascade-chart-*` overrides for all 10 themes, contrast + CVD verification test.             |
| B   | Chart tooltips        | T2      | Shared accessible chart-tooltip primitive (hover + keyboard), rollout to all 17 chart types, replace the ad-hoc line/heatmap/histogram tooltips. |
| C   | Performance honesty   | T3      | Investigate + fix the bench (verify gzip, diagnose `tabs=0`, fix baseline runtime preload), multi-lens cost table, annotated zeros, page copy.    |
| D   | WCAG 2.2 + APG        | T4      | Extend `AccessibilityMeta`; upgrade components to WCAG 2.2 AA; per-component APG pattern conformance; forced-colors/contrast/reduced-motion audit. |
| E   | AT matrix + legal     | T5      | Screen-reader/AT support matrix + methodology, EAA/EN 301 549/508 mapping, axe-ceiling honesty, accessibility-statement page.                     |
| F   | Receipts + launch     | T6      | Themed chart gallery + tooltip demo, multi-lens perf page, a11y conformance page; Why-cascade claims 20–24; README/llms refresh; DoD walkthrough. |

## Decisions baked in

1. **The categorical palette is grounded in research, not taste.** The base 8-color set
   derives from the Okabe-Ito CVD-safe palette (the scientific-figure standard) cross-checked
   against Tableau 10, ColorBrewer, IBM Carbon charts, and shadcn's `--chart-*` convention.
   cascade already has exactly eight slots — they map one-to-one. Color never carries meaning
   alone (the redundant-encoding rule is documented).
2. **Palettes are per-theme overrides, not one palette.** Each of the ten themes overrides
   `--cascade-chart-1..8` in its own CSS, tuned for that theme's background and mood, every
   set independently CVD-checked and contrast-verified against its theme surface. A test
   enforces presence + contrast for all ten.
3. **One tooltip primitive, accessible by construction.** A single chart-tooltip lives in
   `@cascade-ui/charts` core: pointer hit-detection _and_ keyboard data-point traversal
   (arrow keys move a focused point, the tooltip follows), with an `aria` description so a
   screen reader announces the datum. The three existing ad-hoc tooltips are replaced by it;
   it rolls out to all 17 chart types. It is opt-out, on by default where a datum is
   identifiable.
4. **Performance gets investigated before it gets re-presented.** Before changing copy, T3
   verifies the bench actually measures min+gzip, diagnoses _why_ shadcn tabs is `0` (stub
   matrix entry vs. shared-dependency amortization vs. Tailwind classes already in baseline),
   and checks whether the cascade baseline preloads the shared runtime so the first component
   isn't charged for `core`/i18n. Findings are written down before the fix.
5. **Cost is shown through three honest lenses, side by side.** Standalone (the component +
   the deps it pulls, in isolation), incremental (marginal over a runtime-preloaded baseline),
   and amortized (shared deps spread across a realistic component set). Each cell that reads
   `0` carries an inline explanation. The page states which lens favors which architecture
   and why — cascade's honesty about per-component CSS is framed, not hidden.
6. **Accessibility targets WCAG 2.2 AA, system-wide.** `AccessibilityMeta.wcag` gains a
   versioned value; components are upgraded to satisfy the 2.2 additions that apply (2.5.8
   Target Size ≥ 24px, 2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 3.3.x where
   relevant). The bump is proven by per-pattern checks, not by editing a string.
7. **Each component declares and conforms to its APG pattern.** `AccessibilityMeta` gains an
   optional `apgPattern` (e.g. `'tabs'`, `'dialog-modal'`, `'combobox'`); a check maps it to
   the APG-required roles/keys and asserts the manifest's `keyboard` + the component's roles
   satisfy the pattern. APG is the real behavioral bar AA leaves implicit.
8. **Forced-colors, contrast, and reduced-motion are audited, not assumed.** A check asserts
   every interactive component handles `forced-colors` (Windows High Contrast) without losing
   affordances, respects `prefers-reduced-motion` where it animates, and honors
   `prefers-contrast`. Gaps are filled in T4.
9. **Real assistive technology is tested and the limit of automation is stated.** T5 produces
   a screen-reader support matrix (NVDA + Firefox/Chrome, JAWS + Chrome, VoiceOver + Safari)
   with a documented manual methodology — and states plainly that axe/automated tooling
   catches a minority of issues, so AT testing is the complement, not a nice-to-have.
10. **Legal frameworks are mapped, not claimed.** An accessibility-statement page maps
    cascade's conformance to the EAA (in force June 2025), EN 301 549, and Section 508 —
    which all reference WCAG — honestly noting what is verified vs. what depends on the
    consuming application.
11. **No new packages.** Palette work lands in `@cascade-ui/themes`; the tooltip in
    `@cascade-ui/charts`; perf work in `apps/bench` + `apps/landing`; a11y type changes in
    `@cascade-ui/core`; checks in `scripts/checks`; surfaces in `apps/docs`/`apps/landing`.

## Definition of Done

- [ ] All ten themes override `--cascade-chart-1..8` with a theme-tuned, CVD-safe,
      contrast-verified palette; a test fails if any theme is missing a chart color or any
      series color falls below the contrast threshold against that theme's chart surface; the
      base palette's research lineage is documented.
- [ ] A single chart-tooltip primitive in `@cascade-ui/charts` supports pointer hover and
      keyboard data-point traversal with an `aria` announcement; all 17 chart types use it;
      the ad-hoc line/heatmap/histogram tooltips are removed; tests cover hover, keyboard, and
      the screen-reader description.
- [ ] T3 writes down the diagnosis of `shadcn tabs = 0` and the cascade-baseline runtime
      question before any fix; the bench baseline preloads the shared runtime so the first
      component is not inflated; the cost table shows standalone + incremental + amortized
      lenses with every `0` annotated; the page copy states which lens favors which
      architecture.
- [ ] `AccessibilityMeta` carries a versioned WCAG value (2.2 AA) + optional `apgPattern` +
      forced-colors/reduced-motion flags; components satisfy the applicable WCAG 2.2 additions;
      an APG-conformance check passes for every component declaring a pattern; a
      media-feature audit (forced-colors / prefers-contrast / prefers-reduced-motion) is green.
- [ ] A screen-reader/AT support matrix exists with a documented manual methodology covering
      NVDA, JAWS, and VoiceOver; an accessibility-statement page maps EAA / EN 301 549 / 508
      and states the axe coverage ceiling honestly.
- [ ] Docs/landing surfaces ship: a themed chart gallery (same chart across all ten themes),
      a tooltip demo, the multi-lens performance page, and the accessibility conformance page;
      the "Why cascade" page states claims 20–24 with reproducible receipts.
- [ ] Full local CI gate exits 0: `vp check`, build, type check, tests, regeneration +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v14)

- **WCAG 2.2 AAA** — selectively informative, but AAA is not a system-wide target; note where
  a component happens to meet a AAA criterion, don't chase it everywhere.
- **Diverging/sequential palette systems** — v14 does the categorical (series) palette; ramp
  palettes for heatmaps/choropleths beyond the existing single use are a follow-up.
- **Automated AT testing in CI** — real screen-reader testing stays manual with a written
  methodology; driving NVDA/JAWS/VoiceOver in CI is its own project.
- **A formal third-party VPAT/audit** — the self-assessed accessibility statement is the v14
  ceiling; a paid external audit is out of scope (and noted as such on the statement page).
- **Per-chart-type bespoke tooltips** — one primitive serves all; chart-type-specific tooltip
  layouts beyond the shared formatter hook are deferred.

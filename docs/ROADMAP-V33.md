# cascivo — Roadmap v33: Landing Polish — Re-render Demo, Carousel, Charts & Chrome

**Last updated:** 2026-06-17
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-17-v33-master-plan.md` + tranches 1–8

---

## Vision

v32 fixed three hard navigation/preview bugs. v33 is a focused **landing-page polish sprint**: eight rough edges across Home, the example demos, Blocks, Accessibility, and Performance. Each is a self-contained, user-visible defect — no new components, no new packages. The goal is a landing page where every section reads as deliberate and every chart actually shows data.

---

## Defect 1 — Home "Count the re-renders": no animation, two forms

**Where it appears:** Home section `#signals` ("Count the re-renders"), rendered by `apps/landing/src/sections/SignalsDemo.tsx`.

**Symptoms:**

- Two side-by-side forms (signals twin + useState twin). The contrast only appears if the visitor types into _both_ forms — most don't, so the counters stay at 0/0 and the point is lost.
- No motion. Nothing draws the eye to the counters or demonstrates the difference automatically.

**Fix:** Restructure to **one visible interactive form** (signal-bound) plus a mounted useState twin that mirrors the same keystrokes, with **two render-count badges shown together**. Add a `prefers-reduced-motion`-aware typewriter that auto-types a sample name/email into the field, so both counters tick live on page load — signals stays low, useState climbs per keystroke.

**Files:** `apps/landing/src/sections/SignalsDemo.tsx`, `apps/landing/src/landing.css` (`.signals*`, `.twin-*`).

---

## Defect 2 — Home "Drive it, don't read about it.": hard demo cut

**Where it appears:** Home section `#examples`, rendered by `apps/landing/src/sections/ExamplesGallery.tsx`.

**Symptoms:** The carousel auto-advances every 4 s and on prev/next/dot clicks. The screenshot `<img src>` and info text swap **instantly** — a jarring hard cut. No transition CSS exists on `.examples-screenshot` or `.examples-carousel-info`.

**Fix:** Add a smooth cross-fade on demo switch (opacity + slight translate), driven by a signal that toggles a `data-state` on the carousel and re-keys on `activeIdx`. Respect `prefers-reduced-motion`.

**Files:** `apps/landing/src/sections/ExamplesGallery.tsx`, `apps/landing/src/landing.css` (`.examples-carousel*`).

---

## Defect 3 — Example demo apps: no way back to the landing page

**Where it appears:** The five assembled demo SPAs at `/demos/<slug>/` (deploy, pay, flow, track, pulse). They render a "Mock demo — no real data" banner via the shared `AppShell` in `apps/examples/kit/src/app-shell.tsx`, but there is **no link back** to the landing page.

**Fix:** Turn the mock banner into a banner-with-link: keep the "Mock demo — no real data" text and add a "← Back to cascivo" link. Because the demos build with `base: './'` and mount at `/demos/<slug>/`, the link target is the site root `/`.

**Files:** `apps/examples/kit/src/app-shell.tsx`, `apps/examples/kit/src/app-shell.module.css`.

---

## Defect 4 — Blocks page: green placeholder cards, no site chrome

**Where it appears:** `/blocks` (`apps/landing/src/pages/blocks/BlocksPage.tsx`) and `/blocks/<name>` (`BlockDetailPage.tsx`).

**Symptoms (two bugs):**

1. **Green cards.** Each card renders `<img src={meta.screenshot.light}>`. The committed screenshot PNGs in `apps/landing/public/blocks/screenshots/` are **1×1 placeholder pixels** (`rgba(0,255,0,.5)` — green at 50 % alpha), stretched to fill the 16:9 card via `object-fit: cover`. That green block is the "image."
2. **No navbar.** `BlocksPage` and `BlockDetailPage` render a bare `<main>` with no `<Header />` / `<Footer />`, unlike every other landing page (Performance, Accessibility, Guides, Examples). They look orphaned.

**Fix:**

1. Replace the placeholder `<img>` with a **live scaled preview** — an `<iframe src="/blocks/preview/<name>">` (the existing bare preview route) scaled down with `transform: scale()`, `pointer-events: none`, `aria-hidden`, lazy-loaded. Always in sync with the real block; no screenshot pipeline.
2. Wrap both pages in the standard chrome: `<SkipNavLink /> <Header /> <SkipNavTarget><main>…</main></SkipNavTarget> <Footer />`.

**Files:** `apps/landing/src/pages/blocks/BlocksPage.tsx`, `apps/landing/src/pages/blocks/BlockDetailPage.tsx`, `apps/landing/src/pages/blocks/blocks.css`.

---

## Defect 5 — Accessibility "Same app, same axe run": meaningless bar chart

**Where it appears:** `/accessibility` section `#axe`, rendered by `apps/landing/src/pages/accessibility/AxeComparison.tsx`.

**Symptoms:** A horizontal `BarChart` plots axe violation counts: cascivo 0, shadcn/ui 0, Carbon 1. Two of three bars have zero width and vanish, so the chart looks empty/broken and the single "label" violation on Carbon is lost. A bar chart is the wrong primitive for a "0 / 0 / 1" pass-fail comparison.

**Fix:** Replace the bar chart with a **pass/fail scorecard** — three status cards (one per library) showing a clear PASS (0 violations) / FAIL badge, the violation count, and the failing rule names. Zero reads as a celebrated pass, not an invisible bar; Carbon's single `label` failure is explicit. The existing rule list and disclosure stay.

**Files:** `apps/landing/src/pages/accessibility/AxeComparison.tsx`, `apps/landing/src/pages/accessibility/accessibility.css` (or `landing.css`).

---

## Defect 6 — Performance "What does one component cost?": unstyled toggle, no deltas

**Where it appears:** `/performance` section "What does one component cost?", `apps/landing/src/pages/PerformancePage.tsx` (`MatrixSection`).

**Symptoms (two bugs):**

1. The "Incremental / Standalone / Amortized" lens toggle is three raw `<button>`s. The class `.perf-lens-toggle` and its `.active` state have **no CSS** — they render as default browser buttons.
2. The per-component table shows raw KB per library. There is no at-a-glance sense of how much heavier shadcn/ui and Carbon are than cascivo.

**Fix:**

1. Replace the raw buttons with the library's **`SegmentedControl`** component, bound to the `lens` signal.
2. In the shadcn/ui and Carbon cells, append a signed percentage delta vs cascivo — e.g. `12.0 KB (+34%)`. Omit the delta when it rounds to 0 % or when the cascivo baseline is missing.

**Files:** `apps/landing/src/pages/PerformancePage.tsx`, `apps/landing/src/pages/perf-data.ts` (delta helper), `apps/landing/src/landing.css`.

---

## Defect 7 — Performance "All scenarios — median": no best/worst signal

**Where it appears:** `/performance` `LatencySection`, the `.perf-table` captioned "All scenarios — median (p25–p75), ms".

**Symptoms:** Every cell is styled identically. With three libraries per row, there's no visual cue for which is fastest (best) and which is slowest (worst).

**Fix:** Per row, compute the min and max median across libraries with data; mark those `<td>`s with `data-perf="best" | "worst"` and style them (best = success accent, worst = danger accent). Skip when only one library has data or all medians tie.

**Files:** `apps/landing/src/pages/PerformancePage.tsx`, `apps/landing/src/landing.css`.

---

## Defect 8 — Performance "Re-renders": empty chart (no bars)

**Where it appears:** `/performance` `RendersSection`, the grouped `BarChart` "React root commits per scenario".

**Root cause:** `apps/bench/results/results.json` → `renders` has **all-zero** commit counts for every scenario × library (`{cascade:0, shadcn:0, carbon:0}` ×8). `rendersSeries()` builds valid series with `present.length > 0`, so the empty-state guard never trips — but every bar has height 0 and nothing renders. The committed bench data is stale/empty even though the harness (`apps/bench/app-*/src/harness.tsx`) wires a React `Profiler` to `window.__commits`.

**Fix (two parts):**

1. **Data (T7):** Investigate why `window.__commits` stays 0 (Profiler placement / stale results), repair if a wiring bug exists, re-run the render suite, and regenerate `results.json` so real commit counts populate (cascivo should be far lower than shadcn/ui for keystroke/toggle scenarios). If the full Playwright bench cannot run in this environment, the harness fix + regeneration is handed off and documented.
2. **Landing (T6):** Make `rendersSeries()` return `null` when every value is 0, so the section degrades to its existing "No render data yet" message instead of a blank chart frame. Apply the same all-zero guard to the `SignalsDemo` bench teaser.

**Files:** `apps/landing/src/pages/perf-data.ts`, `apps/landing/src/sections/SignalsDemo.tsx`, `apps/bench/app-*/src/harness.tsx`, `apps/bench/results/results.json` (regenerated).

---

## Workstreams

| #   | Workstream            | Tranche | Summary                                                         |
| --- | --------------------- | ------- | --------------------------------------------------------------- |
| A   | Home — re-render demo | T1      | One form, dual live counters, reduced-motion typewriter         |
| B   | Home — carousel       | T2      | Cross-fade demo switch                                          |
| C   | Demos + Blocks chrome | T3      | Mock-banner back-link; Blocks site chrome + live-preview cards  |
| D   | Accessibility         | T4      | Axe bar chart → pass/fail scorecard                             |
| E   | Performance — matrix  | T5      | SegmentedControl lens + per-component % deltas                  |
| F   | Performance — tables  | T6      | Latency best/worst indicators + re-renders graceful empty state |
| G   | Bench — render data   | T7      | Repair commit capture + regenerate `results.json`               |
| H   | Gate                  | T8      | Full CI gate                                                    |

---

## Cross-cutting rules

1. No new npm packages, no new components.
2. Signals only — `useSignal` / `useComputed` / `useSignalEffect`. No `useState` except the sanctioned re-render twin in `SignalsDemo` (and `BlockDetailPage`'s existing pattern). No `useEffect`.
3. Every animation respects `prefers-reduced-motion`.
4. Width literals in any new `@media` / `@container` come only from the canonical scale (`pnpm breakpoint:check`).
5. Run `pnpm exec vp check` after each tranche before committing.
6. No off-scale breakpoint literals; touch targets ≥ 44px under `pointer: coarse`.

---

## Definition of Done

### T1 — Re-render demo

- [ ] One visible interactive form; two render-count badges shown together.
- [ ] Typewriter auto-types on load; counters tick live (signals low, useState per-keystroke).
- [ ] No animation under `prefers-reduced-motion: reduce`.
- [ ] No `useEffect`; useState used only in the sanctioned twin.

### T2 — Carousel

- [ ] Demo switch cross-fades (opacity + slight translate); no hard cut.
- [ ] Auto-advance, prev/next, and dot clicks all animate.
- [ ] No animation under `prefers-reduced-motion: reduce`.

### T3 — Demos + Blocks chrome

- [ ] Demo SPAs show a "← Back to cascivo" link in/beside the mock banner; target `/`.
- [ ] `BlocksPage` and `BlockDetailPage` render `<Header />` and `<Footer />` like other pages.
- [ ] Block cards show a live scaled preview (iframe to `/blocks/preview/<name>`), not a green placeholder; preview is `aria-hidden`, `pointer-events: none`, lazy.

### T4 — Accessibility scorecard

- [ ] Axe bar chart replaced by three pass/fail status cards.
- [ ] cascivo + shadcn/ui read PASS (0); Carbon reads FAIL with `label` shown.
- [ ] Rule list + disclosure retained.

### T5 — Performance matrix

- [ ] Lens toggle is a `SegmentedControl` bound to the `lens` signal.
- [ ] shadcn/ui & Carbon cells show signed % delta vs cascivo; omitted when 0 % or baseline missing.

### T6 — Performance tables + re-renders guard

- [ ] Each latency row marks best (min median) and worst (max median) cells; skipped when single-lib or all tie.
- [ ] `rendersSeries()` returns `null` when all values are 0 → section shows "No render data yet".
- [ ] `SignalsDemo` bench teaser hidden when render data is all-zero.

### T7 — Bench render data

- [ ] Root cause of all-zero `__commits` identified and documented.
- [ ] Harness wiring fixed if defective; render suite re-run; `results.json` regenerated.
- [ ] `renders` shows non-zero counts; cascivo < shadcn/ui for `type-20-chars` / `toggle-50-checkboxes` (or, if un-runnable here, documented hand-off + landing graceful state from T6 covers it).

### T8 — Gate

- [ ] `pnpm exec vp check` exits 0.
- [ ] `pnpm build` exits 0.
- [ ] `pnpm exec vp run -r check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` exits 0.
- [ ] `pnpm breakpoint:check` exits 0.
      </content>

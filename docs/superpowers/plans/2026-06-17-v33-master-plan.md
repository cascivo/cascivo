# v33 — Landing Polish: Re-render Demo, Carousel, Charts & Chrome — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish eight user-visible rough edges on the landing page and the assembled demo apps: the re-render counter demo, the examples carousel, the demo back-link, the Blocks page, the Accessibility axe comparison, and three Performance-page issues (lens toggle, latency table, empty re-renders chart) — plus repairing the stale all-zero bench render data behind the empty chart.

Target metrics (measured after T8):

| Metric                                              | Target          |
| --------------------------------------------------- | --------------- |
| Re-render demo: visible forms                       | 1               |
| Re-render demo: live counters                       | 2               |
| Carousel demo switch                                | cross-fade      |
| Demo SPAs with back-to-landing link                 | 5 / 5           |
| Blocks pages with site chrome                       | 2 / 2           |
| Blocks cards showing a real preview (not green)     | all             |
| Axe section primitive                               | scorecard       |
| Perf lens control                                   | SegmentedControl|
| Perf matrix cells with % delta (where meaningful)   | shadcn + carbon |
| Latency rows with best/worst marking                | all multi-lib   |
| Re-renders chart                                    | bars or honest empty |
| `renders` non-zero in `results.json`                | yes (or hand-off)|
| Full CI gate (T8)                                   | passes          |

**Architecture:** Every change is local to one section/component plus its CSS. No component-library source changes except consuming the existing `SegmentedControl`. The only cross-package work is T7 (bench harness + regenerated `results.json`). T1, T2, T4, T5, T6 touch `apps/landing` only. T3 touches `apps/examples/kit` and `apps/landing/src/pages/blocks`.

**Tech Stack:** No new npm packages, no new components. Signals (`useSignal`/`useComputed`/`useSignalEffect`) for all interactivity; the only `useState` is the sanctioned re-render twin in `SignalsDemo`. Charts come from `@cascivo/charts`; `SegmentedControl` from `@cascivo/react`. Bench tooling is Playwright (existing).

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                       |
| ------- | ---------------------------------- | -------------------------------------------------------------------------- |
| T1      | Home — re-render demo              | One form, two live counters, reduced-motion typewriter                     |
| T2      | Home — carousel cross-fade         | Smooth fade between demos                                                   |
| T3      | Demos + Blocks chrome              | Mock-banner back-link; Blocks `<Header/>/<Footer/>` + live-preview cards    |
| T4      | Accessibility scorecard            | Replace axe bar chart with pass/fail status cards                          |
| T5      | Performance — matrix               | SegmentedControl lens + per-component % deltas                             |
| T6      | Performance — tables + guard       | Latency best/worst markers + re-renders all-zero graceful state            |
| T7      | Bench — render data                | Repair commit capture + regenerate `results.json`                          |
| T8      | Gate                               | Full CI gate                                                               |

---

## Files Created / Modified per Tranche

### T1 — Home re-render demo

| Action | Path                                          |
| ------ | --------------------------------------------- |
| Modify | `apps/landing/src/sections/SignalsDemo.tsx`   |
| Modify | `apps/landing/src/landing.css`                |

### T2 — Carousel cross-fade

| Action | Path                                            |
| ------ | ----------------------------------------------- |
| Modify | `apps/landing/src/sections/ExamplesGallery.tsx` |
| Modify | `apps/landing/src/landing.css`                  |

### T3 — Demos + Blocks chrome

| Action | Path                                                 |
| ------ | ---------------------------------------------------- |
| Modify | `apps/examples/kit/src/app-shell.tsx`                |
| Modify | `apps/examples/kit/src/app-shell.module.css`         |
| Modify | `apps/landing/src/pages/blocks/BlocksPage.tsx`       |
| Modify | `apps/landing/src/pages/blocks/BlockDetailPage.tsx`  |
| Modify | `apps/landing/src/pages/blocks/blocks.css`           |

### T4 — Accessibility scorecard

| Action | Path                                                      |
| ------ | --------------------------------------------------------- |
| Modify | `apps/landing/src/pages/accessibility/AxeComparison.tsx`  |
| Modify | `apps/landing/src/pages/accessibility/accessibility.css`  |

### T5 — Performance matrix

| Action | Path                                       |
| ------ | ------------------------------------------ |
| Modify | `apps/landing/src/pages/PerformancePage.tsx` |
| Modify | `apps/landing/src/pages/perf-data.ts`        |
| Modify | `apps/landing/src/landing.css`               |

### T6 — Performance tables + guard

| Action | Path                                        |
| ------ | ------------------------------------------- |
| Modify | `apps/landing/src/pages/PerformancePage.tsx`|
| Modify | `apps/landing/src/pages/perf-data.ts`       |
| Modify | `apps/landing/src/sections/SignalsDemo.tsx` |
| Modify | `apps/landing/src/landing.css`              |

### T7 — Bench render data

| Action | Path                                      |
| ------ | ----------------------------------------- |
| Inspect| `apps/bench/app-cascade/src/harness.tsx`  |
| Inspect| `apps/bench/app-shadcn/src/harness.tsx`   |
| Inspect| `apps/bench/app-carbon/src/harness.tsx`   |
| Inspect| `apps/bench/runner/src/renders.ts`        |
| Modify | harness/runner if a wiring bug is found   |
| Regen  | `apps/bench/results/results.json`         |

### T8 — Gate

| Action | Path                                                            |
| ------ | --------------------------------------------------------------- |
| Verify | `registry.json` (regenerated via `pnpm regen`, no manual edits) |

---

## Key Decisions

### Re-render demo: how "one form, two counters" stays honest

The pedagogical claim is "same keystrokes, two re-render behaviours." To preserve that with a single visible form:

- The **visible form** binds to module-level signals (`sigName`, `sigEmail`, `sigNewsletter`). Its form component never re-renders — only the isolated field components do. This is the "signals" implementation and its counter (`signalFormRenders`) stays at ~0.
- A mounted **`StateTwin`** subscribes to those same signals via `useSignalEffect(() => setName(sig.value))` and stores them in `useState`. Each signal write triggers the effect → `setState` → the whole twin re-renders, exactly as a real `useState` form would on each keystroke. Its counter (`stateFormRenders`) climbs per keystroke. The twin is visually minimal (it exists to count, not to duplicate the form), so only one form is on screen.
- `useSignalEffect` is the sanctioned bridge (CLAUDE.md: DOM/async side effects use `useSignalEffect`, never `useEffect`). `useState` here is the same sanctioned twin exception already documented in this file's header comment.

This is honest: the twin genuinely re-renders once per keystroke; the counter is a real render count, not a simulated number.

### Typewriter animation

A `useSignalEffect` starts a `setInterval` that appends one character at a time to `sigName` then `sigEmail` from a fixed sample (`"Ada Lovelace"` / `"ada@example.com"`), loops with a pause, and clears on unmount. Because the visible field is signal-bound, the typed text shows live and both counters update. Guard with `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — when set, fill the fields once and skip the loop. No `useEffect`, no timers outside `useSignalEffect` cleanup.

### Carousel: CSS cross-fade keyed on `activeIdx`

Rather than manage two layered images, re-key the fading content on `activeIdx` and apply a CSS `@keyframes` fade-in (opacity 0→1 + small `translateY`/`scale`) on mount. Toggling the React `key` remounts the screenshot + info block, re-triggering the entrance animation on every switch — auto-advance, prev/next, and dots alike. Wrap the keyframes in `@media (prefers-reduced-motion: no-preference)` so reduced-motion users get an instant swap.

### Blocks cards: live iframe preview, not screenshots

The chosen approach (user-confirmed) is live scaled previews over a screenshot pipeline. The bare `/blocks/preview/<name>` route already renders just the block. Each card embeds `<iframe src="/blocks/preview/<name>" loading="lazy" tabIndex={-1} aria-hidden>` inside a fixed-aspect frame, scaled with `transform: scale(...)` and `transform-origin: top left` so a desktop-width render shrinks into the card. `pointer-events: none` on the iframe keeps the whole card a single clickable link. This removes the fake green-pixel PNGs entirely; cards always match the real block.

> The 1×1 green placeholder PNGs in `apps/landing/public/blocks/screenshots/` become dead assets after T3. Per CLAUDE.md ("mention unrelated dead code, don't delete it"), they are flagged here but **not** deleted in this sprint, since other surfaces (meta files, docs) may still reference `screenshot.*`.

### Accessibility: scorecard over chart

A bar chart of `[0, 0, 1]` is structurally wrong — zeros are invisible. Three status cards make "0 = PASS" a positive, explicit signal and surface Carbon's single `label` failure in context. No chart primitive added; the cards are plain markup + existing tokens. The rule list and "coverage ceiling" disclosure are retained verbatim.

### Performance lens: SegmentedControl bound to a signal

`SegmentedControl` is controlled (`value: string`, `onValueChange: (v) => void`). Bind `value={lens.value}` and `onValueChange={(v) => { lens.value = v as Lens }}`, with `options` derived from `LENS_LABELS`. This deletes the unstyled `.perf-lens-toggle` buttons and the dead `.active` class.

### Performance matrix: signed % delta vs cascivo

Add `pctDelta(lib, cascade)` to `perf-data.ts`: `((libVal - cascadeVal) / cascadeVal) * 100`, rounded to a whole number. Render `(+34%)` / `(−8%)` after the KB value in shadcn/ui and Carbon cells. Omit when the rounded value is 0, when `cascadeVal` is missing/zero, or for the cascivo column itself. Delta is recomputed per active lens (it reads the same `${lib}_${lens}` field already in the row).

### Performance latency: best/worst via data attributes

For each row, gather defined medians, take `min` (best) and `max` (worst). Tag the matching `<td>` with `data-perf="best"`/`"worst"`. CSS colours best with the success accent and worst with the danger accent (text weight + subtle background). Skip entirely when fewer than two libraries have data or when `min === max`.

### Re-renders chart: guard + data repair

Two independent fixes (user-confirmed "both"):

- **Landing (T6):** `rendersSeries()` returns `null` when every `y` across every series is 0. The section then shows its existing "No render data yet — run `pnpm bench`" message instead of an empty chart frame. Same all-zero guard gates the `SignalsDemo` bench teaser so it doesn't print "cascivo 0 root commits, shadcn 0, carbon 0".
- **Bench (T7):** Diagnose why `window.__commits` stays 0 (Profiler placement vs. stale committed data), repair if needed, re-run the render suite, regenerate `results.json`. After real data lands, the T6 guard naturally stops tripping and the chart shows bars. If the full Playwright bench cannot run in this environment, T7 delivers the harness fix + a documented hand-off, and the T6 graceful state remains the user-facing behaviour until the bench is re-run in CI.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` must pass after each tranche before committing.
2. No new npm packages; no new components.
3. Signals only. The single sanctioned `useState` is the `SignalsDemo` twin. No `useEffect`/`useLayoutEffect`/`useReducer`/`useContext` anywhere.
4. Every animation is wrapped so `prefers-reduced-motion: reduce` disables it.
5. Any new `@media`/`@container` width literal comes from the canonical scale (`sm 30rem`, `md 40rem`, `lg 64rem`, `xl 80rem`); run `pnpm breakpoint:check`.
6. Interactive controls keep ≥44px effective tap target under `pointer: coarse`.
7. T7 must not hand-edit `results.json` — only regenerate it via the bench runner.
8. Existing copy (axe disclosure, footnotes, methodology links) is preserved unless a defect requires changing it.
</content>

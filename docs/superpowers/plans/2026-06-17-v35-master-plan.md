# v35 — Landing Page Lighthouse Fixes — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every failing Lighthouse audit on cascivo.com. Two runs captured 2026-06-17 (`tmp/cascivo.com-20260617T191812.json` desktop, `tmp/cascivo.com-20260617T191902.json` mobile) form the baseline. Work through five tranches from highest-impact to lowest, respecting the dependency: T3 (color contrast) gates on T1 (MIME fix) being deployed first.

Target state (verified after T5):

| Metric                         | Baseline (desktop / mobile)     | Target    |
| ------------------------------ | ------------------------------- | --------- |
| Performance                    | 93 / 84                         | 95+ / 90+ |
| Accessibility                  | 94 / 97                         | 100 / 100 |
| Best Practices                 | 96 / 96                         | 100 / 100 |
| SEO                            | 100 / 100                       | 100 / 100 |
| Console errors                 | 10 (theme MIME)                 | 0         |
| `aria-hidden-focus` violations | 2 (desktop: 1, mobile: 2)       | 0         |
| Color contrast failures        | 1 (desktop badge)               | 0         |
| Render-blocking resources      | 2 (`index.css` + `spinner.css`) | 0–1       |

**Architecture:** All work stays inside `apps/landing` and `packages/themes/package.json`. No component source changes outside the landing demo (`RelayConsole.tsx`, `Header.tsx`). No new runtime dependencies. The MIME fix is the only change that touches `packages/`; it is purely an export-map addition, not a functional change.

**Tech Stack:** Vite + Rolldown (via `vp`), React 18, Preact Signals, `@cascivo/themes` (CSS-only package), `@cascivo/components` (copy-paste components). No new packages required.

---

## Tranche Overview

| Tranche | Title                            | Goal                                                                                     |
| ------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| T1      | Theme MIME fix                   | Add `.css` to `landing.css` `@import`s; add dual export entries to `themes/package.json` |
| T2      | `inert` accessibility fix        | Replace `aria-hidden` with `inert` on closed console sidebar + mobile nav drawer         |
| T3      | Color contrast                   | Audit badge token pair after T1; fix light theme if still failing                        |
| T4      | Render-blocking CSS              | Inline spinner CSS; apply preload / deferral strategy to main CSS                        |
| T5      | Minify + source maps + unused JS | CSS minification, source map decision, unused-JS profiling                               |

---

## Files Created / Modified per Tranche

### T1 — Theme MIME fix

| Action | Path                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| Modify | `apps/landing/src/landing.css` — add `.css` to all 10 `@import '@cascivo/themes/*'` lines                           |
| Modify | `packages/themes/package.json` — add `"./light.css"`, `"./dark.css"`, etc. alongside existing extensionless entries |

### T2 — `inert` accessibility fix

| Action | Path                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------- |
| Modify | `apps/landing/src/demo/RelayConsole.tsx` — replace `aria-hidden` prop with `inert` on `#console-sidebar` |
| Modify | `apps/landing/src/sections/Header.tsx` — replace `aria-hidden` prop with `inert` on `#mobile-nav-drawer` |

### T3 — Color contrast

| Action               | Path                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Investigate          | `packages/themes/src/light.css` — `--cascivo-color-success-subtle`, `--cascivo-color-success-content`, `--cascivo-color-text-subtle`, `--cascivo-color-bg-subtle` |
| Modify (conditional) | `packages/themes/src/light.css` — only if contrast still fails after T1                                                                                           |
| Modify (conditional) | `packages/components/src/badge/badge.module.css` — only if token approach can't achieve 4.5:1                                                                     |

### T4 — Render-blocking CSS

| Action               | Path                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Modify               | `apps/landing/index.html` — inline `spinner-BN0steAw.css` content; remove external `<link>`  |
| Investigate          | `apps/landing/vite.config.ts` — determine if `index-SawEnPAu.css` can be preloaded or split  |
| Modify (conditional) | `apps/landing/vite.config.ts` — add `build.cssCodeSplit` or manual chunk config if warranted |

### T5 — Minify + source maps + unused JS

| Action               | Path                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| Investigate          | `apps/landing/vite.config.ts` — `build.cssMinify` setting                         |
| Modify (conditional) | `apps/landing/vite.config.ts` — enable CSS minification                           |
| Decide + document    | Source maps strategy (public `build.sourcemap` vs. private upload)                |
| Investigate          | Bundle composition of `index-BMCbo8TB.js` — check for further split opportunities |

---

## Key Decisions

### Decision 1 — Use `inert` not `tabindex="-1"` cascade

`aria-hidden="true"` hides from the a11y tree but leaves focusable descendants in the tab order. The correct fix is `inert`, which suppresses both a11y visibility and focus/interaction for the entire subtree. `tabindex="-1"` on each child is fragile (misses dynamically added children). `inert` is supported in all target browsers (Chrome 102+, Firefox 112+, Safari 15.5+). No polyfill needed.

JSX usage: `inert={condition}` renders as the `inert` boolean attribute when `condition` is truthy. React 19 accepts `inert` natively; React 18 passes through unknown boolean attributes. Both work.

### Decision 2 — Dual exports in themes package

Add `"./light.css": "./src/light.css"` entries **alongside** the existing `"./light": "./src/light.css"` entries. Do not remove the extensionless form — other importers (CSS `@import` in non-Vite contexts, some bundlers) may use it. The dual-entry approach is additive and safe.

### Decision 3 — Color contrast is gated on T1 deploy

The badge color-contrast failure may be entirely caused by the MIME bug: if theme tokens are undefined (because theme CSS never applies), the badge background resolves to `transparent` or to an unintended fallback, making text invisible or low-contrast. Run Lighthouse after T1 is deployed before touching any token values. If contrast passes: T3 is a no-op commit confirming the fix. If it still fails: audit the specific token pair.

### Decision 4 — Spinner CSS: inline, not defer

`spinner-BN0steAw.css` is 858 bytes. The spinner is used in the landing page (Suspense fallbacks). Inlining eliminates the HTTP round-trip entirely and guarantees no FOUC on Suspense boundaries. The `media="print" onload` trick adds JS complexity for 858 bytes. Copy the spinner CSS content into a `<style>` block in `index.html`, remove the external `<link>`.

### Decision 5 — `index-SawEnPAu.css` strategy for T4

This is the main CSS bundle (~16KB). Deferring it entirely risks FOUC for critical above-fold components. The recommended approach:

1. Add `<link rel="preload" as="style">` for this file to trigger parallel download with JS.
2. Check if Vite's `build.cssCodeSplit` can separate per-chunk CSS so only the home-route chunk's CSS is render-critical.
3. If neither achieves a material LCP improvement, accept the current score (93 desktop) as good enough and do not risk FOUC.

Full critical CSS extraction (inline above-fold CSS + defer rest) is out of scope for v35 — it requires a browser-based extraction pass that is not available in the current deploy pipeline (no Playwright at build time; see vite.config.ts comment).

### Decision 6 — Source maps: document + defer

`build.sourcemap: true` doubles the `.js` asset size (~175KB → ~350KB transfer for the same file). Public source maps also expose your full source. The correct approach is source-map upload to an error monitoring service (Sentry, Datadog, etc.). For T5, document this tradeoff in a code comment; do not enable public source maps unless the team has a monitoring pipeline wired up. The `valid-source-maps` audit is diagnostic-only — it does not affect the best-practices category score directly in the current Lighthouse version.

---

## Cross-Tranche Rules

1. `pnpm ready` must pass after each tranche before committing.
2. No behaviour changes to any component, layout, app, or generated artifact beyond the specific files listed per tranche.
3. Drift gate: `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` must stay green.
4. `pnpm breakpoint:check` must pass.
5. T3 work is conditional on Lighthouse results after T1. Do not edit theme token values speculatively.
6. The `media="print" onload` trick on `landing.css` is intentional (non-blocking progressive enhancement). The Lighthouse "unused CSS" diagnostic for this file is a known false positive — do not "fix" it by changing the load strategy.

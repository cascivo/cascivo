# v25 — Landing Polish & README Automation — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five broken landing surfaces, redesign three weak marketing sections, correct two navigation dead-ends, and enhance the README auto-generation script with consistent cross-site header/footer links.

**Architecture:** All changes are in `apps/landing/src` (React/signals, CSS modules, lazy routes) and `scripts/readme/generate.ts` (Node.js script). No library package changes. The landing uses `useSignal`/`useSignalEffect` from `@cascivo/core` for all state and animation; no `useState`/`useEffect`. `virtual:bench` (Vite plugin in `apps/landing/vite.config.ts`) supplies benchmark data; if `apps/bench/results/results.json` is absent, sections now show explicit fallback UI instead of returning `null`.

**Tech Stack:** `@cascivo/core` (useSignal, useSignals, useSignalEffect, useComputed), `@cascivo/components/*` (existing components only), `@cascivo/charts` (BarChart with tooltip), `@cascivo/render` (CascadeView), React 18 (Suspense, lazy), Vite + vite+, CSS custom properties, `scripts/readme/generate.ts` (Node.js + `fs`).

---

## Tranche Overview

| Tranche | Title                          | Goal                                                                                    |
| ------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| T1      | Fix broken rendering           | Restore RelayConsole, re-render counter, BarChart tooltip, A11y table, Performance page |
| T2      | Agent Layer narrative redesign | Rewrite AgentLayer as 4-step sequential workflow                                        |
| T3      | ThemeDemo animation            | Single-card cycler with CSS cross-fade and dot navigation                               |
| T4      | ExamplesGallery carousel       | Screenshot carousel with auto-advance and description                                   |
| T5      | QuickStart + nav link fixes    | Add prebuilt option; fix Components + Storybook hrefs                                   |
| T6      | README generator enhancement   | Link bar header + full footer; audit readme.body.md files                               |

---

## Files Created / Modified per Tranche

### T1 — Fix broken rendering

| Action | Path                                                  |
| ------ | ----------------------------------------------------- |
| Modify | `apps/landing/src/demo/RelayConsole.tsx`              |
| Modify | `apps/landing/src/sections/SignalsDemo.tsx`           |
| Modify | `apps/landing/src/sections/ProofTeasers.tsx`          |
| Modify | `apps/landing/src/pages/accessibility/A11yMatrix.tsx` |
| Modify | `apps/landing/src/pages/PerformancePage.tsx`          |

### T2 — Agent Layer narrative redesign

| Action | Path                                       |
| ------ | ------------------------------------------ |
| Modify | `apps/landing/src/sections/AgentLayer.tsx` |
| Modify | `apps/landing/src/landing.css`             |

### T3 — ThemeDemo animation

| Action | Path                                      |
| ------ | ----------------------------------------- |
| Modify | `apps/landing/src/sections/ThemeDemo.tsx` |
| Modify | `apps/landing/src/landing.css`            |

### T4 — ExamplesGallery carousel

| Action | Path                                            |
| ------ | ----------------------------------------------- |
| Modify | `apps/landing/src/sections/ExamplesGallery.tsx` |
| Modify | `apps/landing/src/landing.css`                  |

### T5 — QuickStart + nav link fixes

| Action | Path                                       |
| ------ | ------------------------------------------ |
| Modify | `apps/landing/src/sections/QuickStart.tsx` |
| Modify | `apps/landing/src/sections/Header.tsx`     |
| Modify | `apps/landing/src/sections/Footer.tsx`     |

### T6 — README generator enhancement

| Action       | Path                                                            |
| ------------ | --------------------------------------------------------------- |
| Modify       | `scripts/readme/generate.ts`                                    |
| Audit/create | `readme.body.md` for all packages and apps that are missing one |

---

## Dependency Graph

```
T1 (fix broken) ─────────────────────────────────────────────► T6 (gate)
T2 (agent layer) ────────────────────────────────────────────► T6
T3 (theme demo) ─────────────────────────────────────────────► T6
T4 (examples gallery) ───────────────────────────────────────► T6
T5 (quickstart + nav) ───────────────────────────────────────► T6
```

T1–T5 are independent and can execute in any order or in parallel. T6 runs last and includes
the final gate check across all changes.

---

## Root Cause Summary (T1)

| Surface                  | Most Likely Cause                                           | Fix                                                                      |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| RelayConsole blank       | Icon import name mismatch — `@cascivo/icons` export renamed | Audit exports; update import names                                       |
| Re-render counter        | Counter signal update races React StrictMode double-invoke  | Wrap `queueMicrotask` emit in `if` guard; verify both counters increment |
| ProofTeasers tooltip     | `plain` prop passed to `BarChart` strips interactivity      | Remove `plain`                                                           |
| A11y table blank         | `A11Y_ROWS` empty OR `rows.value` not subscribed            | Add `EmptyState` fallback; verify signal subscription                    |
| Performance charts blank | `results.json` keys absent → all sections return `null`     | Add explicit fallback UI per section                                     |

---

## Conventions to follow in every tranche

1. **Signals over hooks.** `useSignal`, `useComputed`, `useSignalEffect` only. No `useState`,
   `useEffect`, `useContext`, `useReducer`.
2. **`useSignals()` first line** in every React component that reads `.value` during render.
3. **Token-only CSS.** No hardcoded colour hex or raw pixel sizes. Use `var(--cascivo-*)`.
4. **Mobile-first.** Base styles for 320 px; enhancements at `min-width: 30rem / 40rem / 64rem`.
   `pnpm breakpoint:check` must exit 0.
5. **No hardcoded English strings in TSX** — however, the landing is exempt from the i18n catalog
   requirement (it uses plain string literals, not `t()` keys from `@cascivo/i18n`). Match the
   existing landing convention.
6. **Commit after each tranche.** Gate commands must all exit 0 before the commit.

---

## Gate Commands (run before each commit)

```sh
pnpm exec vp check           # fmt + lint + tsc
pnpm build                   # build all packages
pnpm exec vp run -r check    # type-check all packages
pnpm test                    # unit + smoke tests
pnpm regen && pnpm exec vp check --fix && git diff --exit-code
pnpm breakpoint:check
```

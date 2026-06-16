# v30 — Landing Page Performance Sprint — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five structural performance problems in the cascivo landing page.
Target metrics (measured after T6):

| Metric                                | Target  |
| ------------------------------------- | ------- |
| Lighthouse Performance (home, mobile) | ≥ 95    |
| LCP (4G mobile, cold cache)           | < 1.5 s |
| Home initial JS (gzipped)             | < 80 KB |
| `registry.json` in JS bundle          | 0 bytes |
| CLS                                   | < 0.05  |

**Architecture:** All changes are confined to `apps/landing/`. One new dev dependency is added (`vite-imagetools`). No changes to any `@cascivo/*` published package.

**Tech Stack:** Vite + Rolldown, `vite-imagetools`, `React.lazy()` + `<Suspense>`, Vite `define`, Lighthouse CI (`@lhci/cli`).

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                                      |
| ------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| T1      | Registry bundle fix                | Remove 619 KB `registry.json` from JS bundle via Vite `define`; update Hero and StatsBand |
| T2      | Below-fold code splitting          | Lazy-load all below-fold home sections; separate JS chunks downloaded after first paint   |
| T3      | Image optimization                 | `vite-imagetools`; WebP/AVIF srcset; explicit dimensions; loading=lazy throughout         |
| T4      | Critical CSS inline                | Extract above-the-fold styles into index.html; async-load full landing.css                |
| T5      | SearchDialog lazy + resource hints | Lazy-load SearchDialog; add preload/dns-prefetch hints                                    |
| T6      | Gate                               | Bundle analysis + Lighthouse CI baseline vs. target                                       |

---

## Files Created / Modified per Tranche

### T1 — Registry bundle fix

| Action | Path                                      |
| ------ | ----------------------------------------- |
| Modify | `apps/landing/vite.config.ts`             |
| Create | `apps/landing/src/globals.d.ts`           |
| Modify | `apps/landing/src/sections/Hero.tsx`      |
| Modify | `apps/landing/src/sections/StatsBand.tsx` |
| Modify | `apps/landing/tsconfig.json`              |

### T2 — Below-fold code splitting

| Action | Path                       |
| ------ | -------------------------- |
| Modify | `apps/landing/src/App.tsx` |

### T3 — Image optimization

| Action | Path                                            |
| ------ | ----------------------------------------------- |
| Modify | `apps/landing/package.json`                     |
| Modify | `apps/landing/vite.config.ts`                   |
| Modify | `apps/landing/src/sections/ExamplesGallery.tsx` |
| Modify | `apps/landing/src/pages/ExamplesPage.tsx`       |
| Modify | `apps/landing/src/pages/ExampleDetailPage.tsx`  |

### T4 — Critical CSS inline

| Action | Path                           |
| ------ | ------------------------------ |
| Modify | `apps/landing/index.html`      |
| Modify | `apps/landing/src/main.tsx`    |
| Modify | `apps/landing/src/landing.css` |
| Modify | `apps/landing/vite.config.ts`  |

### T5 — SearchDialog lazy + resource hints

| Action | Path                       |
| ------ | -------------------------- |
| Modify | `apps/landing/src/App.tsx` |
| Modify | `apps/landing/index.html`  |

### T6 — Gate

| Action | Path                             |
| ------ | -------------------------------- |
| Create | `apps/landing/lighthouserc.json` |

---

## Key Decisions

### Vite `define` for build-time constants

Vite's `define` option replaces string tokens at bundle time (similar to `#define` in C). Values are JSON-serialized, so only primitives work. The existing `componentCount()` and `themeCount()` helper functions in `vite.config.ts` already compute the right numbers at build time for HTML injection — the same values are now also exposed to TypeScript source files via `define`.

```ts
// vite.config.ts — add inside defineConfig():
define: {
  __CASCIVO_COMPONENT_COUNT__: componentCount(),
  __CASCIVO_THEME_COUNT__: themeCount(),
},
```

A new `apps/landing/src/globals.d.ts` file declares these as ambient constants so TypeScript accepts them:

```ts
declare const __CASCIVO_COMPONENT_COUNT__: number
declare const __CASCIVO_THEME_COUNT__: number
```

The `tsconfig.json` `include` array already covers `src`, so the file is picked up automatically.

### Lazy loading tiers

**Tier 1 — eager (above the fold):** `Header`, `Hero`, `Principles`, `TechDeepDive` (teaser), `StatsBand`. Visible on first load on any screen size. Stay as direct imports.

**Tier 2 — lazy (below the fold):** `RelayConsole` (already lazy), `SignalsDemo`, `ProofTeasers`, `AgentLayer`, `ThemeDemo`, `ChartShowcase` (already lazy), `ExamplesGallery`, `Ecosystem`, `QuickStart`, `CtaBand`, `Footer`. All converted to `React.lazy()` with `<Suspense fallback={<SectionFallback />}>`.

Each `SectionFallback` must specify `min-block-size` matching the section's approximate height (use dev tools to measure) so the page does not collapse and cause CLS while the chunks load. The existing `SectionFallback` component accepts a `tall` prop — where that is insufficient, add a `height` prop.

### Critical CSS extraction

The inline critical CSS must include:

1. All `:root` and `[data-theme]` custom property blocks (tokens — without these, all CSS custom properties resolve to empty).
2. All `*` and `body` reset rules.
3. `.skip-nav` and `.skip-nav-target` styles.
4. `.header`, `.nav`, and related layout selectors.
5. `.hero`, `.hero-title`, `.hero-sub`, `.hero-chips`, `.hero-ctas` styles.

Everything else remains in `landing.css`. The extracted styles are moved out of `landing.css` into the inline `<style>` block — they must not remain in both files or they load twice.

The async CSS loading pattern:

```html
<!-- in index.html <head> -->
<link rel="stylesheet" href="/src/landing.css" media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href="/src/landing.css" /></noscript>
```

`import './landing.css'` must be removed from `main.tsx` when switching to the HTML link tag. Vite processes the CSS through the HTML link tag at build time the same way it processes the `import` — the resulting bundle behavior is identical.

### SearchDialog lazy loading

The `hasOpenedSearch` signal is a new `boolean` signal initialized to `false`. The effect that currently always renders `<SearchDialog>` is gated:

```tsx
const hasOpenedSearch = useSignal(false)

useSignalEffect(() => {
  if (searchOpen.value) hasOpenedSearch.value = true
})

// In JSX:
{hasOpenedSearch.value && (
  <Suspense fallback={null}>
    <SearchDialog open={searchOpen.value} onClose={...} onNavigate={...} />
  </Suspense>
)}
```

Once `hasOpenedSearch` is `true`, the SearchDialog stays mounted (it manages its own open/close animation) so subsequent opens don't trigger a new load.

---

## Cross-Tranche Rules

1. No `useState`, `useEffect`, `useContext`, `useReducer`, or `useLayoutEffect` introduced.
2. `pnpm exec vp run @cascivo/landing#build` must exit 0 after T1, T2, T3, T4, T5.
3. `pnpm exec vp run @cascivo/landing#check` must exit 0 after T1 (adds globals.d.ts).
4. `pnpm breakpoint:check` must exit 0 at T6.
5. `pnpm test` must pass across the monorepo at T6.
6. No section removed — all existing page content preserved.
7. All `React.lazy()` splits must have a `<Suspense>` boundary with a height-reserving fallback.

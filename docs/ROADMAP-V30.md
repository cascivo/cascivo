# cascivo — Roadmap v30: Landing Page Performance Sprint

**Last updated:** 2026-06-16
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-16-v30-master-plan.md` + tranches 1–6

---

## Vision

v29 gave developers a layout in 30 seconds. v30 makes the page that sells it load in under 1.5 seconds.

The cascivo landing page is the public face of a design system whose core thesis is performance. Today it ships with a 619 KB JSON file bundled into every user's initial JS, twelve home sections loaded eagerly before first paint, and no image optimization beyond a single `loading="lazy"` attribute. None of these are architectural inevitabilities — they are fixable problems with known solutions, and v30 fixes them.

After v30:

- The LCP element paints in under 1.5 s on a 4G mobile connection.
- The home route initial JS is under 80 KB gzipped.
- All below-fold sections are code-split into separate chunks loaded after first paint.
- Screenshots and raster images are served as WebP/AVIF with `srcset` and explicit dimensions.
- Hero and header styles are inlined; the full 3,191-line CSS loads asynchronously.
- `SearchDialog` is only downloaded the first time the user opens it.
- Lighthouse Performance ≥ 95 on the homepage.

---

## Astro — the honest assessment

Before this plan was written, Astro (https://astro.build/) was studied as a potential replacement architecture. The verdict:

**Astro would give structural performance gains that Vite SPA optimization cannot fully replicate.** An Astro page ships zero JS by default; only interactive "islands" load their bundle. For a landing page whose hero, features, principles, and footer are purely static content, Astro's architecture directly eliminates the React bootstrap cost for those sections — no amount of Vite tuning can close that gap. Lighthouse 100 is a realistic Astro target; 95 is the ceiling for a well-optimized Vite React SPA.

**Why v30 does not migrate to Astro:**

1. The whole landing is built around `@preact/signals-react`, which patches React's reconciler. How this patch survives Astro island hydration boundaries is undocumented — it requires a spike before any migration decision.
2. The landing has 10+ interactive sections (SignalsDemo, AgentLayer, ThemeDemo, SearchDialog, ThemeToggle, Charts). In Astro each would become an isolated island; the theme signal that currently propagates across all of them would need a shared store (nanostores or Preact signals atoms) to replace direct `signal.value` reads across the React tree.
3. The page has a custom SPA router with client-side navigation and View Transitions. Replacing that with Astro's `<ClientRouter />` is non-trivial and has different semantics.
4. The gains from fixing the structural issues identified below put v30 well into the 90–95 Lighthouse range — within 5 points of what Astro would offer, at a fraction of the migration risk and effort.

**If the T6 gate in this plan shows Lighthouse < 95 after all tranches, an Astro migration is the correct next step.** The measurement gate will give us an honest answer.

---

## What changes

### Problem 1 — 619 KB JSON bundled into JS

`Hero.tsx` and `StatsBand.tsx` both `import registry from '../../../../registry.json'` to read `components.length`. Vite bundles the entire 619 KB file into the module graph just to get one integer at runtime.

The `injectCounts()` Vite plugin in `vite.config.ts` already computes `componentCount()` and `themeCount()` at build time to inject into HTML. The same numbers are now injected into JS source files via Vite's `define` option as build-time constants `__CASCIVO_COMPONENT_COUNT__` and `__CASCIVO_THEME_COUNT__`. Both source files remove the JSON import and read the constant instead.

Expected impact: removes 619 KB from the module graph entirely.

### Problem 2 — Twelve below-fold sections in the initial bundle

The home page imports sixteen sections at the top of `App.tsx`. Only `ChartShowcase` and `RelayConsole` are behind `React.lazy()`. The remaining fourteen — including heavy interactive sections like `SignalsDemo`, `AgentLayer`, and `ThemeDemo` — are parsed and evaluated before React renders the first pixel.

The fix converts all below-fold sections to `React.lazy()` imports. Sections above the fold (`Hero`, `Principles`, `TechDeepDive` teaser, `StatsBand`) stay as direct imports. Everything else becomes a separate chunk downloaded after first paint, with a `<Suspense fallback={<SectionFallback />}>` boundary that holds vertical space to prevent CLS while the chunk loads.

Expected impact: home initial JS chunk drops significantly; LCP is no longer blocked by below-fold section parsing.

### Problem 3 — No image optimization

Screenshots served to `ExamplesGallery`, `ExamplesPage`, and `ExampleDetailPage` are PNG files with no WebP/AVIF variants, no responsive `srcset`, and no explicit `width`/`height` attributes. The single `loading="lazy"` in `ExamplesGallery` is the only image optimization in the entire app.

The fix installs `vite-imagetools` as a dev dependency and converts the screenshot `<img>` elements to use `srcset` with WebP and AVIF sources, explicit dimensions, and `loading="lazy"` where missing. The Vite plugin processes images at build time with no runtime cost.

Expected impact: image bytes on the wire drop substantially for mobile users; CLS from unsized images eliminated.

### Problem 4 — Full CSS file blocks paint

`landing.css` (3,191 lines) is loaded synchronously via `import './landing.css'` in `main.tsx`. Browsers must fully download and parse it before painting anything. The vast majority of those lines style sections that are nowhere near the viewport on load.

The fix extracts the above-the-fold styles (CSS custom property declarations, header, hero, skip-nav, body reset) into an inline `<style>` block in `index.html`. The full `landing.css` is loaded asynchronously via the `media="print"` swap technique so it does not block rendering. The `import './landing.css'` in `main.tsx` is removed to avoid a double load.

Expected impact: browser paints header and hero without waiting for a full CSS download; FCP improves directly.

### Problem 5 — SearchDialog in the initial bundle

`SearchDialog` from `@cascivo/search` is imported unconditionally in `App.tsx` and rendered on every route regardless of whether the user has ever opened search. It and its search index dependencies are in the initial JS chunk.

The fix lazy-loads SearchDialog: the chunk is only downloaded the first time `searchOpen.value` becomes `true`. A `hasOpenedSearch` signal gates whether the `<Suspense>` boundary renders at all. Once loaded, the dialog stays mounted.

Expected impact: `@cascivo/search` and its dependencies removed from the initial chunk.

---

## Astro note (v31 candidate)

If the T6 gate shows Lighthouse < 95 after all five optimization tranches, the next planning session should be an Astro migration spike. The right evaluation order:

1. Spike `@preact/signals-react` compat with `@astrojs/react` island hydration in a throwaway branch.
2. If signals survive hydration: prototype the home page with Hero + Footer as `.astro` components and Header + SearchDialog as React islands.
3. If signals do not survive: prototype replacing cross-island state with nanostores, keeping all component interactivity as `@preact/signals-react` within each island.
4. Measure the prototype's Lighthouse score before committing to a full migration.

---

## Cross-cutting rules

1. No `useState`, `useEffect`, `useContext`, `useReducer`, or `useLayoutEffect` introduced by this work.
2. Every `React.lazy()` split must have a `<SectionFallback>` placeholder with `min-block-size` matching the section's approximate rendered height to prevent CLS.
3. Build must pass after each tranche: `pnpm exec vp run @cascivo/landing#build`.
4. Type-check must pass: `pnpm exec vp run @cascivo/landing#check`.
5. `pnpm breakpoint:check` must exit 0.
6. `pnpm test` must pass across the monorepo.
7. No section removed — only lazy-loaded. All existing page content is preserved.

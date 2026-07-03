# cascivo — Roadmap v35: Landing Page Lighthouse Fixes

**Last updated:** 2026-06-17
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-17-v35-master-plan.md` + tranches 1–5

---

## Vision

Two Lighthouse runs captured on 2026-06-17 (`tmp/cascivo.com-20260617T191812.json` desktop, `tmp/cascivo.com-20260617T191902.json` mobile) reveal a cluster of fixable issues holding cascivo.com below 100 in all four audit categories. The most critical is a **build-time bug**: all ten theme CSS files are served with a `text/html` MIME type because Vite outputs them at extensionless paths (`/assets/@cascivo/themes/light`) that Cloudflare Pages' SPA fallback catches before they can be fetched as stylesheets.

v35 works through every failing audit systematically — MIME fix first (it unblocks everything downstream), then the two accessibility gaps, then performance. No component behaviour changes; all work is confined to `apps/landing`, `packages/themes/package.json`, and build configuration.

---

## Baseline Scores (2026-06-17)

| Category       | Desktop | Mobile | Target |
| -------------- | ------- | ------ | ------ |
| Performance    | 93      | 84     | 95+    |
| Accessibility  | 94      | 97     | 100    |
| Best Practices | 96      | 96     | 100    |
| SEO            | 100     | 100    | 100    |

---

## Issues Inventory

### Best Practices (96 → 100)

| Audit                                        | Score | Desktop | Mobile | Root Cause                                                           |
| -------------------------------------------- | ----- | ------- | ------ | -------------------------------------------------------------------- |
| Browser console errors (`errors-in-console`) | 0     | ✓       | ✓      | 10 theme CSS files served as `text/html` — extensionless asset paths |
| Missing source maps (`valid-source-maps`)    | 0     | ✓       | ✓      | `index-BMCbo8TB.js` has no `.map` file                               |

### Accessibility (94/97 → 100)

| Audit                                          | Score | Desktop | Mobile | Root Cause                                                                                                                       |
| ---------------------------------------------- | ----- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `[aria-hidden="true"]` with focusable children | 0     | ✓       | ✓      | `#console-sidebar` in `RelayConsole.tsx:137`; `aria-hidden` on closed console sidebar which contains interactive `SideNav` links |
| `[aria-hidden="true"]` with focusable children | 0     | —       | ✓      | `#mobile-nav-drawer` in `Header.tsx:267`; `aria-hidden` on closed mobile drawer which contains `<a>` links                       |
| Color contrast (`color-contrast`)              | 0     | ✓       | —      | `span._badge_4ffzi_2` in the Deploys table; badge text/bg token pair insufficient in light theme                                 |

### Performance (93/84 → 95+)

| Audit                    | Score   | Desktop | Mobile | Root Cause                                                                                                                                                                                                                    |
| ------------------------ | ------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render-blocking requests | 0       | ✓       | ✓      | `index-SawEnPAu.css` (16KB, 233ms/782ms); `spinner-BN0steAw.css` (858B, 73ms/182ms) injected as blocking `<link>`                                                                                                             |
| Unused CSS               | 0 / 0.5 | ✓       | ✓      | `landing-C4hGJ04s.css` 100% wasted on desktop — likely cascades from the MIME bug (theme tokens undefined → all theme-dependent styles unused); also a known Lighthouse false-positive with `media="print"` non-blocking load |
| Unused JavaScript        | 0       | ✓       | ✓      | `index-BMCbo8TB.js` 20.7 KB wasted (11.8%)                                                                                                                                                                                    |
| Unminified CSS           | 0.5     | ✓       | ✓      | `landing-C4hGJ04s.css` 2.4 KB saveable (22%)                                                                                                                                                                                  |
| First Contentful Paint   | 0.42    | —       | ✓      | 3.23s mobile — render-blocking CSS blocks first paint                                                                                                                                                                         |
| Largest Contentful Paint | 0.64    | —       | ✓      | 3.48s mobile — same root cause                                                                                                                                                                                                |

---

## Root Cause Deep-Dive: Theme MIME Bug (T1)

`apps/landing/src/landing.css` imports all ten themes without a `.css` extension:

```css
@import '@cascivo/themes/light';
@import '@cascivo/themes/dark';
/* … 8 more … */
```

`packages/themes/package.json` exports these with extensionless specifiers (`"./light": "./src/light.css"`). Vite resolves each to the correct source file at build time, but outputs the built asset using the import path as the key — no `.css` suffix. Result: Cloudflare Pages receives a request for `/assets/@cascivo/themes/light`, finds no matching static file, and serves the SPA `index.html` fallback with `Content-Type: text/html`. The browser refuses to apply it (`strict MIME checking`). All ten themes fail this way; tokens are therefore undefined for the entire session.

**Fix:** Add `.css` to all ten `@import` statements in `landing.css`, and add dual export entries (`"./light.css"` alongside `"./light"`) in `packages/themes/package.json` so both specifier forms work.

---

## Root Cause: `aria-hidden` on Interactive Children (T2)

`aria-hidden="true"` hides an element from the accessibility tree but does **not** remove its descendants from the tab order. Screen readers therefore encounter focusable links inside supposedly hidden regions.

- **Console sidebar** (`RelayConsole.tsx:137`): `aria-hidden={!sidebarOpen.value ? true : undefined}` — when `sidebarOpen = false` the sidebar is `aria-hidden` but its `<SideNav>` links remain tabbable.
- **Mobile nav drawer** (`Header.tsx:267`): `aria-hidden={!isNavOpen.value}` — when `isNavOpen = false` the drawer is `aria-hidden` but its `<a>` links remain tabbable.

**Fix:** Replace `aria-hidden` with the HTML `inert` attribute. `inert` both removes from the a11y tree **and** prevents focus/interaction on all descendants. Supported in all modern browsers (Chrome 102+, Firefox 112+, Safari 15.5+).

---

## Workstreams

| #   | Workstream                           | Tranche | Summary                                                                                                      |
| --- | ------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| A   | Theme MIME fix                       | T1      | Add `.css` to `landing.css` imports; add dual exports to `themes/package.json`                               |
| B   | `inert` accessibility fix            | T2      | Replace `aria-hidden` with `inert` on closed console sidebar + mobile nav drawer                             |
| C   | Color contrast fix                   | T3      | Audit badge token pair; fix light theme or badge defaults; re-verify after T1 (MIME fix may resolve)         |
| D   | Render-blocking CSS                  | T4      | Inline `spinner.css` (858 B); apply non-blocking load to main CSS; add `<link rel="preload">` for key assets |
| E   | CSS minify + source maps + unused JS | T5      | Enable CSS minification for landing bundle; add source maps; profile unused-JS opportunity                   |

---

## Key Open Decisions

1. **`inert` vs `tabindex="-1"` fallback** — Modern browsers support `inert` natively. No polyfill needed for the target browser matrix (last 2 Chrome/Firefox/Safari). Use `inert` directly.
2. **Color contrast after T1** — The badge contrast failure may be purely a token-resolution artifact (tokens undefined → transparent background → bad contrast). Re-run Lighthouse after T1 before changing badge token values. Only touch token values if the issue persists.
3. **`spinner-BN0steAw.css` strategy** — 858 bytes is small enough to inline into `<head>`. The alternative is the `media="print" onload` trick. Inline is cleaner and eliminates the HTTP round-trip entirely. Recommendation: inline.
4. **`index-SawEnPAu.css` strategy** — This is the main CSS bundle (16KB). Deferring it risks FOUC. Options: (a) inline critical above-fold CSS + defer rest, (b) `rel="preload"` to overlap with JS parsing, (c) accept it as necessary render-blocking (it's already a good score on desktop). Recommendation for T4: add `rel="preload"` and investigate whether it can be split; defer full critical-CSS extraction if the LCP gain is marginal after T1+T2.
5. **Source maps in production** — `build.sourcemap: true` doubles asset sizes slightly. Prefer source-map upload to a monitoring service (e.g. Sentry) rather than public source maps. For T5, document the tradeoff; only enable if no performance regression.

---

## Cross-cutting Rules

1. No behaviour changes to any component, layout, or app logic.
2. Every tranche must pass `pnpm ready` before committing.
3. The drift gate (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) must stay green.
4. `pnpm breakpoint:check` must pass — no off-scale breakpoint literals introduced.
5. T3 (color contrast) is gated on T1: re-run Lighthouse after T1 deploys before deciding whether T3 needs any token changes.

---

## Definition of Done

### T1 — Theme MIME fix

- [ ] All 10 `@import` statements in `apps/landing/src/landing.css` use `.css` extension.
- [ ] `packages/themes/package.json` exports include dual entries: `"./light.css"` and `"./light"` (etc.) for all ten themes.
- [ ] `pnpm ready` passes.
- [ ] Local preview (`pnpm exec vp run @cascivo/landing#build && pnpm preview`) shows zero browser console errors.

### T2 — `inert` accessibility fix

- [ ] `apps/landing/src/demo/RelayConsole.tsx`: `aria-hidden` on `#console-sidebar` replaced with `inert`.
- [ ] `apps/landing/src/sections/Header.tsx`: `aria-hidden` on `#mobile-nav-drawer` replaced with `inert`.
- [ ] Keyboard navigation: Tab key cannot reach links in a closed sidebar or closed mobile drawer.
- [ ] Screen reader: Closed sidebar / drawer is not announced when navigating.
- [ ] `pnpm ready` passes.

### T3 — Color contrast

- [ ] After T1 deploys: re-run Lighthouse. If `color-contrast` still fails, audit `--cascivo-color-success-subtle` / `--cascivo-color-success-content` and `--cascivo-color-text-subtle` / `--cascivo-color-bg-subtle` ratios in `packages/themes/src/light.css`.
- [ ] All badge variants in light theme meet WCAG 2.1 AA (4.5:1 for small text).
- [ ] `pnpm ready` passes.

### T4 — Render-blocking CSS

- [ ] `spinner-BN0steAw.css` content inlined into `<head>` in `apps/landing/index.html`; chunk removed from build output.
- [ ] `index-SawEnPAu.css` load strategy improved (preload, defer, or split — whichever avoids FOUC and improves LCP score).
- [ ] Mobile LCP ≤ 2.5s and/or LCP score ≥ 0.75 in local Lighthouse run.
- [ ] `pnpm ready` passes.

### T5 — CSS minify + source maps + unused JS

- [ ] `landing-C4hGJ04s.css` wasted bytes reduced (minification enabled for this bundle).
- [ ] Source maps strategy documented (public vs. private upload); decision implemented.
- [ ] Unused JS in `index-BMCbo8TB.js` profiled; any quick splits applied.
- [ ] `pnpm ready` passes.

# cascivo — Roadmap v27: Landing Performance, Navbar Redesign & Search

**Last updated:** 2026-06-16
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-16-v27-master-plan.md` + tranches 1–7

---

## Vision

v26 wired view transitions between pages and patched mobile gaps. v27 is the quality-of-experience
pass: page navigation still causes a full browser reload (the SPA is not acting like an SPA), the
navbar takes too much space while doing too little, and two sections on the accessibility page still
carry the old "Cascade" brand name. A visitor evaluating cascivo as a UI library should feel
_nothing_ when switching between pages — instant, smooth, no white flash — and should be able to
find any component in under two keystrokes.

No new library components. Every change touches `apps/landing` (navbar, routing, new home section,
a11y fixes) and introduces one new package concept (`@cascivo/search`).

> Concept: **"Instant everywhere, findable in two keystrokes."** A first-time visitor clicks the
> Accessibility link in the navbar — the content swaps without a reload, a CMD+K dialog lets them
> find any component instantly, and the navbar stays pinned above the fold at all times.

---

## What changes

### Fix 1 — Navigation: full page reload on every route change

**Root cause:** `App.tsx` reads `window.location.pathname` once on mount. The router is never
wired to `history.pushState` or `popstate`. Every `<a href="/accessibility">` click triggers a
full browser navigation, which re-fetches the HTML, re-downloads the JS bundle (even if cached),
and re-hydrates React from scratch. On a cold cache or slow connection this is a noticeable pause;
even on a warm cache the white flash and re-mount latency makes cascivo's own landing feel slower
than the UI library promises.

**Fix:** Add a client-side router. A `currentPath` signal drives `App`'s route selection. A
document-level `click` interceptor catches same-origin anchor clicks and calls
`history.pushState` instead of letting the browser navigate. A `popstate` listener handles
back/forward. Route transitions call `document.startViewTransition()` so the existing
`@view-transition` CSS continues to work; on browsers without the API it falls back to an instant
swap. Already-loaded lazy chunks are never re-downloaded.

The prerendered HTML files remain unchanged — they bootstrap the first load. SPA mode activates
on hydration.

### Fix 2 — Navbar: sticky, compact, and icon-enriched

The current `ShellHeader` on the landing is not sticky — scrolling down any section hides it
entirely. The theme switcher (`header-themes` dots row) occupies ~64 px of horizontal space in
the right end slot and displays three unlabelled colored circles with no tooltip. The GitHub link
is plain text. Together these consume more space than they deliver.

**Fix:**
- **Sticky:** add `position: sticky; top: 0; z-index: var(--cascivo-z-overlay)` to the landing
  header in `landing.css`. The rest of the page content scrolls under it.
- **Scroll indicator:** a 2 px progress bar directly below the sticky header, driven by a
  `scrollRatio` signal, using `scaleX` (not `width`) so the animation is compositor-friendly.
- **Compact theme switcher:** replace the dots row with a single icon button that cycles through
  the three themes (light → dark → warm). A `Tooltip` shows the current theme name on hover.
  This frees ~52 px in the end slot.
- **GitHub icon:** replace the "GitHub" text link with an SVG icon button (GitHub's mark as
  inline SVG, 20 × 20). Keep the `aria-label`.
- **Nav grouping:** the 7-item flat list becomes: primary links (Components, Examples, Guides)
  visible on desktop; secondary links (Accessibility, Performance) visible on wider viewports or
  inside the mobile drawer; external links (Storybook, GitHub) always visible as icons.

### Fix 3 — Quick search: CMD+K search dialog

A landing for a UI library with no search forces visitors to scan visually. The `@cascivo/search`
package concept solves this for cascivo _and_ for users who adopt cascivo in their own projects.

**Package concept (`@cascivo/search`):**
- `SearchIndex` class: accepts an array of indexable items (`{ id, title, section, content,
  href }`). Builds a client-side trigram index at runtime (no build step). Suitable for
  indexing component registries, MDX pages, or any static JSON dataset.
- `SearchDialog` component: a `Modal`-based CMD+K dialog with an `Input`, a scrollable results
  list, keyboard navigation (↑/↓/Enter), and section grouping. Built with cascivo components
  only — `Modal`, `Input`, `Kbd`, and plain CSS.
- Design goal: a user imports `@cascivo/search`, passes their data, and gets a fully accessible
  search dialog that matches their cascivo theme.

**Landing integration:**
- Index is built at startup from `registry.json` (components) + a static `SEARCH_PAGES` manifest
  (landing page sections: headings, one-line descriptions, `href`).
- CMD+K (and `Ctrl+K`) opens the dialog. A search icon in the navbar is the visible affordance.
- Results show a component icon, name, category, and description. Page-section results show the
  section title and page name. Clicking a result navigates to the destination using the SPA
  router from Fix 1.

### Fix 4 — Home: modern CSS tech deep dive section

The "Modern CSS" mention in the Principles section tells visitors _what_ cascivo uses but not
_why it matters_. Technical evaluators — the primary audience — need to understand the engineering
tradeoff before they can champion adoption internally.

**Fix:** Add a `TechDeepDive` section between `Principles` and `StatsBand` on the home page.
The section has a short prose intro and three comparison blocks:

| Approach | Representative libraries | What cascivo does instead |
|---|---|---|
| Utility classes | Tailwind | CSS custom properties + `@layer` |
| CSS-in-JS | Emotion, styled-components | Zero runtime; static CSS files |
| Class-toggling via JS | shadcn/ui (some patterns) | `:has()`, `@container`, data attributes |

Each block shows a two-panel "them vs us" code snippet. The section links to the v26-era
`docs.cascivo.com/why` deep-dive (once that page exists; falls back to the docs home).

### Fix 5 — A11y page: "Cascade" brand name still appears

`AccessibilityStatement.tsx` contains three instances of "Cascade" (old name):

- Line 90: `"Cascade targets WCAG 2.2 AA at the component level."`
- Line 92: `"Cascade at 2.2 AA exceeds all three normative thresholds."`
- Line 100: table header `<th scope="col">Cascade</th>`

`AxeComparison.tsx` line 54 uses `"Cascivo"` (capital-C) at sentence start; the brand spec
(BRAND.md) requires lowercase `cascivo` always.

All four occurrences change to `cascivo`.

### Fix 6 — A11y page: table pagination

The "Every entry documents its contract" `DataTable` (in `A11yMatrix.tsx`) renders all registry
entries in one scrollable block. With 20+ components in registry.json the table requires
significant vertical scrolling. The `DataTable` component already supports pagination via a
`pagination` prop (`{ pageSize, pageSizeOptions }`).

**Fix:** Pass `pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}` to the `DataTable`
in `A11yMatrix`. Default to 10 rows per page. When the category filter changes, the page resets
to 1 (DataTable already handles this: it resets on `rows` change).

---

## Why these changes and not others

- **SPA routing is the highest-leverage fix.** Perceived performance is the first impression;
  every other polish change is invisible if the page reload is the user's dominant experience.
- **Navbar real estate matters more on mobile.** The colored dots take a full row on narrow
  viewports. A compact cycle button and icon-only GitHub link recover that space for content.
- **Search is a credibility signal.** A UI library's own landing without a search function
  undermines "AI-first" and "developer-experience" claims. CMD+K is the expected affordance.
- **Tech deep dive targets the decision maker.** The current home page convinces with marketing
  claims. The technical section converts the senior engineer who needs to justify the choice.
- **Brand accuracy is non-negotiable.** Stale brand names erode trust faster than missing
  features. Two pages in the accessibility section still say "Cascade."
- **Pagination reduces scroll fatigue.** Showing 10 rows by default is the DataTable's intended
  contract; not using pagination contradicts the library's own UX guidance.

---

## Workstreams

| #   | Workstream                              | Tranche | Summary                                                                        |
| --- | --------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| A   | SPA client-side router                  | T1      | Intercept clicks; pushState; popstate; view transitions                        |
| B   | Sticky navbar + scroll indicator        | T2      | Sticky CSS; progress bar signal; GitHub icon                                   |
| C   | Compact theme switcher                  | T3      | Cycle icon button replaces dots; Tooltip label                                 |
| D   | Quick search: package design + landing  | T4      | SearchIndex + SearchDialog; index registry.json; CMD+K in navbar               |
| E   | Modern CSS tech deep dive               | T5      | New TechDeepDive section on home page; three comparison blocks                 |
| F   | A11y brand fix + table pagination       | T6      | Replace "Cascade" × 4; add pagination to A11yMatrix DataTable                 |
| G   | Gate                                    | T7      | Full CI gate across all changes                                                |

---

## Decisions baked in

1. **SPA router is signal-driven.** `currentPath` is a Preact signal. `App` reads it with
   `useSignals()`. No `useState`, no `useContext`, no `useReducer`.
2. **View transitions use `document.startViewTransition()`.** The JS API is used for in-page
   navigation (client-side pushState). The CSS `@view-transition { navigation: auto }` from v26
   handles first-load cross-document fades; after hydration the JS API takes over.
3. **`@cascivo/search` ships source only in this version.** No new npm package is published now;
   the source lives in `packages/search/` and the landing imports it via workspace alias. A
   future version publishes it.
4. **Search index is runtime-built, not Pagefind.** Pagefind requires a post-build crawl and a
   separate CDN-hosted index. For a project without a CI-hosted search index, a trigram index
   over the component registry (< 5 KB of data) built at startup is simpler and equally fast.
   Pagefind integration is deferred to when the docs site is indexed.
5. **Theme cycle order: light → dark → warm → light.** The compact switcher cycles in this order;
   the current theme name appears as a `Tooltip`.
6. **Nav link grouping uses CSS `@container` visibility.** Primary vs secondary link visibility
   on desktop is controlled by `@container (inline-size >= 60rem)` on the nav element, not JS.
7. **`TechDeepDive` code snippets are static strings.** No live code runner; a two-column
   code-block layout with CSS syntax highlighting (plain `<pre><code>` with a CSS class).
8. **All changes are in `apps/landing` or `packages/search` (new).** No changes to published
   library packages (`packages/components`, `packages/core`, etc.).

---

## Definition of Done

### SPA router (T1)

- [ ] Clicking `/accessibility`, `/performance`, `/guides`, `/examples` in the navbar never
      triggers a full browser navigation (network tab shows no document reload). _Verify: T1._
- [ ] Back and forward buttons work correctly. _Verify: T1._
- [ ] `document.startViewTransition` is called on each client-side navigation in supporting
      browsers; fallback instant swap in others. _Verify: T1._
- [ ] Direct URL access (`/accessibility` typed into the address bar) still works via prerender.
      _Verify: T1._
- [ ] `pnpm exec vp check` exits 0. _Verify: T1._

### Sticky navbar (T2)

- [ ] Header is visible and stays above the fold while scrolling through any page. _Verify: T2._
- [ ] Scroll progress bar fills from left to right as the user scrolls; resets on route change.
      _Verify: T2._
- [ ] GitHub link shows the GitHub SVG icon (not text). `aria-label="GitHub"`. _Verify: T2._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T2._

### Compact theme switcher (T3)

- [ ] A single icon button in the navbar right slot cycles light → dark → warm → light on click.
      _Verify: T3._
- [ ] A `Tooltip` shows the active theme name on hover. _Verify: T3._
- [ ] The three-dot row is removed. `header-themes` CSS class is gone. _Verify: T3._
- [ ] `pnpm exec vp check` exits 0. _Verify: T3._

### Quick search (T4)

- [ ] CMD+K (Mac) and Ctrl+K (Win/Linux) open a search dialog. _Verify: T4._
- [ ] Typing a component name (e.g., "button") surfaces matching registry entries. _Verify: T4._
- [ ] Typing a section keyword (e.g., "quick start") surfaces page-section matches. _Verify: T4._
- [ ] ↑/↓ navigate results; Enter navigates to the selected result. _Verify: T4._
- [ ] Escape closes the dialog. _Verify: T4._
- [ ] A search icon button is visible in the navbar (between nav links and GitHub icon). _Verify: T4._
- [ ] `pnpm exec vp check` exits 0. _Verify: T4._

### Tech deep dive (T5)

- [ ] A `TechDeepDive` section is visible on the home page between `Principles` and `StatsBand`.
      _Verify: T5._
- [ ] Three comparison blocks render with "them vs us" code pairs. _Verify: T5._
- [ ] Section passes mobile-overflow at 320 px. _Verify: T5._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T5._

### A11y page fixes (T6)

- [ ] `AccessibilityStatement.tsx`: all instances of "Cascade" changed to "cascivo". The table
      header reads "cascivo", not "Cascade". _Verify: T6._
- [ ] `AxeComparison.tsx` line 54: "Cascivo" changed to "cascivo". _Verify: T6._
- [ ] `A11yMatrix.tsx` DataTable shows 10 rows per page by default with pagination controls.
      Page resets when the category filter changes. _Verify: T6._
- [ ] `pnpm exec vp check` exits 0. _Verify: T6._

### Gate (T7)

- [ ] `pnpm exec vp check` exits 0.
- [ ] `pnpm build` exits 0.
- [ ] `pnpm exec vp run -r check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` exits 0.
- [ ] `pnpm breakpoint:check` exits 0.

---

## Non-goals (explicitly out of scope)

| Claim                                              | Substance                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **No Pagefind integration**                        | Runtime trigram index over registry.json is sufficient for v27. Pagefind deferred to docs site.     |
| **No nav mega-menu**                               | Secondary links use drawer on mobile and `@container`-driven visibility on desktop. No flyout.       |
| **No theme persistence change**                    | Theme persistence in `localStorage` is unchanged.                                                    |
| **No `@cascivo/search` npm publish**               | Source only, workspace-local. Publish in a future version.                                           |
| **No redesign of non-navbar sections**             | Hero, ProofTeasers, etc. are unchanged. Only the sticky, theme switcher, and search are new.         |
| **No full prerender refactor**                     | Prerendered HTML pages remain. SPA mode activates only after hydration; direct URL access still works. |

---

## Deferred

- **Pagefind integration for docs site.** A post-build static index over `docs.cascivo.com` pages
  would enable full-text search across component docs. Deferred — requires a CI Chromium step to
  crawl the built docs site.
- **Nav mega-menu / dropdown for Components.** As the component count grows, "Components" should
  open a dropdown with category grouping. Deferred to when there are 15+ components.
- **`@cascivo/search` npm publish.** Once the API stabilises on the landing, publish as a
  standalone package.
- **TechDeepDive live code runner.** Replace static code snippets with an interactive editor that
  shows the CSS executing in the browser. Deferred — significant scope increase.

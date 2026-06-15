# cascivo — Roadmap v25: Landing Polish & README Automation

**Last updated:** 2026-06-15
**Status:** 🚧 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-15-v25-master-plan.md` + tranches 1–6

---

## Vision

v24 shipped pixel-faithful example apps. The landing itself has accumulated rendering bugs, weak
sections, and navigational dead-ends. v25 is a focused polish pass: fix what is visibly broken,
redesign the sections that do not make their case clearly, and establish consistent automated
README generation across the monorepo.

No new components, no new pages, no new apps. Every change in v25 touches only the landing
(`apps/landing`) and the README generation script (`scripts/readme/generate.ts`). The example
apps, library packages, and CI pipeline are untouched.

> Concept: **"A landing that works and persuades."** Seven targeted fixes make the front door of
> cascivo honest: broken sections render, marketing sections prove their claims visually, and
> navigation takes visitors where they intend to go.

---

## What changes

### Fix 1 — AppShell / Console section not rendering

The `RelayConsole` component (the live Relay deploy console demo embedded in the landing hero
area) has silently stopped rendering. The most likely cause is an icon import name mismatch:
`@cascivo/icons` exports evolved while `RelayConsole.tsx` retains old names
(`Dashboard`, `Activity`, `AlertTriangle`, `Tag`, `Zap`, `Settings`, `MoreHorizontal`). A failed
named import causes the lazy chunk to throw; the surrounding `<Suspense>` catches it silently,
showing nothing.

Fix: audit all icon imports against the current `@cascivo/icons` export list; rename any
mismatched names; verify the section renders with all nav items and the inner dashboard.

### Fix 2 — "Count the re-renders" counter verification

The `SignalsDemo` section embeds two live forms — signals vs. `useState` — and shows a render
counter for each. The claim is that the `useState` form re-renders the whole component on every
keystroke while the signals form renders once. This is architecturally correct (`StateForm`
owns all three pieces of `useState`, so each keystroke triggers a re-render of `StateForm` and
all its children; `SignalForm` reads no signal `.value` during render, so it commits once). The
plan verifies the counters increment correctly in both dev and production-profile builds and
fixes any tracking gap (the `queueMicrotask` emit mechanism, React Profiler wrapper, StrictMode
double-invoke) that prevents the counters from updating.

### Fix 3 — "Numbers, not adjectives." — no tooltip on chart

`ProofTeasers.tsx` passes `plain` to the `BarChart` component in the Performance proof card.
The `plain` prop strips all interactivity — no hover tooltip, no keyboard navigation. Remove
`plain` so the bar chart behaves like every other chart on the site.

### Fix 4 — Accessibility page: table not rendering

The `A11yMatrix` section on `/accessibility` renders a `DataTable` of keyboard and ARIA metadata
from `registry.json`. If the table is blank or missing, the section shows only the heading and
filter control. The most likely cause: the `SegmentedControl` component used for filtering has
a signal-subscription gap (missing `useSignals()` in a parent) that prevents `rows.value` from
updating, or `A11Y_ROWS` is empty because the registry entries lack `meta.accessibility` blocks.
Fix: verify `A11Y_ROWS` is non-empty, confirm `useSignals()` is present in all required parents,
add a visible "No data" `EmptyState` fallback if the array is genuinely empty.

### Fix 5 — Performance page: charts and content not rendering

The `PerformancePage` at `/performance` uses `bench` from `virtual:bench`, a Vite plugin that
reads `apps/bench/results/results.json`. If the file exists but is missing keys (`bundle`,
`renders`, `latency`, `lighthouse`, `runtime`), every section's guard (`if (!series) return null`)
fires and the page renders only header text with a blank body. Fix: add an explicit fallback UI
for each section ("Benchmark data not yet generated — run `pnpm bench` to populate") so the page
is meaningful to visitors rather than silently empty.

### Fix 6 — "Your agent already knows cascivo" — no clear narrative

The `AgentLayer` section currently presents six disconnected articles in a two-column grid: the
manifest snippet, the MCP connection tabs, a prompt example, a `CascadeView` render demo, the
audit CLI, and the `llms.txt` reference. Nothing labels their order or explains why each exists.

Redesign: four numbered steps that tell a complete workflow story.

1. **Setup** — install the MCP server (one command; three editor tabs)
2. **Discovery** — the agent reads every component's manifest automatically (manifest snippet)
3. **Build** — ask the agent to build something; see the output rendered live via `CascadeView`
4. **Validate** — run `cascivo audit --ai` on what the agent produced

The `llms.txt` reference moves into the Setup step as an alternative for environments that cannot
run an MCP server. The CSS changes from a 2-column article grid to a single-column numbered step
layout, making the flow obvious on both desktop and mobile.

### Fix 7 — "One form, ten personalities" — animate between themes

The `ThemeDemo` section renders all ten `data-theme` variants simultaneously in a CSS grid, which
is visually dense and on mobile produces a very long scroll requiring many card renders. Replace
with a single-card animated cycler: the same `SignupCard` markup inside one `data-theme`
container whose value auto-advances every 1.2 s through all ten themes, with a CSS cross-fade
transition and dot indicators for manual navigation. The single-card approach is dramatically
smaller on mobile (one card instead of ten) while conveying the same proof: same markup,
completely different look.

### Fix 8 — "Drive it, don't read about it." — add screenshots + carousel

The `ExamplesGallery` section shows five text cards with no visual preview. Each `Demo` in
`pages/examples/data.ts` already carries `screenshots.desktopLight` (a `1280×800` path served
from `/screenshots/<slug>/`). Replace the static card grid with a full-width carousel: one demo
at a time, the screenshot displayed prominently above the demo's description and coverage chips,
auto-advancing every 4 s, with dot indicators and manual prev/next affordances.

### Fix 9 — "Up and running in three steps" — add prebuilt option

`QuickStart.tsx` shows only the copy-paste CLI flow (`npx cascivo init` → `add` → `import`). Add
a second pathway below the three-step block: "Or use components directly from npm (no copy
needed)". It shows `npm add @cascivo/react` and a simple `import { Button } from '@cascivo/react'`
example, with a note that you can upgrade to owned code at any time via the CLI.

### Fix 10 — "Components" link → 404

The header link `{ label: 'Components', href: '/docs' }` resolves to the landing SPA which has
no `/docs` route, producing a Not Found render. The docs live at the separate Cloudflare Pages
app `docs.cascivo.com`. Fix: change `href` to `https://docs.cascivo.com`.

### Fix 11 — "Storybook" link → wrong target

Similarly, `{ label: 'Storybook', href: '/storybook' }` does not resolve correctly. Fix: change
to `https://storybook.cascivo.com`. Same fix in `Footer.tsx`.

### Fix 12 — README auto-generation: richer header + footer

`scripts/readme/generate.ts` (run via `pnpm readme:generate`, part of `pnpm regen`) already
generates all READMEs from per-package `readme.body.md` files. Two gaps:

1. **Header links missing.** After the package title and description, there is no navigation
   row linking visitors to cascivo.com, docs.cascivo.com, storybook.cascivo.com, and GitHub.
2. **Footer incomplete.** The current footer links only to `cascivo.com/docs`; it should link
   to all three primary websites.

The fix is surgical: update `buildReadme()` in `generate.ts` to insert a one-line link bar
after the description and update the footer string. All packages and apps get the same header
and footer; per-package content remains in `readme.body.md`.

---

## Why these changes and not others

- **Landing first.** The landing is the primary evaluator touch-point. Broken sections and
  dead links undermine trust faster than missing features.
- **No new pages.** All twelve fixes are to existing surfaces. Adding a "v25 features" page or
  new route would dilute focus.
- **Signals-driven animation, not CSS-only.** `useSignalEffect` + `setInterval` for ThemeDemo
  and ExamplesGallery carousel gives deterministic control (pause/resume, manual override, aria
  state). Pure CSS `animation` cannot be paused by user interaction without JavaScript anyway.
- **Fallback UI over silent null.** Every data-gated section (`BundleSection`, `RendersSection`,
  etc.) currently returns `null` when bench data is absent. Returning a message is more honest
  and helps developers understand what to do.
- **Screenshot carousel uses existing assets.** The `/screenshots/<slug>/` paths are already
  generated by `pnpm gen-demo-screenshots` and served by the landing. No new image pipeline.

---

## Workstreams

| #   | Workstream                                                                                      | Tranche | Summary                                                             |
| --- | ----------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| A   | Fix broken rendering (RelayConsole, re-render counter, BarChart tooltip, A11y table, Perf page) | T1      | Restore all five broken surfaces                                    |
| B   | Agent Layer narrative redesign                                                                  | T2      | Rewrite AgentLayer.tsx as 4-step workflow; update CSS               |
| C   | ThemeDemo animation                                                                             | T3      | Single-card cycler with CSS cross-fade and dot nav                  |
| D   | ExamplesGallery carousel                                                                        | T4      | Full-width screenshot carousel; 4 s auto-advance; dots              |
| E   | QuickStart + nav link fixes                                                                     | T5      | Prebuilt pathway; fix Components + Storybook hrefs in header/footer |
| F   | README generator enhancement                                                                    | T6      | Link bar in header; full footer; audit missing readme.body.md files |

---

## Decisions baked in

1. **All changes are in `apps/landing` or `scripts/readme/generate.ts`.** No library package
   changes, no example app changes, no CI/workflow changes.
2. **Animation: `useSignalEffect` + `setInterval`, not CSS `animation`.** Signals are the project
   idiom; a signal-driven interval is pauseable and testable.
3. **ThemeDemo: single card, all viewports.** The spec says "especially on mobile this takes too
   much space, rendering it just once is sufficient." Single card for desktop and mobile; the
   `theme-demo-grid` CSS class is removed.
4. **ExamplesGallery: uses `screenshots.desktopLight` only.** Dark-mode and mobile screenshots
   are available but the carousel shows one image per slide. Dark-mode toggle is deferred.
5. **"Prebuilt" QuickStart option is additive below the three steps.** The three CLI steps remain
   unchanged; the prebuilt path is presented as an alternative, not a replacement.
6. **README generator is updated in place.** `scripts/readme/generate.ts` grows two helper
   strings (`HEADER_LINKS`, `FOOTER`). The `buildReadme()` function signature is unchanged.
7. **`docs.cascivo.com` and `storybook.cascivo.com` are the canonical external URLs.** These are
   separate Cloudflare Pages apps. The landing must use absolute external hrefs, not `/docs` or
   `/storybook` SPA routes.
8. **No stub bench data committed.** If `apps/bench/results/results.json` is missing, sections
   show a "run `pnpm bench` to populate" fallback — no fabricated numbers.

---

## Definition of Done

### Broken rendering (T1)

- [ ] `RelayConsole` renders on the home page: SideNav visible, nav items clickable, dashboard
      content shown for each nav item. No JS errors in browser console. _Verify: T1._
- [ ] "Count the re-renders" demo: typing in the `useState` form increments the badge counter
      on every keystroke; the signals form badge stays at 1. _Verify: T1._
- [ ] `ProofTeasers` BarChart shows a tooltip on hover/focus. _Verify: T1._
- [ ] `/accessibility` `A11yMatrix` `DataTable` renders rows (or an explicit `EmptyState` if
      `A11Y_ROWS` is genuinely empty). _Verify: T1._
- [ ] `/performance` page shows fallback UI for each chart section when bench data is absent;
      shows charts when `results.json` is populated. _Verify: T1._

### Agent Layer (T2)

- [ ] "Your agent already knows cascivo" section shows four numbered steps (Setup, Discovery,
      Build, Validate) in visual order. _Verify: T2._
- [ ] Each step is self-contained and makes sense without reading the others. _Verify: T2._
- [ ] MCP client tabs (Claude Code / Cursor / VS Code) remain functional. _Verify: T2._
- [ ] `CascadeView` live preview renders in the Build step. _Verify: T2._
- [ ] Section is readable and scannable on mobile (375 px). _Verify: T2._

### ThemeDemo (T3)

- [ ] A single `SignupCard` is shown at a time. The `data-theme` attribute auto-advances through
      all ten themes every 1.2 s with a visible CSS cross-fade. _Verify: T3._
- [ ] Dot indicators below the card show the active theme; clicking a dot pauses auto-advance
      and navigates to that theme. _Verify: T3._
- [ ] Section fits in viewport width at 375 px without horizontal scroll. _Verify: T3._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T3._

### ExamplesGallery (T4)

- [ ] Each of the five demos has a screenshot image rendered above its description. _Verify: T4._
- [ ] The carousel auto-advances every 4 s; dot indicators show the active demo; prev/next
      buttons navigate manually. _Verify: T4._
- [ ] `demo.description` (long form) is shown in the carousel, not `demo.tagline`. _Verify: T4._
- [ ] Image container has a fixed aspect ratio (`16/10`) — no layout shift when slides change.
      _Verify: T4._
- [ ] Section works at 375 px: image visible, text readable, dots tappable. _Verify: T4._

### QuickStart + nav (T5)

- [ ] "Up and running in three steps" section has a second block below the three CLI steps
      showing the prebuilt pathway (`npm add @cascivo/react` + import example). _Verify: T5._
- [ ] Header "Components" link navigates to `https://docs.cascivo.com`. _Verify: T5._
- [ ] Header "Storybook" link navigates to `https://storybook.cascivo.com`. _Verify: T5._
- [ ] Footer "Docs" link navigates to `https://docs.cascivo.com`. _Verify: T5._
- [ ] Footer "Storybook" link navigates to `https://storybook.cascivo.com`. _Verify: T5._

### README generator (T6)

- [ ] Running `pnpm readme:generate` produces READMEs that include a link bar
      (`cascivo.com · docs.cascivo.com · storybook.cascivo.com · GitHub`) after each title.
      _Verify: T6._
- [ ] The footer in every README links to cascivo.com, docs.cascivo.com, storybook.cascivo.com,
      and GitHub. _Verify: T6._
- [ ] All packages and apps under `packages/` and `apps/` have a non-empty `readme.body.md`
      file. _Verify: T6._
- [ ] `pnpm regen && git diff --exit-code` exits 0 after running the generator. _Verify: T6._

### Gate

- [ ] `pnpm exec vp check` exits 0. _Verify: T6 (final gate)._
- [ ] `pnpm build` exits 0. _Verify: T6._
- [ ] `pnpm exec vp run -r check` exits 0. _Verify: T6._
- [ ] `pnpm test` exits 0. _Verify: T6._
- [ ] `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` exits 0. _Verify: T6._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T6._

---

## Non-goals (explicitly out of scope)

| Claim                                          | Substance                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **No new landing sections**                    | All changes fix or replace existing sections.                                                                                   |
| **No new library components**                  | All animation and carousel work uses existing `@cascivo/react` primitives + `useSignal`/`useSignalEffect` from `@cascivo/core`. |
| **No new example apps**                        | The demo data changes only in how the ExamplesGallery carousel renders it.                                                      |
| **No dark-mode carousel**                      | The carousel uses `screenshots.desktopLight` only; dark-mode toggling in the gallery is deferred.                               |
| **No pause-on-hover for ThemeDemo or gallery** | Pause on hover adds event-listener complexity; manual dot navigation satisfies the same need.                                   |
| **No backend**                                 | All data is build-time (bench results, registry.json) or live-in-browser signals.                                               |
| **No npm badges in READMEs**                   | Badge images from shields.io are external resources that may be blocked in some contexts; deferred.                             |

---

## Deferred

- **Dark-mode screenshot toggle in ExamplesGallery** — show `screenshots.desktopDark` based on
  the active landing theme. Deferred because it requires wiring the landing's `theme` signal to
  the gallery screenshot selection.
- **Pause-on-hover for ThemeDemo and ExamplesGallery carousels** — would require `mouseover`
  event listeners in `useSignalEffect`. Deferred to avoid complexity.
- **Full bench run / stub data** — generating a `results.json` with real numbers requires
  Playwright and a throttled CI environment; not a landing fix.
- **Track/Flow/Edge screenshot parity with v24 output** — screenshot files may be stale relative
  to v24 changes; regeneration is a separate `pnpm gen-demo-screenshots` run outside landing scope.

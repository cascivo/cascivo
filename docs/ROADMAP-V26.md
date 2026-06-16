# cascivo — Roadmap v26: Mobile Polish, Cross-App Navigation & Screenshot Pipeline

**Last updated:** 2026-06-16
**Status:** 🚧 In progress
**Plan documents:** `docs/superpowers/plans/2026-06-16-v26-master-plan.md` + tranches 1–6

---

## Vision

v25 restored broken sections and tightened the landing narrative. v26 is the interaction and
navigation quality pass: mobile interaction in the Console section is rough (no burger menu, sidebar
vanishes instead of overlaying), animated sections cause layout shifts, five footer links are dead
or misdirected, and the three cascivo apps (landing, docs, storybook) have no navigational bridges
between them. v26 closes all of these gaps.

No new components. No new example apps. Every change touches existing surfaces in
`apps/landing`, `apps/docs`, `apps/storybook`, or supporting scripts.

> Concept: **"Everything works on mobile, everything connects."** A visitor on a 375 px screen can
> drive the Console demo, follow footer links, and navigate from a docs component page directly into
> its Storybook story without a dead end.

---

## What changes

### Fix 1 — Console section: missing burger menu + mobile sidebar overlay

The `RelayConsole` renders a `SideNav` using `defaultCollapsed`. On mobile the CSS grid collapses
to one column, which removes the sidebar entirely — no way to open it. Two problems:

1. **Burger button missing on left.** The console titlebar has the brand name and a right-side menu
   but no burger/hamburger control on the left to open/close the sidebar.
2. **Sidebar should overlay on mobile.** When open on a small screen, the `SideNav` must render
   as a fixed-position overlay above `console-main`, not push the content aside or disappear.

Fix: add a `sidebarOpen` signal to `RelayConsole`, render a hamburger button as the leftmost item
in the titlebar, and add CSS that on mobile positions the `SideNav` as `position: absolute` over
`console-main` with a semi-transparent scrim behind it. On desktop the existing grid layout is
unchanged.

### Fix 2 — Animated containers: fixed height to prevent layout shift

Sections that switch content with animation — `ExamplesGallery` carousel info block and
`ThemeDemo` — vary in height as the active item changes. This causes everything below the section
to jump up or down with each auto-advance tick.

Fix: assign a fixed `min-block-size` (or explicit `block-size`) to the animated info container
in `ExamplesGallery` and to the card container in `ThemeDemo` so the surrounding layout is
stable regardless of which item is active. Use the tallest variant as the floor.

### Fix 3 — "Numbers, not adjectives.": bar chart left labels clipped

The horizontal `BarChart` in `ProofTeasers.tsx` truncates its left-axis labels (`cascivo`,
`shadcn`, `carbon`) because the chart does not allocate enough space for the y-axis label column.
The labels are cut off at the left edge of the chart container.

Fix: add a `yLabelWidth` (or equivalent) prop to the BarChart usage in `ProofTeasers.tsx` so the
chart reserves sufficient horizontal space for the longest label, or wrap the chart in a container
that allows the SVG to overflow-clip visibly. Check the chart component's prop API for an explicit
label-width control; if none exists, add left padding to the chart container.

### Fix 4 — Page changes need view transitions

Navigating between landing pages (`/`, `/accessibility`, `/performance`, `/guides`, `/examples`)
produces an abrupt hard cut. The View Transitions API (cross-document mode) enables a fade or
slide animation between prerendered HTML pages with a single CSS declaration.

Fix: add `@view-transition { navigation: auto; }` to `landing.css` and a matching
`<meta name="view-transition" content="same-origin">` to `index.html`. The browser will
cross-fade between consecutive page navigations automatically. Add `view-transition-name` to the
`<header>` and `<main>` elements so the shell cross-fades and the page content slides.

### Fix 5 — "Drive it, don't read about it.": automated Playwright screenshot pipeline

`scripts/gen-demo-screenshots.mjs` already supports a `--capture` flag that launches Chromium,
navigates to each demo, and saves a real screenshot. The placeholder wireframes currently
committed are 800×500 PNGs — barely recognisable blocks of colour. Real screenshots are not yet
generated as part of any automated pipeline.

Fix: add a `pnpm screenshots:capture` script that runs the existing `--capture` path and add a
GitHub Actions workflow step (or a CI annotation) that regenerates screenshots on a schedule or
on changes to example apps. The existing `public/screenshots/<slug>/` paths are unchanged; the
script replaces the wireframe PNGs with real 1280×800 and 390×844 captures.

### Fix 6 — "Up and running in three steps": import block too wide

The second prebuilt pathway in `QuickStart.tsx` renders a `CopyCommand` with a two-line import
string (`import { Button } from '@cascivo/react'\nimport '@cascivo/themes/light.css'`). The
`CopyCommand` component expands to its content width, which exceeds the `max-inline-size` of the
surrounding `.quickstart-prebuilt-steps` container on narrow viewports.

Fix: add `max-inline-size: 100%` and `overflow-x: auto` to `.quickstart-prebuilt-steps > div`
so the command block never forces horizontal scroll on the page.

### Fix 7 — Footer links: five broken or misdirected targets

The footer `COLUMNS` array references five targets that are either unreachable from the landing
SPA, missing from the public directory, or not yet implemented:

| Link          | Current href                                  | Problem                                         | Fix                                                                         |
| ------------- | --------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| Why cascivo   | `/why`                                        | No `/why` route in landing SPA — shows NotFound | Change to `https://docs.cascivo.com/why`                                    |
| Methodology   | `${REPO}/blob/main/apps/bench/METHODOLOGY.md` | File exists on GitHub; correct as external link | Verify link works; add `target="_blank"` if missing                         |
| llms.txt      | `/llms.txt`                                   | File not in `apps/landing/public/` — 404        | Generate and commit `apps/landing/public/llms.txt`                          |
| registry.json | `/registry.json`                              | Not copied into `apps/landing/public/` — 404    | Add a build step that copies root `registry.json` to `apps/landing/public/` |
| MCP           | `${REPO}/tree/main/packages/mcp`              | External GitHub link; correct                   | Verify it resolves; no change needed if it does                             |

The `Methodology` link is technically correct (the file exists at that path on GitHub) but the
`Footer.tsx` comment says these external links open in the same tab — add `rel="noopener noreferrer"` and `target="_blank"` consistently via `isExternal`.

### Fix 8 — Storybook: add a welcome / introduction page

Storybook currently opens directly to the first story. New visitors have no orientation: no link
to the landing page, no pointer to the docs, no explanation of what the design system is.

Fix: add `apps/storybook/stories/Introduction.mdx` that renders as the top-level "Introduction"
entry in the Storybook sidebar. The page has the cascivo logotype, a one-paragraph description,
and three links: cascivo.com (landing), docs.cascivo.com (docs), and a "Get started" block showing
`npx @cascivo/cli init`.

### Fix 9 — Docs: dark theme by default

The docs app (`apps/docs`) initialises its `persistedSignal` with `'light'` as the default:
`persistedSignal<Theme>(STORAGE_KEY, 'light')`. First-time visitors see the light theme. The
docs are a developer-facing reference — dark is the natural default for most developers and
matches the cascade design system's own visual character.

Fix: change the default to `'dark'` in `apps/docs/src/theme.ts`. Returning visitors retain
their stored preference via `localStorage`; only new visitors (no stored value) see dark by
default.

### Fix 10 — Docs: link to corresponding Storybook story on each component page

Every component page at `docs.cascivo.com/components/<name>` has a preview and props table but
no pointer to Storybook. A developer who wants to explore variants interactively has to open
Storybook separately and search.

Fix: derive the canonical Storybook story URL from the component's registry metadata and render
a "View in Storybook →" link on `ComponentPage.tsx`. The URL pattern:

```
https://storybook.cascivo.com/?path=/story/{category}-{name.toLowerCase()}--primary
```

Example: `/components/button` → `?path=/story/inputs-button--primary`.

Prerequisite: every component story file must export a `Primary` story as its canonical default.
Any story files that lack a `Primary` export receive one (forwarding to the existing canonical
variant or defining a minimal default).

---

## Why these changes and not others

- **Mobile first this time.** The Console demo is the landing's centrepiece. A broken burger menu
  and disappearing sidebar make it look unfinished on the device most evaluators use first.
- **Layout stability matters for credibility.** Sections that jump when auto-advancing undermine
  the claim that cascade produces polished UIs.
- **Dead footer links destroy trust.** A visitor who clicks "Why cascivo" and hits a 404 bounces.
  Five dead links in one section is a reliability signal failure.
- **Navigation between apps.** Landing → docs → storybook is the natural evaluator journey.
  Without a "View in Storybook" link on each component page and a welcome page in storybook,
  that journey requires too much manual searching.
- **Real screenshots.** The placeholder wireframes in `ExamplesGallery` are visually distinct from
  real dashboards; they signal the screenshots section is unfinished.

---

## Workstreams

| #   | Workstream                                                   | Tranche | Summary                                                                     |
| --- | ------------------------------------------------------------ | ------- | --------------------------------------------------------------------------- |
| A   | Console mobile: burger menu + sidebar overlay                | T1      | Add hamburger button; position SideNav as overlay on mobile                 |
| B   | Layout stability: fixed heights, bar chart, QuickStart width | T2      | Three CSS/layout fixes in one pass                                          |
| C   | View transitions                                             | T3      | Cross-document CSS transitions; `view-transition-name` on shell             |
| D   | Footer fixes + static files                                  | T4      | Fix /why, verify Methodology/MCP, generate llms.txt, copy registry.json     |
| E   | Screenshot pipeline                                          | T5      | Real Playwright captures; CI/build integration                              |
| F   | Storybook welcome + docs links + dark theme + gate           | T6      | Introduction.mdx; Storybook links in ComponentPage; docs dark default; gate |

---

## Decisions baked in

1. **All changes are in `apps/landing`, `apps/docs`, `apps/storybook`, or `scripts/`.** No
   library package changes.
2. **Console mobile sidebar: CSS absolute positioning, not a new component.** The `SideNav`
   already handles collapse; the mobile overlay is a CSS class toggle on its wrapper.
3. **View transitions: CSS cross-document mode only.** `@view-transition { navigation: auto }`
   requires no JavaScript and no router change. JS-level `startViewTransition` is reserved for
   within-page transitions (theme change), not cross-page.
4. **`llms.txt` format follows the llmstxt.org spec.** It lists cascivo's primary resources
   (landing, docs, storybook, registry.json, GitHub) in the standard machine-readable format.
5. **`registry.json` in public: copy at build time.** The root `registry.json` is the source of
   truth. A `prebuild` or Vite plugin step copies it to `apps/landing/public/registry.json`.
6. **Storybook URL pattern: `{category}-{name.toLowerCase()}--primary`.** Every component story
   MUST export `Primary` as its canonical default. Missing exports are added in T6.
7. **Docs dark default applies only to new sessions.** Existing users with a stored preference
   are unaffected; `persistedSignal` reads from `localStorage` first.
8. **Screenshots pipeline: new `pnpm screenshots:capture` script.** The existing
   `node scripts/gen-demo-screenshots.mjs --capture` is the mechanism; the new script is a
   convenience alias and the CI job wraps it.

---

## Definition of Done

### Console mobile (T1)

- [ ] Console titlebar has a hamburger button on the left at all viewport widths below 48 rem.
      Clicking it opens/closes the sidebar overlay. _Verify: T1._
- [ ] On mobile (375 px), the SideNav slides in over `console-main` with a scrim behind it.
      On desktop (≥48 rem) the grid layout is unchanged. _Verify: T1._
- [ ] Keyboard: Escape closes the sidebar. _Verify: T1._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T1._

### Layout stability (T2)

- [ ] `ExamplesGallery` carousel info block has a stable height across all five demos — no
      vertical shift when auto-advancing. _Verify: T2._
- [ ] `ThemeDemo` card container has a stable height across all ten themes. _Verify: T2._
- [ ] "Numbers, not adjectives." BarChart displays full left labels (cascivo, shadcn, carbon)
      without truncation at any viewport ≥320 px. _Verify: T2._
- [ ] QuickStart import block does not overflow the page width at 320 px. _Verify: T2._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T2._

### View transitions (T3)

- [ ] Navigating from `/` to `/accessibility` (and back) shows a cross-fade in Chrome 111+.
      No visible transition in browsers that do not support the API — no error, just a hard cut.
      _Verify: T3._
- [ ] `@view-transition { navigation: auto }` is in `landing.css`. _Verify: T3._
- [ ] `<meta name="view-transition">` is in the built `index.html`. _Verify: T3._
- [ ] `pnpm exec vp check` exits 0 after adding the meta tag. _Verify: T3._

### Footer fixes (T4)

- [ ] "Why cascivo" footer link navigates to `https://docs.cascivo.com/why` (external, new tab).
      _Verify: T4._
- [ ] "Methodology" footer link opens the GitHub METHODOLOGY.md file in a new tab without 404.
      _Verify: T4._
- [ ] `/llms.txt` in the landing returns a valid llmstxt.org-format file. _Verify: T4._
- [ ] `/registry.json` in the landing returns the full registry JSON. _Verify: T4._
- [ ] "MCP" footer link opens the GitHub packages/mcp directory without 404. _Verify: T4._

### Screenshots pipeline (T5)

- [ ] `pnpm screenshots:capture` script exists and, when run with Chromium installed, produces
      real 1280×800 and 390×844 PNGs in `apps/landing/public/screenshots/<slug>/`. _Verify: T5._
- [ ] Existing placeholder generation path (`node scripts/gen-demo-screenshots.mjs`) still works
      for environments without Chromium. _Verify: T5._
- [ ] A GitHub Actions workflow or Makefile target exists to invoke screenshot capture on a
      schedule or on demo-app changes. _Verify: T5._

### Storybook + docs (T6)

- [ ] Storybook shows an "Introduction" entry at the top of the sidebar. The page contains the
      cascivo name, a short description, and links to cascivo.com and docs.cascivo.com. _Verify: T6._
- [ ] Every component page in docs has a "View in Storybook →" link below the preview section.
      The link navigates to the correct story. _Verify: T6._
- [ ] Clicking the Storybook link from `/components/button` opens
      `storybook.cascivo.com/?path=/story/inputs-button--primary`. _Verify: T6._
- [ ] Every component story file exports a `Primary` named story. _Verify: T6._
- [ ] First-time docs visitor (no localStorage) sees the dark theme. _Verify: T6._

### Gate

- [ ] `pnpm exec vp check` exits 0. _Verify: T6._
- [ ] `pnpm build` exits 0. _Verify: T6._
- [ ] `pnpm exec vp run -r check` exits 0. _Verify: T6._
- [ ] `pnpm test` exits 0. _Verify: T6._
- [ ] `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` exits 0. _Verify: T6._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T6._

---

## Non-goals (explicitly out of scope)

| Claim                                          | Substance                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **No new components**                          | All animation and overlay work uses existing `SideNav`, CSS positioning, and landing CSS classes.       |
| **No router change**                           | Navigation remains anchor-based; view transitions use the CSS cross-document API.                       |
| **No dark-mode screenshot variant in gallery** | Gallery uses `desktopLight` only; dark-mode toggle is deferred.                                         |
| **No i18n for llms.txt**                       | The file is machine-readable; English only is the spec convention.                                      |
| **No storybook autodocs**                      | The Storybook link points to `/story/…--primary`, not `/docs/…`. Autodocs setup is deferred.            |
| **No design-system changes to SideNav**        | Mobile overlay behaviour is implemented via landing CSS scoping, not a change to `@cascivo/components`. |

---

## Deferred

- **Console mobile: SideNav mobile-overlay mode in `@cascivo/components`.** The current fix
  scopes position overrides to `.console-frame .side-nav`. Promoting this to a first-class
  `overlay` variant in the component is a library change deferred to a future version.
- **Screenshot CI on PR.** Generating screenshots on every PR requires a Chromium runner with
  enough memory. Scheduled nightly or on-demand is safer for now.
- **Docs `/why` page.** The "Why cascivo" docs page is the correct long-form target for that
  footer link; if `docs.cascivo.com/why` does not yet exist, the footer link points to the docs
  home for now.
- **Storybook autodocs.** Enabling autodocs across the storybook and linking to the `/docs/…`
  path from the component page is a more complete integration deferred to v27.

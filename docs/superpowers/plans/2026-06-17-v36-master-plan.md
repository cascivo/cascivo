# v36 — Minimal Landing: Progressive-Disclosure Home Redesign — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overloaded ~14-section landing home page with a minimal, Linear/shadcn/Apple-class
home: one clear above-the-fold message, four "why" cards, **one** signature interactive showcase, a
condensed quick-start, and a closing CTA — with all current depth either relocated to a dedicated page
or folded behind a progressive-disclosure control. **Zero content loss**, built entirely with cascivo's
own components. Landing app only — no `@cascivo/*` package, component, token, or theme changes.

Target state (verified after T6):

| Metric                                             | Today          | Target                          |
| -------------------------------------------------- | -------------- | ------------------------------- |
| Home `<main>` sections                             | 14 + footer    | ~6 + footer                     |
| Heavy demo sections on home                        | 5              | 0 standalone (1 tabbed showcase) |
| Top-level nav links                                | 8              | 4 primary + grouped "Resources" |
| Dedicated pages                                    | 9 routes       | 10 routes (+`/ai`)              |
| Relocated sections with a verified destination     | n/a            | 5 / 5                           |
| Content deleted (not relocated)                    | n/a            | 0                               |
| Home initial JS / LCP                              | baseline       | not regressed (ideally better)  |
| Mobile sweep (320/360/390/414) + breakpoint:check  | passing        | passing                         |
| Full CI gate                                       | passing        | passing                         |

**Architecture:** All work is confined to `apps/landing/**`. The home composition lives in
`apps/landing/src/App.tsx` (`HomePage`); sections are `apps/landing/src/sections/*`; dedicated pages are
`apps/landing/src/pages/*`; routing/SEO live in `router.ts`, `route-head.ts`, `seo.ts`; search index in
`search/buildIndex.ts`. The redesign **moves** existing section components into page components and
**consolidates** five demo sections into one `Tabs` container — it does not rewrite the demos
themselves. New UI controls (tabs, collapsibles, grouped nav) are composed from
`@cascivo/components` (`tabs`, `segmented-control`, `collapsible`, `accordion`, `navigation-menu`,
`menu`). No section is removed from `HomePage` until its destination renders it (T1 precedes T2).

**Tech Stack:** React 18 + Preact-compat island in `apps/landing`, `@cascivo/core` signals
(`useSignals` required in any component reading `signal.value` during render), `@cascivo/components`
(copy-in source via workspace alias), vite+ (`vp`) for dev/build/check/test. No new dependencies.

---

## Tranche Overview

| Tranche | Title                          | Goal                                                                                  |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| T1      | Content relocation (zero loss) | Build `/ai`; move 5 sections to `/ai` `/performance` `/examples` + footer; wire routes/nav/SEO/search. Home unchanged. |
| T2      | Minimal home composition       | Rebuild `HomePage` to the ~6-block set; remove relocated imports; fix anchors.        |
| T3      | Hero redesign                  | One-message hero: headline + subhead + 2 CTAs + copy command + one visual.            |
| T4      | Signature showcase             | One `Tabs` showcase replacing the five demo sections; lazy non-default tabs.          |
| T5      | Progressive disclosure         | `Collapsible`/`Accordion` expanders on Principles + Quick Start; nav "Resources" menu. |
| T6      | Responsive + SEO/search + gate | Mobile sweep, prerender titles, OG, redirects, drift + breakpoint + full CI gate.     |

Ordering rationale: **relocate before trimming** (T1 → T2) guarantees no content is lost mid-flight.
Hero (T3), showcase (T4), and disclosure (T5) layer onto the already-minimal shell. T6 reconciles all
cross-cutting concerns (SEO, search, responsive, perf) and runs the gate.

---

## Files Created / Modified per Tranche

### T1 — Content relocation (zero loss)

| Action | Path                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| Create | `apps/landing/src/pages/AiPage.tsx` (hosts relocated `AgentLayer` + supporting copy)  |
| Modify | `apps/landing/src/sections/AgentLayer.tsx` (export reused by `/ai`; keep as section)  |
| Modify | `apps/landing/src/pages/PerformancePage.tsx` (add `SignalsDemo` + `ProofTeasers`)     |
| Modify | `apps/landing/src/pages/ExamplesPage.tsx` (add `ChartShowcase` + relay/examples teasers) |
| Modify | `apps/landing/src/pages/GuidesPage.tsx` (absorb `Ecosystem` content/links)            |
| Modify | `apps/landing/src/App.tsx` (register `/ai` route + lazy import)                        |
| Modify | `apps/landing/src/router.ts` (no change expected; verify pathname handling)           |
| Modify | `apps/landing/src/route-head.ts` (title/desc for `/ai`)                               |
| Modify | `apps/landing/src/seo.ts` (SEO for `/ai`)                                              |
| Modify | `apps/landing/src/search/buildIndex.ts` (index `/ai`; re-point moved-section entries) |
| Modify | sitemap source (wherever routes are enumerated for prerender/sitemap)                 |
| Modify | `apps/landing/src/sections/Footer.tsx` (add secondary-route + ecosystem link column)  |

### T2 — Minimal home composition

| Action | Path                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| Modify | `apps/landing/src/App.tsx` (`HomePage` → trimmed section set; drop relocated lazy imports) |
| Modify | `apps/landing/src/sections/StatsBand.tsx` (condense to a thin proof strip)         |
| Verify | no dead imports / unused lazy chunks; no broken in-page anchors                    |

### T3 — Hero redesign

| Action | Path                                                          |
| ------ | ------------------------------------------------------------- |
| Modify | `apps/landing/src/sections/Hero.tsx` (minimal one-message hero) |
| Modify | `apps/landing/src/landing.css` (hero spacing/typography)       |

### T4 — Signature showcase

| Action | Path                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| Create | `apps/landing/src/sections/Showcase.tsx` (one `Tabs` container; theme/charts/relay tabs) |
| Modify | `apps/landing/src/App.tsx` (`HomePage` renders `Showcase` in place of `ThemeDemo`)     |
| Modify | `apps/landing/src/landing.css` (showcase layout)                                       |

### T5 — Progressive disclosure

| Action | Path                                                                          |
| ------ | ----------------------------------------------------------------------------- |
| Modify | `apps/landing/src/sections/Principles.tsx` (per-card `Collapsible` "Learn more") |
| Modify | `apps/landing/src/sections/QuickStart.tsx` (prebuilt option behind `Collapsible`) |
| Modify | `apps/landing/src/sections/Header.tsx` (slim nav; "Resources" `NavigationMenu`)  |
| Modify | `apps/landing/src/landing.css` (disclosure/nav styles)                          |

### T6 — Responsive + SEO/search + gate

| Action | Path                                                                  |
| ------ | --------------------------------------------------------------------- |
| Verify | `route-head.ts`, `seo.ts`, sitemap, `buildIndex.ts` reflect new IA    |
| Modify | `apps/landing/src/sections/OgCard.tsx` (if home/AI titles changed)    |
| Verify | mobile sweep, `pnpm breakpoint:check`, perf gate, drift gate, tests   |

---

## Key Decisions

### Decision 1 — Showcase anchor demo: `ThemeDemo` (recommended)

The home gets **one** signature interactive moment (Apple/Linear pattern). Of the five demo sections,
`ThemeDemo` ("one form, ten personalities") is the lightest and best embodies "beautiful + themable by
default" in a single screen. It becomes the **default tab** of the new `Showcase`. `ChartShowcase` and
`RelayConsole` become secondary tabs rendered as compact teasers that deep-link to their full versions
on `/examples`. `SignalsDemo` is performance proof, not a home moment — it relocates to `/performance`.
Alternative: anchor on `RelayConsole` (most impressive, heaviest) — rejected for LCP/scroll cost on
first paint.

### Decision 2 — `AgentLayer` → dedicated `/ai` page (recommended)

"AI-first" is one of cascivo's four headline principles; it earns its own URL rather than being buried
in `/guides`. T1 creates `apps/landing/src/pages/AiPage.tsx` that renders the existing `AgentLayer`
section plus surrounding page chrome (hero header, CTA), routed at `/ai`, linked from the `Principles`
"Agent-ready" card and the footer. Alternative (fold into `/guides`) — rejected; weaker discoverability
for a flagship differentiator.

### Decision 3 — `ChartShowcase` → section on `/examples` (recommended)

Charts are examples; a new top-level `/charts` route would re-bloat the nav we are trimming. T1 adds
`ChartShowcase` as a featured section on the existing `ExamplesPage`. The showcase's "Charts" teaser
tab deep-links there. Alternative (`/charts` page) — viable if charts later warrant standalone SEO;
deferred.

### Decision 4 — Progressive-disclosure control: `Collapsible` for per-card, `Accordion` for groups (recommended)

`Collapsible` is the right primitive for an independent "Learn more" expander under each Principles
card and the Quick Start "prebuilt option" (one trigger, one panel, independent state). `Accordion`
(single-open group) is reserved for content that reads as a mutually-exclusive list (e.g. an FAQ); not
needed unless a card group is reframed as Q&A. Both already exist in `@cascivo/components`. Never use
`display:none`-only hiding — the panel content stays in the a11y tree and is keyboard-reachable.

### Decision 5 — Nav grouping: `NavigationMenu` for "Resources" (recommended)

Slim the 8-link nav to 4 primary links (Docs · Examples · Guides · GitHub) + a "Resources"
`NavigationMenu` trigger containing Create · Blocks · Accessibility · Performance · Modern CSS · AI.
`NavigationMenu` ships the correct site-nav a11y semantics (keyboard, `aria` wiring). All grouped
links also appear in the footer so every route stays reachable without the menu. Alternative
(`Menu`/`Dropdown`) — acceptable but `NavigationMenu` is purpose-built for this.

### Decision 6 — Relocate-before-trim sequencing (firm)

T1 moves and verifies every relocated section on its destination page **before** T2 removes it from
`HomePage`. This makes "zero content loss" a mechanical, checkable invariant rather than a hope: at no
commit does a section exist nowhere. The relocation map in `ROADMAP-V36.md` is the checklist.

### Decision 7 — Performance posture (firm)

Trimming the home should *reduce* eager work. Keep the showcase's non-default tabs lazy (`React.lazy` +
`Suspense`, as the home sections are today). The hero LCP element stays eager. T6 verifies home initial
JS and LCP are not regressed against the current baseline via the existing perf gate.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` must pass after each tranche before committing.
2. **No `@cascivo/*` package, component, token, or theme changes.** Only `apps/landing/**` is touched.
3. **Zero content loss:** a section leaves `HomePage` only after its destination renders it (T1 → T2).
   The `ROADMAP-V36.md` relocation map is the gate.
4. **Dogfood:** every new control uses `@cascivo/components` (`tabs`/`segmented-control`,
   `collapsible`/`accordion`, `navigation-menu`/`menu`). No bespoke disclosure/tab widgets.
5. **Landing reactivity:** any component reading `signal.value` during render calls `useSignals()`
   first; DOM side effects use `useSignalEffect`, never `useEffect`/`useState`/`useContext`.
6. **Responsive:** pass the mobile-overflow + touch-target sweep at 320/360/390/414; no off-scale
   breakpoint literals (`pnpm breakpoint:check`); never hide content with `display:none` only — fold it
   into a disclosure that stays keyboard-reachable.
7. **SEO/links integrity:** update `route-head.ts`, `seo.ts`, sitemap, and `search/buildIndex.ts` for
   the new IA; no internal link or in-page anchor 404s; old anchors resolve to relocated content.
8. **Performance:** keep heavy showcase tabs lazy; home initial JS/LCP must not regress (T6 verifies).
9. Keep the drift gate green: after each tranche run
   `pnpm regen && pnpm exec vp check --fix && git diff --exit-code`; commit regenerated artifacts.
10. Preserve existing demo internals — `RelayConsole`, `SignalsDemo`, `ProofTeasers`, `ChartShowcase`,
    `ThemeDemo`, `Ecosystem` move as-is; only their *host* (page vs home) and surrounding chrome change.

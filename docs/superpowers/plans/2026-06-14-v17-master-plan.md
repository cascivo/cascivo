# v17 Master Plan — The Guides Layer (adoption guides on the landing)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-14-v17-tranche-1.md` … `2026-06-14-v17-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans. For section visual quality,
> also use compound-engineering:frontend-design and screenshot-verify at each mobile breakpoint.
>
> **Re-verify each named file/route/count/command at tranche start. If absent or different, STOP and
> re-read the tranche's "Current-state assumptions" before proceeding.**

**Goal:** Execute `docs/ROADMAP-V17.md` — add a new `/guides` view to the landing that answers the two
most common adoption questions ("I use shadcn, how do I switch?" and "how do I brand it?"), frames
real use cases, states honest boundaries, and provides a FAQ. Every answer ends in a concrete next
step. No new product features — only practical advice for what already ships.

**Architecture:** `apps/landing` only. New page + section components in
`apps/landing/src/pages/` (mirroring the `accessibility/` and `performance` pattern), a route in
`apps/landing/src/App.tsx`, a nav link in `apps/landing/src/sections/Header.tsx`, CSS in
`apps/landing/src/landing.css`, and a mobile-spec entry. New claims (31–33) land on
`apps/docs/src/pages/WhyCascadePage.tsx`. No package changes, no registry changes, no new npm deps.

**Tech stack:** unchanged. React 18+ + `@preact/signals-react` (`useSignals()` for signal reads,
`useSignalEffect` for DOM side effects, never `useEffect`/`useState`). Mobile-first CSS.

---

## Research findings (ground truth — verified 2026-06-14)

### Landing-subpage pattern (the template to copy)

`apps/landing/src/App.tsx` registers routes in a `ROUTES` record:

```
'/':              HomePage
'/accessibility': AccessibilityPage
'/performance':   PerformancePage
'/og':            OgCard
```

Each subpage (e.g. `AccessibilityPage.tsx`) is a thin composition:

```tsx
<SkipNavLink />
<Header />
<SkipNavTarget>
  <main>
    <AccessibilityHero />
    <AxeComparison />
    … section components …
  </main>
</SkipNavTarget>
<Footer />
```

Its section components live in a sibling folder (`apps/landing/src/pages/accessibility/`) with a
`data.ts` for static content. **v17 mirrors this exactly:** `GuidesPage.tsx` + `apps/landing/src/pages/guides/`
folder + `guides/data.ts`.

### Header nav

`apps/landing/src/sections/Header.tsx` builds `NAV_LINKS` (array of `{ label, href, active? }`). The
existing pattern for a landing subpage:

```ts
{ label: 'Accessibility', href: '/accessibility', active: path.startsWith('/accessibility') },
{ label: 'Performance',   href: '/performance',   active: path.startsWith('/performance') },
```

Add `{ label: 'Guides', href: '/guides', active: path.startsWith('/guides') }`. The same `NAV_LINKS`
array also drives the mobile nav drawer — adding one entry covers both desktop and mobile nav.

### Existing shadcn references (reuse, don't reinvent)

shadcn/ui currently appears only as a **benchmark competitor**:

- `apps/landing/src/pages/perf-data.ts` — `LIBS = ['cascade', 'shadcn', 'carbon']`; helpers
  `competitorNote()`, perf medians per scenario, bundle gz totals.
- `apps/landing/src/pages/accessibility/data.ts` — `AXE.shadcn.violations` (axe violation counts).
- `apps/landing/src/sections/ProofTeasers.tsx` — bundle-size + axe bars vs shadcn/Carbon.
- `apps/landing/src/pages/PerformancePage.tsx` — full perf comparison (click latency, root commits).

**The migration guide's honest comparison MUST source its numbers from this bench-derived data**, not
hardcode them. If a needed number isn't exposed by the data module, describe it qualitatively or link
to the page that shows it (`/performance`, `/accessibility`) rather than inventing a figure.

### Token / theming ground truth (for the customization guide)

Three-tier token system (from `CLAUDE.md` "Token Architecture"):

```
Primitive:  --cascivo-color-blue-500: #3b82f6
Semantic:   --cascivo-color-accent: var(--cascivo-color-blue-500)   ← themes override here
Component:  --cascivo-button-bg: var(--cascivo-color-accent)         ← users override here for brand
```

Applied via `data-theme="light|dark|warm|…"` on any DOM element (scoped, not global-only). 10 themes
shipped: light, dark, warm, brutalist, corporate, flat, midnight, minimal, pastel, terminal
(`packages/themes/src/*.css`). Skills: `cascivo-create-theme` (skills/) and the MCP `create_theme`
tool (`@cascivo/mcp`). The `cascivo-extend` skill covers customizing components.

### FAQ component ground truth

`Accordion` ships in `packages/components/src/accordion/` (and `tabs/`). Import path to re-verify at
T5: `@cascivo/components/accordion`. Use the shipped component (dogfooding). Confirm its prop API from
its source + `component.meta.ts` before building the FAQ.

### Component / theme counts (for any copy that cites numbers)

- Registry components: **118** (`jq '.components | length' registry.json`) — re-verify at use.
- Themes: **10**. WCAG: **2.2 AA** (v14). Use these, never stale values.

### Landing-page research synthesis (informs IA + copy, not literal text)

From studying current dev-tool / SaaS landing pages and FAQ best practices (2025–2026):

- **Segment by use case with navigation cards / bento grid** — modular scannable blocks suit a product
  with multiple use cases. → drives the use-case scenarios section (T4).
- **Show the product in context** — concrete steps and real code beat abstract claims. → migration +
  customization guides use real, copyable snippets (T2, T3).
- **Collapsible FAQ (tap-to-expand)** is the expected pattern; answers should end with a clear next
  step, not just resolve the question. → FAQ accordion (T5).
- **Conversational, benefit-oriented copy**; repeat low-friction CTAs through the page. → every section
  ends in a CTA/next-step link.
- **Candor builds credibility** — an honest "when not to use" / boundaries section increases trust for
  high-commitment adoption decisions. → "when not to use" section (T4).

---

## Key decisions

1. **Landing-only scope.** All additions are in `apps/landing/src/` (new page + sections + CSS + route +
   nav + mobile spec) and `apps/docs/src/pages/WhyCascadePage.tsx` (claims 31–33). No package, registry,
   or dependency changes.

2. **Route `/guides`, nav label "Guides."** Registered in `App.tsx` `ROUTES`; nav entry added to
   `NAV_LINKS` in `Header.tsx` (covers desktop + mobile drawer). `document.title` = "Guides — cascivo".

3. **Mirror the `AccessibilityPage` template.** `GuidesPage.tsx` composes `SkipNavLink` + `Header` +
   `SkipNavTarget`>`main` + section components + `Footer`. Section components live in
   `apps/landing/src/pages/guides/`; static content in `guides/data.ts`.

4. **Section order on `/guides`:**
   `GuidesHero` → `MigrationGuide` (shadcn) → `BrandCustomization` → `UseCaseScenarios` →
   `WhenNotToUse` → `GuidesFaq` → `GuidesCta`.

5. **Migration numbers are live.** The shadcn comparison imports bench-derived helpers from
   `perf-data.ts` / `accessibility/data.ts`. No hardcoded competitor figures. Qualitative where data is
   absent; link out to `/performance` and `/accessibility` for the full receipts.

6. **Customization guide is real and runnable.** Snippets use actual `--cascivo-*` tokens, a real
   `data-theme` scope example, and the real `cascivo create-theme` skill + MCP `create_theme` tool.
   Three-line button-brand override is the headline example.

7. **FAQ dogfoods `@cascivo/components/accordion`.** ≥6 questions; each answer ends in a next-step link.
   Verify the Accordion prop API from source before building.

8. **"When not to use" states real limits.** Chrome-leading CSS `@function`/`if()` progressive
   enhancement (Safari/Firefox use static fallbacks — not a regression, a forward pilot), alpha `vp`
   tooling, React/Preact-only. Each boundary links to its honest receipt.

9. **Mobile-first + signal rules everywhere.** Base CSS = mobile single column; `min-width` enhances.
   Every new component: `useSignals()` first if it reads signals; `useSignalEffect` for DOM side
   effects; no `useEffect`/`useState`/`useContext`. The page is wired into the mobile overflow harness.

10. **Claims 31–33 land with their sections.** 31 (migration) added in T2; 32 (customization) in T3; 33
    (honest fit) in T4 — each on `WhyCascadePage.tsx` with a receipt linking into the matching `/guides`
    section. Commit per task; full gate runs once at T6.

---

## Tranche map

| T#  | Focus                          | Files changed                                                                                              | Risk   |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------- | ------ |
| T1  | Page scaffold + IA + hero      | New `GuidesPage.tsx`, `guides/GuidesHero.tsx`, `guides/data.ts`, `App.tsx`, `Header.tsx`, `landing.css`, `test/mobile.spec.ts` | Low    |
| T2  | Migration guide (shadcn)       | New `guides/MigrationGuide.tsx`, `guides/data.ts`, `landing.css`; `WhyCascadePage.tsx` (claim 31)          | Medium |
| T3  | Brand customization guide      | New `guides/BrandCustomization.tsx`, `guides/data.ts`, `landing.css`; `WhyCascadePage.tsx` (claim 32)      | Medium |
| T4  | Use cases + when-not-to-use    | New `guides/UseCaseScenarios.tsx`, `guides/WhenNotToUse.tsx`, `guides/data.ts`, `landing.css`; `WhyCascadePage.tsx` (claim 33) | Low    |
| T5  | FAQ accordion                  | New `guides/GuidesFaq.tsx`, `guides/GuidesCta.tsx`, `guides/data.ts`, `landing.css`                        | Medium |
| T6  | Final gate + DoD               | `ROADMAP-V17.md` (DoD checks)                                                                              | Low    |

**Risk notes:**

- **T2 (Medium):** The honest comparison must read live bench data. Re-verify the exact export names in
  `perf-data.ts` / `accessibility/data.ts` (`competitorNote`, `AXE`, `LIBS`) — they may differ. If a
  number isn't exposed, go qualitative + link out; never hardcode a competitor figure.
- **T3 (Medium):** Code snippets must be accurate against real tokens and the real skill/MCP names.
  Verify token names exist (`packages/tokens`) and the skill folder name (`skills/cascivo-create-theme`)
  before writing the prose.
- **T5 (Medium):** Building the FAQ on the shipped `Accordion` requires its real prop API. Read
  `packages/components/src/accordion/` + its `component.meta.ts` first. Confirm the landing already has
  an import alias / dep path that resolves `@cascivo/components/accordion` (other landing pages import
  `@cascivo/components/skip-nav`, so the pattern exists).
- **T1/T4 (Low):** Pure new sections; no changes to existing components beyond the route + nav entry.

# cascivo — Roadmap v17: The Guides Layer

**Last updated:** 2026-06-14
**Status:** ✅ Shipped
**Plan documents:** `docs/superpowers/plans/2026-06-14-v17-master-plan.md` + tranches 1–6

---

## Vision

v16 made the landing a complete, accurate _receipt_ for everything cascivo ships. It tells you **what**
exists and proves the numbers. What it still doesn't do is answer the question a real evaluator asks at
the moment of decision: **"OK — but how does this apply to _me_?"**

A developer landing on cascivo today gets the pitch (hero, principles, proof) and the catalog
(components, charts, ecosystem). What they don't get is the bridge between "this looks good" and "I can
adopt this on Monday." The two most common, most concrete questions have no answer anywhere on the
site:

1. **"I'm already using shadcn/ui — how do I switch, and is it even worth it?"**
2. **"I need this to match my brand — how do I customize it without fighting the system?"**

These aren't pitch questions; they're _adoption_ questions. Today shadcn appears on the landing only as
a benchmark competitor (bundle size, axe violations, click latency in `ProofTeasers`, `AxeComparison`,
`PerformancePage`) — never as a migration path. Theming is described in principle ("`data-theme` +
custom properties") but never as a step-by-step "make it yours" walkthrough. There is no use-case
framing ("when is cascivo the right call?"), no honest "when is it _not_?", and no FAQ.

> Concept: **"The Guides Layer."** A new `/guides` view that turns the accurate receipt into a
> practical adoption path. Migration guidance, brand customization walkthroughs, use-case scenarios, an
> honest "when not to use," and a real FAQ — every answer ending in a concrete next step. No new
> product features; only practical advice for what's already built.

## The diagnosis (question → today → gap v17 closes)

| #   | Adoption question                             | Today                                                    | Gap v17 closes                                                |
| --- | --------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | "Coming from shadcn — how do I switch?"       | shadcn is only a benchmark bar; no migration path exists | Step-by-step migration guide with an honest "is it worth it?" |
| 2   | "How do I make it match my brand?"            | Theming described in principle, never as a walkthrough   | A 3-tier token-override guide + `cascivo create-theme` + MCP  |
| 3   | "Is cascivo the right tool for my situation?" | No use-case framing anywhere                             | Use-case scenario cards mapped to real cascivo strengths      |
| 4   | "When should I _not_ use cascivo?"            | No honest boundaries stated; reads as pure pitch         | A credibility-building "when not to use" section              |
| 5   | "I have a quick question before I commit"     | No FAQ; answers scattered across docs/roadmap            | A collapsible FAQ, each answer ending in a next-step link     |
| 6   | "Where do I even start?"                      | QuickStart exists but isn't framed by intent/persona     | Guides page routes each persona to the right starting point   |

## The pitch additions (extends v16's claims 1–30)

| #   | Claim                                   | Substance                                                                                                                                                                                                                                                  |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 31  | **A real migration path, not a wall**   | A `/guides` migration walkthrough from shadcn/ui: what transfers for free (the copy-own model), what changes (signals + tokens + CSS layers), step by step, with the honest bundle/a11y/perf deltas linked to live benchmark receipts.                     |
| 32  | **Brand it without forking the system** | A token-override walkthrough — primitive → semantic → component — plus `data-theme` scoping, the `cascivo create-theme` skill, and the MCP `create_theme` tool. Customize a button's brand color in three lines; ship a full brand theme in one skill run. |
| 33  | **Honest about fit**                    | Use-case scenarios that say where cascivo wins _and_ a "when not to use" section that says where it doesn't. Credibility through candor, not adjectives.                                                                                                   |

## Workstreams

| #   | Workstream          | Tranche | Summary                                                                                                      |
| --- | ------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| A   | Page scaffold + IA  | T1      | New `GuidesPage` at `/guides`, `Guides` nav link, hero, shared data model, CSS shell, mobile harness wiring. |
| B   | Migration guides    | T2      | "Coming from shadcn/ui?" — mental-model map, step-by-step path, honest comparison with live benchmark links. |
| C   | Brand customization | T3      | "Make it yours" — 3-tier token override walkthrough, `data-theme` scoping, `create-theme` skill + MCP tool.  |
| D   | Use cases + honesty | T4      | Use-case scenario cards (bento grid) + a "when not to use cascivo" section.                                  |
| E   | FAQ                 | T5      | Collapsible FAQ built on the shipped `Accordion`; each answer ends in a concrete next-step link.             |
| F   | Final gate + DoD    | T6      | Full CLAUDE.md gate; Playwright mobile re-verify on the new page; DoD walkthrough; roadmap close.            |

## Decisions baked in

1. **One new page, landing-only scope.** v17 adds a single landing subpage (`/guides`) and its section
   components, a nav link, CSS, and a mobile-spec entry. No package changes, no registry changes, no
   new npm dependencies, no new product features. The page is _advice about what already ships_.
2. **Route is `/guides`; nav label is "Guides."** It sits in the same nav group as `/accessibility` and
   `/performance` (landing subpages). "Guides" is the umbrella because the page spans migration,
   customization, use cases, and FAQ — broader than any single label like "Migrate" or "FAQ."
3. **Mirror the proven landing-subpage pattern.** Follow `AccessibilityPage`/`PerformancePage`
   exactly: a page component in `apps/landing/src/pages/`, a `guides/` folder of section components, a
   `data.ts` for static content, `SkipNavLink`/`SkipNavTarget` + `Header`/`Footer` wrappers.
4. **Migration content is honest, and the numbers are live, not hardcoded.** The shadcn comparison
   reuses the existing bench-derived data (`apps/landing/src/pages/perf-data.ts`,
   `accessibility/data.ts`) so the deltas can never go stale. If a number isn't available from bench
   data, it is described qualitatively, not invented.
5. **FAQ uses the shipped `Accordion` component** (`@cascivo/components/accordion`), dogfooding the
   system. Research is explicit that collapsible FAQs with tap-to-expand are the expected pattern; each
   answer ends in a next-step link (docs route, skill, or another guide section).
6. **"When not to use" is non-negotiable.** A candid boundaries section is what separates a guide from a
   sales page. It states real limits (Chrome-leading CSS `@function` progressive enhancement, alpha
   tooling `vp`, React/Preact focus) and routes each to the honest receipt.
7. **Code samples are real and copyable.** Every snippet (token override, theme scope, migration step)
   is a real, runnable example using actual cascivo tokens/commands — verified against the codebase, not
   illustrative pseudo-code.
8. **Mobile-first on all new CSS.** Base styles = mobile single column; `min-width` queries enhance.
   The new page is added to the Playwright mobile overflow harness at 320/375/390/414.
9. **Signal rules apply to every new React component.** Any component in `apps/landing` that reads
   `signal.value` during render calls `useSignals()` first; DOM side effects use `useSignalEffect`; no
   `useState`, no `useEffect`, no `useContext`.
10. **No new claims beyond 31–33.** Claims are added to the `/why` page (`WhyCascadePage.tsx`) with
    receipts that link into the new `/guides` sections — keeping the pitch page and the guides page in
    sync, as v16 did for 28–30.

## Definition of Done

- [x] A `/guides` route renders a `GuidesPage`; a "Guides" link is in the header nav and active-state
      highlights on `/guides`. _Evidence: T1 — `App.tsx` route `/guides`, `Header.tsx` NAV_LINKS entry
      with `active: path.startsWith('/guides')`; screenshot shows the bold active link._
- [x] A migration guide answers "coming from shadcn/ui?" with a mental-model map (what transfers / what
      changes), a numbered step-by-step path, and an honest comparison whose numbers come from live
      bench data (not hardcoded), linking to `/performance` and `/accessibility`. _Evidence: T2 —
      `MigrationGuide.tsx` reads `bench.bundle.apps` + `AXE`; grep confirms zero hardcoded competitor
      figures; bundle delta renders 69.4 vs 96.4 KB live._
- [x] A brand-customization guide walks primitive → semantic → component token overrides with real
      copyable snippets, shows `data-theme` scoping, and points to the `cascivo create-theme` skill and
      the MCP `create_theme` tool. _Evidence: T3 — `BrandCustomization.tsx`; tokens verified against
      `packages/tokens` + `packages/themes`; escalation links to create-theme skill, create_theme MCP
      tool, and cascivo-extend skill._
- [x] A use-case scenarios section (bento grid) maps ≥4 scenarios to cascivo strengths, and a "when not
      to use cascivo" section states real boundaries, each with a receipt link. _Evidence: T4 —
      `UseCaseScenarios.tsx` (5 scenarios, lead card spans the grid) + `WhenNotToUse.tsx` (4 boundaries,
      muted surface, each with a receipt)._
- [x] A collapsible FAQ built on the shipped `Accordion` answers ≥6 real questions; every answer ends in
      a concrete next-step link. _Evidence: T5 — `GuidesFaq.tsx` renders 8 entries through
      `@cascivo/components/accordion`; each panel ends in a next-step link._
- [x] "Why cascivo" claims 31–33 live on `/why` with receipts linking into the new `/guides` sections.
      _Evidence: T2/T3/T4 — claims 31, 32, 33 added to `WhyCascadePage.tsx` CLAIMS with receipts to
      `/guides#migrate`, `/guides#customize`, `/guides#use-cases`._
- [x] Full CLAUDE.md gate exits 0 (`vp check` → build → `vp run -r check` → test → regen → diff).
      _Evidence: T6 — `vp check` 0 errors; `pnpm build` all packages; `vp run -r check` 0 type errors;
      `pnpm test` 122 passed; regen + `vp check --fix` committed, `git diff --exit-code` clean._
- [x] Playwright mobile at 320/375/390/414 passes (zero overflow) including the full `/guides` page.
      _Evidence: T6 — `mobile.spec.ts` 19 passed, including the four `/guides` overflow widths._
- [x] `ROADMAP-V17.md` DoD boxes all checked; status → ✅ Shipped. _Evidence: T6 — this commit._

## Deferred (do not re-litigate in v17)

- **New component development** — use the dark factory; v17 is landing/guides-only.
- **Automated codemod for shadcn → cascivo migration** — the guide is human-followed prose + snippets;
  a real codemod is a separate, much larger effort. Out of scope.
- **Per-framework migration guides (Vue, Svelte, Angular)** — cascivo is React/Preact; out of scope.
- **Interactive "paste your shadcn component, get the cascivo equivalent" tool** — tempting, but it's a
  product feature, not a guide. Deferred.
- **v11 multi-registry / `cascade.lock` / three-way-merge `update`** — deferred; land when shipped.
- **v12 theme studio** (composable palette × shape × density × type axes) — deferred.
- **Blog, changelog microsite, or CMS layer** — out of scope.

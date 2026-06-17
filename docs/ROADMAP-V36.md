# cascivo — Roadmap v36: Minimal Landing — Progressive-Disclosure Home Redesign

**Last updated:** 2026-06-17
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-17-v36-master-plan.md` + tranches 1–6

> Note: there is no v35 roadmap; this sprint was requested as **v36** directly. The numbering gap is intentional.

---

## Vision

The landing home page (`apps/landing/src/App.tsx` → `HomePage`) has grown to **14 stacked
full-bleed sections plus the footer**. It tries to say everything at once — principles, a modern-CSS
deep dive, stats, a live relay console, a re-render benchmark, proof charts, the AI layer, a theme
playground, a 17-type chart showcase, an examples carousel, the ecosystem map, quick start, and a
closing CTA. The result reads as a brochure, not a product page: visitors scroll, get overwhelmed,
and bounce before reaching the call to action.

v36 rebuilds the home page around the pattern that the best minimal product sites use — **Linear,
shadcn/ui, Apple, Vercel, Stripe**: one clear message above the fold, a small number of focused
"why" moments, **one** signature interactive showcase, and a fast path to "get started." Everything
that exists today is **kept, not deleted** — depth either (a) moves to a dedicated page reachable
from the nav/footer, or (b) collapses behind a progressive-disclosure control (`Collapsible` /
`Accordion`) so the curious can expand it in place without it dominating the first impression.

Cross-cutting constraint: **no content is lost.** Every section currently on the home route has an
explicit destination in the relocation map below, verified to render on its new home before it is
removed from the home composition.

This is a landing-app redesign only — no `@cascivo/*` package, component API, token, or theme
changes. The redesign is built **with cascivo's own components** (continued dogfooding):
`Tabs` / `SegmentedControl` for the consolidated showcase, `Collapsible` / `Accordion` for
expanders, `NavigationMenu` / `Menu` for the slimmed nav.

---

## Current State (what the home page renders today)

`HomePage` in `apps/landing/src/App.tsx` renders, in order:

| #   | Section                 | One-line content                                                 | Weight |
| --- | ----------------------- | ---------------------------------------------------------------- | ------ |
| 1   | `Hero`                  | Headline + `npx cascivo add button` + GitHub CTA                 | eager  |
| 2   | `Principles`            | 4 value cards: Platform CSS · Signals · Owned code · Agent-ready | eager  |
| 3   | `TechDeepDive` (teaser) | `@layer` / `@container` / `:has()` modern-CSS deep dive          | eager  |
| 4   | `StatsBand`             | "By the numbers" metric band                                     | eager  |
| 5   | `RelayConsole`          | Full interactive "real app" demo (incidents/relay dashboard)     | lazy   |
| 6   | `SignalsDemo`           | "Count the re-renders" signal vs React benchmark                 | lazy   |
| 7   | `ProofTeasers`          | "Numbers, not adjectives" — bundle-size chart vs shadcn/Carbon   | lazy   |
| 8   | `AgentLayer`            | "AI-native, not AI-aware" — manifest / MCP / skills story        | lazy   |
| 9   | `ThemeDemo`             | "One form, ten personalities" — live theme switcher              | lazy   |
| 10  | `ChartShowcase`         | "17 chart types. CVD-safe. Keyboard-first."                      | lazy   |
| 11  | `ExamplesGallery`       | "Drive it, don't read about it" — featured-component carousel    | lazy   |
| 12  | `Ecosystem`             | "Everything you need, nothing you don't" — package map           | lazy   |
| 13  | `QuickStart`            | "Up and running in three steps" (+ prebuilt option)              | lazy   |
| 14  | `CtaBand`               | "Own your UI." closing CTA                                       | lazy   |
| —   | `Footer`                | Footer links                                                     | lazy   |

Existing dedicated routes (already built, reachable from nav): `/accessibility`, `/performance`,
`/guides`, `/modern-css`, `/examples` (+ `/examples/:slug`), `/create`, `/blocks` (+ `/blocks/:name`,
`/blocks/preview/:name`), `/og`.

Current nav (`Header.tsx` `NAV_LINKS`, 8 items): Components (docs) · Examples · Create · Blocks ·
Storybook · Accessibility · Performance · Guides.

**Problem:** ~14 viewport-height sections is far past the attention budget of a first visit. Five of
them (`RelayConsole`, `SignalsDemo`, `ProofTeasers`, `AgentLayer`, `ChartShowcase`) are heavy,
self-contained demos that each deserve a focused page, not a scroll-by. The nav is also overloaded
(8 top-level links).

---

## Reference research — what minimal product pages do

Patterns distilled from Linear, shadcn/ui, Apple, Vercel, and Stripe (all cited as the target by the
maintainer), to adapt rather than copy:

| Pattern                              | Seen on             | Adaptation for cascivo                                                                    |
| ------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------- |
| **One message above the fold**       | Linear, Apple       | Hero = headline + one-line subhead + 2 CTAs + copy command + **one** product visual.      |
| **3–6 focused "why" beats**          | Linear, Stripe      | Keep `Principles` (4 cards) as the single "why" block; each card expands for depth.       |
| **One signature interactive moment** | Apple, Linear       | Collapse five demo sections into **one** tabbed showcase container.                       |
| **Thin proof strip, not a wall**     | Vercel, Stripe      | `StatsBand` condensed to a single quiet metric strip; full proof lives on `/performance`. |
| **Generous whitespace, short copy**  | Apple, shadcn       | Cut section count ~14 → ~7; shorten body copy; rely on links for depth.                   |
| **Depth behind nav + footer**        | shadcn, Vercel      | Slim top nav to ~4 primary links; secondary routes grouped in a menu + footer.            |
| **Progressive disclosure**           | Stripe docs, Linear | `Collapsible`/`Accordion` "Learn more" expanders so nothing is deleted, only folded.      |
| **Fast, obvious primary CTA**        | all                 | "Get started" + copy command reachable in the hero and again at the closing band.         |

The redesign **adapts** these — it does not clone any single site. cascivo's differentiators
(CSS-native, signals, owned code, AI-first) stay front and center; the changes are about _editing_
and _sequencing_, not removing the substance.

---

## Target home composition (after v36)

~7 blocks, in order:

| #   | Block                  | Source today                       | Notes                                                    |
| --- | ---------------------- | ---------------------------------- | -------------------------------------------------------- |
| 1   | **Hero** (minimal)     | `Hero` (redesigned)                | Headline + subhead + 2 CTAs + copy command + one visual. |
| 2   | **Proof strip**        | `StatsBand` (condensed)            | Single quiet metric row; links to `/performance`.        |
| 3   | **Why cascivo**        | `Principles` (4 cards + expanders) | Each card `Collapsible`-expands; "deep dive" links out.  |
| 4   | **Signature showcase** | `ThemeDemo` + tabs (consolidated)  | One `Tabs` container; default tab = theme playground.    |
| 5   | **Quick start**        | `QuickStart` (condensed)           | Three steps; "prebuilt option" behind a `Collapsible`.   |
| 6   | **Closing CTA**        | `CtaBand`                          | Unchanged intent; primary CTA + copy command.            |
| —   | **Footer**             | `Footer` (expanded link map)       | Absorbs `Ecosystem` package links as a footer column.    |

---

## Relocation map — every current section has a destination (zero loss)

| Current home section | Disposition                             | New home                                                                  |
| -------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `Hero`               | **Keep** — redesigned (T3)              | home                                                                      |
| `Principles`         | **Keep** — condensed + expanders        | home                                                                      |
| `StatsBand`          | **Keep** — condensed proof strip        | home                                                                      |
| `QuickStart`         | **Keep** — condensed                    | home                                                                      |
| `CtaBand`            | **Keep**                                | home                                                                      |
| `ThemeDemo`          | **Keep** — becomes showcase default tab | home (showcase)                                                           |
| `TechDeepDive`       | **Relocate** — full version exists      | `/modern-css` (existing page); remove home teaser, link from Principles   |
| `SignalsDemo`        | **Relocate**                            | `/performance` (existing page)                                            |
| `ProofTeasers`       | **Relocate**                            | `/performance` (existing page)                                            |
| `ChartShowcase`      | **Relocate**                            | `/examples` (existing page) as a featured section; teaser tab in showcase |
| `RelayConsole`       | **Relocate**                            | `/examples` (existing page) / its example detail; teaser tab in showcase  |
| `AgentLayer`         | **Relocate** — **new page**             | `/ai` (NEW dedicated page)                                                |
| `ExamplesGallery`    | **Relocate** — keep compact teaser      | `/examples` (existing); home links out from showcase                      |
| `Ecosystem`          | **Relocate**                            | `/guides` (existing) **and** Footer link column                           |

No section is deleted. Each relocation is verified to render on its destination page (T1) **before**
it is removed from `HomePage` (T2).

---

## Nav restructure (de-clutter to match a minimal home)

Current 8 top-level links → **4 primary + grouped secondary**:

- **Primary (always visible):** Docs (components) · Examples · Guides · GitHub + ⌘K search + theme.
- **Secondary (grouped under a "Resources" `NavigationMenu`/`Menu`):** Create · Blocks · Accessibility ·
  Performance · Modern CSS · AI.
- All secondary routes also appear in the footer link map (so nothing becomes unreachable).

---

## Workstreams

| #   | Workstream                         | Tranche | Summary                                                                                 |
| --- | ---------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| A   | Content relocation (zero loss)     | T1      | Build `/ai`; move 5 sections to `/ai` `/performance` `/examples`; routes/nav/SEO/search |
| B   | Minimal home composition           | T2      | Rebuild `HomePage` to the ~7-block set; drop relocated imports; keep redirects/anchors  |
| C   | Hero redesign (above the fold)     | T3      | Tighten hero to one message, 2 CTAs, copy command, one visual; Linear/Apple spacing     |
| D   | Signature showcase (consolidation) | T4      | One `Tabs` showcase (theme / charts / relay teasers) replacing five demo sections       |
| E   | Progressive disclosure             | T5      | `Collapsible`/`Accordion` expanders on Principles + Quick Start; nav "Resources" menu   |
| F   | Responsive + SEO/search + gate     | T6      | Mobile sweep, prerender titles, OG, redirects, drift + breakpoint + full CI gate        |

---

## Key open decisions (recommendations in the master plan)

1. **Showcase anchor demo** — which single demo is the default tab? _Recommendation: `ThemeDemo`
   ("one form, ten personalities")_ — lightest, best tells the "beautiful + themable by default"
   story; charts/relay become secondary tabs that link to their full pages.
2. **`AgentLayer` destination** — new `/ai` page vs fold into `/guides`. _Recommendation: dedicated
   `/ai` page_ — "AI-first" is a headline differentiator and deserves its own URL.
3. **`ChartShowcase` destination** — new `/charts` page vs section on `/examples`. _Recommendation:
   section on `/examples`_ — keeps top-level nav lean; charts are examples.
4. **Progressive-disclosure control** — `Collapsible` (single expanders) vs `Accordion` (grouped).
   _Recommendation: `Collapsible` for per-card "Learn more"; `Accordion` only if a card group reads
   as a Q&A list._
5. **Nav grouping mechanism** — `NavigationMenu` vs `Menu`/`Dropdown` for "Resources". _Recommendation:
   `NavigationMenu`_ (built for site nav, keyboard + a11y semantics included).

---

## Cross-cutting rules

1. **No `@cascivo/*` package, component, token, or theme changes.** This sprint touches only
   `apps/landing/**` (sections, pages, router, nav, SEO/route-head, search index, sitemap, CSS).
2. **Zero content loss.** A section may be removed from `HomePage` only after T1 has verified it
   renders on its destination page. The relocation map is the checklist.
3. **Dogfood cascivo components** for every new UI control — `Tabs`/`SegmentedControl`,
   `Collapsible`/`Accordion`, `NavigationMenu`/`Menu`. No bespoke disclosure widgets.
4. **Landing reactivity rules** (CLAUDE.md): any section reading `signal.value` during render calls
   `useSignals()` first; DOM side effects use `useSignalEffect`, never `useEffect`.
5. **Responsive by default.** Pass the mobile-overflow + touch-target sweep at 320/360/390/414; no
   off-scale breakpoint literals (`pnpm breakpoint:check`). Never `display:none` content away —
   relocate to disclosure instead.
6. **Performance budget must not regress.** The home initial JS/LCP should _improve_ (fewer eager
   sections); keep heavy showcase tabs lazy. Verify against the perf gate.
7. **SEO/links integrity.** Update `ROUTE_HEAD`, `seo.ts`, the search index (`buildIndex.ts`),
   sitemap, and any in-page anchor links so relocated content stays discoverable and no internal
   link 404s. Old in-page hash anchors (e.g. links into `#agent-layer`) redirect/resolve to their
   new page.
8. Run `pnpm exec vp check` after each tranche; keep the drift gate green
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`).

---

## Definition of Done

### T1 — Content relocation (zero loss)

- [ ] `/ai` page exists, routed, in `ROUTE_HEAD` + `seo.ts` + search index + sitemap; renders `AgentLayer` content.
- [ ] `SignalsDemo` + `ProofTeasers` render on `/performance`; `ChartShowcase` + (Relay/Examples teasers) on `/examples`.
- [ ] `Ecosystem` content reachable on `/guides` and from the footer link map.
- [ ] Every relocation-map row has a verified destination; `pnpm build` + `pnpm exec vp check` pass. Home unchanged.

### T2 — Minimal home composition

- [ ] `HomePage` renders exactly the target set (Hero, proof strip, Principles, showcase, Quick start, CTA, Footer).
- [ ] All relocated section imports removed from `App.tsx`; no dead imports/lazy chunks.
- [ ] No internal link or anchor 404s; old anchors resolve to relocated content. Tests pass.

### T3 — Hero redesign

- [ ] Hero is one message: headline + one-line subhead + 2 CTAs (Get started / GitHub) + copy command + one visual.
- [ ] LCP element stays eager; above-the-fold has no layout shift; mobile sweep passes at 320–414.

### T4 — Signature showcase

- [ ] A single `Tabs`/`SegmentedControl` showcase replaces the five separate demo sections on home.
- [ ] Default tab = chosen anchor demo; other tabs are teasers that deep-link to `/examples` / `/ai`.
- [ ] Non-default tabs stay lazy; keyboard + a11y (roving tabs, `aria-selected`) verified.

### T5 — Progressive disclosure

- [ ] Each `Principles` card has a `Collapsible` "Learn more" expander linking to its deep-dive page.
- [ ] Quick Start "prebuilt option" lives behind a `Collapsible`; nav secondary links grouped under a `NavigationMenu`.
- [ ] All disclosure content is keyboard-reachable and in the a11y tree (never `display:none`-only).

### T6 — Responsive + SEO/search + gate

- [ ] `ROUTE_HEAD`, `seo.ts`, sitemap, and search index reflect the new IA; OG cards updated where titles changed.
- [ ] Mobile-overflow + touch-target sweep passes (320/360/390/414); `pnpm breakpoint:check` clean.
- [ ] Perf gate shows home JS/LCP not regressed (ideally improved).
- [ ] Full CI gate passes: `pnpm exec vp check`, `pnpm build`, `pnpm exec vp run -r check`, `pnpm test`, drift check, `pnpm breakpoint:check`.

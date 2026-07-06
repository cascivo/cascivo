# cascivo vs shadcn/ui — honest evaluation & implementation spec (2026-07)

**Status:** analysis + plan only — nothing in this document is implemented yet.
**Scope:** landing page (cascivo.com), documentation (docs.cascivo.com + `docs/`), GitHub repo presentation.
**Benchmark:** shadcn/ui as of July 2026 (the most popular UI library; ~118k stars, ~4M+ weekly CLI downloads).
**Method:** four parallel deep audits (landing code, docs surface, repo hygiene, shadcn web research) plus a live run
of `apps/site` with screenshot review at 1440×900 and 390×844, light/dark emulation. Every finding cites a file path.
Findings marked **[verified]** were independently re-checked against source or runtime data.

---

## 1. Executive verdict

cascivo is **technically ahead** of shadcn/ui on the dimensions that matter to its thesis — no Tailwind dependency,
fine-grained signals, three-tier tokens, 12 scoped themes, built-in i18n, zero-dep charts, per-component manifests,
a semantic MCP server, 423 test files, and CI machinery shadcn has nothing comparable to. shadcn's own 2025–26
investment went almost entirely into *distribution plumbing* (registry protocol, CLI v4, MCP, presets, shadcn/create)
while its components remain React-hook Tailwind wrappers over third-party primitives with a structurally broken
upgrade story.

But cascivo currently **loses the first five minutes**, and the first five minutes are where shadcn wins:

1. **The landing page has no interactive moment above the fold.** A static text hero sits over a blurred, `inert`
   wallpaper. shadcn's landing is a full clickable dashboard. The previous interactive hero was removed — ~80 lines
   of dead "hero-stage" CSS remain as evidence.
2. **Several load-bearing proof points are broken or self-defeating in shipped data**: the flagship signals stat
   renders "0 vs 0", the a11y card ties shadcn and prints the tie, the copy says "five demos" while six render,
   and the social-share image says "Fluent in agent." (sic).
3. **The most-visited docs surface — the component page — is weaker than shadcn's**: no install command, no live
   per-example previews, no code tabs, and 52 of 192 components (all charts + layouts) are missing from the docs
   nav and API reference.
4. **The repo leaks its provenance and undersells its rigor**: personal handle in LICENSE, stale root CHANGELOG,
   factory bookkeeping at top level, a 73 KB generated README, and no CI badge despite ten workflows.

None of these are architecture problems. They are finish problems, and every one is enumerated below with an owner-
ready task.

---

## 2. Competitive context: shadcn/ui, July 2026

What we must match or answer (sources: ui.shadcn.com changelog, docs, HN, third-party audits):

| Area | shadcn/ui today |
| --- | --- |
| Positioning | "The Foundation for your Design System" — platform, not library. Hero = full interactive finance dashboard incl. AI chat components. |
| CLI / registry | CLI v4: `--template` project scaffolds, `--base` (Base UI default since Jul 2026, Radix optional), namespaced + private registries, any public GitHub repo is a registry (`shadcn add user/repo/item`), `registry:base` ships whole design systems, `shadcn docs` in terminal. |
| Presets | Design-system config encoded as a short shareable code; `shadcn init --preset [code]`; explicitly an agent-handoff format. shadcn/create is a visual configurator. |
| AI | Zero-config MCP (`shadcn mcp init --client claude`) across all registries; shadcn/skills; llms.txt; "Open in v0" on every block. |
| Ecosystem | ~149 registries in the official directory (@aceternity, @magic-ui, @originui, @tweakcn…); Vercel registry-starter template; paid block markets. |
| Social proof | ~118k stars, ~4–5M weekly CLI downloads, "Trusted by OpenAI, Sonos, Adobe." |

Where shadcn is structurally weak (our openings — each maps to a P4 workstream):

1. **No real upgrade path** — copy-paste means you own maintenance; `diff` is experimental and tracks main, not
   versions; official guidance is "wrap, don't edit". (GitHub discussions #790, #7170)
2. **Bloat** — the Jan 2026 "215-line radio button" HN thread (355 pts) crystallized the critique: Radix + 7 files
   + ~30 utility classes vs native input + 10 lines of CSS.
3. **Accessibility branding exceeds reality** — 2026 third-party audit: 34/48 components pass WCAG 2.2 AA; 5 fail
   procurement audits; focus-ring contrast is a systemic miss; charts a11y panned on HN.
4. **Foundation churn** — Radix→Base UI default flip, Tailwind v3→v4, CLI 3→4, style churn; each strands copied code.
5. **Tailwind lock-in** — "without Tailwind" discussion (#2832) unresolved for years.
6. **No state story** — plain `useState`/context; re-render perf is whatever React gives you.
7. **Charts = Recharts wrapper** — bundle weight, SVG-only, no a11y layer, React-version lag.
8. **Flat theming** — one semantic layer + `.dark` class; no primitive→semantic→component tiers, no scoped themes.
9. **No i18n, no shipped tests, no per-component semantic manifest** — MCP knows how to install, not what a
   component *is*.

cascivo already has a genuine answer to all nine. The problem is that nobody landing on cascivo.com can tell.

---

## 3. Findings inventory

Severity: **P0** = broken/false things visible to visitors (credibility). **P1** = landing effectiveness.
**P2** = docs effectiveness. **P3** = repo presentation. **P4** = strategic/positioning. Effort: S (&lt;½ day),
M (½–2 days), L (&gt;2 days).

### 3.1 P0 — credibility bugs (fix before anything else)

| # | Finding | Evidence | Effort |
| --- | --- | --- | --- |
| P0-1 | **Homepage flagship stat renders "0 vs 0".** The "Signal-driven" carousel panel reads `bench.renders['type-20-chars']`, but the entire `renders` section of the committed bench results is zeros for every library and scenario **[verified]**. The `?? 1` fallback never fires because `0` is present. The core differentiator looks broken. | `apps/site/src/marketing/sections/AdvantageCarousel.tsx:10-12,58-64`; `apps/bench/results/results.json` (`renders.*` all 0) | M (fix instrumentation) |
| P0-2 | **A11y proof card ties the competitor and prints the tie.** Card leads "0 axe violations", then admits "Same scan, same rules: shadcn 0 · Carbon 1". A tie framed as a win invites ridicule. | `apps/site/src/marketing/sections/ProofTeasers.tsx:44-48` | S (reframe) |
| P0-3 | **"Five functional dashboards" copy vs six shipped demos.** Home + `/examples` descriptions and `index.html` say "five" and enumerate "(Vercel, Stripe, Camunda, Linear, Datadog)"; `DEMOS` has six (trade/Trade Republic missing everywhere). | `apps/site/src/route-head.ts:24,63`; `apps/site/src/marketing/examples/ExamplesPage.tsx:23`; `.../examples/data.ts:1,50-193`; `apps/site/index.html:9` | S |
| P0-4 | **OG share image headline is broken English and contradicts the hero.** OG card: "Native to the web. **Fluent in agent.**" Hero: "Fluent with agents." The one image every social share uses has a typo. | `apps/site/src/marketing/og/OgCard.tsx:36-37` vs `apps/site/src/marketing/sections/Hero.tsx:12` | S |
| P0-5 | **Root CHANGELOG.md is stale for 9 of 13 packages** (e.g. react 0.3.8 vs actual 0.4.0, cli 0.2.0 vs 0.3.0). The "Version Packages" merge (#120) bumped versions without re-running `pnpm regen`. Visitors comparing to npm see contradictions. | `CHANGELOG.md` vs `packages/*/package.json` **[verified by agent diff table]** | S fix + S guard |
| P0-6 | **LICENSE copyright says "2024 urbanisierung"** — a personal handle contradicting `NOTICE` ("cascivo contributors"). Most origin-revealing artifact in the repo. | `LICENSE:3`; `NOTICE` | S |
| P0-7 | **Docs nav + API reference silently omit 52 of 192 components.** `Category` type covers only 5 categories, so all 27 `layout` and 25 `chart` entries never appear in the side-nav or `/docs/api`; their doc pages render a blank category eyebrow. They're findable only via search or overview pages. | `apps/site/src/data.ts:40-42`; `apps/site/src/nav.ts:16-28`; `apps/site/src/pages/ApiReferencePage.tsx:11-12,42-43`; `apps/site/src/pages/ComponentPage.tsx:44` | M |
| P0-8 | **All 192 AI prop tables are malformed markdown.** The `llms/*.md` generator doesn't escape `\|` in union types (`'primary' \| 'secondary' \| …`), so every union-typed prop row explodes the table into extra columns. For an "AI-first" system, garbled machine docs is a thesis-level bug. | `apps/site/public/llms/button.md:44-50` (systemic); generator in `scripts/llms/` | S–M |
| P0-9 | **Site ignores `prefers-color-scheme` — hard defaults to dark.** The pre-paint script and theme signal default `dark` unconditionally; light/dark emulation renders identically **[verified by screenshot diff + code]**. Light-preferring visitors (and Googlebot screenshots) get a dark site with no consent. | `apps/site/index.html:55-78` (`var v = 'dark'`); `apps/site/src/theme.ts` (no `prefers-color-scheme` query) | S–M |
| P0-10 | **"CI-enforced" WCAG claim overstates the pipeline.** README says a11y is "CI-enforced"; the axe sweep and visual regression are nightly + manual and self-describe as "Not PR-blocking until the finding backlog is triaged." | `readme.body.md` (README.md:37); `.github/workflows/axe.yml`, `visual.yml` | S (reword) or M (promote to blocking) |
| P0-11 | **Stale/incorrect strings**: search index says "Ten token-driven themes" (there are 12); search button `aria-label="Search (Ctrl+K)"` while rendering `⌘K`; `/charts` ships a live `id: 'wip'` section; `/showcase` route description names 4 products while 9 ship. | `apps/site/src/marketing/search/buildIndex.ts:91`; `.../search/SearchButton.tsx:16,20`; `.../charts/ChartsPage.tsx:59`; `apps/site/src/route-head.ts:96-101` | S each |

### 3.2 P1 — landing page (the "super appealing" gap)

Current home structure (`apps/site/src/marketing/App.tsx:85-126`): blurred decorative ComponentField wallpaper →
header → scroll-spy rail → text hero → three link chips → auto-rotating 5-tab carousel (static code snippets) →
two proof cards → quick start → 3 template teasers → CTA band → footer. Total ~4,000 px. No live component, no
stars/downloads, no logos, no comparison, no FAQ.

| # | Finding | Evidence |
| --- | --- | --- |
| P1-1 | **No interactive demo above the fold.** The only visual is the blurred `aria-hidden`/`inert` wallpaper; the one memorable interaction ("peek" eye-toggle) is hidden behind an unlabeled icon. The old interactive theme-switching hero was deleted — orphaned `.hero-stage`/`.hero-theme-switcher`/view-transition CSS remains. | `apps/site/src/marketing/sections/Hero.tsx`; dead CSS `apps/site/src/marketing/landing.css:3958-4019,4193-4208` |
| P1-2 | **Zero adoption signals on home.** No GitHub star count, no npm downloads, no logos, no testimonials — while 9 real shipped products sit one click away on `/showcase` and 6 functional demo apps on `/examples`. shadcn's landing is social proof. | `apps/site/src/marketing/sections/SocialProof.tsx` (three text chips only); `.../showcase/data.ts` (9 products) |
| P1-3 | **The comparison the pitch promises isn't on the page.** Hero-adjacent copy says "the shadcn copy-in model, without the Tailwind tax — the numbers back it up" but the actual comparison lives at `/docs/why`. | `SocialProof.tsx`; `/docs/why` route |
| P1-4 | **Carousel panels are static screenshots of code**, `showCopyButton={false}` — nothing runs, nothing is copyable. The 12-theme panel renders non-interactive swatches while a real 12-theme live switcher exists in the header dropdown. | `AdvantageCarousel.tsx` (CssPanel/OwnedPanel/AiPanel/ThemesPanel) |
| P1-5 | **Decorative wallpaper is the heaviest chunk on the route** — imports `@cascivo/charts`, `@cascivo/flow`, `@cascivo/editor` + ~40 components to paint blurred cards most visitors never un-blur (lazy, off LCP path, but real bytes). | `apps/site/src/marketing/sections/ComponentField.tsx:1-49,1293-1351` |
| P1-6 | **One dark-only OG image for every route.** `applyRouteSeo` never sets `og:image`; `OgCard` hardcodes `data-theme="dark"`. No per-route social cards for /charts, /performance, /examples… | `apps/site/src/seo.ts`; `og/OgCard.tsx` |
| P1-7 | **Structured data is minimal** — one `SoftwareApplication` block; no `WebSite`+`SearchAction`, `BreadcrumbList`, or `FAQPage` despite having search, breadcrumbs, and an FAQ. | `apps/site/index.html:41-54` |
| P1-8 | **No framework-compatibility band** (Next.js / Vite / Preact / RSC) despite working examples in `apps/examples/`. | home sections list |
| P1-9 | **"192+ components" invites scrutiny** — the number includes 58 display + 27 layout primitives (Text, Heading, Spacer…). Against shadcn's ~50, it can read as inflated rather than impressive. | Hero badge; `registry.json` category counts |
| P1-10 | **/create stops at CSS export.** The theme configurator (presets, OKLCH accent, radius, font, live preview, copy/download/share-link) is genuinely good but has no CLI handoff — shadcn presets encode the whole config as a code consumable by `init --preset` and agents. | `apps/site/src/marketing/create/` |

### 3.3 P2 — documentation

| # | Finding | Evidence |
| --- | --- | --- |
| P2-1 | **Component doc page loses to shadcn's on every axis but props.** No install command on the page (only in `llms/*.md`!), no CLI/manual or package-manager tabs, examples are static `CodeBlock`s with no rendered output, no per-component theming section. Top-of-page live Preview exists only when a demo is registered. | `apps/site/src/pages/ComponentPage.tsx:43-118`; screenshot review of `/docs/components/button` **[verified]** |
| P2-2 | **Getting-started page is the worst-formatted page in the docs** — raw inline `&lt;code&gt;` with hand-rolled styles instead of the shiki `CodeBlock` (no highlighting, no copy), and it omits `npx cascivo create`, the fastest on-ramp. | `apps/site/src/pages/GettingStartedPage.tsx:1-2,12-22` |
| P2-3 | **The shadcn migration guide is 95 lines with one component mapping (Button).** For the audience we most want to convert, this is the weakest core guide. | `docs/MIGRATING-FROM-SHADCN.md:38-45,88-94` |
| P2-4 | **No `docs/README.md` curated index** — 17 loose guides with no entry point (flagged in the 2026-07-02 remediation plan §4.2, still open). | `docs/` listing |
| P2-5 | Missing docs surfaces vs best-in-class: changelog route in docs, FAQ route (only marketing GuidesFaq), keyboard-shortcut reference, standalone forms guide, versioned docs, Figma kit, community links (no Discord/Slack/X anywhere in footer or README). | agent sweep of routes + `Footer.tsx` grep |
| P2-6 | Search is a genuine strength (⌘K, indexes all 192 incl. the nav-hidden charts/layouts, cross-library aliases like "flex"→Stack) — keep, and fix P0-11 strings. | `apps/site/src/marketing/search/buildIndex.ts` |
| P2-7 | Prior-audit status: most 2026-07-02 items verified FIXED (AT overclaim reworded, examples shipped, counts unified at 192/12, ROADMAP-V* moved to internal, context.json covers 192). Open: P2-3, P2-4. New since that audit: P0-7, P0-8, P0-11. | `docs/internal/feedback/audit-ai-first-adopter-2026-07.md` |

### 3.4 P3 — repo presentation

| # | Finding | Evidence |
| --- | --- | --- |
| P3-1 | **README is a 73 KB / ~1,900-line generated wall** with the full 192-row component table inline. shadcn's is scannable in 30 seconds. | `README.md` |
| P3-2 | **No CI-status badge, no npm badges, no star count on the root README** — all badges are static shields, hiding ten workflows of real rigor. | `README.md:8-15` |
| P3-3 | **Root clutter reveals the factory**: `factory-backlog.json` (52 KB, 57 of 79 items stuck in "review"), `readme.body.md` next to README, `AGENTS.md`, `CLAUDE.md` (23 KB), `BENCHMARKS.md`, 1 MB `registry.json`. | root listing |
| P3-4 | **191 `*@0.0.0.json` placeholder artifacts** among 773 files in `apps/site/public/r/`. | `apps/site/public/r/` |
| P3-5 | Missing community files: `FUNDING.yml`, `CODEOWNERS`, `SUPPORT.md`; CoC enforcement contact vague. Present and good: LICENSE, CONTRIBUTING, CoC, SECURITY, issue templates, PR template. | `.github/` |
| P3-6 | `docs/ROADMAP.md` declares v1 shipped and defers to issues + factory backlog — reads as "done" or "no momentum"; 57 internal ROADMAP-V*.md files self-flagged as stale sit in `docs/internal/`. | `docs/ROADMAP.md` |
| P3-7 | `scripts/factory/` — README-only stub that CONTRIBUTING sends new-component contributors to. | `scripts/factory/` |
| P3-8 | Quality signal to keep marketing: 423 test files, 163 stories, visual regression, perf benches, bundle budgets, claims-guard, drift job, npm OIDC trusted publishing. | `.github/workflows/ci.yml`, `release.yml` |

---

## 4. Implementation plan (for Opus)

Ordered workstreams. Each task lists acceptance criteria (AC). Run `pnpm ready` after each workstream; the drift
job means regenerated artifacts (README, llms, registry, CHANGELOG) must be committed together with source changes.

### Workstream A — Truth pass (P0, do first, ~2 days)

Everything in this workstream is a correctness fix; no design decisions needed.

1. **A1. Fix or pull the signals render-count stat (P0-1).**
   - Preferred: fix `apps/bench` render-count instrumentation (React Profiler `onRender` commit counting for the
     shadcn/carbon apps; signal-write counting or Profiler for cascivo) so `renders.*` carries real numbers; re-run
     and commit `results.json`.
   - If real numbers can't land quickly: change `AdvantageCarousel` SignalsPanel to a stat that exists (e.g. bundle
     delta or update-latency from `runtime`), and add a guard: any `virtual:bench` value of 0 used as a headline
     stat fails `pnpm audit:landing`.
   - AC: no landing surface renders a zero/placeholder benchmark number; `pnpm audit:landing` fails on regression.
2. **A2. Reframe the a11y proof card (P0-2).** Lead with what is uniquely ours: WCAG 2.2 AA conformance statement +
   APG keyboard matrix + CVD-safe charts + AT test plan. Keep the axe number as table stakes ("0 violations, same
   scan as shadcn/Carbon") — never as the headline differentiator. AC: card no longer reads as a tie.
3. **A3. Six demos everywhere (P0-3).** Update `route-head.ts:24,63`, `ExamplesPage.tsx:23`, `examples/data.ts:1`,
   `index.html:9`; add Trade Republic to enumerations. Consider `${DEMOS.length}` instead of prose numerals where
   possible. AC: `rg -i "five functional"` returns nothing; enumerations include all six.
4. **A4. Fix OG card (P0-4).** "Fluent with agents."; align subhead with hero value prop. Regenerate `og.png`
   (`apps/site` `og:generate`). AC: OG text matches hero verbatim.
5. **A5. Regenerate CHANGELOG + guard (P0-5).** `pnpm regen`, commit. Then wire regen into the release flow: the
   changesets "Version Packages" workflow must run `pnpm regen` and commit before merge (adjust `release.yml` /
   version script `version-packages` to include regen). AC: root CHANGELOG versions == package.json versions; the
   guard makes drift impossible on the next release PR.
6. **A6. LICENSE copyright → "cascivo contributors" (P0-6),** matching NOTICE.
7. **A7. Surface charts + layouts in docs IA (P0-7).** Extend `Category` union + `CATEGORY_ORDER`/`CATEGORY_LABELS`
   in `apps/site/src/data.ts` with `chart` and `layout`; `buildNav()` picks them up; include them in
   `ApiReferencePage` (drop the `CORE` restriction or add the two groups). Fix the blank eyebrow fallback in
   `ComponentPage.tsx:44`. AC: side-nav shows Chart (25) and Layout (27) groups; `/docs/api` lists them; no blank
   eyebrows.
8. **A8. Escape pipes in llms prop tables (P0-8).** In the `scripts/llms` generator, escape `|` → `\|` inside table
   cells (types, defaults, descriptions). Add a generator test that parses each emitted table and asserts a
   constant column count. Regenerate all 192 files. AC: `llms/button.md` variant row renders as one cell; test
   guards regressions.
9. **A9. Respect `prefers-color-scheme` (P0-9).** In the pre-paint script and `theme.ts`: default =
   `matchMedia('(prefers-color-scheme: light)')` → `light`, else `dark`; persisted choice still wins. Verify no
   FOUC in both schemes. AC: emulated light/dark first visits render different themes; stored preference overrides.
10. **A10. Reword "CI-enforced" a11y claims (P0-10)** to "CI-tested nightly across every story; PR-gated interaction
    suite" — or promote `axe.yml` to PR-blocking once the backlog is triaged (tracked as C6). Sync `readme.body.md`,
    accessibility page, and `claims:check` expectations.
11. **A11. String sweep (P0-11).** "Ten"→"12 token-driven themes" in `buildIndex.ts:91` (derive from theme count if
    feasible); platform-aware search shortcut label (⌘K on mac, Ctrl+K elsewhere, aria-label matching); remove or
    finish the `/charts` `id: 'wip'` section; rewrite `/showcase` route description to "nine shipped products —
    from payments to BPMN tooling" (or derive the count).

### Workstream B — Landing page: make it sell (P1, ~1–2 weeks, highest product impact)

Design intent: shadcn proves itself by *being clickable*. cascivo's equivalent must prove the three claims —
CSS-native theming, signal-driven speed, agent fluency — by letting the visitor *do* them within 10 seconds.

1. **B1. Interactive hero stage (replaces the static hero; the old `.hero-stage` CSS shows this existed once).**
   - Layout: headline + subhead + CTAs on the left (keep current copy); a **live component stage** on the right
     (desktop) / below (mobile). The stage renders a real mini-app (sign-in card + stat/chart + data-table rows —
     reuse `ComponentField` tiles, unblurred, non-inert).
   - **Theme strip across the stage**: the 12 themes as clickable chips; clicking retints the stage instantly via
     `data-theme` (scoped — proves scoped theming, which shadcn cannot do). Persist nothing; this is a toy.
   - **"View source" affordance**: a tab or flip on the stage showing the actual TSX + CSS of what's rendered,
     copyable — "you own this code" made literal.
   - Reduced-motion: stage renders static in the light of `prefers-reduced-motion`; no auto-rotation.
   - Keep the blurred ComponentField as backdrop only if LCP budget allows after B5; otherwise drop it.
   - AC: above the fold at 1440×900 and 390×844 there is a clickable theme switch and visible component code;
     `pnpm audit:landing` budgets pass; axe clean; works with JS disabled (static fallback render).
2. **B2. Social proof band on home.**
   - Live GitHub star count + npm weekly downloads (fetched at build time — a `virtual:` module or prebuild script
     with committed fallback values; never client-side fetch for LCP).
   - A **showcase strip**: 5–6 of the 9 `/showcase` products as small cards with real screenshots → link to
     `/showcase`. These are real shipped products — currently invisible from the front door.
   - A demos strip or merged row for the six functional dashboards (deploy/pay/flow/track/pulse/trade).
   - Honesty rule stays: no fabricated logos/testimonials. Real products only.
   - AC: home shows at least one verifiable adoption artifact without navigation.
3. **B3. "cascivo vs shadcn" comparison table on home** (link to `/docs/why` for depth). Rows chosen to be
   uncontestable and checkable: Tailwind required (no/yes) · styling (tokens+CSS / utility classes) · state
   (signals, zero re-render / useState+context) · theming (3-tier tokens, 12 scoped themes / CSS vars + .dark) ·
   upgrade path (versioned registry + `cascivo update` / manual diff) · i18n (built-in / DIY) · charts (zero-dep /
   Recharts) · tests shipped with components (yes/no) · a11y (WCAG 2.2 AA statement + APG matrix / partial) ·
   AI layer (manifests + semantic MCP + llms.txt / install-MCP + llms.txt). Every row must link to evidence
   (benchmarks page, parity matrix, docs). AC: each cell claim traceable; `claims:check` extended to cover the
   table's numeric cells.
4. **B4. Carousel → live panels.** Each AdvantageCarousel panel gets a small *running* artifact: CSS panel = a
   resizable container-query card (drag handle); Signals panel = a live commit counter typing demo (after A1's
   instrumentation, mirror it client-side); Themes panel = the actual switcher (or remove panel in favor of B1);
   Owned-code panel = copyable snippet (`showCopyButton`); AI panel = a real MCP transcript snippet. Disable
   auto-rotate when hovered/focused (a11y). AC: no panel is a dead screenshot.
5. **B5. Performance hygiene on the home route.** Decide the wallpaper's fate (B1); if kept, split
   charts/flow/editor imports out of `ComponentField` (static SVG/CSS impressions instead of live chart components
   for background tiles). Delete the dead hero-stage CSS (`landing.css:3958-4019,4193-4208`) and re-run
   `pnpm audit:bundle` / `audit:landing`. AC: home JS transferred bytes measurably down from baseline; budgets
   tightened to the new number so it can't regress.
6. **B6. SEO/share upgrades.** Per-route OG images: extend `applyRouteSeo` + prerender to set `og:image` per route;
   generate route cards via the existing `og:generate` flow (title + route-specific stat, light and dark variants
   per P0-9 posture). JSON-LD: add `WebSite`+`SearchAction`, `FAQPage` (guides FAQ), `BreadcrumbList` on docs.
   AC: sharing /performance vs / produces different cards; rich-results test passes.
7. **B7. Framework band.** Next.js (RSC) · Vite · Preact · Astro-if-true, each linking to its example/guide.
   Only list what has a runnable example in-repo. AC: every logo links to working proof.
8. **B8. Count framing.** Keep 192 as the registry total but present segmented in the hero badge tooltip or proof
   section: "115 components · 25 charts · 27 layouts · 10 blocks · 6 sections" (derive real numbers from
   `registry.json` at build). Avoids the "are these real components?" attack while keeping the headline.
9. **B9. `/create` → preset handoff (shadcn presets parity).** Encode the configurator state (accent oklch, radius,
   font, mode, base theme) into a compact shareable code (the share-link state already exists); add
   `cascivo init --preset <code>` / `cascivo theme --preset <code>` to the CLI that emits the same `theme.css`;
   print the command in the /create "Usage" tab. Document as the agent-handoff format (context.json entry).
   AC: round-trip test — configure → code → CLI → identical theme.css.

### Workstream C — Docs: win the component page (P2, ~1 week)

1. **C1. Component page anatomy upgrade** (`ComponentPage.tsx`). New order: title/lede → live Preview →
   **Installation** (tabs: `npx cascivo add <name>` / `@cascivo/react` import; per-PM variants pnpm/npm/yarn/bun) →
   Usage snippet → **Examples: live render + code** (each example renders its JSX above a collapsible CodeBlock;
   examples come from `<name>.meta.ts`, so add a demo-registry mapping or evaluate curated example components —
   static-render fallback where a demo isn't registered yet, but Button/Input/Select/Dialog/Table tier-1 set must
   be live) → Props → Variants/Sizes/States → **Theming** (the component's `tokens:` list with resolved values and
   a copyable override snippet) → Accessibility → llms.md + Storybook links.
   AC: `/docs/components/button` shows install command, at least 3 live examples, and a theming section; tier-1
   components (top 20 by traffic/importance) all have live examples.
2. **C2. GettingStartedPage rebuild** — use `CodeBlock` everywhere, lead with `npx cascivo create my-app`, then the
   two existing paths; end with "next steps" cards (theme it / add a template / connect MCP). Single source with
   `packages/react/readme.body.md` via generation, not a sync comment. AC: no raw hand-styled `<code>` remains;
   `cascivo create` present.
3. **C3. Migration guide expansion** (`docs/MIGRATING-FROM-SHADCN.md`). Full mapping table for shadcn's component
   set (~50) → cascivo equivalent + `cascivo add` command + notable prop deltas; generate the table from
   `registry.json` tags where possible so it can't drift; sections for theming translation (CSS vars → tokens),
   `cn()`/class patterns → data-attributes, form (react-hook-form → createForm), charts (Recharts → @cascivo/charts).
   Add a `/docs/migrating` parity so the web version matches. AC: every shadcn component name appears with either a
   mapping or an explicit "no equivalent — nearest: X".
4. **C4. docs/README.md curated index** (closes the open remediation item): start-here → guides → references →
   specs → internal, one line each. AC: exists, linked from root README and CONTRIBUTING.
5. **C5. New docs surfaces**: `/docs/changelog` (render the generated CHANGELOG index), `/docs/faq` (promote +
   expand GuidesFaq), keyboard-shortcuts reference page (derive from manifests' `accessibility.keyboard` — we have
   machine-readable keymaps; shadcn doesn't), forms guide (`createForm`/`useForm` + validation + i18n errors).
   Footer: add GitHub Discussions link (and Discord if/when one exists — do not invent one).
6. **C6. Promote nightly axe to PR-blocking** once backlog triage lands (pairs with A10) — then restore the
   "CI-enforced" wording, now true, and market it in B3's table.

### Workstream D — Repo presentation (P3, ~2 days)

1. **D1. README diet.** Target &lt;400 lines rendered: keep hero, highlights, quick start, AI layer, package table
   (collapse "More"/examples into details), move the 192-row component index out (link to docs + registry.json;
   or keep in `<details>` but generated as a compact category summary). Add badges: CI status, npm version of
   `cascivo`, npm downloads, GitHub stars. Adjust `scripts/readme/generate.ts` accordingly. AC: README loads
   scannable; all badges live; `claims:check` still passes.
2. **D2. Root cleanup.** Move `factory-backlog.json` → `scripts/factory/backlog.json` (update the factory skill +
   CLAUDE.md references); `readme.body.md` → `scripts/readme/` (or `.github/`); `BENCHMARKS.md` → `docs/`;
   evaluate `AGENTS.md`/`CLAUDE.md` staying (defensible for AI-first positioning — keep, but trim CLAUDE.md's
   duplication of docs). Prune the 191 `*@0.0.0.json` artifacts from `apps/site/public/r/` (fix the generator's
   version stamping; keep only real published versions + latest). AC: root listing fits one screen; registry
   endpoints still resolve (CLI smoke test `deps:smoke`).
3. **D3. Community files.** `FUNDING.yml` (GitHub Sponsors when available — skip if none), `CODEOWNERS`,
   `SUPPORT.md` (points to Discussions/issues), CoC contact email (reuse SECURITY's). Triage the 57 "review"-status
   factory backlog items (close or re-queue) so the public state doesn't read as limbo.
4. **D4. ROADMAP rewrite.** Forward-looking narrative for the next two quarters: the workstreams in this spec
   (landing v2, docs component-page v2, preset handoff, registry ecosystem growth, AT manual-testing completion,
   axe PR-gating). Signals momentum; replaces "v1 shipped, see issues."

### Workstream E — Strategic positioning (P4, parallel/ongoing)

Turn shadcn's structural weaknesses (§2) into named, evidenced cascivo surfaces:

1. **E1. "Upgrades that actually work" page + proof.** shadcn's #1 unfixable hole. cascivo has versioned registry
   artifacts (`public/r/*@<version>.json`) and `cascivo update`. Ship a `/docs/upgrading` web page + landing
   mention demonstrating: install v0.3 button → `cascivo update button` → clean three-way diff against the pinned
   base version even with local edits. If `update` doesn't do three-way merge against the installed version today,
   spec it in the CLI (`cascivo.json` records name@version at add-time; update diffs base→new→local). This is the
   single most defensible differentiator — shadcn cannot copy it without versioning their registry.
2. **E2. Simplicity receipts.** Answer the "215-line radio button" discourse directly: a docs/why section showing
   cascivo radio (native input + CSS) vs shadcn's, with LOC/deps/DOM-weight counts generated by script (extend
   `claims:check`). Same for dialog (native `<dialog>`) and popover (Popover API + anchor positioning) — "we bet on
   the platform; the platform won."
3. **E3. A11y offense (pairs with A2/C6).** Publish the axe + APG matrix as a standing per-release conformance
   report page; complete the manual AT pass for the 12-component plan (NVDA/JAWS/VoiceOver) and publish results —
   shadcn has no conformance statement at all; a third-party audit failed 5 of their components.
4. **E4. Foundation-stability narrative.** One page: "No Radix→Base UI flips here" — cascivo's primitives are the
   browser's (dialog, popover, anchor positioning, container queries); the upgrade treadmill argument writes
   itself. Cite shadcn's own changelog dates (Tailwind v4 migration, CLI 3→4, Base UI default flip).
5. **E5. MCP semantics vs MCP install.** Document (and demo in the AI page) the difference: shadcn's MCP finds and
   installs; cascivo's MCP + manifests let an agent *select* by constraint, *scaffold*, and *validate* its own
   output (`select_component`, `validate_view`, `cascivo audit --ai`). Ship a 60-second recorded/scripted
   agent-session transcript on the /ai page showing generate→audit→fix.
6. **E6. Ecosystem seeding.** shadcn has ~149 registries; cascivo's marketplace machinery exists but is thin.
   Publish 3–5 first-party registries/templates beyond the seed three (e.g. marketing-site pack, admin pack,
   AI-chat pack — `@cascivo/ai` exists), and a "publish your registry in 10 minutes" campaign page around the
   registry-starter. Parity note: `cascivo add owner/repo/component` (GitHub-as-registry) already matches shadcn's
   Jun 2026 feature — say so on the landing.

### Sequencing & effort summary

| Phase | Contents | Effort | Outcome |
| --- | --- | --- | --- |
| 1 (now) | Workstream A (truth pass) | ~2 days | Nothing on any surface is false, broken, or self-defeating |
| 2 | B1–B5 (hero, proof, comparison, perf) + C1–C2 | ~2 weeks | Landing + component page beat shadcn's first five minutes |
| 3 | B6–B9, C3–C5, D1–D4 | ~1.5 weeks | Docs depth, repo trust markers, preset handoff |
| 4 | E1–E6 | ongoing | Positioning moats shadcn cannot cheaply copy |

### Global acceptance gates

- `pnpm ready` and `pnpm ready:ci` green after every workstream; regenerated artifacts committed (drift job).
- `pnpm audit:landing`, `audit:bundle`, `links:check`, `claims:check`, `breakpoint:check` green; extend
  `claims:check` to cover: every numeric claim on home (incl. the B3 table), no zero-valued bench stat rendered,
  demo count derived not hardcoded.
- Mobile sweep 320/360/390/414 on the new hero/sections; axe clean on all changed pages; `prefers-reduced-motion`
  honored by every new interactive element.
- Screenshot review (light + dark, desktop + mobile) attached to each PR touching the landing.

---

## Appendix: what is already strong (do not regress)

- Honest benchmark pipeline with committed raw data and methodology; the 71.95 KB vs 96.5 (shadcn) vs 189.7 (Carbon)
  gzip result and Lighthouse wins are real and favorable — surface more, not less (after A1 fixes renders).
- ⌘K search with cross-library aliases; 12-theme live switching with view transitions; per-route prerendered SEO
  heads; PR gates (bundle budgets, claims guard, drift job, signals gate); npm OIDC trusted publishing.
- The AI layer (192 llms.md + context.json + tokens catalog + semantic MCP + skills + `audit --ai`) is ahead of
  shadcn's — it needs the A8 table fix and E5 storytelling, not rework.
- The honesty stance (no fabricated logos/testimonials) is right — B2 satisfies social proof with real artifacts.

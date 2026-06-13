# v7 Master Plan — The Console Is the Homepage (Landing Redesign)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-11-v7-tranche-1.md` … `2026-06-11-v7-tranche-5.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Execute `docs/ROADMAP-V7.md` — rebuild `apps/landing` around a live, realistic
"Relay" ops console (the shadcn demo-wall pattern, cascade-flavored), with a 5-theme hero
switcher, a live re-render counter, an artifact-driven agent section, and real brand hygiene
(favicon/OG/meta) — all dogfooded, token-only, slop-free.

**Architecture:** `apps/landing` stays a single-page React+Vite app dogfooding
`@cascade-ui/react` + all five themes. New page skeleton: Header → Hero → Principles strip →
Relay console (demo wall) → Themes → Signals counter → Agent layer → QuickStart → CTA band →
Footer. Sections live in `src/sections/`, the console in `src/demo/` with a fixture-data
module. All styling via cascade tokens in `landing.css` (grows, stays the only CSS file).

**Tech stack:** unchanged — React 19, vp (vite+), `@cascade-ui/react` + `charts` + `render`
(CascadeView), five themes, Playwright (new for landing), `@axe-core/playwright`.

---

## Research findings (ground truth for all tranches)

### Current state (verified 2026-06-11)

**Landing structure** (`apps/landing/`): `src/App.tsx` renders sections in sequence (no
router); `src/sections/{Hero,Features,ComponentGrid,JsonPlayground,ThemeDemo,QuickStart,Footer}.tsx`;
single `src/landing.css` (404 lines, tokens-only, imports all five themes); zero assets
(no favicon/OG/public dir); system font stack; deployed via `.github/workflows/cf-pages.yml`
to Cloudflare Pages (`cascade-ui-landing`).

**Section inventory:**

- Hero: H1 "ships like _shadcn_, performs like a _signal_, thinks like an _agent_" — names a
  competitor; 3-theme switcher (light/dark/warm only) + View Transitions auto-carousel (3s)
  cycling button/input/card slides; CTAs "Get started"/"View on GitHub".
- Features: "Six reasons to switch" — six Card tiles (the wall-of-features anti-pattern).
- ComponentGrid: 12 curated live tiles, count from `registry.json` import (97+), per-tile
  theme cycling.
- JsonPlayground: static CascadeView demo (JSON pane → rendered pane), links
  `/docs/playground`.
- ThemeDemo: "One form, five personalities" — identical SignupCard ×5 `data-theme` containers.
  KEEP (it's the strongest current section).
- QuickStart: 3 steps (`npx cascade init` / `add button` / import). KEEP.
- Footer: GitHub/Docs/Storybook links, "MIT licensed. Built with cascade."

**Dogfood inventory available to the console:** 97 registry components incl. AppShell,
ShellHeader, SideNav, DataTable, Tabs, Modal, Toast, Alert, Badge, Switch/Toggle, Card,
Input, Select, Checkbox, Tooltip, Avatar, Separator, Progress, Spinner; `@cascade-ui/charts`
ships 16 charts (area, bar, line, sparkline, kpi, meter, …); `@cascade-ui/render` ships
CascadeView (JSON → UI, schema `view.v1.json`).

**AI artifacts that exist but aren't surfaced:** `component.meta.ts` per component; MCP server
(`@cascade-ui/mcp`, 6 tools: list/get/search_components, add_to_project, create_theme,
scaffold_page; `npx @cascade-ui/mcp`); 4 Claude Code skills (cascade:add/design-page/
create-theme/extend); `https://cascade-ui.dev/llms.txt` + per-component `/llms/<name>.md`;
`registry.json` public; `view.v1.json` schema.

**Docs visual/perf test patterns to mirror:** `apps/docs/playwright.config.ts` (port 4173,
`vp preview`, animations disabled) and `apps/docs/test/*.spec.ts`. Landing has NO tests today.
Landing preview port must not collide: docs 4173, bench 4181–4183 → **landing tests use 4180**.

### External research (what the best pages do)

**shadcn homepage (fetched June 2026):** slim header (Docs/Components/Blocks/Charts/Directory/
Create, ⌘K search, star count, theme toggle) → announcement pill → 3-line hero ("The
Foundation for your Design System" / "…Start here then make it your own. Open Source. Open
Code.") → ONE CTA ("Build Your Own") → **full-width live demo wall**: a finance app ("Ledger")
with sidebar nav, savings targets ("Retirement $420,000 — 65% achieved"), fee math that adds
up ("Net Royalties $1,248.75 − Processing Fee $37.46 = $1,211.29"), masked accounts
("··8402"), dry microcopy ("You have not met your targets for this year.") → one-line footer.
Zero feature sections, zero testimonials, ~40 words of marketing. The density + cents-precision
realism IS the proof.

**Evil Martians (100 dev-tool landings):** live product embed beats screenshots beats
illustration; function lists are the weakest storytelling; CTA verbs tied to product beat
"Get started"; centered max-width, 5–7 sections for young projects.

**AI-era conventions:** Mantine's FIRST section is llms.txt/MCP/Cursor/Claude-Code; Chakra
segments llms.txt by context budget and ships MCP tools named like ours; shadcn's MCP docs
lead with `npx shadcn@latest mcp init --client claude` + example prompts; Linear puts "and
agents" in the H1. Credible = clickable artifact within one viewport; cringe = adjectives
("zero hallucinations"), sparkle badges, "AI-powered" without an artifact.

**Anti-slop literature:** the slop fingerprint is Inter + purple-blue gradients +
glassmorphism + rounded-everything + icon-grid features + emoji bullets + testimonial
carousel. Mono-as-display-accent (Geist/Vercel/Linear convention) is the 2025–26 dev-tool
signature. Absence of testimonials is safer than weak ones. The landing page of a
performance-claiming library gets DevTools-audited — zero webfonts and tiny JS are brand
assets.

**What we deliberately do NOT copy from shadcn:** their hero demo is static composition only —
our console is _re-themeable per region_ (data-theme scoping), _counted_ (live Profiler
counter), and _agent-addressable_ (a slice of it renders from visible JSON via CascadeView).
That's the cascade twist that makes this a concept, not a clone.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                       | Rationale                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Page skeleton: Header → Hero → Principles strip → Relay console → ThemeDemo → Signals counter → Agent layer → QuickStart → CTA band → Footer (sections deleted: Features, ComponentGrid; JsonPlayground absorbed into Agent layer)                                                                                                                                                                             | 5–7 demonstrating sections; every scroll-stop renders proof                               |
| 2   | Header dogfoods `ShellHeader` (brand, nav: Components→docs, Storybook, GitHub; right slot: 5-theme switcher). Sticky, hairline border                                                                                                                                                                                                                                                                          | Chrome itself is a component demo                                                         |
| 3   | Hero copy fixed: H1 **"Native to the web. Fluent in agent."**; sub: "cascade is a React design system built on modern platform CSS and fine-grained signals — with a machine-readable manifest behind every component. Copy the code. Own it. Let your agent build with it."; badge `{n}+ components · 5 themes · MIT`; CTAs **Start building** (docs) + **GitHub**; copyable `npx cascade add button` beneath | Category + differentiators, no competitor names, ~45 words total                          |
| 4   | Theme state: one signal on `document.documentElement` (`data-theme`), default from `prefers-color-scheme` (light/dark), persisted via `@cascade-ui/storage`; switch animates via View Transitions when supported AND motion allowed                                                                                                                                                                            | The hero interaction; uses our own storage package                                        |
| 5   | Relay console domain: deploy/ops ("Relay") — SideNav (Overview/Deploys/Incidents/Traffic/Flags/Settings), KPI row (4 KpiCards w/ sparklines), traffic AreaChart, deploys DataTable (sha/service/env/status/duration), incident Alert + on-call Card (warm-scoped), feature-flags Switch list, "New deploy" Modal → Toast                                                                                       | Dev-tool audience recognizes the domain; exercises ≥25 components incl. charts + overlays |
| 6   | Fixture realism rules: 7-char hex SHAs, plausible service names, durations that sum, error-rate decimals, masked tokens (`rly_••••8f3a`), ISO-ish timestamps, zero lorem; one dry microcopy line ("All regions nominal. Boring is good.")                                                                                                                                                                      | The shadcn cents-precision trick                                                          |
| 7   | Scoped-theme proof: the on-call card carries `data-theme="warm"` permanently + a small mono label `data-theme="warm"` — stays warm while everything else switches                                                                                                                                                                                                                                              | The capability no competitor has, demonstrated not described                              |
| 8   | Signals section: side-by-side "Settings form" — left cascade (signals), right an intentionally-identical useState twin built locally; each wrapped in `<Profiler>` with live commit tickers; microcopy: "Open DevTools and count along. Same form, same typing — N commits vs 0." Links docs Benchmarks page                                                                                                   | Honest, verifiable, interactive — replaces the "zero re-renders" adjective                |
| 9   | useState twin is exempt from the no-hooks rule (it's the comparison subject, in the landing app, not a component) — annotated with a comment + lint disable if oxlint complains                                                                                                                                                                                                                                | CLAUDE.md rules bind cascade components, not demo foils                                   |
| 10  | Agent layer = four artifacts: (a) real Button manifest excerpt imported at build time from `packages/components/src/button/button.meta.ts`, (b) MCP install Tabs (Claude Code `claude mcp add cascade -- npx -y @cascade-ui/mcp` / Cursor deep-link+JSON / VS Code JSON) each with copy button, (c) one example prompt block, (d) CascadeView rendering a Relay slice from a visible JSON pane                 | Decision 6 of roadmap: clickable/copyable within one viewport                             |
| 11  | Conditional benchmarks teaser inside Signals section: `import.meta.glob('../../../bench/results/results.json')` — renders 3 numbers + link to docs Benchmarks page only when v6 results exist                                                                                                                                                                                                                  | v7 must not block on v6; no hardcoded numbers                                             |
| 12  | Brand: SVG favicon (the word-mark "c" in accent on canvas token), OG image 1200×630 generated by screenshotting a hidden `/og` route with Playwright, committed as `public/og.png`; full meta/OG/Twitter tags in index.html                                                                                                                                                                                    | Fixes the naked-URL share; OG generated from real components, not Figma                   |
| 13  | New landing test suite: Playwright on port 4180 — smoke (sections present, table sorts, modal opens, toast fires, theme switch flips `data-theme`, scoped card stays warm), axe sweep (light + dark, zero violations), reduced-motion check (carousel frozen)                                                                                                                                                  | The DoD is executable                                                                     |
| 14  | Copy voice: terse, declarative, zero hype adjectives ("beautiful", "blazingly"), no emoji, sentence case, mono eyebrows. Every numeric claim is live (registry count) or measured (counter) or absent                                                                                                                                                                                                          | Anti-slop decision 8 of roadmap                                                           |

## Tranche map

| Tranche | File                         | Contents                                                                                                                                                                      | Risk                                        |
| ------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| T1      | `2026-06-11-v7-tranche-1.md` | Header (ShellHeader), hero rewrite, 5-theme signal + storage + system default, principles strip, Features/ComponentGrid removal, footer upgrade, favicon/meta (OG route stub) | Medium (page-wide layout churn)             |
| T2      | `2026-06-11-v7-tranche-2.md` | Relay console: fixture data module + all regions + interactions + scoped warm card + responsive behavior                                                                      | High (the centerpiece; composition quality) |
| T3      | `2026-06-11-v7-tranche-3.md` | Signals counter section + useState twin + conditional benchmarks teaser                                                                                                       | Medium (Profiler wiring, honest framing)    |
| T4      | `2026-06-11-v7-tranche-4.md` | Agent layer: manifest excerpt, MCP tabs + copy, prompt example, CascadeView Relay slice; QuickStart/CTA band refresh                                                          | Medium (build-time manifest import)         |
| T5      | `2026-06-11-v7-tranche-5.md` | Playwright suite (smoke/axe/reduced-motion), OG image generation, Lighthouse + responsive + design-review loop, copy edit, DoD                                                | Low                                         |

## Cross-cutting rules (every tranche)

1. **Tokens only.** No raw colors/sizes in landing.css — `--cascivo-*` custom properties
   exclusively. No new fonts. v5 design language (6px controls, hairlines, quiet shadows)
   binds every new section.
2. **Dogfood or justify.** UI on the page is `@cascade-ui/react`/`charts`/`render` components;
   bare HTML only for layout scaffolding and the useState twin. If a needed pattern has no
   cascade component, note it in the tranche output as a component-gap finding (input for a
   future factory backlog entry) — don't hand-roll a lookalike.
3. **Slop checklist gate** (run mentally before every commit): no gradients, no
   glassmorphism, no emoji bullets, no icon-grid features, no testimonials, no fake logos, no
   unverifiable claims, no "AI-powered".
4. **Motion**: CSS-only, every animation wrapped in `@media (prefers-reduced-motion:
no-preference)`; JS-driven cycling (hero/theme carousel) checks
   `matchMedia('(prefers-reduced-motion: reduce)')`.
5. **Gate before committing** (CLAUDE.md): `pnpm exec vp check` → `pnpm build` →
   `pnpm exec vp run -r check` → `pnpm test` → regenerate
   (`pnpm registry:generate && pnpm readme:generate && pnpm llms:generate`) →
   `pnpm exec vp check --fix` → `git diff --exit-code`. Lint baseline 10 warnings — don't add
   an 11th.
6. **CLAUDE.md hook rules**: landing is an app — signals preferred (`useSignal` from
   `@cascade-ui/core`), and the ONLY sanctioned hook exception is the useState twin (decision
   9).
7. **Branch**: `feature/v7-landing` off `main` (after v6 merges) or off the current feature
   branch if not — record which in the first commit message.
8. **Eyeball every change**: `pnpm --filter @cascade-ui/landing dev`, check light AND dark at
   1440 and 390 widths before each commit. T5 formalizes this with screenshots; T1–T4 still
   look.

## Edge cases / risks registry

1. **ShellHeader in a marketing context**: built for apps — verify it accepts plain `<a href>`
   nav items and a right-slot custom child (theme switcher). If its nav model fights marketing
   use, compose Header from primitives (still cascade components) instead — note the gap.
2. **AppShell in the console**: AppShell imports `@cascade-ui/storage` and manages viewport
   layout — full-viewport behavior inside a scrolling marketing page may fight. The console
   may need a _framed_ composition (SideNav + header inside a Card-like bordered container)
   rather than literal AppShell. Tranche 2 decides after reading AppShell's CSS; either is
   acceptable, the frame must look like an app window.
3. **Charts bundle weight**: `@cascade-ui/charts` has an 80KB gz budget — importing 3 chart
   types is fine, importing the barrel may pull all 16. Import per-chart entry points if the
   package exposes them (re-verify `packages/charts/package.json#exports`); otherwise measure
   landing JS before/after and keep total page JS < 120KB gz (budget asserted in T5).
4. **View Transitions API**: already used by the current hero; keep guarded
   (`'startViewTransition' in document`) and reduced-motion-aware.
5. **`data-theme` on `<html>` vs scoped cards**: theme CSS is loaded for all five themes
   (already imported in landing.css); scoped warm card works because themes scope to any
   `[data-theme]` container — verify the on-call card keeps warm tokens when `<html>` is
   `flat`/`minimal` (token fallback chains).
6. **Profiler in production build**: `<Profiler>` onRender IS active in production React
   builds (unlike profiling-only DevTools data) — verify empirically in `vp preview`; if the
   production bundle strips it, run the counter section's commits via a tiny signal-based
   instrumentation instead and disclose. Do not ship a counter that silently shows 0 for the
   wrong reason.
7. **`button.meta.ts` import**: importing TS from `packages/components` into landing's Vite
   build crosses package boundaries — use a relative import with `?raw` for the code excerpt
   (string, build-time, zero runtime cost) and import the typed meta from the built package
   only if it's exported. `?raw` is the safe default.
8. **CascadeView schema coverage**: the Relay-slice JSON must only use components CascadeView
   supports (re-verify `packages/render` componentMap). Pick the slice accordingly (KPI card +
   badge + button + alert are safe bets).
9. **OG screenshot determinism**: freeze the OG route (no carousel, fixed data) so regenerated
   `og.png` is stable; regenerate only deliberately (script, not CI).
10. **cf-pages workflow**: deploy path/filters already cover `apps/landing/**` — new
    `public/` assets ship automatically; verify nothing in the workflow hardcodes the old
    section structure (it shouldn't).
11. **Port discipline**: landing Playwright uses 4180 (docs 4173, bench 4181–4183).
12. **Registry count import**: ComponentGrid dies but the dynamic count (`registry.json`
    import) moves to the hero badge — keep the same import pattern, never hardcode the number.

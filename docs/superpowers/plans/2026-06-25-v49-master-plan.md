# v49 — Landing-Page Credibility: Three-Lens Audit (Business · Architect · Designer) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the cascivo landing page (`apps/site/src/marketing/*`) to the credibility bar the project sets for its
own components, per the audit in `docs/ROADMAP-V49.md`. The audit reviewed the deployed home page through three
professional lenses and found it structurally sound but **under-proven and internally inconsistent**: the strongest
trust asset (real axe + bundle-vs-shadcn/Carbon numbers) is built but lives on a secondary page; the home page carries
no social proof; an AI-first code sample mis-states the library's own manifest schema (`a11y:` where the real key is
`accessibility:`); the surface ships four orphaned sections; and the "Twelve themes" headline renders only three.

Governing thesis: **a design system's landing page is its first component.** Every fix below makes the page obey the
same rules CLAUDE.md sets for components — single source of truth, no drift, no dead code, claims backed by generated
data, motion-preference respected.

Deliver: **(T1)** truth-in-advertising — fix the manifest sample, derive headings from data, reconcile WCAG, set one
voice; **(T2)** put proof + social signal on the home page; **(T3)** unify the conversion path and tighten the
headline; **(T4)** show all 12 themes and make the carousel reduced-motion-safe; **(T5)** unify the ecosystem domain
and add a CI link-check; **(T6)** delete the four orphan sections, align the JS nav breakpoint, regen + full gate.
Every change is **scoped to the marketing surface** (plus CI link-check config). **Do not** redesign tokens/themes,
add net-new marketing copy beyond surfacing what exists + one social-proof strip, or touch the component
library/CLI/MCP/registry.

Target state (verified after T6):

| Finding (lens · severity)                                  | Today                                                              | Target                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A1 Manifest sample wrong key (arch · 🔴)                   | AiPanel shows `a11y: {…}`                                          | `accessibility: {…}`, matching `ComponentMeta` / real metas                       |
| D1 "Twelve themes" shown as three (design · 🔴)            | 3 cards (light/dark/warm)                                          | all 12 themes (or a representative 12-swatch strip) rendered                       |
| B1 No proof on home (biz · 🔴)                             | `ProofTeasers` only on `PerformancePage`                           | proof block in `HomePage` flow (axe + bundle vs shadcn/Carbon)                     |
| B2 No social proof (biz · 🔴)                              | none on home                                                       | ≥1 credibility signal (GitHub stars / used-by / adopter strip)                    |
| D2 Carousel ignores reduced-motion (design · 🟠)          | raw `setInterval`, no guard                                        | no auto-advance under `prefers-reduced-motion: reduce`; controls obvious           |
| B4 Split conversion path (biz · 🟠)                        | "Get started"→/guides vs "Start building"→/docs                   | one primary verb + destination across Hero + CtaBand                               |
| A3/D4 Drift from source of truth (arch/design · 🟠)       | "Twelve themes"/"Six reasons"/"Five reasons" hardcoded            | headings derive from data; counts read the build macro                            |
| A4 Cross-domain links, no guard (arch · 🟠)               | `cascivo.com` + `cascivo.dev` mixed; 404 risk noted in a comment   | one domain (or documented), CI link-check fails on broken internal routes          |
| A2 Four orphan sections (arch · 🟠)                        | `Features`/`ComponentGrid`/`ExamplesGallery`/`JsonPlayground` dead | removed (salvageable copy lifted in T1 first)                                      |
| B3 No competitor framing on home (biz · 🟠)               | only `/docs/why` in footer                                        | a one-line "why not shadcn/Carbon" teaser linking the proof                        |
| B5/B6 Scattered command / buried npm path (biz · 🟡)      | three commands; npm route in a Collapsible                        | one hero command; npm route visible without a click                               |
| D3 Awkward headline (design · 🟡)                          | "Fluent in agent."                                                | idiomatic, still distinctive                                                       |
| A5 JS nav breakpoint off-scale (arch · 🟡)                | `47.99rem` (=48rem)                                               | canonical scale value, documented                                                 |
| A6 Internal WCAG drift (arch · 🟡)                         | site says 2.2 AA, CLAUDE.md says 2.1 AA                            | reconciled to 2.2 AA in the internal contract                                     |
| Full CI gate (`pnpm ready` / `ready:ci`)                  | green                                                              | green                                                                             |

**Architecture & evidence (reproduced in-repo before planning):**

- **Home composition:** `apps/site/src/marketing/App.tsx:74` `HomePage` renders `ComponentField` (decorative backdrop),
  `Header`, `SectionNav`, then `<main>`: `Hero` → `AdvantageCarousel` → `QuickStart` → `CtaBand`, then `Footer`.
  `ProofTeasers`, `Features`, `ComponentGrid`, `ExamplesGallery`, `JsonPlayground` are **not** in this tree.
- **Count macros (the correct source of truth):** `apps/site/vite.config.ts:245-246` defines
  `__CASCIVO_COMPONENT_COUNT__` / `__CASCIVO_THEME_COUNT__`; Hero (`Hero.tsx:9`) and OgCard consume them. The 12 themes
  are enumerated in `apps/site/src/theme.ts` (`THEMES`). Any other "12"/"twelve" on the page is a hardcoded copy.
- **Manifest schema:** CLAUDE.md `ComponentMeta` and real metas (e.g. `packages/components/src/button/button.meta.ts:33`)
  use `accessibility: { role, wcag, keyboard }`. `AdvantageCarousel.tsx:152` AiPanel prints `a11y: { role, wcag }`.
- **Proof asset:** `sections/ProofTeasers.tsx` builds, from `virtual:bench`, an axe-violations card and a
  total-gzip BarChart comparing `cascade`/`shadcn`/`carbon`; it returns `null` if neither dataset is present. Used on
  `pages/PerformancePage.tsx`.
- **Carousel:** `sections/AdvantageCarousel.tsx` — `ADVANTAGES` (5 entries), `ROTATE_MS = 6500`, a `useSignalEffect`
  `setInterval` that advances `active` unless `paused` (hover/focus). No `prefers-reduced-motion` read. `ThemesPanel`
  maps a literal `['light','dark','warm']`. Heading string "Five reasons it feels different" is literal.
- **CTAs:** `Hero.tsx` → `<LinkButton href="/guides">Get started</LinkButton>` + GitHub; `CtaBand.tsx` →
  `<LinkButton href="/docs">Start building</LinkButton>` + `npx cascivo init`. `QuickStart.tsx` hides the
  `@cascivo/react` npm route inside `<Collapsible>`.
- **Links/domains:** `Footer.tsx` columns mix `https://storybook.cascivo.com`, repo on `github.com/cascivo`, and
  `https://cascivo.dev/charts` / `…/layouts`; the file comment notes 404 risk is a manual follow-up. No link-check job
  in `.github/workflows`.
- **JS breakpoint:** `Header.tsx:199` `useMediaQuery('(max-width: 47.99rem)')`. Canonical scale (CLAUDE.md): sm 30 /
  md 40 / lg 64 / xl 80 rem. `breakpoint:check` lints CSS only.
- **CLAUDE.md constraints:** signals only (no `useState`/`useEffect`/`useContext`/`useReducer`); `useSignalEffect` for
  DOM side effects; `useRef` only for DOM; React apps call `useSignals()` first (note: `apps/site` is Preact, natively
  reactive); i18n built-ins for user-visible strings; reduced-motion + forced-colors safe; static fallback before
  progressive CSS; no off-scale breakpoint literals.

**Tech Stack:** Preact + `@cascivo/core` signals in `apps/site`; existing cascivo components
(`Card`/`Badge`/`Button`/`Tabs`/`BarChart`/`Collapsible`/`ShellHeader`); `virtual:bench` for generated proof data;
the build-time `define` macros in `vite.config.ts`; Vitest for any section test; a Node link-check script (built-ins,
no new runtime dep) wired into a CI step. No new packages; no component-library changes.

---

## Tranche Overview

| Tranche | Title                                                       | Goal                                                                                                                                                                                 |
| ------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Truth-in-advertising (manifest, headings, WCAG, voice)      | Fix the AiPanel sample to `accessibility:` (A1); derive "reasons" from `ADVANTAGES.length` and any theme count from the macro, removing hardcoded numbers (A3/D4); reconcile WCAG to 2.2 AA in CLAUDE.md (A6); pick one rhetorical voice (D5). Lift any salvageable orphan copy. No layout change. |
| T2      | Proof + social signal on the home page                      | Promote `ProofTeasers` into `HomePage` between the carousel and QuickStart (B1); add one social-proof strip — GitHub stars / used-by / adopter logos (B2); add a one-line "why not shadcn/Carbon" teaser linking `/docs/why` + the proof (B3). |
| T3      | One conversion path + headline polish                       | Unify the primary CTA verb + destination across Hero and CtaBand (B4); choose one hero command (B5); surface the `@cascivo/react` npm route without a click (B6); tighten the Hero headline (D3). |
| T4      | Showcase fidelity (12 themes + carousel motion)             | Render all 12 themes (or a representative 12-swatch strip) in the themes panel (D1); gate the carousel auto-advance on `prefers-reduced-motion: no-preference` and make the tab controls obviously interactive (D2). |
| T5      | Link integrity + domain unification                         | Unify the Footer ecosystem links onto one domain or document the split (A4); add a CI link-check (internal routes must resolve; known external targets pinged) so 404s fail the build, not a human. |
| T6      | Dead-code & breakpoint cleanup + gate                       | Remove `Features`/`ComponentGrid`/`ExamplesGallery`/`JsonPlayground` (A2, after T1 lifts any copy); align the `Header` JS nav breakpoint to the canonical scale (A5); `pnpm regen` + drift + full gate + `breakpoint:check` + `fallback:check`; flip `docs/ROADMAP-V49.md` → Shipped. |

Ordering rationale: **T1 first** — pure correctness, no design dependency, and it lifts any salvageable copy out of
the orphans so T6 can delete them safely. **T2→T3** are the conversion core (proof + trust, then a single path to
act). **T4** is self-contained design fidelity. **T5** hardens links. **T6** removes the now-unused orphans and the
breakpoint drift, then gates. T1–T4 share `sections/*` files and are sequenced for one reviewer; T5/T6 are
independent.

---

## Files Created / Modified per Tranche

### T1 — Truth-in-advertising

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/sections/AdvantageCarousel.tsx` (AiPanel `a11y:`→`accessibility:`; heading from `ADVANTAGES.length`; ThemesPanel headline reads the macro) |
| Modify | `CLAUDE.md` (reconcile `ComponentMeta.wcag` note + accessibility target to WCAG 2.2 AA)       |
| Modify | `docs/ROADMAP-V49.md` (record voice decision + lifted-copy notes; check off T1)               |

### T2 — Proof + social signal on the home page

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/App.tsx` (lazy-import `ProofTeasers`; render it + a `flow-divider` between `AdvantageCarousel` and `QuickStart`, with a `SectionFallback`) |
| Modify | `apps/site/src/marketing/sections/SectionNav.tsx` (add a `proof` dot)                          |
| Create | `apps/site/src/marketing/sections/SocialProof.tsx` (GitHub-stars / used-by / adopter strip — data-driven, degrades to null if absent) |
| Modify | `apps/site/src/marketing/sections/Hero.tsx` **or** a small teaser near the carousel (one-line "the shadcn model, without the Tailwind tax — see the numbers" → `/docs/why`) |
| Modify | `apps/site/src/marketing/landing.css` (styles for the social-proof strip + any teaser)        |

### T3 — One conversion path + headline polish

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/sections/Hero.tsx` (single primary verb/destination; one command; headline copy) |
| Modify | `apps/site/src/marketing/sections/CtaBand.tsx` (match the Hero primary verb + destination)     |
| Modify | `apps/site/src/marketing/sections/QuickStart.tsx` (promote the `@cascivo/react` route out of the `Collapsible`, or make it visible-by-default) |

### T4 — Showcase fidelity

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/sections/AdvantageCarousel.tsx` (ThemesPanel renders all 12 `THEMES`; carousel auto-advance gated on `prefers-reduced-motion`) |
| Modify | `apps/site/src/marketing/landing.css` (12-swatch strip layout; ensure tab controls read as interactive) |
| Create | `apps/site/src/marketing/sections/AdvantageCarousel.test.tsx` (reduced-motion → no auto-advance; all themes rendered) |

### T5 — Link integrity + domain unification

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/sections/Footer.tsx` (unify ecosystem domain or document)            |
| Create | `scripts/check-links.mjs` (assert every internal `href` maps to a known route; ping pinned external targets) |
| Modify | `.github/workflows/*` (add a link-check step) + root `package.json` (`links:check` script)     |

### T6 — Dead-code & breakpoint cleanup + gate

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Delete | `apps/site/src/marketing/sections/{Features,ComponentGrid,ExamplesGallery,JsonPlayground}.tsx` (+ their `*.test.tsx`/`*.module.css` if any) |
| Modify | `apps/site/src/marketing/sections/Header.tsx` (nav breakpoint → canonical scale value)         |
| Verify | `pnpm regen`; drift gate; full gate (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `links:check`, `pnpm ready:ci`); grep for residual `a11y:`/orphan imports |
| Modify | `docs/ROADMAP-V49.md` (status → Shipped)                                                       |

---

## Key Decisions

### Decision 1 — The manifest sample must match the real schema, exactly (firm)

`AdvantageCarousel` AiPanel prints `a11y: { role, wcag }`; the real key is `accessibility:`. **Decision: change the
sample to `accessibility:` and verify every other key in the sample (`name`, `variants`, `props`) is a real
`ComponentMeta` field.** The AI-first pitch is "your agent builds with real components, not guesses" — the sample
that sells it cannot itself be a guess. Rejected: leaving it as "illustrative" (a wrong sample on the page that brags
about machine-readable truth is the single most self-defeating error in the audit).

### Decision 2 — Kill drift at the root: derive, don't duplicate (firm)

The Hero count badge is correct because it reads `__CASCIVO_*_COUNT__`. **Decision: every count on the page either
reads the build macro or derives from data (`ADVANTAGES.length`, `THEMES.length`) — no hardcoded "twelve"/"five"/"six"
survives.** The carousel heading becomes `${ADVANTAGES.length} reasons it feels different`; the themes headline reads
the theme-count macro. Rejected: hand-syncing the numbers (that's exactly the drift the orphans already prove
happens).

### Decision 3 — Surface the proof; don't write new proof (firm)

`ProofTeasers` already renders real axe + bundle-vs-shadcn/Carbon numbers from `virtual:bench`. **Decision: promote
the existing component into `HomePage` between the carousel and QuickStart; do not invent new claims.** It already
self-guards (`return null` when bench data is absent), so it is safe on home. Rejected: building a new home-only
proof section (duplicates a maintained component; risks drift — the very disease we're treating).

### Decision 4 — One social-proof signal, data-driven, honest (recommended)

The home page has zero trust signals. **Decision: add a single `SocialProof` strip driven by available data — GitHub
star count and/or an adopter/used-by list — that renders nothing if the data is absent.** Start with what's real
(stars, the `@lifosy/ui` adoption already referenced in v48 feedback) rather than fabricated logos. Rejected:
placeholder logos / invented testimonials (a fake trust signal on a credibility-audit fix would be self-refuting);
omitting it entirely (B2 is a 🔴 — a design system with no social proof on its home page reads as unadopted).

### Decision 5 — One conversion verb, one destination (firm)

Hero says "Get started" → `/guides`; CtaBand says "Start building" → `/docs`. **Decision: pick one primary verb and
one destination for the top-of-funnel action and use it in both places; the secondary action (GitHub) stays
secondary.** Recommended: primary "Get started" → `/guides` (the guided path), with `/docs` as a clearly-labeled
secondary "Read the docs" — but the firm part is *consistency*, not which target wins. Rejected: keeping two
competing primaries (splits intent and dilutes the funnel).

### Decision 6 — Show all twelve themes (firm)

`ThemesPanel` renders 3 of 12. **Decision: render all 12 `THEMES` as live, theme-scoped swatches/cards (a compact
12-up strip on desktop, scrollable/wrapping on mobile), each a real `data-theme` container so the proof is literally
the system restyling itself.** Theme breadth is cascivo's biggest visual differentiator vs shadcn — show it.
Rejected: bumping 3→6 (still under-sells "twelve"); a static image (forfeits the "it's live, set one attribute"
demonstration).

### Decision 7 — Respect motion preference; reconsider auto-advance (firm)

The carousel auto-advances via `setInterval` with no `prefers-reduced-motion` read. **Decision: gate the interval on
`window.matchMedia('(prefers-reduced-motion: no-preference)')` (read reactively via `useMediaQuery`) so reduced-motion
users get a static, manually-controlled tabset; keep hover/focus pause; ensure the tabs read as obvious controls.**
Auto-advancing carousels are an accessibility/UX anti-pattern; at minimum they must not override a stated motion
preference. Rejected: removing auto-advance entirely (out of scope to redesign the section — the firm requirement is
the motion guard); leaving it unguarded (violates CLAUDE.md's reduced-motion rule, on the page that sells a11y).

### Decision 8 — Remove the orphans, after lifting any copy worth keeping (firm)

`Features`, `ComponentGrid`, `ExamplesGallery`, `JsonPlayground` are imported nowhere. **Decision: in T1, lift any
salvageable wording (e.g. the Features six-card framing, if it improves a live section) into a live surface; in T6,
delete the orphan files.** Per CLAUDE.md's "mention, don't delete pre-existing dead code unless asked," this plan is
the explicit ask: these are the marketing landing's orphans and removing them is in scope. Rejected: leaving them
(dead code on the "owned code you maintain" pitch); wiring all four back onto home (scope creep, and most duplicate
the carousel/examples that already ship).

### Decision 9 — Make link rot a build failure, on one domain (recommended)

Footer mixes `cascivo.com` and `cascivo.dev`, with a comment conceding 404s are a manual follow-up. **Decision:
unify the ecosystem links onto a single canonical domain (or document the split with a comment that names the owning
deploy), and add `scripts/check-links.mjs` to CI: every internal `href` must map to a known route; pinned external
targets are pinged.** Rejected: status quo (the comment already admits the fragility — a credibility audit can't
leave a self-acknowledged 404 risk unguarded).

### Decision 10 — Scope discipline: correctness & conversion, not a rebrand (firm)

**Decision: this roadmap fixes only the marketing surface's honesty, proof, conversion path, fidelity, and links —
no token/theme redesign, no net-new claims, no component/CLI/MCP/registry changes.** Rejected: bundling a visual
refresh (different effort, different reviewers, and it would bury the credibility fixes that matter most).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit; `pnpm ready:ci` before the final
   T6 push (and before T5's CI-config change).
2. **Marketing-only blast radius.** Changes stay in `apps/site/src/marketing/*`, `apps/site/vite.config.ts` (only if
   a macro is needed), CLAUDE.md (A6 reconciliation), `scripts/check-links.mjs`, and CI config. No component library,
   CLI, MCP, or registry edits.
3. **Single source of truth.** Counts read the build macro or derive from data; no hardcoded "twelve"/"five"/"six"
   survives. New user-visible strings follow the existing marketing copy conventions.
4. **Signals, not hooks.** `apps/site` is Preact; sections use `useSignal`/`useSignalEffect`/`useMediaQuery`; no
   `useState`/`useEffect`/`useContext`/`useReducer`; `useRef` only for DOM. The carousel motion guard uses
   `useMediaQuery`, not a bare `matchMedia` in render.
5. **Honesty over decoration.** Proof is the existing generated data (`ProofTeasers`); social proof is real
   (stars/adopters) and renders null when absent. No fabricated logos or testimonials.
6. **Reduced-motion & a11y preserved.** The carousel does not auto-advance under `prefers-reduced-motion: reduce`;
   the 12-theme strip stays keyboard-reachable and in the a11y tree; forced-colors safe; touch targets ≥44px coarse.
7. **No off-scale breakpoints.** The `Header` JS nav breakpoint moves to a canonical-scale value; `pnpm
   breakpoint:check` stays clean; document the JS↔CSS breakpoint mapping.
8. **Generated artifacts in sync.** Any change that touches generated inputs flows through `pnpm regen`; drift gate
   (`pnpm regen && vp check --fix && git diff --exit-code`) green; generated files committed.
9. **Links resolve or the build fails.** `links:check` runs in CI; every internal `href` maps to a known route;
   pinned external targets are reachable; the Footer's "404 is a manual follow-up" comment is removed once guarded.
10. **Out-of-scope stays out.** No token/theme redesign, no net-new marketing claims beyond surfacing
    `ProofTeasers` + one social-proof strip, no component/CLI/MCP/registry work.
</content>

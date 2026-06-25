# cascivo — Roadmap v49: Landing-Page Credibility — Three-Lens Audit (Business · Architect · Designer)

**Last updated:** 2026-06-25
**Status:** ✅ Shipped — T1–T6 implemented (manifest sample + derived headings; home proof + social
strip; unified conversion path + headline; 12-theme showcase + reduced-motion carousel; ecosystem-domain
unification + CI link-check; orphan-section removal + canonical nav breakpoint). Two scoped deviations recorded in
the implementation log below.
**Plan documents:** `docs/superpowers/plans/2026-06-25-v49-master-plan.md` + tranches 1–6
**Builds on:** the marketing surface in `apps/site/src/marketing/*` — the home composition
(`App.tsx` → `HomePage`), the home sections (`sections/{Hero,AdvantageCarousel,QuickStart,CtaBand,Header,Footer,SectionNav}.tsx`),
the not-on-home sections (`sections/{ProofTeasers,Features,ComponentGrid,ExamplesGallery,JsonPlayground}.tsx`),
the theme store (`apps/site/src/theme.ts`), the build-time count macros (`apps/site/vite.config.ts`), and the
component-meta schema (`ComponentMeta` in CLAUDE.md, real metas e.g. `packages/components/src/button/button.meta.ts`).

> **Source of this roadmap.** A structured review of the deployed landing page through three professional lenses —
> a **business decision maker** (does this convert and earn trust?), an **architect** (is the showcase itself
> technically honest and maintainable?), and a **designer** (is the surface that sells a UI library itself
> pixel-honest?). The governing thesis: **a design system's landing page is its first component.** If the page that
> sells "beautiful, correct, AI-readable components" ships dead code, drifting claims, a manifest sample that
> contradicts the real schema, and a 3-of-12 theme showcase, every downstream promise inherits the doubt. Each
> finding below is verified against today's code before it is planned.

---

## Why this roadmap exists

The landing page is the conversion funnel and the credibility proof for cascivo's core pitch (owned code, modern CSS,
signals, 12 themes, AI-first). The audit found the page is **structurally sound but under-proven and internally
inconsistent**: the strongest trust asset (real axe + bundle numbers vs shadcn/Carbon) is built but lives on a
secondary page; the home page carries **zero social proof**; several claims drift from their own source of truth; a
code sample mis-states the library's manifest schema; and the surface ships four orphaned sections plus a
3-of-12 theme showcase. None of these are catastrophic alone. Together they undercut the one thing a design-system
landing must project: **this team sweats the details.**

### Framing: the showcase must obey its own rules

The first job of this roadmap was to hold the landing page to the same bar CLAUDE.md sets for components —
single-source-of-truth, no drift, no dead code, claims backed by generated data. Two corrections came out of that:

1. **The proof already exists — it's just not on the home page.** `ProofTeasers` ("Numbers, not adjectives" — axe
   violations + total-gzip vs shadcn/Carbon, generated at build time) renders on `PerformancePage`, **not** in
   `HomePage`. The business fix is largely *placement*, not new content.
2. **Most "claims" drift because a second copy exists.** The Hero count badge is **correct** — it reads the
   build-time macros `__CASCIVO_COMPONENT_COUNT__` / `__CASCIVO_THEME_COUNT__` (`vite.config.ts:245`). The drift
   lives in **orphaned** sections (`Features.tsx` hardcodes "Twelve themes" / "Six reasons to switch") and in
   hardcoded headings (`AdvantageCarousel` "Five reasons it feels different"). Deleting the orphans and deriving the
   live headings from data removes the drift at the root.

---

## The findings, verified against today's code

Legend: ✅ correct today (leave it) · ⚠️ partially right / at-risk · ❌ genuine gap. Severity uses the project's
🔴 blocker / 🟠 major / 🟡 minor scale, here meaning *impact on credibility & conversion*, not runtime.

### Lens 1 — Business decision maker (does it convert and earn trust?)

| #   | Finding (severity)                                   | Verified state today                                                                                                                                          | Tranche |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| B1  | No proof on the home page (🔴)                       | ❌ `HomePage` (`App.tsx:74`) renders Hero → AdvantageCarousel → QuickStart → CtaBand only. `ProofTeasers` (axe + bundle vs shadcn/Carbon) is on `PerformancePage`, never home. | T2      |
| B2  | Zero social proof / credibility signals (🔴)         | ❌ No GitHub stars, no "used by", no testimonial, no adopter logos anywhere on home. For a system competing with shadcn/Carbon, the home page asks for trust it never earns. | T2      |
| B3  | No "why not shadcn / Carbon" framing on home (🟠)    | ⚠️ A `/docs/why` page exists (Footer "Proof" column), but the home page never frames the competitive choice the buyer is actually making.                      | T2      |
| B4  | Split, inconsistent conversion path (🟠)             | ⚠️ Hero primary = "Get started" → `/guides` (`Hero.tsx:19`); CtaBand primary = "Start building" → `/docs` (`CtaBand.tsx:10`). Two verbs, two destinations for the same intent. | T3      |
| B5  | Three competing copy-commands (🟡)                   | ⚠️ Hero shows `npx cascivo add button`; QuickStart shows `init` / `add` / import; CtaBand shows `npx cascivo init`. No single obvious "first command".         | T3      |
| B6  | npm path buried (🟡)                                 | ⚠️ The zero-setup `@cascivo/react` route is hidden inside a `Collapsible` in QuickStart (`QuickStart.tsx:40`). A buyer evaluating "can I just install it?" may never see it. | T3      |

### Lens 2 — Architect (is the showcase technically honest and maintainable?)

| #   | Finding (severity)                                   | Verified state today                                                                                                                                          | Tranche |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| A1  | Manifest sample contradicts the real schema (🔴)     | ❌ `AdvantageCarousel` AiPanel shows `a11y: { role, wcag }` (`AdvantageCarousel.tsx:152`). The real `ComponentMeta` key is `accessibility:` (`button.meta.ts:33`, CLAUDE.md schema). The AI-first proof sample is wrong about the library's own contract. | T1      |
| A2  | Four orphaned sections shipped in source (🟠)        | ❌ `Features`, `ComponentGrid`, `ExamplesGallery`, `JsonPlayground` are imported **nowhere**. Dead code in a project whose pitch is "owned code you actually maintain." | T6      |
| A3  | Claims drift from their source of truth (🟠)         | ❌ `Features.tsx` hardcodes "Twelve themes" + "Six reasons to switch"; `AdvantageCarousel` hardcodes "Five reasons it feels different". The Hero badge correctly reads the build macros — the orphans/headings do not. | T1, T6  |
| A4  | Cross-domain links with a known 404 risk, no guard (🟠) | ❌ Footer mixes `cascivo.com` (storybook, repo) and `cascivo.dev` (`@cascivo/charts`, `@cascivo/layouts`) (`Footer.tsx:23,52`). A code comment literally says "if a target ever 404s, that's a deploy-config follow-up" — i.e. fragility acknowledged, unguarded. No CI link-check. | T5      |
| A5  | JS nav breakpoint off the canonical scale (🟡)       | ⚠️ `Header` gates the mobile nav on `(max-width: 47.99rem)` (`Header.tsx:199`) = 48rem, which is **not** on the canonical sm/md/lg/xl scale (30/40/64/80rem). `breakpoint:check` only lints CSS `@media`, so this JS drift is invisible to the gate. | T6      |
| A6  | Internal WCAG version drift (🟡)                     | ⚠️ The marketing surface standardizes on **WCAG 2.2 AA** (route-head, ProofTeasers, accessibility pages). CLAUDE.md's `ComponentMeta`/targets say **2.1 AA**. Harmless to visitors, but the internal contract disagrees with the shipped claim. | T1      |

### Lens 3 — Designer (is the surface that sells a UI library itself pixel-honest?)

| #   | Finding (severity)                                   | Verified state today                                                                                                                                          | Tranche |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| D1  | "Twelve themes" shown as three (🔴)                  | ❌ `ThemesPanel` headline reads "Twelve themes, one token swap" but renders only 3 cards — light/dark/warm (`AdvantageCarousel.tsx:84`). The system's single biggest visual differentiator is **told, not shown**. | T4      |
| D2  | Auto-rotating carousel ignores reduced-motion (🟠)   | ❌ The advantage carousel auto-advances every 6.5s via a raw `setInterval` (`AdvantageCarousel.tsx:219`) with **no `prefers-reduced-motion` guard**. Auto-advancing carousels are a known UX/a11y anti-pattern; here it also overrides a stated motion preference. | T4      |
| D3  | Headline copy reads awkwardly (🟡)                   | ⚠️ "Native to the web. Fluent in agent." (`Hero.tsx:12`) — "Fluent in agent" is idiomatically off (agentic? agents?). The cleverness costs clarity in the one line every visitor reads. | T3      |
| D4  | Heading count is a hardcoded number (🟡)             | ⚠️ "Five reasons it feels different" (`AdvantageCarousel.tsx:250`) hardcodes the count; add/remove an advantage and the heading silently lies. Should derive from `ADVANTAGES.length`. | T1      |
| D5  | Voice inconsistency across CTAs (🟡)                 | ⚠️ "reasons to switch" (orphan Features) vs "reasons it feels different" (carousel) vs "Own your UI." (CtaBand) — three different rhetorical registers for the same pitch. Resolved partly by orphan removal (T6) + heading derivation (T1). | T1, T6  |

**Net:** one wrong code sample (A1) and one 3-of-12 showcase (D1) are the credibility blockers; the home page's
missing proof + social signal (B1/B2) is the conversion blocker; the rest is drift, dead code, and link fragility
that a detail-oriented evaluator will notice and silently dock points for.

---

## Tranche map

| Tranche | Lens(es)                | Theme                                                                                          |
| ------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| T1      | Architect + Designer    | **Truth-in-advertising** — fix the manifest sample (A1), derive headings from data (A3/D4), reconcile WCAG (A6), set the single voice (D5). |
| T2      | Business                | **Proof on the home page** — promote `ProofTeasers` into `HomePage` (B1); add social proof (B2); add a "why not shadcn/Carbon" teaser (B3). |
| T3      | Business + Designer     | **One conversion path** — unify CTA verb/destination (B4), pick one hero command (B5), surface the npm route (B6), tighten the headline (D3). |
| T4      | Designer                | **Showcase fidelity** — show all 12 themes (D1); make the carousel reduced-motion-safe and reconsider auto-advance (D2). |
| T5      | Architect               | **Link integrity** — unify the ecosystem domain (A4) and add a CI link-check so 404s stop being a manual follow-up. |
| T6      | Architect               | **Dead code & drift cleanup + gate** — remove the four orphan sections (A2), align the JS nav breakpoint to the canonical scale (A5), then `regen` + full gate. |

Ordering rationale: **T1 first** — the wrong manifest sample and the lying headings are pure credibility leaks fixed
in-place with no design dependency, and removing the orphan-sourced drift de-risks T6. **T2→T3** are the conversion
core: get the proof and trust signals onto the page, then make the single path to act unmistakable. **T4** is the
self-contained design-fidelity work (themes + carousel). **T5** hardens the link graph. **T6** removes the now-unused
orphans (safe last, after T1 has lifted any salvageable copy) and lands the gate. T1–T4 touch overlapping section
files and are sequenced for one reviewer; T5/T6 are independent infra/cleanup.

---

## Out of scope

- No redesign of the visual system, tokens, or themes themselves — this is landing-page correctness and conversion,
  not a rebrand.
- No new marketing content beyond surfacing what already exists (`ProofTeasers`) and one social-proof strip.
- No changes to the component library, CLI, MCP, or registry — only `apps/site/src/marketing/*`, `theme.ts`-adjacent
  display, and CI link-checking config.
- The four orphan sections are **removed**, not rebuilt — if any carries copy worth keeping (e.g. the Features
  six-card grid), T1 lifts the wording into a live surface before T6 deletes the file.

---

## Definition of done (verified after T6)

- AiPanel manifest sample uses `accessibility:` and otherwise matches the real `ComponentMeta` shape.
- No hardcoded count headings remain on home; "reasons" derives from `ADVANTAGES.length`; theme count reads the macro.
- `HomePage` renders a proof block (real axe + bundle-vs-shadcn/Carbon numbers) and at least one social-proof signal.
- One primary CTA verb + destination across Hero and CtaBand; one hero command; the npm route is visible without a click.
- The advantage panel shows all 12 themes (or a representative 12-swatch strip) and does not auto-advance under
  `prefers-reduced-motion: reduce`.
- Footer ecosystem links resolve on one domain (or are documented), and CI fails on a broken internal route.
- The four orphan sections are gone; the JS nav breakpoint is on the canonical scale.
- `pnpm ready` / `pnpm ready:ci` green; `pnpm breakpoint:check` + `pnpm fallback:check` clean; drift gate clean.

---

## Implementation log (2026-06-25)

What shipped, per tranche, with the decisions made against the real code:

- **T1 — Truth.** `AdvantageCarousel` AiPanel sample `a11y:` → `accessibility:`; the carousel heading now derives
  from `ADVANTAGES.length`; the themes headline + tagline + "plus N more" copy read `__CASCIVO_THEME_COUNT__`;
  CLAUDE.md reconciled to **WCAG 2.2 AA**.
- **T2 — Proof on home.** `ProofTeasers` promoted into `HomePage` (between the carousel and QuickStart) via a new
  optional `withLeadingDivider` prop so its self-guarding `null` never leaves a dangling divider; a `proof`
  scroll-spy dot added; a new honest `SocialProof` strip (open-source/MIT, dogfooding, WCAG 2.2 AA — each links its
  evidence) with a one-line "why not shadcn" framing to `/docs/why`. No fabricated logos or testimonials.
- **T3 — One path.** Primary CTA unified to **"Get started" → `/guides`** in Hero + CtaBand (docs demoted to a
  secondary "Read the docs"); `npx cascivo init` made the single canonical command; the `@cascivo/react` npm route
  surfaced out of the QuickStart `Collapsible` into a visible block; headline → **"Fluent with agents."**
- **T4 — Fidelity.** Themes panel now renders all 12 `THEMES` as compact, **non-focusable** color-chip swatches
  (no focusable controls inside the `aria-hidden` showcase); the carousel auto-advance is gated on
  `prefers-reduced-motion: reduce` via `useMediaQuery`.
- **T5 — Links.** `@cascivo/charts` / `@cascivo/layouts` repointed from the separate `cascivo.dev` microsite to
  their GitHub source dirs (one canonical domain, all resolvable); the "404 is a follow-up" comment replaced;
  `scripts/quality/landing-links.ts` (`links:check`) added to CI — it parses the router's known routes and fails the
  build on any unresolved internal href (verified: fails on a bogus link, passes on the tree).
- **T6 — Cleanup.** The four orphan sections deleted; the Header JS nav breakpoint + its matching `landing.css` rule
  moved from off-scale `47.99rem` to canonical-`md` `39.99rem`, kept in lock-step.

### Deviations from the plan (recorded honestly)

1. **T4 test deferred — the site has no wired unit-test harness.** `@testing-library/react` is not a dependency of
   `apps/site` and no jsdom environment / `setupFiles` is configured; even the pre-existing
   `BlocksPage.test.tsx` fails to run (`Cannot find package '@testing-library/react'`, `environment 0ms`). Shipping a
   test that imports `@testing-library/react` would be a non-running, false-signal test — exactly what this audit
   fights. The planned `AdvantageCarousel.test.tsx` is therefore deferred to a **harness-wiring follow-up**; the
   reduced-motion gate and 12-theme rendering were verified via type-check + build + review instead.
2. **T6 dead-CSS removal narrowed to the sections only.** The CSS for the removed sections is interleaved with
   multi-selector rules (e.g. `landing.css:77`, `:2167`) and the **still-live, shared `examples-*` family** (used by
   `ExamplesPage` / `ExampleDetailPage`), so removing it safely is a separate surgical pass. The orphan `.tsx` files
   (the A2 finding) are deleted; the dead CSS is flagged for follow-up. Landing CSS is at 59.2/60 KB — the cleanup
   would also reclaim budget headroom.

### Observations surfaced during implementation (out of this scope)

- **Pre-existing regen drift.** `pnpm regen` in this environment rewrites ~857 generated files (icons, render
  schema/prop-schemas, storybook flow stories, READMEs, llms) with no input from this work — the committed artifacts
  are stale relative to the generator here. Reverted from this change set; flagged as an independent drift-gate issue.
- **Other off-scale `47.99rem` literals** remain in `apps/site/src/app.css` (the separate DocsApp shell) and
  `landing.css:2192` (the Relay console demo) — distinct from the Header nav finding, and `breakpoint:check` only
  scans `packages/`, so they're outside both the finding and the gate. Flagged for a follow-up scale pass.
- **`audit:landing` is not a gate** (absent from `ready` / `ready:ci` / CI); its JS figure reflects a non-production
  local dist, so it was not treated as blocking.
</content>
</invoke>

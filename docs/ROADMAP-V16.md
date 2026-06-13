# cascivo — Roadmap v16: The Full Picture

**Last updated:** 2026-06-13
**Status:** ✅ Shipped
**Plan documents:** `docs/superpowers/plans/2026-06-13-v16-master-plan.md` + tranches 1–6

---

## Vision

v15 gave cascivo a coherent name, a mobile-first landing, and a verified responsive bar. What it
didn't do is make the landing tell the _complete_ story.

Three major shipped packages are entirely invisible on the landing: `@cascivo/charts` (17 types,
CVD-safe palettes, keyboard tooltips), `@cascivo/layouts` (AppShell, responsive grid), and
`cascivo audit --ai` (the auditor that closes the agent loop). The hero still claims "WCAG 2.1 AA"
(upgraded to 2.2 in v14) and "5 themes" (there are 10). The AI-layer section shows how to _set up_
the MCP server but not what the system does when an agent _misuses_ it. The `llms.txt` is linked in
the footer without any explanation of what it is or why it exists. The i18n built-in catalog and RSC
compatibility are not mentioned anywhere.

> Concept: **"The Full Picture."** Every major shipped feature visible on the landing, every claim
> accurate, every proof present. No new features — only receipts for what's already built.

## The diagnosis (pain → today → gap v16 closes)

| #   | Gap                                   | Evidence                                                  | Shipped since |
| --- | ------------------------------------- | --------------------------------------------------------- | ------------- |
| 1   | WCAG chip says "2.1 AA" — wrong       | Hero chip hardcoded; v14 upgraded to 2.2 AA               | v14           |
| 2   | Hero stats say "5 themes" — wrong     | 10 themes shipped (light, dark, warm + 7 more)            | v13           |
| 3   | `@cascivo/charts` entirely invisible  | No charts section; 17 types + CVD + keyboard never shown  | v13/v14       |
| 4   | `@cascivo/layouts` entirely invisible | AppShell powers our own docs; never mentioned on landing  | v10           |
| 5   | `cascivo audit --ai` not shown        | AgentLayer shows MCP setup, not the audit tool            | v13           |
| 6   | `llms.txt` purpose unexplained        | Footer link only; no explanation of what it is            | v13           |
| 7   | `@cascivo/i18n` invisible             | Built-in i18n catalog in every component, never mentioned | v13           |
| 8   | RSC compatibility invisible           | Next.js App Router example exists; landing silent         | v10           |
| 9   | CLI copy command may be wrong         | Hero shows `npx cascivo add button` (unscoped; deferred)  | v15           |
| 10  | Why-cascivo claims 1–13 need audit    | 14–27 verified; 1–13 visibility not confirmed             | v11–v12       |

## The pitch additions (extends v15's claims 1–27)

| #   | Claim                                         | Substance                                                                                                                                         |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28  | **Complete story, accurate numbers**          | Every shipped feature represented on the landing; WCAG 2.2 AA, 10 themes, correct CLI commands, zero stale claims.                                |
| 29  | **Charts built for every user and condition** | 17 types, CVD-safe palettes across all 10 themes (Okabe-Ito grounded, contrast-verified), keyboard-navigable tooltips, dogfooded in our own docs. |
| 30  | **AI audit closes the loop**                  | `cascivo audit --ai` detects hard-coded values, invented props, missing required props, and i18n gaps in agent-generated code — before it ships.  |

## Workstreams

| #   | Workstream        | Tranche | Summary                                                                                             |
| --- | ----------------- | ------- | --------------------------------------------------------------------------------------------------- |
| A   | Accuracy fixes    | T1      | Fix WCAG chip, theme count, component count, CLI copy command; add RSC chip; audit all static copy. |
| B   | Charts showcase   | T2      | New `ChartShowcase` section: ≥3 chart types with active-theme colors, CVD callout, keyboard demo.   |
| C   | AI depth          | T3      | Expand `AgentLayer` with audit artifact card (before/after code) and `llms.txt` explanation card.   |
| D   | Ecosystem section | T4      | New `Ecosystem` section: cards for charts, layouts, i18n, icons with value props + docs links.      |
| E   | Why-cascivo 28–30 | T5      | Audit claims 1–27 visibility; add claims 28–30 with receipts.                                       |
| F   | Final gate + DoD  | T6      | Full CLAUDE.md gate; Playwright mobile re-verify on new sections; DoD walkthrough; roadmap close.   |

## Decisions baked in

1. **No new features.** v16 is exclusively landing-page additions showcasing already-shipped
   packages. No new packages, no component changes, no registry changes.
2. **Charts section uses `@cascivo/charts` directly.** The landing already imports `@cascivo/charts`
   in `ProofTeasers`. The new section reuses the same import; no new vite alias needed.
3. **AgentLayer is expanded, not replaced.** The four existing artifact cards stay; a 5th (audit)
   and 6th (llms.txt) card are added. The section heading is updated to reflect the broader story.
4. **Ecosystem section is brief — cards, not live demos.** Each key package gets a card (name,
   one-line value prop, link to docs). Deep demos live in their own sections (ThemeDemo, ChartShowcase,
   AgentLayer). The Ecosystem section's job is discoverability.
5. **i18n gets an Ecosystem card.** A standalone section for i18n is disproportionate; a single card
   with a link to the i18n docs page is the right weight.
6. **RSC is a hero chip.** One chip `RSC-compatible` covers this gap cleanly.
7. **CLI copy command fixed in T1.** `npx cascivo add button` (unscoped, deferred per v15 decision 4)
   should be `npx @cascivo/cli add button`. Verify and fix in T1 if wrong.
8. **Mobile-first rule upheld on all new CSS.** Base styles = mobile; `min-width` queries enhance.
   All new sections added to the Playwright mobile overflow harness.
9. **Signal rules apply in all new React components.** Any component in `apps/landing` that reads
   `signal.value` calls `useSignals()` first; DOM side effects via `useSignalEffect`; no `useEffect`.
10. **Claims 1–27 visibility audited, not rewritten.** If any are hidden or un-rendered, they are
    surfaced. Content rewrites are out of scope.

## Definition of Done

- [x] Hero chip reads "WCAG 2.2 AA"; hero stats show "10 themes"; CLI copy command correct; "RSC-compatible" chip present. _Evidence: T1 — Hero.tsx chips and badge updated._
- [x] A Charts showcase section live: ≥3 chart types with active-theme styling, CVD-safe callout,
      keyboard tooltip instruction; zero overflow at 320–414px. _Evidence: T2 — ChartShowcase.tsx with BarChart, LineChart, AreaChart; CVD callout and keyboard instruction present; section-level overflow test passes._
- [x] `AgentLayer` has an audit artifact card (before/after agent code) and an `llms.txt` card. _Evidence: T3 — AgentLayer.tsx updated to 6-card grid; audit card (cascivo audit --ai) and llms.txt card both present._
- [x] An Ecosystem section cards `@cascivo/charts`, `@cascivo/layouts`, `@cascivo/i18n`,
      `@cascivo/icons` with one-line value props + docs links. _Evidence: T4 — Ecosystem.tsx with 4 package cards, value props, and docs/GitHub links._
- [x] "Why cascivo" claims 1–27 all render; claims 28–30 live with receipts linked to new sections. _Evidence: T5 — WhyCascadePage.tsx contains claims 28 (complete story), 29 (CVD-safe charts), 30 (AI audit closes the loop) with receipts._
- [x] Full CLAUDE.md gate exits 0 (`vp check` → build → `vp run -r check` → test → regen → diff). _Evidence: T6 — `vp check` 0 errors 24 warnings; build 31/31 packages; `vp run -r check` 0 errors; 122/122 tests pass; regen + drift clean._
- [x] Playwright mobile at 320/375/390/414 passes (zero overflow) including all new sections. _Evidence: T6 — 15/15 tests pass after fixing .agent-artifact min-inline-size:0 (grid overflow) and .header-themes display:none at <48rem (10 theme dots exceeded 320px)._
- [x] `ROADMAP-V16.md` DoD boxes all checked; status → ✅ Shipped. _Evidence: T6 — all boxes checked; status updated to ✅ Shipped; last-updated 2026-06-13._

## Deferred (do not re-litigate in v16)

- **New component development** — use the dark factory; v16 is landing-only.
- **v11 multi-registry / cascade.lock / three-way-merge `update`** — deferred; land when shipped.
- **v12 theme studio** (composable palette × shape × density × type axes) — deferred.
- **Animated logo / brand motion system** — deferred from v15.
- **Unscoped `cascivo` npm shorthand** — deferred from v15.
- **Per-component mobile redesign** — components are already responsive; out of scope.
- **Blog, changelog microsite, or CMS layer** — out of scope.

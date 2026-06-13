# v16 Master Plan — The Full Picture (landing page completeness)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-13-v16-tranche-1.md` … `2026-06-13-v16-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.
>
> **Re-verify each named file/count/command at tranche start. If absent or different, STOP and
> re-read the tranche's "Current-state assumptions" before proceeding.**

**Goal:** Execute `docs/ROADMAP-V16.md` — close every accuracy gap and coverage gap in the landing
page so that every major shipped feature is visible, every claim is correct, and the landing page is
a complete, accurate receipt for the cascivo design system.

**Architecture:** `apps/landing` only. No package changes, no registry changes, no new npm
dependencies. New sections reuse already-imported packages (`@cascivo/charts` is already in
`ProofTeasers`). All new CSS follows mobile-first convention (base = mobile, `min-width` enhances).
All new React components in `apps/landing` use `useSignals()` for signal reads + `useSignalEffect`
for DOM side effects — no `useEffect`.

**Tech stack:** unchanged.

---

## Research findings (ground truth — verified 2026-06-13)

### Landing page current state

**Section order** (from `apps/landing/src/App.tsx`):
Header → Hero → Principles → StatsBand → RelayConsole → SignalsDemo → ProofTeasers → AgentLayer →
ThemeDemo → QuickStart → CtaBand → Footer

**Confirmed accuracy errors:**

- `Hero.tsx` chips include `"WCAG 2.1 AA"` — should be `"WCAG 2.2 AA"` (v14 shipped 2.2 compliance).
- `Hero.tsx` stats badge reads `"{componentCount}+ components · 5 themes · MIT"` — there are 10
  themes shipped (light, dark, warm, brutalist, corporate, flat, midnight, minimal, pastel, terminal).
- `Hero.tsx` copy command shows `npx cascivo add button` — the unscoped `cascivo` package is
  deferred per v15 decision 4; the correct invocation is `npx @cascivo/cli add button`. Verify
  before changing (if the unscoped shorthand has since been published, leave it).

**Confirmed coverage gaps:**

- `@cascivo/charts` — 17 chart types, CVD-safe palettes across all 10 themes, keyboard-navigable
  tooltips (v14). Zero dedicated coverage on the landing. Used internally in `ProofTeasers` (bar
  chart for perf numbers) but never showcased as a product.
- `@cascivo/layouts` — AppShell with off-canvas nav, grid, breakpoint system. Powers the docs app
  but not mentioned on the landing at all.
- `cascivo audit --ai` — flags hard-coded values, invented props, missing required props, i18n gaps
  in agent-generated code (v13). The `AgentLayer` section shows MCP setup + agent prompting but not
  the audit that closes the feedback loop.
- `llms.txt` — linked in the footer but the landing never explains what it is or why agents use it.
- `@cascivo/i18n` — built-in catalog in every component, per-instance `labels` prop override. Never
  mentioned on the landing.
- RSC compatibility — a Next.js App Router example exists in `apps/examples/react-next`; not surfaced.

**Proposed new section order after v16:**
Header → Hero → Principles → StatsBand → RelayConsole → SignalsDemo → ProofTeasers → AgentLayer →
ThemeDemo → **ChartShowcase** → **Ecosystem** → QuickStart → CtaBand → Footer

### Why-cascivo page

`apps/docs/src/pages/WhyCascadePage.tsx` (or `WhyCascivoPage.tsx` — re-verify name). Claims 14–27
are confirmed. Claims 1–13 exist in the data layer but their rendering in the page component must be
audited in T5 — if they are hidden or omitted, surface them.

### Package catalog

Packages confirmed shipped and in `pnpm-workspace.yaml`:
`@cascivo/core`, `@cascivo/tokens`, `@cascivo/themes`, `@cascivo/components` (not published),
`@cascivo/react`, `@cascivo/i18n`, `@cascivo/storage`, `@cascivo/icons`, `@cascivo/charts`,
`@cascivo/layouts`, `@cascivo/render`, `@cascivo/cli`, `@cascivo/mcp`, `@cascivo/ai`,
`@cascivo/registry`.

---

## Key decisions

1. **Landing-only scope.** No package changes, no new dependencies. All additions are in
   `apps/landing/src/` (new components + CSS) and `apps/docs/src/pages/WhyCascadePage.tsx` (new
   claims). Vite aliases already include `@cascivo/charts` (verify in `apps/landing/vite.config.ts`
   before using it in a new section).

2. **ChartShowcase uses the existing `@cascivo/charts` import.** The alias is already wired. If not
   present, add it following the vite alias rule in CLAUDE.md (source alias for dist packages).

3. **AgentLayer is extended with two new artifact cards.** Card 5: `cascivo audit --ai` — a
   before/after code block showing agent-generated code with a hardcoded value, then the audit output
   suggesting the correct token. Card 6: `llms.txt` — what it is, how it's generated, how an agent
   uses it. The existing 4 cards are untouched.

4. **Ecosystem section is a card grid, not a demo.** ~5 cards (charts, layouts, i18n, icons, mcp),
   each: package name + one-line value prop + "See in docs →" link. No live interactive demos in
   this section — those live in dedicated sections. Position: after ThemeDemo, before QuickStart.

5. **i18n = one Ecosystem card, no standalone section.** "Every component ships a built-in string
   catalog. Override per-instance via the `labels` prop. Zero hardcoded English." Links to the i18n
   docs page.

6. **RSC = one hero chip.** `RSC-compatible` chip added alongside the existing chips. The Next.js
   example is the receipt; link from the chip or a hover tooltip to `/examples/react-next`.

7. **Mobile-first on all new sections.** Every new `.css` block starts from a single-column mobile
   layout; `min-width` queries add columns. New sections are wired into
   `apps/landing/test/mobile.spec.ts` for the 320/375/390/414 overflow assertion.

8. **Signal rules in all new React landing components.** `useSignals()` as the first statement in
   any component that reads `signal.value` during render; `useSignalEffect` for DOM side effects;
   no `useState`, no `useEffect`.

9. **Commit per task, not per tranche.** Each task in each tranche ends with a commit. The gate
   (full `vp check` + build + type check + test + regen + diff) runs once at T6.

10. **Claim receipts link to v16 sections.** Claim 28 links to the brand page (claim 25's receipt —
    the landing is the proof). Claim 29 links to `/charts` (the charts docs page). Claim 30 links to
    the Context Explorer (`/context`) where `cascivo audit --ai` is demonstrated live.

---

## Tranche map

| T#  | Focus                   | Files changed                                                   | Risk   |
| --- | ----------------------- | --------------------------------------------------------------- | ------ |
| T1  | Accuracy fixes          | `Hero.tsx`, any section with stale copy                         | Low    |
| T2  | Charts showcase section | New `ChartShowcase.tsx`, `landing.css`, `App.tsx`, mobile spec  | Medium |
| T3  | AgentLayer deepening    | `AgentLayer.tsx`, `landing.css`                                 | Medium |
| T4  | Ecosystem section       | New `Ecosystem.tsx`, `landing.css`, `App.tsx`                   | Low    |
| T5  | Why-cascivo 28–30       | `WhyCascadePage.tsx` (or `WhyCascivoPage.tsx`), `App.tsx` route | Low    |
| T6  | Final gate + DoD        | `ROADMAP-V16.md` (DoD checks)                                   | Low    |

**Risk notes:**

- **T2 (Medium):** Charts render correctly only when the `@cascivo/charts` vite alias exists in
  `apps/landing/vite.config.ts`. Verify before implementing; add alias if missing (follow CLAUDE.md
  vite alias rule — source path, not dist).
- **T3 (Medium):** The AgentLayer section has a tightly composed layout. Adding 2 artifact cards
  must preserve the existing grid behavior (especially mobile). Test at 320px after T3.
- **T4 (Low):** Pure new section; no changes to existing components.
- **T5 (Low):** WhyCascadePage mutation only. Confirm the file name before editing.

# v20 Master Plan — Responsive by DNA (mobile-first by default)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-14-v20-tranche-1.md` … `2026-06-14-v20-tranche-7.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans. For any visual change, also
> use compound-engineering:frontend-design and screenshot-verify at each mobile breakpoint
> (320 / 360 / 390 / 414).
>
> **Re-verify each named file/selector/value/count/command at tranche start. If absent or different,
> STOP and re-read the tranche's "Current-state assumptions" before proceeding.**

**Goal:** Execute `docs/ROADMAP-V20.md` — make mobile-friendliness a structural property of cascivo
rather than a per-component afterthought. Ship a canonical breakpoint scale, fluid type and
coarse-pointer touch targets at the token layer, a lint + a generalized mobile-overflow sweep that turn
"usable on a 320px screen" into a CI gate, mobile patterns for the worst offenders (overlays, blocks),
and a responsive rebuild of the `ConsoleApp` demo. No new components, no visual redesign, desktop frozen.

**Architecture:** Touches `@cascivo/tokens` (new scale + fluid tokens), `scripts/checks` (new
`breakpoint:check`, extended sweep), `packages/components/src` (primitives + overlays), `packages/layouts`
(AppShell + blocks + ConsoleApp), `apps/storybook` (viewport presets), `apps/docs` (doc page +
breakpoint migration), and `CLAUDE.md`. Tokens export source CSS (no `dist`) so **no new vite aliases**
are needed.

**Tech stack:** unchanged. React 18+ + `@preact/signals-react` (`useSignals()` for signal reads,
`useSignalEffect` for DOM/`matchMedia` side effects, never `useEffect`/`useState`/`useContext`).
Mobile-first, token-based CSS; `@function`/`if()` keep static fallbacks (`fallback:check`). Playwright
for the mobile sweep. Oxlint/Oxfmt via `vp`.

---

## Research findings (ground truth — verified 2026-06-14)

### Current-state facts (re-verify at use)

- **No breakpoint tokens.** `packages/tokens/src/index.css` has spacing/type/radius/etc. but **no**
  `--cascivo-breakpoint-*`/`--cascivo-screen-*`. Breakpoints are literals scattered across files:
  `64rem` (`app-shell.module.css:63`, `shell-state.ts:35` `matchMedia('(min-width: 64rem)')`); `40rem`
  (`columns.module.css`, `grid.module.css`, `header.module.css` `@container`); `30rem`/`28rem`/`480px`
  (`apps/docs/src/app.css`).
- **Control-height tokens exist** (`index.css` ~168–170): `--cascivo-control-height-sm: 1.75rem` (28px),
  `-md: 2.25rem` (36px), `-lg: 2.75rem` (44px). **Button does not use them** — `button.module.css:32–46`
  hardcodes `height: 2rem / 2.5rem / 3rem`. `scripts/checks/target-size.test.ts` enforces ≥24px
  (WCAG 2.5.8) against the _tokens_, so the Button divergence is unguarded.
- **Fluid type only in the docs app.** `apps/docs/src/app.css:112,130` uses `clamp(...)`; the token layer
  has only fixed `--cascivo-text-xs … -3xl`. `functions.css` has `--cascivo-scale(--n,--ratio,--base)`
  (Chrome 133+, static fallback) but it is not wired into shipped type tokens.
- **Responsiveness coverage is thin.** Across `packages/components/src` + `packages/layouts/src`:
  **43/121** CSS files contain any `@media`; `@container` appears in **8** (header, pagination, toast,
  columns, grid, settings-layout, …); `clamp()` in **3**. Most component `@media` are a11y guards
  (`forced-colors`, `prefers-reduced-motion`, `prefers-contrast`), **not** screen-size adaptation.
- **Overlays.** `modal.module.css`: `--_modal-width: 24/32/48rem` with `width: var(--_modal-width)` and
  `max-width: calc(100vw - var(--cascivo-space-8))` (line ~71) — no sheet/fullscreen, no `@media`.
  `dropdown.module.css:11` `min-inline-size: 10rem` (can overflow narrow screens). `tabs.module.css`
  is flex/wrap, **no** horizontal scroll.
- **AppShell is the one real responsive layout.** `app-shell.module.css:63–107`: `@media (max-width: 64rem)`
  turns the sidenav into a fixed drawer with scrim and **`display:none` on the aside** (line 72 — content
  dropped, not relocated). `shell-state.ts` detects desktop via `matchMedia('(min-width: 64rem)')`.
- **ConsoleApp** (`packages/layouts/src/blocks/console-app/console-app.tsx`): no own CSS; composes
  `AppShell` + `ShellHeader` + `SideNav` + two `HeaderPanel`s + an inline-styled `aside`
  (lines ~92–117) + a main containing an **inline-styled 7-column `<table>`** (`Name, Status, Type,
Region, IP, Created, Actions`, lines ~162–236). On a phone the table overflows horizontally and the
  aside is hidden by AppShell — both fail the "no user must think about it" bar. `console-app.test.tsx`
  has no mobile assertions.
- **Tests/checks.** `scripts/checks/target-size.test.ts` (≥24px), `media-features.test.ts` (a11y media
  guards), `css-fallback.ts` (static fallback before `@function`/`if()`). Mobile e2e exists **only** in
  `apps/landing/test/mobile.spec.ts` (320/375/390/414 overflow + drawer). No component/layout/block mobile
  coverage.
- **Storybook.** `.storybook/main.ts` has no viewport addon; `preview.tsx:18` wraps stories at
  `inlineSize: min(26rem, 90vw)`. No xs/sm/md/lg presets.

### Best-practice synthesis (2026 — informs the fixes, not literal copy)

- **Mobile-first authoring:** base styles target the smallest screen; layer enhancements with
  `min-width`/min container queries. Prefer `@container` (intrinsic, placement-agnostic) over `@media`
  (viewport) for components that can live in arbitrary slots.
- **Breakpoints can't be custom properties.** `@media`/`@container` conditions don't evaluate `var()`;
  `@custom-media` is Level 5 and needs PostCSS. The portable pattern is a documented numeric scale plus a
  lint that prevents drift — not a fake reactive token.
- **Touch targets:** WCAG 2.5.8 floor is 24×24px; comfortable mobile targets are ~44–48px (Apple HIG 44,
  Material 48). Gate the comfortable size behind `@media (pointer: coarse)` so desktop density is
  preserved.
- **Fluid type:** `clamp(min, preferred-with-vw, max)` is universally supported and removes per-breakpoint
  font-size jumps. Keep a fixed fallback for the `@function`/`if()`-only path.
- **Don't hide content to "be responsive":** relocate (disclosure/drawer/sheet) so it stays in the a11y
  tree and reachable by keyboard. Never `user-scalable=no`/`maximum-scale=1`.
- **Test the gate:** Playwright at representative widths (320/360/390/414) asserting zero horizontal
  overflow and minimum tap-target size catches ~the regressions a static lint can't.

---

## Key decisions

1. **Scope = foundation + worst offenders + the demo.** Tokens (scale, fluid, coarse targets), the
   enforcement tooling, the overlays and blocks that break worst, and `ConsoleApp`. The long tail of
   ~118 components is carried by the authoring rule + gate, not hand-fixed in v20.

2. **Breakpoints ship as a lint-guarded constant** (Decision 1 in the roadmap). Canonical:
   `sm 30rem / md 40rem / lg 64rem / xl 80rem`. Two artifacts: CSS doc-block + JS `SCREEN` constants in
   `@cascivo/tokens`. `breakpoint:check` flags off-scale width literals in `@media`/`@container`.

3. **One source for control height.** Interactive controls read `--cascivo-control-height-*`. Button's
   hardcoded heights are replaced by the tokens (verify the computed desktop value is unchanged), then a
   `@media (pointer: coarse)` rule lifts the effective min target to ≥44px.

4. **Fluid type at the token layer.** Add `--cascivo-text-*-fluid` (or replace selected display sizes
   with clamp()), fixed values preserved as the fallback line. No desktop max regresses.

5. **Mobile-first, CSS-first, container-query-preferred.** JS only for the existing `matchMedia` drawer
   logic (already `useSignalEffect`-driven). New behavior is CSS.

6. **Nothing vanishes.** The AppShell aside and any block's complementary content relocate to a
   disclosure/drawer below `lg` instead of `display:none`.

7. **The gate grows with the work.** T2 lands the sweep + lint against a small enrolled set; T3–T6 each
   enroll the surfaces they touch. CI stays green; the enrolled set only ever grows.

8. **Signal + fallback + alias rules hold.** `useSignals()` first on signal reads; `useSignalEffect` for
   side effects; static fallback before `@function`/`if()`; tokens export source (no alias work).

9. **Desktop frozen.** Additive-below-breakpoints or value-preserving refactors only. Re-run existing
   a11y/visual checks after each tranche; desktop must not move.

10. **Manifest stays light; docs carry the rule.** Optional, non-required `responsive` meta field at
    most. The DNA is documented in `CLAUDE.md` + a docs page and enforced by the test gate.

---

## Tranche map

| T#  | Focus                       | Files changed (primary)                                                                                                                                | Risk     |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| T1  | Responsive token foundation | `packages/tokens/src/index.css` (scale + fluid + coarse-target tokens), new `packages/tokens/src/screens.ts` (JS constants), `packages/tokens` exports | Medium   |
| T2  | Enforcement & authoring DNA | new `scripts/checks/breakpoint.test.ts` + allowlist; new reusable mobile-sweep helper + first enrolled spec; `CLAUDE.md` authoring rule; check wiring  | Medium   |
| T3  | Interactive primitives      | `button.module.css` (+ icon/menu/copy/button-group), `input`, `select`, `textarea`, `toggle`, `checkbox`, `radio` CSS; enroll in sweep                 | Medium   |
| T4  | Overlays & navigation       | `modal.module.css`, `alert-dialog`, `dropdown`, `select` menu, `tabs`, `toast`; enroll in sweep                                                        | **High** |
| T5  | Layout shells & blocks      | `app-shell.module.css` + `shell-state.ts` (64rem → canonical `lg`), block CSS/TSX (sidebar-app, users-table-page, settings-form-page, stats-cards, …)  | Medium   |
| T6  | ConsoleApp flagship rebuild | `console-app.tsx` (+ new `console-app.module.css`), `console-app.test.tsx`, new `console-app` mobile e2e                                               | **High** |
| T7  | Storybook + docs + close    | `apps/storybook/.storybook/{main.ts,preview.tsx}`, new docs responsive page, `CLAUDE.md`/manifest notes, `docs/ROADMAP-V20.md`                         | Low      |

**Risk notes:**

- **T4 (High):** Overlay mobile patterns are the most behavior-heavy. The Modal sheet must not break
  focus trap, Esc/scrim close, or scroll-lock, and must use `useSignalEffect` (never `useEffect`). The
  `pointer: coarse` and `<md` paths must be additive — desktop modal sizing is frozen. Verify against the
  existing modal a11y test before/after.
- **T6 (High):** `ConsoleApp` currently inlines all styles; extracting to a `.module.css` while preserving
  the signal patterns (`useSignals()`, the lazy `createShellState` init) and the exact desktop look is the
  delicate part. The table→cards transform must keep header/cell semantics for screen readers. Ship its
  mobile e2e in the same tranche.
- **T1/T3 (Medium):** Token changes ripple. The fluid-type and control-height refactors must yield
  identical desktop computed values (snapshot before/after). The coarse-pointer rules must not affect
  `pointer: fine`.
- **T2 (Medium):** The lint must not flood-fail the whole repo on day one — it ships with an allowlist for
  existing literals and the canonical values; later tranches retire allowlist entries as they migrate.
- **T5 (Medium):** Changing AppShell's breakpoint source must keep the drawer behavior identical at
  `lg`; relocating the aside must not regress the desktop two-column layout.
- **T7 (Low):** Mechanical; the docs page + Storybook presets are the deliverable, plus the final gate.

### Enrollment ledger (the growing gate)

| Enrolled in | Surfaces added to the mobile-overflow + touch-target sweep    |
| ----------- | ------------------------------------------------------------- |
| T2          | A seed set: Button, Input, Modal (smoke) — proves the harness |
| T3          | All touched interactive primitives                            |
| T4          | Modal/AlertDialog/Dropdown/Select/Tabs/Toast                  |
| T5          | AppShell + each migrated block                                |
| T6          | ConsoleApp (dedicated spec, 320/360/390/414)                  |

A surface is "done" for v20 only once it is enrolled and green.

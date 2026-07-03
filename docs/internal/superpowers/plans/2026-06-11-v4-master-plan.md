# cascade v4 — Master Plan (Roadmap v4 execution sequencing)

> **For agentic workers:** This is a sequencing document, not an executable task plan. Execute the
> per-tranche plans listed below — all five exist. Each opens with a "Current-state assumptions —
> RE-VERIFY" check; run those first and adapt the plan where reality has drifted.
> Source spec: `docs/ROADMAP-V4.md`.

**Goal:** Implement Roadmap v4 — the console-grade UI shell — in five tranches. One workstream:
bring cascade's shell family (header, side nav, right panels, app shell) to Carbon UI Shell parity
and beyond: dropdown nav menus in the header, global icon actions, an icon rail that actually works
(icons-only, flyouts, expand-on-hover), non-modal header panels, an app switcher, a collapsible
right aside, and a responsive AppShell with a mobile drawer.

**Architecture:** Everything floats on the v3 `usePopover` primitive (CSS Anchor Positioning +
Popover API) — no new positioning code. `ShellHeader` is a new component; `SideNav` and `AppShell`
are upgraded in place, strictly API-additive. Shell-wide state is a plain signals object created by
`createShellState()` and passed explicitly as a prop — no React context for state. Compound
component wiring (where needed) uses the established `createContext` + `Context.Consumer`
render-prop pattern, never the `useContext` hook. All generated artifacts (registry, READMEs,
schema, MCP data, llms.txt, per-component markdown) travel in the same PR as their source change —
the drift gate enforces this.

**Tech stack:** pnpm workspaces + vite+ (`vp`), TypeScript strict
(`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), React 18+ with
`@preact/signals-react`, CSS Modules + `@layer cascade.component`, CSS Anchor Positioning +
Popover API, oklch tokens, Vitest + Testing Library + Playwright.

---

## Decisions locked in (2026-06-11, with Adam)

1. **ShellHeader is a new component** — the existing `Header` remains the marketing/landing header
   and is not modified. Docs cross-link the two with a "which header?" note.
2. **SideNav upgraded in place** — all new behavior (icon-only rail, flyouts, expand-on-hover,
   footer) is additive; existing props and rendered DOM for the expanded state stay compatible.
   Visual snapshots of the expanded state must not move.
3. **Shell state is a signals object** (`createShellState()`), passed as an explicit prop to
   AppShell and read by the app's header wiring. No React context, no global singleton (multiple
   shells per page must work, e.g. docs demos).
4. **Breakpoint resolved at interaction time** — `toggleSideNav()` checks
   `matchMedia('(min-width: 64rem)')` when called; CSS owns all layout switching. No resize
   listeners, no breakpoint signals.
5. **`@cascivo/react` bundle budget raised to 60 KB gzip** (from 50) to absorb the shell
   family; CI budget updated in the same PR that first exceeds 50.
6. **Aside hides entirely below 64rem** — no mobile bottom-sheet in v4; revisit on demand.
7. **Icon fallback in rail mode** — items without `icon` render the first grapheme of their label
   in a circle; no item may become unreachable or invisible when collapsed.

---

## Roadmap corrections (repo reality vs. ROADMAP-V4 "Current State")

Verified on `main` (2026-06-11):

- v3 is fully landed: Popover/`usePopover`, Menu, Sheet, IconButton, Tooltip all exist and are the
  building blocks this plan assumes. RE-VERIFY their exact export shapes before each tranche.
- `packages/components/src/side-nav/` exists with one level of grouping and a CSS-hide rail.
  `packages/layouts/src/app-shell/` exists with header/sideNav/aside slots and a persisted left
  collapse. `packages/components/src/header/` exists (marketing header — do not modify).
- `packages/icons` has 36 icons via a `createIcon` factory (`packages/icons/src/create-icon.tsx`);
  all icons live in a single `packages/icons/src/index.tsx`.
- i18n builtin catalog: `packages/i18n/src/builtin.ts` — `defineMessages('cascade.<ns>', {...})` +
  `defineCatalog(builtin.<ns>, 'de', {...})`.
- `persistedSignal(key, initial)` from `@cascivo/storage` is SSR-safe and the established
  persistence mechanism (see current `app-shell.tsx`).
- House pattern for controlled props: `const sig = useSignal(prop); if (prop !== undefined) sig.value = prop`
  — sync during render (CLAUDE.md Part 3).

---

## Edge-case register (feeds tranche plans)

| #   | Edge case                                                                           | Resolution                                                                                                                                      | Tranche |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Nav dropdown inside `<nav>` — full ARIA menubar semantics are hostile to links      | Follow Carbon: plain `<nav><ul>` of links/buttons; dropdown panels are `role="menu"` with `menuitem` links; no `menubar` role.                  | 1       |
| 2   | Skip-link target: docs/examples may not have `#cascade-main`                        | AppShell v2 sets `id="cascade-main"` on `main`; ShellHeader's default href matches; standalone ShellHeader users get a documented prop.         | 1, 4    |
| 3   | Dropdown trigger active state when a child route is active                          | Trigger gets `data-state="active"` if any item in its `items` has `active: true`.                                                               | 1       |
| 4   | Rail flyout vs expand-on-hover combined                                             | `expandOnHover` suppresses flyouts (hover already reveals labels + inline groups); flyouts only in plain rail mode.                             | 2       |
| 5   | Rail item tooltips — Tooltip wraps anchor elements that already have focus styles   | Tooltip renders on the same element via `usePopover` hover trigger; verify no double focus ring in the a11y story.                              | 2       |
| 6   | Items without icons disappear in an icons-only rail                                 | First-grapheme fallback badge (`Intl.Segmenter` for grapheme safety, fallback `[...label][0]`).                                                 | 2       |
| 7   | Two HeaderPanels open at once (notifications + switcher)                            | `popover="auto"` auto-closes the previous panel when the next opens — platform behavior, test it.                                               | 3       |
| 8   | HeaderPanel focus: non-modal, but focus should move in on open and restore on close | `useSignalEffect` focuses the panel (`tabIndex={-1}`) on open; store `document.activeElement` before opening, restore on close.                 | 3       |
| 9   | `matchMedia` in `toggleSideNav()` runs on the server (SSR)                          | Guard `typeof window === 'undefined'` → default to desktop branch (collapse toggle). Drawer is a client-only interaction anyway.                | 4       |
| 10  | Drawer open + viewport resized to desktop                                           | CSS hides the scrim and un-fixes the nav above 64rem regardless of `sideNavOpen`; the stale signal value is harmless and resets on next toggle. | 4       |
| 11  | Body scroll behind the open mobile drawer                                           | No JS scroll-lock; scrim covers content and `overscroll-behavior: contain` on the drawer. Recorded decision: keep it CSS-only.                  | 4       |
| 12  | Multiple AppShells on one page (docs demos) sharing `persistKey`                    | Demos pass `persistKey={false}`; default key unchanged for apps. Document in the block story.                                                   | 4       |
| 13  | Existing `AppShell` consumers (blocks, docs) must not break                         | All new props optional; internal collapse keeps working when no `state` is passed; existing blocks' visual snapshots are the regression check.  | 4       |
| 14  | Bundle budget breach when shell family lands in `@cascivo/react`                    | Budget raised to 60 KB gzip in the same PR (Decision 5); CI gate updated together with the code, never separately.                              | 5       |

---

## Tranches

| #   | Tranche                                                                                                                                      | Roadmap items   | Size | Plan                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---- | ---------------------------- |
| 1   | **ShellHeader** — brand+prefix, dropdown nav menus on `usePopover`, global icon actions, hamburger, skip-to-content, i18n, stories, docs     | Phase 1         | L    | `2026-06-11-v4-tranche-1.md` |
| 2   | **SideNav v2 + icons** — icons-only rail, grapheme fallback, Tooltip integration, group flyouts, expand-on-hover, footer slot; ~24 new icons | Phase 2         | L    | `2026-06-11-v4-tranche-2.md` |
| 3   | **HeaderPanel + Switcher** — non-modal header-anchored panel, app switcher list, focus management, panel/action pairing                      | Phase 3.1 + 3.2 | M    | `2026-06-11-v4-tranche-3.md` |
| 4   | **AppShell v2 + console block** — `createShellState`, collapsible aside, mobile drawer + scrim, skip-link target, `block/console-app`        | Phase 4 (+ 3.3) | L    | `2026-06-11-v4-tranche-4.md` |
| 5   | **Integration sweep + DoD** — registry/llms/readme regen, axe gate, visual baselines, bundle budget, Carbon-parity checklist verification    | Phase 5         | M    | `2026-06-11-v4-tranche-5.md` |

Dependency notes: T1, T2, T3 are mutually independent and may run in any order (or in parallel
worktrees). T4 consumes all three (console block composes every piece). T5 gates on everything.

---

## Exit criteria per tranche

- **T1:** ShellHeader exported from `@cascivo/react`; dropdown menus fully keyboard-operable
  (open/cycle/close/restore-focus in tests); skip link focusable and first in tab order; axe-core
  zero violations with a menu open; existing `Header` untouched (`git diff` clean for its dir).
- **T2:** Collapsed SideNav renders icons only (no clipped labels in the DOM layout); every item
  reachable in rail mode (flyout test for groups); icon-less items show grapheme badges; 24 new
  icons exported and tree-shakable; expanded-state visual snapshot unchanged.
- **T3:** HeaderPanel light-dismisses, restores focus, and auto-closes when a sibling panel opens
  (platform `popover="auto"` behavior covered by a test); Switcher renders dividers and
  `aria-current`; both exported from `@cascivo/react`.
- **T4:** `createShellState` drives collapse/drawer/aside from ShellHeader buttons in the console
  block; state persists across reload (Playwright); mobile drawer opens with scrim, closes on
  scrim click + Escape; existing AppShell consumers pass unchanged (snapshot + type check).
- **T5:** Carbon-parity checklist (ROADMAP-V4 Phase 5, items 1–14) verified line by line in the
  console block; all five themes pass visual + contrast gates on it; bundle ≤ 60 KB gzip;
  registry/llms/readme drift gate green; `pnpm exec vp check && pnpm build && pnpm exec vp run -r check && pnpm test` all exit 0.

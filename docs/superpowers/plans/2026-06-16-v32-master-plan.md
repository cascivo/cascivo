# v32 — Bug Sprint: Demos, Scroll, Previews — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three user-visible bugs: broken live demo links on the landing page, a missing scrollbar in the docs SideNav when groups expand, and ~40 empty component card previews on the docs home page.

Target metrics (measured after T4):

| Metric                                      | Target |
| ------------------------------------------- | ------ |
| Landing live demo links functional          | 5 / 5  |
| SideNav overflow-y scrollable               | yes    |
| SKIP_PREVIEW additions                      | 8      |
| New component demos in `demos.tsx`          | 39     |
| Components with empty preview after T3      | 0      |
| `pnpm exec vp run @cascivo/components#test` | passes |
| Full CI gate (T4)                           | passes |

**Architecture:** T1 is two surgical one-liner fixes in separate packages (landing router, sidenav CSS). T2 and T3 both touch `apps/docs/src/demos.tsx` and `apps/docs/src/pages/Home.tsx` only — no component source changes. T4 runs the full CI gate.

**Tech Stack:** No new npm packages. All new demo functions use existing component imports or new same-pattern imports from `@cascivo/components/<name>`. Docs app uses Preact, so interactive demos use `useState` from `preact/hooks`.

---

## Tranche Overview

| Tranche | Title                       | Goal                                                                           |
| ------- | --------------------------- | ------------------------------------------------------------------------------ |
| T1      | Quick fixes                 | SPA router guard for `/demos/`; sidenav overflow-x/y split                     |
| T2      | Docs previews (static)      | SKIP_PREVIEW += 8; 30 static demos with no interactive state                   |
| T3      | Docs previews (interactive) | 9 interactive demos using `useState`                                           |
| T4      | Gate                        | Full CI gate: format + lint + build + type-check + tests + drift + breakpoints |

---

## Files Created / Modified per Tranche

### T1 — Quick fixes

| Action | Path                                                   |
| ------ | ------------------------------------------------------ |
| Modify | `apps/landing/src/router.ts`                           |
| Modify | `packages/components/src/side-nav/side-nav.module.css` |

### T2 — Docs previews (static)

| Action | Path                           |
| ------ | ------------------------------ |
| Modify | `apps/docs/src/pages/Home.tsx` |
| Modify | `apps/docs/src/demos.tsx`      |

### T3 — Docs previews (interactive)

| Action | Path                      |
| ------ | ------------------------- |
| Modify | `apps/docs/src/demos.tsx` |

### T4 — Gate

| Action | Path                                                            |
| ------ | --------------------------------------------------------------- |
| Verify | `registry.json` (regenerated via `pnpm regen`, no manual edits) |

---

## Key Decisions

### Why skip `/demos/` in `initRouter()`, not add a route

The five demo SPAs are assembled at build time as independent Vite builds. They have their own `index.html`, asset manifest, and JS chunk graph. They cannot be rendered by the landing's React component tree. Adding a React route for `/demos/*` would mean importing and mounting a separate SPA inside the landing SPA — architecturally wrong and impossible without an `<iframe>`. Skipping interception in the router lets the browser do a full page load to the assembled sub-path, which is exactly what the `assemble-demos.mjs` build step prepares.

### Why `overflow-x: hidden; overflow-y: auto`, not `overflow: auto`

The sidenav collapse animation transitions `inline-size` from `16rem` to `4rem`. As the width shrinks, text labels and icon labels would momentarily overflow horizontally before transitioning to `display: none`. `overflow-x: hidden` suppresses that visual artifact. Setting `overflow: auto` (both axes scrollable) would show a horizontal scrollbar during the collapse animation. The split declaration is the minimum change that fixes the bug without introducing a new visual artifact.

### Why split T2 and T3

Static demos (T2) require only imports and JSX. Interactive demos (T3) require `useState` wrapper functions. Splitting keeps each tranche reviewable on its own, and ensures the `pnpm exec vp check` gate catches type errors in static demos before interactive ones are added.

### Components added to SKIP_PREVIEW vs. getting a demo

Components go to SKIP_PREVIEW when they cannot produce a meaningful self-contained preview in a 120px-tall card:

- `dock` — `position: fixed; inset-block-end: 0` means it renders as a viewport-fixed bar, and `@media (min-width: 64rem) { display: none }` means it is invisible at the desktop widths where the docs are viewed.
- `drawer` — full-height slide-in overlay, same class as Sheet and Modal.
- `header` — full-width marketing header; renders layout-breaking in a card.
- `menubar` — horizontal menu bar with dropdowns, similar to the existing Menu/Dropdown group.
- `navigation-menu` — horizontal dropdown nav; same portaling behavior as Dropdown.
- `skip-nav` — renders only as a visually hidden skip link until focused by keyboard. Nothing to see in a static card.
- `toggletip` — floating anchored panel, same class as Tooltip and Popover.
- `visually-hidden` — invisible by definition.

---

## Cross-Tranche Rules

1. `pnpm exec vp run @cascivo/components#test` must pass after T1.
2. `pnpm exec vp check` must pass after T1, T2, and T3 before each commit.
3. No existing demos modified or removed in T2 or T3.
4. No new npm packages installed.
5. All new interactive demos in T3 use `useState` from `preact/hooks` (docs app is Preact, not React).
6. No `useEffect`, `useSignal`, or `useSignalEffect` in demos — demos are presentation-only.

# Docs app mobile audit — T6

## Before-state failures (from CSS inspection)

| Location                  | Class/element               | Issue                                                                                                                     |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `app.css:73`              | `.doc-page`                 | `max-width: 760px` — not constrained to viewport width; becomes effectively `760px` when padding pushes content           |
| `app.css:34`              | `.page`                     | `padding: var(--cascivo-space-6)` fixed — 1.5rem each side on a 320px screen leaves 272px usable, no sub-30rem adjustment |
| `app.css`                 | No `@media` blocks at all   | Zero responsive behavior in global CSS                                                                                    |
| `app.css:90`              | `.doc-head h1`              | `font-size: var(--cascivo-text-3xl)` fixed — no fluid scaling on small screens                                            |
| `app.css:243`             | `.code-shiki pre`           | `overflow-x: auto` present but no font-size reduction at narrow widths                                                    |
| `app.css:161`             | `.table-wrap`               | `overflow-x: auto` present but no scroll hint; no stacked layout at narrow screens                                        |
| `app-shell.module.css:63` | `@media (max-width: 64rem)` | Only breakpoint: nav becomes off-canvas drawer (already implemented in AppShell). No sub-375px handling.                  |
| `ChartsPage.tsx`          | Chart components            | No explicit width constraints; charts could overflow if SVG viewBox expands beyond container                              |
| `PlaygroundPage.tsx`      | Side-by-side split pane     | `display: flex` horizontal split with no responsive stack at narrow widths                                                |
| `app.css:133`             | `.doc-meta-grid`            | `minmax(160px, 1fr)` — at 320px with padding, this fits ~1 col but edge case worth verifying                              |

## What AppShell already provides

The AppShell CSS (`packages/layouts/src/app-shell/app-shell.module.css`) already implements:

- Off-canvas drawer below 64rem via `data-drawer='open'` on the shell root
- `translate: -100% 0` → `translate: 0 0` transition with motion-preference gate
- Scrim overlay when drawer is open
- `shell.toggleSideNav` and `shell.sideNavOpen` signal already wired in `Layout.tsx`

The hamburger button lives inside `ShellHeader` and calls `onMenuClick={shell.toggleSideNav}`. This is complete — no AppShell changes needed.

## Known gaps

1. `app.css` has no responsive rules — everything is fixed.
2. `.doc-page` `max-width: 760px` needs `min(100%, 760px)` + responsive `padding-inline`.
3. Fluid heading sizes needed on `.doc-head h1` / `.doc-section > h2`.
4. Code blocks need smaller font-size at narrow widths.
5. Props tables need scroll hint (gradient fade) and stacked card layout at < 480px.
6. PlaygroundPage split pane needs to stack vertically at < 48rem.
7. No container query on `.doc-page` (blocks container-driven table collapse).

## Per-page plan

| Page               | Change                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **Home**           | `home-grid` uses `auto-fill minmax(200px, 1fr)` — already collapses; verify at 320px        |
| **ComponentPage**  | Props table → scroll hint + stacked cards below 480px via container query                   |
| **ChartsPage**     | Charts use `width: 100%` implicitly via SVG — confirm no fixed-px widths; no changes needed |
| **Benchmarks**     | `<table>` has no `table-wrap` class — add wrapper or inline `overflow-x: auto`              |
| **PlaygroundPage** | Stack editor + preview single-column at < 48rem via CSS class                               |

## Playwright spec

Written at `apps/docs/test/mobile.spec.ts`. Tests zero horizontal overflow at 320/375/390/414px across Home, ComponentPage, ChartsPage, and Benchmarks pages.

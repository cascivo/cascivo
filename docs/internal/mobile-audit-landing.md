# Landing page mobile audit — T5

## Before-state failures (from CSS inspection)

| Location          | Class/element                      | Issue                                                                                                                                                                |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `landing.css:67`  | `.hero-ctas`                       | No `flex-wrap` — two buttons overflow at 320px                                                                                                                       |
| `landing.css:60`  | `.hero-tagline` / `.hero-sub`      | `max-width: 44rem` — fixed, not `min(100%, 44rem)`                                                                                                                   |
| `landing.css:543` | `.principles`                      | 4-col at base, only collapses at `32rem` — at 320px the border-inline-end creates visual orphan                                                                      |
| `landing.css:694` | `.console-body`                    | `grid-template-columns: auto 1fr` — `auto` side-nav is fixed-width, causes overflow below 56rem                                                                      |
| `landing.css:713` | `.console-grid`                    | `1fr 1fr` collapses at 56rem but console-body doesn't align with that                                                                                                |
| `landing.css:742` | `.kpi-row`                         | 4-col → 2-col at 56rem → 1-col at 32rem: the 56rem→32rem gap (375–512px) still shows 2 cols                                                                          |
| Header            | `ShellHeader` nav                  | All nav links visible at all widths; no hamburger/off-canvas at mobile                                                                                               |
| `landing.css:308` | `.footer-columns`                  | 3-col → 1-col at `max-width: 32rem` — uses max-width (desktop-first)                                                                                                 |
| `landing.css:335` | Multiple `@media (max-width: ...)` | All breakpoints are desktop-first `max-width`; no mobile-first `min-width` base                                                                                      |
| Various           | `.section`                         | `max-width: 1040px` with `padding: ... var(--cascivo-space-6)` — at 320px `space-6` = 1.5rem each side = 3rem total from 320px = 272px content, acceptable but tight |
| `landing.css:377` | `.json-playground-demo`            | `1fr 1fr` grid → collapses at `max-width: 48rem` (desktop-first)                                                                                                     |
| `.signals-grid`   | `landing.css:920`                  | `2fr` → 1fr at `40rem` (desktop-first)                                                                                                                               |
| `.agents-grid`    | `landing.css:987`                  | `2fr` → 1fr at `56rem` (desktop-first)                                                                                                                               |

## Benchmark patterns adopted

- **Fluid type**: `clamp(min, preferred-vw, max)` on hero-title and section headings
- **Mobile-first base**: all grid/flex base = 1 col; `min-width` enhances upward
- **Off-canvas nav**: signal-driven drawer (`useSignal`, `useSignalEffect`); `useSignals()` first
- **Container queries**: `container-type: inline-size` on grid wrappers (future-proof for docs reuse)
- **Safe-area insets**: `env(safe-area-inset-*)` via `max()` on footer + header padding
- **Touch targets**: all interactive elements ≥ 44×44px
- **`prefers-reduced-motion`**: all transitions/animations gated

## Per-section plan

| Section          | Change                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Header**       | Add signal-driven off-canvas drawer; hide `.nav` (ShellHeader navList) below 48rem; show hamburger toggle |
| **Hero**         | `flex-wrap: wrap` on `.hero-ctas`; buttons full-width < 30rem; clamp on title                             |
| **Principles**   | Already collapses to 1-col at 32rem; add safe padding at 320px                                            |
| **StatsBand**    | `auto-fit minmax(180px, 1fr)` already responsive; verify at 320px                                         |
| **RelayConsole** | Hide side-nav (`.console-side`) at < 48rem; single-col KPIs at < 30rem                                    |
| **SignalsDemo**  | Already collapses at 40rem; verify controls are ≥44px                                                     |
| **ProofTeasers** | `minmax(300px, 1fr)` means single col below 300px; confirm no overflow                                    |
| **AgentLayer**   | Collapses to 1-col at 56rem; add `overflow-x: auto` on `.agent-code`                                      |
| **ThemeDemo**    | `minmax(260px, 1fr)` — single col below 260px; confirm at 320px                                           |
| **QuickStart**   | Same — single col below 260px                                                                             |
| **CtaBand**      | `.cta-band-actions` already has `flex-wrap`; add safe-area-inset-bottom                                   |
| **Footer**       | Already collapses to 1-col at 32rem (desktop-first); safe-area-inset-bottom                               |

## Playwright spec

Written at `apps/landing/test/mobile.spec.ts`. Tests zero horizontal overflow at 320/375/390/414px plus off-canvas nav open/close behaviour.

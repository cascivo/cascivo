# v50 — Mobile-Mode Credibility: Three-Lens Audit (Business · Architect · Designer) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the cascivo landing page's **mobile mode** obey the same credibility bar v49 applied to the desktop
surface, per the audit in `docs/ROADMAP-V50.md`, seeded by a reported bug — *the opened burger menu starts behind the
navbar; it should start below it.* The audit reviewed the phone experience through three lenses and found the
header/drawer system **functionally correct (focus trap, scroll-lock, Escape, scrim) but dimensionally off**: the
drawer renders under the sticky header, four header controls sit below the 44px touch minimum the site itself
advertises, and v49's nav-breakpoint move left a stale `48rem` drawer/scrim cutoff.

Governing thesis (unchanged from v49): **a design system's landing page is its first component** — and most visitors
arrive on a phone. Every fix below makes the mobile surface obey the system's own rules — header-height from one
token, one nav breakpoint, ≥44px coarse targets, safe-area aware.

Deliver: **(T1)** start the drawer below the navbar + standardize the header-height token + bottom safe-area;
**(T2)** reconcile the drawer/scrim hide breakpoint to the v49 `40rem`; **(T3)** give the header controls a
`pointer: coarse` ≥44px floor; **(T4)** host theme/GitHub (and search) in the mobile menu and relieve small-screen
header density; **(T5)** mobile sweep & polish (CtaBand row, SocialProof above-the-fold, 320/360/390/414
verification, gate). Every change is **scoped to the marketing surface's mobile CSS/markup** (plus the existing
tokens it reads). **Do not** redesign the header IA, touch desktop layout, change `ShellHeader` internals, or add
new nav items / content.

Target state (verified after T5):

| Finding (lens · severity)                                  | Today                                                                 | Target                                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M-A1/M-D1 Drawer behind the navbar (arch/design · 🔴)      | `inset-block:0`, `z:100` < header `z:200`, top pad `2rem` < `3rem`     | drawer starts at `var(--cascivo-shell-header-block-size)`; first link fully visible |
| M-A2 Drawer/scrim breakpoint drift (arch · 🟠)            | hide at `min-width: 48rem`                                            | hide at `40rem` (matches toggle / inline-nav / JS `isMobileNav`)                   |
| M-A3/M-B3 Header controls < 44px touch (arch/biz · 🟠)    | 36px, no coarse override                                              | ≥44px under `@media (pointer: coarse)` for every header control                   |
| M-A4 Header height assumed 3 ways (arch · 🟡)             | token `3rem` / fallback `3.5rem` / pad `2rem`                          | single source: `var(--cascivo-shell-header-block-size)`                            |
| M-A5 Drawer ignores bottom safe-area (arch · 🟡)         | no `safe-area-inset-bottom`                                           | bottom padding clears the home indicator                                          |
| M-D2 Small-screen header density (design · 🟠)            | 5 controls + brand on home at 320–360px                              | header trimmed; secondary controls relocated to the menu                          |
| M-D3 Menu omits secondary controls (design · 🟠)         | drawer = nav links only                                              | theme + GitHub (+ search) reachable from the drawer                               |
| M-D4 CtaBand row on mobile (design · 🟡)                 | 2 buttons + copy wrap centered                                       | clean stack/row at 320–414, no jumble                                             |
| M-B2 Above-the-fold integrity (biz · 🟡)                 | SocialProof negative margin unverified on phone                      | hero + CTA + strip render without collision at 360×640                            |
| Full gate (`pnpm ready`)                                  | green                                                                 | green                                                                             |

**Architecture & evidence (reproduced in-repo before planning):**

- **Drawer:** `landing.css:2297` `.mobile-nav-drawer { position: fixed; inset-block: 0; inset-inline-end: 0;
  inline-size: min(320px,85vw); z-index: 100; padding: space-8 space-6; padding-block-start: max(space-8,
  env(safe-area-inset-top)); transform: translateX(100%) }`; `--open` → `translateX(0)`. Hidden at
  `@media (min-width: 48rem)` (`:2346`) along with `.nav-scrim` (`:2290`, `inset:0; z:99`).
- **Header:** `landing.css:3395` `.landing-shell-header { position: sticky; top: 0; z-index: var(--cascivo-z-overlay) }`.
  `--cascivo-z-overlay: 200`, `--cascivo-shell-header-block-size: 3rem` (`packages/tokens/src/index.css:264,270`).
  `ShellHeader` sets its own `block-size: var(--cascivo-shell-header-block-size)` (`shell-header.module.css:6`).
- **Correct idiom already present:** `landing.css:1143` `.scroll-progress { position: sticky; top:
  var(--cascivo-shell-header-block-size, 3.5rem) }` — sits below the header; the drawer should mirror this (note the
  `3.5rem` fallback disagrees with the `3rem` token — fix to one value).
- **Header controls:** `.header-theme-cycle` + `.header-peek-toggle` (`:3409`, `2.25rem`), `.header-icon-link`
  (`:3445`, `2.25rem`), `.header-search-btn` (`:3469`, `block-size: 2.25rem`) — none has a `pointer: coarse` floor.
  `.btn` does (`:2836`), `.mobile-nav-toggle` is `44px` (`:3512`).
- **Header markup:** `Header.tsx` `end` slot = peek-eye (`currentPath === '/'` only) + theme `Dropdown` + `SearchButton`
  + GitHub `<a>`; `onMenuClick`/`menuExpanded` wired only when `isMobileNav = useMediaQuery('(max-width: 39.99rem)')`
  (v49). The drawer `<nav className="mobile-nav-drawer">` lists `PRIMARY_LINKS` + `RESOURCE_LINKS` only.
- **Breakpoints:** v49 moved nav-collapse to `39.99rem`/`40rem` (toggle show + `[role='banner'] nav` hide at
  `landing.css:3545`; JS `isMobileNav`). The drawer/scrim hide at `48rem` was **not** moved — the drift this roadmap
  closes (M-A2).
- **CLAUDE.md constraints:** signals only; `useSignalEffect` for DOM side effects; `useRef` only for DOM; touch
  targets ≥44px under `pointer: coarse` via `var(--cascivo-target-min-coarse, 2.75rem)`; never `display:none` to hide
  content (relocate to a disclosure/drawer); no off-scale breakpoint literals; reduced-motion + forced-colors safe;
  mobile sweep at 320/360/390/414.

**Tech Stack:** Preact + `@cascivo/core` signals in `apps/site`; the existing `ShellHeader`/`Dropdown`/`Tooltip`/
`SearchButton` components; `landing.css` (tokens: `--cascivo-shell-header-block-size`, `--cascivo-z-overlay`,
`--cascivo-target-min-coarse`, safe-area `env()`); no new packages; no `ShellHeader` or component-library changes.

---

## Tranche Overview

| Tranche | Title                                                    | Goal                                                                                                                                                                |
| ------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Drawer below the navbar (the seed bug)                   | Start `.mobile-nav-drawer` at `inset-block-start: var(--cascivo-shell-header-block-size)` so its first link clears the sticky header; normalize the top padding; add `safe-area-inset-bottom` to the bottom padding; replace the three header-height assumptions (token / `3.5rem` fallback / `space-8` pad) with the one token. |
| T2      | Drawer/scrim breakpoint reconciliation                  | Move the `@media (min-width: 48rem)` that hides `.mobile-nav-drawer`/`.nav-scrim` to `40rem`, matching the v49 nav-collapse boundary (toggle, inline-nav, JS `isMobileNav`). No behavior change above 40rem; removes the dead 40–48rem mismatch band. |
| T3      | Touch-target floor for header controls                  | Add a `@media (pointer: coarse)` rule giving `.header-theme-cycle`, `.header-peek-toggle`, `.header-icon-link`, `.header-search-btn` a `min-block-size`/`min-inline-size` of `var(--cascivo-target-min-coarse, 2.75rem)` (≥44px). Keep desktop (`pointer: fine`) density untouched. |
| T4      | Mobile menu completeness + header density               | Add theme switch + GitHub (and optionally search) into the drawer (a controls row at the bottom or top), so they're reachable from the menu; on the smallest screens reduce header `end` density (e.g. drop the duplicated control from the header once it lives in the menu, or gate the home-only peek-eye). Keep everything keyboard-reachable + in the a11y tree (no `display:none` data loss). |
| T5      | Mobile sweep & polish + gate                            | Verify `.cta-band-actions` stacks cleanly at 320–414; confirm the `SocialProof` negative-margin tuck doesn't collide with the hero CTAs and the value prop + a CTA sit above the fold at 360×640; run the 320/360/390/414 overflow + touch sweep; full gate; flip `docs/ROADMAP-V50.md` → Shipped. |

Ordering rationale: **T1 first** (the reported bug, self-contained, highest visible payoff). **T2/T3** are quick
independent correctness wins. **T4** is the one design change with moving parts and wants the header otherwise
settled. **T5** verifies and gates. T1–T4 share the header/drawer CSS and are sequenced for one reviewer.

---

## Files Created / Modified per Tranche

### T1 — Drawer below the navbar

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/landing.css` (`.mobile-nav-drawer`: `inset-block-start` = header-height token, normalize `padding-block-start`, add `safe-area-inset-bottom` to `padding-block-end`; fix `.scroll-progress` fallback to `3rem` to match the token) |

### T2 — Breakpoint reconciliation

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/landing.css` (the `@media (min-width: 48rem)` hiding `.mobile-nav-drawer`/`.nav-scrim` → `40rem`) |

### T3 — Touch-target floor

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/landing.css` (a `@media (pointer: coarse)` block raising the four header controls to `var(--cascivo-target-min-coarse, 2.75rem)`) |

### T4 — Menu completeness + header density

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/sections/Header.tsx` (render a controls row — theme + GitHub (+ search) — inside the `.mobile-nav-drawer`; relieve the small-screen `end` density) |
| Modify | `apps/site/src/marketing/landing.css` (styles for the in-drawer controls row; any small-screen header trim) |

### T5 — Mobile sweep & polish + gate

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site/src/marketing/landing.css` (CtaBand row stack at narrow widths; SocialProof tuck verification/fix if needed) |
| Verify | 320/360/390/414 overflow + touch sweep; `pnpm exec vp check`; `pnpm build`; `pnpm breakpoint:check`; `pnpm fallback:check`; `pnpm links:check`; `pnpm ready` |
| Modify | `docs/ROADMAP-V50.md` (status → Shipped)                                                       |

---

## Key Decisions

### Decision 1 — Start the drawer at the header height, don't raise it above the header (firm)

The drawer is under the sticky header (`z:100` < `z:200`) and its `space-8` top padding (~2rem) is less than the
`3rem` header. **Decision: set `.mobile-nav-drawer { inset-block-start: var(--cascivo-shell-header-block-size); }`
(keep `inset-block-end: 0`) so the drawer occupies the area *below* the bar; leave the header above the drawer/scrim
so it stays visible and the hamburger remains tappable to close.** Mirrors the existing `.scroll-progress` idiom.
Rejected: raising the drawer's `z-index` above the header and padding it down (would cover the header/hamburger,
hiding the close affordance and the brand); a fixed pixel offset (re-introduces the multi-value drift this also
fixes).

### Decision 2 — One header-height source of truth (firm)

The header height is assumed three ways (`3rem` token, `3.5rem` `.scroll-progress` fallback, `space-8` drawer pad).
**Decision: read `var(--cascivo-shell-header-block-size)` for the drawer offset and fix the `.scroll-progress`
fallback to `3rem` so all three agree.** Rejected: leaving the `3.5rem` fallback (harmless only because the var is
always defined — but it's a latent bug and contradicts the token).

### Decision 3 — Reconcile the drawer/scrim breakpoint to 40rem, not re-open 48rem (firm)

v49 T6 moved the nav-collapse to `40rem` but left the drawer/scrim hide at `48rem`. **Decision: move the
`min-width: 48rem` hide to `40rem`** so the drawer/scrim live exactly where the toggle and inline-nav switch.
Functionally the drawer can't open in the 40–48rem band today (the toggle isn't wired there), so this is a
consistency/dead-rule fix with no visible behavior change. Rejected: moving the nav back to 48rem (would re-introduce
the off-scale literal v49 removed).

### Decision 4 — Touch floor via `pointer: coarse`, desktop density untouched (firm)

Four header controls are 36px with no coarse override. **Decision: add a single `@media (pointer: coarse)` rule
giving them `min-block-size`/`min-inline-size: var(--cascivo-target-min-coarse, 2.75rem)`**, matching how `.btn`
already does it; `pointer: fine` (desktop) stays at 36px. This satisfies WCAG 2.2 SC 2.5.8 (a claim the site prints)
without bloating the desktop header. Rejected: enlarging the base size to 44px everywhere (thickens the desktop
header unnecessarily); padding hacks (min-block-size is the project's established pattern).

### Decision 5 — Relocate secondary controls into the menu; don't delete them (recommended)

The header crowds on small screens and the menu omits theme/search/GitHub. **Decision: surface theme + GitHub (and,
if it fits cleanly, search) inside the drawer as a controls row, and trim the small-screen header `end` accordingly
— relocating, never `display:none`-ing, so nothing leaves the a11y tree (CLAUDE's "never hide content" rule).**
Rejected: hiding header controls on mobile with `display:none` (data loss / unreachable); leaving the header crowded
(the M-D2 density complaint stands). Which controls move vs stay is finalized in T4 against the real render.

### Decision 6 — Scope discipline: mobile correctness, not a header redesign (firm)

**Decision: this roadmap fixes the mobile drawer/header dimensions, breakpoints, touch targets, menu completeness,
and a mobile sweep — no header IA redesign, no desktop change, no `ShellHeader` internals, no new nav items or
content.** Rejected: a mobile nav redesign (different effort/reviewers; buries the credibility fixes).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before the final T5 push.
2. **Marketing-mobile blast radius.** Changes stay in `apps/site/src/marketing/{landing.css, sections/Header.tsx}`
   and read existing tokens. No `ShellHeader`/component-library edits, no desktop-layout changes, no token-value
   changes.
3. **Signals, not hooks.** `apps/site` is Preact; Header stays `useSignal`/`useSignalEffect`/`useMediaQuery`/
   `useRef`-for-DOM only; no `useState`/`useEffect`/`useContext`/`useReducer`.
4. **One source of truth for the header height** — `var(--cascivo-shell-header-block-size)`; no new hard-coded header
   heights.
5. **Never hide content.** Header controls move *into* the drawer, not `display:none` away; everything stays
   keyboard-reachable and in the a11y tree.
6. **Touch + a11y.** Every interactive control ≥44px under `pointer: coarse`; focus-visible preserved on relocated
   controls; reduced-motion (drawer transition already guarded) and forced-colors safe; drawer clears top + bottom
   safe-areas.
7. **No off-scale breakpoints.** The drawer/scrim hide moves to the canonical-derived `40rem` boundary; no new
   off-scale literals; `breakpoint:check` clean (note: it scans `packages/` only, but stay on-scale anyway).
8. **Mobile sweep is the gate.** The 320/360/390/414 overflow + touch-target sweep passes before T5 is done; the
   opened drawer is checked at each width and with a notch (safe-area) simulated.
9. **Out-of-scope stays out.** No header redesign, no desktop change, no `ShellHeader` internals, no new content; the
   other `47.99rem` literals (DocsApp shell, Relay console) remain a separate pass.
</content>

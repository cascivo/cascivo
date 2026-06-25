# cascivo — Roadmap v50: Mobile-Mode Credibility — Three-Lens Audit (Business · Architect · Designer)

**Last updated:** 2026-06-25
**Status:** ✅ Shipped — T1–T5 implemented (drawer below the navbar; 40rem breakpoint reconciliation; 44px
header touch targets; theme/GitHub relocated into the mobile menu; mobile sweep + SocialProof collision fix +
320px overflow fix). Verified in a real headless Chromium at 320/360/390/414.
**Plan documents:** `docs/superpowers/plans/2026-06-25-v50-master-plan.md` + tranches 1–5
**Builds on:** the v49 landing-page work and the mobile surface in `apps/site/src/marketing/*` — the header +
off-canvas drawer (`sections/Header.tsx`, the `.mobile-nav-drawer` / `.nav-scrim` / `.mobile-nav-toggle` rules in
`landing.css`), the sticky `.landing-shell-header`, the `ShellHeader` component
(`packages/components/src/shell-header/*`), and the design tokens `--cascivo-shell-header-block-size` (`3rem`) and
`--cascivo-z-overlay` (`200`) in `packages/tokens/src/index.css`.

> **Source of this roadmap.** The same three-lens review applied in v49 — **business decision maker** (does mobile
> convert and earn trust?), **architect** (is the mobile surface correct and consistent?), **designer** (is the
> phone experience pixel-honest?) — now aimed at **mobile mode**, seeded by a reported bug: *the opened burger menu
> starts behind the navbar; it should start below it.* Same governing thesis as v49: **a design system's landing
> page is its first component** — and most of its visitors arrive on a phone. A menu that opens broken on mobile
> undercuts the "we sweat the details" pitch on the exact device where the first impression is made.

---

## Why this roadmap exists

Mobile is the majority surface and the harshest credibility test: small viewports expose z-index, safe-area, and
touch-target mistakes that desktop hides. The audit found the mobile header/drawer system is **functionally wired
(focus trap, scroll-lock, Escape, scrim — all correct) but visually and dimensionally off**: the drawer renders
*under* the sticky header, several header controls are below the touch-target minimum the site itself advertises,
and v49's nav-breakpoint move left a stale `48rem` drawer/scrim cutoff. None is catastrophic alone; together they
make the menu — the single most-used mobile control — feel unfinished.

### Framing: the seed bug is a z-index + offset mistake, not a missing feature

The drawer is positioned `inset-block: 0` (top of viewport) at `z-index: 100`, while `.landing-shell-header` is
`position: sticky; top: 0; z-index: var(--cascivo-z-overlay)` = **200**. So the header paints over the drawer's top,
and the drawer's `padding-block-start` of `var(--cascivo-space-8)` (~2rem) is **less than the header's 3rem**, so the
first nav link sits behind the bar. The codebase already knows the correct idiom — `.scroll-progress` uses
`top: var(--cascivo-shell-header-block-size, …)` to sit *below* the header — the drawer simply doesn't. The fix is to
start the drawer at the header height, not the viewport top.

---

## The findings, verified against today's code

Legend: ✅ correct today (leave it) · ⚠️ partially right / at-risk · ❌ genuine gap. Severity is impact on mobile
*credibility, conversion & accessibility*.

### Lens 1 — Architect (is the mobile surface correct and consistent?)

| #     | Finding (severity)                                          | Verified state today                                                                                                                                  | Tranche |
| ----- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-A1  | Drawer renders behind the sticky header (🔴)                | ❌ `.mobile-nav-drawer` is `inset-block: 0; z-index: 100` (`landing.css:2297`); `.landing-shell-header` is `sticky; top:0; z-index:200` (`:3398`). Top padding `space-8` (~2rem) < header `3rem` → first link(s) obscured. The reported bug. | T1      |
| M-A2  | Drawer/scrim hide breakpoint drifted from the nav (🟠)      | ❌ `.mobile-nav-drawer`/`.nav-scrim` hide at `@media (min-width: 48rem)` (`landing.css:2346`), but v49 T6 moved the nav-collapse (toggle + inline-nav + JS `isMobileNav`) to **40rem**. The hide cutoff should be 40rem too. | T2      |
| M-A3  | Header controls below the 44px touch minimum (🟠)           | ❌ `.header-theme-cycle`, `.header-peek-toggle` (`:3409`), `.header-icon-link` (`:3445`), `.header-search-btn` (`:3469`) are all `2.25rem` (36px) with **no `@media (pointer: coarse)` bump**. CLAUDE mandates ≥44px coarse; `.btn` + the hamburger already comply — these don't. | T3      |
| M-A4  | Header height assumed three different ways (🟡)             | ⚠️ token `--cascivo-shell-header-block-size: 3rem`; `.scroll-progress` fallback `3.5rem` (`:1145`); drawer top padding `space-8` ≈ `2rem`. Three values for one dimension — fragile. Standardize on the token. | T1      |
| M-A5  | Drawer ignores bottom safe-area (🟡)                        | ⚠️ drawer pads `space-8`/`space-6` with a top safe-area max but **no `safe-area-inset-bottom`**; with 11 links the last can fall under the home indicator on notched phones. | T1      |

### Lens 2 — Designer (is the phone experience pixel-honest?)

| #     | Finding (severity)                                          | Verified state today                                                                                                                                  | Tranche |
| ----- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-D1  | Opened menu's first item is clipped by the bar (🔴)         | ❌ design framing of M-A1 — the menu should slide in cleanly *below* the navbar, not tuck its first row behind it. The most-used mobile control looks broken. | T1      |
| M-D2  | Header control density on small screens (🟠)                | ⚠️ On home the `end` slot renders peek-eye **+** theme **+** search **+** GitHub, plus brand and the hamburger — 5 controls + brand at 320–360px. The peek-eye (home-only) is a 5th control that crowds the smallest viewports. | T4      |
| M-D3  | The menu omits the secondary controls (🟠)                  | ⚠️ The drawer lists nav links only; theme-switch, search, and GitHub (the cramped 36px header icons) are **not** reachable from the menu. A mobile menu should host them, relieving the header. | T4      |
| M-D4  | CtaBand action row on mobile (🟡)                           | ⚠️ v49 T3 added a 2nd button ("Read the docs"); `.cta-band-actions` is `flex-wrap: wrap; justify-content: center` (`:1816`) so two buttons + the copy-command can wrap into a centered jumble on narrow screens. Verify it stacks cleanly. | T5      |

### Lens 3 — Business decision maker (does mobile convert and earn trust?)

| #     | Finding (severity)                                          | Verified state today                                                                                                                                  | Tranche |
| ----- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-B1  | A broken-looking menu is a trust leak on the majority device (🟠) | ⚠️ conversion/trust framing of M-A1/M-D1 — the first interaction many mobile visitors take is opening the menu; a clipped first row reads as "unfinished" on the device most of them use. | T1      |
| M-B2  | Above-the-fold integrity on a phone (🟡)                    | ⚠️ The v49 `SocialProof` strip uses `margin-block-start: calc(-1 * space-8)` to tuck under the hero; confirm at 360×640 that hero + a CTA + the strip render without collision and the value prop is visible without scrolling. | T5      |
| M-B3  | Touch-target compliance is a claim the site makes (🟡)      | ⚠️ The site advertises **WCAG 2.2 AA** — and 2.2's new SC 2.5.8 sets a minimum target size. 36px header controls undercut a conformance claim the marketing surface itself prints (and an EAA/accessibility selling point). | T3      |

**Net:** one z-index/offset mistake (M-A1) makes the menu look broken; one stale breakpoint (M-A2) and one
touch-target gap (M-A3) are quick correctness wins; the header-density/menu-completeness pair (M-D2/M-D3) is the
one design improvement with real UX upside. Everything else is polish + a mobile sweep.

---

## Tranche map

| Tranche | Lens(es)              | Theme                                                                                                          |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| T1      | Architect + Designer + Business | **Drawer below the navbar** — start the drawer at the header height (M-A1/M-D1/M-B1), standardize the header-height token (M-A4), add bottom safe-area (M-A5). The seed bug. |
| T2      | Architect             | **Breakpoint reconciliation** — move the drawer/scrim hide from `48rem` to the v49 nav breakpoint `40rem` (M-A2). |
| T3      | Architect + Business  | **Touch targets** — give the header controls a `pointer: coarse` ≥44px floor (M-A3/M-B3).                       |
| T4      | Designer              | **Menu completeness + header density** — host theme/GitHub (and search) in the drawer; trim the small-screen header (M-D2/M-D3). |
| T5      | Designer + Business   | **Mobile sweep & polish** — CtaBand row (M-D4), SocialProof above-the-fold (M-B2), the 320/360/390/414 overflow + touch sweep, gate. |

Ordering rationale: **T1 first** — it's the reported bug and a self-contained CSS fix with immediate visible payoff.
**T2/T3** are quick, independent correctness wins (a stale literal; a missing coarse floor). **T4** is the one design
change with moving parts (relocating controls) and depends on the header being otherwise settled. **T5** verifies the
whole mobile surface at the standard widths and lands the gate. T1–T4 touch overlapping header/drawer CSS and are
sequenced for one reviewer.

---

## Out of scope

- No redesign of the header's information architecture beyond relocating the existing controls; no new nav items.
- No change to the desktop layout, the component library, or `ShellHeader` internals (only the landing's
  consumption of it).
- The other off-scale `47.99rem` literals flagged in v49 (`app.css` DocsApp shell, the Relay console demo) remain a
  separate scale-pass; this roadmap touches only the nav drawer/scrim breakpoint (M-A2).
- No new mobile-only content or sections.

---

## Definition of done (verified after T5)

- The opened drawer starts flush below the navbar (no link behind the bar) and clears the bottom safe-area; the
  header-height comes from `var(--cascivo-shell-header-block-size)` everywhere.
- The drawer/scrim hide at the same `40rem` boundary as the toggle, inline-nav, and JS `isMobileNav`.
- Every interactive header control meets ≥44px under `@media (pointer: coarse)`.
- Theme, GitHub (and search) are reachable from the mobile menu; the small-screen header no longer crowds.
- CtaBand actions and the SocialProof strip render cleanly at 320/360/390/414 with no overflow; the value prop +
  a CTA are visible above the fold at 360×640.
- `pnpm ready` green; `breakpoint:check` + `fallback:check` + `links:check` clean; the mobile overflow + touch
  sweep passes at 320/360/390/414.

---

## Implementation log (2026-06-25)

Verified with a real headless Chromium (`/opt/pw-browsers/chromium`) serving the production `dist` at
320/360/390/414, opening the drawer and measuring geometry.

- **T1 — Drawer below the navbar.** `.mobile-nav-drawer` now starts at `inset-block-start:
  var(--cascivo-shell-header-block-size)` with `inset-block-end: 0`, normalized top padding, and a
  `max(space-8, env(safe-area-inset-bottom))` floor; `.scroll-progress` fallback corrected `3.5rem → 3rem`.
  **Measured:** header bottom = 48px, drawer top = 48px, first link top = 72px → `firstLinkClearsHeader: true`. The
  reported bug is fixed (screenshot confirms "Docs" sits below the bar, header fully visible).
- **T2 — Breakpoint reconciliation.** The drawer/scrim hide moved `48rem → 40rem`. Verified at 360px the inline nav
  is `display:none` and the hamburger shows; at ≥40rem the inline nav returns.
- **T3 — Touch targets.** Added a `@media (pointer: coarse)` floor of `var(--cascivo-target-min-coarse, 2.75rem)` to
  the four header controls. **Measured:** peek + search render at 44×44 in a touch context (were 36px); desktop
  (`pointer: fine`) unchanged.
- **T4 — Menu completeness + header density.** Theme + GitHub relocated into a `.mobile-nav-controls` row inside the
  drawer (gated by `isMobileNav`), shared render helpers keep desktop + drawer in sync. **Verified:** on mobile the
  header carries only hamburger + peek (home) + search; the drawer exposes theme + GitHub (`controlsPresent: true`).
- **T5 — Mobile sweep & polish.** `.cta-band-actions` stacks column/stretch under `40rem`. The browser sweep caught
  **two real issues the static read missed**, both fixed:
  1. **SocialProof collision** — the v49 `margin-block-start: calc(-1 * space-8)` tuck overlapped the hero's
     copy-command on the taller mobile hero; reset to a positive `space-4` under `40rem` (now a 40px gap, no
     collision at any width).
  2. **320px horizontal overflow** — the AdvantageCarousel tab cards (`.adv-card`, a 2-col grid) couldn't shrink
     (`min-width: auto`), pushing ~7px past the viewport; added `min-inline-size: 0` so the tagline wraps. All four
     widths now report `scrollWidth == clientWidth` (no overflow).

### Notes / out-of-scope observations

- `.mobile-nav-toggle` + `.hamburger-bar` in `landing.css` appear to be **unused** — the actual hamburger is
  `ShellHeader`'s own `_menuButton` (this is what the JS `isMobileNav` wires and what the browser test clicked). The
  v50 findings referenced `.mobile-nav-toggle` as "the hamburger"; the *behavior* is correct (the real toggle works),
  but those landing classes look like dead CSS — flagged for a follow-up cleanup, not removed here (out of the
  mobile-fix scope, and entangled like the v49 orphan CSS).
- The SocialProof collision + 320px carousel overflow were **pre-existing from v49** (not introduced by v50) but were
  in the path of the T5 mobile sweep, so they were fixed here.
- The pre-existing repo-wide `regen` drift documented in v49 remains independent of this work; no regen output was
  committed.
</content>

# cascivo — Roadmap v20: Responsive by DNA (mobile-first by default)

**Last updated:** 2026-06-14
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-14-v20-master-plan.md` + tranches 1–7

---

## Vision

cascivo's tagline is "the CSS-native, signal-driven, AI-first React design system." Three of those
adjectives are enforced in the codebase today. The fourth implicit promise — **it just works on a
phone** — is not. It works _sometimes_, where an author remembered to add a media query.

A file-level audit of tokens, components, layouts, and the demo blocks found a system with good
_bones_ for responsiveness (the `AppShell` collapses to a drawer, control-height tokens exist, touch
targets clear the WCAG floor) but no _spine_: responsiveness is opt-in per component, breakpoints are
magic numbers copied between files, fluid type lives only in the docs app, and the flagship demo
(`ConsoleApp`) renders a seven-column table and an inline-styled aside that overflow or vanish on a
phone. Nothing makes "mobile-first" the path of least resistance, so it is routinely the path not
taken.

> Concept: **"Responsive by DNA."** Make mobile-friendliness a structural property of the system, not
> a per-component afterthought. A canonical breakpoint scale becomes the single source of truth; fluid
> type/space and coarse-pointer touch targets ship at the token layer; a lint + a generalized
> mobile-overflow sweep make "no horizontal scroll, reachable controls, nothing lost on small screens"
> a CI gate. The goal an author should never have to think about: **drop a cascivo component on a 320px
> screen and it is usable, legible, and tappable — by default.** `ConsoleApp`, the block that
> demonstrates the whole app, becomes the proof.

## The audit (finding → today → fix v20 ships)

Severity: 🔴 broken/foundational · 🟡 not-ideal · 🔵 polish. Every row is a real finding with a file
reference, cross-checked against 2026 best practice.

| #   | Sev | Finding                                             | Today (file)                                                                                                                                  | Fix v20 ships                                                                                                                                          |
| --- | --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 🔴  | No canonical breakpoints — magic numbers everywhere | `64rem` (`app-shell.module.css:63`, `shell-state.ts:35`); `40rem` (columns/grid/header); `30/28rem`, `480px` (docs)                           | A single `--cascivo-screen-{sm,md,lg,xl}` scale: documented rem values + JS constants (`@cascivo/tokens`); a lint flags off-scale widths               |
| 2   | 🔴  | Responsiveness is opt-in, not the default           | Only **43/121** component+layout CSS files have any `@media`; `@container` in **8**; `clamp()` in **3**                                       | A "responsive by default" authoring rule + a generalized mobile-overflow Playwright sweep; a fix without a passing mobile test isn't done              |
| 3   | 🔴  | `ConsoleApp` content is not mobile-usable           | `console-app.tsx`: main is a 7-col inline-styled `<table>` (overflows); aside content inline-styled, `display:none` < 64rem                   | Rebuild content responsively: table → stacked cards < md; aside content relocates to a disclosure/drawer (not dropped); its own mobile e2e             |
| 4   | 🟡  | Touch targets meet only the WCAG floor              | `target-size.test.ts` enforces ≥24px; `button.module.css:32–46` hardcodes `2/2.5/3rem` and ignores `--cascivo-control-height-*`               | Interactive controls consume the control-height tokens (one source) and reach ≥44px effective on `@media (pointer: coarse)`; desktop density unchanged |
| 5   | 🟡  | No fluid typography/spacing at the token layer      | Fixed `--cascivo-text-*`; `clamp()` only in `apps/docs/src/app.css`                                                                           | clamp()-based fluid type (+ optional fluid space) tokens in `@cascivo/tokens`; fixed tokens stay as the static fallback                                |
| 6   | 🟡  | Overlays lack mobile patterns                       | Modal relies on `max-width: calc(100vw - gap)` only (`modal.module.css:71`); Dropdown `min-inline-size:10rem` can overflow; Tabs don't scroll | Modal → bottom-sheet/fullscreen < md; Dropdown/Select width-capped to viewport; Tabs horizontally scrollable with no overflow                          |
| 7   | 🟡  | Blocks delegate everything to one 64rem breakpoint  | Blocks (sidebar-app, users-table-page, settings-form-page, stats-cards…) have no block-level adaptation; aside `display:none` drops content   | Blocks adopt the canonical scale + container queries; complementary content relocates instead of vanishing                                             |
| 8   | 🟡  | No mobile coverage outside the landing app          | Only `apps/landing/test/mobile.spec.ts` (320/375/390/414); components, layouts, blocks, storybook have none                                   | A reusable mobile-overflow + touch-target sweep across components/blocks; `ConsoleApp` gets a dedicated mobile e2e                                     |
| 9   | 🔵  | Storybook can't review mobile                       | `.storybook/main.ts` has no viewport addon; `preview.tsx:18` frame fixed at `min(26rem, 90vw)`                                                | Viewport presets (xs/sm/md/lg from the canonical scale) + a mobile-first default frame with a desktop toggle                                           |
| 10  | 🔵  | Responsiveness is undocumented as DNA               | Strategy lives only in `app-shell.module.css` comments; `CLAUDE.md` authoring rules never mention mobile/breakpoints/touch                    | A "Responsive by default" section in `CLAUDE.md` authoring rules + a docs page; optional `responsive` note in the manifest                             |

## Non-goals (explicitly out of scope)

This is a foundation-and-defaults pass, not a redesign or a feature release.

| #   | Claim                                      | Substance                                                                                                                                        |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| —   | **No new components / themes**             | v20 makes the existing surface responsive. New components go through the dark factory under the new authoring rule.                              |
| —   | **No visual redesign**                     | Desktop appearance and density are preserved. Mobile behavior is added _below_ the canonical breakpoints; the desktop layout is unchanged.       |
| —   | **No `var()` inside media queries**        | A known CSS limitation (see Decision 1). v20 does **not** pretend breakpoints are live custom properties; it makes them a lint-guarded constant. |
| —   | **No JS-driven layout where CSS suffices** | Responsiveness is CSS-first (`@media`/`@container`). The only JS is the existing `matchMedia` drawer logic, extended via `useSignalEffect`.      |

## Workstreams

| #   | Workstream                  | Tranche | Summary                                                                                                                              |
| --- | --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| A   | Responsive token foundation | T1      | Canonical `--cascivo-screen-*` scale + JS constants; clamp() fluid type (+ optional fluid space); coarse-pointer target tokens.      |
| B   | Enforcement & authoring DNA | T2      | `breakpoint:check` lint (off-scale width literals); generalized mobile-overflow + touch-target Playwright harness; `CLAUDE.md` rule. |
| C   | Interactive primitives      | T3      | Button et al. consume control-height tokens; ≥44px on `pointer: coarse`; fluid sizing where apt. Enroll in the sweep.                |
| D   | Overlays & navigation       | T4      | Modal → sheet/fullscreen < md; Dropdown/Select viewport-capped; Tabs scrollable; Toast. Enroll in the sweep.                         |
| E   | Layout shells & blocks      | T5      | `AppShell` 64rem → canonical scale; blocks adopt container queries; aside content relocates, never dropped.                          |
| F   | ConsoleApp flagship rebuild | T6      | Table → cards < md; aside → disclosure/drawer; full keyboard + signal correctness; dedicated mobile e2e.                             |
| G   | Storybook + docs + close    | T7      | Storybook viewport presets + mobile-first frame; docs page; `CLAUDE.md`/manifest notes; full gate; roadmap close.                    |

## Decisions baked in

1. **Breakpoints are a lint-guarded constant, not a live `var()`.** CSS `@media`/`@container` width
   conditions **cannot read custom properties** — `@media (max-width: var(--x))` does not work in any
   browser, and `@custom-media` needs a PostCSS plugin we don't run. So the canonical scale ships two
   ways: (a) documented rem values authors copy into `@media`/`@container`, and (b) JS constants
   (`SCREEN.md` etc.) for `matchMedia` in `shell-state.ts` and Playwright. A `breakpoint:check` lint
   makes the two impossible to drift by flagging any width media/container literal not on the scale.
   This is the honest design given the platform; we do not fake reactivity that isn't there.
2. **Canonical scale (re-verify the load-bearing values at implementation).** `sm 30rem`, `md 40rem`,
   `lg 64rem`, `xl 80rem`. `40rem` and `64rem` already carry the system (columns/grid/header at 40rem;
   the shell drawer at 64rem) — the scale _names_ existing reality rather than inventing new breakpoints.
   The docs app's `30rem`/`28rem`/`480px` strays migrate onto `sm`/`md`.
3. **Mobile-first, CSS-first.** New responsive CSS is authored mobile-first (base styles target the
   smallest screen; `min-width`/`min container` queries layer on enhancements). Prefer `@container`
   (component adapts to its slot) over `@media` (component adapts to the viewport) wherever a component
   can be placed in arbitrary containers. JS layout only where CSS cannot express it.
4. **Touch targets: keep the WCAG floor, add a comfortable coarse-pointer target.** `target-size.test.ts`
   (≥24px, WCAG 2.5.8) stays. v20 raises interactive controls to **≥44px effective** under
   `@media (pointer: coarse)` so phones/tablets get comfortable targets while desktop density is
   untouched. Controls consume `--cascivo-control-height-*` as the single source — Button's hardcoded
   `2/2.5/3rem` is a bug to fix, not a value to preserve.
5. **Nothing disappears on small screens.** Hiding complementary content with `display:none` (today's
   aside) is data loss, not responsiveness. Where space forces it, content **relocates** (disclosure,
   drawer, bottom sheet) and stays reachable by keyboard and screen reader.
6. **Responsive is a gate, not a guideline.** A generalized mobile-overflow + touch-target Playwright
   sweep (extending `apps/landing/test/mobile.spec.ts`) runs across components and blocks. Each later
   tranche enrolls the surfaces it touches; a fix without a passing mobile test for the touched surface
   is not done. The sweep starts small and grows so CI stays green throughout.
7. **Signal + authoring rules hold.** Any touched component reading `signal.value` during render calls
   `useSignals()` first; DOM/`matchMedia` side effects use `useSignalEffect`, never `useEffect`; no
   `useState`/`useContext`. `@function`/`if()` usage keeps its static fallback (`fallback:check`).
   Tokens export source CSS (no `dist`), so no new vite aliases are required.
8. **Desktop is frozen.** Every change is additive below the canonical breakpoints or a
   token-consumption refactor that yields the same computed desktop value. Desktop screenshots and the
   existing a11y/visual checks must not move.
9. **`ConsoleApp` is the acceptance demo.** It is named in the request as the block that "demonstrates
   the app." Its responsive rebuild (T6) and dedicated mobile e2e are the headline proof that the DNA
   work reaches the surface a viewer actually sees.
10. **Manifest stays light.** A `responsive` descriptor in `ComponentMeta` is _optional_ and, if added,
    is a non-required field to avoid a full-registry regen churn. The authoring rule lives in
    `CLAUDE.md`; the test gate enforces it. We document the DNA; we don't bureaucratize it.

## Definition of Done

- [ ] A canonical `--cascivo-screen-{sm,md,lg,xl}` scale ships in `@cascivo/tokens` with matching JS
      constants; `shell-state.ts` and the mobile harness consume the constants, not literals. _Verify: T1._
- [ ] clamp()-based fluid type tokens (and optional fluid space) ship with the fixed tokens preserved as
      the static fallback; no desktop computed value regresses. _Verify: T1._
- [ ] `breakpoint:check` fails on any `@media`/`@container` width literal not on the canonical scale
      (allowlist for sanctioned exceptions); it runs in the pre-commit/CI check set. _Verify: T2._
- [ ] A reusable mobile-overflow + touch-target Playwright sweep exists and runs against an enrolled set
      that grows each tranche; zero horizontal overflow at 320/360/390/414 across enrolled surfaces. _Verify: T2–T6._
- [ ] Interactive controls consume `--cascivo-control-height-*` and reach ≥44px under
      `@media (pointer: coarse)`; `target-size.test.ts` still passes. _Verify: T3._
- [ ] Modal renders as a bottom-sheet/fullscreen below `md`; Dropdown/Select never overflow a 320px
      viewport; Tabs scroll horizontally without overflow. _Verify: T4._
- [ ] `AppShell` uses the canonical `lg` breakpoint (no raw `64rem`); blocks adapt via container queries;
      complementary content relocates instead of `display:none`. _Verify: T5._
- [ ] `ConsoleApp` is fully usable at 320px: the table stacks into cards, the aside is reachable via a
      disclosure/drawer, nothing overflows, all controls are ≥44px; a dedicated mobile e2e passes. _Verify: T6._
- [ ] Storybook exposes xs/sm/md/lg viewport presets and defaults to a mobile-first frame with a desktop
      toggle. _Verify: T7._
- [ ] `CLAUDE.md` gains a "Responsive by default" authoring rule; a docs page documents the breakpoint
      scale + patterns. _Verify: T7._
- [ ] Full CLAUDE.md gate exits 0 (`vp check` → build → `vp run -r check` → test → regen + diff). _Verify: T7._
- [ ] `ROADMAP-V20.md` DoD boxes all checked; status → ✅ Shipped. _Verify: T7._

## Deferred (do not re-litigate in v20)

- **`@custom-media` / PostCSS preprocessing** to let `@media` read tokens directly — a build-pipeline
  change to alpha `vp`/Rolldown; the lint-guarded constant is the right-sized fix for now.
- **Container-query units (`cqi`/`cqw`) for fluid type** — clamp() with viewport units ships the value;
  cq-unit fluid type per-component is a follow-up once `@container` coverage is broad.
- **A full visual-regression (pixel-diff) mobile suite** — T2's overflow + touch-target sweep is the
  high-value subset; per-breakpoint screenshot diffing is a later hardening pass.
- **Reworking every one of the ~118 components** — v20 makes the _foundation_ responsive and fixes the
  worst offenders (overlays, blocks, ConsoleApp). The authoring rule + gate carry the long tail forward
  via the dark factory.
- **Mobile gestures (swipe-to-close sheets, pull-to-refresh)** — tap/keyboard parity is the v20 bar;
  gesture affordances are a separate effort.

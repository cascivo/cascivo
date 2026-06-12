# cascade — Roadmap v9: Signs of Life

**Last updated:** 2026-06-12
**Status:** 🟡 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-12-v9-master-plan.md` + tranches 1–5

---

## Vision

The landing page is cascade's storefront, and right now the storefront has dead light bulbs:
the flagship "count the re-renders" demo shows 0 commits forever, the ops console's switches
don't switch, and two of the five themes render invisible form labels. v9 makes everything on
the page **actually work**, then makes it **feel alive** — a ticking traffic chart, a pulsing
incident light, scroll-reveal motion — and ships the one missing piece of app chrome the shell
needs: a **top loading bar** clients can drive (progress + error states).

> Concept: **"Signs of life."** A design system that markets fine-grained reactivity must
> demonstrate it. Every interactive element on the landing page must respond; every motion
> must be purposeful, token-driven, and `prefers-reduced-motion`-safe.

## The diagnosis

1. **The landing app is React, but half its components forget the React signals contract.**
   `@cascade-ui/core` re-exports `@preact/signals-react` — in a plain React app (no Babel
   transform), any component that reads `signal.value` during render **must call
   `useSignals()`** or it never re-subscribes. `Header.tsx` does this; `FlagsRegion`,
   `DeploysRegion`, `SignalsDemo` and `CopyCommand` don't. Result: toggles don't toggle, the
   "New deploy" modal never opens (the handler fires, the re-render never happens), copy
   buttons never flip to "Copied", and the re-render counters stay at 0. The dashboard isn't
   missing features — it's missing four one-line subscriptions.
2. **React `<Profiler>` is a no-op in production bundles.** Even with `useSignals()` fixed,
   the SignalsDemo counters can't move on the deployed page: production `react-dom` compiles
   `onRender` away. The landing build needs the profiling bundle
   (`react-dom/profiling`) aliased in, or the demo needs explicit instrumentation.
3. **Theme token parity is broken.** `light/dark/warm` define 55 semantic tokens;
   `flat`/`minimal` define 31. The missing 24 include the whole `--cascade-color-text*`
   family — which is why Input labels vanish in the "One form, five personalities" demo for
   flat and minimal. Nothing guards against this class of bug today.
4. **The ops console is squashed and static.** Cards sit at `padding="sm"` with
   `--cascade-space-3` gaps; the deploys table is `density="compact"`; the SideNav renders
   fallback dots because no icons are passed (the component supports them); the titlebar is
   two inert spans; every chart datum is a constant.
5. **Layout and polish gaps.** The "Agents don't screenshot. They render." artifact is
   crammed into one column of a two-column grid; QuickStart step 3 is the only code block
   without a copy button (and uses a hardcoded `#24292e` background); the page has zero
   entrance motion while every modern landing page breathes.
6. **The app shell has no loading affordance.** `AppShell` (packages/layouts) has header /
   nav / main / aside / footer and a signal-driven `ShellState` — but no way for an app to
   say "I'm fetching" or "that failed". `ProgressBar` exists as a form-level component; the
   shell-level top loading bar (the GitHub/YouTube pattern) does not.

## Workstreams

| #   | Workstream          | Tranche | Summary                                                                                                                                                   |
| --- | ------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Fix what's broken   | T1      | `useSignals()` sweep across landing components; profiling-build alias so Profiler counters work in prod; theme token parity (flat/minimal) + parity test. |
| B   | Shell loading bar   | T2      | `ShellState` gains a loading API (`start/setProgress/finish/fail`); `AppShell` renders a top progress bar + dismissible error alert; tests + manifest.    |
| C   | Ops console upgrade | T3      | Spacing pass (gaps, card padding, table density), SideNav icons, titlebar menu, live motion: ticking traffic chart + pulsing incident light.              |
| D   | Landing polish      | T4      | Agent-render artifact goes full-width; QuickStart step 3 gets a copy button; scroll-reveal entrance animation for all sections.                           |
| E   | Quality gates       | T5      | Reduced-motion audit, signals-subscription grep gate, CLAUDE.md rule, axe + eyeball matrix, full regen/drift, DoD walkthrough.                            |

## Decisions baked in

1. **`useSignals()` is mandatory in React-app components that read signals during render.**
   This becomes a written rule (CLAUDE.md) and a grep gate (T5). The docs app is Preact
   (native reactivity) — the rule binds React apps: landing, examples, bench.
2. **The SignalsDemo counters stay honest.** Plan A: alias `react-dom/client` →
   `react-dom/profiling` in the landing Vite config so real Profiler commits drive the
   badges in production. Plan B (only if the alias fights vite+/Rolldown): explicit render
   counters incremented inside the form components. No fake numbers, ever.
3. **Theme parity is contract, not convention.** Every theme CSS file must define the
   identical set of semantic custom properties. A vitest asserts key-set equality across all
   five themes; flat and minimal gain the missing 24 tokens with values chosen in each
   theme's own character (flat: pure hues, hard edges, zero radius stays zero).
4. **The loading bar lives in the shell, not in a new component package entry.** It's shell
   chrome driven by `ShellState` — `loadingProgress: Signal<number | null>` (null = hidden,
   0–1 = determinate) and `loadingError: Signal<string | null>`, with methods
   `startLoading()`, `setLoadingProgress(f)`, `finishLoading()`, `failLoading(msg?)`,
   `clearLoadingError()`. Copy-paste users get it with `app-shell`; no new registry entry.
5. **Determinate only.** "The client can update the progress" is the spec. No indeterminate
   shimmer mode in v9 (YAGNI) — `startLoading()` shows the bar at 0 and a thin CSS
   transition makes growth smooth. Width uses logical `inline-size`, so RTL runs
   inline-start → inline-end for free.
6. **Loading errors are visible and dismissible.** `failLoading('message')` turns the bar
   destructive and renders a `role="alert"` strip under the header with the message and a
   dismiss button (label from the i18n builtin catalog — component chrome rule applies).
7. **Console spacing fixes are landing-level first.** Gaps move from `space-3`/`space-4` to
   `space-4`/`space-6`, KPI/flag cards move `sm` → `md` padding, the deploys table drops
   `density="compact"`. Core `Card`/`DataTable` defaults are audited against docs +
   Storybook; core changes only if the same cramping reproduces there (explicit audit step,
   not a default assumption).
8. **Motion is purposeful and bounded.** Three motion elements in the console: the traffic
   chart ticks (~2s cadence, signal-driven, pauses when the tab is hidden), the incident
   alert gets a pulsing status dot, the `building` deploy badge breathes. All gated behind
   `prefers-reduced-motion: no-preference`. No parallax, no gradient shimmer, no slop.
9. **Scroll reveal is CSS + one IntersectionObserver.** Sections start
   `opacity: 0; translate: 0 0.75rem` and transition in when ≥15% visible, once. Reduced
   motion disables it entirely (content visible immediately). No animation library.
10. **SideNav icons come from `@cascade-ui/icons`.** Overview→`Dashboard`, Deploys→`Zap`,
    Incidents→`AlertTriangle`, Traffic→`Activity`, Flags→`Tag`, Settings→`Settings`. The
    landing app adds the icons dependency **and** the source alias in its Vite config
    (icons exports point at `dist/` — the CLAUDE.md workspace-alias rule applies).
11. **The titlebar gets a real menu.** `Menu`/`MenuTrigger`/`MenuItem` on the right side of
    the console titlebar (View status page / Copy incident link / Sign out — demo actions
    fire toasts). The titlebar stops being two inert spans.

## Definition of Done

- [ ] Every Toggle in the console flips on click; "New deploy" opens the modal; deploying
      fires the toast; copy buttons flip to "Copied" — verified in a **production build**
      (`vp build` + `vp preview`), not just dev.
- [ ] SignalsDemo: typing 10 characters in the useState form shows ≥10 commits on the right
      badge and ≤1 on the left badge, in the production build.
- [ ] All five themes render visible Input labels in the hero ThemeDemo; the theme-parity
      vitest fails if any theme omits a semantic token the others define.
- [ ] `AppShell` renders a top loading bar driven by `ShellState`: `startLoading()` shows it
      at 0, `setLoadingProgress(0.6)` animates to 60%, `finishLoading()` completes and hides
      it, `failLoading('msg')` turns it destructive and shows a dismissible `role="alert"`
      message. All covered by component tests.
- [ ] Console: SideNav shows six icons (no fallback dots), titlebar menu opens with three
      working items, traffic chart ticks every ~2s when visible, incident dot pulses,
      spacing matches the v5 design language (no `space-3` card gaps).
- [ ] Agent-render artifact spans the full `.agents-grid` width at desktop.
- [ ] All three QuickStart steps have working copy buttons; `#24292e` is gone.
- [ ] Sections fade in on scroll; with `prefers-reduced-motion: reduce` every section is
      fully visible with zero animation (Playwright-verified or manually recorded in T5).
- [ ] CLAUDE.md documents the `useSignals()` React-app rule; the T5 grep gate passes.
- [ ] Full local CI gate exits 0: `vp check`, build, type check, tests, regeneration +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v9)

- Indeterminate loading-bar mode and route-change auto-wiring (router integration) — wait
  for real demand; determinate covers the stated need.
- Animating KPI numbers / sparklines in the console — three motion elements is the budget;
  more is noise.
- A generic `TopLoader` standalone registry component — shell-first; extract only if a
  second consumer appears.
- Scroll-linked animations (`animation-timeline: scroll()`) — browser support not yet in
  the target matrix; revisit.
- SignalsDemo redesign (richer benchmark visualization) — fix what exists first; the bench
  teaser already links to full benchmarks.
- Landing Playwright suite — T5 specifies the eyeball matrix; an automated landing suite is
  a v10 candidate.

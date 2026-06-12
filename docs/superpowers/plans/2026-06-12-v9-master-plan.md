# v9 Master Plan — Signs of Life (Fix, Loading Bar, Live Console, Polish)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-12-v9-tranche-1.md` … `2026-06-12-v9-tranche-5.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Execute `docs/ROADMAP-V9.md` — make every interactive element on the landing page
actually work in production builds (signals subscriptions, Profiler counters, theme text
tokens), add a client-drivable top loading bar with error states to `AppShell`, upgrade the
Relay ops console (spacing, SideNav icons, titlebar menu, ticking chart, pulsing incident
light), and polish the landing page (full-width agent-render artifact, QuickStart copy
button, scroll-reveal motion).

**Architecture:** No new packages, no new registry entries. The loading bar extends
`packages/layouts/src/app-shell/` (shell-state.ts + app-shell.tsx + module CSS) — copy-paste
users get it with the shell. Theme parity lands in `packages/themes` plus a key-set equality
test. Everything else is `apps/landing` application code plus one Vite alias.

**Tech stack:** unchanged — React 18+ (landing is real React + `@preact/signals-react`, NOT
Preact), CSS with `--cascade-*` tokens, vitest + @testing-library/react, vp (vite+)
toolchain.

---

## Research findings (ground truth for all tranches — verified 2026-06-12)

### The signals-subscription bug (root cause of "switches cannot be changed")

`@cascade-ui/core` re-exports raw `@preact/signals-react`
(`packages/core/src/signals.ts:11` re-exports `useSignals` from
`@preact/signals-react/runtime`). In a plain React app without the Babel signals transform,
**a component that reads `signal.value` during render only re-renders on signal writes if it
calls `useSignals()` first**. The docs app is Preact (native signal reactivity) — this bug
class is invisible there. The landing app is real React.

Verified subscription state of every landing component that reads `.value` in render:

| File                       | `.value` reads | `useSignals()` | Status                                            |
| -------------------------- | -------------- | -------------- | ------------------------------------------------- |
| `sections/Header.tsx`      | 2              | yes (line 7)   | ✅ correct                                        |
| `sections/CopyCommand.tsx` | 4              | **no**         | ❌ broken                                         |
| `sections/SignalsDemo.tsx` | 13             | **no**         | ❌ broken                                         |
| `demo/FlagsRegion.tsx`     | 3              | **no**         | ❌ broken                                         |
| `demo/DeploysRegion.tsx`   | 5              | **no**         | ❌ broken                                         |
| `demo/KpiRow.tsx`          | 1              | no             | ⚠️ verify — the read may be a non-signal `.value` |

Concrete symptoms: `Toggle checked={states.value[i]}` (FlagsRegion.tsx:23) — the click
handler writes the signal, the component never re-renders, the toggle appears frozen.
`Modal open={modalOpen.value}` (DeploysRegion.tsx:88) — "New deploy" sets the signal, the
modal never receives `open=true`. CopyCommand's "Copied" label never appears.

### The Profiler bug (root cause of "benchmarking comparison is not working")

`SignalsDemo.tsx` drives its commit counters from React `<Profiler onRender>` (lines
13–27). **Production `react-dom` compiles Profiler callbacks away** — `onRender` never
fires in the deployed bundle regardless of the subscription fix. The standard remedy is
aliasing to the profiling build (`react-dom/profiling`) at build time. The landing Vite
config (`apps/landing/vite.config.ts`) already has a `resolve.alias` block to extend.
Both fixes are required: `useSignals()` so the badges re-render, profiling build so the
callbacks fire.

### Theme token parity (root cause of invisible labels in "One form, five personalities")

`ThemeDemo.tsx:6` cycles `['light', 'dark', 'warm', 'flat', 'minimal']` (the report said
"flat and modern" — the actual themes are flat and **minimal**). Input labels use
`color: var(--cascade-color-text)` (`input.module.css:30`). Token counts per theme file:
light 55, dark/warm same family, **flat 31, minimal 31**. Exact missing set in flat
(via key diff against light): `--cascade-color-text`, `--cascade-color-text-subtle`,
`--cascade-color-text-muted`, `--cascade-color-text-on-accent`,
`--cascade-color-text-on-destructive`, `--cascade-color-bg`, `--cascade-color-bg-subtle`,
`--cascade-color-border`, `--cascade-color-border-strong`, `--cascade-color-destructive`,
`--cascade-color-destructive-hover`, `--cascade-color-destructive-subtle`,
`--cascade-color-focus-ring`, `--cascade-focus-ring`, `--cascade-color-info`,
`--cascade-color-info-subtle`, `--cascade-color-success-subtle`,
`--cascade-color-warning-subtle`, `--cascade-color-surface-overlay`,
`--cascade-color-surface-raised`, `--cascade-color-accent-active`,
`--cascade-color-accent-muted`, `--cascade-color-accent-subtle`, `--cascade-chart-axis`,
`--cascade-chart-grid`, `--cascade-radius-{badge,button,card,component,input,modal}`,
`--cascade-shadow-overlay`. (Minimal's diff is the same shape — regenerate it at
implementation time.) An undefined `var()` falls back to the inherited color — labels
become whatever the parent stage sets, hence "invisible".

### App shell (target for the loading bar)

`packages/layouts/src/app-shell/app-shell.tsx`: grid regions header / nav / main / aside /
footer; `useSignals()` + lazy `createShellState` via `useSignal` + `peek()` (house
pattern); i18n via `t(builtin.appShell.*)`. `shell-state.ts`: `ShellState` interface with
`sideNavCollapsed` / `sideNavOpen` / `asideOpen` signals (`persistedSignal` from
`@cascade-ui/storage` when `persistKey` set) + `toggleSideNav` / `toggleAside`. Existing
related components: `ProgressBar` (`packages/components/src/progress-bar/`, props `value`,
`max`, `status: 'active'|'success'|'error'`) — a form-level component, not shell chrome;
don't reuse it for the top bar (different anatomy: 2–3px edge-to-edge strip). The shell has
**no loading affordance today**.

### Relay ops console (landing demo)

Composition (`apps/landing/src/demo/RelayConsole.tsx`): `.console-frame` >
`.console-titlebar` (two inert spans: brand + env) + `.console-body` (SideNav +
`.console-main` with `KpiRow` + `.console-grid` of TrafficRegion / SideRegion /
DeploysRegion / FlagsRegion). Spacing today: `.kpi-row` gap `--cascade-space-3`,
`.console-grid` gap `--cascade-space-4`, `.region` gap `--cascade-space-3`
(landing.css:685), KPI + flags cards `padding="sm"` (`--_card-p: var(--cascade-space-4)`,
card.module.css:10–13), deploys table `density="compact"`. SideNav items are built from
labels only (`RelayConsole.tsx:12`) — `SideNavItem` supports `icon?: ReactNode`
(side-nav.tsx:21, fallback dot rendered at side-nav.tsx:109 when absent). Charts are static:
`TRAFFIC` is a 24-entry const (`demo/data.ts:105`). `INCIDENT` + `ONCALL` consts exist for
SideRegion. **No `inert`/`pointer-events` blocking exists** — interactivity is broken only
by the missing subscriptions.

### Landing page sections

- **AgentLayer** (`sections/AgentLayer.tsx`): `.agents-grid` is `repeat(2, 1fr)`
  (landing.css:887–896); the "Agents don't screenshot. They render." artifact
  (`.agent-artifact.agent-render`, AgentLayer.tsx:108–116) sits in one column with an
  internal two-pane grid (code + live `CascadeView`) that collapses at 40rem — cramped.
- **QuickStart** (`sections/QuickStart.tsx`): steps 1–2 render `<CopyCommand>`; step 3
  (`copyable: false`) renders a bare `<pre className="quickstart-code">` — no copy button,
  and `.quickstart-code` hardcodes `background-color: #24292e` (landing.css:294–302), a
  raw hex in violation of the tokens rule. Step 3's code is a single line
  (`import { Button } from './components/ui/button/button'`) — `CopyCommand` fits it.
- **Scroll animation:** none today. Only the hero theme-switch view transition
  (landing.css:114–156) and hover transitions; `prefers-reduced-motion` is already
  respected once (landing.css:528).
- **Icons in landing:** `@cascade-ui/icons` is NOT a landing dependency and NOT aliased in
  `apps/landing/vite.config.ts`. Icons' package exports point at `dist/` — per the
  CLAUDE.md "Workspace package aliases" section, adding the dependency requires adding the
  source alias (`packages/icons/src/index.tsx`) too, or the deploy job breaks again.
- Available icon exports (packages/icons): `Dashboard`, `Zap`, `AlertTriangle`,
  `Activity`, `Tag`, `Settings`, `MoreHorizontal`, `Bell`, `LogOut`, `ExternalLink`,
  `Copy`, … (61 total).
- **Menu component** (`packages/components/src/menu/menu.tsx`): `Menu` / `MenuTrigger` /
  `MenuItem` / `MenuSeparator` — self-contained state, suitable for the titlebar.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                            | Rationale                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Fix subscriptions by adding `useSignals()` as the first statement of every landing component that reads `.value` in render (CopyCommand, SignalsDemo, FlagsRegion, DeploysInner; audit KpiRow)                                                                                                      | Root cause, one line each; matches Header.tsx house pattern              |
| 2   | Alias `react-dom/client` → `react-dom/profiling` in `apps/landing/vite.config.ts` (build + dev). Fallback if Rolldown/vite+ fights it: explicit render counters inside the form components — never fake numbers                                                                                     | Profiler is honest ("live React Profiler commits" copy stays true)       |
| 3   | Theme parity: add the missing semantic tokens to `flat.css` + `minimal.css`, values in each theme's character (flat: pure hues, 0 radius everywhere; minimal: warm-tinted neutrals, hairline radii)                                                                                                 | Fixes invisible labels everywhere, not just Input                        |
| 4   | New `packages/themes` vitest: parse all five theme CSS files, assert identical sets of `--cascade-*` custom-property names                                                                                                                                                                          | Turns parity from convention into contract                               |
| 5   | Loading bar API on `ShellState`: `loadingProgress: Signal<number \| null>` (null hidden, 0–1 determinate), `loadingError: Signal<string \| null>`, methods `startLoading`, `setLoadingProgress` (clamps), `finishLoading` (snaps to 1, hides after 400ms), `failLoading(msg?)`, `clearLoadingError` | Signal-driven like the rest of the shell; client owns the progress value |
| 6   | Bar renders inside `AppShell` as a 3px strip pinned to the top of the shell grid (above header, `z-index` over it); fill width via `inline-size: calc(var(--_progress) * 100%)` — logical, RTL-correct, no transform                                                                                | "Runs left to right", 2-line CSS, no JS animation                        |
| 7   | Error surface: `role="alert"` strip below the header with the `failLoading` message + dismiss button; dismiss label from i18n builtin catalog (`builtin.appShell.dismissError` — new key in the appShell namespace)                                                                                 | CLAUDE.md component-chrome i18n rule applies to shell chrome             |
| 8   | Loading state is never persisted (plain `signal()`, not `persistedSignal`)                                                                                                                                                                                                                          | Transient by definition                                                  |
| 9   | Console spacing: `.kpi-row` gap → `space-4`, `.console-grid` gap → `space-6`, `.region` gap → `space-4`, KPI + flags cards `padding="sm"` → `"md"`, deploys table drops `density="compact"`. Core Card/DataTable: audit against docs + Storybook; change core only if the cramping reproduces there | Landing-level first; core changes ripple into every user project         |
| 10  | SideNav icons: Overview→`Dashboard`, Deploys→`Zap`, Incidents→`AlertTriangle`, Traffic→`Activity`, Flags→`Tag`, Settings→`Settings`; landing adds `@cascade-ui/icons` dep **and** the Vite source alias                                                                                             | Component supports `icon`; alias rule per CLAUDE.md                      |
| 11  | Titlebar menu: `Menu`/`MenuTrigger`/`MenuItem` with View status page / Copy incident link / Sign out, actions fire toasts (reuse DeploysRegion's ToastProvider pattern or hoist one provider around the console)                                                                                    | Real component, demo-safe actions                                        |
| 12  | Console motion budget = 3: traffic chart ticks every 2s (signal-driven `setInterval` in `useSignalEffect`, paused when `document.hidden` or `prefers-reduced-motion`), CSS pulse dot on the incident alert, CSS breathe on the `building` deploy badge                                              | Alive, not noisy; reduced-motion-gated                                   |
| 13  | Agent-render artifact: `grid-column: 1 / -1` on `.agent-render` within `.agents-grid`; widen the internal panes accordingly                                                                                                                                                                         | Full content width as requested; pure CSS                                |
| 14  | QuickStart: all three steps use `CopyCommand` (drop the `copyable` flag); delete the now-dead `.quickstart-code` CSS including the `#24292e` hex                                                                                                                                                    | Consistency + removes a tokens violation our change orphans              |
| 15  | Scroll reveal: sections get `data-reveal`; one IntersectionObserver (`apps/landing/src/reveal.ts`, started from `App.tsx` via `useSignalEffect`) adds `data-revealed` once at ≥15% visibility; CSS transitions opacity + translate, fully disabled under reduced motion                             | One observer, zero libraries, motion-safe                                |
| 16  | CLAUDE.md gains a rule: React apps (landing/examples/bench) must call `useSignals()` in any component reading `.value` during render; T5 adds the matching grep gate                                                                                                                                | Prevents the entire T1 bug class from recurring                          |

## Tranche map

| Tranche | File                         | Contents                                                                                                                                  | Risk                                                         |
| ------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| T1      | `2026-06-12-v9-tranche-1.md` | `useSignals()` sweep, profiling-build alias + prod verification, theme token parity + parity vitest, CLAUDE.md rule                       | Medium (profiling alias under vite+/Rolldown is the unknown) |
| T2      | `2026-06-12-v9-tranche-2.md` | Shell loading bar: shell-state API + tests, app-shell render + CSS, i18n key, manifest/registry regen                                     | Low–medium (timer in finishLoading; a11y)                    |
| T3      | `2026-06-12-v9-tranche-3.md` | Console upgrade: spacing pass + core audit, SideNav icons (+ deps/alias), titlebar menu, traffic ticker, incident pulse, building breathe | Medium (motion + icons alias + spacing judgment)             |
| T4      | `2026-06-12-v9-tranche-4.md` | Agent-render full width, QuickStart copy button + dead CSS removal, scroll reveal                                                         | Low                                                          |
| T5      | `2026-06-12-v9-tranche-5.md` | Gates: signals grep, reduced-motion audit, eyeball matrix (prod build!), axe spot checks, full regen/drift, DoD walkthrough               | Low                                                          |

## Cross-cutting rules (every tranche)

1. **Verify in production builds.** The two headline bugs only exist in prod
   (`vp build` + `vp preview`) — dev-only verification is how they shipped. Every landing
   tranche's exit criteria include a prod-build check.
2. **Tokens only.** All new CSS reads `--cascade-*`; knobs are private `--_*` properties.
   The `#24292e` removal is part of this.
3. **Logical properties only** — the loading bar especially (`inline-size`,
   `inset-inline-start`).
4. **`prefers-reduced-motion` gates all new motion** — ticker, pulse, breathe, reveal.
5. **CLAUDE.md hook rules bind package code**: no `useState`/`useEffect`/etc. in
   `packages/`. The landing app uses signals + `useSignalEffect` the same way; the one
   sanctioned `useState` exception remains SignalsDemo's comparison subject.
6. **i18n builtin catalog for component chrome** — the shell's dismiss-error label (T2).
   Landing demo copy stays hardcoded (it's content, not chrome).
7. **Gate before committing** (CLAUDE.md): `pnpm exec vp check` → `pnpm build` →
   `pnpm exec vp run -r check` → `pnpm test` → regenerate
   (`pnpm registry:generate && pnpm readme:generate && pnpm llms:generate`) →
   `pnpm exec vp check --fix` → `git diff --exit-code`.
8. **Surgical changes.** The landing has many sections — touch only what each tranche
   names.

## Edge cases / risks registry

1. **`react-dom/profiling` under vite+/Rolldown**: the alias must apply to
   `react-dom/client` (the landing's entry import). Verify the profiling build exposes
   `createRoot` for the installed React version. If resolution fails or the bundle breaks,
   fall back to decision 2's plan B (explicit counters) — do not ship a broken alias.
2. **Profiling build perf**: marginally slower than prod react-dom. Acceptable on a
   marketing page that demos re-render counts; note it in the vite config comment.
3. **`finishLoading()` timer**: the 400ms hide uses `setTimeout` inside shell-state (not a
   component — no hook rules). Guard double-calls: `startLoading()` clears any pending hide
   timer, otherwise a stale timer hides a fresh loading pass.
4. **Loading bar a11y**: `role="progressbar"` + `aria-valuemin/max/now`; when `null`,
   render nothing (don't leave an empty progressbar in the tree). The error strip is
   `role="alert"` so it announces on appearance.
5. **Persisted-state interaction**: new signals must NOT go through `persistedSignal` even
   when `persistKey` is set (decision 8).
6. **Traffic ticker drift**: append+shift on a 24-point window keeps memory flat; pause on
   `document.hidden` (visibilitychange listener inside the same `useSignalEffect`) so
   background tabs don't burn CPU; check `matchMedia('(prefers-reduced-motion: reduce)')`
   once at effect start — if reduced, never start the interval.
7. **AreaChart re-render cost**: the ticker re-renders TrafficRegion every 2s. The chart is
   ~24 points — trivial. Don't memoize preemptively.
8. **Icons alias omission breaks the deploy job** (the exact failure mode CLAUDE.md's new
   section documents): T3 must add dep + alias + run the landing build locally before
   commit.
9. **Theme value choices for flat/minimal**: parity is mechanical but values are design.
   Flat keeps all radii at 0 (`--cascade-radius-*: 0`), shadows hard or none; minimal keeps
   its warm hue (80) in every neutral. Eyeball the ThemeDemo + console in both after.
10. **Scroll reveal + view transitions**: the hero already uses view transitions on theme
    switch; the reveal observer must not target the hero stage (skip `#hero`) to avoid
    compounding transforms during a view transition.
11. **KpiRow's single `.value` read**: may be a non-signal (e.g. array access). Audit
    before adding `useSignals()` — don't cargo-cult the fix into components that don't
    read signals.
12. **CopyCommand timer**: `setTimeout` resetting `copied` — fine as-is once subscribed;
    don't refactor.

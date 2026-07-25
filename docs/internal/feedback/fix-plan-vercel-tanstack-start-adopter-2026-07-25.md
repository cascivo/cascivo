# Fix plan — Vercel-like TanStack **Start** dashboard adopter report (2026-07-25, tested 0.11.1 packages)

**Status: planned — not implemented.**
Per-workstream: **WS-1** planned (P0 — `useSignal`/`useComputed` do not self-subscribe) ·
**WS-2** planned (P0 — reactivity primitives unreachable on Path B) ·
**WS-3** planned (P0 — `Search` module-counter id breaks SSR hydration) ·
**WS-4** planned (P0 — render-phase signal writes run effect bodies mid-render; the
primitive **and** `CLAUDE.md`'s taught idiom share the bug) ·
**WS-5** planned (P1 — `cascivo audit --ai` unusable outside the monorepo) ·
**WS-6** planned (P1 — distribution channel is inferred from a source path and is **wrong for
6 layout primitives**) · **WS-7** planned (P1 — 126 prop defaults undocumented across 73
components; `Flex` is the headline) · **WS-8** planned (P1 — `llms.txt` SSR section contradicts
`USING-WITH-VITE-SSR.md`) · **WS-9** planned (P2 — accessible-name prop naming has no published
contract) · **WS-10** planned (P2 — `CardHeader` column default fights the title+action pattern) ·
**WS-11** planned (P2 — `Kpi` delta formatting uncontrollable; disagrees with `Stat`) ·
**WS-12** planned (P2 — app layer slot: `CSS-LAYERS-PITFALL.md` contradicts itself) ·
**WS-13** planned (P3 — recipe minors: `RelativeTime now`, `DataTable Column.width`) ·
**WS-14** planned (P0 — the anti-recurrence gates that tie WS-1/6/7/8 together) ·
**WS-15** carry-forward (P1 — publish the 07-24 release train, then run the freshness canaries).

Written to be handed to an implementing agent (Opus) as-is. Source report:
[`feedback-vercel-tanstack-start-adopter-2026-07-25.md`](feedback-vercel-tanstack-start-adopter-2026-07-25.md)
— a five-route Vercel-style console on **TanStack Start 1.168 (SSR)** + Router 1.170 + Query
5.101 + Table 8.21, React 19.2, `@preact/signals-react` 3.11, adoption **Path B** (prebuilt
`@cascivo/react@0.11.1`, `@cascivo/themes@0.4.6`, `@cascivo/charts@0.5.1`,
`@cascivo/icons@0.3.4`, `@cascivo/core@0.5.3`). Every claim below is triaged against current
`main` with file:line evidence; every workstream carries a spec, the tests that lock it, and
acceptance criteria.

> **Status hygiene (binding, see [`README.md`](README.md) WS-K):** the PR that implements a
> workstream MUST update this header and that workstream's status **in the same PR**, and the
> PR that publishes flips `merged → published vX.Y.Z`. A plan that reads "planned" after its
> fixes shipped — or "✅" while the docs adopters actually read still teach the pre-fix
> behavior — is precisely how the same red flag comes back. It has now come back eight times.

---

## §0 — Read this first: why these are back, and what this plan must change

This is the **eighth** cold-adopter report. The prior seven produced seven fix plans in this
directory, and the recurring adopter sentence — _"this was raised before and was said to be
fixed"_ — is already named in `README.md`. So the interesting question is not "what broke"; it
is **why the existing enforcement did not catch these**. There are exactly three mechanisms,
and each one has a matching structural fix. Everything in this plan is an instance of one of
them.

### Mechanism A — a behavioral claim exists only as prose

`docs/HEADLESS.md:33-38` promises that **twelve** named hooks call `useSignals()` internally.
`packages/core/src/self-subscribe.test.tsx` — the test written expressly to lock that promise
— covers **three** of them (`useMachine`, `useControllableSignal`, `useDisclosure`). Ten of the
twelve happen to be true today (`useMediaQuery`, `useMachine`, `useRovingFocus`,
`useStreamBuffer`, `useScope`, `useTheme`, `useAnchorPosition`, … all call `useSignals()`), which
is exactly what makes the gap invisible: the claim reads as verified because most of it is.
The two it is false for are `useSignal` and `useComputed` — **the two the reactivity contract
tells an adopter to reach for first** (`packages/core/src/signals.ts:6-7` re-exports them
straight from `@preact/signals-react`, unwrapped).

`scripts/checks/doc-api-drift.test.ts` cannot catch this by construction: it is a **blocklist of
known-stale phrasings**. It catches a claim someone has already discovered is wrong. It cannot
catch a claim that was never true.

> **Fix pattern:** the list of self-subscribing hooks becomes **one machine-readable array**,
> and one guard asserts, in both directions, that every name in it (a) is covered by a
> render-and-assert test and (b) appears in the docs. Prose is generated from, or checked
> against, the array — never the other way round. (WS-1, WS-14.)

### Mechanism B — a fact is inferred from a proxy instead of derived from the truth

Two instances, both P1:

- **Distribution channel.** `scripts/llms/generate.ts:179-188` decides whether an entry ships
  in `@cascivo/react` by looking at its **source file path**: under
  `packages/components/src/` → npm; under `packages/layouts/src/` → "copy-paste only". But
  `packages/react/src/index.ts:192-197` exports `Grid`, `GridItem`, `Flex`, `Columns`,
  `Center`, `Spacer` and `AutoGrid` — all of which live under `packages/layouts/src/`. So every
  generated AI surface tells an agent that six importable primitives are copy-paste only:
  `apps/site/public/llms/layout/flex.md` literally reads _"Copy-paste only — this block/layout
  is not published as an importable package"_, while the hand-written
  `docs/RECIPE-DASHBOARD.md:20` correctly says _"All exported from `@cascivo/react`"_. The two
  surfaces disagree, and the machine-generated one — the one an agent fetches — is the wrong
  one. The adopter's complaint ("no signal which is which") understates it: the signal exists
  and is **inverted for 6 of 14 layout entries**.
- **Prop defaults.** `PropMeta.default` exists (`packages/core/src/types.ts:19`) and the
  generated props table renders a `Default` column, but nothing requires it to be filled.
  Measured across `registry.json`: **349 props have a TypeScript destructuring default; 126 of
  them (73 components) document none.** `Flex`'s `direction = 'vertical'`
  (`packages/layouts/src/flex/flex.tsx:16`) is one of the 126 — so
  `apps/site/public/llms/layout/flex.md` shows `Default: —` for the single most surprising
  default in the catalog. `props-parity` checks that prop **names and types** match the
  interface; it has never checked defaults.

> **Fix pattern:** derive the fact from its actual source (the export list; the destructuring
> default in the signature) and add a parity guard — the same shape as the existing
> `props-parity` / `typedefs-parity` guards. An inference that is right for 186 entries and
> wrong for 6 is indistinguishable from correct at review time; only a guard sees it. (WS-6,
> WS-7, WS-14.)

### Mechanism C — the same fact is stated independently in two places

- `scripts/llms/generate.ts:657-667` and `:860-865` tell agents that SSR requires
  `ssr.noExternal: [/^@cascivo\//]`. `docs/USING-WITH-VITE-SSR.md:3` says _"As of
  `@cascivo/react` 0.10, SSR works with zero Vite config."_ The docs page is right (the
  adopter server-rendered 0.11.1 with an untouched `vite.config.ts`); **`llms.txt` — the file
  most likely to be an agent's single-fetch context source — carries the stale instruction.**
- `docs/CSS-LAYERS-PITFALL.md:52-55` says app-local sublayers go _"between `cascivo.blocks`
  and `cascivo.override`"_ (matching `packages/tokens/src/layers.css:28-30`), and then its own
  worked example twenty lines later (`:69-71`) places `cascivo.example` **between
  `cascivo.component` and `cascivo.theme`**. One file, two answers.

> **Fix pattern:** one owner per fact; every other surface either includes it or is checked
> against it. (WS-8, WS-12, WS-14.)

### What "done" means for this plan

Fixing the twelve findings is the easy half. The plan is only done when **each of the three
mechanisms has a guard that fails a PR that reintroduces its class of defect** (WS-14), and
when the fixes are **published** — WS-15 exists because the 07-24 plan is `implemented … not
yet published`, and this adopter tested npm, not `main`.

---

## §1 — Triage: every report item against `main`

P0/P1/P2/P3 = priority. "Verdict" is the claim's status against current `main`, not against
the 0.11.1 tarball the adopter used (they agree for every item below — nothing here is
already-fixed-but-unpublished).

| # | Report claim | Verdict | Evidence on `main` | WS | Pri |
| - | ------------ | ------- | ------------------ | -- | --- |
| 1 | `useSignal`/`useComputed` do not make components reactive; docs say they do | **CONFIRMED** | `packages/core/src/signals.ts:1-12` re-exports both verbatim from `@preact/signals-react` — no wrapper. `docs/HEADLESS.md:33-38` claims both "call `useSignals()` for you". `self-subscribe.test.tsx` covers neither | WS-1 | P0 |
| 1b | "`HEADLESS.md` **and** `AI-RULES.md` both state it" | **PARTIALLY REFUTED — outcome unchanged** | Only `HEADLESS.md:33-38` carries the exemption. `AI-RULES.md:70-73` (item 9) states the correct *unconditional* rule. But `AI-RULES.md:71` tells the agent to import `useSignals` from `@cascivo/core`, which Path B is told not to depend on (#2) — so the pasteable contract is still unfollowable | WS-1, WS-2 | P0 |
| 2 | `@cascivo/react` exports no signal primitives; SSR guide forbids depending on `@cascivo/core` | **CONFIRMED** | `packages/react/src/index.ts` re-exports only `ErrorBoundary`/`SuspenseBoundary`/`Portal`/`FocusScope` (`:97`) and `setLinkComponent`/`getLinkComponent` (`:103-108`). `docs/USING-WITH-VITE-SSR.md:183-185` states the phantom-dep prohibition. No `useSignal`/`useSignals`/`useMachine`/`useDisclosure` export exists | WS-2 | P0 |
| 3 | `Search` breaks SSR hydration — module-level id counter | **CONFIRMED** | `packages/components/src/search/search.tsx:8` `let idCounter = 0`; `:68-71` increments it into a ref. Violates the rule in `docs/HEADLESS.md:47` and the intent of `scripts/checks/primitive-adoption.test.ts` (which checks only for literal ids / `Math.random()`, so a counter slips through) | WS-3 | P0 |
| 4 | `CommandMenu` writes signals during render | **CONFIRMED — and the mechanism is worse than reported** | `command-menu.tsx:209-212` mirrors `open`/`hotkey` into signals during render. Those signals are read **only inside `useSignalEffect`** (`:249`, `:277`, `:281`) — so a render-phase write runs effect bodies *synchronously during React's render phase*, including `onOpenChangeRef.current(...)` (`:281`), a parent setState. Same shape in `search.tsx:74` and `password-input.tsx:58` | WS-4 | P0 |
| 4b | Suggested fix: "route these through `useControllableSignal`" | **REFUTED as a fix** | `packages/core/src/controllable.ts:43` performs the identical render-phase write (`sig.value = value as T`). The primitive shares the bug; so does the idiom `CLAUDE.md` teaches under "Syncing a controlled React prop into a signal". Fixing only `CommandMenu` fixes nothing | WS-4 | P0 |
| 5 | `cascivo audit --ai` cannot run in a consumer project | **CONFIRMED** | `packages/cli/src/utils/contract.ts:12-21` walks up ≤10 dirs for `apps/site/public/`; `:50-58` throws when absent. `loadContract` already accepts explicit paths, but `packages/cli/src/commands/audit.ts` exposes no flag (`:174` parses only `--ai`, `--fix`). No network fallback | WS-5 | P1 |
| 6 | `Flex` defaults to `direction="vertical"`, undocumented | **CONFIRMED — systemic** | `flex.tsx:16`; `flex.meta.ts:10-15` omits `default`. 126 props / 73 components have the same gap | WS-7 | P1 |
| 7 | Inconsistent accessible-name prop naming (`label` vs `ariaLabel`) | **CONFIRMED** | `ariaLabel` on exactly 5 entries (Breadcrumb, Dock, OverflowMenu, SideNav, Steps); `label` on 38, of which some are invisible accessible names (`icon-button.tsx:9` → `aria-label` at `:27`) and some are rendered text. No component uses both. `docs/AI-RULES.md`'s naming table covers change handlers only — accessible names are unaddressed | WS-9 | P2 |
| 8 | `layout/*` split between importable and copy-paste with no signal | **CONFIRMED — inverted for 6 entries** | `scripts/llms/generate.ts:179-188` returns `null` (copy-paste) for every `layout/*`, yet `packages/react/src/index.ts:192-197` exports Grid/GridItem/Flex/Columns/Center/Spacer/AutoGrid. `docs/RECIPE-DASHBOARD.md:20` says the opposite (and is right) | WS-6 | P1 |
| 9 | `llms.txt` contradicts the SSR guide on `ssr.noExternal` | **CONFIRMED** | `scripts/llms/generate.ts:657-667`, `:860-865` vs `docs/USING-WITH-VITE-SSR.md:3` | WS-8 | P1 |
| 10 | `CardHeader` is `flex-direction: column`, fighting title+action | **CONFIRMED** | `card.module.css:35-44`. `Card` ships no actions slot (`card.tsx` exports Card/CardHeader/CardTitle/CardContent/CardFooter only); `card.meta.ts` has no `space-between` example | WS-10 | P2 |
| 11 | `Kpi` delta formatting not controllable; disagrees with `Stat` | **CONFIRMED** | `packages/charts/src/charts/kpi/kpi.tsx:6-19`: `delta?: number` formatted by a private `formatDelta` (sign + `toLocaleString`), no suffix/format prop. `Stat` takes a pre-formatted `string` | WS-11 | P2 |
| 12 | The app's own layer slot isn't in the canonical order statement | **CONFIRMED, plus a self-contradiction** | `docs/AI-RULES.md:18-19` names `cascivo.example` "declared in the order statement"; the statement at `:31` has no app slot. `layers.css:28-30` says insert between `blocks` and `override`; `CSS-LAYERS-PITFALL.md:69-71` shows it between `component` and `theme` | WS-12 | P2 |
| 13 | `RelativeTime`'s `now` prop deserves surfacing in the dashboard recipe | **CONFIRMED (docs gap)** | `docs/RECIPE-DASHBOARD.md` names `relative-time` but not the `now` prop | WS-13 | P3 |
| 14 | `DataTable`'s `Column.width` is easy to miss | **CONFIRMED (docs gap)** | Documented at `data-table.meta.ts:201-204`, absent from the recipe and from any example | WS-13 | P3 |
| 15 | `Search` renders its `label` as visible text by default | **NOT REPRODUCIBLE FROM SOURCE — needs a repro before any change** | `search.module.css:29-41` visually hides `.label` correctly (abs-pos, 1px, `clip-path: inset(50%)`, `overflow: hidden`). Most likely cause is a missing/partial `@cascivo/react/styles.css` in the adopter app, i.e. a CSS-delivery question, not a component defect | WS-13 | P3 |
| 16 | Positives: SSR zero-config, `setLinkComponent`, shell components, `dist/index.d.ts`, themes, `cascivo doctor`, the audit engine, per-component `/llms/*.md` | **CONFIRMED — protect these** | — | — | — |

**Two items in the report's own ranking need re-ranking.** The report puts #4 (`CommandMenu`)
fifth and calls it "not a functional blocker". Per §WS-4 the render-phase write runs effect
bodies — including a parent `setState` — inside React's render phase, in a shared primitive
and in the pattern `CLAUDE.md` teaches. That is P0. Conversely #15 is demoted to P3 pending a
repro, because the source contradicts it.

---

## §WS-1 (P0) — Make `useSignal`/`useComputed` self-subscribe, and make the promise executable

### Problem

`packages/core/src/signals.ts` is a bare re-export:

```ts
export { signal, computed, effect, batch, useSignal, useComputed, useSignalEffect }
  from '@preact/signals-react'
export { useSignals } from '@preact/signals-react/runtime'
```

`useSignal`/`useComputed` therefore do **not** subscribe the calling component. Without the
Babel signals transform — which no consumer app runs, which no cascivo doc tells you to
install, and which TanStack Start / Vite SSR does not set up — a component reading
`mySignal.value` in render never re-renders. The failure is silent: handlers fire, signals
update, the UI is frozen. `docs/HEADLESS.md:33-38` asserts the opposite, in the paragraph
immediately after correctly describing this exact symptom.

The repo's own React example apps all call `useSignals()` by hand (every `.tsx` under
`apps/examples/flow/src` does), and `scripts/checks/use-signals-gate.sh` enforces that they
do — so internal practice has always known the docs' exemption is false for raw `useSignal`.

### Decision: wrap, don't downgrade the docs

Two options existed. **Wrap** (make the promise true) is correct because (a) 10 of the 12 hooks
named in the promise already self-subscribe, so wrapping makes the layer consistent rather
than adding a special case; (b) the alternative — "correct the docs to say `useSignals()` is
always required" — makes the library strictly worse than what adopters already believe and
demands the boilerplate on every single component; (c) `useSignals()` is idempotent under
nesting, which the existing hooks already rely on (`useMachine` calls it while callers also
may).

The unconditional rule stays in force for **raw** signals — a module-level `signal()`, a
signal received as a prop, or `currentLocale()` — and WS-1 must sharpen the docs to say
exactly that instead of the current soft "when the signal comes from a cascivo hook".

### Spec

1. **`packages/core/src/signals.ts`** — replace the two re-exports with thin wrappers, keeping
   the non-hook exports (`signal`, `computed`, `effect`, `batch`) untouched:

   ```ts
   'use client'
   import {
     useSignal as usePreactSignal,
     useComputed as usePreactComputed,
   } from '@preact/signals-react'
   import { useSignals } from '@preact/signals-react/runtime'

   /**
    * Local reactive state. Calls `useSignals()` so a component that reads the returned
    * signal in render re-renders on writes WITHOUT the Babel signals transform and
    * without calling `useSignals()` itself — the contract in docs/HEADLESS.md.
    *
    * Caveat (documented, tested): the tracking window opens where this hook is called.
    * A signal read that happens *earlier* in the render body than the first
    * `useSignal`/`useComputed` call is not tracked — call these before any signal read,
    * or call `useSignals()` first.
    */
   export function useSignal<T>(initial: T): Signal<T> {
     useSignals()
     return usePreactSignal(initial)
   }
   export function useComputed<T>(fn: () => T): ReadonlySignal<T> {
     useSignals()
     return usePreactComputed(fn)
   }
   ```

   Keep `export { useSignals }` and `export { useSignalEffect }` as-is. Both wrappers must be
   unconditional (stable hook order) and must not change the returned identity semantics.

2. **`docs/HEADLESS.md:33-38`** — rewrite the exemption paragraph. It must (a) list the
   self-subscribing hooks by name and say the list is machine-checked, naming the guard; (b)
   state the still-required cases as a positive rule, not an exception to an exception:

   > `useSignals()` is required only when you read a **signal you did not get from a cascivo
   > hook** during render — a module-level `signal()`, a signal passed in as a prop, or
   > `currentLocale()` from `@cascivo/i18n`. Every signal-returning cascivo hook calls
   > `useSignals()` for you; that list is enforced by
   > `packages/core/src/self-subscribe.test.tsx` + `scripts/checks/self-subscribe-parity.test.ts`,
   > so it cannot drift from the code.

   Add the tracking-window caveat from the JSDoc above, verbatim, as its own short paragraph —
   it is the one way the wrapper can still surprise someone.

3. **`docs/AI-RULES.md`** — item 9 of the pasteable contract stays (it is correct) but must
   gain the import source per adoption path (see WS-2) and a one-line pointer to the "only
   raw signals" rule so an agent doesn't add `useSignals()` to all 40 components defensively.

4. **`docs/TROUBLESHOOTING.md`** — add a top-level symptom entry, because this is the
   failure an adopter meets *before* they know the word "signals":

   > **Handlers fire but the UI never updates (filters, sorts, toggles do nothing).** You are
   > reading a raw signal in render without a subscription. → `useSignals()` first statement,
   > or get the signal from a cascivo hook. [link to HEADLESS §State & reactivity]

   Cross-link it from `docs/GETTING-STARTED.md` (which today mentions `useSignals` only once,
   at `:249`, inside a `useTheme` aside).

### Tests

- **Extend `packages/core/src/self-subscribe.test.tsx`** to one `it()` per hook named in the
  promise — at minimum `useSignal`, `useComputed`, plus the existing three and
  `useMediaQuery`, `useRovingFocus`, `useStreamBuffer`, `useScope`, `useAnchorPosition`. Each
  renders a plain React component (this test env runs no Babel transform — see
  `packages/core/vite.config.ts`), writes, and asserts the DOM changed. Drive the list from a
  single exported array so WS-14's guard can read it.
- **New negative test:** a component that reads a **module-level** `signal.value` in render
  with no `useSignals()` does *not* re-render — locking the boundary of the promise so a
  future "just call useSignals everywhere internally" change can't silently widen it.
- **New test for the tracking-window caveat:** a component that reads a module-level signal
  *before* its first `useSignal()` call is not subscribed to that earlier read. This documents
  the wrapper's one sharp edge as intended behavior rather than leaving it to be re-reported.
- `apps/examples/*` keep their explicit `useSignals()` calls (harmless, and
  `use-signals-gate.sh` still passes).

### Acceptance

- `vp run @cascivo/core#test` green, including the new cases.
- A scratch React app (no Babel transform) with `const s = useSignal(0)` and
  `onClick={() => s.value++}` re-renders — verified in `apps/examples/react-vite` by deleting
  one `useSignals()` call and confirming the app still works, then restoring it.
- `pnpm meta:check` green with the WS-14 parity guard in place.
- Changeset: **minor** on `@cascivo/core` (behavior change: hook count per call site changes,
  which is observable to anyone snapshotting hook order). Call it out in `UPGRADING.md`.

### Risks

- **Nested `useSignals()`** — a component that calls `useSignals()` *and* `useSignal()` now
  calls it twice. Already the case today for `useMachine`/`useTheme` callers and covered by a
  passing test; the new tests must include a component that does both.
- **Tracking window position** — see the caveat; tested, documented.
- **Per-call cost** — one extra hook per `useSignal()` call. Measure with `apps/bench` before
  and after; if a component makes many `useSignal()` calls the cost is `n` no-op store lookups.
  If `apps/bench` shows any regression beyond noise, hoist to a single `useSignals()` via a
  shared internal `useTrackedSignals()` helper rather than reverting.

---

## §WS-2 (P0) — Re-export the reactivity primitives from `@cascivo/react`

### Problem

The two documented rules are mutually exclusive on Path B:

- `docs/AI-RULES.md:47-73` (the block meant to be pasted into an agent's system prompt): never
  `useState`; use `useSignal`/`useSignalEffect`/`useMachine`/`useScope` **from
  `@cascivo/core`**.
- `docs/USING-WITH-VITE-SSR.md:183-185`: on the prebuilt path, never add `@cascivo/core` as a
  direct dependency — under pnpm's strict layout it is a phantom-dependency error.

`packages/react/src/index.ts` re-exports four components (`:97`) and the link registry
(`:103-108`) from core, with a comment (`:100-102`) explaining *exactly* this phantom-dep
reasoning — and then does not apply it to the primitives the reactivity contract is built on.
The adopter resolved it by adding `@cascivo/core@0.5.3` as a direct dep, i.e. by taking the
documented mistake, and now has two packages to keep in lockstep.

**Safety confirmed:** `packages/react/vite.config.ts:204-210` marks `@cascivo/core`,
`@preact/signals-react`, `react` and `react-dom` **external**, so a re-export is a re-export —
there is no bundled second copy of core and no dual-instance signal-identity hazard. This is
the same property that already makes the `setLinkComponent` re-export (module-level mutable
state) correct.

### Spec

1. **`packages/react/src/index.ts`** — extend the existing core re-export block. Group it
   under a comment that states the rule once ("Path B never needs `@cascivo/core` as a direct
   dependency; everything the reactivity contract names is re-exported here"):

   - Reactivity: `useSignal`, `useComputed`, `useSignalEffect`, `useSignals`, `signal`,
     `computed`, `effect`, `batch`, and the types `Signal`, `ReadonlySignal`.
   - Controlled bridge & state: `useControllableSignal`, `useDisclosure`, `createMachine`,
     `useMachine`, `useScope`/`createScope`.
   - The primitives an app composes with: `useId`, `useMediaQuery`, `useScrollLock`,
     `useClipboard`, `VisuallyHidden`, `Slot`, `composeRefs`, `mergeProps`, `cn`,
     `DismissableLayer`, `Presence`.
   - Plus every accompanying `type`.

   Two constraints from existing comments in that file: do **not** re-export `SpaceStep`
   (`:198-204` explains the dts-bundler double-binding), and keep re-exports **named**, never
   `export * from '@cascivo/core'` — a star re-export would drag core's whole surface into the
   flat `dist/index.d.ts` and change what `flatten-types.mjs`/`check-types-flat.mjs` see.

2. **`docs/USING-WITH-VITE-SSR.md:183-185`** — invert the note from a prohibition into a
   table: "on Path B, import X from `@cascivo/react`; `@cascivo/core` is a direct dependency
   only on Path A (copied source)". Keep the phantom-dep explanation as the *reason*.

3. **`docs/AI-RULES.md`** — the pasteable contract must name the import source per path.
   Single added line inside the fenced block: _"Path B (prebuilt): import every primitive
   below from `@cascivo/react`. Path A (copied source): from `@cascivo/core`. Both work; never
   add `@cascivo/core` to a Path-B app's `package.json`."_

4. **`docs/HEADLESS.md`** — the catalogue's per-row "Re-exported from `@cascivo/react`" notes
   (today present only on `setLinkComponent`) become a single statement at the top of the
   catalogue, since after this change it is true of everything listed.

5. **`packages/react/README.md`** and the `llms.txt` quickstart (`scripts/llms/generate.ts`) —
   add the one-line import rule; these are the two surfaces an agent reaches first.

### Tests

- **New `scripts/checks/path-b-parity.test.ts`** (wire into `meta:check`): parse the primitive
  names out of the reactivity sections of `docs/AI-RULES.md` + `docs/HEADLESS.md`, and assert
  each is a named export of `packages/react/src/index.ts`. Fails when a doc names a primitive
  Path B cannot import. Allowlist entries require a written reason (the `SpaceStep` case).
- **Extend `packages/react/src/index.test.tsx`**: import each newly re-exported symbol from
  the package root and assert it is defined; for `useSignal`, render a component through the
  `@cascivo/react` entry and assert reactivity (this catches a future accidental bundling of
  core, which would break signal identity).
- **Extend `scripts/checks/ssr-import.test.ts`** to import the new symbols under the `node`
  export condition, so `dist/node/` stays complete.

### Acceptance

- `pnpm build && pnpm exec vp run -r check` green; `dist/index.d.ts` contains the new exports
  and `check-types-flat.mjs` still passes.
- `pnpm pack:check` green (publint/attw over the packed artifact).
- A scratch pnpm app depending **only** on `@cascivo/react` + `react` + `react-dom` builds,
  SSRs, and re-renders on a signal write — no `@cascivo/core` in its `package.json`. Add this
  as a leg of `scripts/checks/cold-adopter.test.ts` (see WS-14).
- Changeset: **minor** on `@cascivo/react`.

---

## §WS-3 (P0) — `Search`: module-level id counter → `useId`

### Problem

```ts
// packages/components/src/search/search.tsx:8
let idCounter = 0
// :68-71
if (generatedIdRef.current === '') { idCounter += 1; generatedIdRef.current = `cascade-search-${idCounter}` }
```

A module-scoped mutable counter. On the server it increments for the lifetime of the process,
so it diverges from a freshly-loaded client's counter on essentially every request — and the
divergence grows the longer the server runs. Result: a React hydration mismatch on every
SSR page containing a `<Search>`, with React declining to patch the attribute, so the
`<label for>` ↔ `<input id>` association can end up broken client-side. That is an
accessibility regression, not console noise.

`useId` is implemented correctly in `packages/core/src/use-id.ts` and used properly by
`Combobox`, `DatePicker`, `PasswordInput`, `Radio`. `Search` is the one component that opted
out — and it is the component every dashboard toolbar reaches for.
`scripts/checks/primitive-adoption.test.ts` misses it because it only looks for static id
literals and `Math.random()`.

### Spec

1. **`packages/components/src/search/search.tsx`** — delete `idCounter` and the ref dance:

   ```ts
   const generatedId = useId('cascade-search')
   const inputId = id ?? generatedId
   ```

   Keep the `id` prop (it is the documented escape hatch and the adopter's workaround; it must
   keep winning). Remove the now-unused `useRef` import if nothing else needs it.

2. **Sweep the catalog for the same shape.** Search every package for a module-level mutable
   counter feeding a DOM id — `grep -rn "^let .*ounter\s*=\s*0" packages/*/src` plus a scan
   for template-literal ids built from a non-`useId` source. Fix each the same way, in this
   PR. (Preliminary sweep found only `Search`; the guard below is what makes that durable.)

3. **`packages/components/src/search/search.meta.ts`** — document the `id` prop's default as
   "auto-generated via `useId`" and note in the a11y block that the `label` is visually hidden
   by design (this also answers report item #15 — see WS-13).

### Tests

- **Regression test in `search.test.tsx`:** render two `<Search>` instances and assert their
  input ids differ and each `label[for]` matches its own input's `id`.
- **SSR-parity test:** `renderToString(<Search />)` twice in the same process and assert the
  extracted id is **identical** across calls (the counter version fails this — it is the
  minimal executable form of the hydration bug, with no jsdom hydration harness needed).
- **Extend `scripts/checks/primitive-adoption.test.ts`** with a third mechanical rule:
  no module-scoped mutable counter may reach a DOM `id`/`htmlFor`/`aria-*` value. Concretely:
  flag any shipped `.tsx` under `packages/*/src` that declares a top-level `let`/`var`
  initialized to a number **and** contains a template literal assigned to an id-ish binding.
  Keep the check narrow enough to be false-positive-free; the header comment must state that
  this rule was added because `Search` shipped a hydration bug the aria-id rule couldn't see.

### Acceptance

- `vp run @cascivo/components#test` green; `pnpm primitives:check` green and failing on a
  deliberately reverted `Search`.
- Changeset: **patch** on `@cascivo/react` (with the reasoning: id values change, but they were
  never stable across environments to begin with).

---

## §WS-4 (P0) — Render-phase signal writes execute effect bodies mid-render

**This is the finding whose severity the report under-rates, and whose suggested fix does not
work. Read the mechanism before writing code.**

### Problem

`CommandMenu` mirrors two controlled props into signals during render:

```ts
// packages/components/src/command-menu/command-menu.tsx:209-212
const isOpen = useSignal(open);        isOpen.value = open
const hotkeyEnabled = useSignal(hotkey); hotkeyEnabled.value = hotkey
```

`isOpen` and `hotkeyEnabled` are **never read in render** — they are read only inside
`useSignalEffect` bodies (`:249`, `:277`, `:281`). Preact signals run effects **synchronously
on write**. So once those effects exist (after first commit), a render-phase write runs their
bodies *inside React's render phase* — including `:281`'s `onOpenChangeRef.current(!isOpen.value)`,
which is the **parent's** state setter. That is what produces the reported warning:

```
Cannot update a component (`v$2`) while rendering a different component (`v$2`).
```

So this is not "a noisy warning about a render-phase write". It is: **imperative DOM work and
parent state updates executing during React's render phase**, in a shipped component, in a
pattern the repo teaches.

Two consequences the report missed:

- **`useControllableSignal` has the identical write** (`packages/core/src/controllable.ts:43`:
  `if (isControlled) sig.value = value as T`). Routing `CommandMenu` through it — the report's
  suggested fix — moves the bug, it does not remove it. Any consumer combining
  `useControllableSignal` with a `useSignalEffect` that reads the same signal is exposed.
- **`CLAUDE.md` teaches the pattern.** The section "Syncing a controlled React prop into a
  signal" presents `const isOpen = useSignal(open); isOpen.value = open` as the sanctioned
  idiom with no caveat. Every future component author will reproduce this.

The same shape exists in `search.tsx:74` and `password-input.tsx:58`. Those two happen to read
their mirrored signal **in render**, which is the safe case (a render-phase write that only
notifies the writing component's own subscription is a legal same-fiber render-phase update).
That distinction — *safe when read in render, unsafe when read in an effect* — is the actual
rule, and it is written down nowhere.

### Spec

**Step 1 — reproduce before changing anything.** Add a failing test first
(`command-menu.test.tsx`): render a controlled `<CommandMenu open={false}>` inside a parent
holding `open` in state, flip the prop, and assert (a) no `console.error` matching
`/while rendering a different component/`, and (b) the effect body did not run during render —
assert via an instrumented `onOpenChange` that records `React`'s phase, or simply that the
spy was not called synchronously within the render commit. Do not proceed until this test
fails on `main` for the stated reason. **If it does not reproduce, stop and re-triage** —
record the finding as REFUTED with evidence rather than changing a shared primitive on a
hypothesis.

**Step 2 — fix the primitive, not the component.** Candidate designs, in recommended order:

- **(A) Split the primitive by consumption site (recommended).** `useControllableSignal` keeps
  its synchronous mirror — correct and required for render-read consumers, which must not
  render stale. Add a sibling for effect-read props that defers the notification off the
  render phase:

  ```ts
  /** Mirror a controlled prop into a signal that is read inside effects, not in render.
   *  The write is deferred to a microtask so subscribed effects never run during React's
   *  render phase. Do NOT use for a signal you read in render — it would render one tick stale. */
  export function useEffectPropSignal<T>(value: T): ReadonlySignal<T>
  ```

  Implementation: `if (sig.peek() !== value) queueMicrotask(() => { sig.value = value })`,
  guarded so a superseded write is dropped. Migrate `CommandMenu`'s two mirrors to it.
  Cost: effects observe the prop one microtask late — acceptable for `showModal()`/hotkey
  registration, and must be asserted in a test.

- **(B) Defer only the React re-entry.** Wrap the parent-callback invocations inside the
  effect bodies (`:281` and any sibling) so they never call `setState` synchronously. Smaller
  diff, kills the warning, but still runs DOM work during render — a rules-of-React violation
  that survives. Acceptable only as a fallback if (A) proves unworkable.

- **(C) Do not mirror at all.** Restructure so the effects read the prop through a ref and
  their reactive trigger is a signal only ever written from event handlers. Cleanest in
  principle; in practice the effect must re-run *because* the prop changed, so this needs an
  external-store subscription and is the largest change. Evaluate only if (A) fails.

**Step 3 — write the rule down where component authors will hit it.**

- **`CLAUDE.md`**, in "Syncing a controlled React prop into a signal": add the two-case rule
  explicitly — synchronous mirror when the signal is read **in render**; the deferred
  primitive when it is read **inside `useSignalEffect`**; and why (effects run synchronously
  on write, so a render-phase write executes them mid-render).
- **`docs/HEADLESS.md`** — same rule beside `useControllableSignal` in the catalogue, plus the
  new primitive's row.
- **`docs/AI-RULES.md`** — one line in the reactivity contract, since agents generate this
  pattern constantly.

### Tests

- The Step-1 repro test, now passing.
- `controllable.test.ts`: a case combining `useControllableSignal` with a `useSignalEffect`
  that reads the same signal, asserting the effect does not run during a render triggered by a
  prop change (documents which primitive is safe for which consumption site).
- Unit tests for the new primitive: deferral happens, superseded writes collapse, no write at
  all when the value is unchanged, SSR-safe (no `queueMicrotask` scheduling on the server path
  that could leak between requests — assert with `renderToString`).
- Audit `search.tsx` / `password-input.tsx` in the same PR and assert with a test, per
  component, that their mirrored signal is read in render (the safe case) — so a future
  refactor that moves the read into an effect trips a test rather than shipping.

### Acceptance

- No `console.error` from opening/closing a controlled `CommandMenu`, `Search`, or
  `PasswordInput`, asserted in tests (fail the test on any unexpected `console.error`).
- `pnpm test` green; `CLAUDE.md` + `HEADLESS.md` + `AI-RULES.md` updated in the same PR.
- Changeset: **patch** on `@cascivo/react`, **minor** on `@cascivo/core` if a new primitive is
  added.

---

## §WS-5 (P1) — Make `cascivo audit --ai` runnable in a consumer project

### Problem

`docs/AI-RULES.md` builds an override-escalation ladder and a
`/* cascivo-audit: allow <rule> */` suppression syntax around `cascivo audit --ai`. In any app
outside the cascivo monorepo it dies immediately:

```
Contract unavailable: token catalog not found (apps/site/public/tokens.catalog.json)
```

`packages/cli/src/utils/contract.ts:12-21` walks up ≤10 directories looking for
`apps/site/public/` — a path that exists only in this repo. `:50-58` throws when it is absent.
There is no network fallback (the artifacts are public at `cascivo.com`) and
`packages/cli/src/commands/audit.ts:174` parses no flag to point it elsewhere. The adopter
confirmed the engine itself is fine: after hand-assembling a fake `apps/site/public/` tree the
audit ran and reported 0 errors / 1 warning / 2 info, catching a genuinely untranslated button
string. So a documented, working, useful feature is unreachable — and the app's `lint` script
fell back to `cascivo doctor --ci`.

`loadContract` **already accepts** `{ catalogPath, contextPath, registryPath }`. Only the
resolution and the CLI surface are missing.

### Spec — ship the contract inside the CLI (primary), with a flag and a network fallback

1. **New generated artifact `audit-contract.json`.** The audit consumes a tiny slice of the
   three big files (`packages/cli/src/utils/contract-pure.ts:1-60`): token
   `name`+`resolvedDefault`, per-component prop `name`/`type`/`required`, and the set of
   components with `intent.content`. Measured on current `main`, a purpose-built artifact is
   **55 KB raw / 10 KB gzip** (263 tokens, 192 components, 39 content entries) versus **2.3 MB**
   for shipping `tokens.catalog.json` + `context.json` + `registry.json` wholesale. Ship the
   small one.

   - Add `scripts/registry/audit-contract.ts` (generator) and wire it into `pnpm regen` right
     after `catalog:generate` + `context:generate`, writing to
     `packages/cli/src/generated/audit-contract.json` **and** `apps/site/public/audit-contract.json`
     (so the network fallback and the site stay in step). It is a generated artifact, so the
     drift check covers it for free.
   - Stamp it with `version` (from `registry.json`) so the CLI can report which contract it
     used, and so a stale bundled copy is diagnosable.

2. **Resolution order in `loadContract`** (`packages/cli/src/utils/contract.ts`), first hit
   wins, each step reported under `--verbose`:
   1. explicit `--contract <path>` (or the existing options object);
   2. the dev-monorepo `apps/site/public/` walk-up (unchanged — keeps in-repo behavior and the
      test suite intact);
   3. the **bundled** `audit-contract.json` shipped in the CLI;
   4. `https://cascivo.com/audit-contract.json`, cached under
      `${XDG_CACHE_HOME:-~/.cache}/cascivo/audit-contract-<version>.json`, with a short timeout
      and a clean fall-through to (3) offline. Never a hard network dependency —
      `cascivo doctor` works offline today and `audit` must too.

3. **CLI surface** (`packages/cli/src/commands/audit.ts`): add `--contract <path>` and mention
   it in `--help`. Replace the bare `Contract unavailable: …` error with an actionable message
   naming the three ways to supply one. Add `packages/cli/package.json` `files` coverage for
   the generated JSON (it lives under `src/generated/`, so confirm it lands in `dist` via the
   `vp pack` step or copy it explicitly in the build script).

4. **Docs.** `docs/AI-RULES.md` (where the ladder is defined) and the CLI README must state
   that `audit --ai` runs in any project with no setup, and document `--contract`. Add
   `cascivo audit --ai src` to the recommended `lint` script in `docs/GETTING-STARTED.md`
   beside `cascivo doctor --ci` — the adopter reached for `doctor` only because `audit` failed.

### Tests

- **`packages/cli/src/utils/contract.test.ts`**: each resolution tier in isolation
  (explicit path; monorepo walk-up; bundled; network mocked; network-failure → bundled).
- **`packages/cli/src/commands/audit.test.ts`**: `--contract` honored; the missing-contract
  message names all three options.
- **Extend `scripts/checks/cold-adopter.test.ts`** — it already packs a package, extracts it
  **outside** the repo tree and scrubs the environment, which is exactly the harness needed:
  add a leg that packs `cascivo`, extracts it outside the tree, runs
  `cascivo audit --ai <fixture>` with no network and no repo checkout, and asserts a real
  report (not the contract error). This is the test that would have caught the bug.
- A generator unit test asserting `audit-contract.json` still satisfies `buildContract`'s input
  shape, so a change to the big artifacts can't silently break the small one.

### Acceptance

- Packed `cascivo` audits a fixture app outside the repo, offline, in CI.
- `pnpm regen && git diff --exit-code` clean (new generated artifact committed).
- Bundled artifact ≤ 100 KB raw; note the measured size in the PR body.
- Changeset: **minor** on `cascivo`.

---

## §WS-6 (P1) — Distribution channel derived from the export list, not the source path

### Problem

`scripts/llms/generate.ts:179-188`:

```ts
function packageFor(entry: RegistryEntry): '@cascivo/react' | '@cascivo/charts' | null {
  if (entry.type === 'chart') return '@cascivo/charts'
  if (entry.type === 'block') return null
  const first = entry.files?.[0] ?? ''
  if (first.includes('/packages/components/src/')) return '@cascivo/react'
  return null   // ← everything under packages/layouts/src lands here
}
```

`packages/react/src/index.ts:192-197` exports `Grid`, `GridItem`, `Flex`, `Columns`, `Center`,
`Spacer`, `AutoGrid` — all sourced from `packages/layouts/src/`. So the generated surfaces are
**wrong for six importable primitives**: `apps/site/public/llms/layout/flex.md` says _"Copy-paste
only — this block/layout is not published as an importable package"_ and the `llms.txt` index
line (`:484`) tags it `_(copy-paste)_`, while `docs/RECIPE-DASHBOARD.md:20` correctly says all
three of grid/auto-grid/flex are exported from `@cascivo/react`. The eight genuinely
copy-paste-only layouts (`page-header`, `dashboard-layout`, `app-shell`, `auth-layout`,
`masonry`, `section`, `settings-layout`, `split-view`) get the same label, so the label carries
no information. `scripts/checks/llms-channels.test.ts` doesn't catch it: it checks the
*presence* of a channel annotation and npm-package/stylesheet consistency, never the
annotation's **truth**.

The adopter hand-wrote a 25-line `PageHeader` because they could not tell the two groups apart.
On the current labels, they could not have.

### Spec

1. **Extract the real export list.** Add `scripts/registry/react-exports.ts` exporting a
   function that returns the set of component names `@cascivo/react` exports. Derive it from
   the built `packages/react/dist/index.d.ts` when present, falling back to parsing the
   `export * from '…'` / `export { … }` statements of `packages/react/src/index.ts` (so `regen`
   works on a cold tree, per the CLAUDE.md build-ordering constraint). This must be the single
   source of truth for "is it importable".

2. **`packageFor` / `channelLabel`** (`scripts/llms/generate.ts:179-200`) — resolve from that
   set keyed by the entry's **display name** (`entry.meta.name`), not from `entry.files[0]`.
   Keep the chart/npm-`install` branches. Blocks stay `null` only if genuinely absent from the
   export set — do not special-case by `type` any more; let the data decide.

3. **Registry field.** Add `channels` to each registry entry in
   `scripts/registry/generate.ts`, e.g. `["copy"]`, `["copy","npm:@cascivo/react"]`,
   `["npm:@cascivo/charts"]`. This makes the fact machine-readable for the CLI, MCP, the site
   and the docs generators instead of each re-deriving it. Update
   `packages/registry/schema` accordingly.

4. **Surface it everywhere the fact is stated.**
   - Per-component `/llms/<name>.md` "Install" section: for a dual-channel entry, show **both**
     the `import { Flex } from '@cascivo/react'` line and the `npx cascivo add layout/flex`
     line, and delete the false "copy-paste only" sentence. For a genuinely copy-paste-only
     entry keep the sentence and say what to do instead ("copy it, or compose it from
     `Flex` + `Heading`").
   - `context/<name>.md` and the `llms.txt` index lines: same channel string, from `channels`.
   - **`docs/RECIPE-DASHBOARD.md`** — add a **Channel** column to the component-map table
     (this is the adopter's own suggestion, and the recipe is where they were reading). Every
     row gets `@cascivo/react` / `@cascivo/charts` / `copy-paste`. The prose "All exported from
     `@cascivo/react`" at `:20` goes away in favor of the per-row fact.
   - The site's per-component page uses `channels` instead of the italic hand-written line.

### Tests

- **Extend `scripts/checks/llms-channels.test.ts` with a truth check:** for every registry
  entry, `channels` includes `npm:@cascivo/react` **iff** its display name is in the
  `@cascivo/react` export set. This is the guard that fails today and would have caught all
  six mislabels. Zero allowlist — if an entry is genuinely ambiguous, the export list is the
  answer.
- Assert no generated markdown contains "copy-paste only" for an entry whose `channels`
  include an npm package.
- **`scripts/checks/docs-imports.test.ts`** already resolves `@cascivo/*` imports in the
  guides; extend it (or `md-tables.test.ts`) to assert every Channel-column value in
  `RECIPE-DASHBOARD.md` matches `registry.json`'s `channels` for that entry — so the recipe
  cannot drift from the registry again.

### Acceptance

- `pnpm regen && git diff --exit-code` clean after committing regenerated artifacts.
- `pnpm llms:check` green, and red on a deliberately reverted `packageFor`.
- Spot-check: `apps/site/public/llms/layout/flex.md` shows the `@cascivo/react` import;
  `…/layout/page-header.md` still says copy-paste and suggests the composition.

---

## §WS-7 (P1) — Document every prop default, and guard it

### Problem

`<Flex justify="between">` silently produced a centered **vertical** stack, because
`flex.tsx:16` defaults `direction = 'vertical'` — where CSS `flex-direction`, Chakra `Flex`,
MUI `Stack` in row mode and Radix Themes `Flex` all default to row. The props table in
`/llms/layout/flex.md` renders a `Default` column showing `—`, because `flex.meta.ts:10-15`
omits `default`. There was nothing to read; the adopter opened the shipped JS, after three
wrong layouts.

This is not one manifest. Measured over `registry.json` + the shipped sources: **349 props
carry a TypeScript destructuring default; 126 of them across 73 components document none**
(Accordion, Avatar, Breadcrumb, Calendar, Combobox, CommandMenu, DataTable, DatePicker, Dock,
Drawer, Field, …). `PropMeta.default` has existed all along (`types.ts:19`) and 387 props use
it — so the machinery works and the discipline is optional. `props-parity` validates names and
types in both directions and has never looked at defaults.

### Spec

1. **New guard `scripts/checks/prop-defaults-parity.test.ts`** (wire into `meta:check`, next to
   `props-parity`): for every registry entry with a `.tsx` source, parse the component's
   parameter destructuring pattern; for each prop with a literal default in the signature,
   assert `meta.props[].default` is present and **matches** the literal (normalizing quotes and
   whitespace). Report `Component.prop — signature says 'vertical', meta says (nothing)`.
   - Handle the real shapes in this codebase: destructured params with defaults, defaults
     applied inside the body (`const size = props.size ?? 'md'`), and props whose default is
     an expression (`() => {}`, an imported constant) — for the expression case require *a*
     documented default string but do not compare values.
   - Seed an `ALLOWLIST` with a written reason per entry **only** for the expression cases;
     the 126 measured gaps are to be **fixed, not allowlisted**. State the count in the file
     header so a future reader knows the sweep was completed rather than deferred.
2. **Sweep all 126.** Mechanical and verifiable; do it in one PR (or one PR per package if
   review size demands), driven by the guard's own output. Then `pnpm regen` so
   `registry.json`, `/llms/*.md` and `/context/*.md` carry the defaults.
3. **`Flex` specifically** — beyond documenting the default:
   - `flex.meta.ts`: `default: "'vertical'"` on `direction`, and a `whenNotToUse`/description
     note that this differs from CSS's `row` default, since that mismatch is what actually
     costs time.
   - Add `⚠` prose to the `Flex` description that the generated doc surfaces:
     _"Unlike CSS `flex-direction`, `direction` defaults to `'vertical'` — pass
     `direction="horizontal"` for a row."_
   - **Do not change the default.** It is a breaking change across 192 components' worth of
     consumer code and every copied `layout/flex`; the report itself only asks for
     documentation ("at minimum document the default"). Record the rejected option in
     `docs/ROADMAP.md` as a candidate for the next major, so the question is answered once.
4. **`CLAUDE.md`** — add `default` to the manifest checklist in "Checklist before committing a
   component", so new components arrive documented.

### Tests / Acceptance

- `pnpm meta:check` green; red when a `default` is deleted from any meta.
- `pnpm regen && git diff --exit-code` clean.
- Spot-check `/llms/layout/flex.md` shows `'vertical'` in the Default column and the ⚠ note.
- Changeset: **patch** (docs/metadata only; no runtime change).

---

## §WS-8 (P1) — Reconcile `llms.txt`'s SSR section with `USING-WITH-VITE-SSR.md`

### Problem

`scripts/llms/generate.ts:657-667` emits, into the file most likely to be an agent's only
fetched context:

> SSR SETUP … an unconfigured SSR build throws `Unknown file extension ".css"` … **Two required
> steps:** 1. In vite.config: `ssr: { noExternal: [/^@cascivo\//] }` …

and `:860-865` repeats it. `docs/USING-WITH-VITE-SSR.md:3` says _"As of `@cascivo/react` 0.10,
SSR works with zero Vite config"_ — and the docs page is right; the adopter server-rendered
0.11.1 with an untouched `vite.config.ts`, which the report lists under "what went well". So
the agent-facing surface instructs agents to add dead config, and — worse for trust — the
first thing an adopter verifies is the claim that turns out to be stale.

### Spec

1. **`scripts/llms/generate.ts`** — rewrite both blocks to lead with the current truth:
   zero-config on `@cascivo/react` ≥ 0.10 (the `dist/node/` CSS-free graph selected by the
   `node` export condition — `packages/react/vite.config.ts:71-78`), with the `noExternal`
   recipe demoted to an explicitly version-gated "if you are pinned below 0.10" note, phrased
   identically to `USING-WITH-VITE-SSR.md:57`. Mirror the doc's structure so the two read as
   one statement.
2. **Own the fact once.** Put the SSR support statement in a single constant (a small module
   under `scripts/llms/`, or read the canonical paragraph out of
   `docs/USING-WITH-VITE-SSR.md`) and have the generator emit *that*, so the two cannot drift
   again. Prefer reading from the doc: it makes the doc the owner and the generator a consumer.
3. Sweep the same claim in the other generated/agent-facing surfaces (`skills/`, the MCP
   server's setup text, `packages/react/README.md`, `apps/site` docs routes) and fix any copy
   that still requires `noExternal` unconditionally.

### Tests

- **Extend `scripts/checks/claims.test.ts`** (or `doc-api-drift`): assert that no generated
  agent-facing artifact (`apps/site/public/llms.txt`, `llms/*.md`, `context/*.md`) presents
  `ssr.noExternal` as **required** without a version gate — match the imperative phrasings
  ("Two required steps", "you must add") near `noExternal`. Add the pattern to
  `STALE_PATTERNS` with the reason so the mechanism is reusable next time an SSR fact changes.
- If (2) reads the paragraph from the doc, add a test that the generator's output contains it
  verbatim.

### Acceptance

- `pnpm regen && git diff --exit-code` clean; `pnpm claims:check` green and red on a revert.
- Manual read of the regenerated `llms.txt` SSR section against
  `docs/USING-WITH-VITE-SSR.md:1-60` — they must not contradict on any sentence.

---

## §WS-9 (P2) — Publish the accessible-name prop contract

### Problem

Guessing one component's API from another's fails:

| Concept | `IconButton` | `OverflowMenu` | `SideNav` | `Sparkline` | `CommandMenu` |
| --- | --- | --- | --- | --- | --- |
| accessible label | `label` | `ariaLabel` | `ariaLabel` | `label` | `label` |
| menu-item identity | — | `value` | — | — | `id` |

The adopter wrote `<OverflowMenu label=… items={[{ id, label }]}>` by analogy and got two TS
errors. The docs are correct per component — this is a consistency cost, and with 192
components it compounds. `docs/AI-RULES.md` already publishes an **event-handler** naming
contract ("name the callback by what it receives"); there is no equivalent for names or item
identity.

Survey of `main`: `ariaLabel` appears on exactly 5 entries (Breadcrumb, Dock, OverflowMenu,
SideNav, Steps); `label` on 38; **no component uses both**. In the `ariaLabel` five, the value
is always an invisible name for a container/trigger. In the `label` 38 it is sometimes rendered
text (Field, Checkbox) and sometimes an invisible name (`icon-button.tsx:9` → `aria-label` at
`:27`). So there *is* a latent rule; it was never written down, and `IconButton`/`Sparkline`
are on the wrong side of it.

### Spec

1. **Publish the rule** in `docs/AI-RULES.md`, as a sibling table to "Event-handler naming" —
   same "name the prop by what it is" logic:
   - `label` — text the component **renders** (Field, Checkbox, Search's visually-hidden but
     real `<label>`).
   - `ariaLabel` — an **invisible** accessible name applied via `aria-label` to a
     trigger/container that has no visible text (icon-only buttons, nav landmarks, menu
     triggers).
   - Item identity in a collection: **`value`** for selection-like items (menus, selects);
     `id` only when the item also needs a DOM id. Name the components that predate the rule.
   - Mirror the table into `CLAUDE.md`'s component-authoring rules so new components comply.
2. **Do not rename existing props.** Breaking 192 components' consumers to fix a naming
   inconsistency the docs already document correctly is a bad trade. Instead:
   - Add an **accepted alias** on the two clearest offenders where the current name is an
     invisible accessible name: `IconButton` and `Sparkline` accept `ariaLabel` as an alias for
     `label` (both continue to work; `label` stays non-deprecated). Reflect it in their metas
     and note it in `UPGRADING.md`. This makes the rule guessable in the direction adopters
     actually guess.
   - Record a "unify to `ariaLabel` for invisible names" item in `docs/ROADMAP.md` for the next
     major.
3. **Add a lookup table** to `docs/RECIPE-DASHBOARD.md` (and the `llms.txt` index preamble)
   listing, for the ~15 components a dashboard uses, the accessible-name prop and the
   item-identity prop. This is what an agent needs at the point of use; the general rule alone
   won't stop the mistake for pre-existing components.

### Tests

- **Extend `scripts/checks/props-parity.test.ts`** (or a new small guard): a **new** component
  may not introduce a prop whose value lands in `aria-label` while being named `label`. Seed
  the allowlist with the existing offenders **plus a comment naming this plan**, so the debt is
  visible and the rule binds going forward.
- `md-tables.test.ts` covers the new tables' formatting; assert the accessible-name column
  matches each component's real props from `registry.json`.

### Acceptance

- `pnpm meta:check` + `pnpm claims:check` green.
- `<IconButton ariaLabel="Close" />` type-checks and renders `aria-label="Close"`, tested.
- Changeset: **minor** on `@cascivo/react` (additive props).

---

## §WS-10 (P2) — `CardHeader`: answer the title + action layout

### Problem

`card.module.css:35-44` hard-codes `flex-direction: column` on `.header`, so
`justify-content: space-between` does nothing until the consumer also re-sets
`flex-direction: row`. A card with a title left and an overflow menu right is the single most
common dashboard card layout; it renders as a centered stack, which looks intentional enough
that the adopter needed a screenshot to notice, and worked around it in app CSS.

The column default is right for the common title-over-description case, so this is not a
"wrong default" — it is a **missing first-class pattern**. `Card` exports only
Card/CardHeader/CardTitle/CardContent/CardFooter, and `card.meta.ts` ships no example of the
title+action shape.

### Spec

1. **Keep the column default.** Changing it breaks every existing header.
2. **Add the pattern as API.** Preferred: an `actions?: ReactNode` prop on `CardHeader` that
   renders a row wrapper — title/description column on the inline-start, actions on the
   inline-end, `align-items: flex-start`, `gap` from the space scale, and `min-inline-size: 0`
   preserved on the text column so long titles truncate instead of pushing the actions out.
   All CSS inside `@layer cascivo.component` via native nesting (no new layer name), logical
   properties throughout, and a `@media (pointer: coarse)` check that an icon-button in the
   actions slot still reaches the 44px target.
   - Consider instead/additionally a `data-layout="row"` attribute escape hatch; pick one, do
     not ship both.
3. **Document it where it is looked for:** a `card.meta.ts` example titled
   "Title with an action menu" (the exact dashboard shape), a note on `CardHeader` that the
   default is a column and `actions` is how you get a row, and a row in
   `docs/RECIPE-DASHBOARD.md`'s project-card entry.

### Tests / Acceptance

- `card.test.tsx`: `actions` renders inside the header, after the title in DOM order, and the
  header exposes the row layout; a long title does not overflow the card (assert the
  `min-inline-size: 0` contract via the class/attribute the CSS keys off).
- `pnpm layers:check`, `pnpm unlayered:check`, `pnpm breakpoint:check`, `pnpm apg:check` green.
- Mobile sweep at 320/360/390/414 (`scripts/checks/mobile-sweep.ts`).
- Changeset: **minor** on `@cascivo/react`.

---

## §WS-11 (P2) — `Kpi`: controllable delta formatting; reconcile with `Stat`

### Problem

`packages/charts/src/charts/kpi/kpi.tsx:6-19`: `delta?: number`, formatted by a private
`formatDelta` (sign + `toLocaleString`), with no `deltaFormat`/`deltaSuffix`. So
`<Kpi delta={25.6} deltaLabel="vs previous 7d" />` renders `▲ +25.6` and a percentage delta
**cannot** be shown as `+25.6%` — the most common dashboard delta there is. `Stat` takes
`delta` as a pre-formatted `string`, so the two tile components disagree about who owns
formatting. Separately, `deltaLabel` wraps awkwardly in a 4-up `AutoGrid` tile.

### Spec

1. **Additive, non-breaking, on `Kpi`:**
   - `deltaFormat?: 'number' | 'percent' | ((delta: number) => string)`, default `'number'`
     (current behavior). `'percent'` appends `%` and formats via
     `Intl.NumberFormat(currentLocale(), { style: 'percent' … })` — or a plain suffix if the
     incoming number is already in percentage points (`25.6` → `+25.6%`, **not** `+2560%`).
     Decide and document which; the report's example implies percentage points, so treat
     `delta` as already-scaled and append the unit.
   - Keep `delta?: number`. Do not switch to `Stat`'s string, and do not change `Stat` — the
     numeric input is what lets `Kpi` color and arrow the delta.
   - Locale: route through `@cascivo/i18n` like the rest of the catalog rather than bare
     `toLocaleString()`.
2. **Reconcile the two components in docs, not in code.** Add to both metas' `intent` (and
   thus `/context/*.md`) a one-liner: `Kpi` takes a **numeric** delta and owns formatting
   (arrow + color + unit); `Stat` takes a **pre-formatted string** and you own it. Cross-link
   them, the way same-name entries already cross-link
   (`scripts/llms/generate.ts:220-226`).
3. **`deltaLabel` wrapping** — the tile is a `@container`-shaped problem: at narrow inline
   sizes put `deltaLabel` on its own line and allow it to wrap on word boundaries; at wider
   sizes keep it inline. Use a min container query at an on-scale width (`30rem`/`40rem` —
   `pnpm breakpoint:check` enforces the scale). `Kpi` currently styles via inline `style`
   objects, so this needs a CSS module (or a `.module.css` addition) inside
   `@layer cascivo.component`; note that as part of the diff.

### Tests / Acceptance

- `kpi.test.tsx`: `'number'` output unchanged (regression lock), `'percent'` renders `+25.6%`,
  a function formatter is used verbatim, negative deltas keep the destructive color and arrow,
  `delta={0}` is treated as non-negative (current behavior at `:23`).
- `pnpm breakpoint:check`, `pnpm layers:check`, `pnpm unlayered:check`, `pnpm i18n:check` green.
- Mobile sweep of a 4-up `AutoGrid` of `Kpi` at 320/360/390/414.
- Changeset: **minor** on `@cascivo/charts`.

---

## §WS-12 (P2) — The app's own layer slot: one answer, in the order statement

### Problem

`docs/AI-RULES.md:18-19` tells an agent to put page styles in "the app's own slot (e.g.
`cascivo.example`, **declared in the order statement**)" — and the canonical statement it prints
at `:31` contains no app slot, so where it goes is left to guessing. Worse,
`docs/CSS-LAYERS-PITFALL.md` answers it **twice, differently**: `:52-55` says insert app-local
sublayers "between `cascivo.blocks` and `cascivo.override`" (matching
`packages/tokens/src/layers.css:28-30`, the single source of truth), while its own worked
example at `:69-71` puts `cascivo.example` between `cascivo.component` and `cascivo.theme`.

The adopter guessed `cascivo.console` between `blocks` and `override` — correct — and asked for
"a one-line worked example". Because layer order beats specificity, a wrong guess here silently
loses every app style to a theme; this is a P2 by blast radius, not by effort.

### Spec

1. **Pick the canonical position: between `cascivo.blocks` and `cascivo.override`**, per
   `layers.css:28-30`. Rationale to state in the docs: the app slot must beat shipped
   components, themes and blocks, but must **not** beat `cascivo.override`, which stays the
   consumer's last-resort escape hatch.
2. **Fix `CSS-LAYERS-PITFALL.md:69-71`** — move `cascivo.example` in the example order
   statement to match its own prose and `layers.css`. Then add the one-line worked example the
   adopter asked for, showing the full statement plus one rule:

   ```css
   @layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme,
     cascivo.blocks, cascivo.myapp, cascivo.override;
   @layer cascivo.myapp {
     .dashboard-toolbar { gap: var(--cascivo-space-3); }
   }
   ```

3. **`docs/AI-RULES.md`** — print the statement **with** the app slot in it (named
   `cascivo.myapp` so it is obviously a placeholder), so the instruction and the example agree
   in the pasteable block.
4. Sweep every other copy of the order statement in the docs (`THEMING.md`, `TOKENS.md`,
   `GETTING-STARTED.md`, `MIGRATING-FROM-SHADCN.md`, the CLI scaffold, `skills/`) so all show
   the slot in the same position.

### Tests

- **Extend `scripts/checks/layer-order.test.ts`**: it already asserts every shipped/scaffolded
  statement is an ordered subsequence of the canonical one. Add an assertion that any
  statement containing a **non-canonical** (app-local) layer name places it immediately before
  `cascivo.override` — which fails on `CSS-LAYERS-PITFALL.md:70` today. Include docs markdown
  code fences in the scanned set (currently focused on shipped CSS + scaffolds).

### Acceptance

- `pnpm layers:check` green, and red when `cascivo.example` is moved back before
  `cascivo.theme`.
- Every order statement across the repo shows the app slot in the same position.

---

## §WS-13 (P3) — Recipe minors, and the one unreproducible item

1. **`RelativeTime`'s `now` prop in the dashboard recipe.** Every deploy console has a
   "3 minutes ago" column, and the adopter derived all mock timestamps from a fixed epoch to
   keep SSR output stable — the `now` prop exists for exactly that. Add it to
   `docs/RECIPE-DASHBOARD.md`'s `relative-time` row with a one-line SSR rationale, and make
   sure `relative-time.meta.ts`'s example shows `now` in an SSR context.
2. **`DataTable`'s `Column.width`.** Documented at `data-table.meta.ts:201-204` but absent from
   every example, so a commit-hash column wrapped mid-hash. Add `width` to the recipe's
   `DataTable` row and to one meta example (a hash/ID column is the right one), noting that
   default sizing does not consider content shape.
3. **`Search` label visibility — reproduce first, do not change code on the report's word.**
   `search.module.css:29-41` visually hides `.label` correctly (`clip-path: inset(50%)`,
   `overflow: hidden`, 1px box). Steps: build a minimal SSR app importing **only**
   `@cascivo/react/styles.css` and one importing `@cascivo/themes/all.css` only, and check
   whether the label is visible in either. If it reproduces, it is a **CSS-delivery** bug
   (per-component stylesheet not reaching the consumer) and belongs with
   `packages/react/scripts/check-styles-complete.mjs` — escalate it to P0, because it would
   mean shipped component CSS can go missing. If it does not reproduce, record it as
   **REFUTED with the evidence** in the triage table and add one line to the `Search` docs
   ("the `label` renders as a visually-hidden `<label>`; pass `label` to change the accessible
   name, not to add visible text") so the next reader doesn't re-file it.

Acceptance: `pnpm docs-routes:check`, `pnpm claims:check`, `pnpm meta:check` green;
`pnpm regen` committed; the item-3 outcome written into §1 either way.

---

## §WS-14 (P0) — The anti-recurrence gates (this is the workstream that matters)

Each gate maps to one mechanism from §0. **A workstream is not done until its gate exists and
has been observed failing on a deliberate revert.** State that observation in the PR body —
"added the guard" without "watched it fail" is how a guard that tests nothing gets merged.

| Gate | New/extended | Mechanism | Catches |
| ---- | ------------ | --------- | ------- |
| `scripts/checks/self-subscribe-parity.test.ts` | **new**, in `meta:check` | A | The list of self-subscribing hooks in `docs/HEADLESS.md` ↔ the exported list in `self-subscribe.test.tsx` ↔ a `useSignals()` call in each hook's source. Bidirectional: a hook in the docs with no test fails; a hook with a test missing from the docs fails. |
| `packages/core/src/self-subscribe.test.tsx` | extended | A | Every claimed hook actually re-renders a transform-less React component. |
| `scripts/checks/path-b-parity.test.ts` | **new**, in `meta:check` | A | Every primitive the reactivity contract names is a named export of `@cascivo/react`. |
| `scripts/checks/llms-channels.test.ts` | extended | B | `channels` ↔ the real `@cascivo/react` export set. Zero allowlist. |
| `scripts/checks/prop-defaults-parity.test.ts` | **new**, in `meta:check` | B | A signature default with no `meta.default`. |
| `scripts/checks/primitive-adoption.test.ts` | extended | B | Module-level counters reaching DOM ids (the `Search` shape). |
| `scripts/checks/claims.test.ts` / `doc-api-drift.test.ts` | extended | C | `noExternal` presented as unconditionally required in any generated agent-facing artifact. |
| `scripts/checks/layer-order.test.ts` | extended | C | An app-local layer name placed anywhere but immediately before `cascivo.override`. |
| `scripts/checks/cold-adopter.test.ts` | extended | A+B | The two "does the thing an adopter installs actually work" legs: (i) a pnpm app with **only** `@cascivo/react` re-renders on a signal write and server-renders; (ii) the packed `cascivo` CLI audits a fixture outside the repo, offline. |

Wiring: new `meta:check` entries go in the root `package.json` `meta:check` script (which
`ready`/`ready:ci` already run); the cold-adopter legs stay on `cold-adopter:check` (release
tier) since they pack and build.

**Process items, same PR series:**

- Update `docs/internal/feedback/README.md`'s "Current live tracker" to point at **this** plan,
  and point the 07-24 plan's header here (WS-K rule 3).
- Carry the 07-24 plan's open items into WS-15 below so there is one live tracker.
- Add a short section to `README.md` in this directory: **"Before writing a fix plan, classify
  each finding as mechanism A / B / C and name the guard."** The three mechanisms are the
  reusable output of this analysis; without that step the next plan lists twelve fixes and no
  gates, and there will be a ninth report.

---

## §WS-15 (P1) — Carry-forward from the 07-24 plan

`fix-plan-vercel-dashboard-adopter-2026-07-24.md` reads *"implemented on
`claude/ui-library-report-analysis-nsjclj`; not yet published"* with WS-1…WS-11 all ✅ and this
remaining: **publish the release train, then run the freshness + npm-parity canaries against
the published artifacts.**

That is why this adopter — testing npm — still met a fixed-on-`main` catalog. Per `README.md`
rule 2, a fix an adopter cannot `pnpm add` is not done. So:

1. Publish the 07-24 train (`@cascivo/react`, `@cascivo/charts`, `@cascivo/themes`,
   `@cascivo/icons`, `@cascivo/core`, `cascivo`), then flip that plan's WS statuses
   `merged → published vX.Y.Z` **in the publishing PR**.
2. Run `bash scripts/checks/deployed-freshness.sh` with `FRESHNESS_CHECK_NPM=1` against
   production and confirm npm ↔ repo ↔ deployed-docs parity.
3. Then publish this plan's train and repeat. WS-1/WS-2/WS-3 are the ones adopters feel; do not
   let them sit on `main`.

---

## §2 — Sequencing

Three PR waves. Waves 1 and 2 are independent internally, so they can be parallelized across
agents; the gate for each workstream ships **with** it, never after.

**Wave 1 — the frozen UI (P0, blocking, ship together as one release).**
WS-1 (wrap + docs + tests) → WS-2 (Path B re-exports + `path-b-parity`) → WS-3 (`Search`
`useId` + guard) → WS-4 (repro-first; primitive fix + `CLAUDE.md` rule). WS-1 and WS-2 land in
the same release: fixing reactivity while the primitives remain unreachable on Path B fixes
nothing for the adopter who reported it.

**Wave 2 — reachability and truth (P1).**
WS-5 (`audit` contract) · WS-6 (channels) · WS-7 (defaults sweep + guard) · WS-8 (SSR text).
WS-6 and WS-7 both end in `pnpm regen`; sequence them or expect a merge conflict in
`registry.json` and `apps/site/public/llms/**`.

**Wave 3 — ergonomics and docs (P2/P3).**
WS-9 · WS-10 · WS-11 · WS-12 · WS-13.

**Throughout:** WS-14's gates land with their workstreams. WS-15 gates every release.

---

## §3 — Definition of done

1. Every workstream's gate exists **and has been observed failing** on a deliberate revert,
   noted in the PR body.
2. `pnpm ready:ci` green from a cold tree.
3. `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` clean.
4. The cold-adopter legs pass: a pnpm app depending **only** on `@cascivo/react` (a) re-renders
   on a signal write with no `useSignals()` call and no Babel transform, (b) server-renders a
   `<Search>` with no hydration mismatch, (c) opens a controlled `CommandMenu` with no
   `console.error`; and the packed `cascivo` CLI audits it offline from outside the repo.
5. `/llms/layout/flex.md` states the `@cascivo/react` import **and** `direction`'s
   `'vertical'` default. Both facts are what the adopter had to read the shipped JS to learn.
6. The regenerated `llms.txt` SSR section does not contradict `USING-WITH-VITE-SSR.md`.
7. This plan's status header and per-WS statuses match what shipped; the tracker pointer in
   `README.md` is updated; the 07-24 plan's header points here.
8. Published to npm, then `FRESHNESS_CHECK_NPM=1 bash scripts/checks/deployed-freshness.sh`
   green — and only then is any of it "fixed".

---

## §4 — What not to change

The report's "what went well" is a list of load-bearing decisions. Do not regress them while
fixing the above:

- **Zero-config SSR** on `@cascivo/react` ≥ 0.10 (`packages/react/vite.config.ts`'s
  `dist/node/` CSS-free module graph). WS-8 fixes the *text*, never the behavior — and WS-2's
  new re-exports must be present in `dist/node/` (`ssr:check`).
- **`setLinkComponent` + `LinkComponentProps`** — called "the right abstraction"; one line
  wired three components to TanStack Router. WS-2 extends the same re-export pattern; keep the
  existing exports byte-identical.
- **`AppShell` / `ShellHeader` / `SideNav`**, and the `⚠` `AppShell` name-collision callout
  that prevented a wrong import — keep the collision cross-linking
  (`scripts/llms/generate.ts:220-226`) intact through WS-6's channel changes.
- **Themes** (`themePreloadScript`, `useTheme()` returning plain strings) — explicitly praised,
  including that the docs pre-empt the `theme.value` mistake. That is the 07-24 WS-1 fix
  working; `doc-api-drift`'s `useTheme` probe must keep passing.
- **The documentation-grade flat `dist/index.d.ts`** — WS-2 adds exports to it; keep
  `flatten-types.mjs` / `check-types-flat.mjs` green and avoid star re-exports that would
  pollute it.
- **`cascivo doctor`**, the per-component `/llms/*.md` pages, the icon-name mapping table, and
  the `npx @cascivo/docs` offline channel — all reported as working well.

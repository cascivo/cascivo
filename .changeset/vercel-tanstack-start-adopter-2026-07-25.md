---
'@cascivo/core': minor
'@cascivo/react': minor
'@cascivo/charts': minor
'cascivo': minor
---

Fix the reactivity contract, SSR ids, and the audit's reachability (2026-07-25 adopter report)

**`useSignal` / `useComputed` now make your component reactive.** They were raw re-exports of
`@preact/signals-react`, so without the Babel signals transform — which no consumer app runs
— a component reading `signal.value` in render never re-rendered. The failure was silent:
handlers fired, signals updated, the UI froze. `docs/HEADLESS.md` had always promised these
subscribe for you; now they do, and the promise is machine-checked rather than prose. The
rule that survives: `useSignals()` is still required for a signal you did **not** get from a
cascivo hook (a module-level `signal()`, a signal passed as a prop, `currentLocale()`).

**Every reactivity primitive is now importable from `@cascivo/react`.** The prebuilt path had
no legal move: the reactivity contract said "use `useSignal`", the SSR guide said never depend
on `@cascivo/core`, and `useSignal` lived only in core. `useSignal`, `useComputed`,
`useSignalEffect`, `useSignals`, `signal`, `computed`, `effect`, `batch`,
`useControllableSignal`, `useEffectPropSignal`, `useDisclosure`, `useMachine`, `useScope`,
`useId`, `useMediaQuery`, `useRovingFocus`, `useTypeahead`, `useAnchorPosition`,
`DismissableLayer`, `Presence`, `Slot`, `VisuallyHidden` and more now ship from
`@cascivo/react`. Import the `Signal`/`ReadonlySignal` **types** from `@preact/signals-react`
(a declared peer you already have).

**New `useEffectPropSignal`** for a controlled prop whose signal is read only inside
`useSignalEffect`. Preact runs effects synchronously on write, so the previously documented
`s.value = prop` idiom executed effect bodies inside React's render phase — `showModal()`,
listener registration against a pre-commit ref, parent `setState` calls. Fourteen sites across
`Modal`, `Sheet`, `Dropdown`, `AlertDialog`, `CommandMenu`, `HeaderPanel`, `Checkbox`,
`Presence`, `useDraggable`, `useInfiniteScroll`, `useResizeObserver` and flow are migrated.
`useControllableSignal` keeps its synchronous mirror, which is correct for a signal read in
render.

Behavioral note: effect work driven by a controlled prop now lands one microtask after the
commit, where it always belonged. If you assert on it synchronously in a test, await the
settle (`await act(async () => …)`).

**`Search` and `usePopover` no longer break SSR hydration.** Both built DOM identifiers from a
module-scoped counter that kept incrementing for the life of the server process, so it
diverged from a freshly-loaded client on essentially every request — a mismatch React does not
patch up, which can leave `<label for>` pointing at nothing. Both use `useId` now.

**`cascivo audit --ai` runs in your project.** It previously searched for `apps/site/public/`,
a directory that only exists in the cascivo monorepo, and died with "token catalog not found"
everywhere else. The contract now ships inside the CLI (~100 KB), with `--contract <path>`,
`--verbose`, and a cached network fallback. No setup, no network required.

**`Kpi` gained `deltaFormat`** (`'number' | 'percent' | (delta) => string`), so a percentage
delta renders as `+25.6%`; values are locale-formatted. **`CardHeader` gained `actions`** for
the title-left / menu-right dashboard card, which the column default made awkward.
**`IconButton` and `Sparkline`** now accept `ariaLabel` as an alias for `label`; exactly one
remains required.

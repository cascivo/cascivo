/**
 * The machine-readable list of hooks that call `useSignals()` for their caller.
 *
 * This exists because the claim used to live only in prose. `docs/HEADLESS.md` promised
 * twelve self-subscribing hooks while the test that locked the promise covered three; ten
 * of the twelve happened to be true, which is exactly what made the gap invisible. The two
 * that were false — `useSignal` and `useComputed` — are the two the reactivity contract
 * tells an adopter to reach for first, and one shipped a silently frozen dashboard on them
 * (2026-07-25 adopter report, finding #1).
 *
 * `doc-api-drift.test.ts` cannot catch that class: it is a blocklist of phrasings already
 * known to be wrong, so it can only catch a claim someone has already discovered is false.
 * This contract is the other half — the claim itself, in a form a test can execute.
 *
 * `self-subscribe-parity.test.ts` asserts, in BOTH directions, that every entry here:
 *   1. calls `useSignals()` in its source file,
 *   2. has a render-and-assert case in the named test file, and
 *   3. is named in the docs list; and that the docs name nothing that is missing here.
 *
 * Adding a signal-returning hook? Add it here, add its test, and name it in the docs — the
 * guard fails until all three agree.
 */

export interface SelfSubscribingHook {
  /** Exported hook name, exactly as the docs and the tests spell it. */
  name: string
  /** Repo-relative source file that must contain the internal `useSignals()` call. */
  source: string
  /**
   * The function whose **body** must contain the `useSignals()` call, when the subscription
   * happens somewhere other than a function of the same name (e.g. `useDisclosure` gets it
   * by delegating to `useControllableSignal`). Defaults to `name`.
   *
   * The guard reads the body with comments stripped, on purpose: an earlier version matched
   * the whole file and passed against a hook whose JSDoc merely *said* it calls
   * `useSignals()` — the prose-instead-of-behavior failure this contract exists to stop,
   * reproduced inside its own guard.
   */
  bodyOf?: string
  /** Repo-relative test file that must contain a case naming this hook. */
  test: string
}

export const SELF_SUBSCRIBING_HOOKS: readonly SelfSubscribingHook[] = [
  {
    name: 'useSignal',
    source: 'packages/core/src/signals.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useComputed',
    source: 'packages/core/src/signals.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useControllableSignal',
    source: 'packages/core/src/controllable.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useDisclosure',
    source: 'packages/core/src/controllable.ts',
    bodyOf: 'useControllableSignal', // useDisclosure subscribes by delegating to it
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useMediaQuery',
    source: 'packages/core/src/media-query.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useMachine',
    source: 'packages/core/src/machine.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useRovingFocus',
    source: 'packages/core/src/roving-focus.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useStreamBuffer',
    source: 'packages/core/src/stream-buffer.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useScope',
    source: 'packages/core/src/scope.ts',
    test: 'packages/core/src/self-subscribe.test.tsx',
  },
  {
    name: 'useAnchorPosition',
    source: 'packages/core/src/anchor.tsx',
    test: 'packages/core/src/anchor.test.tsx',
  },
  {
    name: 'useTheme',
    source: 'packages/react/src/theme.tsx',
    test: 'packages/react/src/theme.test.tsx',
  },
  {
    name: 'useForm',
    source: 'packages/components/src/form/form.tsx',
    test: 'packages/components/src/form/form.test.tsx',
  },
]

/**
 * Hooks deliberately NOT on the list, with the reason — so "it isn't here" is a decision
 * rather than an omission. The guard asserts the docs do not claim these self-subscribe.
 */
export const NOT_SELF_SUBSCRIBING: readonly { name: string; why: string }[] = [
  {
    name: 'useEffectPropSignal',
    why: 'Returns a signal for `useSignalEffect` consumers only — subscribing the caller would invite the render read it is documented never to serve.',
  },
]

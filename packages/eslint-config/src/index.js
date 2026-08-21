/**
 * `@cascivo/eslint-config` — flat-config fragments for apps that use cascivo.
 *
 * ## Why this package exists
 *
 * `eslint-plugin-react-hooks@7` ships `react-hooks/immutability`, enabled by default in
 * `recommended-latest`. It reports any write to a value returned from a hook — which is
 * exactly cascivo's mandatory state idiom:
 *
 * ```
 * error  Error: This value cannot be modified
 * Modifying a value returned from a hook is not allowed.
 *   onValueChange={(v) => (env.value = v)}
 *                          ^^^ `env` cannot be modified
 * ```
 *
 * `docs/AI-RULES.md` says "Local state -> `useSignal(initial)` … Never `useState`", and
 * `docs/HEADLESS.md`'s canonical example is `onClick={() => (open.value = !open.value)}`.
 * So a stock 2026 React app lints the documented idiom as an error on every piece of state
 * the adopter wrote. One reported build hit this 8 times across 3 files — every lint error
 * in the app, and nothing else.
 *
 * ## Why the rule is turned off rather than narrowed
 *
 * A signal write through `.value` is a deliberate mutation of a live reactive cell; that is
 * the whole point of the primitive. The rule cannot distinguish it from an accidental
 * mutation of `useState` output, and it has no allowlist option for hook names. There is no
 * narrower mechanism, so the honest thing is to turn it off and say what that costs:
 * **you lose the rule's protection against genuinely mutating React state elsewhere in the
 * file.** If that matters more to you than ergonomics, drop `cascivoSignals` and write
 * `signal.value = x` behind a `// eslint-disable-next-line` at each site instead.
 *
 * ## Usage
 *
 * ```js
 * // eslint.config.js
 * import cascivo from '@cascivo/eslint-config'
 *
 * export default [
 *   // …your existing config…
 *   ...cascivo,
 * ]
 * ```
 *
 * Spread it AFTER the configs it adjusts — flat config is last-wins.
 *
 * Prefer the pieces individually when you only vendor source, or only use the package:
 *
 * ```js
 * import { cascivoSignals, cascivoPropVocabulary, cascivoVendoredSource } from '@cascivo/eslint-config'
 * export default [...yourConfig, cascivoSignals, cascivoPropVocabulary, cascivoVendoredSource()]
 * ```
 */
import cascivoPlugin from '@cascivo/eslint-plugin'

/**
 * Reconciles `eslint-plugin-react-hooks@7` with cascivo's signal-based reactivity.
 *
 * Applies everywhere by default — signal writes live in *your* page and component code,
 * not just in vendored files, so a directory-scoped override cannot cover them. That is
 * precisely why the pre-existing `src/components/ui/**` recipe did not help prebuilt-path
 * (Path B) adopters, who have no such directory at all.
 */
export const cascivoSignals = {
  name: 'cascivo/signals',
  rules: {
    // See the module header for the full rationale and what turning this off costs.
    'react-hooks/immutability': 'off',
  },
}

/**
 * Host stylistic rules scoped off source you vendored with `cascivo add`.
 *
 * Only relevant on the copy-paste path (Path A). `cascivo update` re-copies these files, so
 * any in-place style fixes are undone on the next update — scoping the rules off is the
 * durable move. Correctness rules stay on.
 *
 * @param {string} [glob] Your `outputDir` from `cascivo.config.ts`, as a glob.
 */
export function cascivoVendoredSource(glob = 'src/components/ui/**') {
  return {
    name: 'cascivo/vendored-source',
    files: [glob],
    rules: {
      // Style: `T[]` vs `Array<T>`, import ordering, generic-param naming (`Row` vs
      // `TRow`), method-signature style — cascivo does not adopt these.
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/method-signature-style': 'off',
      'sort-imports': 'off',
      'import/order': 'off',
      // Opinionated / misfires on legitimate cascivo patterns:
      'react/no-array-index-key': 'off', // stable-content lists key by index intentionally
      'no-shadow': 'off', // false-positives on TS declaration merging (compound components)
      'no-control-regex': 'off', // e.g. the log viewer strips ANSI escapes (\x1b) on purpose

      // ---------------------------------------------------------------------------------
      // Everything below was DERIVED FROM A RUN, not authored from memory.
      // scripts/checks/host-lint/eslint runs real ESLint over the vendored source in CI and
      // fails if any of these stops firing (a scope-off with nothing behind it is removed)
      // or if a new class appears. Before that fixture existed this list covered only
      // stylistic rules and the eight below were invisible — 117 errors an adopter saw and
      // cascivo did not. See docs/internal/feedback/README.md, Mechanism F.
      // ---------------------------------------------------------------------------------

      // 34 sites. cascivo's house style PRESCRIBES the render-phase ref write:
      // CLAUDE.md, "Syncing a controlled React prop into a signal" —
      //     const onCloseRef = useRef(onClose)
      //     onCloseRef.current = onClose // sync during render
      // It is how a `useSignalEffect` body reaches the *current* callback without
      // re-subscribing the effect to it. The remaining sites pass a ref into
      // `composeRefs()`/`cloneElement()`, which the rule cannot prove is deferred.
      // Rewriting 41 call sites to satisfy a rule the documented idiom contradicts is the
      // wrong trade; turning it off costs you the rule's protection against genuine
      // render-phase ref *reads* elsewhere in the vendored files only.
      'react-hooks/refs': 'off',

      // 2 sites, both `const LinkComponent = getLinkComponent()`. The value is deliberately
      // swappable at runtime via `setLinkComponent()` — that is the entire point of the
      // router-integration seam — so it cannot be hoisted to module scope. The state-reset
      // the rule warns about does not occur: the registry holds one stable component
      // identity between `setLinkComponent` calls.
      'react-hooks/static-components': 'off',

      // 69 sites. TYPE-AWARE, and its verdict depends on which `@types/react` resolves in
      // YOUR project. The bulk are deliberate cross-version escape hatches:
      // `{ anchorName } as CSSProperties` (CSS Anchor Positioning is absent from older
      // `CSSProperties`) and `ref as never` (ref variance changed in @types/react 19).
      // "Unnecessary" under one version is load-bearing under another, so removing them on
      // the rule's advice would break adopters on a different version — the exact failure
      // mode tracked in docs/internal/feedback as the `@types/react` mechanism.
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',

      // 10 sites, all exhaustive-union final branches and runtime-nullable DOM reads:
      // the closing `else if (placement === 'right')` of an if-chain TS has already
      // narrowed, `if (phase === 'dismissing')` closing an FSM switch, `el.textContent ?? ''`
      // (typed non-null on Element, nullable at runtime on some node types). Writing the
      // final branch explicitly is clearer than a bare `else`, and dropping the `??` would
      // be a real regression. Also type-aware, so also tsconfig-dependent.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
    linterOptions: {
      // cascivo's rule-scoped `eslint-disable` directives may target rule ids your config
      // doesn't define — don't report them as "unused".
      reportUnusedDisableDirectives: 'off',
    },
  }
}

/**
 * The near-miss prop messages, at `warn`.
 *
 * `<Text tone="subtle">` is a correct TypeScript error whose text — "Property 'tone' does not
 * exist on type 'TextProps'" — names the mistake and teaches nothing, so the adopter goes
 * looking for the docs. That is the dependency the 2026-08-21 report named: "the docs are
 * doing work the API should eventually do itself." Most of that work moved into the types;
 * this rule carries the part TypeScript structurally cannot say. See
 * `@cascivo/eslint-plugin`'s `prop-vocabulary.js` for the full rationale.
 *
 * **`warn`, never `error`.** A lint rule that fails somebody's build over a naming opinion
 * gets the whole config deleted — and that takes `react-hooks/immutability` with it, which is
 * the thing this package exists for. Raise it yourself if you want it enforced.
 */
export const cascivoPropVocabulary = {
  name: 'cascivo/prop-vocabulary',
  plugins: { cascivo: cascivoPlugin },
  rules: { 'cascivo/prop-vocabulary': 'warn' },
}

/** All three fragments, in the order flat config wants them. Spread last. */
const cascivo = [cascivoSignals, cascivoPropVocabulary, cascivoVendoredSource()]

export default cascivo

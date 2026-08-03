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
 * import { cascivoSignals, cascivoVendoredSource } from '@cascivo/eslint-config'
 * export default [...yourConfig, cascivoSignals, cascivoVendoredSource()]
 * ```
 */

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
    },
    linterOptions: {
      // cascivo's rule-scoped `eslint-disable` directives may target rule ids your config
      // doesn't define — don't report them as "unused".
      reportUnusedDisableDirectives: 'off',
    },
  }
}

/** Both fragments, in the order flat config wants them. Spread last. */
const cascivo = [cascivoSignals, cascivoVendoredSource()]

export default cascivo

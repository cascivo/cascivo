/**
 * Flat-config fragments for apps using cascivo.
 *
 * Typed loosely on purpose: ESLint's flat-config object type lives in `eslint`, which this
 * package deliberately does not depend on — it ships plain data, so it stays installable
 * next to any ESLint 9+ without a version handshake.
 */

/** A single ESLint flat-config object. */
export interface CascadeFlatConfig {
  name?: string
  files?: string[]
  rules?: Record<string, unknown>
  linterOptions?: Record<string, unknown>
}

/**
 * Turns off `react-hooks/immutability`, which reports cascivo's mandatory signal-write
 * idiom (`signal.value = next`) as an error under `eslint-plugin-react-hooks@7`'s
 * `recommended-latest`. Applies to all files — signal writes live in your own page code,
 * not only in vendored source.
 */
export declare const cascivoSignals: CascadeFlatConfig

/**
 * Scopes host stylistic rules off source vendored by `cascivo add`. Copy-paste path only.
 *
 * @param glob Your `outputDir` from `cascivo.config.ts`. Defaults to `src/components/ui/**`.
 */
export declare function cascivoVendoredSource(glob?: string): CascadeFlatConfig

/** Both fragments. Spread last in your flat config — last-wins. */
declare const cascivo: CascadeFlatConfig[]
export default cascivo

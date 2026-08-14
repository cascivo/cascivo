/**
 * `@cascivo/react/types` — the catalog-wide vocabulary types, importable on the prebuilt path.
 *
 * ## Why this is a separate entry point
 *
 * These are the types of PUBLISHED PROPS: `Status.status` and `Badge.variant` are `ToneInput`,
 * every layout `gap` is a `SpaceStep`. So the first thing a TypeScript dashboard writes — a
 * `Record<DeployState, Tone>` mapping domain states to tones — needs them. They live in
 * `@cascivo/core`, which is a *transitive* dependency on this path: under pnpm's strict
 * layout an adopter cannot import it, and `docs/GETTING-STARTED.md` explicitly tells prebuilt
 * users not to install it. A 2026-08-14 adopter hit exactly that and fell back to
 * `type Tone = NonNullable<StatusProps['status']>` — which works, but is a workaround, not an
 * API, and most people will inline a string union instead and lose the type link entirely.
 *
 * They are NOT re-exported from `@cascivo/react`'s main entry, and that is not an oversight.
 * Component sources import these names from `@cascivo/core` directly, so a re-export in the
 * flat `index.d.ts` makes the dts bundler bind the same external name twice and emit
 * `import { ToneInput, ToneInput as ToneInput$1 } from "@cascivo/core"` — after which every
 * prop that used to read `status?: ToneInput` reads `status?: ToneInput$1`. That was measured,
 * not assumed: both a dedicated `export type { … }` statement and folding the names into the
 * existing `export { … } from '@cascivo/core'` block produce it, and
 * `scripts/check-styles-complete.mjs` fails the build on any `$N` alias (WS-F).
 *
 * A separate entry has no such collision — it declares each name once, in its own module — and
 * costs the adopter one extra import path. Same declarations, so
 * `import type { Tone } from '@cascivo/react/types'` is assignable to every prop typed
 * `ToneInput` in the main entry.
 *
 * ```tsx
 * import type { Tone } from '@cascivo/react/types'
 *
 * const DEPLOY_TONE: Record<DeployState, Tone> = {
 *   building: 'info',
 *   ready: 'success',
 *   error: 'danger',
 * }
 * <Status status={DEPLOY_TONE[deployment.state]} />
 * ```
 */
export type {
  Tone,
  ToneAlias,
  ToneInput,
  Progress,
  ProgressAlias,
  ProgressInput,
  SpaceStep,
  // `NavigationMenu.orientation` — found by `type-exports-parity`, not by the report. Same
  // class as `ToneInput`: a core-owned type naming a published prop, unreachable on Path B.
  RovingOrientation,
} from '@cascivo/core'

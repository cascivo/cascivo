/**
 * The server-safe subset of `@cascivo/core`.
 *
 * `@cascivo/core`'s main entry is a **single bundled chunk** carrying a `'use client'`
 * banner, because the bundler collapses its 23 directive-carrying modules into one file and
 * drops their per-module directives (see `vite.config.ts`). That banner is load-bearing —
 * without it Next.js treats every hook and `Portal`/`Presence` as a Server Component — but
 * it also traps the handful of genuinely pure helpers behind a client boundary. A
 * `clientJs: 'none'` component importing `cn` from there becomes a Server Component calling
 * a client function, which fails RSC prerendering with:
 *
 *     Attempted to call cn() from the server but cn is on the client.
 *
 * This entry is built from the same sources with **no banner**, so those helpers stay
 * importable from a Server Component. Everything re-exported here must be transitively free
 * of client-only React APIs — no state, no refs, no context, no DOM. `useId` qualifies:
 * React exports it under the `react-server` condition (unlike `useState`/`useRef`), and this
 * wrapper adds nothing but string formatting.
 *
 * `@cascivo/core` re-exports every one of these too, so a client component can keep its
 * single import. Reach for this subpath only from a component that must render on the
 * server — which is exactly the set `clientJs: 'none'` names.
 *
 * Adding to this barrel is a packaging decision, not a convenience: anything unexportable
 * from a Server Component belongs in the main entry. `pnpm exec node
 * --experimental-strip-types --test scripts/checks/core-pure.test.ts` holds that line.
 */
export { cn, composeRefs, mergeProps } from './utils.ts'
export { Slot } from './slot.tsx'
export type { SlotProps } from './slot.tsx'
export { normalizeTone, normalizeProgress, sentimentOf } from './tone.ts'
export type {
  Tone,
  ToneInput,
  Progress,
  ProgressInput,
  Trend,
  GoodDirection,
  Sentiment,
} from './tone.ts'
export type { SpaceStep } from './space.ts'
export { useId } from './use-id.ts'

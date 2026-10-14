import type { ViewConfig } from '@cascivo/render'
import { validateView } from '@cascivo/render/validate'

/**
 * Shared by the Worker (worker/assistant.ts) and the page (src/routes/assistant.tsx): the
 * name the agent is routed under, and the one check both sides run on a generated view.
 */

/** The Durable Object class, its wrangler binding and the `useAgent({ agent })` name. */
export const AGENT = 'Assistant'

export type CheckedView = { title: string; view: ViewConfig } | { errors: string[] }

/**
 * Validates a view the model produced against the component manifests — unknown components,
 * invented props and out-of-range values all come back as errors the model can fix. It runs
 * in the Worker before the result is stored, and again in the browser on the stored message,
 * which crossed the network and is checked rather than trusted.
 */
export function checkView(title: unknown, view: unknown): CheckedView {
  if (typeof title !== 'string' || title.length === 0) return { errors: ['title: expected text'] }
  const result = validateView(view)
  if (!result.valid) return { errors: result.errors.map((e) => `${e.path}: ${e.message}`) }
  // validateView has checked the whole shape, so the cast states a proven fact.
  return { title, view: view as ViewConfig }
}

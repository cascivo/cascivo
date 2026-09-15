/**
 * Preview vocabulary — the option lists and lookups the UI is built from.
 *
 * Deliberately no store. An earlier revision kept six signals here and took a dependency on
 * `@cascivo/core` for them, which coupled this tool's version to the runtime family: a
 * published package that depends on core has to release in lockstep with it, so shipping a
 * preview fix would have minor-bumped core, react, charts and five more. Six pieces of local
 * UI state in one component do not need a reactive library — `useState` in `Preview` is the
 * whole store, and the signals rule this file used to cite governs cascivo components, not a
 * dev tool's own chrome.
 */
import { SIMULATED_CLIENTS } from '@cascivo/email'

/** Widths the preview offers. 600 is the canonical email content width. */
export const VIEWPORTS = [
  { label: 'Small phone', width: 320 },
  { label: 'Phone', width: 375 },
  { label: 'Large phone', width: 414 },
  { label: 'Email width', width: 600 },
  { label: 'Desktop pane', width: 1024 },
] as const

export type Tab = 'preview' | 'html' | 'text'

export function clientFor(label: string | null) {
  return label === null ? null : (SIMULATED_CLIENTS.find((c) => c.label === label) ?? null)
}

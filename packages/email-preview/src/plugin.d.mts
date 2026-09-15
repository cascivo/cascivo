/**
 * Types for `plugin.mjs`.
 *
 * The plugin stays plain `.mjs` because the published tool has no build step: `bin/` imports
 * it directly from the tarball, so a `.ts` source would need compiling that nothing runs.
 * This declaration is what lets `vite.config.ts` — which does go through `tsc` — import it.
 */
import type { Plugin } from 'vite'

export interface CascivoEmailPreviewOptions {
  /** Directory of templates to serve, or `null` for the ones `@cascivo/email` ships. */
  dir?: string | null
  /** Path to a Can I email matrix, or `null` to run without the conformance panel. */
  caniemail?: string | null
}

export function cascivoEmailPreview(options?: CascivoEmailPreviewOptions): Plugin

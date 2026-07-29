// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

/**
 * Minimal Astro app whose ONLY purpose is to answer, executably, whether cascivo's
 * per-component CSS survives an Astro island build — the 2026-07-28 C2 report.
 *
 * Deliberately vanilla: no `vite.ssr.noExternal`, no aggregate-stylesheet workaround, no
 * tuning. If a plain `@astrojs/react` setup drops the CSS, that is the finding, and
 * `scripts/assert-island-css.mjs` states it in the build output rather than leaving it to
 * prose in a compatibility table.
 */
export default defineConfig({
  integrations: [react()],
})

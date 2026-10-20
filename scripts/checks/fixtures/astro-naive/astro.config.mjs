// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'

// What `astro add react` and `astro add mdx` write, and nothing cascivo-specific. The
// `cascivo()` variant is written over this file by scripts/checks/framework-install.test.ts.
export default defineConfig({
  integrations: [react(), mdx()],
})

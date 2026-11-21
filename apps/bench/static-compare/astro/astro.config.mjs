// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import cascivo from '@cascivo/astro'

// No @astrojs/sitemap: the Rust site emits none, so adding it would only skew the comparison.
export default defineConfig({
  site: 'https://static-compare.example',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    react(),
    mdx(),
    cascivo({ theme: '@cascivo/themes/light.css', themeScript: false }),
  ],
})

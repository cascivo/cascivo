import preact from '@preact/preset-vite'
import { cascivoRoutes } from '@cascivo/app/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

// The source is written against React's types; @preact/preset-vite aliases react and
// react-dom to preact/compat, so the bundle runs on Preact. To run on React instead, swap
// this plugin for @vitejs/plugin-react — no source changes.
//
// cascivoRoutes() writes src/routes.gen.ts from src/routes/ — one file per page.
// cloudflare() runs worker/index.ts (and its Durable Object) in workerd during `vite dev`
// and builds it with the client. Request routing is in wrangler.jsonc.
export default defineConfig({
  plugins: [preact(), cascivoRoutes(), cloudflare()],
})

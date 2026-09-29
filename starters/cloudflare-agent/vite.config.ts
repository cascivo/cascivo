import react from '@vitejs/plugin-react'
import { cascivoRoutes } from '@cascivo/app/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

// Runs on React: the /assistant page uses the Agents SDK's hooks, which call React 19's
// use() — preact/compat does not implement it, so this app cannot switch to Preact.
//
// cascivoRoutes() writes src/routes.gen.ts from src/routes/ — one file per page.
// cloudflare() runs worker/index.ts in workerd during `vite dev` and builds it with the
// client, so dev and production execute the same runtime. Request routing is in wrangler.jsonc.
//
// Workers AI has no local mode: with remote bindings on, `vite dev` needs a Cloudflare login.
// So they are off, and the assistant answers from worker/scripted-model.ts. Run
// `VITE_REAL_AI=1 vite dev` (after `wrangler login`) to talk to the real model.
export default defineConfig({
  plugins: [
    react(),
    cascivoRoutes(),
    cloudflare({ remoteBindings: process.env['VITE_REAL_AI'] === '1' }),
  ],
})

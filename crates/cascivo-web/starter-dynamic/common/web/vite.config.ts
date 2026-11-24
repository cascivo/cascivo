import { cascivoSolid } from '@cascivo/solid/vite'
import { defineConfig } from 'vite-plus'

// Fixed file names: the server's templates link /assets/{island,htmx,elements}.js and
// /assets/island.css. `dist/` is what the Worker (or `ASSETS_DIR`) serves at `/`.
export default defineConfig({
  plugins: [
    cascivoSolid({
      islands: { island: 'src/island.tsx', htmx: 'src/htmx.ts', elements: 'src/elements.ts' },
    }),
  ],
  // One Solid runtime even when `@cascivo/solid` is linked from a checkout.
  resolve: { dedupe: ['solid-js'] },
  build: { outDir: 'dist/assets', emptyOutDir: true },
})

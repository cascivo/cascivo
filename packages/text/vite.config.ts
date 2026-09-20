import { defineConfig } from 'vite-plus'
import { MINIFY } from '../../scripts/build/minify.ts'

export default defineConfig({
  build: {
    lib: {
      // Two entries, and the split is the point of the package: `index` is the serializer
      // (no React, no DOM required — it runs in a bare Node agent process), `react` is the
      // <TextView> component. A single entry would put `import 'react'` at the top of the
      // file an agent imports to turn an HTML string into Markdown.
      entry: { index: './src/index.ts', react: './src/react.tsx' },
      formats: ['es'],
    },
    rollupOptions: {
      // No `banner`: `src/react.tsx`'s own `'use client'` survives the bundle, and adding
      // one here emitted it twice. `index` must NOT carry the directive — serializing an
      // HTML string is exactly the work a Server Component should do without a boundary.
      output: { minify: MINIFY },
      // Subpath-AWARE externals — an exact string misses `react/jsx-runtime`, which the
      // JSX transform emits; bundling it ships a second copy of React's runtime.
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^@preact\/signals-react($|\/)/,
        /^@cascivo\//,
      ],
    },
  },
  test: {
    // jsdom: the DOM adapter's whole job is reading live element state, which a node
    // environment cannot express. The HTML path is asserted as strings either way.
    environment: 'jsdom',
  },
})

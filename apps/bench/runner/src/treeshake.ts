import type { Plugin } from 'esbuild'
import { build } from 'esbuild'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const EXTERNALS = ['react', 'react-dom', '@preact/signals-react', '@cascivo/core', '@cascivo/i18n']

function resolveReactPlugin(repoRoot: string): Plugin {
  // esbuild's exports-field resolution through pnpm symlinks can pick up
  // the source entry (src/index.ts) instead of the compiled dist. Pin it explicitly.
  const distPath = join(repoRoot, 'packages/react/dist/index.js')
  return {
    name: 'resolve-cascivo-react',
    setup(b) {
      b.onResolve({ filter: /^@cascivo\/react$/ }, () => ({
        path: distPath,
        // package.json sideEffects: ["**/*.css"]; dist/index.js has no side effects
        sideEffects: false,
      }))
    },
  }
}

async function bundleSize(contents: string, repoRoot: string): Promise<number> {
  const result = await build({
    stdin: { contents, resolveDir: repoRoot, loader: 'ts' },
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    external: EXTERNALS,
    loader: { '.css': 'empty' },
    plugins: [resolveReactPlugin(repoRoot)],
  })
  return gzipSync(Buffer.from(result.outputFiles[0]!.contents), { level: 6 }).length
}

export type TreeshakeResult = {
  bareImportGzBytes: number
  buttonOnlyGzKb: number
  fullGzKb: number
}

export async function measureTreeshake(repoRoot: string): Promise<TreeshakeResult> {
  const bare = await bundleSize(`import '@cascivo/react'`, repoRoot)
  const button = await bundleSize(`export { Button } from '@cascivo/react'`, repoRoot)
  const full = await bundleSize(`export * from '@cascivo/react'`, repoRoot)
  return {
    bareImportGzBytes: bare,
    buttonOnlyGzKb: button / 1024,
    fullGzKb: full / 1024,
  }
}

import { build } from 'esbuild'
import { gzipSync } from 'node:zlib'

const EXTERNALS = ['react', 'react-dom', '@preact/signals-react']

async function bundleSize(contents: string, resolveDir: string): Promise<number> {
  const result = await build({
    stdin: { contents, resolveDir, loader: 'ts' },
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    external: EXTERNALS,
    loader: { '.css': 'empty' },
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

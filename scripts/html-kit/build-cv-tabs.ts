/**
 * Bundles `packages/elements/src/tabs.ts` (+ the shared base and signals runtime) into one
 * self-contained IIFE for the Rust crate: `assets/extra/cv-tabs.js`. One implementation, two
 * delivery routes (ES module for npm, inline/`defer` script for `.cv` pages).
 */
import { fileURLToPath } from 'node:url'
import { build } from 'vite-plus'

const elements = fileURLToPath(new URL('../../packages/elements/', import.meta.url))
const src = (p: string) => fileURLToPath(new URL(p, `file://${elements}`))

export async function buildCvTabsJs(): Promise<string> {
  const out = await build({
    configFile: false,
    root: elements,
    logLevel: 'silent',
    resolve: {
      alias: [
        {
          find: /^@preact\/signals-(react|core)$/,
          replacement: src('node_modules/@preact/signals-core'),
        },
        { find: /^@cascivo\/core\/pure$/, replacement: src('../core/src/pure.ts') },
        { find: /^@cascivo\/i18n$/, replacement: src('../i18n/src/index.ts') },
      ],
    },
    build: {
      write: false,
      minify: true,
      lib: {
        entry: fileURLToPath(new URL('./cv-tabs-entry.ts', import.meta.url)),
        formats: ['iife'],
        name: 'cvTabs',
      },
    },
  })
  const result = Array.isArray(out) ? out[0]! : out
  if (!('output' in result)) throw new Error('cv-tabs bundle produced no output')
  const chunk = result.output.find((o) => o.type === 'chunk')
  if (!chunk || chunk.type !== 'chunk') throw new Error('cv-tabs bundle produced no chunk')
  return `${chunk.code.trim()}\n`
}

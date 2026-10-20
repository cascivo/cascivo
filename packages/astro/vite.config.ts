import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite-plus'

/**
 * `@layer vendor, ` + the canonical statement in @cascivo/tokens, read at build time.
 *
 * Inlined rather than imported so the integration has no runtime dependency on
 * @cascivo/tokens, and derived rather than hand-copied so a layer added to the canonical
 * statement reaches every Astro page with the next release. `vendor` goes first because a
 * layer takes its position from its first appearance: declared after cascivo's names it
 * would land on top of them and third-party CSS would win (docs/THIRD-PARTY-CSS.md).
 */
function defaultLayers(): string {
  const css = readFileSync(new URL('../tokens/src/layers.css', import.meta.url), 'utf8')
  // Line-anchored: the file's comment mentions `@layer …` forms too, but only the real
  // statement starts a line.
  const names = /^@layer\s+([^;{]+);/m.exec(css)?.[1]
  if (names === undefined) {
    throw new Error('@cascivo/astro: no @layer statement in packages/tokens/src/layers.css')
  }
  const list = names
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
  return `@layer ${['vendor', ...list].join(', ')};`
}

const define = { __CASCIVO_DEFAULT_LAYERS__: JSON.stringify(defaultLayers()) }

export default defineConfig({
  // `define` reaches the tests; `pack.define` reaches `vp pack`, which reads only its own block.
  define,
  pack: { define },
  test: {
    environment: 'node',
  },
})

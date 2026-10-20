/**
 * The canonical `@layer …;` order statement, read from its single source of truth
 * (`packages/tokens/src/layers.css`) and prepended to every stylesheet a package emits.
 *
 * A component sheet opens with `@layer cascivo.component{…}`. A layer's position is fixed by
 * the FIRST statement that names it, so a page that loads that sheet before the tokens (Astro
 * dev with an MDX layout does) ends up with `cascivo.component` first — below `cascivo.reset`
 * — and the order silently inverts. Identical `@layer` statements are idempotent in the
 * cascade, so carrying the statement on every sheet costs ~120 B and removes the load-order
 * dependency. Only the statement is copied, never the file's prose: the order itself is read,
 * not restated, so it cannot drift.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** The `@layer a, b, c;` statement, comments stripped, on one line. */
export function layerOrderStatement(): string {
  const css = readFileSync(
    fileURLToPath(new URL('../../packages/tokens/src/layers.css', import.meta.url)),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, '')
  const statement = css.match(/@layer\s[^{;]+;/)?.[0]
  if (statement === undefined) throw new Error('packages/tokens/src/layers.css has no @layer order')
  return statement.replace(/\s+/g, ' ')
}

interface BundleAsset {
  type: string
  source?: string | Uint8Array
}

/** Prepend the order statement to one emitted stylesheet asset, once. */
export function prependLayerOrder(asset: BundleAsset, statement: string): void {
  if (asset.type !== 'asset' || typeof asset.source !== 'string') return
  if (asset.source.startsWith(statement)) return
  asset.source = statement + asset.source
}

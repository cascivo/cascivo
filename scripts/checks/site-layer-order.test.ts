/**
 * The site's emitted cascade-layer order has to match the canonical one.
 *
 * `layers.css` is the single authoritative `@layer` statement, and it only works
 * if it is emitted before any layered rule — a layer's position is fixed by its
 * FIRST appearance and a later statement cannot reorder one that already exists.
 * `layers:check` asserts the source order in that file; nothing asserted what the
 * bundle actually emits.
 *
 * `apps/site/src/main.tsx` imported `./App` above its stylesheets, so component
 * CSS from the App module graph landed at offset 0 of the bundle and
 * `cascivo.component` registered before `cascivo.base` ever appeared. The two
 * were inverted for the whole site: a base reset outranked every component
 * style, which is how one unremarkable `a { color: inherit }` took the colour
 * off Link, Prose's links, Breadcrumb and every `asChild` anchor Button — and
 * why moving that rule into a layer, the textbook fix, changed nothing.
 *
 * Nothing about that is visible in the source. It needs the built CSS.
 *
 * Run: post-build, via `pnpm ready` (needs `dist/`).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const SITE_DIST = join(REPO_ROOT, 'apps/site/dist')
const INDEX_HTML = join(SITE_DIST, 'index.html')

/** packages/tokens/src/layers.css, lowest priority → highest. */
const CANONICAL = [
  'cascivo.reset',
  'cascivo.base',
  'cascivo.tokens',
  'cascivo.component',
  'cascivo.platform',
  'cascivo.theme',
  'cascivo.blocks',
  'cascivo.override',
]

/** The stylesheet the entry HTML links — the one that establishes the order. */
function entryStylesheet(): string | undefined {
  const html = readFileSync(INDEX_HTML, 'utf8')
  const href = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1]
  if (!href) return undefined
  const file = join(SITE_DIST, href.replace(/^\//, ''))
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined
}

describe('the site emits the canonical cascade-layer order', () => {
  const css = existsSync(INDEX_HTML) ? entryStylesheet() : undefined

  it('finds the entry stylesheet (run after a build)', () => {
    assert.ok(css, `no entry stylesheet under ${SITE_DIST} — build apps/site first`)
  })

  it('registers every layer it uses in canonical order', () => {
    if (!css) return
    // A layer's position is set by whichever comes first: the `@layer a, b;`
    // statement naming it, or a `@layer a { … }` block opening it.
    const seen: { layer: string; at: number }[] = []
    for (const layer of CANONICAL) {
      const block = css.indexOf(`@layer ${layer}{`)
      const blockSpaced = css.indexOf(`@layer ${layer} {`)
      const offsets = [block, blockSpaced].filter((n) => n >= 0)
      for (const m of css.matchAll(/@layer\s+([a-z.,\s]+);/g)) {
        if (m[1]!.split(',').some((n) => n.trim() === layer)) offsets.push(m.index!)
      }
      if (offsets.length) seen.push({ layer, at: Math.min(...offsets) })
    }

    assert.ok(seen.length >= 4, `expected ≥4 canonical layers in the bundle, found ${seen.length}`)

    const emitted = [...seen].sort((a, b) => a.at - b.at).map((s) => s.layer)
    const expected = CANONICAL.filter((l) => seen.some((s) => s.layer === l))
    assert.deepEqual(
      emitted,
      expected,
      'the bundle registers layers out of canonical order, so their priorities are ' +
        'inverted. Something emits layered CSS before @cascivo/tokens does — check ' +
        "that apps/site/src/main.tsx imports its stylesheets before './App'.\n" +
        `  emitted:  ${emitted.join(' < ')}\n  expected: ${expected.join(' < ')}`,
    )
  })
})

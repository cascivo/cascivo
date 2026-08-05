/**
 * Reset-floor guard — a layer the docs say carries rules must actually carry rules.
 *
 * `packages/tokens/src/layers.css` is the authoritative cascade order, and its prose
 * describes each layer's job. For thirteen minor versions it described the first one as:
 *
 *     cascivo.reset      consumer reset (box-sizing, margin/padding zeroing) — the floor
 *
 * …and nothing ever wrote a single declaration into it. No package set a global
 * `box-sizing`; only 6 of 132 component stylesheets set it on their own root. Meanwhile
 * `textarea.css` is `width: 100%` + 32px inline padding + a 2px border, which under the
 * browser's `content-box` default computes 34px wider than its container. A 2026-07-28
 * adopter following getting-started exactly, writing no CSS at all, got two stray
 * scrollbars (report C12).
 *
 * That is Mechanism A — a behavioral claim that exists only as prose. The claim lived in a
 * comment inside a file nobody imports for prose, so nothing could contradict it. This
 * guard turns the comment into a checked contract: every layer the order file describes as
 * carrying rules must receive at least one declaration from a shipped stylesheet, and the
 * reset specifically must deliver the `box-sizing` it promises.
 *
 * It generalises deliberately. The next reserved-but-empty layer fails here on the day it
 * is reserved, rather than thirteen versions later in someone's viewport.
 *
 * Run: `pnpm reset:check` (also in `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const LAYERS_CSS = join(REPO_ROOT, 'packages/tokens/src/layers.css')

/** Packages whose CSS is published to (or copied into) a consumer's app. */
const SHIPPED_CSS_DIRS = [
  join(REPO_ROOT, 'packages/tokens/src'),
  join(REPO_ROOT, 'packages/themes/src'),
  join(REPO_ROOT, 'packages/platform/src'),
  join(REPO_ROOT, 'packages/components/src'),
  join(REPO_ROOT, 'packages/layouts/src'),
]

/**
 * Layers that are intentionally empty in what cascivo ships, with the reason.
 *
 * `cascivo.override` is the consumer's escape hatch — cascivo writing into it would
 * defeat its whole purpose, since it is the one layer that beats everything else.
 */
const INTENTIONALLY_EMPTY: Record<string, string> = {
  'cascivo.override': 'consumer escape hatch — cascivo must never occupy it',
}

function cssFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...cssFiles(full))
    else if (entry.endsWith('.css')) out.push(full)
  }
  return out
}

/** CSS with `/* … *​/` comments removed, so at-rule scans can't match prose. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** The layer names in the canonical `@layer a, b, c;` order statement. */
function canonicalLayers(): string[] {
  // Comments first: `layers.css` opens with a prose block that itself says "@layer
  // order (single source of truth)", which the scan below happily mistakes for the
  // statement and returns a layer literally named `order (single source of truth). */`.
  const source = stripComments(readFileSync(LAYERS_CSS, 'utf8'))
  // The statement is the only `@layer …;` (no block) in the file, and it wraps lines.
  const match = source.match(/@layer\s+([^;{]+);/)
  assert.ok(match, `no @layer order statement found in ${relative(REPO_ROOT, LAYERS_CSS)}`)
  return match[1]!
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

/** Layer names that at least one shipped stylesheet opens a block for, with content. */
function layersWithRules(): Map<string, string[]> {
  const found = new Map<string, string[]>()
  for (const dir of SHIPPED_CSS_DIRS) {
    for (const file of cssFiles(dir)) {
      const source = stripComments(readFileSync(file, 'utf8'))
      for (const match of source.matchAll(/@layer\s+([\w.-]+)\s*\{/g)) {
        const name = match[1]!
        // A sublayer counts for its parent slot: `cascivo.blocks.card` fills `cascivo.blocks`.
        const parent = name.split('.').slice(0, 2).join('.')
        for (const key of new Set([name, parent])) {
          const files = found.get(key) ?? []
          files.push(relative(REPO_ROOT, file))
          found.set(key, files)
        }
      }
    }
  }
  return found
}

describe('reset-floor — every documented layer actually carries rules', () => {
  it('no canonical layer is reserved-but-empty', () => {
    const filled = layersWithRules()
    const empty = canonicalLayers().filter(
      (layer) => !(layer in INTENTIONALLY_EMPTY) && !filled.has(layer),
    )
    assert.deepEqual(
      empty,
      [],
      'These layers are declared in the canonical order and described in `layers.css` as ' +
        'carrying rules, but no shipped stylesheet writes a single declaration into them. ' +
        'A layer that ships empty is a promise the cascade never keeps — `cascivo.reset` was ' +
        'empty for thirteen minors and cost an adopter two stray scrollbars on a default ' +
        'install (2026-07-28 report C12).\n' +
        'Either fill the layer from a shipped stylesheet, or add it to INTENTIONALLY_EMPTY ' +
        `in this file with the reason. Empty: ${empty.join(', ')}`,
    )
  })

  it('the reset layer delivers the box-sizing it promises', () => {
    const reset = readFileSync(join(REPO_ROOT, 'packages/tokens/src/reset.css'), 'utf8')
    assert.match(
      reset,
      /@layer\s+cascivo\.reset\s*\{/,
      'reset.css must put its rules inside `@layer cascivo.reset` — unlayered author CSS ' +
        'beats every cascivo layer, so an unlayered reset would override consumer styles',
    )
    assert.match(
      reset,
      /box-sizing:\s*border-box/,
      'reset.css must set `box-sizing: border-box` — it is the declaration `layers.css` ' +
        'promises and the one that stops `width: 100%` + padding components overflowing',
    )
  })

  it('the reset reaches a consumer who imports only @cascivo/tokens', () => {
    const index = readFileSync(join(REPO_ROOT, 'packages/tokens/src/index.css'), 'utf8')
    assert.match(
      index,
      /@import\s+['"]\.\/reset\.css['"]/,
      "packages/tokens/src/index.css must `@import './reset.css'`. Every consumer path " +
        'reaches @cascivo/tokens (themes self-import it), so this is the single point that ' +
        'guarantees a default install gets the floor.',
    )
    // CSS forbids @import after any rule. Both imports must precede the first @layer block.
    const firstBlock = index.search(/@layer\s+[\w.]+\s*\{/)
    const lastImport = index.lastIndexOf('@import')
    assert.ok(
      firstBlock === -1 || lastImport < firstBlock,
      'an @import in index.css appears after a @layer block — browsers drop it and warn',
    )
  })

  it('the reset survives into the @cascivo/react aggregate (which strips @imports)', () => {
    const config = readFileSync(join(REPO_ROOT, 'packages/react/vite.config.ts'), 'utf8')
    assert.match(
      config,
      /readCss\(['"]\.\.\/tokens\/src\/reset\.css['"]\)/,
      'packages/react/vite.config.ts builds styles.css by concatenating token/theme files ' +
        "and STRIPPING every @import — so index.css's `@import './reset.css'` is dropped. " +
        'reset.css must be listed explicitly in THEME_BUNDLE or the aggregate ships with no ' +
        'reset and a styles.css-only consumer overflows.',
    )
  })
})

/**
 * Token catalog contract — bidirectional, like `props-parity`.
 *
 * `llms.txt` advertises `tokens.catalog.json` as a "closed set, **every** `--cascivo-*` +
 * layer + default". An adopter took that literally, validated every custom property they
 * wrote against it, and found two independent problems:
 *
 * 1. **Real tokens missing from the catalog.** The catalog is generated from
 *    `packages/tokens/src/index.css` + `themes/src/light.css` only, so every
 *    component-scoped knob — `--cascivo-sidenav-inline-size`, `--cascivo-sidenav-bg`,
 *    `--cascivo-data-table-max-height`, `--cascivo-button-radius` — was invisible. Those
 *    are exactly the tokens someone reaches for ("make the sidebar narrower").
 *
 * 2. **Documented tokens that do not exist.** `layout/page-header.meta.ts` and
 *    `layout/app-shell.meta.ts` listed `--cascivo-font-size-{xs,sm,2xl}` and
 *    `--cascivo-font-weight-bold`. There are no such properties — the real names are
 *    `--cascivo-text-*` and `--cascivo-font-semibold`. Those names flowed into every
 *    generated doc surface, so an adopter who copied them got silently unresolved
 *    custom properties: not a build error, not a warning, just a component that
 *    inherits instead of styling.
 *
 * The second is the more dangerous direction and the one nobody reported — it was found by
 * writing this guard. Both are asserted here, so neither can come back.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CATALOG = join(REPO_ROOT, 'apps/site/public/tokens.catalog.json')

/** Directories whose CSS may declare a `--cascivo-*` property. */
const CSS_ROOTS = [
  'packages/tokens/src',
  'packages/themes/src',
  'packages/components/src',
  'packages/layouts/src',
  'packages/charts/src',
  'packages/flow/src',
  'packages/editor/src',
]

/** Manifests that declare `tokens: [...]`. */
const META_ROOTS = [
  'packages/components/src',
  'packages/layouts/src',
  'packages/charts/src',
  'packages/flow/src',
  'packages/editor/src',
]

function walk(dir: string, ext: string): string[] {
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
    if (statSync(full).isDirectory()) out.push(...walk(full, ext))
    else if (entry.endsWith(ext)) out.push(full)
  }
  return out
}

/**
 * Custom properties set inline by a component's own `style` prop, so they are legitimately
 * absent from every stylesheet. Keep this list tiny and specific.
 */
const INLINE_SET = new Set(['--cascivo-tree-level'])

/** Every `--cascivo-*` property **declared** in shipped CSS, mapped to a declaring file. */
function declaredTokens(): Map<string, string> {
  const found = new Map<string, string>()
  for (const root of CSS_ROOTS) {
    for (const file of walk(join(REPO_ROOT, root), '.css')) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/(--cascivo-[a-z0-9-]+)\s*:/gi)) {
        if (!found.has(m[1]!)) found.set(m[1]!, relative(REPO_ROOT, file))
      }
      // `@property --cascivo-x { … }` registrations count as declarations too.
      for (const m of src.matchAll(/@property\s+(--cascivo-[a-z0-9-]+)/gi)) {
        if (!found.has(m[1]!)) found.set(m[1]!, relative(REPO_ROOT, file))
      }
    }
  }
  return found
}

/**
 * Every `--cascivo-*` a stylesheet **reads**, split by whether the read has a fallback.
 *
 * `var(--x, 16rem)` on an otherwise-undeclared name is a deliberate author hook: cascivo
 * never sets it, the fallback is the default, and setting it is the documented way to
 * resize a sidebar. That is real API and belongs in the catalog.
 *
 * `var(--x)` with **no** fallback on an undeclared name is a bug: the declaration resolves
 * to nothing and the property silently does not apply. 18 of those were shipping.
 */
function referencedTokens(): { withFallback: Set<string>; bare: Map<string, string> } {
  const withFallback = new Set<string>()
  const bare = new Map<string, string>()
  for (const root of CSS_ROOTS) {
    for (const file of walk(join(REPO_ROOT, root), '.css')) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/var\(\s*(--cascivo-[a-z0-9-]+)\s*,/gi)) {
        withFallback.add(m[1]!)
      }
      for (const m of src.matchAll(/var\(\s*(--cascivo-[a-z0-9-]+)\s*\)/gi)) {
        if (!bare.has(m[1]!)) bare.set(m[1]!, relative(REPO_ROOT, file))
      }
    }
  }
  return { withFallback, bare }
}

/** Tokens named by a component manifest's `tokens: [...]`, with the manifest path. */
function manifestTokens(): Array<{ token: string; file: string }> {
  const out: Array<{ token: string; file: string }> = []
  for (const root of META_ROOTS) {
    for (const file of walk(join(REPO_ROOT, root), '.meta.ts')) {
      const src = readFileSync(file, 'utf8')
      const block = /tokens\s*:\s*\[([\s\S]*?)\]/.exec(src)?.[1]
      if (block === undefined) continue
      for (const m of block.matchAll(/'(--cascivo-[a-z0-9-]+)'/gi)) {
        out.push({ token: m[1]!, file: relative(REPO_ROOT, file) })
      }
    }
  }
  return out
}

function catalogTokens(): Set<string> {
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')) as {
    tokens: Array<{ name: string }>
  }
  return new Set(catalog.tokens.map((t) => t.name))
}

describe('token-catalog', () => {
  const declared = declaredTokens()
  const referenced = referencedTokens()
  /** A token "exists" if cascivo declares it, or reads it as an author hook with a default. */
  const exists = (t: string) => declared.has(t) || referenced.withFallback.has(t)

  it('resolves a plausible number of declared tokens', () => {
    assert.ok(declared.size > 200, `only ${declared.size} --cascivo-* declarations found`)
  })

  it('every token a manifest documents actually exists', () => {
    // Direction 1: a documented token that resolves to nothing. The adopter copies it,
    // gets no error, and the property silently does not apply.
    const phantom = manifestTokens()
      .filter(({ token }) => !exists(token))
      .map(({ token, file }) => `  ${file}: ${token}`)
    assert.deepEqual(
      [...new Set(phantom)],
      [],
      'These manifests document CSS custom properties that are declared nowhere. They flow\n' +
        'into every generated doc surface, so an adopter styling against them gets silently\n' +
        'unresolved properties — no build error, no warning, just a component that ignores\n' +
        `them:\n${[...new Set(phantom)].join('\n')}`,
    )
  })

  it('every token a manifest documents is in the catalog', () => {
    // Direction 2: a real, documented, per-component knob invisible to anyone validating
    // against the catalog `llms.txt` calls a closed set.
    const missing = manifestTokens()
      .map(({ token }) => token)
      .filter(exists)
      .filter((t) => !catalogTokens().has(t))
    assert.deepEqual(
      [...new Set(missing)].sort(),
      [],
      'These tokens are declared in CSS and documented on a component, but absent from\n' +
        'tokens.catalog.json, which llms.txt advertises as a closed set. They are exactly\n' +
        'the per-component knobs adopters reach for:\n' +
        `  ${[...new Set(missing)].sort().join('\n  ')}`,
    )
  })

  it('the catalog names no token that does not exist', () => {
    const ghosts = [...catalogTokens()].filter((t) => !exists(t)).sort()
    assert.deepEqual(ghosts, [], `Catalog lists undeclared tokens:\n  ${ghosts.join('\n  ')}`)
  })

  it('no shipped CSS reads an undeclared token without a fallback', () => {
    // `var(--x)` on a name nothing declares resolves to nothing: the declaration silently
    // does not apply. 18 of these were shipping — `--cascivo-text-secondary`,
    // `--cascivo-color-danger`, `--cascivo-font-size-sm` and friends, all near-misses for
    // a real token (`--cascivo-color-text-subtle`, `--cascivo-color-destructive`,
    // `--cascivo-text-sm`). Nothing errored; the components just rendered unstyled in
    // those properties.
    const broken = [...referenced.bare]
      .filter(([t]) => !declared.has(t) && !INLINE_SET.has(t))
      .map(([t, file]) => `  ${t} (e.g. ${file})`)
      .sort()
    assert.deepEqual(
      broken,
      [],
      'These `var()` reads resolve to nothing — no declaration and no fallback, so the\n' +
        'property silently does not apply. Use the real token name, or add a fallback if it\n' +
        `is meant to be an author hook:\n${broken.join('\n')}`,
    )
  })
})

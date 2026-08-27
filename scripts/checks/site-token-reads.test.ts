/**
 * The site's own CSS reads tokens that have to exist.
 *
 * `token-catalog` asserts this for the shipped packages, and its second
 * direction — "documented tokens that do not exist" — is the one nobody
 * reports, because a bare `var(--typo)` is not a build error and not a warning.
 * The declaration simply does not apply and the property inherits.
 *
 * `apps/site` was outside that guard, and four had accumulated:
 *
 *   --cascivo-color-accent-fg    the real name is `-content` / `-foreground`.
 *                                The `/ai` step badge inherited the page's ink,
 *                                which happens to read on the light half and is
 *                                cream-on-acid at 1.35:1 on the dark one.
 *   --cascivo-font-sm            the size scale is `--cascivo-text-*`.
 *   --cascivo-space-7            the space scale steps 6 → 8.
 *   --cascivo-space-1-5          no fractional steps exist.
 *
 * A read WITH a fallback — `var(--x, 1rem)` — is a deliberate author hook and is
 * not asserted here, matching how `token-catalog` treats the same shape.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/** Everywhere a `--cascivo-*` property may legitimately be declared. */
const DECLARING_ROOTS = [
  'packages/tokens/src',
  'packages/themes/src',
  'packages/components/src',
  'packages/layouts/src',
  'packages/charts/src',
  'packages/flow/src',
  'packages/editor/src',
  'apps/site/src',
]

const SITE_CSS_ROOT = 'apps/site/src'

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

function declaredTokens(): Set<string> {
  const found = new Set<string>()
  for (const root of DECLARING_ROOTS) {
    for (const file of cssFiles(join(REPO_ROOT, root))) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/(--cascivo-[a-z0-9-]+)\s*:/gi)) found.add(m[1]!)
      for (const m of src.matchAll(/@property\s+(--cascivo-[a-z0-9-]+)/gi)) found.add(m[1]!)
    }
  }
  return found
}

describe('apps/site reads only tokens that exist', () => {
  const declared = declaredTokens()

  it('has a populated token set to check against', () => {
    assert.ok(declared.size > 100, `expected >100 declared tokens, found ${declared.size}`)
  })

  it('every bare var(--cascivo-*) names a declared token', () => {
    const bad: string[] = []
    for (const file of cssFiles(join(REPO_ROOT, SITE_CSS_ROOT))) {
      const src = readFileSync(file, 'utf8')
      // A bare read: `var(--x)` with no comma, so no fallback to fall back to.
      for (const m of src.matchAll(/var\(\s*(--cascivo-[a-z0-9-]+)\s*\)/gi)) {
        if (declared.has(m[1]!)) continue
        const line = src.slice(0, m.index).split('\n').length
        bad.push(`${relative(REPO_ROOT, file)}:${line} reads ${m[1]}`)
      }
    }
    assert.deepEqual(
      bad,
      [],
      `these resolve to nothing, so the declaration silently does not apply:\n  ${bad.join('\n  ')}`,
    )
  })
})

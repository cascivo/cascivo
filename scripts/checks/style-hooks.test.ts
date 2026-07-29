/**
 * Style-hooks parity guard — the `data-cascivo-*` styling contract is bidirectional.
 *
 * CSS Modules hash every internal class name, so a consumer who needs to reach an inner
 * element of a composite component has no selector at all. A 2026-07-28 adopter shipped
 * `div:has(> div > nav[aria-label='…']) { flex-shrink: 0 }` to stop `AppShell`'s sidebar
 * shrinking, and called the selector "unpleasant precisely because the wrapper is not
 * addressable" (report C14). The same complaint shows up as `LogViewer`'s `role="log"`
 * hack and as C18's missing `data-x` on chart bars.
 *
 * `data-cascivo-*` attributes are the supported answer. But an attribute is only a contract
 * if something checks it — otherwise it is Mechanism A again: a promise that lives in prose
 * (`docs/STYLING-INTERNALS.md`) with nothing stopping a refactor from renaming it.
 *
 * So both directions are asserted:
 *   TSX → manifest: every `data-cascivo-*` a component stamps must be declared in its
 *                   `styleHooks`, or it is undiscoverable (it never reaches registry.json,
 *                   llms/*.md or the docs site).
 *   manifest → TSX: every declared hook must actually be stamped, or the docs promise a
 *                   selector that matches nothing.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const COMPONENTS_DIR = join(REPO_ROOT, 'packages/components/src')
const DOCS = join(REPO_ROOT, 'docs/STYLING-INTERNALS.md')

/** `data-cascivo-*` attributes stamped in a component's TSX. */
function stampedHooks(source: string): string[] {
  return [...new Set([...source.matchAll(/\b(data-cascivo-[a-z0-9-]+)\s*=/g)].map((m) => m[1]!))]
}

/** The `styleHooks: [...]` entries declared in a component's manifest. */
function declaredHooks(source: string): string[] {
  const match = source.match(/styleHooks:\s*\[([^\]]*)\]/)
  if (!match) return []
  return [...match[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!)
}

interface Component {
  name: string
  tsx: string
  meta: string
}

function components(): Component[] {
  const out: Component[] = []
  for (const entry of readdirSync(COMPONENTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const tsx = join(COMPONENTS_DIR, entry.name, `${entry.name}.tsx`)
    const meta = join(COMPONENTS_DIR, entry.name, `${entry.name}.meta.ts`)
    if (!existsSync(tsx) || !existsSync(meta)) continue
    out.push({
      name: entry.name,
      tsx: readFileSync(tsx, 'utf8'),
      meta: readFileSync(meta, 'utf8'),
    })
  }
  return out
}

describe('style-hooks — data-cascivo-* attributes match their manifests', () => {
  it('every stamped hook is declared in the manifest', () => {
    const missing: string[] = []
    for (const c of components()) {
      const declared = new Set(declaredHooks(c.meta))
      for (const hook of stampedHooks(c.tsx)) {
        if (!declared.has(hook)) missing.push(`${c.name}: stamps ${hook}, manifest omits it`)
      }
    }
    assert.deepEqual(
      missing,
      [],
      'These components stamp a `data-cascivo-*` styling hook that their manifest does not ' +
        'declare, so it never reaches registry.json, llms/*.md or the docs site — an ' +
        'undiscoverable hook is no better than a hashed class name. Add it to `styleHooks` ' +
        `in the manifest and to docs/STYLING-INTERNALS.md.\n  ${missing.join('\n  ')}`,
    )
  })

  it('every declared hook is actually stamped', () => {
    const missing: string[] = []
    for (const c of components()) {
      const stamped = new Set(stampedHooks(c.tsx))
      for (const hook of declaredHooks(c.meta)) {
        if (!stamped.has(hook)) missing.push(`${c.name}: manifest declares ${hook}, TSX omits it`)
      }
    }
    assert.deepEqual(
      missing,
      [],
      'These manifests declare a styling hook the component does not stamp, so the docs ' +
        'promise a selector that matches nothing. Either stamp it or drop the declaration.' +
        `\n  ${missing.join('\n  ')}`,
    )
  })

  it('every declared hook is documented in STYLING-INTERNALS.md', () => {
    const docs = readFileSync(DOCS, 'utf8')
    const undocumented: string[] = []
    for (const c of components()) {
      for (const hook of declaredHooks(c.meta)) {
        if (!docs.includes(hook)) undocumented.push(`${c.name}: ${hook}`)
      }
    }
    assert.deepEqual(
      undocumented,
      [],
      'These styling hooks are shipped and manifested but absent from ' +
        'docs/STYLING-INTERNALS.md, which is the page an adopter is pointed at. ' +
        `Add a row to its table.\n  ${undocumented.join('\n  ')}`,
    )
  })

  it('finds the hooks it is meant to cover (guards against silent skips)', () => {
    const all = components().flatMap((c) => declaredHooks(c.meta))
    assert.ok(
      all.includes('data-cascivo-appshell-nav'),
      `expected AppShell's nav hook to be discovered; found: ${all.join(', ') || '(none)'}`,
    )
  })
})

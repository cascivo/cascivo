/**
 * `clientJs` coverage — every manifest declares it.
 *
 * `ComponentMeta.clientJs` is the field an agent or an adopter reads to decide whether a
 * component renders from a Server Component without ever hydrating. It is the whole RSC
 * story in one enum, and `client-js-parity.test.ts` validates it carefully — but only for
 * manifests that actually declare it. On 2026-08-14, 96 of 209 manifests (46%) declared
 * nothing at all, including `data-table`, `calendar`, `form`, `toast` and every chart, and
 * no check noticed, because a missing field looked exactly like a field under no rule.
 *
 * The catalog is now fully declared, so this is a flat requirement rather than a ratchet:
 * a manifest without `clientJs` fails. Pick the value against the definition in
 * `client-js-parity.test.ts`, which is enforceable in one direction (`'none'`) and
 * author-declared in the other.
 *
 * Run: `pnpm meta:check` (or directly via node --test).
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES = join(REPO_ROOT, 'packages')

const DECLARED = /^\s*clientJs:\s*'(none|enhancement|required)'/m

/** Recursively collect `*.meta.ts` manifests, skipping build output. */
function collectMetas(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectMetas(full))
    else if (entry.name.endsWith('.meta.ts')) out.push(full)
  }
  return out
}

describe('clientJs coverage', () => {
  const manifests = collectMetas(PACKAGES).map((path) => ({
    path: path.slice(REPO_ROOT.length + 1),
    declared: DECLARED.test(readFileSync(path, 'utf8')),
  }))

  it('finds the full catalog (guards against a silent skip)', () => {
    assert.ok(manifests.length > 200, `expected the whole catalog, got ${manifests.length}`)
  })

  it('every manifest declares clientJs', () => {
    const missing = manifests.filter((m) => !m.declared).map((m) => m.path)
    assert.deepEqual(
      missing,
      [],
      'These manifests do not declare `clientJs`, so registry.json cannot tell an adopter ' +
        'or an agent whether the component hydrates. Pick `none` / `enhancement` / ' +
        `\`required\` per the definitions in client-js-parity.test.ts:\n  ${missing.join('\n  ')}`,
    )
  })
})

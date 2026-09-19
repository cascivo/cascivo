/**
 * Email primitive documentation coverage.
 *
 * `@cascivo/email`'s components carry no `.meta.ts`, so `meta-coverage` — the guard that
 * stops a registry component shipping undocumented — does not see them. That is exactly how
 * the gap this closes opened: twenty-two primitives shipped with a template gallery and no
 * per-component reference at all, and an adopter asking "which pieces can I use" had to read
 * `src/components`. An agent in the same position hand-rolls a worse `<table>`.
 *
 * So this is `meta-coverage` for the email target: every component exported from the package
 * index must appear in the gallery, in the generated reference, and in the props table that
 * reference prints. The gallery is the only hand-maintained list, so adding a primitive and
 * forgetting the docs fails here rather than shipping silently.
 *
 * It reads the generated artifacts rather than rendering anything — the generator needs a
 * built package and real React, and the drift check already proves the artifacts are current.
 *
 * Run with: `pnpm email:primitives:check` (also in `pnpm email:check` and `ready`/CI).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const INDEX = join(REPO_ROOT, 'packages/email/src/components/index.ts')
const GALLERY = join(REPO_ROOT, 'packages/email/scripts/lib/gallery.ts')
const REFERENCE = join(REPO_ROOT, 'docs/EMAIL-PRIMITIVES.md')
const PREVIEWS = join(REPO_ROOT, 'apps/site/src/marketing/email-previews.generated.ts')

/** Component names re-exported from `src/components/index.ts` — types excluded. */
function exportedComponents(): string[] {
  const source = readFileSync(INDEX, 'utf8')
  const names = new Set<string>()
  for (const match of source.matchAll(/^export \{([^}]*)\}/gms)) {
    for (const raw of match[1]!.split(',')) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
        ?.trim()
      // Components are capitalised; `CONTENT_WIDTH` and `TABLE_RESET` are values, not
      // components, and have nothing to preview.
      if (name && /^[A-Z][a-z]/.test(name)) names.add(name)
    }
  }
  return [...names].sort()
}

describe('email primitives are documented', () => {
  const components = exportedComponents()

  it('parser sanity check (finds the known primitives)', () => {
    assert.ok(components.includes('Button'), `parsed: ${components.join(', ')}`)
    assert.ok(components.includes('Markdown'))
    assert.ok(components.length >= 20, `only found ${components.length}`)
  })

  it('every exported primitive has a gallery entry', () => {
    const gallery = readFileSync(GALLERY, 'utf8')
    const entries = new Set([...gallery.matchAll(/^\s*name: '([A-Z]\w*)',$/gm)].map((m) => m[1]!))
    const missing = components.filter((name) => !entries.has(name))
    assert.deepEqual(
      missing,
      [],
      `add an entry to packages/email/scripts/lib/gallery.ts for: ${missing.join(', ')}`,
    )
  })

  it('every exported primitive has a section in the generated reference', () => {
    const reference = readFileSync(REFERENCE, 'utf8')
    const missing = components.filter((name) => !reference.includes(`\n### ${name}\n`))
    assert.deepEqual(missing, [], `run \`pnpm email:primitives:generate\`; missing: ${missing}`)
  })

  it('every exported primitive has at least one rendered preview', () => {
    const previews = readFileSync(PREVIEWS, 'utf8')
    // The generator emits JSON; the formatter then rewrites it as TypeScript object
    // literals. Match either quoting so the check does not depend on which ran last.
    const source = previews.slice(previews.indexOf('EMAIL_PRIMITIVES'))
    const named = new Set(
      [...source.matchAll(/(?:"name":\s*"|name:\s*')([A-Z]\w*)/g)].map((m) => m[1]!),
    )
    const missing = components.filter((name) => !named.has(name))
    assert.deepEqual(missing, [], `run \`pnpm email:primitives:generate\`; missing: ${missing}`)
  })

  it('the reference documents a props table for every primitive', () => {
    const reference = readFileSync(REFERENCE, 'utf8')
    const sections = reference.split(/\n### /).slice(1)
    const undocumented = sections
      .filter((section) => !section.includes('| Prop | Type | Default | Notes |'))
      .map((section) => section.split('\n')[0])
    assert.deepEqual(undocumented, [])
  })
})

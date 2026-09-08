/**
 * Email visual baselines stay in step with the templates.
 *
 * `apps/email-preview/test/visual.spec.ts` derives one screenshot per (template × theme)
 * plus one simulated-Outlook pass. The baselines are committed PNGs, and nothing in the
 * normal PR gate looks at them — so a template added or renamed without its baselines just
 * rots into a failing visual run that nobody owns. That is exactly how three orphaned PNGs
 * outlived a rename in `apps/site`, which is why the sibling guard
 * `scripts/checks/visual-baselines.test.ts` exists.
 *
 * This closes the same loop, in both directions.
 *
 * Run: `pnpm email:visual:baselines:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SPEC = join(REPO_ROOT, 'apps/email-preview/test/visual.spec.ts')
const SNAPSHOTS = join(REPO_ROOT, 'apps/email-preview/test/snapshots')
const TEMPLATES_INDEX = join(REPO_ROOT, 'packages/email/src/templates/index.ts')

const spec = readFileSync(SPEC, 'utf8')

/** Template ids the spec screenshots, read from its own `TEMPLATES` literal. */
function specTemplates(): string[] {
  const block = /const TEMPLATES = \[([\s\S]*?)\] as const/.exec(spec)
  assert.ok(block, 'could not find the TEMPLATES literal in visual.spec.ts')
  return [...block[1]!.matchAll(/\['([^']+)'/g)].map((m) => m[1]!)
}

function specThemes(): string[] {
  const block = /const THEMES = \[([\s\S]*?)\] as const/.exec(spec)
  assert.ok(block, 'could not find the THEMES literal in visual.spec.ts')
  return [...block[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!)
}

/**
 * Components `@cascivo/email` actually exports as templates.
 *
 * Deduped: the barrel re-exports each module twice, once for the component and once for its
 * props type, so a plain match counts every template twice.
 */
function exportedTemplates(): string[] {
  const source = readFileSync(TEMPLATES_INDEX, 'utf8')
  return [...new Set([...source.matchAll(/from '\.\/([a-z-]+)\.tsx'/g)].map((m) => m[1]!))]
}

function expectedBaselines(): string[] {
  const names: string[] = []
  for (const template of specTemplates()) {
    for (const theme of specThemes()) names.push(`${template}-${theme}.png`)
    names.push(`${template}-outlook.png`)
  }
  return names.sort()
}

function committedBaselines(): string[] {
  return readdirSync(SNAPSHOTS)
    .filter((f) => f.endsWith('.png'))
    .sort()
}

describe('email visual baselines', () => {
  it('screenshots every exported template', () => {
    // A template shipped but never screenshotted is a template nothing looks at.
    assert.deepEqual(
      specTemplates().sort(),
      exportedTemplates().sort(),
      'visual.spec.ts and packages/email/src/templates/index.ts disagree about which ' +
        'templates exist',
    )
  })

  it('has a committed baseline for every case the spec will capture', () => {
    const missing = expectedBaselines().filter((n) => !committedBaselines().includes(n))
    assert.deepEqual(
      missing,
      [],
      'missing baselines — run `pnpm exec playwright test --update-snapshots` in ' +
        'apps/email-preview and commit the PNGs',
    )
  })

  it('has no orphaned baseline', () => {
    const orphans = committedBaselines().filter((n) => !expectedBaselines().includes(n))
    assert.deepEqual(orphans, [], 'baselines left behind by a rename — delete them')
  })
})

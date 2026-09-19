/**
 * The vendored Can I email snapshot stays usable.
 *
 * `scripts/email/vendor/caniemail.json` is the oracle the email conformance lint consults:
 * it decides whether a CSS property or HTML element may appear in a rendered email. It is
 * vendored rather than fetched so CI stays offline and deterministic, and so a change in
 * what the linter permits arrives as a reviewed diff.
 *
 * Vendoring has one failure mode a refresh cannot catch on its own: the snapshot drifts
 * *structurally* — upstream renames a client family, retires a platform, or changes a code
 * vocabulary — and the linter silently stops evaluating a floor client, reporting `ok` for
 * something no longer checked. That is what this guards.
 *
 * It deliberately does NOT re-fetch. A network call would make the check flaky and would
 * defeat the point of pinning; the review of the refresh diff is what keeps the data
 * honest.
 *
 * Run: `pnpm email:caniemail:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_FLOOR,
  indexFeatures,
  verdict,
  type CanIEmailData,
} from '../../packages/email/src/conformance/support.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SNAPSHOT = join(REPO_ROOT, 'scripts/email/vendor/caniemail.json')

const raw = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as CanIEmailData & {
  $source?: string
  $license?: string
  nicenames?: { family: Record<string, string>; platform: Record<string, string> }
}
const features = indexFeatures(raw)

describe('caniemail snapshot — provenance', () => {
  it('records where it came from and under what licence', () => {
    assert.equal(raw.$source, 'https://www.caniemail.com/api/data.json')
    assert.match(raw.$license ?? '', /MIT/)
  })

  it('records the upstream api version and test date', () => {
    assert.match(raw.api_version, /^\d+\.\d+\.\d+$/)
    assert.match(raw.last_update_date, /^\d{4}-\d{2}-\d{2}/)
  })
})

describe('caniemail snapshot — shape', () => {
  it('carries enough features to be the real dataset', () => {
    // 308 at the time of vendoring. A snapshot that shrank by half is a broken fetch,
    // not an upstream decision.
    assert.ok(raw.data.length > 250, `only ${raw.data.length} features — looks truncated`)
  })

  it('gives every feature a slug, category and stats block', () => {
    for (const f of raw.data) {
      assert.ok(f.slug, 'feature with no slug')
      assert.ok(f.category, `${f.slug} has no category`)
      assert.equal(typeof f.stats, 'object', `${f.slug} has no stats`)
    }
  })

  it('uses only the documented support codes', () => {
    const seen = new Set<string>()
    for (const f of raw.data) {
      for (const platforms of Object.values(f.stats)) {
        for (const versions of Object.values(platforms)) {
          for (const code of Object.values(versions)) seen.add(code.trim()[0] ?? '')
        }
      }
    }
    assert.deepEqual(
      [...seen].sort(),
      ['a', 'n', 'u', 'y'],
      'unexpected support code — the verdict() vocabulary needs updating',
    )
  })
})

describe('caniemail snapshot — the support floor is real', () => {
  for (const client of DEFAULT_FLOOR) {
    it(`${client.label} exists as ${client.family}/${client.platform}`, () => {
      const found = raw.data.some((f) => f.stats[client.family]?.[client.platform])
      assert.ok(
        found,
        `no feature reports ${client.family}/${client.platform} — the floor names a client ` +
          'this snapshot cannot answer for, so the lint silently stops checking it',
      )
    })
  }
})

describe('caniemail snapshot — the oracle still answers correctly', () => {
  /*
   * Canary lookups. These are the verdicts the whole email architecture is built on: if
   * `gap` ever reports `ok`, either the data or the lookup is broken, and the primitive
   * set's table-based design would no longer be enforced by anything.
   */
  const expected: [string, 'ok' | 'blocked' | 'caveat' | 'untested'][] = [
    ['css-gap', 'blocked'],
    ['css-display-flex', 'blocked'],
    ['css-display-grid', 'blocked'],
    ['css-variables', 'blocked'],
    ['css-modern-color', 'blocked'],
    ['css-unit-rem', 'blocked'],
    ['css-box-shadow', 'blocked'],
    ['html-svg', 'blocked'],
    ['css-background-color', 'ok'],
    ['css-border-collapse', 'ok'],
    ['css-vertical-align', 'ok'],
    ['html-table', 'ok'],
  ]

  for (const [slug, level] of expected) {
    it(`${slug} is ${level}`, () => {
      const v = verdict(features, slug)
      assert.equal(
        v.level,
        level,
        `${slug} reported ${v.level}: ${v.findings.map((f) => `${f.client.label}=${f.code}`).join(', ')}`,
      )
    })
  }
})

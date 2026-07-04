/**
 * Bench-stat guard — the landing surfaces specific benchmark figures as headline
 * numbers (the AdvantageCarousel signals panel and the ProofTeasers performance
 * card). A zero or missing value renders as a broken "0" claim in production.
 * This test fails if any headline bench value the landing reads is absent or
 * not a positive number.
 *
 * Note: axe violation counts are intentionally NOT guarded here — 0 violations
 * is the desired value and a legitimate headline.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

type Stats = { median?: number }
type Lib = 'cascade' | 'shadcn' | 'carbon'
type Results = {
  runtime?: Record<string, Partial<Record<Lib, Stats>>>
  bundle?: { apps?: Record<Lib, { totalGzKb?: number }> }
}

const results = JSON.parse(
  readFileSync(join(REPO_ROOT, 'apps/bench/results/results.json'), 'utf8'),
) as Results

const HEADLINE_STATS: { where: string; get: (r: Results) => number | undefined }[] = [
  {
    where: 'AdvantageCarousel signals — update-every-10th cascade median',
    get: (r) => r.runtime?.['update-every-10th']?.cascade?.median,
  },
  {
    where: 'AdvantageCarousel signals — update-every-10th shadcn median',
    get: (r) => r.runtime?.['update-every-10th']?.shadcn?.median,
  },
  {
    where: 'ProofTeasers performance — cascade totalGzKb',
    get: (r) => r.bundle?.apps?.cascade?.totalGzKb,
  },
  {
    where: 'ProofTeasers performance — shadcn totalGzKb',
    get: (r) => r.bundle?.apps?.shadcn?.totalGzKb,
  },
]

describe('bench-stats guard — landing headline numbers are real', () => {
  it('every headline bench value is present and > 0', () => {
    const bad: string[] = []
    for (const stat of HEADLINE_STATS) {
      const value = stat.get(results)
      if (typeof value !== 'number' || !(value > 0)) {
        bad.push(`  ${stat.where} → ${JSON.stringify(value)}`)
      }
    }
    if (bad.length > 0) {
      assert.fail(
        `Landing reads zero/missing bench values (would render as a broken "0"):\n${bad.join('\n')}`,
      )
    }
  })
})

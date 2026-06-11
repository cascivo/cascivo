import { describe, expect, it } from 'vitest'
import { renderReport } from './report.ts'
import type { Results } from './types.ts'

const fixture: Results = {
  meta: {
    date: '2026-06-11',
    cpu: 'Test CPU',
    cores: 8,
    memGb: 32,
    os: 'linux 7.0',
    node: 'v22.12.0',
    chrome: 'Chromium 140.0.0.0',
    cpuThrottle: 4,
    lockfileHash: 'abc123def456',
    source: 'local',
  },
  runtime: {
    'create-1k': {
      cascade: { samples: [], median: 120, p25: 118, p75: 124, mean: 121, stddev: 3 },
      shadcn: { samples: [], median: 119, p25: 117, p75: 123, mean: 120, stddev: 3 },
      carbon: { samples: [], median: 180, p25: 175, p75: 188, mean: 181, stddev: 5 },
      pVsCascade: { shadcn: 0.4, carbon: 0.001 },
    },
  } as Results['runtime'],
  renders: {
    'type-20-chars': { cascade: 0, shadcn: 20, carbon: 21 },
  } as Results['renders'],
  a11y: {
    cascade: { violations: 0, rules: [] },
    shadcn: { violations: 1, rules: ['color-contrast'] },
    carbon: { violations: 0, rules: [] },
  },
}

describe('renderReport', () => {
  it('renders every metric present, including non-wins', () => {
    const md = renderReport(fixture)
    expect(md).toContain('create-1k')
    expect(md).toContain('180')
    expect(md).toContain('120')
  })

  it('marks p>=0.05 deltas as ties', () => {
    const md = renderReport(fixture)
    expect(md).toMatch(/create-1k.*tie/i)
  })

  it('is deterministic — same input, byte-identical output, date only from meta', () => {
    expect(renderReport(fixture)).toBe(renderReport(fixture))
    const dates = renderReport(fixture).match(/\d{4}-\d{2}-\d{2}/g) ?? []
    expect(new Set(dates)).toEqual(new Set(['2026-06-11']))
  })

  it('frames a11y as a gate, never a score', () => {
    const md = renderReport(fixture)
    expect(md).not.toMatch(/a11y score|accessibility score/i)
    expect(md).toContain('57%') // detection-ceiling disclaimer present
  })

  it('includes the hardware/meta block', () => {
    const md = renderReport(fixture)
    expect(md).toContain('Test CPU')
    expect(md).toContain('abc123def456')
  })
})

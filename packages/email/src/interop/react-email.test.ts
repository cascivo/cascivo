import { describe, expect, it } from 'vitest'
import * as email from '../index.ts'
import { formatMigration, planMigration, REACT_EMAIL_MAP } from './react-email.ts'

describe('planMigration', () => {
  it('maps the primitives that have equivalents', () => {
    const report = planMigration(['Html', 'Body', 'Button', 'Text'])
    expect(report.mapped.map((m) => m.to)).toEqual(['Html', 'Body', 'Button', 'Text'])
    expect(report.unmapped).toEqual([])
  })

  it('explains the ones that do not, rather than omitting them', () => {
    const report = planMigration(['Font', 'Tailwind', 'Markdown'])
    expect(report.mapped).toEqual([])
    expect(report.unmapped).toHaveLength(3)
    for (const u of report.unmapped) expect(u.note.length).toBeGreaterThan(20)
  })

  it('reports an unrecognised name instead of guessing', () => {
    expect(planMigration(['Nope']).unknown).toEqual(['Nope'])
  })
})

describe('REACT_EMAIL_MAP', () => {
  it('names only components this package actually exports', () => {
    // A map entry pointing at a component that does not exist would send someone to an
    // import that fails — worse than saying there is no equivalent.
    for (const [from, entry] of Object.entries(REACT_EMAIL_MAP)) {
      if (entry.cascivo === null) continue
      expect(email, `${from} → ${entry.cascivo}`).toHaveProperty(entry.cascivo)
    }
  })

  it('gives every gap a reason', () => {
    for (const [from, entry] of Object.entries(REACT_EMAIL_MAP)) {
      if (entry.cascivo !== null) continue
      expect(entry.note?.length ?? 0, `${from} has no reason`).toBeGreaterThan(20)
    }
  })
})

describe('formatMigration', () => {
  it('handles an empty plan without throwing', () => {
    expect(() => formatMigration(planMigration([]))).not.toThrow()
  })
})

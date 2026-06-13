import { describe, expect, it } from 'vitest'
import { allMetas } from './_all-metas.ts'

const FULL = ['inputs', 'display', 'overlay', 'navigation', 'feedback', 'layout']

describe('intent completeness', () => {
  for (const meta of allMetas) {
    it(`${meta.name} has required intent`, () => {
      expect(meta.intent, `${meta.name}: missing intent`).toBeDefined()
      const i = meta.intent!
      expect(i.whenToUse.length).toBeGreaterThan(0)
      expect(i.whenNotToUse.length).toBeGreaterThan(0)
      expect(i.related.length).toBeGreaterThan(0)
      if (FULL.includes(meta.category)) {
        expect(i.a11yRationale.trim().length).toBeGreaterThan(0)
        expect(i.flexibility.length).toBeGreaterThan(0)
      }
    })
  }
})

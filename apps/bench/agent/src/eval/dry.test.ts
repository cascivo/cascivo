import { describe, expect, it } from 'vitest'
import { dryRunCanaries } from './dry.ts'

// Builds twelve real apps and drives each in Chromium: EVAL_SLOW=1 enables it.
const slow = !process.env.EVAL_SLOW

/** The tasks whose canaries exist so far; the rest still have stub EVALs. */
const TASKS = ['admin-console', 'saas-settings', 'marketing-site', 'crud-table']

describe('dryRunCanaries', () => {
  it(
    'passes both good apps and fails the broken one, for every task',
    { skip: slow, timeout: 30 * 60_000 },
    async () => {
      const results = await dryRunCanaries(TASKS)
      expect(results).toHaveLength(TASKS.length * 3)
      for (const r of results) expect(r.status === 'pass').toBe(r.fixture !== 'broken')
    },
  )

  it('rejects a task id it does not know', async () => {
    await expect(dryRunCanaries(['no-such-task'])).rejects.toThrow(/Unknown task/)
  })
})

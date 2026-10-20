import { describe, expect, it } from 'vitest'
import { dryRunCanaries } from './dry.ts'

// Builds twenty-four real apps and drives each in Chromium: EVAL_SLOW=1 enables it.
const slow = !process.env.EVAL_SLOW

/** Every task, in the published order: each has three canaries. */
const TASKS = [
  'admin-console',
  'saas-settings',
  'marketing-site',
  'crud-table',
  'auth-flow',
  'form-validation',
  'delete-confirm',
  'filter-empty-state',
]

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

import { describe, expect, it } from 'vitest'
import type { AttemptStatus } from './results.ts'
import { disagreements, dryRunCanaries } from './dry.ts'

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
      for (const r of results)
        expect(r.status, `${r.task}/${r.fixture}`).toBe(
          r.fixture === 'broken' ? 'fail-eval' : 'pass',
        )
    },
  )

  // A broken fixture that stops at build or types never reaches its EVAL, so it proves nothing.
  it('accepts a broken canary only when its EVAL failed it', () => {
    const at = (fixture: 'cascivo' | 'broken', status: AttemptStatus) => [
      { task: 't', fixture, status, detail: 'why' },
    ]
    expect(disagreements(at('broken', 'fail-eval'))).toEqual([])
    expect(disagreements(at('cascivo', 'pass'))).toEqual([])
    expect(disagreements(at('broken', 'pass'))).toEqual([
      't/broken passed: the EVAL cannot see the behaviour it removes',
    ])
    for (const status of ['fail-build', 'fail-types', 'infra-error'] as const)
      expect(disagreements(at('broken', status))).toEqual([
        `t/broken is ${status}, not fail-eval: its EVAL never judged it (why)`,
      ])
    expect(disagreements(at('cascivo', 'fail-eval'))).toEqual(['t/cascivo is fail-eval: why'])
  })

  it('rejects a task id it does not know', async () => {
    await expect(dryRunCanaries(['no-such-task'])).rejects.toThrow(/Unknown task/)
  })
})

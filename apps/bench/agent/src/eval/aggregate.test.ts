import { describe, expect, it } from 'vitest'
import { aggregate, validity } from './aggregate.ts'
import { record, run } from './fixtures.ts'
import type { AttemptRecord } from './results.ts'

/** 3 tasks x 3 arms x 2 models x 1 attempt = 18 records. */
function fullRun(infra: number, over: Partial<ReturnType<typeof run>> = {}) {
  const tasks = ['a', 'b', 'c']
  const arms = ['cascivo', 'cascivo-bare', 'shadcn']
  const models = ['m1', 'm2']
  const records: AttemptRecord[] = []
  for (const task of tasks)
    for (const arm of arms)
      for (const model of models) {
        const bad = records.length < infra
        records.push(record({ task, arm, model, attempt: 1, status: bad ? 'infra-error' : 'pass' }))
      }
  return run({ tasks, arms, models, attempts: 1, records, ...over })
}

describe('validity', () => {
  it('is valid when complete and under the infra threshold', () => {
    expect(validity(fullRun(1))).toBe('valid')
    expect(validity(fullRun(0))).toBe('valid')
  })

  it('is invalid above 10% infra errors', () => {
    expect(validity(fullRun(2))).toBe('invalid')
  })

  it('treats exactly 10% as valid (strictly greater)', () => {
    const tens = run({
      attempts: 10,
      records: Array.from({ length: 10 }, (_, i) =>
        record({ attempt: i + 1, status: i === 0 ? 'infra-error' : 'pass' }),
      ),
    })
    expect(validity(tens)).toBe('valid')
  })

  it('is incomplete when the budget ran out, even if also over the infra threshold', () => {
    expect(validity(fullRun(0, { budgetExhausted: true }))).toBe('incomplete')
    expect(validity(fullRun(5, { budgetExhausted: true }))).toBe('incomplete')
  })

  it('is incomplete when a combination is missing', () => {
    const r = fullRun(0)
    expect(validity({ ...r, records: r.records.slice(1) })).toBe('incomplete')
    expect(validity(run({ attempts: 3 }))).toBe('incomplete')
  })

  it('is incomplete on duplicate or unknown records', () => {
    const r = fullRun(0)
    const dup = [...r.records.slice(1), record({ ...r.records[1] })]
    expect(validity({ ...r, records: dup })).toBe('incomplete')
    expect(validity({ ...r, records: [...r.records, record({ task: 'zzz' })] })).toBe('incomplete')
  })

  it('is incomplete, not a division by zero, with no records', () => {
    expect(validity(run({ records: [] }))).toBe('incomplete')
  })
})

describe('aggregate', () => {
  const three = (statuses: AttemptRecord['status'][], extra: Partial<AttemptRecord>[] = []) =>
    run({
      attempts: statuses.length,
      records: statuses.map((status, i) => record({ attempt: i + 1, status, ...extra[i] })),
    })

  it('computes pass@1 and pass@3', () => {
    const [row] = aggregate(three(['pass', 'fail-eval', 'pass']))
    expect(row?.attempts).toBe(3)
    expect(row?.passAt1).toBeCloseTo(0.667, 3)
    expect(row?.passAt3).toBe(true)
  })

  it('pass@3 is false when all three attempts fail', () => {
    const [row] = aggregate(three(['fail-eval', 'fail-build', 'fail-types']))
    expect(row?.passAt3).toBe(false)
    expect(row?.passAt1).toBe(0)
  })

  it('pass@3 is null with fewer than three attempts', () => {
    const [row] = aggregate(three(['pass']))
    expect(row?.passAt3).toBeNull()
    expect(row?.passAt1).toBe(1)
  })

  it('sums critical and serious axe violations', () => {
    const axe = (critical: number, serious: number) => ({
      critical,
      serious,
      moderate: 9,
      minor: 9,
    })
    const [row] = aggregate(
      three(
        ['pass', 'pass', 'infra-error'],
        [{ axe: axe(1, 2) }, { axe: axe(0, 3) }, { axe: null }],
      ),
    )
    expect(row?.axeSerious).toBe(6)
  })

  it('takes the median cost over attempts that have usage', () => {
    const cost = (costUsd: number) => ({
      usage: {
        inputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        outputTokens: 0,
        costUsd,
        durationMs: 0,
        turns: 0,
        failed: false,
      },
    })
    const odd = aggregate(three(['pass', 'pass', 'pass'], [cost(3), cost(1), cost(2)]))
    expect(odd[0]?.medianCostUsd).toBe(2)
    const even = aggregate(
      three(['pass', 'pass', 'infra-error', 'pass'], [cost(1), cost(3), { usage: null }, cost(5)]),
    )
    expect(even[0]?.medianCostUsd).toBe(3)
    const none = aggregate(three(['infra-error'], [{ usage: null }]))
    expect(none[0]?.medianCostUsd).toBeNull()
  })

  it('emits one row per task x arm x model in run order', () => {
    const rows = aggregate(
      run({
        tasks: ['t1', 't2'],
        arms: ['a1', 'a2'],
        models: ['m1', 'm2'],
        records: [record({ task: 't2', arm: 'a2', model: 'm2' })],
      }),
    )
    expect(rows.map((r) => `${r.task}/${r.arm}/${r.model}`)).toEqual([
      't1/a1/m1',
      't1/a1/m2',
      't1/a2/m1',
      't1/a2/m2',
      't2/a1/m1',
      't2/a1/m2',
      't2/a2/m1',
      't2/a2/m2',
    ])
    expect(rows[7]?.attempts).toBe(1)
    expect(rows[0]).toMatchObject({ attempts: 0, passAt1: 0, passAt3: null, medianCostUsd: null })
  })
})

import { describe, expect, it } from 'vitest'
import { EMPTY_EVALS, headline, historyColumns, orderArms, parseEvals, percent } from './data'

const row = (over: Record<string, unknown> = {}) => ({
  task: 'admin-console',
  arm: 'cascivo',
  model: 'claude-sonnet-5-5',
  attempts: 3,
  passAt1: 2 / 3,
  passAt3: true,
  axeSerious: 1,
  medianCostUsd: 0.2,
  ...over,
})

const doc = (latest: Record<string, unknown> | null = null, history: unknown = []) => ({
  schemaVersion: 1,
  latest,
  history,
})

const latest = (over: Record<string, unknown> = {}) => ({
  date: '2026-11-03',
  cascivoVersion: '1.2.3',
  models: [
    { model: 'claude-sonnet-5-5', date: '2026-11-03', cascivoVersion: '1.2.3', attempts: 3 },
  ],
  rows: [row()],
  costUsd: 12.5,
  ...over,
})

describe('parseEvals', () => {
  it('accepts the shipped empty-state document', () => {
    expect(parseEvals(doc())).toEqual({ latest: null, history: [] })
  })

  it('accepts a run and its history', () => {
    const parsed = parseEvals(
      doc(latest(), [
        {
          date: '2026-11-03',
          cascivoVersion: '1.2.3',
          passAt1: { 'claude-sonnet-5-5': { cascivo: 0.5 } },
        },
      ]),
    )
    expect(parsed.latest?.rows).toHaveLength(1)
    expect(parsed.latest?.models[0]?.cascivoVersion).toBe('1.2.3')
    expect(parsed.history[0]?.passAt1.get('claude-sonnet-5-5')?.get('cascivo')).toBe(0.5)
  })

  it.each([
    ['not an object', 'evals'],
    ['null', null],
    ['an array', []],
    ['another schema version', { ...doc(), schemaVersion: 2 }],
    ['rows that are not an array', doc(latest({ rows: 'x' }))],
    ['no rows', doc(latest({ rows: [] }))],
    ['a row with a bad share', doc(latest({ rows: [row({ passAt1: 2 })] }))],
    ['a row with a negative cost', doc(latest({ rows: [row({ medianCostUsd: -1 })] }))],
    ['a row with a NaN count', doc(latest({ rows: [row({ attempts: Number.NaN })] }))],
    ['a task id that could break out of a path', doc(latest({ rows: [row({ task: '../x' })] }))],
    ['a bad date', doc(latest({ date: 'yesterday' }))],
    ['a non-numeric cost', doc(latest({ costUsd: '12' }))],
    ['history that is not an array', doc(null, {})],
    [
      'a model without its own cascivo version',
      doc(latest({ models: [{ model: 'claude-sonnet-5-5', date: '2026-11-03', attempts: 3 }] })),
    ],
    [
      'a model with a version that is not semver',
      doc(
        latest({
          models: [
            { model: 'claude-sonnet-5-5', date: '2026-11-03', cascivoVersion: 'v1', attempts: 3 },
          ],
        }),
      ),
    ],
    [
      'a history share above 1',
      doc(null, [{ date: '2026-11-03', cascivoVersion: '1.0.0', passAt1: { m: { a: 3 } } }]),
    ],
  ])('renders the empty state for %s', (_name, raw) => {
    expect(parseEvals(raw)).toBe(EMPTY_EVALS)
  })

  it('rejects a model id that would shadow an object prototype', () => {
    const raw = JSON.parse(
      '{"schemaVersion":1,"latest":null,"history":[{"date":"2026-11-03","cascivoVersion":"1.0.0","passAt1":{"__proto__":{"a":1}}}]}',
    )
    expect(parseEvals(raw)).toBe(EMPTY_EVALS)
  })
})

describe('headline', () => {
  it('averages the per-task pass@1 and sums the attempts, skipping cells that never ran', () => {
    const rows = [
      row({ task: 'a', passAt1: 1, attempts: 3 }),
      row({ task: 'b', passAt1: 0, attempts: 3 }),
      row({ task: 'c', passAt1: 0, attempts: 0, passAt3: null, medianCostUsd: null }),
    ].map((r) => parseEvals(doc(latest({ rows: [r] }))).latest!.rows[0]!)
    expect(headline(rows, 'claude-sonnet-5-5', 'cascivo')).toEqual({ passAt1: 0.5, attempts: 6 })
    expect(headline(rows, 'claude-sonnet-5-5', 'shadcn')).toBeNull()
  })
})

describe('orderArms', () => {
  it('puts the published arms first, in order, then unknown ones as listed', () => {
    expect(orderArms(['shadcn', 'x', 'cascivo', 'cascivo-bare', 'x'])).toEqual([
      'cascivo',
      'cascivo-bare',
      'shadcn',
      'x',
    ])
  })
})

describe('historyColumns / percent', () => {
  it('lists each model with the arms any run has for it', () => {
    const entry = (passAt1: Record<string, Record<string, number>>) => ({
      date: '2026-11-03',
      cascivoVersion: '1.0.0',
      passAt1: new Map(Object.entries(passAt1).map(([m, a]) => [m, new Map(Object.entries(a))])),
    })
    expect(
      historyColumns([entry({ m1: { shadcn: 0, cascivo: 1 } }), entry({ m2: { cascivo: 1 } })]),
    ).toEqual([
      ['m1', 'cascivo'],
      ['m1', 'shadcn'],
      ['m2', 'cascivo'],
    ])
    expect(percent(2 / 3)).toBe('67%')
  })
})

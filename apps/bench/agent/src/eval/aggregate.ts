import type { AttemptRecord, EvalRun, RunValidity } from './results.ts'

export interface AggregateRow {
  task: string
  arm: string
  model: string
  /** Records seen for this cell; 0 when the run never reached it. */
  attempts: number
  /** Share of attempts that passed; an infra-error counts as not passing. */
  passAt1: number
  /** Whether any of three attempts passed; null until three attempts exist. */
  passAt3: boolean | null
  /** critical + serious axe violations summed over attempts. */
  axeSerious: number
  medianCostUsd: number | null
}

/** More than this share of infra errors means the numbers measure our infrastructure, not the arms. */
export const INFRA_THRESHOLD = 0.1

// NUL cannot appear in a task, arm or model id, so the joined key is unambiguous.
const cellKey = (task: string, arm: string, model: string, attempt?: number): string =>
  [task, arm, model, attempt].join('\0')

export function validity(run: EvalRun): RunValidity {
  if (run.budgetExhausted) return 'incomplete'

  const expected = new Set<string>()
  for (const task of run.tasks)
    for (const arm of run.arms)
      for (const model of run.models)
        for (let attempt = 1; attempt <= run.attempts; attempt++) {
          expected.add(cellKey(task, arm, model, attempt))
        }
  const seen = new Set<string>()
  for (const r of run.records) {
    const key = cellKey(r.task, r.arm, r.model, r.attempt)
    // Duplicates and unknown cells mean the file is not the run it claims to be.
    if (!expected.has(key) || seen.has(key)) return 'incomplete'
    seen.add(key)
  }
  if (seen.size !== expected.size || run.records.length === 0) return 'incomplete'

  const infra = run.records.filter((r) => r.status === 'infra-error').length
  return infra / run.records.length > INFRA_THRESHOLD ? 'invalid' : 'valid'
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const low = sorted[mid - 1]
  const high = sorted[mid]
  if (high === undefined) return null
  return sorted.length % 2 === 1 || low === undefined ? high : (low + high) / 2
}

export function aggregate(run: EvalRun): AggregateRow[] {
  const cells = new Map<string, AttemptRecord[]>()
  for (const r of run.records) {
    const key = cellKey(r.task, r.arm, r.model)
    const list = cells.get(key)
    if (list) list.push(r)
    else cells.set(key, [r])
  }

  const rows: AggregateRow[] = []
  for (const task of run.tasks)
    for (const arm of run.arms)
      for (const model of run.models) {
        const records = cells.get(cellKey(task, arm, model)) ?? []
        const passes = records.filter((r) => r.status === 'pass').length
        rows.push({
          task,
          arm,
          model,
          attempts: records.length,
          passAt1: records.length === 0 ? 0 : passes / records.length,
          passAt3: records.length < 3 ? null : passes > 0,
          axeSerious: records.reduce(
            (sum, r) => sum + (r.axe ? r.axe.critical + r.axe.serious : 0),
            0,
          ),
          medianCostUsd: median(records.flatMap((r) => (r.usage ? [r.usage.costUsd] : []))),
        })
      }
  return rows
}

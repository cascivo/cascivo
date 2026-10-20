/**
 * What /evals reads from `public/evals.json`.
 *
 * The file is written by `eval publish` in apps/bench/agent (the `EvalsJson` type there), but the
 * site does not import from apps/bench: the document is parsed here, once, from `unknown`, into
 * only the fields the page shows. Any deviation yields the empty state rather than a half page,
 * because a published number we could not fully validate is worse than none.
 */

export interface EvalRow {
  task: string
  arm: string
  model: string
  attempts: number
  passAt1: number
  /** Null until three attempts exist. */
  passAt3: boolean | null
  axeSerious: number
  medianCostUsd: number | null
}

export interface EvalModel {
  model: string
  date: string
  attempts: number
}

export interface EvalLatest {
  date: string
  cascivoVersion: string
  models: EvalModel[]
  rows: EvalRow[]
  costUsd: number
}

export interface EvalHistoryEntry {
  date: string
  cascivoVersion: string
  /** model -> arm -> mean pass@1 over the run's tasks. */
  passAt1: ReadonlyMap<string, ReadonlyMap<string, number>>
}

export interface EvalsData {
  latest: EvalLatest | null
  history: EvalHistoryEntry[]
}

export const EMPTY_EVALS: EvalsData = { latest: null, history: [] }

/** Arms are shown in this order; an unknown arm id follows in the order the file lists it. */
export const ARM_ORDER = ['cascivo', 'cascivo-bare', 'shadcn'] as const

/** Ids end up in hrefs and `data-` attributes, so only the shape a real id has gets through. */
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isId = (v: unknown): v is string => typeof v === 'string' && SAFE_ID.test(v)
const isDay = (v: unknown): v is string => typeof v === 'string' && ISO_DAY.test(v)
const isVersion = (v: unknown): v is string => typeof v === 'string' && VERSION.test(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isAmount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const isShare = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1

function parseRow(raw: unknown): EvalRow | null {
  if (!isRecord(raw)) return null
  const { task, arm, model, attempts, passAt1, passAt3, axeSerious, medianCostUsd } = raw
  if (!isId(task) || !isId(arm) || !isId(model)) return null
  if (!isCount(attempts) || !isShare(passAt1) || !isCount(axeSerious)) return null
  if (passAt3 !== null && typeof passAt3 !== 'boolean') return null
  if (medianCostUsd !== null && !isAmount(medianCostUsd)) return null
  return { task, arm, model, attempts, passAt1, passAt3, axeSerious, medianCostUsd }
}

function parseModel(raw: unknown): EvalModel | null {
  if (!isRecord(raw)) return null
  const { model, date, attempts } = raw
  if (!isId(model) || !isDay(date) || !isCount(attempts)) return null
  return { model, date, attempts }
}

/** Every element must parse: one bad row would make a table quietly wrong. */
function all<T>(raw: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(raw)) return null
  const out: T[] = []
  for (const item of raw) {
    const parsed = parse(item)
    if (parsed === null) return null
    out.push(parsed)
  }
  return out
}

function parseLatest(raw: unknown): EvalLatest | null {
  if (!isRecord(raw)) return null
  const { date, cascivoVersion, costUsd } = raw
  if (!isDay(date) || !isVersion(cascivoVersion) || !isAmount(costUsd)) return null
  const models = all(raw.models, parseModel)
  const rows = all(raw.rows, parseRow)
  if (models === null || rows === null || models.length === 0 || rows.length === 0) return null
  return { date, cascivoVersion, models, rows, costUsd }
}

function parseShares(raw: unknown): ReadonlyMap<string, ReadonlyMap<string, number>> | null {
  if (!isRecord(raw)) return null
  // A Map, not an object: ids come from the file and `__proto__` must stay a plain key.
  const byModel = new Map<string, ReadonlyMap<string, number>>()
  for (const [model, arms] of Object.entries(raw)) {
    if (!isId(model) || !isRecord(arms)) return null
    const byArm = new Map<string, number>()
    for (const [arm, share] of Object.entries(arms)) {
      if (!isId(arm) || !isShare(share)) return null
      byArm.set(arm, share)
    }
    byModel.set(model, byArm)
  }
  return byModel
}

function parseHistoryEntry(raw: unknown): EvalHistoryEntry | null {
  if (!isRecord(raw)) return null
  const { date, cascivoVersion } = raw
  if (!isDay(date) || !isVersion(cascivoVersion)) return null
  const passAt1 = parseShares(raw.passAt1)
  return passAt1 === null ? null : { date, cascivoVersion, passAt1 }
}

/** The document as the page needs it; anything that is not a schema-1 `evals.json` is empty. */
export function parseEvals(raw: unknown): EvalsData {
  if (!isRecord(raw) || raw.schemaVersion !== 1) return EMPTY_EVALS
  const history = all(raw.history, parseHistoryEntry)
  if (history === null) return EMPTY_EVALS
  if (raw.latest === null) return { latest: null, history }
  const latest = parseLatest(raw.latest)
  return latest === null ? EMPTY_EVALS : { latest, history }
}

/** Arms present in `ids`, known ones first in publication order. */
export function orderArms(ids: Iterable<string>): string[] {
  const seen = [...new Set(ids)]
  const known = ARM_ORDER.filter((arm) => seen.includes(arm))
  return [...known, ...seen.filter((arm) => !(ARM_ORDER as readonly string[]).includes(arm))]
}

export interface Headline {
  passAt1: number
  attempts: number
}

/**
 * The mean of the per-task pass@1 over the tasks that were run, as `eval publish` computes the
 * history, or null when this arm and model never ran.
 */
export function headline(rows: readonly EvalRow[], model: string, arm: string): Headline | null {
  const cells = rows.filter((r) => r.model === model && r.arm === arm && r.attempts > 0)
  if (cells.length === 0) return null
  return {
    passAt1: cells.reduce((sum, r) => sum + r.passAt1, 0) / cells.length,
    attempts: cells.reduce((sum, r) => sum + r.attempts, 0),
  }
}

export const percent = (share: number): string => `${Math.round(share * 100)}%`

export const dollars = (usd: number): string => `$${usd.toFixed(2)}`

/** The (model, arm) pairs any history entry has a value for, models in first-seen order. */
export function historyColumns(history: readonly EvalHistoryEntry[]): [string, string][] {
  const models: string[] = []
  for (const entry of history)
    for (const model of entry.passAt1.keys()) if (!models.includes(model)) models.push(model)
  return models.flatMap((model) =>
    orderArms(history.flatMap((entry) => [...(entry.passAt1.get(model)?.keys() ?? [])])).map(
      (arm): [string, string] => [model, arm],
    ),
  )
}

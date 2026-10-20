import type { AgentUsage } from '../result.ts'

export const SCHEMA_VERSION = 1

export type AttemptStatus = 'pass' | 'fail-build' | 'fail-types' | 'fail-eval' | 'infra-error'
export type RunValidity = 'valid' | 'incomplete' | 'invalid'

export interface AxeCounts {
  critical: number
  serious: number
  moderate: number
  minor: number
}

export interface AttemptRecord {
  task: string
  arm: string
  model: string
  /** 1-based. */
  attempt: number
  status: AttemptStatus
  /** First failing step's message, trimmed to 500 chars; null on pass. */
  detail: string | null
  /** Null on an infra-error before the agent produced a result. */
  usage: AgentUsage | null
  tscErrors: number | null
  /** Null when the eval never loaded a page. */
  axe: AxeCounts | null
  /** Null for the shadcn arm, which has no cascivo audit. */
  auditErrors: number | null
  auditWarnings: number | null
}

export interface EvalRun {
  schemaVersion: 1
  /** ISO 8601. */
  date: string
  cascivoVersion: string
  commit: string
  models: string[]
  arms: string[]
  tasks: string[]
  attempts: number
  maxUsd: number
  spentUsd: number
  /** True when the budget cap stopped new sessions. */
  budgetExhausted: boolean
  shadcnVersion: string
  records: AttemptRecord[]
}

const STATUSES: readonly AttemptStatus[] = [
  'pass',
  'fail-build',
  'fail-types',
  'fail-eval',
  'infra-error',
]

export const DETAIL_MAX = 500

/** First failing step wins: infra, then build, then types, then the hidden eval. */
export function classify(steps: {
  infra: boolean
  build: boolean
  types: boolean
  eval: boolean
}): AttemptStatus {
  if (steps.infra) return 'infra-error'
  if (!steps.build) return 'fail-build'
  if (!steps.types) return 'fail-types'
  if (!steps.eval) return 'fail-eval'
  return 'pass'
}

// Results files are read back from disk and from published artifacts, i.e. data this process
// did not just produce, so every field is checked here and named by path on failure.
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const fail = (path: string, expected: string): never => {
  throw new Error(`eval results: ${path} is not ${expected}`)
}

function field(obj: Record<string, unknown>, key: string, path: string): unknown {
  if (!(key in obj)) fail(`${path}${key}`, 'present')
  return obj[key]
}

function str(obj: Record<string, unknown>, key: string, path: string): string {
  const v = field(obj, key, path)
  return typeof v === 'string' ? v : fail(`${path}${key}`, 'a string')
}

function num(obj: Record<string, unknown>, key: string, path: string): number {
  const v = field(obj, key, path)
  return typeof v === 'number' && Number.isFinite(v) && v >= 0
    ? v
    : fail(`${path}${key}`, 'a non-negative number')
}

function int(obj: Record<string, unknown>, key: string, path: string, min: number): number {
  const v = field(obj, key, path)
  return typeof v === 'number' && Number.isInteger(v) && v >= min
    ? v
    : fail(`${path}${key}`, `an integer >= ${min}`)
}

function bool(obj: Record<string, unknown>, key: string, path: string): boolean {
  const v = field(obj, key, path)
  return typeof v === 'boolean' ? v : fail(`${path}${key}`, 'a boolean')
}

function strings(obj: Record<string, unknown>, key: string, path: string): string[] {
  const v = field(obj, key, path)
  if (!Array.isArray(v)) return fail(`${path}${key}`, 'an array')
  return v.map((item: unknown, i) =>
    typeof item === 'string' ? item : fail(`${path}${key}[${i}]`, 'a string'),
  )
}

/**
 * Model, arm and task ids: a repeated one would make aggregate() emit its rows twice and weight
 * it twice in the headline, and generate() pay for it twice.
 */
function ids(obj: Record<string, unknown>, key: string, path: string): string[] {
  const list = strings(obj, key, path)
  list.forEach((id, i) => {
    if (list.indexOf(id) !== i)
      fail(`${path}${key}[${i}]`, `unique (${JSON.stringify(id)} is listed twice)`)
  })
  return list
}

/** A nullable measurement: absent is a malformed file, null is a real "not measured". */
function orNull<T>(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  read: (o: Record<string, unknown>, k: string, p: string) => T,
): T | null {
  return field(obj, key, path) === null ? null : read(obj, key, path)
}

function status(obj: Record<string, unknown>, key: string, path: string): AttemptStatus {
  const v = field(obj, key, path)
  const found = STATUSES.find((s) => s === v)
  return found ?? fail(`${path}${key}`, `one of ${STATUSES.join(', ')}`)
}

function detail(obj: Record<string, unknown>, key: string, path: string): string {
  const v = str(obj, key, path)
  return v.length <= DETAIL_MAX ? v : fail(`${path}${key}`, `at most ${DETAIL_MAX} characters`)
}

function child(obj: Record<string, unknown>, key: string, path: string): Record<string, unknown> {
  const v = field(obj, key, path)
  return isRecord(v) ? v : fail(`${path}${key}`, 'an object')
}

function parseAxe(obj: Record<string, unknown>, key: string, path: string): AxeCounts {
  const axe = child(obj, key, path)
  const where = `${path}${key}.`
  return {
    critical: num(axe, 'critical', where),
    serious: num(axe, 'serious', where),
    moderate: num(axe, 'moderate', where),
    minor: num(axe, 'minor', where),
  }
}

function parseUsage(obj: Record<string, unknown>, key: string, path: string): AgentUsage {
  const usage = child(obj, key, path)
  const where = `${path}${key}.`
  return {
    inputTokens: num(usage, 'inputTokens', where),
    cacheCreationTokens: num(usage, 'cacheCreationTokens', where),
    cacheReadTokens: num(usage, 'cacheReadTokens', where),
    outputTokens: num(usage, 'outputTokens', where),
    costUsd: num(usage, 'costUsd', where),
    durationMs: num(usage, 'durationMs', where),
    turns: num(usage, 'turns', where),
    failed: bool(usage, 'failed', where),
  }
}

function parseRecord(raw: unknown, index: number): AttemptRecord {
  const path = `records[${index}]`
  if (!isRecord(raw)) return fail(path, 'an object')
  const where = `${path}.`
  return {
    task: str(raw, 'task', where),
    arm: str(raw, 'arm', where),
    model: str(raw, 'model', where),
    attempt: int(raw, 'attempt', where, 1),
    status: status(raw, 'status', where),
    detail: orNull(raw, 'detail', where, detail),
    usage: orNull(raw, 'usage', where, parseUsage),
    tscErrors: orNull(raw, 'tscErrors', where, (o, k, p) => int(o, k, p, 0)),
    axe: orNull(raw, 'axe', where, parseAxe),
    auditErrors: orNull(raw, 'auditErrors', where, (o, k, p) => int(o, k, p, 0)),
    auditWarnings: orNull(raw, 'auditWarnings', where, (o, k, p) => int(o, k, p, 0)),
  }
}

export type RunMeta = Omit<EvalRun, 'records'>

function meta(raw: Record<string, unknown>): RunMeta {
  if (field(raw, 'schemaVersion', '') !== SCHEMA_VERSION) {
    fail('schemaVersion', `${SCHEMA_VERSION}`)
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    date: str(raw, 'date', ''),
    cascivoVersion: str(raw, 'cascivoVersion', ''),
    commit: str(raw, 'commit', ''),
    models: ids(raw, 'models', ''),
    arms: ids(raw, 'arms', ''),
    tasks: ids(raw, 'tasks', ''),
    attempts: int(raw, 'attempts', '', 1),
    maxUsd: num(raw, 'maxUsd', ''),
    spentUsd: num(raw, 'spentUsd', ''),
    budgetExhausted: bool(raw, 'budgetExhausted', ''),
    shadcnVersion: str(raw, 'shadcnVersion', ''),
  }
}

/**
 * Reads the `run.json` that `generate` writes (a results file without its records) at the
 * boundary: `publish` reads it back from a workflow artifact.
 */
export function parseRunMeta(raw: unknown): RunMeta {
  if (!isRecord(raw)) return fail('the document', 'an object')
  return meta(raw)
}

/** Reads a results file at the boundary; throws naming the first bad field, e.g. `records[3].status`. */
export function parseEvalRun(raw: unknown): EvalRun {
  if (!isRecord(raw)) return fail('the document', 'an object')
  const run = meta(raw)
  const records = field(raw, 'records', '')
  if (!Array.isArray(records)) return fail('records', 'an array')
  return { ...run, records: records.map((r: unknown, i) => parseRecord(r, i)) }
}

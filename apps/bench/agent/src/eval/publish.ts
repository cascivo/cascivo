/**
 * The publish phase: a scored results file in, three committed files out.
 *
 * The results file comes from a CI artifact written by a job that also built and ran what the
 * agents wrote, so it is data this process did not produce: it is parsed once, and the two
 * strings that name the output file are checked before any path is built.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { MODELS } from '../models.ts'
import { evalDoc, type EvalDocRun } from '../report.ts'
import { aggregate, INFRA_THRESHOLD, validity, type AggregateRow } from './aggregate.ts'
import { parseEvalRun, type EvalRun } from './results.ts'

export interface EvalsLatest {
  /** YYYY-MM-DD of the newest run that makes up `latest`. */
  date: string
  cascivoVersion: string
  models: { model: string; date: string; attempts: number }[]
  rows: AggregateRow[]
  /** The full `spentUsd` of every run that contributes a model, even if it also holds a superseded one. */
  costUsd: number
}

export interface EvalsJson {
  schemaVersion: 1
  /** Null only when evals.json is rebuilt from a results directory with no valid run. */
  latest: EvalsLatest | null
  history: {
    date: string
    cascivoVersion: string
    passAt1: Record<string, Record<string, number>>
  }[]
}

export const RESULTS_DIR = 'apps/bench/agent/results'
const EVALS_JSON = 'apps/site/public/evals.json'
const DOC = 'docs/AGENT-BENCHMARKS.md'

// These two strings become a file name, so only the shapes a real run produces get through.
const ISO_DATE = /^(\d{4}-\d{2}-\d{2})(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

export interface EvalEntry {
  /** File name inside the results directory. */
  file: string
  run: EvalRun
  /** YYYY-MM-DD. */
  day: string
}

/** The results file name for a run; throws when its date or version could not be a real run's. */
export function resultsFileName(run: Pick<EvalRun, 'date' | 'cascivoVersion'>): string {
  const day = ISO_DATE.exec(run.date)?.[1]
  if (day === undefined || Number.isNaN(Date.parse(run.date)))
    throw new Error(`eval results: date ${JSON.stringify(run.date)} is not an ISO 8601 date`)
  if (!SEMVER.test(run.cascivoVersion))
    throw new Error(
      `eval results: cascivoVersion ${JSON.stringify(run.cascivoVersion)} is not a semantic version`,
    )
  return `${day}-${run.cascivoVersion}.json`
}

/** Same guard as `assertInside` in packages/cli, which bench-agent does not depend on. */
function assertInside(root: string, target: string): string {
  const base = resolve(root)
  const full = resolve(target)
  if (full !== base && !full.startsWith(base + sep))
    throw new Error(`Refusing to write outside ${base}: ${full}`)
  return full
}

function whyNotValid(run: EvalRun): string {
  if (run.budgetExhausted) return 'the budget cap stopped new sessions'
  const expected = run.tasks.length * run.arms.length * run.models.length * run.attempts
  if (validity(run) === 'invalid') {
    const infra = run.records.filter((r) => r.status === 'infra-error').length
    return `${infra} of ${run.records.length} attempts were infra-errors, over the ${INFRA_THRESHOLD * 100}% limit`
  }
  return `${run.records.length} records for ${expected} expected attempts, or records outside tasks × arms × models × attempts`
}

const when = (e: EvalEntry) => Date.parse(e.run.date)
const oldestFirst = (a: EvalEntry, b: EvalEntry) =>
  when(a) - when(b) || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0)

const modelRank = (model: string) => {
  const i = (MODELS as readonly string[]).indexOf(model)
  return i === -1 ? MODELS.length : i
}

/** Per model, its newest run; the budget fallback publishes Sonnet and Haiku as separate runs. */
function newestPerModel(entries: EvalEntry[]): { model: string; entry: EvalEntry }[] {
  const newest = new Map<string, EvalEntry>()
  for (const entry of [...entries].sort(oldestFirst))
    for (const model of entry.run.models) newest.set(model, entry)
  return [...newest]
    .map(([model, entry]) => ({ model, entry }))
    .sort((a, b) => modelRank(a.model) - modelRank(b.model) || (a.model < b.model ? -1 : 1))
}

const round = (n: number) => Math.round(n * 1e6) / 1e6

/**
 * What `latest` and the Markdown both describe, built once so they cannot differ: each model's
 * rows come from its newest run only. `run` carries the newest run's metadata over the merged
 * records, for the tables that need them. Null when there is no valid run.
 */
function latestRun(entries: EvalEntry[]): {
  run: EvalRun
  files: string[]
  day: string
  rows: AggregateRow[]
  sources: EvalDocRun[]
} | null {
  const picked = newestPerModel(entries)
  const newest = picked
    .map((p) => p.entry)
    .sort(oldestFirst)
    .at(-1)
  if (newest === undefined) return null
  const distinct = [...new Set(picked.map((p) => p.entry))].sort(oldestFirst)
  const union = (pick: (r: EvalRun) => string[]) => [
    ...new Set(picked.flatMap((p) => pick(p.entry.run))),
  ]
  return {
    run: {
      ...newest.run,
      models: picked.map((p) => p.model),
      arms: union((r) => r.arms),
      tasks: union((r) => r.tasks),
      attempts: Math.max(...picked.map((p) => p.entry.run.attempts)),
      spentUsd: round(distinct.reduce((sum, e) => sum + e.run.spentUsd, 0)),
      records: picked.flatMap((p) => p.entry.run.records.filter((r) => r.model === p.model)),
    },
    day: newest.day,
    files: distinct.map((e) => `${RESULTS_DIR}/${e.file}`),
    rows: picked.flatMap((p) => aggregate(p.entry.run).filter((r) => r.model === p.model)),
    sources: distinct.map((e) => ({
      file: `${RESULTS_DIR}/${e.file}`,
      run: e.run,
      models: picked.filter((p) => p.entry === e).map((p) => p.model),
    })),
  }
}

/** Mean pass@1 per model and arm over a run's tasks. */
function passAt1(run: EvalRun): Record<string, Record<string, number>> {
  const rows = aggregate(run)
  // Ids come from the file: `fromEntries` defines own properties, so `__proto__` stays a key.
  return Object.fromEntries(
    run.models.map((model) => [
      model,
      Object.fromEntries(
        run.arms.flatMap((arm) => {
          const cells = rows.filter((r) => r.model === model && r.arm === arm && r.attempts > 0)
          return cells.length === 0
            ? []
            : [[arm, round(cells.reduce((sum, r) => sum + r.passAt1, 0) / cells.length)]]
        }),
      ),
    ]),
  )
}

/** `evals.json` for a set of valid runs. */
export function buildEvalsJson(entries: EvalEntry[]): EvalsJson {
  const latest = latestRun(entries)
  const picked = newestPerModel(entries)
  return {
    schemaVersion: 1,
    latest:
      latest === null
        ? null
        : {
            date: latest.day,
            cascivoVersion: latest.run.cascivoVersion,
            models: picked.map((p) => ({
              model: p.model,
              date: p.entry.day,
              attempts: p.entry.run.attempts,
            })),
            rows: latest.rows,
            costUsd: latest.run.spentUsd,
          },
    history: [...entries].sort(oldestFirst).map((e) => ({
      date: e.day,
      cascivoVersion: e.run.cascivoVersion,
      passAt1: passAt1(e.run),
    })),
  }
}

/** Valid runs already committed. Anything else in the directory (legacy bench output) is skipped. */
function committedRuns(dir: string): EvalEntry[] {
  let names: string[]
  try {
    names = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.json'))
      .map((d) => d.name)
      .sort()
  } catch {
    return []
  }
  const entries: EvalEntry[] = []
  for (const file of names) {
    try {
      const run = parseEvalRun(JSON.parse(readFileSync(join(dir, file), 'utf8')))
      if (validity(run) !== 'valid') continue
      const name = resultsFileName(run)
      entries.push({ file, run, day: name.slice(0, 10) })
    } catch {
      // Not a results file of this schema: legacy bench output, or a file edited by hand.
    }
  }
  return entries
}

/** The same run, whatever file it sits in: when it started, what it ran on and which models. */
const identity = (run: EvalRun) =>
  JSON.stringify([run.date, run.commit, run.cascivoVersion, run.models])

function withoutDuplicates(entries: EvalEntry[]): EvalEntry[] {
  const seen = new Set<string>()
  return entries.filter((e) => {
    const id = identity(e.run)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/**
 * `<date>-<version>.json`, or `-2`, `-3`, … when that name holds a different run: the budget
 * fallback publishes Sonnet and Haiku as two runs of the same day. The first name that is free
 * or already holds this very run wins, so republishing is idempotent and nothing else is clobbered.
 */
function freeName(dir: string, run: EvalRun): string {
  const base = resultsFileName(run)
  for (let n = 1; n < 1000; n += 1) {
    const name = n === 1 ? base : `${base.slice(0, -'.json'.length)}-${n}.json`
    const path = assertInside(dir, join(dir, name))
    if (!existsSync(path)) return name
    try {
      if (identity(parseEvalRun(JSON.parse(readFileSync(path, 'utf8')))) === identity(run))
        return name
    } catch {
      // Not a results file: leave it where it is and try the next name.
    }
  }
  throw new Error(`eval results: no free file name for ${base}`)
}

/**
 * Writes the results file, `evals.json` and `AGENT-BENCHMARKS.md` for a valid run. Throws before
 * writing anything when the run is incomplete or invalid, or names an unsafe file. The three
 * writes are not atomic; a crash between them is recovered by running publish again.
 *
 * @param resultsFile The scored `results.json`.
 * @param repo The repository root.
 */
export function publish(resultsFile: string, repo: string): { written: string[] } {
  const raw: unknown = JSON.parse(readFileSync(resultsFile, 'utf8'))
  const run = parseEvalRun(raw)
  const state = validity(run)
  if (state !== 'valid')
    throw new Error(`eval results are ${state}, not published: ${whyNotValid(run)}`)

  const resultsDir = resolve(repo, RESULTS_DIR)
  const name = freeName(resultsDir, run)
  const resultsPath = assertInside(resultsDir, join(resultsDir, name))

  // Dropped by identity, not file name, so a re-publish never counts the run twice.
  const entries = withoutDuplicates(committedRuns(resultsDir)).filter(
    (e) => identity(e.run) !== identity(run),
  )
  entries.push({ file: name, run, day: name.slice(0, 10) })

  const latest = latestRun(entries)
  if (latest === null) throw new Error('eval results: no valid run to publish')
  const files = [
    [resultsPath, `${JSON.stringify(run, null, 2)}\n`],
    [join(repo, EVALS_JSON), `${JSON.stringify(buildEvalsJson(entries), null, 2)}\n`],
    [
      join(repo, DOC),
      evalDoc(latest.run, latest.files.join(', '), { rows: latest.rows, sources: latest.sources }),
    ],
  ] as const

  for (const [path, content] of files) {
    mkdirSync(resolve(path, '..'), { recursive: true })
    writeFileSync(path, content)
  }
  return { written: [`${RESULTS_DIR}/${name}`, EVALS_JSON, DOC] }
}

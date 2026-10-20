import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CASCIVO_EXECUTING_TOOLS, PUBLISHED_ARMS, SHADCN_EXECUTING_TOOLS } from '../arms.ts'
import { evalDoc } from '../report.ts'
import { aggregate } from './aggregate.ts'
import { record, run } from './fixtures.ts'
import {
  buildEvalsJson,
  CLOCK_SKEW_MS,
  CROSS_CHECKED,
  publish,
  type EvalsJson,
  type PublishOptions,
} from './publish.ts'
import { parseEvalRun, parseRunMeta, type AttemptRecord, type EvalRun } from './results.ts'
import { TASK_IDS } from './tasks.ts'

let repo: string
let scratch: string
beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'eval-publish-repo-'))
  scratch = mkdtempSync(join(tmpdir(), 'eval-publish-in-'))
  mkdirSync(join(repo, 'apps/bench/agent/results'), { recursive: true })
})
afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
  rmSync(scratch, { recursive: true, force: true })
})

/** Every file under `dir` with its content, to prove a refused publish touched nothing. */
function snapshot(dir: string, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const rel = `${prefix}${d.name}`
    if (d.isDirectory())
      Object.assign(out, { [`${rel}/`]: '' }, snapshot(join(dir, d.name), `${rel}/`))
    else out[rel] = readFileSync(join(dir, d.name), 'utf8')
  }
  return out
}

/** A complete run: 2 tasks x 2 arms, every cell `attempts` times, for the given model(s). */
function fullRun(model: string | string[], over: Partial<EvalRun> = {}): EvalRun {
  const models = Array.isArray(model) ? model : [model]
  const attempts = over.attempts ?? 3
  const tasks = over.tasks ?? ['admin-console', 'crud-table']
  const arms = over.arms ?? ['cascivo', 'shadcn']
  const records: AttemptRecord[] = []
  for (const m of models)
    for (const task of tasks)
      for (const arm of arms)
        for (let attempt = 1; attempt <= attempts; attempt++)
          records.push(
            record({
              task,
              arm,
              model: m,
              attempt,
              status: arm === 'shadcn' && attempt > 1 ? 'fail-eval' : 'pass',
            }),
          )
  return run({ models, tasks, arms, attempts, records, ...over })
}

function write(name: string, value: unknown): string {
  const file = join(scratch, name)
  writeFileSync(file, JSON.stringify(value))
  return file
}

/** After every fixture date, so the future-date check (tested on its own) never fires by accident. */
const NOW = new Date('2027-01-01T00:00:00.000Z')

/**
 * The fixtures run 2 tasks x 2 arms, which `publish` refuses without `partial`: the full-scope
 * rule has tests of its own, below.
 */
const publishPartial = (file: string, root: string, opts: PublishOptions = {}) =>
  publish(file, root, { partial: true, now: NOW, ...opts })

const results = (...names: string[]) => names.map((n) => join(repo, 'apps/bench/agent/results', n))
const evalsJson = (): EvalsJson =>
  JSON.parse(readFileSync(join(repo, 'apps/site/public/evals.json'), 'utf8'))

describe('publish', () => {
  it('writes exactly the results file, evals.json and the Markdown for a valid run', () => {
    const valid = fullRun('claude-sonnet-5-5', {
      date: '2026-10-21T03:04:05.000Z',
      cascivoVersion: '1.2.3',
    })
    const { written } = publishPartial(write('results.json', valid), repo)

    expect(written).toEqual([
      'apps/bench/agent/results/2026-10-21-1.2.3.json',
      'apps/site/public/evals.json',
      'docs/AGENT-BENCHMARKS.md',
    ])
    expect(
      Object.keys(snapshot(repo))
        .filter((k) => !k.endsWith('/'))
        .sort(),
    ).toEqual([...written].sort())
    const committed = readFileSync(join(repo, written[0]!), 'utf8')
    expect(committed).toBe(`${JSON.stringify(valid, null, 2)}\n`)
    expect(parseEvalRun(JSON.parse(committed))).toEqual(valid)

    const latest = evalsJson().latest
    expect(latest?.rows).toEqual(aggregate(valid))
    expect(latest).toMatchObject({
      date: '2026-10-21',
      cascivoVersion: '1.2.3',
      models: [
        { model: 'claude-sonnet-5-5', date: '2026-10-21', cascivoVersion: '1.2.3', attempts: 3 },
      ],
      costUsd: valid.spentUsd,
    })
    expect(evalsJson().history).toEqual([
      {
        date: '2026-10-21',
        cascivoVersion: '1.2.3',
        passAt1: { 'claude-sonnet-5-5': { cascivo: 1, shadcn: 0.333333 } },
      },
    ])
    const doc = readFileSync(join(repo, 'docs/AGENT-BENCHMARKS.md'), 'utf8')
    expect(doc).toBe(evalDoc(valid, 'apps/bench/agent/results/2026-10-21-1.2.3.json'))
  })

  it('refuses an incomplete run and leaves the repo unchanged', () => {
    const before = snapshot(repo)
    const incomplete = fullRun('claude-sonnet-5-5', { budgetExhausted: true })
    expect(() => publishPartial(write('r.json', incomplete), repo)).toThrow(/incomplete.*budget/)
    const missing = fullRun('claude-sonnet-5-5')
    expect(() =>
      publishPartial(write('m.json', { ...missing, records: missing.records.slice(1) }), repo),
    ).toThrow(/incomplete.*11 records for 12/)
    expect(snapshot(repo)).toEqual(before)
  })

  it('refuses an invalid run', () => {
    const base = fullRun('claude-sonnet-5-5')
    const records = base.records.map((r, i) =>
      i < 3 ? { ...r, status: 'infra-error' as const } : r,
    )
    expect(() => publishPartial(write('r.json', { ...base, records }), repo)).toThrow(
      /invalid.*3 of 12/,
    )
    expect(snapshot(repo)).toEqual({
      'apps/': '',
      'apps/bench/': '',
      'apps/bench/agent/': '',
      'apps/bench/agent/results/': '',
    })
  })

  it('names the bad field of a malformed results file', () => {
    const base = fullRun('claude-sonnet-5-5')
    const records = base.records.map((r, i) => (i === 0 ? { ...r, status: 'ok' } : r))
    expect(() => publishPartial(write('r.json', { ...base, records }), repo)).toThrow(
      /records\[0\]\.status/,
    )
  })

  it('rebuilds history from valid results and skips legacy bench output', () => {
    const [a, b, legacy] = results(
      '2026-09-01-1.0.0.json',
      '2026-10-01-1.1.0.json',
      '2026-10-20T16-03-47-dry.json',
    )
    writeFileSync(
      a!,
      JSON.stringify(
        fullRun('claude-sonnet-5-5', { date: '2026-09-01T00:00:00.000Z', cascivoVersion: '1.0.0' }),
      ),
    )
    writeFileSync(
      legacy!,
      JSON.stringify({ date: '2026-10-20T16:03:47.247Z', model: null, dryRun: true, runs: [] }),
    )
    writeFileSync(join(repo, 'apps/bench/agent/results/notes.json'), '{not json')
    const newer = fullRun('claude-sonnet-5-5', {
      date: '2026-10-01T00:00:00.000Z',
      cascivoVersion: '1.1.0',
    })
    publishPartial(write('r.json', newer), repo)

    expect(evalsJson().history.map((h) => [h.date, h.cascivoVersion])).toEqual([
      ['2026-09-01', '1.0.0'],
      ['2026-10-01', '1.1.0'],
    ])
    expect(existsSync(b!)).toBe(true)
    expect(readFileSync(legacy!, 'utf8')).toContain('"dryRun":true')
  })

  it('orders history oldest first and breaks date ties by file name', () => {
    const day = '2026-10-01T00:00:00.000Z'
    for (const v of ['1.0.1', '1.0.0']) {
      writeFileSync(
        join(repo, `apps/bench/agent/results/2026-10-01-${v}.json`),
        JSON.stringify(fullRun('claude-sonnet-5-5', { date: day, cascivoVersion: v })),
      )
    }
    publishPartial(
      write(
        'r.json',
        fullRun('claude-sonnet-5-5', { date: '2026-09-15T00:00:00.000Z', cascivoVersion: '0.9.0' }),
      ),
      repo,
    )
    expect(evalsJson().history.map((h) => h.cascivoVersion)).toEqual(['0.9.0', '1.0.0', '1.0.1'])
  })

  it("combines each model's newest run into latest when Sonnet and Haiku were published apart", () => {
    const sonnet = fullRun('claude-sonnet-5-5', {
      date: '2026-10-01T00:00:00.000Z',
      cascivoVersion: '1.0.0',
      spentUsd: 20,
    })
    publishPartial(write('s.json', sonnet), repo)
    const haiku = fullRun('claude-haiku-5-5', {
      date: '2026-10-05T00:00:00.000Z',
      cascivoVersion: '1.0.1',
      attempts: 1,
      spentUsd: 5,
    })
    publishPartial(write('h.json', haiku), repo)

    const { latest } = evalsJson()
    expect(latest?.models).toEqual([
      // Each model with its own run's version (M2): Sonnet's rows are 1.0.0's, not 1.0.1's.
      { model: 'claude-sonnet-5-5', date: '2026-10-01', cascivoVersion: '1.0.0', attempts: 3 },
      { model: 'claude-haiku-5-5', date: '2026-10-05', cascivoVersion: '1.0.1', attempts: 1 },
    ])
    expect(latest?.rows).toEqual([...aggregate(sonnet), ...aggregate(haiku)])
    expect(latest).toMatchObject({ date: '2026-10-05', cascivoVersion: '1.0.1', costUsd: 25 })

    const doc = readFileSync(join(repo, 'docs/AGENT-BENCHMARKS.md'), 'utf8')
    expect(doc).toContain('claude-haiku-5-5 ran fewer than 3 attempts')
    expect(doc).not.toContain('claude-sonnet-5-5 ran fewer than 3 attempts')
    expect(doc).toContain('2026-10-01-1.0.0.json, apps/bench/agent/results/2026-10-05-1.0.1.json')
  })

  it("counts a model's own newest run only, not an older full run of it", () => {
    const older = fullRun('claude-sonnet-5-5', {
      date: '2026-09-01T00:00:00.000Z',
      cascivoVersion: '1.0.0',
    })
    publishPartial(write('o.json', older), repo)
    const newer = fullRun('claude-sonnet-5-5', {
      date: '2026-10-01T00:00:00.000Z',
      cascivoVersion: '1.1.0',
    })
    publishPartial(write('n.json', newer), repo)
    expect(evalsJson().latest?.rows).toEqual(aggregate(newer))
    expect(evalsJson().latest?.costUsd).toBe(newer.spentUsd)
  })

  it('is idempotent when the same run is published twice', () => {
    const file = write('r.json', fullRun('claude-sonnet-5-5'))
    publishPartial(file, repo)
    const once = snapshot(repo)
    publishPartial(file, repo)
    expect(snapshot(repo)).toEqual(once)
  })

  it.each(['../../x', '1.0.0/../../x', '1.0', 'v1.0.0', '1.0.0\n', ''])(
    'refuses cascivoVersion %j without writing',
    (cascivoVersion) => {
      const before = snapshot(repo)
      expect(() =>
        publishPartial(write('r.json', fullRun('claude-sonnet-5-5', { cascivoVersion })), repo),
      ).toThrow(/cascivoVersion/)
      expect(snapshot(repo)).toEqual(before)
      expect(existsSync(join(repo, 'apps/bench/agent/x.json'))).toBe(false)
    },
  )

  it.each(['yesterday', '../2026-10-20', '2026-13-45T00:00:00Z', ''])(
    'refuses date %j without writing',
    (date) => {
      const before = snapshot(repo)
      expect(() =>
        publishPartial(write('r.json', fullRun('claude-sonnet-5-5', { date })), repo),
      ).toThrow(/date/)
      expect(snapshot(repo)).toEqual(before)
    },
  )
})

describe('publish, fix round 1', () => {
  const files = () => readdirSync(join(repo, 'apps/bench/agent/results')).sort()

  it('keeps two different runs of the same day and version in separate files', () => {
    const base = { date: '2026-10-05T01:00:00.000Z', cascivoVersion: '1.0.0' }
    const sonnet = fullRun('claude-sonnet-5-5', { ...base, commit: 'aaa1111', spentUsd: 20 })
    const haiku = fullRun('claude-haiku-5-5', {
      ...base,
      date: '2026-10-05T09:00:00.000Z',
      commit: 'bbb2222',
      attempts: 1,
      spentUsd: 5,
    })
    publishPartial(write('s.json', sonnet), repo)
    const second = publishPartial(write('h.json', haiku), repo)

    expect(files()).toEqual(['2026-10-05-1.0.0-2.json', '2026-10-05-1.0.0.json'])
    expect(second.written[0]).toBe('apps/bench/agent/results/2026-10-05-1.0.0-2.json')
    expect(evalsJson().history).toHaveLength(2)
    expect(evalsJson().latest?.models.map((m) => m.model)).toEqual([
      'claude-sonnet-5-5',
      'claude-haiku-5-5',
    ])
    expect(evalsJson().latest?.costUsd).toBe(25)
  })

  it('republishing either of two same-day runs rewrites its own file', () => {
    const base = { date: '2026-10-05T01:00:00.000Z', cascivoVersion: '1.0.0' }
    const a = write('a.json', fullRun('claude-sonnet-5-5', { ...base, commit: 'aaa1111' }))
    const b = write('b.json', fullRun('claude-haiku-5-5', { ...base, commit: 'bbb2222' }))
    publishPartial(a, repo)
    publishPartial(b, repo)
    const once = snapshot(repo)
    publishPartial(b, repo)
    publishPartial(a, repo)
    expect(snapshot(repo)).toEqual(once)
    expect(files()).toHaveLength(2)
  })

  it('does not overwrite a file that is not a results file', () => {
    const squatter = join(repo, 'apps/bench/agent/results/2026-10-20-1.0.0.json')
    writeFileSync(squatter, '{"legacy":true}')
    publishPartial(write('r.json', fullRun('claude-sonnet-5-5')), repo)
    expect(readFileSync(squatter, 'utf8')).toBe('{"legacy":true}')
    expect(files()).toContain('2026-10-20-1.0.0-2.json')
  })

  it('does not count a run twice when it is committed under another file name', () => {
    const valid = fullRun('claude-sonnet-5-5')
    publishPartial(write('r.json', valid), repo)
    writeFileSync(join(repo, 'apps/bench/agent/results/copy.json'), JSON.stringify(valid))
    publishPartial(write('r2.json', valid), repo)
    expect(evalsJson().history).toHaveLength(1)
    expect(evalsJson().latest?.rows).toEqual(aggregate(valid))
  })

  it('takes each model from its newest run when a later run covers only one of them', () => {
    const a = fullRun(['claude-sonnet-5-5', 'claude-haiku-5-5'], {
      date: '2026-10-01T00:00:00.000Z',
      cascivoVersion: '1.0.0',
      spentUsd: 30,
    })
    const b = fullRun('claude-haiku-5-5', {
      date: '2026-10-08T00:00:00.000Z',
      cascivoVersion: '1.1.0',
      spentUsd: 4,
    })
    publishPartial(write('a.json', a), repo)
    publishPartial(write('b.json', b), repo)

    const { latest } = evalsJson()
    expect(latest?.models).toEqual([
      { model: 'claude-sonnet-5-5', date: '2026-10-01', cascivoVersion: '1.0.0', attempts: 3 },
      { model: 'claude-haiku-5-5', date: '2026-10-08', cascivoVersion: '1.1.0', attempts: 3 },
    ])
    expect(latest?.rows).toEqual([
      ...aggregate(a).filter((r) => r.model === 'claude-sonnet-5-5'),
      ...aggregate(b),
    ])
    expect(latest?.costUsd).toBe(34)
  })

  it('describes each source run in the Markdown and uses the same rows as evals.json', () => {
    const sonnet = fullRun('claude-sonnet-5-5', {
      date: '2026-10-01T00:00:00.000Z',
      cascivoVersion: '1.0.0',
      commit: 'aaa1111',
      shadcnVersion: '4.0.0',
      spentUsd: 20,
      maxUsd: 50,
      tasks: ['admin-console'],
    })
    const haiku = fullRun('claude-haiku-5-5', {
      date: '2026-10-05T00:00:00.000Z',
      cascivoVersion: '1.0.1',
      commit: 'bbb2222',
      shadcnVersion: '4.1.0',
      spentUsd: 5,
      maxUsd: 10,
      attempts: 1,
    })
    publishPartial(write('s.json', sonnet), repo)
    publishPartial(write('h.json', haiku), repo)
    const doc = readFileSync(join(repo, 'docs/AGENT-BENCHMARKS.md'), 'utf8')

    expect(doc).toContain('claude-sonnet-5-5 (2026-10-01, 3 attempts)')
    expect(doc).toContain('claude-haiku-5-5 (2026-10-05, 1 attempt)')
    for (const piece of ['1.0.0', 'aaa1111', '4.0.0', '1.0.1', 'bbb2222', '4.1.0'])
      expect(doc).toContain(piece)
    expect(doc).toContain('$20.00 of $50.00')
    expect(doc).toContain('$5.00 of $10.00')
    expect(doc).toContain('$25.00')
    // Sonnet never ran crud-table, so the per-task table has no empty row for it.
    expect(doc).not.toMatch(/\| crud-table \| \w+ \| claude-sonnet-5-5 \|/)
    const rows = evalsJson().latest?.rows ?? []
    expect(rows.some((r) => r.attempts === 0)).toBe(false)
    const perTask = doc.split('## By task')[1]!.split('\n## ')[0]!
    expect(
      perTask.split('\n').filter((l) => /^\| (admin-console|crud-table) \| /.test(l)),
    ).toHaveLength(rows.length)
  })

  it('treats ids like constructor and __proto__ as plain strings', () => {
    const hostile = fullRun('__proto__', { arms: ['constructor', 'shadcn'] })
    publishPartial(write('r.json', hostile), repo)
    const history = evalsJson().history[0]!.passAt1
    expect(Object.keys(history)).toEqual(['__proto__'])
    expect(Object.keys(Object.getOwnPropertyDescriptor(history, '__proto__')?.value)).toEqual([
      'constructor',
      'shadcn',
    ])
    const doc = readFileSync(join(repo, 'docs/AGENT-BENCHMARKS.md'), 'utf8')
    expect(doc).not.toMatch(/native code|function Object/)
    expect(doc).toContain('**constructor**: see the method')
  })

  it('keeps the source path readable inside its code span', () => {
    const text = evalDoc(fullRun('claude-sonnet-5-5'), 'results/a_b|c\n`d`.json')
    expect(text).toContain('`results/a_b|c d.json`')
  })
})

describe('publish, final review', () => {
  /** Every published task and arm: what the workflow's full run produces for one model. */
  const scoped = (over: Partial<EvalRun> = {}) =>
    fullRun('claude-sonnet-5-5', { tasks: [...TASK_IDS], arms: [...PUBLISHED_ARMS], ...over })
  const strict = (file: string, opts: PublishOptions = {}) =>
    publish(file, repo, { now: NOW, ...opts })
  const runJson = (value: EvalRun, over: Record<string, unknown> = {}) => {
    const { records: _records, ...meta } = value
    return write('run.json', { ...meta, ...over })
  }

  it('publishes a run of every published task and arm, at one attempt too', () => {
    expect(strict(write('r.json', scoped())).written).toHaveLength(3)
    // The budget fallback (spec §5) runs Haiku at one attempt: still the full scope.
    const haiku = fullRun('claude-haiku-5-5', {
      tasks: [...TASK_IDS],
      arms: [...PUBLISHED_ARMS],
      attempts: 1,
      commit: 'bbb2222',
    })
    expect(strict(write('h.json', haiku)).written).toHaveLength(3)
  })

  it.each([
    ['a pilot', { tasks: ['admin-console'], attempts: 1 }],
    ['a task subset', { tasks: TASK_IDS.slice(0, 7) }],
    ['an arm subset', { arms: ['cascivo', 'shadcn'] }],
    ['an unknown task', { tasks: [...TASK_IDS.slice(0, 7), 'not-a-task'] }],
  ] as const)('refuses %s unless partial, and writes nothing', (_, over) => {
    const file = write('r.json', scoped(over as Partial<EvalRun>))
    const before = snapshot(repo)
    expect(() => strict(file)).toThrow(/not every published task and arm.*--partial/)
    expect(snapshot(repo)).toEqual(before)
    expect(strict(file, { partial: true }).written).toHaveLength(3)
  })

  it('refuses a run that lists a task twice, partial or not', () => {
    const run = scoped()
    const twice = { ...run, tasks: [...run.tasks, 'admin-console'] }
    expect(() => strict(write('r.json', twice), { partial: true })).toThrow(
      /tasks\[8\] is not unique/,
    )
  })

  it('refuses a date in the future, beyond the clock skew', () => {
    const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString()
    const before = snapshot(repo)
    expect(() => strict(write('r.json', scoped({ date: at(CLOCK_SKEW_MS + 1000) })))).toThrow(
      /is in the future/,
    )
    expect(snapshot(repo)).toEqual(before)
    expect(
      strict(write('r.json', scoped({ date: at(CLOCK_SKEW_MS - 1000) }))).written,
    ).toHaveLength(3)
    // The real clock by default: a run dated a day ahead of it is refused.
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString()
    expect(() => publish(write('t.json', scoped({ date: tomorrow })), repo)).toThrow(/future/)
  })

  it("publishes a shard whose run metadata matches generate's run.json", () => {
    const run = scoped()
    expect(strict(write('r.json', run), { runFile: runJson(run) }).written).toHaveLength(3)
  })

  it.each([
    ['date', '2026-10-19T00:00:00.000Z'],
    ['commit', 'f'.repeat(40)],
    ['models', ['claude-haiku-5-5']],
    ['tasks', TASK_IDS.slice(0, 7)],
    ['arms', ['cascivo', 'shadcn']],
    ['attempts', 2],
    ['spentUsd', 0.25],
    ['budgetExhausted', true],
    ['cascivoVersion', '9.9.9'],
    ['shadcnVersion', '4.0.0'],
    ['maxUsd', 999],
  ] as const)("refuses results whose %s differs from generate's run.json", (key, value) => {
    const run = scoped()
    const before = snapshot(repo)
    expect(() =>
      strict(write('r.json', run), { runFile: runJson(run, { [key]: value }), partial: true }),
    ).toThrow(new RegExp(`do not match the run.json.*${key}`))
    expect(snapshot(repo)).toEqual(before)
  })

  // The results file is `{ ...run.json, records }`: every field of run.json is compared.
  it('cross-checks every field run.json has', () => {
    const { records: _records, ...meta } = scoped()
    expect([...CROSS_CHECKED].sort()).toEqual(Object.keys(parseRunMeta(meta)).sort())
  })

  it('names the bad field of a malformed run.json', () => {
    const run = scoped()
    expect(() => strict(write('r.json', run), { runFile: runJson(run, { commit: 7 }) })).toThrow(
      /eval results: commit is not a string/,
    )
  })

  // M1: both shards of one workflow run are one history row, not two half-empty ones.
  it('merges the shards of one run into one history entry', () => {
    const shared = { cascivoVersion: '1.0.0', commit: 'aaa1111' }
    const sonnet = scoped({ ...shared, date: '2026-10-05T01:00:00.000Z' })
    const haiku = fullRun('claude-haiku-5-5', {
      ...shared,
      tasks: [...TASK_IDS],
      arms: [...PUBLISHED_ARMS],
      date: '2026-10-05T07:00:00.000Z',
      attempts: 1,
    })
    strict(write('s.json', sonnet))
    strict(write('h.json', haiku))
    const { history } = evalsJson()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ date: '2026-10-05', cascivoVersion: '1.0.0' })
    expect(Object.keys(history[0]!.passAt1)).toEqual(['claude-sonnet-5-5', 'claude-haiku-5-5'])
    // Another commit on the same day and version is another run.
    strict(
      write('o.json', scoped({ ...shared, commit: 'ccc3333', date: '2026-10-05T09:00:00.000Z' })),
    )
    expect(evalsJson().history).toHaveLength(2)
  })
})

describe('buildEvalsJson', () => {
  it('has a null latest and no history for an empty results directory', () => {
    expect(buildEvalsJson([])).toEqual({ schemaVersion: 1, latest: null, history: [] })
  })
})

describe('evalDoc', () => {
  const doc = evalDoc(fullRun('claude-sonnet-5-5'), 'apps/bench/agent/results/x.json')

  it('has the do-not-edit header, sections and the source', () => {
    expect(doc).toContain('do not edit')
    for (const h of [
      '## Arms',
      '## Scoring',
      '## pass@1 by model and arm',
      '## By task',
      '## Accessibility, adherence and cost',
      '## Reproduce',
    ])
      expect(doc).toContain(h)
    expect(doc).toContain('`apps/bench/agent/results/x.json`')
    expect(doc).toContain('eval generate')
  })

  // The published description of the method: no arm is offered a tool that runs a process.
  it('names no executing MCP tool and describes each arm as the README does', () => {
    const all = evalDoc(fullRun('claude-sonnet-5-5', { arms: [...PUBLISHED_ARMS] }), 'x')
    for (const tool of [...CASCIVO_EXECUTING_TOOLS, ...SHADCN_EXECUTING_TOOLS])
      expect(all).not.toContain(tool)
    expect(all).not.toMatch(/empty starter|only file tools/)
    const arms = all.split('## Arms')[1]!.split('\n## ')[0]!
    expect(arms).toContain('**cascivo**: the cascivo scaffold with its AI context files')
    expect(arms).toContain('`AGENTS.md` preloaded in the system prompt')
    expect(arms).toContain('21 read-only tools of the cascivo MCP server')
    expect(arms).toContain('**cascivo-bare**: the same scaffold without `AGENTS.md`')
    expect(arms).toContain('3 read-only tools of the shadcn MCP server')
  })

  it('shows a dash for pass@3 until three attempts exist, and says the model reports pass@1 only', () => {
    const one = evalDoc(fullRun('claude-haiku-5-5', { attempts: 1 }), 'x')
    expect(one).toMatch(/\| admin-console \| cascivo \| claude-haiku-5-5 \| 1 \| 100% \| — \|/)
    expect(one).toContain(
      'claude-haiku-5-5 ran fewer than 3 attempts per task and arm, so it reports pass@1 only.',
    )
    expect(doc).not.toContain('reports pass@1 only')
    expect(doc).toMatch(/\| admin-console \| shadcn \| claude-sonnet-5-5 \| 3 \| 33% \| yes \|/)
  })

  it('keeps ids from the file inside their table cells', () => {
    const hostile = 'a|b\n| x | <script> |'
    const r = fullRun('claude-sonnet-5-5')
    const tasks = [hostile, 'crud-table']
    const text = evalDoc(
      {
        ...r,
        tasks,
        records: r.records.map((x) => (x.task === 'admin-console' ? { ...x, task: hostile } : x)),
        commit: 'a|b\nc',
      },
      'p|q\n`r`',
    )
    expect(text).not.toContain('<script>')
    expect(text).not.toMatch(/^[^|\n]*\| x \|/m)
    const table = text
      .split('## By task')[1]!
      .split('\n## ')[0]!
      .split('\n')
      .filter((l) => l.startsWith('|'))
    const cells = (l: string) => l.replace(/\\\|/g, '').split('|').length
    expect(new Set(table.map(cells)).size).toBe(1)
    expect(text).toContain('a\\|b \\| x \\| &lt;script&gt;')
  })
})

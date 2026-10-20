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
import { evalDoc } from '../report.ts'
import { aggregate } from './aggregate.ts'
import { record, run } from './fixtures.ts'
import { buildEvalsJson, publish, type EvalsJson } from './publish.ts'
import { parseEvalRun, type AttemptRecord, type EvalRun } from './results.ts'

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

/** A complete run: 2 tasks x 2 arms, every cell `attempts` times, for the given models. */
function fullRun(model: string, over: Partial<EvalRun> = {}): EvalRun {
  const attempts = over.attempts ?? 3
  const tasks = ['admin-console', 'crud-table']
  const arms = ['cascivo', 'shadcn']
  const records: AttemptRecord[] = []
  for (const task of tasks)
    for (const arm of arms)
      for (let attempt = 1; attempt <= attempts; attempt++)
        records.push(
          record({
            task,
            arm,
            model,
            attempt,
            status: arm === 'shadcn' && attempt > 1 ? 'fail-eval' : 'pass',
          }),
        )
  return run({ models: [model], tasks, arms, attempts, records, ...over })
}

function write(name: string, value: unknown): string {
  const file = join(scratch, name)
  writeFileSync(file, JSON.stringify(value))
  return file
}

const results = (...names: string[]) => names.map((n) => join(repo, 'apps/bench/agent/results', n))
const evalsJson = (): EvalsJson =>
  JSON.parse(readFileSync(join(repo, 'apps/site/public/evals.json'), 'utf8'))

describe('publish', () => {
  it('writes exactly the results file, evals.json and the Markdown for a valid run', () => {
    const valid = fullRun('claude-sonnet-5-5', {
      date: '2026-10-21T03:04:05.000Z',
      cascivoVersion: '1.2.3',
    })
    const { written } = publish(write('results.json', valid), repo)

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
      models: [{ model: 'claude-sonnet-5-5', date: '2026-10-21', attempts: 3 }],
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
    expect(() => publish(write('r.json', incomplete), repo)).toThrow(/incomplete.*budget/)
    const missing = fullRun('claude-sonnet-5-5')
    expect(() =>
      publish(write('m.json', { ...missing, records: missing.records.slice(1) }), repo),
    ).toThrow(/incomplete.*11 records for 12/)
    expect(snapshot(repo)).toEqual(before)
  })

  it('refuses an invalid run', () => {
    const base = fullRun('claude-sonnet-5-5')
    const records = base.records.map((r, i) =>
      i < 3 ? { ...r, status: 'infra-error' as const } : r,
    )
    expect(() => publish(write('r.json', { ...base, records }), repo)).toThrow(/invalid.*3 of 12/)
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
    expect(() => publish(write('r.json', { ...base, records }), repo)).toThrow(
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
    publish(write('r.json', newer), repo)

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
    publish(
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
    publish(write('s.json', sonnet), repo)
    const haiku = fullRun('claude-haiku-5-5', {
      date: '2026-10-05T00:00:00.000Z',
      cascivoVersion: '1.0.1',
      attempts: 1,
      spentUsd: 5,
    })
    publish(write('h.json', haiku), repo)

    const { latest } = evalsJson()
    expect(latest?.models).toEqual([
      { model: 'claude-sonnet-5-5', date: '2026-10-01', attempts: 3 },
      { model: 'claude-haiku-5-5', date: '2026-10-05', attempts: 1 },
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
    publish(write('o.json', older), repo)
    const newer = fullRun('claude-sonnet-5-5', {
      date: '2026-10-01T00:00:00.000Z',
      cascivoVersion: '1.1.0',
    })
    publish(write('n.json', newer), repo)
    expect(evalsJson().latest?.rows).toEqual(aggregate(newer))
    expect(evalsJson().latest?.costUsd).toBe(newer.spentUsd)
  })

  it('is idempotent when the same run is published twice', () => {
    const file = write('r.json', fullRun('claude-sonnet-5-5'))
    publish(file, repo)
    const once = snapshot(repo)
    publish(file, repo)
    expect(snapshot(repo)).toEqual(once)
  })

  it.each(['../../x', '1.0.0/../../x', '1.0', 'v1.0.0', '1.0.0\n', ''])(
    'refuses cascivoVersion %j without writing',
    (cascivoVersion) => {
      const before = snapshot(repo)
      expect(() =>
        publish(write('r.json', fullRun('claude-sonnet-5-5', { cascivoVersion })), repo),
      ).toThrow(/cascivoVersion/)
      expect(snapshot(repo)).toEqual(before)
      expect(existsSync(join(repo, 'apps/bench/agent/x.json'))).toBe(false)
    },
  )

  it.each(['yesterday', '../2026-10-20', '2026-13-45T00:00:00Z', ''])(
    'refuses date %j without writing',
    (date) => {
      const before = snapshot(repo)
      expect(() => publish(write('r.json', fullRun('claude-sonnet-5-5', { date })), repo)).toThrow(
        /date/,
      )
      expect(snapshot(repo)).toEqual(before)
    },
  )
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

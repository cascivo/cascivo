import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { parseEvalRun } from './eval/results.ts'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLI = join(PKG, 'src', 'eval-cli.ts')

// Plain `node`, not vitest: vitest transforms TypeScript itself and would hide anything Node's
// own type stripping rejects, which is how `pnpm eval` runs.
function node(args: string[], env: Record<string, string | undefined> = {}) {
  const merged = { ...process.env, ...env }
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete merged[k]
  return spawnSync(process.execPath, args, { cwd: PKG, encoding: 'utf8', env: merged })
}

const scoredMeta = {
  schemaVersion: 1,
  date: '2026-10-20T00:00:00.000Z',
  cascivoVersion: '1.0.0',
  commit: 'a'.repeat(40),
  models: ['claude-haiku-5-5'],
  arms: ['cascivo'],
  tasks: ['admin-console'],
  attempts: 1,
  maxUsd: 50,
  spentUsd: 0,
  budgetExhausted: false,
  shadcnVersion: '4.22.1',
}

let root: string
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'eval-cli-test-'))
})
afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('plain node', () => {
  it('loads a real task EVAL the way evaluate.ts does', () => {
    const evalPath = join(PKG, 'tasks', 'admin-console', 'EVAL.ts')
    const ran = node([
      '--input-type=module',
      '-e',
      `const m = await import(${JSON.stringify(new URL(`file://${evalPath}`).href)}); console.log(typeof m.default)`,
    ])
    expect(ran.stderr).not.toMatch(/Error/)
    expect(ran.stdout.trim()).toBe('function')
    expect(ran.status).toBe(0)
  })

  it('loads the evaluate and generate modules', () => {
    const ran = node([
      '--input-type=module',
      '-e',
      `await import('./src/eval/evaluate.ts'); await import('./src/eval/generate.ts'); console.log('ok')`,
    ])
    expect(ran.stderr).not.toMatch(/Error/)
    expect(ran.stdout.trim()).toBe('ok')
  })
})

// The workflow is not run by any test; these pin the lines the final review's fixes depend on.
describe('evals.yml', () => {
  const yml = readFileSync(join(PKG, '..', '..', '..', '.github', 'workflows', 'evals.yml'), 'utf8')
  /** The text of one top-level job, up to the next. */
  const job = (name: string) => yml.split(`\n  ${name}:\n`)[1]?.split(/\n {2}[a-z-]+:\n/)[0] ?? ''

  it('opens a results PR on a release, or on a dispatch that ticks publish', () => {
    expect(yml).toMatch(/\n {6}publish:\n(?: {8}.*\n)*? {8}type: boolean\n {8}default: false\n/)
    // Not `!= false`: an unticked dispatch must not publish, and neither must a missing input.
    expect(job('publish')).toContain("\n    if: github.event_name == 'release' || inputs.publish\n")
    expect(yml).not.toMatch(/inputs\.publish\s*!=/)
  })

  it('cross-checks each shard against the run.json generate uploaded', () => {
    expect(job('generate')).toContain(
      'name: eval-run-${{ matrix.model }}\n          path: gen/run.json',
    )
    expect(job('publish')).toContain('pattern: eval-run-*')
    expect(job('publish')).toContain('--run "$GITHUB_WORKSPACE/runs/eval-run-$model/run.json"')
    expect(job('publish')).toContain('--expect-model "$model"')
    expect(job('publish')).not.toContain('--partial')
  })
})

describe('legacy bench', () => {
  it('rejects --publish and points to eval publish', () => {
    const ran = node([join(PKG, 'src', 'cli.ts'), '--publish'])
    expect(ran.status).toBe(2)
    expect(ran.stderr).toContain('superseded by `pnpm --filter bench-agent eval publish`')
  })
})

describe('eval-cli', () => {
  it('prints the usage and exits 0 for --help', () => {
    const ran = node([CLI, '--help'])
    expect(ran.status).toBe(0)
    for (const word of ['generate', 'score', 'dry', 'publish']) expect(ran.stdout).toContain(word)
  })

  it('exits 2 for an unknown subcommand, an unknown option and no subcommand', () => {
    for (const args of [['frobnicate'], ['generate', '--out', root, '--nope'], []]) {
      const ran = node([CLI, ...args], { ANTHROPIC_API_KEY: 'x' })
      expect(ran.status, args.join(' ')).toBe(2)
      expect(ran.stderr).toContain('Usage')
    }
  })

  it('exits 2 for an unknown arm or task and a bad number', () => {
    for (const args of [
      ['--arms', 'today'],
      ['--tasks', 'nope'],
      ['--attempts', '0'],
      ['--max-usd', 'lots'],
    ]) {
      const ran = node([CLI, 'generate', '--out', join(root, 'x'), ...args], {
        ANTHROPIC_API_KEY: 'x',
      })
      expect(ran.status, args.join(' ')).toBe(2)
    }
  })

  // A repeated id would be run and paid for twice, and weighted twice in the headline.
  it('exits 2 for a model, arm or task listed twice', () => {
    for (const [flag, value] of [
      ['--models', 'claude-haiku-5-5,claude-haiku-5-5'],
      ['--arms', 'cascivo,shadcn,cascivo'],
      ['--tasks', 'admin-console,admin-console'],
    ]) {
      const ran = node([CLI, 'generate', '--out', join(root, 'twice'), flag!, value!], {
        ANTHROPIC_API_KEY: 'x',
      })
      expect(ran.status, flag).toBe(2)
      expect(ran.stderr, flag).toContain('twice')
    }
    expect(existsSync(join(root, 'twice'))).toBe(false)
  })

  it('exits 2 for a model that is not in the list', () => {
    const ran = node(
      [CLI, 'generate', '--out', join(root, 'm'), '--models', 'claude-sonnet-5-5,gpt-9'],
      {
        ANTHROPIC_API_KEY: 'x',
      },
    )
    expect(ran.status).toBe(2)
    expect(ran.stderr).toContain('gpt-9')
  })

  it('exits 2 for an output directory that already holds files', () => {
    const dir = join(root, 'stale')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'old.txt'), '')
    const ran = node([CLI, 'generate', '--out', dir], { ANTHROPIC_API_KEY: 'x' })
    expect(ran.status).toBe(2)
    expect(ran.stderr).toMatch(/not empty/)
  })

  it('refuses to generate without ANTHROPIC_API_KEY', () => {
    const ran = node([CLI, 'generate', '--out', join(root, 'nokey')], {
      ANTHROPIC_API_KEY: undefined,
    })
    expect(ran.status).toBe(2)
    expect(ran.stderr).toContain('ANTHROPIC_API_KEY')
    expect(existsSync(join(root, 'nokey'))).toBe(false)
  })

  describe('publish', () => {
    const evalsJson = join(PKG, '..', '..', 'site', 'public', 'evals.json')
    const doc = join(PKG, '..', '..', '..', 'docs', 'AGENT-BENCHMARKS.md')

    it('needs --results', () => {
      expect(node([CLI, 'publish']).status).toBe(2)
    })

    /** What is on disk, or null for a missing file: a refused publish must change neither. */
    const hash = (path: string) =>
      existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null

    it('exits 1 with the reason for a run that is not valid, and writes nothing', () => {
      const before = [hash(evalsJson), hash(doc)]
      const file = join(root, 'incomplete.json')
      const incomplete = { ...scoredMeta, budgetExhausted: true, records: [] }
      writeFileSync(file, JSON.stringify(incomplete))
      const ran = node([CLI, 'publish', '--results', file, '--partial'])
      expect(ran.status).toBe(1)
      expect(ran.stderr).toMatch(/incomplete/)
      expect([hash(evalsJson), hash(doc)]).toEqual(before)
    })

    // The workflow's pilot (one task, one attempt) is complete and valid, but not the headline.
    it('refuses a partial run unless --partial, and writes nothing', () => {
      const before = [hash(evalsJson), hash(doc)]
      const file = join(root, 'pilot.json')
      const pilot = {
        ...scoredMeta,
        records: [
          {
            task: 'admin-console',
            arm: 'cascivo',
            model: 'claude-haiku-5-5',
            attempt: 1,
            status: 'pass',
            detail: null,
            usage: null,
            tscErrors: 0,
            axe: null,
            auditErrors: 0,
            auditWarnings: 0,
          },
        ],
      }
      writeFileSync(file, JSON.stringify(pilot))
      const ran = node([CLI, 'publish', '--results', file])
      expect(ran.status).toBe(1)
      expect(ran.stderr).toMatch(/not every published task and arm/)
      expect([hash(evalsJson), hash(doc)]).toEqual(before)
    })

    it("refuses results whose run metadata differs from --run's run.json", () => {
      const file = join(root, 'cross.json')
      writeFileSync(file, JSON.stringify({ ...scoredMeta, records: [] }))
      const runJson = join(root, 'cross-run.json')
      writeFileSync(runJson, JSON.stringify({ ...scoredMeta, spentUsd: 12.5 }))
      const ran = node([CLI, 'publish', '--results', file, '--run', runJson, '--partial'])
      expect(ran.status).toBe(1)
      expect(ran.stderr).toMatch(/do not match the run\.json.*spentUsd/)
    })

    // The workflow publishes one shard per model: a shard must hold that model's run and no other.
    it('refuses a run that is not exactly the --expect-model one, before any other check', () => {
      const incomplete = { ...scoredMeta, budgetExhausted: true, records: [] }
      const file = join(root, 'shard.json')
      writeFileSync(file, JSON.stringify(incomplete))
      const other = node([CLI, 'publish', '--results', file, '--expect-model', 'claude-sonnet-5-5'])
      expect(other.status).toBe(1)
      expect(other.stderr).toContain('claude-sonnet-5-5')
      expect(other.stderr).not.toMatch(/incomplete/)

      const both = join(root, 'shard-two-models.json')
      writeFileSync(
        both,
        JSON.stringify({ ...incomplete, models: ['claude-haiku-5-5', 'claude-sonnet-5-5'] }),
      )
      const extra = node([CLI, 'publish', '--results', both, '--expect-model', 'claude-haiku-5-5'])
      expect(extra.status).toBe(1)
      expect(extra.stderr).not.toMatch(/incomplete/)

      // The model it holds passes this check and reaches the validity one.
      const same = node([
        CLI,
        'publish',
        '--results',
        file,
        '--expect-model',
        'claude-haiku-5-5',
        '--partial',
      ])
      expect(same.status).toBe(1)
      expect(same.stderr).toMatch(/incomplete/)
    })

    it('exits 1 naming the field of a malformed results file', () => {
      const file = join(root, 'malformed.json')
      writeFileSync(file, JSON.stringify({ ...scoredMeta, records: [{ status: 'ok' }] }))
      const ran = node([CLI, 'publish', '--results', file])
      expect(ran.status).toBe(1)
      expect(ran.stderr).toContain('records[0]')
    })
  })

  describe('score', () => {
    function inDir(name: string, run: unknown): string {
      const dir = join(root, name)
      const attempt = join(dir, 'claude-haiku-5-5', 'cascivo', 'admin-console', '1')
      mkdirSync(attempt, { recursive: true })
      writeFileSync(
        join(attempt, 'meta.json'),
        JSON.stringify({ usage: null, infra: true, infraDetail: 'timed out' }),
      )
      writeFileSync(join(dir, 'run.json'), JSON.stringify(run))
      return dir
    }

    it('merges run.json with the records into a valid EvalRun', () => {
      const dir = inDir('score-ok', scoredMeta)
      const resultsPath = join(root, 'nested', 'results.json')
      const ran = node([CLI, 'score', '--in', dir, '--out', resultsPath, '--concurrency', '1'])
      expect(ran.status, ran.stderr).toBe(0)
      const run = parseEvalRun(JSON.parse(readFileSync(resultsPath, 'utf8')))
      expect(run.records).toHaveLength(1)
      expect(run.records[0]).toMatchObject({ status: 'infra-error', detail: 'timed out' })
      expect(run.commit).toBe('a'.repeat(40))
    })

    it('writes nothing when the merged run is malformed', () => {
      const { commit: _commit, ...broken } = scoredMeta
      const dir = inDir('score-bad', broken)
      const resultsPath = join(root, 'bad-results.json')
      const ran = node([CLI, 'score', '--in', dir, '--out', resultsPath])
      expect(ran.status).not.toBe(0)
      expect(ran.stderr).toContain('commit')
      expect(existsSync(resultsPath)).toBe(false)
    })

    it('needs --in and --out', () => {
      expect(node([CLI, 'score', '--in', root]).status).toBe(2)
    })
  })
})

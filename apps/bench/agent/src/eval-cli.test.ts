import { spawnSync } from 'node:child_process'
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

    it('exits 1 with the reason for a run that is not valid, and writes nothing', () => {
      const before = [existsSync(evalsJson), existsSync(doc)]
      const file = join(root, 'incomplete.json')
      const incomplete = { ...scoredMeta, budgetExhausted: true, records: [] }
      writeFileSync(file, JSON.stringify(incomplete))
      const ran = node([CLI, 'publish', '--results', file])
      expect(ran.status).toBe(1)
      expect(ran.stderr).toMatch(/incomplete/)
      expect([existsSync(evalsJson), existsSync(doc)]).toEqual(before)
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

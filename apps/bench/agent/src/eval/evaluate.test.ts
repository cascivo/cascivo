import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runBounded, scoreAll, scoreAttempt } from './evaluate.ts'
import { TASK_IDS, type EvalTask } from './tasks.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, '__fixtures__')
const AGENT_MODULES = join(HERE, '..', '..', 'node_modules')

// Builds real apps with Vite and drives a real Chromium: EVAL_SLOW=1 enables them.
const slow = !process.env.EVAL_SLOW

const task = (evalName: string): EvalTask => ({
  id: 'admin-console',
  prompt: '',
  evalPath: join(FIXTURES, 'evals', `${evalName}.ts`),
  fixturesDir: '',
})

/** A pid that is gone, or a zombie nobody has reaped yet: either way, no longer running. */
function running(pid: number): boolean {
  try {
    process.kill(pid, 0)
  } catch {
    return false
  }
  try {
    return !/^\d+ \(.*\) Z/.test(readFileSync(`/proc/${pid}/stat`, 'utf8'))
  } catch {
    return true
  }
}

async function eventuallyStopped(pid: number): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    if (!running(pid)) return true
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return false
}

let root = ''
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'evaluate-test-'))
})
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('runBounded', () => {
  it('kills the whole process group on timeout', async () => {
    const started = Date.now()
    const ran = await runBounded('sh', ['-c', 'sleep 60 & echo $!; wait'], root, 500)
    expect(ran.timedOut).toBe(true)
    expect(Date.now() - started).toBeLessThan(5000)
    const grandchild = Number(ran.output.trim())
    expect(grandchild).toBeGreaterThan(0)
    expect(await eventuallyStopped(grandchild)).toBe(true)
  })

  it('returns when the process exits even if a grandchild still holds its output', async () => {
    const started = Date.now()
    const ran = await runBounded('sh', ['-c', 'sleep 60 & echo $!'], root, 30_000)
    expect(ran.timedOut).toBe(false)
    expect(ran.code).toBe(0)
    expect(Date.now() - started).toBeLessThan(10_000)
    expect(await eventuallyStopped(Number(ran.output.trim()))).toBe(true)
  })
})

describe('scoreAll', () => {
  const result = {
    type: 'result',
    subtype: 'success',
    is_error: false,
    total_cost_usd: 0.25,
    duration_ms: 1000,
    num_turns: 3,
    usage: { input_tokens: 10, output_tokens: 20 },
  }

  const attemptDir = (inDir: string, arm: string, attempt: string, meta?: unknown) => {
    const dir = join(inDir, 'claude-haiku-5-5', arm, 'admin-console', attempt)
    mkdirSync(dir, { recursive: true })
    if (meta !== undefined) writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta))
    return dir
  }

  it('records infra attempts without building, and parses meta.json at the boundary', async () => {
    const inDir = join(root, 'score-all')
    mkdirSync(inDir, { recursive: true })
    writeFileSync(join(inDir, 'run.json'), '{}')
    attemptDir(inDir, 'cascivo', '1', {
      usage: null,
      infra: true,
      infraDetail: 'session timed out after 10 min',
    })
    attemptDir(inDir, 'cascivo', '2')
    attemptDir(inDir, 'cascivo', '10', { usage: result, infra: true, infraDetail: 'crashed' })
    attemptDir(inDir, 'shadcn', '1', { usage: { type: 'result', usage: 'many' }, infra: false })

    const records = await scoreAll(inDir, { concurrency: 2 })

    expect(records.map((r) => [r.arm, r.attempt, r.status])).toEqual([
      ['cascivo', 1, 'infra-error'],
      ['cascivo', 2, 'infra-error'],
      ['cascivo', 10, 'infra-error'],
      ['shadcn', 1, 'infra-error'],
    ])
    expect(records[0]).toMatchObject({
      model: 'claude-haiku-5-5',
      task: 'admin-console',
      detail: 'session timed out after 10 min',
      usage: null,
      tscErrors: null,
      axe: null,
      auditErrors: null,
    })
    expect(records[1]?.detail).toMatch(/meta\.json/)
    expect(records[2]?.usage).toMatchObject({ costUsd: 0.25, turns: 3, inputTokens: 10 })
    expect(records[3]?.detail).toMatch(/claude result/)
    expect(records[3]?.usage).toBeNull()
  })

  // Agent code runs during a build (vite.config.ts, PostCSS) with the checkout writable: every
  // EVAL is imported before the first attempt builds, so none can be rewritten before it loads.
  it("imports every planned task's EVAL before scoring, even tasks with no attempt", async () => {
    const inDir = join(root, 'score-all-preload')
    attemptDir(inDir, 'cascivo', '1', { usage: null, infra: true, infraDetail: 'timed out' })
    const loaded: string[] = []
    const records = await scoreAll(
      inDir,
      { concurrency: 1, tasks: [...TASK_IDS] },
      {
        loadEval: async (path) => {
          loaded.push(path)
          return async () => undefined
        },
      },
    )
    expect(records).toHaveLength(1)
    expect(loaded.map((p) => p.split('/').slice(-2).join('/'))).toEqual(
      TASK_IDS.map((id) => `${id}/EVAL.ts`),
    )

    // A planned EVAL that cannot load fails the run before any attempt is scored.
    await expect(
      scoreAll(
        inDir,
        { concurrency: 1, tasks: ['admin-console', 'crud-table'] },
        {
          loadEval: async (path) => {
            if (path.includes('crud-table')) throw new Error('crud-table EVAL is broken')
            return async () => undefined
          },
        },
      ),
    ).rejects.toThrow(/crud-table EVAL is broken/)
    await expect(scoreAll(inDir, { concurrency: 1, tasks: ['no-such-task'] })).rejects.toThrow(
      /Unknown task/,
    )
  })

  it('rejects a directory that is not a published arm', async () => {
    const inDir = join(root, 'score-all-bad-arm')
    attemptDir(inDir, 'blueprints', '1', { usage: null, infra: true })
    await expect(scoreAll(inDir, { concurrency: 1 })).rejects.toThrow(/blueprints/)
  })

  it('rejects an attempt directory that is not a positive integer', async () => {
    const inDir = join(root, 'score-all-bad-attempt')
    attemptDir(inDir, 'cascivo', 'latest', { usage: null, infra: true })
    await expect(scoreAll(inDir, { concurrency: 1 })).rejects.toThrow(/latest/)
  })
})

describe('scoreAttempt', () => {
  const SLOW_MS = 120_000
  let nodeModules = ''

  // The agent's starters link a real install; here a minimal tree carries the two tools scoring
  // runs: this workspace's Vite (vite-plus-core, the build vite-plus ships) and TypeScript.
  beforeAll(() => {
    if (slow) return
    nodeModules = join(root, 'node_modules')
    const vitePlus = realpathSync(join(AGENT_MODULES, 'vite-plus'))
    const vite = dirname(createRequire(join(vitePlus, 'package.json')).resolve('vite/package.json'))
    const typescript = realpathSync(join(AGENT_MODULES, 'typescript'))
    mkdirSync(join(nodeModules, '.bin'), { recursive: true })
    const shim = (name: string, script: string) => {
      const path = join(nodeModules, '.bin', name)
      writeFileSync(path, `#!/bin/sh\nexec node "${script}" "$@"\n`)
      chmodSync(path, 0o755)
    }
    shim('vite', join(vite, 'dist', 'vite', 'node', 'cli.js'))
    shim('tsc', join(typescript, 'bin', 'tsc'))
  })

  const attempt = (fixture: string | null, subdir = '') => {
    const dir = mkdtempSync(join(root, 'attempt-'))
    if (fixture !== null)
      cpSync(join(FIXTURES, 'apps', fixture), join(dir, subdir), { recursive: true })
    return dir
  }

  const score = (attemptDir: string, evalName: string, arm = 'shadcn') =>
    scoreAttempt({
      attemptDir,
      task: task(evalName),
      arm,
      model: 'claude-haiku-5-5',
      attempt: 1,
      nodeModules,
      usage: null,
      infra: false,
    })

  it('scores an infra attempt as infra-error without building', async () => {
    const record = await scoreAttempt({
      attemptDir: attempt(null),
      task: task('throws'),
      arm: 'cascivo',
      model: 'claude-haiku-5-5',
      attempt: 2,
      nodeModules: '/nonexistent',
      usage: null,
      infra: true,
      infraDetail: 'claude exited 1 with no result',
    })
    expect(record).toEqual({
      task: 'admin-console',
      arm: 'cascivo',
      model: 'claude-haiku-5-5',
      attempt: 2,
      status: 'infra-error',
      detail: 'claude exited 1 with no result',
      usage: null,
      tscErrors: null,
      axe: null,
      auditErrors: null,
      auditWarnings: null,
    })
  })

  it('an empty attempt dir is fail-build: no app found', async () => {
    const record = await score(attempt(null), 'visits-two-pages')
    expect(record.status).toBe('fail-build')
    expect(record.detail).toBe('no app found')
    expect(record.tscErrors).toBeNull()
  })

  it(
    'a passing app passes, with axe counts summed over every page the eval visited',
    { skip: slow, timeout: SLOW_MS },
    async () => {
      const record = await score(attempt('pass'), 'visits-two-pages', 'cascivo')
      expect(record.status, record.detail ?? '').toBe('pass')
      expect(record.detail).toBeNull()
      expect(record.tscErrors).toBe(0)
      expect(record.axe).toEqual({ critical: 2, serious: 0, moderate: 0, minor: 0 })
      expect(record.auditErrors).toEqual(expect.any(Number))
      expect(record.auditWarnings).toEqual(expect.any(Number))
    },
  )

  // `/`, its `#/` redirect and an in-page `#details` anchor are one page; `#/about` is another.
  it(
    'scans each page once however many URLs the eval reached it by',
    { skip: slow, timeout: SLOW_MS },
    async () => {
      const record = await score(attempt('hash-router'), 'anchor-and-redirect')
      expect(record.status, record.detail ?? '').toBe('pass')
      expect(record.axe).toEqual({ critical: 2, serious: 0, moderate: 0, minor: 0 })
    },
  )

  it('finds an app in a subdirectory', { skip: slow, timeout: SLOW_MS }, async () => {
    const record = await score(attempt('pass', 'my-app'), 'visits-two-pages')
    expect(record.status, record.detail ?? '').toBe('pass')
    expect(record.auditErrors).toBeNull()
  })

  it('a build-breaking app is fail-build', { skip: slow, timeout: SLOW_MS }, async () => {
    const record = await score(attempt('build-break'), 'visits-two-pages')
    expect(record.status).toBe('fail-build')
    expect(record.detail).toMatch(/vite build failed/)
    expect(record.detail).toMatch(/missing/)
    expect(record.detail?.length).toBeLessThanOrEqual(500)
    expect(record.axe).toBeNull()
  })

  it('a type error is fail-types', { skip: slow, timeout: SLOW_MS }, async () => {
    const record = await score(attempt('type-error'), 'visits-two-pages')
    expect(record.status).toBe('fail-types')
    expect(record.tscErrors).toBe(1)
    expect(record.detail).toMatch(/TS2322/)
  })

  // A Vite starter's tsconfig.json lists no files and only references the real projects, so
  // `tsc -p .` alone checks nothing and every type error would pass.
  it(
    'checks the projects a solution-style tsconfig references',
    { skip: slow, timeout: SLOW_MS },
    async () => {
      const record = await score(attempt('solution-style'), 'visits-two-pages')
      expect(record.status).toBe('fail-types')
      expect(record.tscErrors).toBe(1)
    },
  )

  it(
    'an EVAL that throws is fail-eval with its message',
    { skip: slow, timeout: SLOW_MS },
    async () => {
      const record = await score(attempt('pass'), 'throws')
      expect(record.status).toBe('fail-eval')
      expect(record.detail).toContain('the settings page has no Save button')
      expect(record.axe).toEqual({ critical: 1, serious: 0, moderate: 0, minor: 0 })
    },
  )

  // A blank page fails the EVAL on whatever it looked for first; the crash says why.
  it(
    'a page that throws on load is fail-eval naming the error it threw',
    { skip: slow, timeout: SLOW_MS },
    async () => {
      const record = await score(attempt('crashes'), 'visits-two-pages')
      expect(record.status).toBe('fail-eval')
      expect(record.detail).toMatch(/the page threw: .*must be used within `TooltipProvider`/)
    },
  )

  it(
    'a preview that never listens is fail-eval within the readiness timeout, and is killed',
    { skip: slow, timeout: SLOW_MS },
    async () => {
      const dir = attempt('never-listens')
      const started = Date.now()
      const record = await score(dir, 'visits-two-pages')
      const elapsed = Date.now() - started
      console.log(`never-listening preview scored in ${(elapsed / 1000).toFixed(1)} s`)
      expect(record.status).toBe('fail-eval')
      expect(record.detail).toMatch(/within 30 s/)
      expect(elapsed).toBeLessThan(45_000)
      const pidFile = join(dir, 'preview.pid')
      expect(existsSync(pidFile)).toBe(true)
      expect(await eventuallyStopped(Number(readFileSync(pidFile, 'utf8')))).toBe(true)
    },
  )
})

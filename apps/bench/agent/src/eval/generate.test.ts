import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { generate, type GenerateOptions } from './generate.ts'
import { parseClaudeResult } from '../result.ts'
import type { Starter } from './starters.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const FAKE_BIN = join(HERE, '__fixtures__', 'bin')

let root: string
let template: string
const realPath = process.env['PATH']
const FAKE_VARS = ['FAKE_CLAUDE_MODE', 'FAKE_CLAUDE_COST', 'FAKE_CLAUDE_LOG', 'FAKE_CLAUDE_PIDFILE']

beforeAll(() => {
  chmodSync(join(FAKE_BIN, 'claude'), 0o755)
  process.env['PATH'] = `${FAKE_BIN}:${realPath}`
  root = mkdtempSync(join(tmpdir(), 'generate-test-'))
  template = join(root, 'template')
  mkdirSync(join(template, 'node_modules', 'dep'), { recursive: true })
  writeFileSync(join(template, 'package.json'), '{"name":"starter"}')
  writeFileSync(join(template, 'node_modules', 'dep', 'index.js'), '')
})

afterEach(() => {
  for (const name of FAKE_VARS) delete process.env[name]
})

afterAll(() => {
  process.env['PATH'] = realPath
  rmSync(root, { recursive: true, force: true })
})

// Preparing a starter installs a dependency tree; the tests only need its shape.
const deps = {
  prepareStarter: (): Starter => ({ template, nodeModules: join(root, 'unused') }),
  log: () => {},
}

let counter = 0
const out = () => join(root, `out-${counter++}`)

const base = (outDir: string): GenerateOptions => ({
  outDir,
  models: ['claude-haiku-5-5'],
  arms: ['cascivo-bare'],
  tasks: ['admin-console'],
  attempts: 1,
  maxUsd: 50,
  timeoutMin: 1,
})

const attemptDir = (outDir: string, arm = 'cascivo-bare', n = 1) =>
  join(outDir, 'claude-haiku-5-5', arm, 'admin-console', String(n))

const meta = (dir: string): unknown => JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))

function allFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allFiles(join(dir, e.name)) : [join(dir, e.name)],
  )
}

function allDirNames(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? [e.name, ...allDirNames(join(dir, e.name))] : [],
  )
}

/** A killed process nobody has reaped yet (a zombie, as in a container) is not running. */
function running(pid: number): boolean {
  const state = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], {
    encoding: 'utf8',
  }).stdout.trim()
  return state !== '' && !state.startsWith('Z')
}

describe('generate', () => {
  it('runs one session per attempt and leaves meta, transcript and no node_modules', async () => {
    const outDir = out()
    const result = await generate({ ...base(outDir), attempts: 2 }, deps)

    expect(result.budgetExhausted).toBe(false)
    expect(result.spentUsd).toBeCloseTo(0.2)
    for (const n of [1, 2]) {
      const dir = attemptDir(outDir, 'cascivo-bare', n)
      expect(existsSync(join(dir, 'meta.json'))).toBe(true)
      expect(existsSync(join(dir, 'transcript.jsonl'))).toBe(true)
      // The starter was copied, and so was what the "agent" wrote.
      expect(existsSync(join(dir, 'package.json'))).toBe(true)
      expect(existsSync(join(dir, 'src', 'main.tsx'))).toBe(true)
      expect(allDirNames(dir)).not.toContain('node_modules')
      const m = meta(dir)
      expect(m).toMatchObject({ infra: false })
      expect(m).not.toHaveProperty('infraDetail')
      // Raw result object: scoreAll parses it with parseClaudeResult.
      expect(parseClaudeResult((m as { usage: unknown }).usage)).toMatchObject({
        costUsd: 0.1,
        turns: 3,
      })
    }
    expect(readFileSync(join(attemptDir(outDir), 'transcript.jsonl'), 'utf8')).toContain(
      '"type":"result"',
    )
  })

  it('passes the task, the arm instruction and stream-json, in the attempt directory', async () => {
    const outDir = out()
    const log = join(root, 'args.log')
    process.env['FAKE_CLAUDE_LOG'] = log
    await generate(base(outDir), deps)

    const logged = readFileSync(log, 'utf8')
    expect(logged).toContain(`cwd=${attemptDir(outDir)}`)
    expect(logged).toContain('ARG -p')
    expect(logged).toContain('Use the cascivo design system.')
    expect(logged).toContain('ARG stream-json')
    expect(logged).toContain('ARG claude-haiku-5-5')
    rmSync(log)
  })

  it('removes the node_modules the cascivo arm links for npx, and never copies EVAL or fixtures', async () => {
    const outDir = out()
    await generate(
      { ...base(outDir), arms: ['cascivo'] },
      { ...deps, prepareStarter: () => ({ template: null, nodeModules: '' }) },
    )

    const dir = attemptDir(outDir, 'cascivo')
    expect(existsSync(join(dir, 'src', 'main.tsx'))).toBe(true)
    expect(allDirNames(dir)).not.toContain('node_modules')
    // The link pointed at the checkout's CLI; removing it must not have removed the CLI.
    expect(
      existsSync(join(dirname(HERE), '..', '..', '..', '..', 'packages/cli/bin/cascivo.mjs')),
    ).toBe(true)
  })

  it('never puts an EVAL.ts or fixtures in an attempt directory', async () => {
    const outDir = out()
    await generate({ ...base(outDir), arms: ['cascivo', 'cascivo-bare'], attempts: 2 }, deps)

    expect(allFiles(outDir).filter((f) => f.endsWith('EVAL.ts'))).toEqual([])
    expect(allDirNames(outDir)).not.toContain('fixtures')
  })

  it('orders sessions model, arm, task, attempt', async () => {
    const outDir = out()
    const log = join(root, 'order.log')
    process.env['FAKE_CLAUDE_LOG'] = log
    await generate(
      {
        ...base(outDir),
        models: ['claude-sonnet-5-5', 'claude-haiku-5-5'],
        arms: ['cascivo-bare', 'shadcn'],
        tasks: ['admin-console', 'crud-table'],
        attempts: 2,
      },
      deps,
    )
    const cwds = readFileSync(log, 'utf8')
      .split('\n')
      .filter((l) => l.startsWith('SESSION'))
      .map((l) => l.slice(l.indexOf(outDir) + outDir.length + 1))
    rmSync(log)
    expect(cwds.slice(0, 5)).toEqual([
      'claude-sonnet-5-5/cascivo-bare/admin-console/1',
      'claude-sonnet-5-5/cascivo-bare/admin-console/2',
      'claude-sonnet-5-5/cascivo-bare/crud-table/1',
      'claude-sonnet-5-5/cascivo-bare/crud-table/2',
      'claude-sonnet-5-5/shadcn/admin-console/1',
    ])
    expect(cwds).toHaveLength(16)
    expect(cwds[8]).toBe('claude-haiku-5-5/cascivo-bare/admin-console/1')
  })

  it('records a timeout as infra and kills everything the session started', async () => {
    const outDir = out()
    const pidfile = join(root, 'hang.pid')
    process.env['FAKE_CLAUDE_MODE'] = 'hang'
    process.env['FAKE_CLAUDE_PIDFILE'] = pidfile
    const result = await generate({ ...base(outDir), timeoutMin: 0.05 }, deps)

    const m = meta(attemptDir(outDir)) as { infra: boolean; infraDetail: string; usage: unknown }
    expect(m.infra).toBe(true)
    expect(m.infraDetail).toMatch(/timed out/)
    expect(m.usage).toBeNull()
    expect(result.budgetExhausted).toBe(false)
    const pid = Number(readFileSync(pidfile, 'utf8'))
    expect(running(pid)).toBe(false)
  })

  it('records a crash with no result as infra, with the stderr in the detail', async () => {
    const outDir = out()
    process.env['FAKE_CLAUDE_MODE'] = 'crash'
    await generate(base(outDir), deps)

    const m = meta(attemptDir(outDir)) as { infra: boolean; infraDetail: string }
    expect(m.infra).toBe(true)
    expect(m.infraDetail).toMatch(/exit/)
    expect(m.infraDetail).toMatch(/boom/)
  })

  it('records a finished session without a result line as infra', async () => {
    const outDir = out()
    process.env['FAKE_CLAUDE_MODE'] = 'noresult'
    await generate(base(outDir), deps)
    expect(meta(attemptDir(outDir))).toMatchObject({ infra: true, usage: null })
  })

  it('records a result line the harness cannot parse as infra, not a crash', async () => {
    const outDir = out()
    process.env['FAKE_CLAUDE_MODE'] = 'badresult'
    const result = await generate(base(outDir), deps)
    const m = meta(attemptDir(outDir)) as { infra: boolean; infraDetail: string }
    expect(m.infra).toBe(true)
    expect(m.infraDetail).toMatch(/claude result/)
    expect(result.spentUsd).toBe(0)
  })

  it('trims a long infra detail to DETAIL_MAX', async () => {
    const { DETAIL_MAX } = await import('./results.ts')
    const dir = mkdtempSync(join(tmpdir(), 'long-stderr-'))
    const script = join(dir, 'claude')
    writeFileSync(script, '#!/bin/sh\nhead -c 5000 /dev/zero | tr "\\0" x >&2\nexit 1\n')
    chmodSync(script, 0o755)
    const saved = process.env['PATH']
    process.env['PATH'] = `${dir}:${saved}`
    try {
      const outDir = out()
      await generate(base(outDir), deps)
      const m = meta(attemptDir(outDir)) as { infraDetail: string }
      expect(m.infraDetail.length).toBeLessThanOrEqual(DETAIL_MAX)
    } finally {
      process.env['PATH'] = saved
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('stops before a session once spend reaches the cap', async () => {
    const outDir = out()
    process.env['FAKE_CLAUDE_COST'] = '0.30'
    const result = await generate({ ...base(outDir), attempts: 4, maxUsd: 0.5 }, deps)

    expect(result.budgetExhausted).toBe(true)
    expect(result.spentUsd).toBeCloseTo(0.6)
    expect(existsSync(attemptDir(outDir, 'cascivo-bare', 2))).toBe(true)
    expect(existsSync(attemptDir(outDir, 'cascivo-bare', 3))).toBe(false)
    const run = JSON.parse(readFileSync(join(outDir, 'run.json'), 'utf8')) as Record<
      string,
      unknown
    >
    expect(run).toMatchObject({ budgetExhausted: true, maxUsd: 0.5 })
  })

  it('is not exhausted when the last session ends at the cap', async () => {
    process.env['FAKE_CLAUDE_COST'] = '0.30'
    const result = await generate({ ...base(out()), attempts: 2, maxUsd: 0.6 }, deps)
    expect(result.budgetExhausted).toBe(false)
  })

  it('writes run.json with the metadata and no records', async () => {
    const outDir = out()
    await generate({ ...base(outDir), attempts: 2 }, deps)
    const run = JSON.parse(readFileSync(join(outDir, 'run.json'), 'utf8')) as Record<
      string,
      unknown
    >
    expect(run).toMatchObject({
      schemaVersion: 1,
      models: ['claude-haiku-5-5'],
      arms: ['cascivo-bare'],
      tasks: ['admin-console'],
      attempts: 2,
      maxUsd: 50,
      budgetExhausted: false,
      shadcnVersion: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      cascivoVersion: expect.stringMatching(/^\d+\.\d+\.\d+/),
      commit: expect.stringMatching(/^[0-9a-f]{40}$/),
    })
    expect(run['spentUsd']).toBeCloseTo(0.2)
    expect(new Date(String(run['date'])).toISOString()).toBe(run['date'])
    expect(run).not.toHaveProperty('records')
  })

  it('rejects the unpublished arm and an unknown task before running anything', async () => {
    await expect(generate({ ...base(out()), arms: ['today'] }, deps)).rejects.toThrow(/today/)
    await expect(generate({ ...base(out()), tasks: ['nope'] }, deps)).rejects.toThrow(
      /Unknown task/,
    )
  })
})

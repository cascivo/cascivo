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
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { generate, type GenerateOptions } from './generate.ts'
import { MCP, mcpConfig, REPO } from '../env.ts'
import { ESTIMATED_MAX_SESSION_USD } from '../models.ts'
import { parseClaudeResult } from '../result.ts'
import { SHADCN_VERSION, shadcnMcpConfig, type Starter } from './starters.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const FAKE_BIN = join(HERE, '__fixtures__', 'bin')

let root: string
let template: string
/** The cascivo arm's starter: the plain one plus the AGENTS.md generate preloads. */
let cascivoTemplate: string
const CONTEXT = 'cascivo context: use the layer contract'
const realPath = process.env['PATH']
const FAKE_VARS = [
  'FAKE_CLAUDE_MODE',
  'FAKE_CLAUDE_COST',
  'FAKE_CLAUDE_LOG',
  'FAKE_CLAUDE_PIDFILE',
  'FAKE_CLAUDE_SEQUENCE',
  'FAKE_CLAUDE_COUNTER',
  'FAKE_CLAUDE_WRITE',
  'FAKE_CLAUDE_STDERR',
]

beforeAll(() => {
  chmodSync(join(FAKE_BIN, 'claude'), 0o755)
  process.env['PATH'] = `${FAKE_BIN}:${realPath}`
  root = mkdtempSync(join(tmpdir(), 'generate-test-'))
  template = join(root, 'template')
  mkdirSync(join(template, 'node_modules', 'dep'), { recursive: true })
  writeFileSync(join(template, 'package.json'), '{"name":"starter"}')
  writeFileSync(join(template, 'node_modules', 'dep', 'index.js'), '')
  cascivoTemplate = join(root, 'cascivo-template')
  mkdirSync(cascivoTemplate)
  writeFileSync(join(cascivoTemplate, 'package.json'), '{"name":"starter"}')
  writeFileSync(join(cascivoTemplate, 'AGENTS.md'), CONTEXT)
  writeFileSync(join(cascivoTemplate, 'CLAUDE.md'), '@AGENTS.md')
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
  prepareStarter: (arm: string): Starter => ({
    template: arm === 'cascivo' ? cascivoTemplate : template,
    nodeModules: join(root, 'unused'),
  }),
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

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

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

  // `--bare` skips CLAUDE.md discovery: the cascivo arm gets its AGENTS.md as an adopter's
  // Claude Code would preload it, and no other arm gets any.
  it("appends the cascivo starter's AGENTS.md to the cascivo arm's system prompt only", async () => {
    const outDir = out()
    const log = join(root, 'context.log')
    process.env['FAKE_CLAUDE_LOG'] = log
    await generate({ ...base(outDir), arms: ['cascivo', 'cascivo-bare', 'shadcn'] }, deps)
    const sessions = readFileSync(log, 'utf8').split('SESSION ').slice(1)
    rmSync(log)
    expect(sessions).toHaveLength(3)
    const [cascivo = '', bare = '', shadcn = ''] = sessions
    expect(cascivo).toContain(`cwd=${attemptDir(outDir, 'cascivo')}`)
    const flag = cascivo.split('\n').indexOf('ARG --append-system-prompt-file')
    expect(flag).toBeGreaterThan(-1)
    // Outside the attempt, so the session's own Edit of AGENTS.md cannot reach it.
    const file = cascivo.split('\n')[flag + 1]?.slice('ARG '.length) ?? ''
    expect(file.startsWith(outDir)).toBe(false)
    expect(cascivo).toContain(`\nCONTEXT ${CONTEXT}\n`)
    for (const other of [bare, shadcn]) {
      expect(other).not.toContain('--append-system-prompt')
      expect(other).not.toContain('CONTEXT')
    }
  })

  it('refuses a cascivo starter without AGENTS.md before any session runs', async () => {
    const outDir = out()
    const log = join(root, 'no-context.log')
    process.env['FAKE_CLAUDE_LOG'] = log
    await expect(
      generate(
        { ...base(outDir), arms: ['cascivo-bare', 'cascivo'] },
        {
          ...deps,
          prepareStarter: () => ({ template, nodeModules: '' }),
        },
      ),
    ).rejects.toThrow(/cascivo starter has no AGENTS\.md/)
    expect(existsSync(log)).toBe(false)
  })

  // No arm can list a directory (`--bare --restricted`), so each is told what its starter holds.
  describe('the project file list', () => {
    const header = 'Project files (the working directory):'
    const prompts = (log: string) =>
      readFileSync(log, 'utf8')
        .split('SESSION ')
        .slice(1)
        .map((session) => session.slice(session.indexOf('ARG -p\nARG ') + 'ARG -p\nARG '.length))
        .map((rest) => rest.slice(0, rest.indexOf('\nARG --output-format')))

    it('appends the same sorted list of the starter to every arm', async () => {
      const starter = join(root, 'listed-starter')
      for (const file of [
        'package.json',
        'src/App.tsx',
        'src/a/b.ts',
        'AGENTS.md',
        '.gitignore',
        'node_modules/dep/index.js',
        '.git/HEAD',
        'pnpm-lock.yaml',
        'package-lock.json',
        'yarn.lock',
      ]) {
        mkdirSync(dirname(join(starter, file)), { recursive: true })
        writeFileSync(join(starter, file), '')
      }
      const outDir = out()
      const log = join(root, 'list.log')
      process.env['FAKE_CLAUDE_LOG'] = log
      await generate(
        { ...base(outDir), arms: ['cascivo', 'cascivo-bare', 'shadcn'] },
        { ...deps, prepareStarter: () => ({ template: starter, nodeModules: '' }) },
      )
      const sent = prompts(log)
      rmSync(log)
      expect(sent).toHaveLength(3)
      const list = [header, '.gitignore', 'AGENTS.md', 'package.json', 'src/App.tsx', 'src/a/b.ts']
      for (const prompt of sent) {
        expect(prompt.endsWith(`\n\n${list.join('\n')}`), prompt).toBe(true)
        expect(prompt).not.toMatch(/node_modules|\.git\/|lock|EVAL|fixtures/)
      }
      // Only the design-system line differs between arms.
      const tails = sent.map((p) => p.slice(p.indexOf(header)))
      expect(new Set(tails).size).toBe(1)
    })

    it('stops at 200 files and says how many it left out', async () => {
      const starter = join(root, 'big-starter')
      mkdirSync(join(starter, 'src'), { recursive: true })
      for (let i = 0; i < 205; i += 1)
        writeFileSync(join(starter, 'src', `f${String(i).padStart(3, '0')}.ts`), '')
      const outDir = out()
      const log = join(root, 'big.log')
      process.env['FAKE_CLAUDE_LOG'] = log
      await generate(base(outDir), {
        ...deps,
        prepareStarter: () => ({ template: starter, nodeModules: '' }),
      })
      const [prompt = ''] = prompts(log)
      rmSync(log)
      const lines = prompt.slice(prompt.indexOf(header)).split('\n')
      expect(lines).toHaveLength(1 + 200 + 1)
      expect(lines[200]).toBe('src/f199.ts')
      expect(lines[201]).toBe('…and 5 more')
    })
  })

  it('leaves no node_modules in a cascivo attempt', async () => {
    const outDir = out()
    await generate({ ...base(outDir), arms: ['cascivo'] }, deps)

    const dir = attemptDir(outDir, 'cascivo')
    expect(existsSync(join(dir, 'src', 'main.tsx'))).toBe(true)
    expect(allDirNames(dir)).not.toContain('node_modules')
  })

  // The checkout's CLI is code the cascivo tools run: a session that writes under its own
  // node_modules must not reach it through a link.
  it('links nothing out of a cascivo attempt, so a write under node_modules stays inside', async () => {
    const outDir = out()
    const name = `written-by-session-${process.pid}-${counter}`
    const cli = join(REPO, 'packages', 'cli')
    process.env['FAKE_CLAUDE_WRITE'] = join('node_modules', 'cascivo', name)
    try {
      await generate({ ...base(outDir), arms: ['cascivo'] }, deps)
      expect(existsSync(join(cli, name))).toBe(false)
    } finally {
      rmSync(join(cli, name), { force: true })
    }
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
    // No parseable result means no known cost, so the session is charged an estimate.
    expect(result.spentUsd).toBe(ESTIMATED_MAX_SESSION_USD['claude-haiku-5-5'])
  })

  it('trims a long crash detail to DETAIL_MAX, keeping the end of stderr', async () => {
    const { DETAIL_MAX } = await import('./results.ts')
    const dir = mkdtempSync(join(tmpdir(), 'long-stderr-'))
    const script = join(dir, 'claude')
    writeFileSync(
      script,
      '#!/bin/sh\necho START-MARKER >&2\nhead -c 5000 /dev/zero | tr "\\0" x >&2\necho END-MARKER >&2\nexit 1\n',
    )
    chmodSync(script, 0o755)
    const saved = process.env['PATH']
    process.env['PATH'] = `${dir}:${saved}`
    try {
      const outDir = out()
      await generate(base(outDir), deps)
      const m = meta(attemptDir(outDir)) as { infraDetail: string }
      expect(m.infraDetail.length).toBeLessThanOrEqual(DETAIL_MAX)
      expect(m.infraDetail).toContain('END-MARKER')
      expect(m.infraDetail).not.toContain('START-MARKER')
    } finally {
      process.env['PATH'] = saved
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('records an API error result as infra and still charges its cost', async () => {
    const outDir = out()
    process.env['FAKE_CLAUDE_MODE'] = 'apierror'
    process.env['FAKE_CLAUDE_COST'] = '0.05'
    const result = await generate(base(outDir), deps)

    const m = meta(attemptDir(outDir)) as { infra: boolean; infraDetail: string; usage: unknown }
    expect(m.infra).toBe(true)
    expect(m.infraDetail).toContain('API Error: 529 overloaded')
    expect(m.infraDetail).toContain('error_during_execution')
    expect(parseClaudeResult(m.usage).costUsd).toBe(0.05)
    expect(result.spentUsd).toBeCloseTo(0.05)
  })

  describe('a session with no result is charged an estimate', () => {
    const sequence = (modes: string) => {
      process.env['FAKE_CLAUDE_SEQUENCE'] = modes
      process.env['FAKE_CLAUDE_COUNTER'] = join(root, `counter-${counter}`)
    }

    it('uses the highest cost seen for that model, and the cap counts it', async () => {
      const outDir = out()
      sequence('normal,hang,normal')
      process.env['FAKE_CLAUDE_COST'] = '0.30'
      const result = await generate(
        { ...base(outDir), attempts: 3, maxUsd: 0.5, timeoutMin: 0.02 },
        deps,
      )

      // 0.30 real + 0.30 estimated reaches the cap, so the third session never starts.
      expect(result.spentUsd).toBeCloseTo(0.6)
      expect(result.budgetExhausted).toBe(true)
      expect(existsSync(attemptDir(outDir, 'cascivo-bare', 3))).toBe(false)
      const m = meta(attemptDir(outDir, 'cascivo-bare', 2)) as { infraDetail: string }
      expect(m.infraDetail).toMatch(/timed out/)
      expect(m.infraDetail).toContain('(cost estimated at $0.30)')
    })

    it('falls back to the highest cost of any model, then to the per-model ceiling', async () => {
      const outDir = out()
      sequence('normal,hang')
      process.env['FAKE_CLAUDE_COST'] = '0.30'
      const lines: string[] = []
      const result = await generate(
        {
          ...base(outDir),
          models: ['claude-sonnet-5-5', 'claude-haiku-5-5'],
          timeoutMin: 0.02,
        },
        { ...deps, log: (l) => lines.push(l) },
      )
      expect(result.spentUsd).toBeCloseTo(0.6)
      expect(lines.join('\n')).toContain('cost estimated at $0.30')

      const first = out()
      sequence('hang')
      const cold = await generate(
        { ...base(first), models: ['claude-haiku-5-5'], timeoutMin: 0.02 },
        deps,
      )
      expect(cold.spentUsd).toBe(ESTIMATED_MAX_SESSION_USD['claude-haiku-5-5'])
    })

    it('charges a crash too, and fits the estimate inside DETAIL_MAX', async () => {
      const { DETAIL_MAX } = await import('./results.ts')
      const outDir = out()
      sequence('normal,crash')
      process.env['FAKE_CLAUDE_COST'] = '0.30'
      const result = await generate({ ...base(outDir), attempts: 2 }, deps)
      expect(result.spentUsd).toBeCloseTo(0.6)
      const m = meta(attemptDir(outDir, 'cascivo-bare', 2)) as { infraDetail: string }
      expect(m.infraDetail.length).toBeLessThanOrEqual(DETAIL_MAX)
      expect(m.infraDetail).toMatch(/estimated at \$0\.30\)$/)
    })
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

  it('writes run.json after every session, so an aborted run keeps its spend', async () => {
    const outDir = out()
    const seen: unknown[] = []
    await generate(
      { ...base(outDir), attempts: 2 },
      {
        ...deps,
        log: () => {
          const run: unknown = JSON.parse(readFileSync(join(outDir, 'run.json'), 'utf8'))
          seen.push(isRecord(run) ? run['spentUsd'] : undefined)
        },
      },
    )
    expect(seen).toEqual([0.1, 0.2])
  })

  it('refuses an output directory that already holds files', async () => {
    const outDir = out()
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'stale.txt'), '')
    await expect(generate(base(outDir), deps)).rejects.toThrow(/not empty/)
    // An existing empty directory is fine.
    const empty = out()
    mkdirSync(empty, { recursive: true })
    await expect(generate(base(empty), deps)).resolves.toBeDefined()
  })

  it('does not hold the process open through a process that escaped the session', async (ctx) => {
    if (spawnSync('which', ['setsid']).status !== 0) return ctx.skip()
    const outDir = out()
    const pidfile = join(root, 'escape.pid')
    const script = join(root, 'escape-run.mjs')
    writeFileSync(
      script,
      `import { generate } from ${JSON.stringify(new URL('./generate.ts', import.meta.url).href)}
await generate(${JSON.stringify(base(outDir))}, {
  prepareStarter: () => ({ template: null, nodeModules: '' }),
  log: () => {},
})
`,
    )
    try {
      const ran = spawnSync(process.execPath, [script], {
        encoding: 'utf8',
        timeout: 20_000,
        env: {
          ...process.env,
          FAKE_CLAUDE_MODE: 'escape',
          FAKE_CLAUDE_PIDFILE: pidfile,
        },
      })
      // A process held open by the escaped child's pipes would be killed by the timeout instead.
      expect(ran.error).toBeUndefined()
      expect(ran.status, ran.stderr).toBe(0)
    } finally {
      if (existsSync(pidfile)) {
        try {
          process.kill(Number(readFileSync(pidfile, 'utf8')), 'SIGKILL')
        } catch {
          // Already gone.
        }
      }
    }
  })

  it('rejects a model, arm or task listed twice before running anything', async () => {
    for (const over of [
      { models: ['claude-haiku-5-5', 'claude-haiku-5-5'] },
      { arms: ['cascivo-bare', 'cascivo-bare'] as GenerateOptions['arms'] },
      { tasks: ['admin-console', 'admin-console'] },
    ]) {
      const outDir = out()
      await expect(generate({ ...base(outDir), ...over }, deps)).rejects.toThrow(/twice/)
      expect(existsSync(outDir)).toBe(false)
    }
  })

  it('rejects the unpublished arm and an unknown task before running anything', async () => {
    await expect(generate({ ...base(out()), arms: ['today'] }, deps)).rejects.toThrow(/today/)
    await expect(generate({ ...base(out()), tasks: ['nope'] }, deps)).rejects.toThrow(
      /Unknown task/,
    )
  })
})

// The transcripts are uploaded as a workflow artifact anyone with read access can download.
describe('a session output that holds the API key', () => {
  const key = `sk-ant-test-${'k'.repeat(32)}`
  let saved: string | undefined
  beforeEach(() => {
    saved = process.env['ANTHROPIC_API_KEY']
    process.env['ANTHROPIC_API_KEY'] = key
  })
  afterEach(() => {
    if (saved === undefined) delete process.env['ANTHROPIC_API_KEY']
    else process.env['ANTHROPIC_API_KEY'] = saved
  })

  const holdingKey = (dir: string) => allFiles(dir).filter((f) => readFileSync(f).includes(key))
  const failure = (run: Promise<unknown>): Promise<Error> =>
    run.then(
      () => {
        throw new Error('expected generate to abort')
      },
      (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
    )

  it('aborts the run and keeps only a meta.json that says why', async () => {
    const outDir = out()
    process.env['FAKE_CLAUDE_MODE'] = 'leak'
    const lines: string[] = []
    const error = await failure(
      generate({ ...base(outDir), attempts: 2 }, { ...deps, log: (l) => lines.push(l) }),
    )

    expect(error.message).toMatch(/secret found in output/)
    expect(error.message).not.toContain(key)
    expect(lines.join('\n')).not.toContain(key)
    const dir = attemptDir(outDir)
    expect(readdirSync(dir)).toEqual(['meta.json'])
    expect(meta(dir)).toEqual({ usage: null, infra: true, infraDetail: 'secret found in output' })
    expect(holdingKey(outDir)).toEqual([])
    // No session starts after it, and the spend so far is kept.
    expect(existsSync(attemptDir(outDir, 'cascivo-bare', 2))).toBe(false)
    const run: unknown = JSON.parse(readFileSync(join(outDir, 'run.json'), 'utf8'))
    expect(isRecord(run) ? run['spentUsd'] : undefined).toBeCloseTo(0.1)
  })

  it('also catches the key in what the harness wrote from stderr', async () => {
    const outDir = out()
    process.env['FAKE_CLAUDE_MODE'] = 'crash'
    process.env['FAKE_CLAUDE_STDERR'] = `env dump ${key}`
    const error = await failure(generate(base(outDir), deps))
    expect(error.message).toMatch(/secret found in output/)
    expect(holdingKey(outDir)).toEqual([])
  })

  it('leaves a session that never printed the key alone', async () => {
    const outDir = out()
    await generate(base(outDir), deps)
    expect(existsSync(join(attemptDir(outDir), 'transcript.jsonl'))).toBe(true)
    expect(meta(attemptDir(outDir))).toMatchObject({ infra: false })
  })
})

// The key is for the claude session alone: an MCP server (and anything it spawns, as
// `npx cascivo` and `npx shadcn` do) has no use for it, and agent-written code can reach both.
describe('MCP configs', () => {
  const strip = ['-u', 'ANTHROPIC_API_KEY']

  it('launch the cascivo server and the pinned shadcn server without the API key', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mcp-config-'))
    try {
      const cascivo: unknown = JSON.parse(readFileSync(mcpConfig(join(dir, 'c.json')), 'utf8'))
      const shadcn: unknown = JSON.parse(readFileSync(shadcnMcpConfig(join(dir, 's.json')), 'utf8'))
      expect(cascivo).toMatchObject({
        mcpServers: { cascivo: { command: 'env', args: [...strip, 'node', MCP] } },
      })
      expect(shadcn).toMatchObject({
        mcpServers: {
          shadcn: {
            command: 'env',
            // A harness prefix: npx would otherwise run a `shadcn` the agent wrote into its
            // own node_modules whenever the CLI restarts the server.
            args: [
              ...strip,
              'npx',
              '--prefix',
              dir,
              '-y',
              `shadcn@${SHADCN_VERSION}`,
              'mcp',
              '--cwd',
              dir,
            ],
          },
        },
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('actually remove the key from the server process', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mcp-config-run-'))
    try {
      const parsed: unknown = JSON.parse(readFileSync(mcpConfig(join(dir, 'c.json')), 'utf8'))
      const server =
        isRecord(parsed) && isRecord(parsed['mcpServers']) ? parsed['mcpServers']['cascivo'] : null
      if (
        !isRecord(server) ||
        typeof server['command'] !== 'string' ||
        !Array.isArray(server['args'])
      )
        throw new Error('unexpected config')
      // Same launcher, a different program: `node -p` instead of the MCP server.
      const args = server['args']
        .slice(0, -2)
        .concat(['node', '-p', 'String(process.env.ANTHROPIC_API_KEY)'])
      const ran = spawnSync(server['command'], args, {
        encoding: 'utf8',
        env: { ...process.env, ANTHROPIC_API_KEY: 'sk-secret' },
      })
      expect(ran.stdout.trim()).toBe('undefined')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

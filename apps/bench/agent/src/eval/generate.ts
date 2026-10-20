/**
 * The generate phase (spec §2, §6): one headless `claude -p` session per model × arm × task ×
 * attempt, run sequentially so the spend cap is checked before each one. Nothing here builds,
 * installs or executes what a session wrote; scoring is a separate job that never sees the key.
 *
 * Layout, which `scoreAll` walks: `<outDir>/<model>/<arm>/<task>/<attempt>/` holds the app, the
 * `transcript.jsonl` and a `meta.json` of `{ usage, infra, infraDetail? }`, and `<outDir>/run.json`
 * holds the run's metadata.
 */
import { execFileSync, spawn } from 'node:child_process'
import {
  cpSync,
  createWriteStream,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { stripVTControlCharacters } from 'node:util'
import { claudeArgs, PUBLISHED_ARMS, type ArmId, type PublishedArmId } from '../arms.ts'
import { mcpConfig, REPO, runDirectory } from '../env.ts'
import { ESTIMATED_MAX_SESSION_USD } from '../models.ts'
import { instructionsFor } from '../prompts.ts'
import { parseClaudeResult, type AgentUsage } from '../result.ts'
import { DETAIL_MAX, SCHEMA_VERSION, type EvalRun } from './results.ts'
import { prepareStarter, SHADCN_VERSION, shadcnMcpConfig, type Starter } from './starters.ts'
import { loadTasks } from './tasks.ts'

export interface GenerateOptions {
  outDir: string
  models: string[]
  arms: ArmId[]
  tasks: string[]
  attempts: number
  /** No session starts once total spend has reached this. */
  maxUsd: number
  /** Minutes before a session is killed and recorded as an infra error. */
  timeoutMin: number
}

/** Replaceable so the tests need neither an installed starter nor the network. */
export interface GenerateDeps {
  prepareStarter: (arm: PublishedArmId, log: (line: string) => void) => Starter
  log: (line: string) => void
}

/** A stderr tail is enough to say why a session died; a runaway one must not fill memory. */
const STDERR_MAX = 8192
/** One transcript line (an assistant message or a tool result) can be large, but not this large. */
const LINE_MAX = 32 << 20
/** How long a session's pipes may stay open after it exits, held by a stray child. */
const GRACE_MS = 2000

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isPublishedArm = (arm: string): arm is PublishedArmId =>
  (PUBLISHED_ARMS as readonly string[]).includes(arm)

/**
 * A detail of at most DETAIL_MAX characters: `head`, then `tail` (a tool's output, cut to fit),
 * then `suffix`. The end of an error's output is the part that says why, so a long tail loses
 * its start, unless `keep` is 'start' (an API error message reads from its first words).
 */
function detail(head: string, tail = '', suffix = '', keep: 'start' | 'end' = 'end'): string {
  const room = Math.max(0, DETAIL_MAX - head.length - suffix.length)
  let body = stripVTControlCharacters(tail).trim()
  if (body.length > room)
    body = keep === 'end' ? `…${body.slice(body.length - room + 1)}` : `${body.slice(0, room - 1)}…`
  return `${head}${body}${suffix}`.slice(0, DETAIL_MAX)
}

interface Session {
  code: number | null
  timedOut: boolean
  /** The process never started (e.g. no `claude` on PATH). */
  spawnError: NodeJS.ErrnoException | null
  stderr: string
  /** The last transcript line whose JSON has `type === 'result'`, unparsed beyond that. */
  result: unknown
}

function killGroup(pid: number | undefined): void {
  if (pid === undefined) return
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    // Already gone.
  }
}

/**
 * Run `claude` with its stdout streamed to `transcript`. Spawned as a group leader so a timeout
 * takes the MCP servers and tool processes it started down with it, not just the CLI.
 */
async function runSession(
  args: string[],
  cwd: string,
  transcript: string,
  timeoutMs: number,
): Promise<Session> {
  const out = createWriteStream(transcript)
  let writeError: Error | null = null
  out.on('error', (error) => {
    writeError = error
  })
  const session: Session = {
    code: null,
    timedOut: false,
    spawnError: null,
    stderr: '',
    result: null,
  }
  const child = spawn('claude', args, { cwd, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const decoder = new StringDecoder('utf8')
  let pending = ''
  const scan = (line: string) => {
    if (!/"type"\s*:\s*"result"/.test(line)) return
    try {
      const parsed: unknown = JSON.parse(line)
      if (isRecord(parsed) && parsed['type'] === 'result') session.result = parsed
    } catch {
      // Not a JSON line; the transcript keeps it as is.
    }
  }
  child.stdout.on('data', (chunk: Buffer) => {
    out.write(chunk)
    const lines = (pending + decoder.write(chunk)).split('\n')
    pending = lines.pop() ?? ''
    // Dropping an oversize partial line leaves a fragment that scan() rejects.
    if (pending.length > LINE_MAX) pending = ''
    for (const line of lines) scan(line)
  })
  child.stderr.on('data', (chunk: Buffer) => {
    session.stderr = (session.stderr + chunk.toString()).slice(-STDERR_MAX)
  })

  try {
    await new Promise<void>((done) => {
      let grace: NodeJS.Timeout | undefined
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        clearTimeout(timer)
        clearTimeout(grace)
        done()
      }
      const timer = setTimeout(() => {
        session.timedOut = true
        killGroup(child.pid)
        finish()
      }, timeoutMs)
      child.on('error', (error: NodeJS.ErrnoException) => {
        session.spawnError = error
        finish()
      })
      child.on('exit', (code) => {
        session.code = code
        // A process left in the group can hold the pipes open, and 'close' would wait for it.
        killGroup(child.pid)
        grace = setTimeout(finish, GRACE_MS)
        child.on('close', finish)
      })
    })
  } finally {
    killGroup(child.pid)
    // A process that left the group (its own session) can keep these pipes, and with them this
    // process, alive for as long as it runs.
    child.stdout.destroy()
    child.stderr.destroy()
  }
  scan(pending + decoder.end())
  await new Promise<void>((done) => out.end(done))
  if (writeError !== null) throw writeError
  return session
}

interface Meta {
  usage: unknown
  infra: boolean
  infraDetail?: string
}

/** Why a session is an infra error, in pieces so the caller can fit a note after them. */
interface Failure {
  head: string
  tail: string
  keep: 'start' | 'end'
}

interface Judged {
  /** The CLI's own result object when there was one: the score job parses it again. */
  usage: unknown
  failure: Failure | null
  /** What the session cost, or null when it left no result to say (the caller estimates it). */
  costUsd: number | null
}

/** What a finished session means for scoring, and what it cost. */
function judge(session: Session, timeoutMin: number): Judged {
  const infra = (head: string, tail = '', keep: 'start' | 'end' = 'end'): Judged => ({
    usage: null,
    failure: { head, tail, keep },
    costUsd: null,
  })
  if (session.spawnError !== null) {
    // Never started, so nothing was spent.
    return {
      ...infra(`claude did not start: ${session.spawnError.message}`),
      costUsd: 0,
    }
  }
  if (session.timedOut) return infra(`session timed out after ${timeoutMin} min`)
  if (session.result === null) {
    const why = session.code === null ? 'was killed' : `exited with code ${session.code}`
    return infra(`claude ${why} without a result line: `, session.stderr)
  }
  let usage: AgentUsage
  try {
    usage = parseClaudeResult(session.result)
  } catch (error) {
    return infra(error instanceof Error ? error.message : String(error))
  }
  if (!usage.failed) return { usage: session.result, failure: null, costUsd: usage.costUsd }
  // An API or CLI failure (overload, auth, the turn limit) says nothing about the model, but it
  // was billed.
  const subtype = isRecord(session.result) ? session.result['subtype'] : undefined
  const text = isRecord(session.result) ? session.result['result'] : undefined
  return {
    usage: session.result,
    failure: {
      head: `claude reported ${typeof subtype === 'string' ? subtype : 'an error'}: `,
      tail: typeof text === 'string' ? text : '',
      keep: 'start',
    },
    costUsd: usage.costUsd,
  }
}

/**
 * What a session with no result is charged. The CLI reports cost only in its result line, so a
 * timeout or crash spends money nobody can see; the cap must not ignore it (spec §6).
 */
class CostEstimator {
  private byModel = new Map<string, number>()
  private overall = 0

  observe(model: string, costUsd: number): void {
    this.byModel.set(model, Math.max(this.byModel.get(model) ?? 0, costUsd))
    this.overall = Math.max(this.overall, costUsd)
  }

  /** The highest cost seen for the model, else for any model, else the model's ceiling. */
  estimate(model: string): number {
    const own = this.byModel.get(model) ?? 0
    if (own > 0) return own
    if (this.overall > 0) return this.overall
    const ceiling = (ESTIMATED_MAX_SESSION_USD as Record<string, number | undefined>)[model]
    return ceiling ?? Math.max(...Object.values(ESTIMATED_MAX_SESSION_USD))
  }
}

/** Every `node_modules` under `dir`, links included, without following any of them. */
function removeNodeModules(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.name === 'node_modules') rmSync(path, { recursive: true, force: true })
    else if (entry.isDirectory()) removeNodeModules(path)
  }
}

function cascivoVersion(): string {
  const manifest: unknown = JSON.parse(
    readFileSync(join(REPO, 'packages/react/package.json'), 'utf8'),
  )
  const version = isRecord(manifest) ? manifest['version'] : undefined
  if (typeof version !== 'string') throw new Error('packages/react/package.json has no version')
  return version
}

const commit = (): string =>
  execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()

function validate(opts: GenerateOptions): PublishedArmId[] {
  const arms = opts.arms.map((arm) => {
    if (!isPublishedArm(arm)) throw new Error(`arm ${arm} is not published; use ${PUBLISHED_ARMS}`)
    return arm
  })
  // Model ids become directory names.
  for (const model of opts.models) {
    if (!/^[A-Za-z0-9][\w.-]*$/.test(model)) throw new Error(`invalid model id "${model}"`)
  }
  if (!Number.isInteger(opts.attempts) || opts.attempts < 1)
    throw new Error('attempts must be a positive integer')
  if (!Number.isFinite(opts.maxUsd) || opts.maxUsd <= 0)
    throw new Error('maxUsd must be a positive number')
  if (!Number.isFinite(opts.timeoutMin) || opts.timeoutMin <= 0)
    throw new Error('timeoutMin must be a positive number')
  return arms
}

/** Throws unless `dir` is missing or empty: stale attempts must not mix with a new run.json. */
export function assertFreshOutDir(dir: string): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch (error) {
    if (isRecord(error) && error['code'] === 'ENOENT') return
    throw error
  }
  if (entries.length > 0) throw new Error(`${dir} is not empty: use a new output directory`)
}

export async function generate(
  opts: GenerateOptions,
  deps: Partial<GenerateDeps> = {},
): Promise<{ spentUsd: number; budgetExhausted: boolean }> {
  const log = deps.log ?? ((line: string) => process.stdout.write(`${line}\n`))
  const prepare = deps.prepareStarter ?? prepareStarter
  const arms = validate(opts)
  const tasks = loadTasks(opts.tasks)
  assertFreshOutDir(opts.outDir)

  // Prepared up front: an arm that cannot start fails the run before any money is spent.
  const starters = new Map<PublishedArmId, Starter>()
  for (const arm of arms) starters.set(arm, prepare(arm, log))

  // Outside outDir: that directory is uploaded and walked as `<model>/<arm>/…` only.
  const configDir = mkdtempSync(join(tmpdir(), 'eval-mcp-'))
  const configs: Record<PublishedArmId, string | null> = {
    cascivo: mcpConfig(join(configDir, 'cascivo.json')),
    'cascivo-bare': null,
    shadcn: shadcnMcpConfig(join(configDir, 'shadcn.json')),
  }

  mkdirSync(opts.outDir, { recursive: true })
  let spentUsd = 0
  let budgetExhausted = false
  const costs = new CostEstimator()
  const date = new Date().toISOString()
  const version = cascivoVersion()
  const sha = commit()
  // Written after every session: a run that dies midway keeps its spend record.
  const writeRun = () => {
    const run: Omit<EvalRun, 'records'> = {
      schemaVersion: SCHEMA_VERSION,
      date,
      cascivoVersion: version,
      commit: sha,
      models: opts.models,
      arms,
      tasks: tasks.map((t) => t.id),
      attempts: opts.attempts,
      maxUsd: opts.maxUsd,
      spentUsd,
      budgetExhausted,
      shadcnVersion: SHADCN_VERSION,
    }
    writeFileSync(join(opts.outDir, 'run.json'), `${JSON.stringify(run, null, 2)}\n`)
  }
  try {
    sessions: for (const model of opts.models) {
      for (const arm of arms) {
        const starter = starters.get(arm)
        if (starter === undefined) continue
        for (const task of tasks) {
          for (let attempt = 1; attempt <= opts.attempts; attempt += 1) {
            if (spentUsd >= opts.maxUsd) {
              budgetExhausted = true
              break sessions
            }
            const taskDir = join(opts.outDir, model, arm, task.id)
            const dir = join(taskDir, String(attempt))
            rmSync(dir, { recursive: true, force: true })
            // The cascivo arm's MCP server runs `npx cascivo`, which must find this checkout's CLI.
            if (arm === 'cascivo') runDirectory(taskDir, String(attempt))
            else mkdirSync(dir, { recursive: true })
            if (starter.template !== null) {
              cpSync(starter.template, dir, {
                recursive: true,
                filter: (src) => basename(src) !== 'node_modules',
              })
            }

            const args = [
              '-p',
              `${task.prompt}\n\n${instructionsFor(arm)}`,
              ...claudeArgs(arm, configs[arm], model, { stream: true }),
            ]
            let session: Session
            try {
              session = await runSession(
                args,
                dir,
                join(dir, 'transcript.jsonl'),
                opts.timeoutMin * 60_000,
              )
            } finally {
              removeNodeModules(dir)
            }
            // No `claude` binary is the harness's fault; recording it as 48 infra errors would hide that.
            if (session.spawnError?.code === 'ENOENT')
              throw new Error('`claude` is not on PATH: install Claude Code first')
            const judged = judge(session, opts.timeoutMin)
            let costUsd = judged.costUsd
            let note = ''
            if (costUsd === null) {
              costUsd = costs.estimate(model)
              note = ` (cost estimated at $${costUsd.toFixed(2)})`
            } else {
              costs.observe(model, costUsd)
            }
            const { failure } = judged
            const meta: Meta = {
              usage: judged.usage,
              infra: failure !== null,
              ...(failure === null
                ? {}
                : { infraDetail: detail(failure.head, failure.tail, note, failure.keep) }),
            }
            writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
            spentUsd += costUsd
            writeRun()
            log(
              `${model} ${arm} ${task.id} #${attempt}: ` +
                (meta.infra ? `infra (${meta.infraDetail})` : `$${costUsd.toFixed(2)}`) +
                `, total $${spentUsd.toFixed(2)} of $${opts.maxUsd}`,
            )
          }
        }
      }
    }
  } finally {
    rmSync(configDir, { recursive: true, force: true })
  }

  writeRun()
  return { spentUsd, budgetExhausted }
}

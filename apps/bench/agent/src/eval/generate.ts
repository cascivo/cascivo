/**
 * The generate phase (spec §2, §6): one headless `claude -p` session per model × arm × task ×
 * attempt, run sequentially so the spend cap is checked before each one. Nothing here builds,
 * installs or executes what a session wrote; scoring is a separate job that never sees the key.
 * A session whose output holds the key aborts the run (its directory is uploaded as an artifact).
 *
 * The cascivo arm also gets its scaffold's `AGENTS.md` appended to the system prompt, from a copy
 * outside the attempt (see cascivoContext).
 *
 * Layout, which `scoreAll` walks: `<outDir>/<model>/<arm>/<task>/<attempt>/` holds the app, the
 * `transcript.jsonl` and a `meta.json` of `{ usage, infra, infraDetail? }`, and `<outDir>/run.json`
 * holds the run's metadata.
 */
import { execFileSync, spawn } from 'node:child_process'
import {
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, relative } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { stripVTControlCharacters } from 'node:util'
import { claudeArgs, PUBLISHED_ARMS, type ArmId, type PublishedArmId } from '../arms.ts'
import { mcpConfig, REPO } from '../env.ts'
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

/** Lockfiles say nothing about the app, and the shadcn starter's would fill the list. */
const LOCKFILES = new Set([
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
])
const FILE_LIST_MAX = 200

/** Paths of the files under `dir`, relative to `root`, without node_modules, .git or lockfiles. */
function starterFiles(root: string, dir = root): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.name === 'node_modules' || entry.name === '.git') return []
    if (entry.isDirectory()) return starterFiles(root, path)
    return LOCKFILES.has(entry.name) ? [] : [relative(root, path)]
  })
}

/**
 * The prompt's last block, worded the same for every arm. Sessions cannot list a directory
 * (`--bare --restricted` leave only Read and Edit), so each is told what its starter holds.
 */
function projectFiles(template: string | null): string {
  const files = template === null ? [] : starterFiles(template).sort()
  const shown = files.slice(0, FILE_LIST_MAX)
  return [
    'Project files (the working directory):',
    ...shown,
    ...(files.length > shown.length ? [`…and ${files.length - shown.length} more`] : []),
  ].join('\n')
}

/** What an attempt's meta.json says when its output held the API key. */
const SECRET_FOUND = 'secret found in output'

/**
 * Whether any file under `dir` holds `secret`: its bytes, its name, or a link's target. Links
 * are not followed: what they point at is not uploaded with the directory.
 */
function holdsSecret(dir: string, secret: string): boolean {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.name.includes(secret)) return true
    if (entry.isSymbolicLink()) {
      if (readlinkSync(path).includes(secret)) return true
    } else if (entry.isDirectory()) {
      if (holdsSecret(path, secret)) return true
    } else if (entry.isFile() && readFileSync(path).includes(secret)) return true
  }
  return false
}

/** Every `node_modules` under `dir`, links included, without following any of them. */
function removeNodeModules(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.name === 'node_modules') rmSync(path, { recursive: true, force: true })
    else if (entry.isDirectory()) removeNodeModules(path)
  }
}

/**
 * The cascivo arm's AI context as an adopter's Claude Code loads it: the scaffold's `CLAUDE.md`
 * is `@AGENTS.md`, which the CLI expands into the system prompt. `--bare` skips that discovery,
 * so the harness appends the same text itself (`--append-system-prompt-file`). cascivo-bare's
 * starter has neither file, and shadcn's has no context of this kind.
 */
function cascivoContext(starter: Starter | undefined): string {
  const file = starter?.template == null ? null : join(starter.template, 'AGENTS.md')
  if (file === null || !existsSync(file))
    throw new Error('the cascivo starter has no AGENTS.md: its AI context would be missing')
  return readFileSync(file, 'utf8')
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
  // A repeated id would be run and paid for twice, and weighted twice in the headline.
  const lists: [string, readonly string[]][] = [
    ['models', opts.models],
    ['arms', opts.arms],
    ['tasks', opts.tasks],
  ]
  for (const [name, ids] of lists) {
    const twice = ids.find((id, i) => ids.indexOf(id) !== i)
    if (twice !== undefined) throw new Error(`${name} lists ${twice} twice`)
  }
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
  const secret = process.env['ANTHROPIC_API_KEY']
  assertFreshOutDir(opts.outDir)

  // Prepared up front: an arm that cannot start fails the run before any money is spent.
  const starters = new Map<PublishedArmId, Starter>()
  for (const arm of arms) starters.set(arm, prepare(arm, log))
  const fileLists = new Map(
    arms.map((arm) => [arm, projectFiles(starters.get(arm)?.template ?? null)]),
  )

  // Read before any directory is made, so a starter without it fails the run with nothing to clean.
  const context = arms.includes('cascivo') ? cascivoContext(starters.get('cascivo')) : null

  // Outside outDir: that directory is uploaded and walked as `<model>/<arm>/…` only.
  const configDir = mkdtempSync(join(tmpdir(), 'eval-mcp-'))
  const configs: Record<PublishedArmId, string | null> = {
    cascivo: mcpConfig(join(configDir, 'cascivo.json')),
    'cascivo-bare': null,
    shadcn: shadcnMcpConfig(join(configDir, 'shadcn.json')),
  }
  // A copy outside every attempt: `--restricted` keeps a session's Read and Edit inside its own
  // directory, so no session can change what a later one is told.
  const contextFile = join(configDir, 'cascivo-AGENTS.md')
  if (context !== null) writeFileSync(contextFile, context)

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
            const dir = join(opts.outDir, model, arm, task.id, String(attempt))
            rmSync(dir, { recursive: true, force: true })
            // Nothing is linked in: no tool a session may call runs `npx cascivo`, and a link
            // would let the session's writes reach the checkout's code.
            mkdirSync(dir, { recursive: true })
            if (starter.template !== null) {
              cpSync(starter.template, dir, {
                recursive: true,
                filter: (src) => basename(src) !== 'node_modules',
              })
            }

            const args = [
              '-p',
              `${task.prompt}\n\n${instructionsFor(arm)}\n\n${fileLists.get(arm) ?? ''}`,
              ...claudeArgs(arm, configs[arm], model, {
                stream: true,
                ...(arm === 'cascivo' && context !== null
                  ? { appendSystemPrompt: contextFile }
                  : {}),
              }),
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
            // After meta.json, which can carry the session's stderr.
            if (secret !== undefined && secret !== '' && holdsSecret(dir, secret)) {
              rmSync(dir, { recursive: true, force: true })
              mkdirSync(dir)
              const leaked: Meta = { usage: null, infra: true, infraDetail: SECRET_FOUND }
              writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(leaked, null, 2)}\n`)
              writeRun()
              throw new Error(
                `${model} ${arm} ${task.id} #${attempt}: ${SECRET_FOUND}, so the run is aborted ` +
                  'and the attempt removed. Rotate the key.',
              )
            }
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

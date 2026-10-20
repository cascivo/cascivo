/**
 * The score phase (spec §4): build what an attempt left behind, type-check it, serve it and run
 * the task's hidden EVAL against it in Chromium, then take the secondary metrics (axe on every
 * page the EVAL visited, `cascivo audit --ai` for the cascivo arms).
 *
 * Nothing from an attempt directory is imported or executed here except by building and
 * serving it: the EVAL is loaded from this repo's task directory, and every tool comes from the
 * prepared `node_modules`, never from one the agent wrote.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { createServer } from 'node:net'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { AxeBuilder } from '@axe-core/playwright'
import { chromium, type Browser, type Page } from '@playwright/test'
import ts from 'typescript'
import { resolveChromium } from '../../../../../scripts/checks/lib/chromium.ts'
import { PUBLISHED_ARMS, type PublishedArmId } from '../arms.ts'
import { CLI } from '../env.ts'
import { parseClaudeResult, type AgentUsage } from '../result.ts'
import { countAudit, countTscErrors, findApp } from '../score.ts'
import { pageKey } from '../../tasks/_lib.ts'
import { classify, DETAIL_MAX, type AttemptRecord, type AxeCounts } from './results.ts'
import { prepareStarter, type Starter } from './starters.ts'
import { loadTasks, TASK_IDS, type EvalTask } from './tasks.ts'

const BUILD_MS = 180_000
const TYPES_MS = 120_000
const PREVIEW_MS = 30_000
const EVAL_MS = 120_000
const AUDIT_MS = 120_000
/** Per visited page; a page that will not load or scan is skipped rather than holding up the run. */
const AXE_PAGE_MS = 30_000
/** A tool can print without end; the detail needs the start of an error, not megabytes of it. */
const OUTPUT_MAX = 1_000_000

/** The arms whose apps are built on cascivo, so `cascivo audit --ai` means something. */
const AUDITED_ARMS: readonly string[] = ['cascivo', 'cascivo-bare']

export interface ScoreInput {
  attemptDir: string
  task: EvalTask
  arm: string
  model: string
  attempt: number
  /** The prepared dependency tree for this arm; linked into the app and the source of every tool. */
  nodeModules: string
  usage: AgentUsage | null
  infra: boolean
  infraDetail?: string
  /** The task's EVAL, already imported (scoreAll imports every one before anything builds). */
  evaluate?: Evaluate
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error))

function trimDetail(text: string): string {
  const plain = stripVTControlCharacters(text).trim()
  return plain.length <= DETAIL_MAX ? plain : `${plain.slice(0, DETAIL_MAX - 1)}…`
}

export interface Ran {
  /** Null when the process was killed or never started. */
  code: number | null
  /** stdout and stderr, interleaved as they arrived. */
  output: string
  stdout: string
  timedOut: boolean
}

// The agent's child processes are untrusted, and the scoring job must not hand them anything
// it holds. NODE_ENV is dropped so a caller's value (a test runner's `test`) cannot turn a
// production build into a development one.
function childEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env['ANTHROPIC_API_KEY']
  delete env['NODE_ENV']
  return env
}

/**
 * Spawned as a group leader so a timeout can kill everything it started: `vite` forks workers
 * and a shim forks `node`, and killing only the direct child would leave those running.
 */
function spawnGroup(cmd: string, args: string[], cwd: string): ChildProcess {
  return spawn(cmd, args, {
    cwd,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: childEnv(),
  })
}

function killGroup(child: ChildProcess): void {
  if (child.pid === undefined) return
  try {
    process.kill(-child.pid, 'SIGKILL')
  } catch {
    // Already gone.
  }
}

/**
 * Run a command to completion or until `timeoutMs`, then kill its whole process group either
 * way. Exported for its tests.
 */
export async function runBounded(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<Ran> {
  const child = spawnGroup(cmd, args, cwd)
  let output = ''
  let stdout = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    if (output.length < OUTPUT_MAX) output += chunk.toString()
    if (stdout.length < OUTPUT_MAX) stdout += chunk.toString()
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    if (output.length < OUTPUT_MAX) output += chunk.toString()
  })
  try {
    return await new Promise<Ran>((done) => {
      let grace: NodeJS.Timeout | undefined
      let timer: NodeJS.Timeout | undefined
      const finish = (code: number | null, timedOut: boolean) => {
        clearTimeout(timer)
        clearTimeout(grace)
        done({ code, output, stdout, timedOut })
      }
      timer = setTimeout(() => {
        killGroup(child)
        finish(null, true)
      }, timeoutMs)
      child.on('error', (error) => {
        output += error.message
        finish(null, false)
      })
      child.on('exit', (code) => {
        // A process left in the group can hold the pipes open, and 'close' would wait for it.
        killGroup(child)
        grace = setTimeout(() => finish(code, false), 2000)
        child.on('close', () => finish(code, false))
      })
    })
  } finally {
    killGroup(child)
  }
}

function tool(nodeModules: string, name: string): string {
  const path = join(nodeModules, '.bin', name)
  if (!existsSync(path)) throw new Error(`${path} is missing: the starter's install has no ${name}`)
  return path
}

/**
 * The app must resolve its imports from the prepared tree. An agent-written `node_modules` is
 * replaced, not merged: it could shadow a package with code of its own.
 */
function linkNodeModules(appDir: string, nodeModules: string): void {
  const link = join(appDir, 'node_modules')
  rmSync(link, { recursive: true, force: true })
  symlinkSync(resolve(nodeModules), link, 'dir')
}

async function buildStep(vite: string, appDir: string): Promise<string | null> {
  const ran = await runBounded(vite, ['build'], appDir, BUILD_MS)
  if (ran.timedOut) return `vite build timed out after ${BUILD_MS / 1000} s`
  if (ran.code === 0) return null
  // Vite prints its progress first; the reason starts at this line, the stack trace after it.
  const at = ran.output.indexOf('error during build')
  return `vite build failed (exit ${ran.code}): ${at === -1 ? ran.output.slice(-DETAIL_MAX) : ran.output.slice(at)}`
}

/**
 * The projects `tsc` must check. A Vite starter's `tsconfig.json` is solution-style: no files of
 * its own, only `references`, so `tsc -p .` alone would check nothing and pass every type error.
 * One level of references covers the starters; a reference that leaves the app is not the app's
 * code and is not followed.
 */
function tsProjects(appDir: string): string[] {
  const path = join(appDir, 'tsconfig.json')
  if (!existsSync(path)) return ['.']
  // JSONC (comments, trailing commas), so TypeScript's own reader, not JSON.parse.
  const config: unknown = ts.parseConfigFileTextToJson(path, readFileSync(path, 'utf8')).config
  if (!isRecord(config)) return ['.']
  const references: unknown = config['references']
  if (!Array.isArray(references)) return ['.']
  const refs: unknown[] = references
  const projects = ['.']
  for (const ref of refs) {
    if (!isRecord(ref) || typeof ref['path'] !== 'string') continue
    const rel = relative(appDir, resolve(appDir, ref['path']))
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) continue
    projects.push(rel)
  }
  return projects
}

async function typesStep(
  tsc: string,
  appDir: string,
): Promise<{ errors: number | null; failure: string | null }> {
  const timedOut = { errors: null, failure: `tsc timed out after ${TYPES_MS / 1000} s` }
  const deadline = Date.now() + TYPES_MS
  let errors = 0
  const failures: string[] = []
  for (const project of tsProjects(appDir)) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) return timedOut
    const ran = await runBounded(tsc, ['--noEmit', '-p', project], appDir, remaining)
    if (ran.timedOut) return timedOut
    errors += countTscErrors(ran.output)
    if (ran.code !== 0) failures.push(ran.output.trim() || `tsc -p ${project} exited ${ran.code}`)
  }
  if (failures.length === 0) return { errors, failure: null }
  return {
    errors,
    failure: `${errors} type error${errors === 1 ? '' : 's'}: ${failures.join('\n')}`,
  }
}

export type Evaluate = (page: Page, baseUrl: string) => Promise<unknown>

async function loadEval(path: string): Promise<Evaluate> {
  const mod: unknown = await import(pathToFileURL(path).href)
  const fn = isRecord(mod) ? mod['default'] : undefined
  if (typeof fn !== 'function') throw new Error(`${path} does not export a default function`)
  return async (page, baseUrl) => fn(page, baseUrl)
}

/**
 * Ports handed to a preview in this process that may not be bound yet. The OS can return a port
 * another worker was just given but whose `vite preview` has not bound it, and `--strictPort`
 * would then fail that attempt for a reason that has nothing to do with the app.
 */
const reservedPorts = new Set<number>()

async function freePort(): Promise<number> {
  for (;;) {
    const server = createServer()
    await new Promise<void>((done, fail) => {
      server.once('error', fail)
      server.listen(0, '127.0.0.1', done)
    })
    const address = server.address()
    await new Promise((done) => server.close(done))
    if (!isRecord(address) || typeof address['port'] !== 'number') {
      throw new Error('could not reserve a port for vite preview')
    }
    const port = address['port']
    if (!reservedPorts.has(port)) {
      reservedPorts.add(port)
      return port
    }
  }
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

/** Null once `/` answers 200; otherwise why it never did. */
async function waitForPreview(
  baseUrl: string,
  preview: ChildProcess,
  output: () => string,
): Promise<string | null> {
  let exit: number | null | undefined
  preview.once('exit', (code) => {
    exit = code
  })
  const deadline = Date.now() + PREVIEW_MS
  while (Date.now() < deadline) {
    if (exit !== undefined) {
      return `vite preview exited (code ${exit}) before serving: ${output().slice(-DETAIL_MAX)}`
    }
    try {
      const timeout = Math.max(1, Math.min(2000, deadline - Date.now()))
      const res = await fetch(baseUrl, { signal: AbortSignal.timeout(timeout) })
      await res.body?.cancel()
      if (res.status === 200) return null
    } catch {
      // Not listening yet.
    }
    await sleep(250)
  }
  return `vite preview did not answer 200 on / within ${PREVIEW_MS / 1000} s`
}

const TIMED_OUT = Symbol('timed out')

/** The value, or TIMED_OUT. A late rejection of `work` is handled by the race and goes nowhere. */
async function within<T>(work: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<typeof TIMED_OUT>((done) => {
    timer = setTimeout(() => done(TIMED_OUT), ms)
  })
  try {
    return await Promise.race([work, timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function launchChromium(): Promise<Browser> {
  const executablePath = resolveChromium(chromium.executablePath())
  return chromium.launch(executablePath === undefined ? {} : { executablePath })
}

/**
 * Null when the EVAL passed; otherwise its message. Each same-origin page it reached goes in
 * `visited`, keyed as `findOnAnyPage` keys pages: an anchor, a `#/` redirect or a trailing slash
 * is the same page, and scanning it again would count its violations twice.
 */
async function runEval(
  browser: Browser,
  evaluate: Evaluate,
  baseUrl: string,
  visited: Map<string, string>,
): Promise<string | null> {
  const origin = new URL(baseUrl).origin
  const context = await browser.newContext()
  const track = (page: Page) => {
    page.on('framenavigated', (frame) => {
      if (frame !== page.mainFrame()) return
      const url = frame.url()
      if (!url.startsWith('http') || new URL(url).origin !== origin) return
      const key = pageKey(url)
      if (!visited.has(key)) visited.set(key, url)
    })
  }
  // Popups and extra tabs are pages the EVAL visited too.
  context.on('page', track)
  try {
    const page = await context.newPage()
    const outcome = await within(
      evaluate(page, baseUrl).then(() => null),
      EVAL_MS,
    )
    return outcome === TIMED_OUT ? `EVAL timed out after ${EVAL_MS / 1000} s` : outcome
  } catch (error) {
    return message(error)
  } finally {
    // Closing the context also aborts whatever a timed-out EVAL is still waiting on.
    await context.close().catch(() => {})
  }
}

/**
 * Axe on a fresh load of each visited page, summed by impact; null when nothing was scanned.
 * Counts violated rules per page, as the runner's a11y suite does.
 */
async function runAxe(browser: Browser, urls: string[]): Promise<AxeCounts | null> {
  if (urls.length === 0) return null
  const counts: AxeCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  let scanned = 0
  const context = await browser.newContext()
  try {
    for (const url of urls) {
      const page = await context.newPage()
      try {
        const scan = async () => {
          await page.goto(url, { timeout: AXE_PAGE_MS })
          // An SPA renders after load; give its first fetches a moment, but never wait on them.
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
          return new AxeBuilder({ page }).analyze()
        }
        const result = await within(scan(), AXE_PAGE_MS)
        if (result === TIMED_OUT) continue
        for (const violation of result.violations) {
          if (violation.impact) counts[violation.impact] += 1
        }
        scanned += 1
      } catch {
        // A page that will not load cannot be scanned; it is not counted.
      } finally {
        await page.close().catch(() => {})
      }
    }
  } finally {
    await context.close().catch(() => {})
  }
  return scanned === 0 ? null : counts
}

async function evalStep(
  vite: string,
  appDir: string,
  evaluate: Evaluate,
): Promise<{ failure: string | null; axe: AxeCounts | null }> {
  const port = await freePort()
  const preview = spawnGroup(
    vite,
    ['preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    appDir,
  )
  let output = ''
  const collect = (chunk: Buffer) => {
    if (output.length < OUTPUT_MAX) output += chunk.toString()
  }
  preview.stdout?.on('data', collect)
  preview.stderr?.on('data', collect)
  let browser: Browser | undefined
  try {
    const baseUrl = `http://127.0.0.1:${port}/`
    const notReady = await waitForPreview(baseUrl, preview, () => output)
    if (notReady !== null) return { failure: notReady, axe: null }
    browser = await launchChromium()
    const visited = new Map<string, string>()
    const failure = await runEval(browser, evaluate, baseUrl, visited)
    return { failure, axe: await runAxe(browser, [...visited.values()]) }
  } finally {
    await browser?.close().catch(() => {})
    killGroup(preview)
    reservedPorts.delete(port)
  }
}

async function auditStep(appDir: string): Promise<{ errors: number; warnings: number }> {
  const ran = await runBounded(
    process.execPath,
    [CLI, 'audit', '--ai', '--json', '--level', 'warn', 'src'],
    appDir,
    AUDIT_MS,
  )
  if (ran.timedOut)
    throw new Error(`cascivo audit timed out after ${AUDIT_MS / 1000} s in ${appDir}`)
  try {
    return countAudit(ran.stdout)
  } catch (error) {
    throw new Error(`cascivo audit in ${appDir}: ${message(error)}\n${ran.output.slice(0, 2000)}`)
  }
}

/** Score one attempt. Throws only on a harness failure (a missing tool, a browser that won't launch). */
export async function scoreAttempt(input: ScoreInput): Promise<AttemptRecord> {
  const base = {
    task: input.task.id,
    arm: input.arm,
    model: input.model,
    attempt: input.attempt,
    usage: input.usage,
  }
  const unmeasured = { tscErrors: null, axe: null, auditErrors: null, auditWarnings: null }
  if (input.infra) {
    return {
      ...base,
      ...unmeasured,
      status: 'infra-error',
      detail: trimDetail(input.infraDetail ?? 'infra error'),
    }
  }
  // Loaded first so a broken EVAL fails the run before minutes of building.
  const evaluate = input.evaluate ?? (await loadEval(input.task.evalPath))
  const app = findApp(input.attemptDir)
  if (app === null) return { ...base, ...unmeasured, status: 'fail-build', detail: 'no app found' }

  const appDir = join(input.attemptDir, app)
  const vite = tool(input.nodeModules, 'vite')
  const tsc = tool(input.nodeModules, 'tsc')
  linkNodeModules(appDir, input.nodeModules)

  const build = await buildStep(vite, appDir)
  const types = await typesStep(tsc, appDir)
  // Served even when types fail: the status is already decided, but axe still measures the app.
  const served = build === null ? await evalStep(vite, appDir, evaluate) : null
  const audit = AUDITED_ARMS.includes(input.arm) ? await auditStep(appDir) : null

  const status = classify({
    infra: false,
    build: build === null,
    types: types.failure === null,
    eval: served !== null && served.failure === null,
  })
  const failure =
    status === 'fail-build' ? build : status === 'fail-types' ? types.failure : served?.failure
  return {
    ...base,
    status,
    detail: failure === null || failure === undefined ? null : trimDetail(failure),
    tscErrors: types.errors,
    axe: served?.axe ?? null,
    auditErrors: audit?.errors ?? null,
    auditWarnings: audit?.warnings ?? null,
  }
}

interface AttemptMeta {
  usage: AgentUsage | null
  infra: boolean
  infraDetail?: string
}

/**
 * `meta.json` comes from the generate job as a workflow artifact, so it is parsed, not trusted.
 * A missing or malformed one means the session never finished cleanly: an infra error, not a
 * reason to stop scoring the rest.
 */
function readMeta(dir: string): AttemptMeta {
  const infra = (detail: string): AttemptMeta => ({ usage: null, infra: true, infraDetail: detail })
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))
  } catch (error) {
    return infra(`meta.json: ${message(error)}`)
  }
  if (
    !isRecord(raw) ||
    !('usage' in raw) ||
    typeof raw['infra'] !== 'boolean' ||
    (raw['infraDetail'] !== undefined && typeof raw['infraDetail'] !== 'string')
  ) {
    return infra('meta.json: expected { usage, infra, infraDetail? }')
  }
  const detail = typeof raw['infraDetail'] === 'string' ? raw['infraDetail'] : undefined
  let usage: AgentUsage | null = null
  if (raw['usage'] !== null) {
    try {
      usage = parseClaudeResult(raw['usage'])
    } catch (error) {
      return infra(raw['infra'] && detail !== undefined ? detail : message(error))
    }
  }
  return { usage, infra: raw['infra'], ...(detail === undefined ? {} : { infraDetail: detail }) }
}

function subdirs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

const isPublishedArm = (name: string): name is PublishedArmId =>
  (PUBLISHED_ARMS as readonly string[]).includes(name)

interface AttemptRef {
  dir: string
  model: string
  arm: PublishedArmId
  task: string
  attempt: number
}

/** `<inDir>/<model>/<arm>/<task>/<attempt>/`, in a stable order; anything else there is an error. */
function walk(inDir: string): AttemptRef[] {
  const refs: AttemptRef[] = []
  for (const model of subdirs(inDir).sort()) {
    const arms = subdirs(join(inDir, model))
    for (const arm of arms) {
      if (!isPublishedArm(arm)) throw new Error(`${join(inDir, model, arm)}: not a published arm`)
    }
    for (const arm of PUBLISHED_ARMS.filter((a) => arms.includes(a))) {
      const tasks = subdirs(join(inDir, model, arm))
      for (const task of tasks) {
        if (!TASK_IDS.includes(task))
          throw new Error(`${join(inDir, model, arm, task)}: not a task`)
      }
      for (const task of TASK_IDS.filter((t) => tasks.includes(t))) {
        const attempts = subdirs(join(inDir, model, arm, task)).map((name) => {
          if (!/^[1-9]\d*$/.test(name)) {
            throw new Error(`${join(inDir, model, arm, task, name)}: not an attempt number`)
          }
          return Number(name)
        })
        for (const attempt of attempts.sort((a, b) => a - b)) {
          refs.push({
            dir: join(inDir, model, arm, task, String(attempt)),
            model,
            arm,
            task,
            attempt,
          })
        }
      }
    }
  }
  return refs
}

/** Score every attempt under `inDir`, `concurrency` at a time, each on its own port and browser. */
export async function scoreAll(
  inDir: string,
  opts: {
    concurrency?: number
    /** The run's planned tasks (run.json): their EVALs are imported even with no attempt. */
    tasks?: readonly string[]
  } = {},
  deps: { loadEval?: (path: string) => Promise<Evaluate> } = {},
): Promise<AttemptRecord[]> {
  const concurrency = opts.concurrency ?? 2
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`concurrency must be a positive integer, got ${concurrency}`)
  }
  const refs = walk(inDir)
  const metas = refs.map((ref) => readMeta(ref.dir))
  const tasks = new Map<string, EvalTask>()
  for (const task of loadTasks([...new Set([...(opts.tasks ?? []), ...refs.map((r) => r.task)])]))
    tasks.set(task.id, task)
  // Every EVAL and its _lib.ts, imported before anything an agent wrote runs: a vite.config.ts or
  // PostCSS config runs with the checkout writable, and could otherwise rewrite an EVAL that a
  // later attempt imports. Node caches an imported module, so a later write cannot reach it.
  const load = deps.loadEval ?? loadEval
  const evals = new Map<string, Evaluate>()
  for (const task of tasks.values()) evals.set(task.id, await load(task.evalPath))
  // Prepared before any scoring starts: preparing is synchronous and can take minutes, which
  // would stall a concurrent attempt's preview and browser mid-EVAL. Only arms with something
  // to build are prepared, so a run of only infra errors needs no install.
  const starters = new Map<PublishedArmId, Starter>()
  refs.forEach((ref, i) => {
    if (metas[i]?.infra === false && !starters.has(ref.arm)) {
      starters.set(
        ref.arm,
        prepareStarter(ref.arm, (line) => console.error(line)),
      )
    }
  })

  const records: AttemptRecord[] = []
  let next = 0
  const worker = async () => {
    while (next < refs.length) {
      const index = next++
      const ref = refs[index]
      const meta = metas[index]
      const task = ref === undefined ? undefined : tasks.get(ref.task)
      if (ref === undefined || meta === undefined || task === undefined) continue
      const evaluate = evals.get(task.id)
      records[index] = await scoreAttempt({
        attemptDir: ref.dir,
        task,
        arm: ref.arm,
        model: ref.model,
        attempt: ref.attempt,
        nodeModules: starters.get(ref.arm)?.nodeModules ?? '',
        usage: meta.usage,
        infra: meta.infra,
        ...(meta.infraDetail === undefined ? {} : { infraDetail: meta.infraDetail }),
        ...(evaluate === undefined ? {} : { evaluate }),
      })
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, refs.length) }, worker))
  return records
}

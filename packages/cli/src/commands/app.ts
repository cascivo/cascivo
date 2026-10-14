import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { CLI_VERSION } from '../generated/versions.js'
import { blueprintOptions, parseBlueprint } from '../scaffold/blueprint.js'
import { flagValue, positionalArgs } from '../utils/args.js'
import { detectPackageManager } from '../utils/config.js'
import type { PackageManager } from '../utils/config.js'
import { writeFileSafe } from '../utils/fs.js'
import { merge } from '../utils/merge.js'
import { buildScaffold, optionsError } from './create.js'

const BLUEPRINT = 'cascivo.app.json'

export interface AppChange {
  path: string
  /** `written`: new or untouched since it was generated; `merged`: your edits kept. */
  outcome: 'written' | 'merged' | 'conflict'
}

/** The files a blueprint generates, as `path → contents`. */
export type Generate = (blueprint: unknown, pm: PackageManager) => Map<string, string>

function scaffoldOf(blueprint: unknown, pm: PackageManager): Map<string, string> {
  const options = { ...blueprintOptions(parseBlueprint(blueprint, BLUEPRINT)), pm }
  return new Map(buildScaffold(options).map((f) => [f.path, f.contents]))
}

/** Every file under `dir`, relative to it. */
function readTree(dir: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) walk(full)
      else out.set(relative(dir, full).replaceAll('\\', '/'), readFileSync(full, 'utf8'))
    }
  }
  walk(dir)
  return out
}

/**
 * What the app's own CLI version generated from `blueprint`: the merge base. A newer CLI's
 * templates differ, and merging against them would read every template change as your edit.
 * With no `cascivo` stamp, or the same version, that is this CLI's output; otherwise the
 * recorded version is run (`npx cascivo@<version>`), falling back to this one with a warning.
 */
export function originalScaffold(blueprint: unknown, pm: PackageManager): Map<string, string> {
  const { cascivo: version, name } = parseBlueprint(blueprint, BLUEPRINT)
  if (!version || version === CLI_VERSION) return scaffoldOf(blueprint, pm)
  const work = mkdtempSync(join(tmpdir(), 'cascivo-base-'))
  try {
    writeFileSync(join(work, BLUEPRINT), JSON.stringify(blueprint))
    const result = spawnSync(
      'npx',
      // No name argument: it would override the blueprint's, and every file that spells the
      // app's name would then differ from what was really generated.
      ['-y', `cascivo@${version}`, 'create', '--from', BLUEPRINT, '--pm', pm],
      { cwd: work, encoding: 'utf8' },
    )
    if (result.status === 0) return readTree(join(work, name))
    console.warn(
      `Could not run cascivo@${version} to rebuild this app's original files; merging against ` +
        `cascivo@${CLI_VERSION}'s instead, so its template changes may show up as conflicts.`,
    )
    return scaffoldOf(blueprint, pm)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

/**
 * Change a blueprint app from `before` to `after`. Every file the new blueprint generates
 * differently from the original is merged three ways: what was generated, what is on disk now,
 * and what this CLI generates from `after`. A file nobody edited is replaced; an edited one
 * keeps the edits; a clash is left with conflict markers. The blueprint is rewritten last,
 * stamped with this CLI's version.
 */
export async function applyBlueprint(
  cwd: string,
  before: unknown,
  after: unknown,
  original: Generate = originalScaffold,
): Promise<AppChange[]> {
  const nextOptions = blueprintOptions(parseBlueprint(after, BLUEPRINT))
  const problem = optionsError(nextOptions)
  if (problem) throw new Error(problem)
  const pm = detectPackageManager(cwd, { preferLockfileOverUserAgent: true })
  const base = original(before, pm)

  const changes: AppChange[] = []
  let blueprint = ''
  for (const { path, contents } of buildScaffold({ ...nextOptions, pm })) {
    if (path === BLUEPRINT) {
      blueprint = contents
      continue
    }
    const generated = base.get(path)
    if (generated === contents) continue
    const target = join(cwd, path)
    const current = existsSync(target) ? readFileSync(target, 'utf8') : undefined
    if (current === contents) continue
    if (current === undefined || current === generated) {
      await writeFileSafe(target, contents)
      changes.push({ path, outcome: 'written' })
      continue
    }
    const merged = merge(generated ?? '', current, contents)
    await writeFileSafe(target, merged.text)
    changes.push({ path, outcome: merged.conflicts > 0 ? 'conflict' : 'merged' })
  }
  await writeFileSafe(join(cwd, BLUEPRINT), blueprint)
  return changes
}

const USAGE = `Usage:
  cascivo app add page "<title>" [--block <name>]
  cascivo app add example <name>
  cascivo app upgrade`

/** The change a command line asks for, as the blueprint after it. */
function changed(
  before: Record<string, unknown>,
  args: string[],
): { after: Record<string, unknown>; done: string } | string {
  const [action, kind, value] = positionalArgs(args, ['block'])
  if (action === 'upgrade' && kind === undefined) {
    if (before.cascivo === CLI_VERSION) return `Already generated by cascivo@${CLI_VERSION}.`
    return { after: before, done: `Upgraded to cascivo@${CLI_VERSION}.` }
  }
  if (action !== 'add' || !value) return USAGE
  if (kind === 'page') {
    const block = flagValue(args, 'block')
    const pages = Array.isArray(before.pages) ? before.pages : []
    return {
      after: { ...before, pages: [...pages, { title: value, ...(block ? { block } : {}) }] },
      done: `Added the "${value}" page.`,
    }
  }
  if (kind === 'example') {
    const examples = Array.isArray(before.examples) ? before.examples : []
    if (examples.includes(value)) return `The app already has the ${value} example.`
    return {
      after: { ...before, examples: [...examples, value] },
      done: `Added the ${value} example.`,
    }
  }
  return USAGE
}

/** `cascivo app add page|example …` and `cascivo app upgrade`. */
export async function app(args: string[], cwd: string = process.cwd()): Promise<void> {
  const file = join(cwd, BLUEPRINT)
  if (!existsSync(file)) {
    console.error(
      `No ${BLUEPRINT} here. \`cascivo app\` changes apps made with \`cascivo create\`; run it in the app's directory.`,
    )
    process.exitCode = 1
    return
  }

  let changes: AppChange[]
  let done: string
  try {
    const before: unknown = JSON.parse(readFileSync(file, 'utf8'))
    parseBlueprint(before, BLUEPRINT) // the app's own blueprint must be valid before it changes
    if (typeof before !== 'object' || before === null || Array.isArray(before)) {
      throw new Error(`${BLUEPRINT} must be a JSON object.`)
    }
    const request = changed({ ...before }, args)
    if (request === USAGE) {
      console.error(USAGE)
      process.exitCode = 1
      return
    }
    if (typeof request === 'string') {
      console.log(request)
      return
    }
    done = request.done
    changes = await applyBlueprint(cwd, before, request.after)
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exitCode = 1
    return
  }

  console.log(done)
  for (const change of changes) {
    const note =
      change.outcome === 'merged'
        ? ' (merged with your edits)'
        : change.outcome === 'conflict'
          ? ' — CONFLICT: resolve the <<<<<<< markers'
          : ''
    console.log(`  ${change.path}${note}`)
  }
  if (changes.some((c) => c.outcome === 'conflict')) process.exitCode = 1
}

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { blueprintOptions, parseBlueprint } from '../scaffold/blueprint.js'
import { flagValue, positionalArgs } from '../utils/args.js'
import { detectPackageManager } from '../utils/config.js'
import { writeFileSafe } from '../utils/fs.js'
import { merge } from '../utils/merge.js'
import { buildScaffold, formatJson, optionsError } from './create.js'

const BLUEPRINT = 'cascivo.app.json'

export interface AppChange {
  path: string
  /** `written`: new or untouched since it was generated; `merged`: your edits kept. */
  outcome: 'written' | 'merged' | 'conflict'
}

/**
 * Apply a change to a blueprint app. The scaffold is generated from the blueprint before and
 * after the change, and every file the change touches is merged three ways: what was
 * generated, what is on disk now, and what the new blueprint generates. A file nobody edited
 * is replaced; an edited one keeps the edits; a clash is left with conflict markers.
 */
export async function applyBlueprint(
  cwd: string,
  before: unknown,
  after: unknown,
): Promise<AppChange[]> {
  const pm = detectPackageManager(cwd, { preferLockfileOverUserAgent: true })
  const options = (raw: unknown) => ({ ...blueprintOptions(parseBlueprint(raw, BLUEPRINT)), pm })
  const base = new Map(buildScaffold(options(before)).map((f) => [f.path, f.contents]))
  const next = options(after)
  const problem = optionsError(next)
  if (problem) throw new Error(problem)

  const changes: AppChange[] = []
  for (const { path, contents } of buildScaffold(next)) {
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
  await writeFileSafe(join(cwd, BLUEPRINT), formatJson(after))
  return changes
}

/** `cascivo app add page "<title>" [--block <name>]`. */
export async function app(args: string[], cwd: string = process.cwd()): Promise<void> {
  const [action, kind, title] = positionalArgs(args, ['block'])
  if (action !== 'add' || kind !== 'page' || !title) {
    console.error('Usage: cascivo app add page "<title>" [--block <name>]')
    process.exitCode = 1
    return
  }
  const file = join(cwd, BLUEPRINT)
  if (!existsSync(file)) {
    console.error(
      `No ${BLUEPRINT} here. \`cascivo app\` changes apps made with \`cascivo create --from\`; run it in the app's directory.`,
    )
    process.exitCode = 1
    return
  }

  let changes: AppChange[]
  try {
    const before: unknown = JSON.parse(readFileSync(file, 'utf8'))
    parseBlueprint(before, BLUEPRINT) // the app's own blueprint must be valid before it changes
    if (typeof before !== 'object' || before === null || !('pages' in before)) {
      throw new Error(`${BLUEPRINT}: "pages" is missing.`)
    }
    const pages: unknown = before.pages
    if (!Array.isArray(pages)) throw new Error(`${BLUEPRINT}: "pages" must be an array.`)
    const block = flagValue(args, 'block')
    const after = { ...before, pages: [...pages, { title, ...(block ? { block } : {}) }] }
    changes = await applyBlueprint(cwd, before, after)
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exitCode = 1
    return
  }

  console.log(`Added the "${title}" page.`)
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

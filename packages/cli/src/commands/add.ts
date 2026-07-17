import { readFileSync } from 'node:fs'
import { join, resolve as resolvePath } from 'node:path'
import {
  detectPackageManager,
  installHint,
  type CascadeConfig,
  type PackageManager,
} from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { resolveOutputPath, writeFileSafe } from '../utils/fs.js'
import { fetchTextRetry } from '../utils/http.js'
import {
  fetchRegistry,
  fileName,
  findComponent,
  type Registry,
  type RegistryComponent,
} from '../utils/registry.js'
import { createLock, readLock, sha256, updateLockEntry, writeLock } from '../utils/lock.js'
import { checkPeerVersions } from '../utils/peer-versions.js'
import { resolveClosure } from '../utils/resolve.js'
import { resolveFromDirectory } from '../utils/directory.js'
import { isTemplateItem, type RegistryItem } from '@cascivo/registry'

/** Dependencies always present in a cascade project — never auto-installed. */
const ASSUMED_DEPS = new Set(['react', 'react-dom'])

/** Merged dependencies + devDependencies from the project's package.json (empty if none). */
function readProjectDeps(cwd: string): Record<string, unknown> {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, unknown>
      devDependencies?: Record<string, unknown>
    }
    return { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    // No package.json — treat as no deps installed.
    return {}
  }
}

/**
 * Copied components read `--cascivo-*` custom properties; without
 * @cascivo/tokens or @cascivo/themes imported somewhere, they render unstyled.
 * Print the wiring once after a successful install if neither is a dependency.
 */
function hintThemesIfMissing(cwd: string, pm: PackageManager): void {
  const deps = readProjectDeps(cwd)
  if (deps['@cascivo/themes'] !== undefined || deps['@cascivo/tokens'] !== undefined) return
  console.log(
    '\nStyling: cascivo components read --cascivo-* tokens, which this project does not import yet.',
  )
  console.log(`  ${installHint(pm, ['@cascivo/themes'])}`)
  console.log("  import '@cascivo/themes/all'   // once, in your entry file")
  console.log('  <html data-theme="light">      // or any container')
}

/** Resolve where a template's own file is written — relative to the project root. */
export function resolveTemplateTarget(cwd: string, target: string): string {
  return resolvePath(cwd, target)
}

export interface ResolvedBareEntry {
  entry: RegistryComponent
  /** True if reached via an original `cascivo add` argument; false if pulled as a transitive dependency. */
  requested: boolean
}

/**
 * Names from other libraries → the cascivo layout primitive that fills the same
 * role, so `cascivo add box` installs `layout/flex`. Bare names that already
 * resolve (e.g. `flex` → `layout/flex` via suffix match) still list an alias here
 * for discoverability.
 */
export const LAYOUT_ALIASES: Record<string, string> = {
  box: 'layout/flex',
  hstack: 'layout/flex',
  vstack: 'layout/flex',
  gap: 'spacer',
}

/**
 * Disambiguation printed when a requested bare name is a real cascivo component
 * whose meaning differs from the same name elsewhere, so an adopter who grabbed
 * it by name alone learns the right primitive. Keyed by lowercased bare name.
 */
export const NAME_NOTES: Record<string, string> = {
  stack:
    "Note: cascivo's Stack overlaps children into a card-pile (z-axis), not a " +
    'vertical spacing layout. For vertical spacing use Flex direction="vertical" ' +
    '(cascivo add flex; aliases: vstack, hstack).',
}

/**
 * Resolve the transitive closure of bare-name registry entries, following each
 * entry's `registryDependencies`. De-duped by resolved registry name and
 * cycle-safe (an entry is processed at most once). Returns resolved entries in
 * install order plus the names that could not be found. Pure — no I/O.
 */
export function resolveBareClosure(
  registry: Registry,
  bareSpecs: string[],
): { resolved: ResolvedBareEntry[]; missing: string[] } {
  const queue: { name: string; requested: boolean }[] = bareSpecs.map((name) => ({
    name,
    requested: true,
  }))
  const installed = new Set<string>()
  const resolved: ResolvedBareEntry[] = []
  const missing: string[] = []

  while (queue.length > 0) {
    const { name, requested } = queue.shift()!
    const resolvedName = LAYOUT_ALIASES[name.toLowerCase()] ?? name
    const entry = findComponent(registry, resolvedName)
    if (!entry) {
      missing.push(name)
      continue
    }
    if (installed.has(entry.name)) continue
    installed.add(entry.name)
    resolved.push({ entry, requested })
    for (const dep of entry.registryDependencies ?? []) {
      queue.push({ name: dep, requested: false })
    }
  }

  return { resolved, missing }
}

/**
 * First-party items are hosted on cascivo.com or the cascivo/cascivo GitHub
 * repo (raw file URLs). Anything else gets a review-before-use notice.
 */
const FIRST_PARTY_URL = /^https:\/\/(cascivo\.com|raw\.githubusercontent\.com\/cascivo\/cascivo)\//

export function isThirdParty(itemUrl: string): boolean {
  return !FIRST_PARTY_URL.test(itemUrl)
}

function isMultiRegistrySpec(name: string): boolean {
  return (
    name.startsWith('@') ||
    name.startsWith('http://') ||
    name.startsWith('https://') ||
    name.startsWith('./') ||
    name.startsWith('/') ||
    name.split('/').length >= 3
  )
}

export async function add(
  names: string[],
  config: CascadeConfig,
  opts: {
    dryRun?: boolean
    yes?: boolean
    cwd?: string
    pm?: PackageManager
    noInstall?: boolean
  } = {},
): Promise<void> {
  if (names.length === 0) {
    console.error('Usage: cascivo add <component...>')
    return
  }

  const cwd = opts.cwd ?? process.cwd()
  const pm = opts.pm ?? detectPackageManager(cwd)
  const multiSpecs = names.filter(isMultiRegistrySpec)
  let bareSpecs = names.filter((n) => !isMultiRegistrySpec(n))

  // Bare names that match a first-party template install through the per-item
  // path (they carry file targets the bare component path cannot express).
  let registry: Registry | null = null
  if (bareSpecs.length > 0) {
    registry = await fetchRegistry(config.registry)
    const templateNames = new Set(registry.templates.map((t) => t.toLowerCase()))
    const templateSpecs = bareSpecs.filter((n) => templateNames.has(n.toLowerCase()))
    if (templateSpecs.length > 0) {
      bareSpecs = bareSpecs.filter((n) => !templateNames.has(n.toLowerCase()))
      multiSpecs.push(...templateSpecs.map((n) => `@cascivo/${n.toLowerCase()}`))
    }
  }

  let lock = (await readLock(cwd)) ?? createLock()

  // Handle multi-registry specs (namespaces, URLs, GitHub)
  if (multiSpecs.length > 0) {
    const plan = await resolveClosure(multiSpecs, config, process.env, resolveFromDirectory)

    if (opts.dryRun) {
      console.log('Dry run — would install:')
      for (const item of plan.items) {
        const kind = isTemplateItem(item.item) ? ' [template]' : ''
        console.log(
          `  ${item.spec} (${item.item.name}@${item.item.version})${kind} from ${item.itemUrl}`,
        )
        for (const f of item.item.files) {
          const arrow = isTemplateItem(item.item) && f.target ? ` → ${f.target}` : ''
          console.log(`    ${f.url}${arrow}`)
        }
        if (item.item.registryDependencies?.length) {
          console.log(`    components: ${item.item.registryDependencies.join(', ')}`)
        }
      }
      return
    }

    for (const { item, itemUrl, registryBase } of plan.items) {
      if (isThirdParty(itemUrl)) {
        console.log(
          `\nReview before use — files from non-directory registry: ${registryBase}\n` +
            (item.files ?? []).map((f) => `  ${f.url}`).join('\n'),
        )
      }

      let fileHashes: Record<string, string>
      try {
        fileHashes = await installItem(item, config, cwd, {
          pm,
          ...(opts.noInstall ? { noInstall: true } : {}),
        })
      } catch (e) {
        // Nothing was written for this item (fetch-all-then-write), so the
        // lockfile must not record it either.
        console.error(`Failed to install ${item.name}: ${e instanceof Error ? e.message : e}`)
        process.exitCode = 1
        continue
      }
      lock = updateLockEntry(lock, item.name, {
        registry: registryBase,
        version: item.version,
        installedAt: new Date().toISOString().slice(0, 10),
        files: fileHashes,
      })
    }
    await writeLock(lock, cwd)
    if (bareSpecs.length === 0) {
      hintThemesIfMissing(cwd, pm)
      return
    }
  }

  if (bareSpecs.length === 0) return
  // Legacy bare-name path (uses the registry fetched above for template
  // detection). Resolves the transitive closure of registry (component)
  // dependencies so a component that imports a shared hook/sibling
  // (e.g. `../popover/use-popover`) installs that dependency too.
  registry ??= await fetchRegistry(config.registry)
  const missingDeps = new Set<string>()
  const registryBase = config.registry.replace(/\/registry\.json$/, '').replace(/\/r$/, '')

  for (const spec of bareSpecs) {
    const note = NAME_NOTES[spec.toLowerCase()]
    if (note) console.log(note)

    const alias = LAYOUT_ALIASES[spec.toLowerCase()]
    if (!alias) continue
    const target = findComponent(registry, alias)
    if (target) {
      console.log(
        `"${spec}" is not a cascivo component — installing ${target.name} (its ${spec} primitive).`,
      )
    }
  }

  const { resolved, missing } = resolveBareClosure(registry, bareSpecs)
  for (const name of missing) {
    console.error(`Component "${name}" not found in registry. Run "cascivo list".`)
  }

  // Aggregate each resolved entry's peer-version floors (e.g. "install data-table
  // needs @cascivo/i18n >= 0.2.1") so we can verify what actually got installed.
  const peerFloors: Record<string, string> = {}
  for (const { entry } of resolved) {
    for (const [pkg, floor] of Object.entries(entry.peerVersions ?? {})) {
      peerFloors[pkg] = floor
    }
  }

  // npm-distributed entries (charts/flow/editor) are a runtime package, not
  // copied source. Collect their package + import lines here so N chart entries
  // produce ONE `@cascivo/charts` install rather than N, then install once below.
  const npmPackages = new Set<string>()
  const importLines: string[] = []

  for (const { entry, requested } of resolved) {
    if (entry.install) {
      const pkg = entry.install
      npmPackages.add(pkg)
      console.log(
        `"${entry.name}" is distributed as the npm package ${pkg} — a runtime dependency, ` +
          `not copied source (updates come via your package manager).`,
      )
      importLines.push(`  import { ${entry.meta.name} } from '${pkg}'`)
      if (entry.styles) {
        importLines.push(`  import '${entry.styles}'   // once, in your entry file`)
      }
      continue
    }

    const outputName = entry.name.includes('/') ? entry.name.split('/').pop()! : entry.name
    const fileHashes: Record<string, string> = {}

    // Two-phase: fetch every file before writing any, so a mid-install network
    // failure can never leave a half-copied component (or a lockfile entry
    // pointing at one).
    let fetched: { url: string; content: string }[]
    try {
      fetched = await Promise.all(
        entry.files.map(async (url) => ({ url, content: await fetchTextRetry(url) })),
      )
    } catch (e) {
      console.error(`Failed to install ${entry.name}: ${e instanceof Error ? e.message : e}`)
      process.exitCode = 1
      continue
    }
    for (const { url, content } of fetched) {
      const dest = resolveOutputPath(config.outputDir, outputName, fileName(url), cwd)
      await writeFileSafe(dest, content)
      fileHashes[dest] = sha256(content)
    }

    for (const dep of entry.dependencies) {
      if (!ASSUMED_DEPS.has(dep)) missingDeps.add(dep)
    }

    lock = updateLockEntry(lock, entry.name, {
      registry: registryBase,
      version: entry.version,
      installedAt: new Date().toISOString().slice(0, 10),
      files: fileHashes,
    })

    const suffix = requested ? '' : ' (dependency)'
    console.log(`Added ${entry.name} to ${config.outputDir}/${outputName}/${suffix}`)
  }

  // Install npm-distributed packages (charts/flow/editor) once, deduped, skipping
  // any already in the project. `--no-install`/`--dry-run` fall back to printing.
  if (npmPackages.size > 0) {
    const deps = readProjectDeps(cwd)
    const needed = [...npmPackages].filter((p) => deps[p] === undefined)
    if (opts.dryRun) {
      console.log(`Dry run — would install npm package(s): ${[...npmPackages].join(', ')}`)
    } else if (needed.length > 0) {
      if (opts.noInstall) {
        console.log(`\nSkipped install (--no-install). Install with:\n  ${installHint(pm, needed)}`)
      } else if (!installPackages(needed, cwd, { pm })) {
        process.exitCode = 1
      }
    }
    if (importLines.length > 0) {
      console.log(`\nImport it:\n${importLines.join('\n')}`)
    }
  }

  if (missingDeps.size > 0 && !opts.dryRun) {
    if (opts.noInstall) {
      console.log(
        `\nSkipped install (--no-install). Install with:\n  ${installHint(pm, [...missingDeps])}`,
      )
    } else {
      installPackages([...missingDeps], cwd, { pm })
    }
  }

  if (Object.keys(peerFloors).length > 0) {
    const violations = await checkPeerVersions(cwd, peerFloors)
    for (const v of violations) {
      console.error(
        `\nWarning: ${v.pkg} ${v.installed ? `${v.installed} is` : 'is not'} installed, but ` +
          `the copied component source needs ${v.pkg} ${v.required}. ` +
          `Run: ${installHint(pm, [`${v.pkg}@latest`])}`,
      )
      process.exitCode = 1
    }
  }

  await writeLock(lock, cwd)
  hintThemesIfMissing(cwd, pm)
}

/**
 * Install a single resolved item, returning a map of written path → content
 * hash for the lockfile. A template writes its own files to their `target`
 * paths (relative to the project root); every other item writes its files under
 * the components output directory. A template's components are installed
 * separately as their own plan entries (via `registryDependencies`).
 */
async function installItem(
  item: RegistryItem,
  config: CascadeConfig,
  cwd: string,
  opts: { pm?: PackageManager; noInstall?: boolean } = {},
): Promise<Record<string, string>> {
  const fileHashes: Record<string, string> = {}
  const missingDeps = new Set<string>()
  const template = isTemplateItem(item)
  const outputName = item.name.includes('/') ? item.name.split('/').pop()! : item.name

  // Two-phase: fetch every file before writing any. A failed fetch aborts the
  // whole item (throws to the caller) instead of silently installing a subset.
  const fetched = await Promise.all(
    (item.files ?? []).map(async (file) => ({
      file,
      content: await fetchTextRetry(file.url),
    })),
  )
  for (const { file, content } of fetched) {
    const dest =
      template && file.target
        ? resolveTemplateTarget(cwd, file.target)
        : resolveOutputPath(config.outputDir, outputName, fileName(file.url), cwd)
    await writeFileSafe(dest, content)
    fileHashes[dest] = sha256(content)
  }

  for (const dep of item.dependencies ?? []) {
    if (!ASSUMED_DEPS.has(dep)) missingDeps.add(dep)
  }

  if (missingDeps.size > 0) {
    if (opts.noInstall) {
      console.log(
        `\nSkipped install (--no-install). Install with:\n  ${installHint(opts.pm ?? detectPackageManager(cwd), [...missingDeps])}`,
      )
    } else {
      installPackages([...missingDeps], cwd, opts.pm ? { pm: opts.pm } : {})
    }
  }

  if (template) {
    const pages = item.files?.filter((f) => f.target).map((f) => f.target) ?? []
    console.log(`Installed template ${item.name} (${pages.length} files)`)
  } else {
    console.log(`Added ${item.name} to ${config.outputDir}/${outputName}/`)
  }

  return fileHashes
}

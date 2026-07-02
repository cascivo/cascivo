import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import type { CascadeConfig } from '../utils/config.js'
import { diffLines, hasChanges } from '../utils/diff.js'
import { readFileSafe, resolveOutputPath, writeFileSafe } from '../utils/fs.js'
import { fetchRegistry, fileName, findComponent } from '../utils/registry.js'
import { readLock, writeLock, updateLockEntry } from '../utils/lock.js'
import { fetchJson, fetchTextRetry } from '../utils/http.js'
import { merge } from '../utils/merge.js'
import type { RegistryItem } from '@cascivo/registry'

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const answer = (await rl.question(`${question} (y/N): `)).trim().toLowerCase()
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

export async function update(
  name: string | undefined,
  config: CascadeConfig,
  opts: { check?: boolean; yes?: boolean } = {},
): Promise<void> {
  if (opts.check) {
    return updateCheck(config)
  }

  if (!name) {
    console.error('Usage: cascivo update <component>')
    return
  }

  const lock = await readLock()
  const lockEntry = lock?.items[name]

  const registry = await fetchRegistry(config.registry)
  const entry = findComponent(registry, name)
  if (!entry) {
    console.error(`Component "${name}" not found in registry. Run "cascivo list".`)
    return
  }

  if (lockEntry) {
    // Three-way merge path
    const lockedVersion = lockEntry.version
    const registryBase = lockEntry.registry
    const baseItemUrl = `${registryBase}/r/${name}@${lockedVersion}.json`

    let baseItem: RegistryItem | null = null
    try {
      baseItem = (await fetchJson(baseItemUrl)) as RegistryItem
    } catch {
      console.warn(
        `Warning: could not fetch base version ${lockedVersion} from ${baseItemUrl}. Falling back to two-way diff.`,
      )
    }

    if (baseItem) {
      await threeWayUpdate(name, entry, baseItem, config, opts)
    } else {
      await twoWayUpdate(name, entry, config, opts)
    }
  } else {
    console.warn(
      `Warning: "${name}" has no lock entry. Falling back to two-way diff update (pre-v11 install).`,
    )
    await twoWayUpdate(name, entry, config, opts)
  }
}

async function threeWayUpdate(
  name: string,
  upstreamEntry: ReturnType<typeof findComponent>,
  baseItem: RegistryItem,
  config: CascadeConfig,
  opts: { yes?: boolean },
): Promise<void> {
  if (!upstreamEntry) return
  const outputName = name.includes('/') ? name.split('/').pop()! : name
  const summaries: { file: string; result: 'clean' | 'conflict' | 'unchanged' }[] = []
  const pending: { dest: string; content: string; conflicts: number }[] = []

  for (const url of upstreamEntry.files) {
    const fname = fileName(url)
    const baseFile = baseItem.files.find((f) => fileName(f.url) === fname)
    const dest = resolveOutputPath(config.outputDir, outputName, fname)

    const upstream = await fetchTextRetry(url)
    const local = existsSync(dest) ? await readFile(dest, 'utf8') : ''
    const base = baseFile ? await fetchTextRetry(baseFile.url) : ''

    if (base === '' && local === '') {
      summaries.push({ file: fname, result: 'clean' })
      pending.push({ dest, content: upstream, conflicts: 0 })
      continue
    }

    const { text, conflicts } = merge(base, local, upstream)

    if (conflicts > 0) {
      summaries.push({ file: fname, result: 'conflict' })
    } else if (text === local) {
      summaries.push({ file: fname, result: 'unchanged' })
      continue
    } else {
      summaries.push({ file: fname, result: 'clean' })
    }
    pending.push({ dest, content: text, conflicts })
  }

  if (pending.length === 0) {
    console.log(`${name} is already up to date.`)
    return
  }

  for (const s of summaries) {
    const icon = s.result === 'conflict' ? '⚠' : s.result === 'clean' ? '✓' : '·'
    console.log(`  ${icon} ${s.file} (${s.result})`)
  }

  const conflicted = pending.filter((p) => p.conflicts > 0)
  const shouldApply = opts.yes
    ? conflicted.length === 0 // --yes skips items with conflicts
    : await confirm(`\nApply ${pending.length} change(s) to ${name}?`)

  if (shouldApply || opts.yes) {
    const lock = await readLock()
    let updatedLock = lock

    for (const { dest, content, conflicts } of pending) {
      if (opts.yes && conflicts > 0) {
        console.log(`  skipped (conflicts): ${dest}`)
        continue
      }
      await writeFileSafe(dest, content)
    }

    if (lock && updatedLock) {
      const hasConflicts = conflicted.length > 0
      updatedLock = updateLockEntry(updatedLock, name, {
        ...lock.items[name]!,
        version: upstreamEntry.version,
        ...(hasConflicts ? { conflicted: true as const } : {}),
      })
      await writeLock(updatedLock)
    }

    console.log(`Updated ${name}.`)
    if (conflicted.length > 0) {
      console.log(`${conflicted.length} file(s) have conflict markers — resolve them manually.`)
    }
  } else {
    console.log('Aborted. No files changed.')
  }
}

async function twoWayUpdate(
  name: string,
  entry: ReturnType<typeof findComponent>,
  config: CascadeConfig,
  opts: { yes?: boolean },
): Promise<void> {
  if (!entry) return
  const pending: { path: string; content: string }[] = []

  for (const url of entry.files) {
    let latest: string
    try {
      latest = await fetchTextRetry(url)
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e))
      return
    }
    const dest = resolveOutputPath(config.outputDir, entry.name, fileName(url))
    const current = await readFileSafe(dest)

    if (current === null) {
      console.log(`New file: ${dest}`)
      pending.push({ path: dest, content: latest })
    } else if (hasChanges(current, latest)) {
      console.log(`\n--- ${dest}`)
      console.log(diffLines(current, latest).join('\n'))
      pending.push({ path: dest, content: latest })
    }
  }

  if (pending.length === 0) {
    console.log(`${name} is already up to date.`)
    return
  }

  const shouldApply = opts.yes || (await confirm(`\nApply ${pending.length} change(s) to ${name}?`))

  if (shouldApply) {
    for (const { path, content } of pending) {
      await writeFileSafe(path, content)
    }
    console.log(`Updated ${name}.`)
  } else {
    console.log('Aborted. No files changed.')
  }
}

async function updateCheck(config: CascadeConfig): Promise<void> {
  const lock = await readLock()
  if (!lock || Object.keys(lock.items).length === 0) {
    console.log('No installed components found in cascivo.lock.')
    return
  }

  const registry = await fetchRegistry(config.registry)
  let outdated = 0

  for (const [name, entry] of Object.entries(lock.items)) {
    const current = findComponent(registry, name)
    if (!current) continue
    // Content hashes are the accurate signal (they change with every source
    // edit); the version compare is the fallback for older registries.
    if (current.fileHashes && Object.keys(current.fileHashes).length > 0) {
      const lockByBase = new Map(
        Object.entries(entry.files).map(([dest, hash]) => [dest.split('/').pop()!, hash]),
      )
      const changed = Object.entries(current.fileHashes).filter(
        ([file, hash]) => lockByBase.get(file) !== hash,
      )
      if (changed.length > 0) {
        console.log(
          `${name}: ${changed.length} file(s) changed upstream (${entry.version} → ${current.version})`,
        )
        outdated++
      }
    } else if (current.version !== entry.version) {
      console.log(`${name}: ${entry.version} → ${current.version}`)
      outdated++
    }
  }

  if (outdated > 0) {
    console.log(`${outdated} component(s) outdated.`)
    process.exitCode = 1
  } else {
    console.log('All components up to date.')
  }
}

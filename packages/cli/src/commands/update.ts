import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import type { CascadeConfig } from '../utils/config.js'
import { diffLines, hasChanges } from '../utils/diff.js'
import { readFileSafe, resolveOutputPath, writeFileSafe } from '../utils/fs.js'
import { fetchRegistry, fileName, findComponent } from '../utils/registry.js'

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const answer = (await rl.question(`${question} (y/N): `)).trim().toLowerCase()
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

export async function update(name: string | undefined, config: CascadeConfig): Promise<void> {
  if (!name) {
    console.error('Usage: cascade update <component>')
    return
  }

  const registry = await fetchRegistry(config.registry)
  const entry = findComponent(registry, name)
  if (!entry) {
    console.error(`Component "${name}" not found in registry. Run "cascade list".`)
    return
  }

  const pending: { path: string; content: string }[] = []

  for (const url of entry.files) {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
      return
    }
    const latest = await res.text()
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
    console.log(`${entry.name} is already up to date.`)
    return
  }

  if (await confirm(`\nApply ${pending.length} change(s) to ${entry.name}?`)) {
    for (const { path, content } of pending) {
      await writeFileSafe(path, content)
    }
    console.log(`Updated ${entry.name}.`)
  } else {
    console.log('Aborted. No files changed.')
  }
}

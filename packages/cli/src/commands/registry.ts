import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { buildRegistry, validateIndex, parseLegacyRegistry } from '@cascade-ui/registry'

export async function registryBuild(args: string[]): Promise<void> {
  let inFile = 'cascade-registry.json'
  let outDir = 'public/r'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--in' && args[i + 1]) {
      inFile = args[i + 1]!
      i++
    } else if (args[i] === '--out' && args[i + 1]) {
      outDir = args[i + 1]!
      i++
    }
  }

  const inPath = resolve(inFile)
  if (!existsSync(inPath)) {
    console.error(`cascade registry build: file not found: ${inPath}`)
    process.exitCode = 1
    return
  }

  const raw = JSON.parse(await readFile(inPath, 'utf8')) as unknown
  const indexBase = dirname(inPath)
  void indexBase

  let index = (() => {
    if (
      typeof raw === 'object' &&
      raw !== null &&
      (raw as Record<string, unknown>)['schemaVersion'] === 2
    ) {
      return raw
    }
    return parseLegacyRegistry(raw)
  })()

  const result = validateIndex(index)
  if (result.warnings.length > 0) {
    for (const w of result.warnings) console.warn(`warn: ${w}`)
  }
  if (!result.ok) {
    for (const e of result.errors) console.error(`error: ${e}`)
    process.exitCode = 1
    return
  }

  const outPath = resolve(outDir)
  await buildRegistry(index as Parameters<typeof buildRegistry>[0], outPath)
  console.log(`cascade registry build: wrote static output to ${outPath}`)
}

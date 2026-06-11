import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { collectMeta } from './meta.ts'
import type { Results } from './types.ts'

export function resultsPath(repoRoot: string) {
  return join(repoRoot, 'apps/bench/results/results.json')
}

export function loadResults(repoRoot: string): Results {
  const file = resultsPath(repoRoot)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Results
  return { meta: collectMeta(repoRoot) }
}

export function saveResults(repoRoot: string, results: Results) {
  results.meta = { ...collectMeta(repoRoot), chrome: results.meta.chrome }
  const file = resultsPath(repoRoot)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(results, null, 2)}\n`)
}

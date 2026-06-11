import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import type { Results } from './types.ts'

const repoRoot = new URL('../../../..', import.meta.url).pathname
const current = JSON.parse(
  readFileSync(`${repoRoot}/apps/bench/results/results.json`, 'utf8'),
) as Results
const committed = JSON.parse(
  execSync('git show HEAD:apps/bench/results/results.json', { cwd: repoRoot }).toString(),
) as Results

const failures: string[] = []

for (const [scenario, row] of Object.entries(committed.renders ?? {})) {
  for (const [lib, count] of Object.entries(row)) {
    const now = current.renders?.[scenario as keyof typeof current.renders]?.[lib as 'cascade']
    if (now !== count) failures.push(`renders ${scenario}/${lib}: committed ${count}, CI ${now}`)
  }
}

for (const [lib, app] of Object.entries(committed.bundle?.apps ?? {})) {
  const now = current.bundle?.apps[lib as 'cascade']
  if (!now || Math.abs(now.totalGzKb - app.totalGzKb) / app.totalGzKb > 0.02) {
    failures.push(`bundle ${lib}: committed ${app.totalGzKb}KB, CI ${now?.totalGzKb}KB (>2%)`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('✓ CI results match committed results within tolerance')

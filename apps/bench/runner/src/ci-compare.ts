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

// Root commits are exact integers for a single interaction — that exactness is the
// whole point of the gate, and a regression from 1 commit to 2 must fail. It stops
// holding for a scenario that fires twenty keystrokes as fast as Playwright can
// send them: React batches whatever arrives in the same tick, so carbon measured
// 32, 33 and 34 over three consecutive runs of the same commit. Compare small
// counts exactly and allow burst scenarios 10%, rather than blunting every cell
// with a flat ±1 that would hide exactly the regressions worth catching.
const EXACT_UPTO = 10
const BURST_TOLERANCE = 0.1

for (const [scenario, row] of Object.entries(committed.renders ?? {})) {
  for (const [lib, count] of Object.entries(row)) {
    const now = current.renders?.[scenario as keyof typeof current.renders]?.[lib as 'cascade']
    if (now === undefined) {
      failures.push(`renders ${scenario}/${lib}: committed ${count}, CI missing`)
      continue
    }
    const allowed = count <= EXACT_UPTO ? 0 : Math.ceil(count * BURST_TOLERANCE)
    if (Math.abs(now - count) > allowed) {
      const window = allowed === 0 ? '' : ` (±${allowed})`
      failures.push(`renders ${scenario}/${lib}: committed ${count}${window}, CI ${now}`)
    }
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

/**
 * Writes `api-surface.json` — the committed snapshot of the `1.x` public type surface.
 *
 * Run with `pnpm api:snapshot` AFTER a build; it reads each package's `dist`. `pnpm api:check`
 * compares the built surface against the committed file. See `extract.ts` for the rationale.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSnapshot } from './extract.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const OUT = join(REPO_ROOT, 'api-surface.json')

const snapshot = buildSnapshot(REPO_ROOT)
const packages = Object.keys(snapshot)
if (packages.length === 0) {
  console.error('api-surface: no built declarations found — run `pnpm build` first')
  process.exit(2)
}

const payload = {
  $comment:
    'Public type surface of the 1.x packages, extracted from built dist/*.d.ts by ' +
    'scripts/api-surface/generate.ts. Regenerate with `pnpm api:snapshot` after a build. ' +
    'A diff here is a semver decision: classify it as patch/minor/major per ' +
    'docs/UPGRADING.md and record it in the changeset.',
  packages: snapshot,
}

writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`)

const exportCount = Object.values(snapshot)
  .flatMap((entries) => Object.values(entries))
  .reduce((n, e) => n + e.values.length + e.types.length, 0)
console.log(
  `api-surface: ${packages.length} packages, ${exportCount} exported names -> api-surface.json`,
)

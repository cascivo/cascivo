#!/usr/bin/env node
/**
 * `pnpm lint:host-strict` — enforces, in oxlint, the objective lint classes a
 * strict host ESLint config (e.g. @tanstack/eslint-config) flags in the source
 * `cascivo add` copies into adopter projects (packages/components/src), so a
 * fresh adopter never inherits lint failures in code they didn't write.
 *
 * It invokes the real oxlint binary directly with the config beside this file:
 * `vp lint` injects its own `-c` (its curated rule set) and rejects a second
 * one, so the repo's default lint can't carry these extra rules — this runs
 * oxlint out-of-band instead. Zero new dependencies; oxlint already ships with
 * vp. The rules and the scope-off list stay in sync with
 * docs/USING-WITH-STRICT-ESLINT.md.
 */
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', '..', '..')

/**
 * Locate the real oxlint binary. `node_modules/.bin/oxlint` is a vp wrapper
 * ("IDE use only"), so resolve the actual launcher from the pnpm store. The
 * glob adapts across oxlint version bumps.
 */
function findOxlintBin() {
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm')
  const candidates = readdirSync(pnpmDir)
    .filter((d) => d.startsWith('oxlint@'))
    .map((d) => join(pnpmDir, d, 'node_modules', 'oxlint', 'bin', 'oxlint'))
  const bin = candidates.find((p) => existsSync(p))
  if (!bin) {
    console.error('lint:host-strict: could not locate the oxlint binary under node_modules/.pnpm.')
    process.exit(1)
  }
  return bin
}

const bin = findOxlintBin()
const config = join(here, '.oxlintrc.json')
const target = join('packages', 'components', 'src')

const result = spawnSync(bin, ['-c', config, target], { cwd: ROOT, stdio: 'inherit' })
if (result.status !== 0) {
  console.error(
    '\nlint:host-strict: copied component source must pass the objective host-lint rules. ' +
      'See docs/USING-WITH-STRICT-ESLINT.md.',
  )
}
process.exit(result.status ?? 1)

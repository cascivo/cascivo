#!/usr/bin/env node
/**
 * `pnpm lint:host-strict` — a FAST SUBSET of the host-lint contract, in oxlint.
 *
 * ⚠ This guard covers only the classes oxlint can express. It is NOT the authority on
 * "does vendored source pass a strict host config", and reading it as such is how 117
 * real ESLint errors shipped: oxlint implements none of the React-Compiler-backed
 * `react-hooks/refs`, `react-hooks/purity`, or `react-hooks/static-components`, and this
 * file's header used to claim it enforced "the objective lint classes a strict host
 * ESLint config flags" without that caveat.
 *
 * The authority is `pnpm lint:host-eslint` (scripts/checks/host-lint/eslint), which runs
 * real ESLint with the adopter's real plugins. Keep this one for speed: it is offline and
 * needs no node_modules beyond what vp already ships.
 *
 * It invokes the real oxlint binary directly with the config beside this file:
 * `vp lint` injects its own `-c` (its curated rule set) and rejects a second
 * one, so the repo's default lint can't carry these extra rules — this runs
 * oxlint out-of-band instead. Zero new dependencies; oxlint already ships with
 * vp. The rules and the scope-off list stay in sync with
 * docs/USING-WITH-STRICT-ESLINT.md.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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
  // Newest first: a store that still holds an older oxlint (left from before a vp bump) must
  // not mask what CI's clean install runs.
  candidates.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
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

/*
 * oxlint 1.85 resolves a config's `ignorePatterns` inside the config file's own directory
 * (and rejects `..`), so the list in .oxlintrc.json no longer matches packages/components.
 * Pass the same list as `--ignore-pattern`, which resolves against the cwd.
 */
const { ignorePatterns = [] } = JSON.parse(
  readFileSync(config, 'utf8').replace(/^\s*\/\/.*$/gm, ''),
)
const ignoreArgs = ignorePatterns.map((pattern) => `--ignore-pattern=${pattern}`)

const result = spawnSync(bin, ['-c', config, ...ignoreArgs, target], {
  cwd: ROOT,
  stdio: 'inherit',
})
if (result.status !== 0) {
  console.error(
    '\nlint:host-strict: copied component source must pass the objective host-lint rules. ' +
      'See docs/USING-WITH-STRICT-ESLINT.md.',
  )
}
process.exit(result.status ?? 1)

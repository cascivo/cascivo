/**
 * Attach the GitHub Actions trusted publisher to every published package name.
 *
 *   npm login
 *   pnpm release:trust                       # every non-private packages/* name
 *   pnpm release:trust @cascivo/solid        # only the names given
 *   pnpm release:trust --dry-run             # show what npm would change
 *
 * Run after `pnpm release:bootstrap`: npm attaches a trusted publisher only to a
 * name that already exists. Names already trusting this repo's release.yml are
 * skipped, so the script is safe to re-run. `npm trust` arrived after npm 10,
 * so it runs through a pinned npm major rather than the local one.
 */

import { execFileSync } from 'node:child_process'
import { fetchVersions, listPublishable } from '../lib/npm-publishable.mjs'
import { trustGithubArgs, trustsRepo } from '../lib/npm-trust.mjs'

const NPM = ['-y', 'npm@12']
const REPO = 'cascivo/cascivo'
const WORKFLOW = 'release.yml'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const requested = args.filter((a) => !a.startsWith('--'))

/** @param {string} message */
function fail(message) {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

/** @param {string[]} npmArgs @param {'pipe' | 'inherit'} stdio */
function npm(npmArgs, stdio) {
  return execFileSync('npx', [...NPM, ...npmArgs], { encoding: 'utf8', stdio })
}

/** @param {string} name */
function alreadyTrusted(name) {
  try {
    /** @type {unknown} */
    const parsed = JSON.parse(npm(['trust', 'list', name, '--json'], 'pipe') || 'null')
    return trustsRepo(parsed, REPO, WORKFLOW)
  } catch {
    // No relationship yet, or an older output format: let `trust github` decide.
    return false
  }
}

try {
  npm(['whoami'], 'pipe')
} catch {
  fail('not logged in to npm: run `npm login` first')
}

const known = listPublishable().map((p) => p.name)
const unknownNames = requested.filter((n) => !known.includes(n))
if (unknownNames.length > 0) fail(`not a published workspace package: ${unknownNames.join(', ')}`)
const names = requested.length > 0 ? requested : known

/** @type {string[]} */
const missing = []
/** @type {string[]} */
const skipped = []
/** @type {string[]} */
const added = []

for (const name of names.toSorted()) {
  const { versions } = await fetchVersions(name)
  if (versions === null) {
    missing.push(name)
    continue
  }
  if (alreadyTrusted(name)) {
    skipped.push(name)
    continue
  }
  console.log(`\n→ ${name}`)
  const trustArgs = trustGithubArgs(name, REPO, WORKFLOW)
  // Inherit stdio so npm can prompt for a 2FA one-time password.
  npm(dryRun ? [...trustArgs, '--dry-run'] : trustArgs, 'inherit')
  added.push(name)
}

console.log(`\n${dryRun ? 'would add' : 'added'}: ${added.length ? added.join(', ') : 'none'}`)
if (skipped.length) console.log(`already trusted: ${skipped.join(', ')}`)
if (missing.length) {
  console.log(`not on npm yet (run \`pnpm release:bootstrap\` first): ${missing.join(', ')}`)
}

/**
 * Attach the GitHub Actions trusted publisher to every published package name that lacks one.
 *
 *   npm login
 *   pnpm release:trust                       # every non-private packages/* name
 *   pnpm release:trust @cascivo/solid        # only the names given
 *   pnpm release:trust --dry-run             # show what npm would change
 *   pnpm release:trust --force @cascivo/ai   # ask npm even if CI already publishes it
 *
 * Run after `pnpm release:bootstrap`: npm attaches a trusted publisher only to a name
 * that already exists. A name whose latest version CI published through a trusted
 * publisher is skipped. That check reads public registry data: `npm trust list` needs
 * 2FA for every package and prints one JSON block per config, so it cannot gate a loop.
 * A failure (e.g. npm's 409 for a config that already exists) is reported, not fatal.
 * `npm trust` arrived after npm 10, so it runs through a pinned npm major.
 */

import { execFileSync } from 'node:child_process'
import { fetchVersions, listPublishable, REGISTRY } from '../lib/npm-publishable.mjs'
import { publishedByTrustedPublisher, trustGithubArgs } from '../lib/npm-trust.mjs'

const NPM = ['-y', 'npm@12']
const REPO = 'cascivo/cascivo'
const WORKFLOW = 'release.yml'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const requested = args.filter((a) => !a.startsWith('--'))

/** @param {string} message */
function fail(message) {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

// pnpm exports its own settings as npm_config_* (auto-install-peers, …); npm 12 warns
// on every one, so hand npm a clean environment.
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_config_')),
)

/** @param {string[]} npmArgs @param {'pipe' | 'inherit'} stdio */
function npm(npmArgs, stdio) {
  return execFileSync('npx', [...NPM, ...npmArgs, '--loglevel=error'], {
    encoding: 'utf8',
    stdio,
    env,
  })
}

/** @param {string} name */
async function ciPublishes(name) {
  try {
    const res = await fetch(`${REGISTRY}/${encodeURIComponent(name)}/latest`)
    if (!res.ok) return false
    /** @type {unknown} */
    const doc = await res.json()
    return publishedByTrustedPublisher(doc)
  } catch {
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
/** @type {string[]} */
const failed = []

for (const name of names.toSorted()) {
  const { versions } = await fetchVersions(name)
  if (versions === null) {
    missing.push(name)
    continue
  }
  if (!force && (await ciPublishes(name))) {
    skipped.push(name)
    continue
  }
  console.log(`\n→ ${name}`)
  const trustArgs = trustGithubArgs(name, REPO, WORKFLOW)
  try {
    // Inherit stdio so npm can run its 2FA prompt.
    npm(dryRun ? [...trustArgs, '--dry-run'] : trustArgs, 'inherit')
    added.push(name)
  } catch {
    failed.push(name)
  }
}

console.log(`\n${dryRun ? 'would add' : 'added'}: ${added.length ? added.join(', ') : 'none'}`)
if (skipped.length) console.log(`already published by CI (skipped): ${skipped.join(', ')}`)
if (missing.length) {
  console.log(`not on npm yet (run \`pnpm release:bootstrap\` first): ${missing.join(', ')}`)
}
if (failed.length) {
  console.log(`failed: ${failed.join(', ')}`)
  console.log('a 409 means a trust config already exists: check `npx npm@12 trust list <name>`')
  process.exitCode = 1
}

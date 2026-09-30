/**
 * Release preflight — every publishable package name already exists on npm.
 *
 * npm attaches a trusted publisher to a package that already exists, so a name
 * npm has never seen cannot be created over OIDC. `changeset publish` then dies
 * with `E404 … PUT https://registry.npmjs.org/<name>`, and because that failure
 * takes the whole publish step down, the release never reaches the version step
 * either. That is what stranded every release from 2026-08-21 on: the run took
 * five minutes to reach a 404 whose text never mentions the one-time manual
 * publish it is really asking for (docs/RELEASING.md § First-publish bootstrap).
 *
 * A missing name is worse than its own package not shipping: a dependent that
 * DOES publish carries a dependency npm cannot resolve, so `npm install` of the
 * dependent breaks for every adopter. Both cases are reported below.
 *
 * A registry that neither confirms nor denies a name (network error, 5xx) is not
 * evidence of anything — it is reported and does not fail the release.
 */

import { findMissing, listPublishable } from '../lib/npm-publishable.mjs'

const published = listPublishable()
const { missing, unknown } = await findMissing(published)

for (const note of unknown) {
  console.log(`? could not check ${note} — not treated as missing`)
}

if (missing.length === 0) {
  console.log(`✓ all ${published.length} publishable package names exist on npm`)
  process.exit(0)
}

for (const pkg of missing) {
  const dependents = published
    .filter((other) => pkg.name in other.dependencies)
    .map((other) => other.name)
  console.error(`✗ ${pkg.name} has never been published to npm (packages/${pkg.dir})`)
  if (dependents.length > 0) {
    console.error(
      `  ${dependents.join(', ')} depend${dependents.length === 1 ? 's' : ''} on it — publishing ${dependents.length === 1 ? 'it' : 'them'} would ship an unresolvable dependency`,
    )
  }
}

console.error(
  [
    '',
    'npm cannot create a package name over OIDC — a trusted publisher can only be',
    'attached to a package that already exists. Publish each name once by hand, then',
    'attach the publisher, and this workflow takes over again:',
    '',
    '  npm login',
    '  pnpm release:bootstrap   # builds, dry-runs, confirms, then publishes only the missing names',
    '',
    '  # then, per package: npmjs.com/package/<name> → Settings → Trusted Publisher',
    '  #   org cascivo, repo cascivo, workflow release.yml, no environment',
    '',
    'Full runbook: docs/RELEASING.md § First-publish bootstrap.',
  ].join('\n'),
)
process.exit(1)

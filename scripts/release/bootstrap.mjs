/**
 * First-publish bootstrap — publish, by hand, every package name npm has never seen.
 *
 *   npm login
 *   pnpm release:bootstrap            # build → dry-run → confirm → publish
 *   pnpm release:bootstrap --dry-run  # stop after the dry-run
 *
 * The Release workflow publishes over OIDC, and npm can only attach a trusted
 * publisher to a name that already exists, so each new name has to be created
 * once from a maintainer's machine (docs/RELEASING.md § Adding a package to the
 * release after the bootstrap). This publishes exactly the names
 * `scripts/checks/npm-bootstrap.mjs` reports missing — at the version already in
 * the tree — and nothing else: stranded versions of existing packages stay the
 * workflow's job, where they get provenance.
 *
 * Each package is packed with `pnpm pack` (which rewrites `workspace:^` to real
 * ranges) and the tarball is published with `npm publish --provenance=false`.
 * Provenance needs CI's OIDC token and every package's `publishConfig` turns it
 * on; npm lets a command-line flag override `publishConfig`, but not an
 * `NPM_CONFIG_PROVENANCE` env var.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fetchVersions, findMissing, listPublishable, REPO_ROOT } from '../lib/npm-publishable.mjs'

const dryRunOnly = process.argv.includes('--dry-run')

/** @param {string} message */
function fail(message) {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, capture?: boolean }} [options]
 */
function run(cmd, args, { cwd = REPO_ROOT, capture = false } = {}) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
  })
}

// 1. Who is publishing — fail before a multi-minute build, not after it.
let npmUser
try {
  npmUser = run('npm', ['whoami'], { capture: true }).trim()
} catch {
  fail('not logged in to npm. Run `npm login` first, then re-run `pnpm release:bootstrap`.')
}
console.log(`npm user: ${npmUser}`)

// 2. Publish committed code only — what lands on npm must be reproducible from git.
const dirty = run('git', ['status', '--porcelain'], { capture: true }).trim()
if (dirty !== '') {
  fail(
    `the working tree has uncommitted changes:\n${dirty}\nPublish from a clean checkout of main.`,
  )
}
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { capture: true }).trim()
if (branch !== 'main') console.warn(`! on branch '${branch}', not main`)

// 3. Which names npm lacks.
const published = listPublishable()
const { missing, unknown } = await findMissing(published)
for (const note of unknown) console.warn(`! could not check ${note} — not treated as missing`)
if (missing.length === 0) {
  console.log(
    `✓ all ${published.length} publishable package names exist on npm — nothing to bootstrap`,
  )
  process.exit(0)
}

// 4. Dependencies first: a missing package may depend on another missing one
//    (@cascivo/app → @cascivo/data), and npm would accept the dependent with a
//    range it cannot resolve yet.
const missingNames = new Set(missing.map((pkg) => pkg.name))
/** @type {typeof missing} */
const ordered = []
/** @param {(typeof missing)[number]} pkg @param {string[]} path */
function visit(pkg, path) {
  if (ordered.includes(pkg)) return
  if (path.includes(pkg.name)) fail(`dependency cycle: ${[...path, pkg.name].join(' → ')}`)
  for (const dep of Object.keys(pkg.dependencies)) {
    const target = missing.find((other) => other.name === dep)
    if (target) visit(target, [...path, pkg.name])
  }
  ordered.push(pkg)
}
for (const pkg of missing) visit(pkg, [])

// 5. Every internal dependency must resolve once published: either it is in this
//    batch, or npm already has the exact version the tree pins (`workspace:^`
//    becomes `^<that version>`).
const byName = new Map(published.map((pkg) => [pkg.name, pkg]))
const unresolvable = []
for (const pkg of ordered) {
  for (const dep of Object.keys(pkg.dependencies)) {
    const internal = byName.get(dep)
    if (!internal || missingNames.has(dep)) continue
    const { versions } = await fetchVersions(dep)
    if (versions && !versions.includes(internal.version)) {
      unresolvable.push(`${pkg.name} → ${dep}@${internal.version} (not on npm)`)
    }
  }
}
if (unresolvable.length > 0) {
  fail(
    `these would publish with dependencies npm cannot resolve:\n  ${unresolvable.join('\n  ')}\n` +
      'Let the Release workflow publish the pending versions first, or bootstrap from the commit that published them.',
  )
}

console.log(`\nTo bootstrap, in this order:`)
for (const pkg of ordered) console.log(`  ${pkg.name}@${pkg.version}  (packages/${pkg.dir})`)

// 6. Build and lint the packed artifacts exactly as the Release workflow does.
console.log('\n→ pnpm run release:build')
try {
  run('pnpm', ['run', 'release:build'])
} catch {
  fail('release:build failed — nothing was published.')
}

// 7. Pack each package once; the dry-run and the real publish ship the same tarball.
const outDir = mkdtempSync(join(tmpdir(), 'cascivo-bootstrap-'))
process.on('exit', () => rmSync(outDir, { recursive: true, force: true }))
/** @type {Map<string, string>} */
const tarballs = new Map()
for (const pkg of ordered) {
  const dest = join(outDir, pkg.dir)
  run('pnpm', ['pack', '--pack-destination', dest], { cwd: join(REPO_ROOT, 'packages', pkg.dir) })
  const [file] = readdirSync(dest).filter((f) => f.endsWith('.tgz'))
  if (!file) fail(`pnpm pack produced no tarball for ${pkg.name}`)
  tarballs.set(pkg.name, join(dest, file))
}

/** @param {boolean} dryRun */
function publishAll(dryRun) {
  for (const pkg of ordered) {
    const tarball = /** @type {string} */ (tarballs.get(pkg.name))
    console.log(`\n→ npm publish ${pkg.name}@${pkg.version}${dryRun ? ' (dry-run)' : ''}`)
    const args = ['publish', tarball, '--access', 'public', '--provenance=false']
    if (dryRun) args.push('--dry-run')
    try {
      run('npm', args, { cwd: outDir })
    } catch {
      fail(
        `npm publish failed for ${pkg.name}.` +
          (dryRun ? '' : ' Packages before it in the list above are live; re-running skips them.'),
      )
    }
  }
}

// 8. Dry-run everything before anything goes live.
publishAll(true)
console.log(`\n✓ dry-run passed for ${ordered.length} package(s)`)
if (dryRunOnly) process.exit(0)

if (!process.stdin.isTTY) fail('refusing to publish without a terminal to confirm on.')
const rl = createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question(
  `\nPublish ${ordered.map((pkg) => pkg.name).join(', ')} to npm as ${npmUser}? [y/N] `,
)
rl.close()
if (!/^y(es)?$/i.test(answer.trim())) {
  console.log('Aborted — nothing was published.')
  process.exit(0)
}

// 9. The real publish, same order, same tarballs.
publishAll(false)

console.log(
  `\n✓ published ${ordered.length} package(s). Now, for each one, attach the trusted publisher`,
)
console.log(
  '  (Settings → Trusted Publisher: org cascivo, repo cascivo, workflow release.yml, no environment):',
)
for (const pkg of ordered) console.log(`  https://www.npmjs.com/package/${pkg.name}/access`)
console.log(
  '\nThen re-run the Release workflow on main (Actions → Release → Run workflow).\n' +
    'This bootstrap creates no git tags — the next CI release tags what it publishes.',
)

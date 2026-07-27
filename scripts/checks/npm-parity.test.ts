/**
 * npm-parity canary — does the published tarball actually match this checkout?
 *
 * Three plans in this directory carried "implemented on `main`, not yet published" as the
 * explanation for why adopters kept meeting defects that were supposedly fixed. For the
 * 2026-07-26 pair that explanation was **wrong**: `@cascivo/react@0.12.0` was on npm before
 * the reports, and its `dist/index.d.ts` matched `main` byte for byte — including the missing
 * TSDoc that bit one adopter and the missing `text-decoration` that bit the other. The defects
 * were genuinely shipped; nothing lagged.
 *
 * That was worth knowing, and it was only knowable by unpacking the tarball by hand. So this
 * makes the question permanently checkable instead of assumed: for each published package,
 * compare what npm serves against what this checkout builds. It answers "is `main` ahead of
 * npm?" with evidence, in either direction, so no future plan has to guess.
 *
 * **Opt-in — it needs the network and a prior `pnpm build`:**
 *   `pnpm npm:parity`            compare the published `latest` against this build
 *   `NPM_PARITY_STRICT=1 …`      fail (rather than report) when they diverge
 *
 * Divergence is not automatically a bug: between a merge and a release, `main` is *supposed*
 * to be ahead. That is why the default is to report, and why the release runbook is where
 * `NPM_PARITY_STRICT=1` belongs — there, a difference means the publish did not take.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const STRICT = process.env['NPM_PARITY_STRICT'] === '1'
const OFFLINE = process.env['NPM_PARITY_OFFLINE'] === '1'

/** Published packages whose built artifacts an adopter actually reads. */
const PACKAGES = [
  { name: '@cascivo/react', dir: 'packages/react' },
  { name: '@cascivo/charts', dir: 'packages/charts' },
  { name: '@cascivo/core', dir: 'packages/core' },
]

/**
 * The artifacts to compare, derived from the package's own `exports` map rather than
 * hardcoded. Hardcoding got `@cascivo/core` wrong on the first attempt — its types are
 * `dist/index.d.mts`, not `dist/index.d.ts` — and the check reported a silent pass for a file
 * it never compared. Deriving from the export map is the same fix this repo applied to
 * distribution channels: read the truth, don't restate it.
 */
function artifactsOf(dir: string): string[] {
  const pkg = JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8')) as {
    exports?: Record<string, unknown>
  }
  const found = new Set<string>()
  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      // Only built artifacts an adopter reads: types and stylesheets. JS bundles carry
      // build-tool fingerprints that churn without meaning.
      if (/\.(d\.m?ts|css)$/.test(value)) found.add(value.replace(/^\.\//, ''))
      return
    }
    if (value && typeof value === 'object') for (const v of Object.values(value)) walk(v)
  }
  walk(pkg.exports ?? {})
  return [...found].sort()
}

interface Report {
  name: string
  publishedVersion: string
  localVersion: string
  differing: string[]
  missingLocally: string[]
}

function localVersion(dir: string): string {
  return JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8')).version as string
}

/**
 * Packages with an unreleased changeset. Between a merge and the release PR, `main` is
 * *supposed* to differ from npm at the same version number — the bump has not happened yet.
 * A pending changeset is the repo's own statement that a bump is coming, so it is the signal
 * that separates "work in flight" from "a change shipped without a version bump".
 */
function packagesWithPendingChangeset(): Set<string> {
  const pending = new Set<string>()
  const dir = join(ROOT, '.changeset')
  if (!existsSync(dir)) return pending
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md') || file === 'README.md') continue
    const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, file), 'utf8'))
    if (!front) continue
    for (const m of front[1]!.matchAll(/^'([^']+)':/gm)) pending.add(m[1]!)
  }
  return pending
}

const PENDING = packagesWithPendingChangeset()

/** Download the published tarball into a temp dir and return its extracted `package/` path. */
function fetchPublished(name: string): { dir: string; version: string } | null {
  const work = mkdtempSync(join(tmpdir(), 'cascivo-npm-parity-'))
  try {
    const version = execFileSync('npm', ['view', name, 'version'], {
      encoding: 'utf8',
      timeout: 120_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    execFileSync('npm', ['pack', `${name}@${version}`, '--silent'], {
      cwd: work,
      timeout: 300_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const tgz = execFileSync('sh', ['-c', 'ls *.tgz'], { cwd: work, encoding: 'utf8' }).trim()
    execFileSync('tar', ['-xzf', tgz], { cwd: work, timeout: 120_000 })
    return { dir: join(work, 'package'), version }
  } catch {
    return null // offline / not published yet — reported as skipped, never a failure
  }
}

function compare(pkg: (typeof PACKAGES)[number]): Report | null {
  const published = fetchPublished(pkg.name)
  if (!published) return null

  const artifacts = artifactsOf(pkg.dir)
  assert.ok(
    artifacts.length > 0,
    `${pkg.name}: no comparable artifacts found in its exports map — the derivation is broken`,
  )
  const differing: string[] = []
  const missingLocally: string[] = []
  for (const artifact of artifacts) {
    const localPath = join(ROOT, pkg.dir, artifact)
    const publishedPath = join(published.dir, artifact)
    if (!existsSync(localPath)) {
      missingLocally.push(artifact)
      continue
    }
    if (!existsSync(publishedPath)) {
      differing.push(`${artifact} (absent from the published tarball)`)
      continue
    }
    if (readFileSync(localPath, 'utf8') !== readFileSync(publishedPath, 'utf8')) {
      differing.push(artifact)
    }
  }
  rmSync(join(published.dir, '..'), { recursive: true, force: true })
  return {
    name: pkg.name,
    publishedVersion: published.version,
    localVersion: localVersion(pkg.dir),
    differing,
    missingLocally,
  }
}

describe('npm parity — published artifacts vs this checkout', () => {
  if (OFFLINE) {
    it('skipped (NPM_PARITY_OFFLINE=1)', () => {
      assert.ok(true)
    })
    return
  }

  for (const pkg of PACKAGES) {
    it(`${pkg.name}`, () => {
      const report = compare(pkg)
      if (!report) {
        console.log(`  ${pkg.name}: skipped (npm unreachable or not published)`)
        return
      }

      // A missing local build makes the comparison meaningless — say so loudly rather than
      // passing silently, which is how the first version of this check hid `@cascivo/core`.
      assert.deepEqual(
        report.missingLocally,
        [],
        `${pkg.name}: ${report.missingLocally.join(', ')} is missing locally — run \`pnpm build\` ` +
          'before this check, or the comparison silently passes on files it never read',
      )

      const versionSkew = report.publishedVersion !== report.localVersion
      const summary =
        `  ${pkg.name}: npm ${report.publishedVersion}, local ${report.localVersion}` +
        (report.differing.length === 0
          ? ' — artifacts identical'
          : ` — differs in ${report.differing.join(', ')}`)
      console.log(summary)

      if (report.differing.length === 0) return

      // Two legitimate reasons the artifacts differ at this point in the cycle:
      //   1. the local version is already ahead of npm (release PR merged, publish pending);
      //   2. a changeset for this package is pending, so the bump has not happened yet.
      const expected = versionSkew || PENDING.has(pkg.name)
      if (expected && !STRICT) {
        console.log(
          `    ↳ expected: ${versionSkew ? 'local version is ahead' : 'a changeset is pending'}`,
        )
        return
      }

      assert.ok(
        !STRICT,
        `${pkg.name} @ ${report.publishedVersion} does not match this checkout's build ` +
          `(${report.differing.join(', ')}). Under NPM_PARITY_STRICT the publish is expected ` +
          'to have taken — re-run the release, or investigate what the tarball actually contains.',
      )
      if (!expected) {
        assert.fail(
          `${pkg.name} claims the SAME version as npm (${report.publishedVersion}) but its ` +
            `built ${report.differing.join(', ')} differs, and NO changeset is pending for it. ` +
            'Either the publish did not take, or a change landed without a version bump — ' +
            'an adopter running `pnpm add` gets something other than what this repo says it ships.',
        )
      }
    })
  }
})

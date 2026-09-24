/**
 * A change to a published package must ship — i.e. be named in a changeset.
 *
 * #235 changed three published packages and its changeset named one. `@cascivo/docs`
 * and `@cascivo/docspack` were merged and then sat unpublishable: their half of the
 * work existed only on `main`, which for an adopter is the same as not existing
 * (`docs/RELEASING.md`, "Release cadence is a correctness property"). Nothing caught
 * it, because nothing was looking.
 *
 * The naive form of this check — "a file under `packages/<dir>/` needs a changeset for
 * that package" — would have caught NONE of it. Both misses came through the two
 * indirections below, so they are the point of the check rather than a refinement of it:
 *
 * 1. CONTENT dependencies. `@cascivo/docs`, `@cascivo/docspack` and `@cascivo/mcp` bake
 *    files from `apps/site/public/` and the root `registry.json` into their published
 *    artifact at build time. Their own directory does not have to change for their
 *    shipped bytes to change. This is what #235 hit.
 * 2. SOURCE dependencies. `@cascivo/react` compiles from `packages/components/src` and
 *    `packages/layouts/src` — directories belonging to PRIVATE packages, which a
 *    published-packages-only sweep never looks at. A component fix that names no
 *    package would strand the same way.
 *
 * (2) is derived from the imports themselves so it cannot drift. (1) cannot be — it is
 * file copying inside build scripts — so it is declared, with the reading line cited.
 *
 * Satisfying the check follows changesets' own semantics, not string equality: naming
 * any member of a `fixed` group in .changeset/config.json releases the whole group, so
 * any member counts for all of them.
 *
 * Scope: this compares the working tree against the merge base with the base branch. On
 * `main`, and anywhere the base cannot be resolved, there is nothing to compare and the
 * check skips rather than passing vacuously under a name that suggests otherwise.
 */

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/**
 * Published packages that bake files from OUTSIDE their own directory into what they
 * publish. Each prefix is read by the cited build script; a change under it changes the
 * package's shipped bytes without touching its directory.
 */
const CONTENT_SOURCES: Record<string, readonly string[]> = {
  // packages/docs/scripts/build-content.mjs — copies FILES + DIRS out of
  // apps/site/public/, and apps/site/public/docs/ as content/guides/.
  '@cascivo/docs': ['apps/site/public/'],
  // packages/docspack/src/payload.ts — buildPayload() reads apps/site/public/ and
  // the root registry.json.
  '@cascivo/docspack': ['apps/site/public/', 'registry.json'],
  // packages/mcp/scripts/postbuild.mjs — bundles registry.json plus the named
  // catalogs and apps/site/public/context/ next to the built server.
  '@cascivo/mcp': [
    'registry.json',
    'apps/site/public/context',
    'apps/site/public/tokens.catalog.json',
    'apps/site/public/icons.catalog.json',
    'apps/site/public/tokens.variants.json',
    'apps/site/public/marketplace.json',
  ],
}

/** Paths inside a package that reach no adopter, so cannot need a release. */
const NON_SHIPPING = [
  /(^|\/)CHANGELOG\.md$/,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /(^|\/)(__tests__|__fixtures__|test|tests)\//,
  /\.stories\.[jt]sx?$/,
  /(^|\/)tsconfig[^/]*\.json$/,
  /(^|\/)vitest\.config\./,
  // The email primitive gallery and its generator write only into apps/site and docs/ —
  // nothing under packages/email/dist, which is all the package publishes ("files": ["dist"]).
  /^packages\/email\/scripts\/(generate-primitives\.ts|lib\/gallery\.ts)$/,
]

type Pkg = { name: string; dir: string; private: boolean }

function packages(): Pkg[] {
  const root = join(REPO_ROOT, 'packages')
  const out: Pkg[] = []
  for (const dir of readdirSync(root)) {
    const manifest = join(root, dir, 'package.json')
    try {
      if (!statSync(manifest).isFile()) continue
    } catch {
      continue
    }
    const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as { name?: string; private?: boolean }
    if (pkg.name) out.push({ name: pkg.name, dir, private: pkg.private === true })
  }
  return out
}

/** Every file under `dir`, repo-relative. */
function walk(dir: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(relative(REPO_ROOT, path))
  }
  return out
}

/**
 * published package -> other package DIRECTORIES its source compiles from.
 *
 * Read off the relative imports so a new cross-package import is covered the day it is
 * written. `@cascivo/react` is the live case: it re-exports straight out of
 * `packages/components/src`, whose package is private and so invisible to a
 * published-only sweep.
 */
function sourceDeps(pkgs: Pkg[]): Map<string, Set<string>> {
  const deps = new Map<string, Set<string>>()
  for (const pkg of pkgs) {
    if (pkg.private) continue
    for (const file of walk(join(REPO_ROOT, 'packages', pkg.dir, 'src'))) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) continue
      const source = readFileSync(join(REPO_ROOT, file), 'utf8')
      for (const [, spec] of source.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g)) {
        const target = relative(REPO_ROOT, resolve(dirname(join(REPO_ROOT, file)), spec))
        const owner = /^packages\/([^/]+)\//.exec(target)?.[1]
        if (owner && owner !== pkg.dir) {
          const set = deps.get(pkg.name) ?? new Set<string>()
          set.add(owner)
          deps.set(pkg.name, set)
        }
      }
    }
  }
  return deps
}

/** Packages named across every pending changeset, expanded over `fixed` groups. */
function released(fixed: readonly (readonly string[])[]): Set<string> {
  const named = new Set<string>()
  const dir = join(REPO_ROOT, '.changeset')
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.md') || entry === 'README.md') continue
    const lines = readFileSync(join(dir, entry), 'utf8').split('\n')
    if (lines[0]?.trim() !== '---') continue
    for (const line of lines.slice(1)) {
      if (line.trim() === '---') break
      const name = /^\s*['"]?(@?[\w./-]+?)['"]?\s*:\s*(major|minor|patch)\s*$/.exec(line)?.[1]
      if (name) named.add(name)
    }
  }
  for (const group of fixed) {
    if (group.some((name) => named.has(name))) for (const name of group) named.add(name)
  }
  return named
}

/**
 * The changesets release commit is the one diff that touches published packages and
 * correctly carries no changeset: it CONSUMES them. It also regenerates every
 * version-stamped artifact (925 files on #225), so "only version files changed" does not
 * identify it — the deletion does. Requiring a changeset here would deadlock the release.
 */
function consumesChangesets(status: string): boolean {
  return status.split('\n').some((line) => /^D\s+\.changeset\/(?!README\.md$).+\.md$/.test(line))
}

/** Working tree vs the merge base with the base branch; null when unresolvable. */
function changedFiles(baseBranch: string): { files: string[]; status: string } | null {
  const git = (...args: string[]): string =>
    execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

  let base: string | null = null
  for (const ref of [process.env['CHANGESET_BASE'], `origin/${baseBranch}`, baseBranch]) {
    if (!ref) continue
    try {
      base = git('merge-base', ref, 'HEAD')
      break
    } catch {
      /* ref not present in this clone — try the next */
    }
  }
  if (base === null) return null
  try {
    if (base === git('rev-parse', 'HEAD')) return { files: [], status: '' }
  } catch {
    return null
  }
  const status = git('diff', '--name-status', base)
  const tracked = git('diff', '--name-only', base)
  const untracked = git('ls-files', '--others', '--exclude-standard')
  return {
    files: [...tracked.split('\n'), ...untracked.split('\n')].filter(Boolean),
    status,
  }
}

describe('changeset coverage — a changed published package is released', () => {
  const config = JSON.parse(readFileSync(join(REPO_ROOT, '.changeset/config.json'), 'utf8')) as {
    baseBranch?: string
    fixed?: readonly (readonly string[])[]
  }
  const pkgs = packages()

  it('every published package the diff reaches is named in a changeset', (t) => {
    const diff = changedFiles(config.baseBranch ?? 'main')
    if (diff === null) {
      // A diff-based guard that cannot find its base does not fail — it passes, silently,
      // under a name that reads like coverage. That is the vacuous pass ci.yml warns about,
      // so in CI it is an error: the guards job checks out with fetch-depth: 0 for this.
      assert.ok(
        !process.env['CI'],
        `no merge base with '${config.baseBranch ?? 'main'}' — this check cannot run and ` +
          'would otherwise pass without checking anything. The CI job needs ' +
          'actions/checkout with `fetch-depth: 0`.',
      )
      t.skip('no merge base with the base branch in this clone — nothing to compare')
      return
    }
    const changed = diff.files
    if (changed.length === 0) {
      t.skip('working tree matches the base branch — nothing to compare')
      return
    }
    if (consumesChangesets(diff.status)) {
      t.skip('changesets release commit — it consumes changesets, it does not need one')
      return
    }

    const byDir = new Map(pkgs.map((p) => [p.dir, p]))
    const deps = sourceDeps(pkgs)
    // package dir -> published packages compiled from it (itself included when published)
    const consumers = new Map<string, Set<string>>()
    for (const pkg of pkgs) {
      if (!pkg.private) consumers.set(pkg.dir, new Set([pkg.name]))
    }
    for (const [name, dirs] of deps) {
      for (const dir of dirs) {
        const set = consumers.get(dir) ?? new Set<string>()
        set.add(name)
        consumers.set(dir, set)
      }
    }

    /** implicated package -> the reason, for the failure message */
    const implicated = new Map<string, string>()
    for (const file of changed) {
      if (NON_SHIPPING.some((pattern) => pattern.test(file))) continue

      const owner = /^packages\/([^/]+)\//.exec(file)?.[1]
      if (owner !== undefined) {
        for (const name of consumers.get(owner) ?? []) {
          const via =
            byDir.get(owner)?.name === name ? '' : ` (compiled into it from packages/${owner})`
          if (!implicated.has(name)) implicated.set(name, `${file}${via}`)
        }
      }
      for (const [name, prefixes] of Object.entries(CONTENT_SOURCES)) {
        if (prefixes.some((p) => file === p || file.startsWith(p.endsWith('/') ? p : `${p}/`))) {
          if (!implicated.has(name)) implicated.set(name, `${file} (bundled into it at build time)`)
        }
      }
    }

    const shipped = released(config.fixed ?? [])
    const missing = [...implicated].filter(([name]) => !shipped.has(name)).sort()

    assert.deepEqual(
      missing.map(([name]) => name),
      [],
      'Changed published packages with no changeset — merging this leaves the work on ' +
        'main and off npm, which for an adopter is the same as not shipping it:\n' +
        missing.map(([name, why]) => `  ${name} — changed by ${why}`).join('\n') +
        '\n\nRun `pnpm changeset` and name them. If a change genuinely reaches no adopter, ' +
        'add its path to NON_SHIPPING in scripts/checks/changeset-coverage.test.ts with a reason.',
    )
  })

  it('every package named in CONTENT_SOURCES is still a published package', () => {
    const published = new Set(pkgs.filter((p) => !p.private).map((p) => p.name))
    const stale = Object.keys(CONTENT_SOURCES).filter((name) => !published.has(name))
    assert.deepEqual(
      stale,
      [],
      `CONTENT_SOURCES names packages that are no longer published: ${stale.join(', ')} — ` +
        'a renamed or unpublished package there silently stops being checked.',
    )
  })

  it('every path in CONTENT_SOURCES still exists', () => {
    const gone = Object.entries(CONTENT_SOURCES).flatMap(([name, prefixes]) =>
      prefixes.filter((p) => !existsSync(join(REPO_ROOT, p))).map((p) => `${name}: ${p}`),
    )
    assert.deepEqual(
      gone,
      [],
      `CONTENT_SOURCES points at paths that no longer exist: ${gone.join(', ')} — ` +
        'the build script moved, so the mapping no longer reflects what gets bundled.',
    )
  })
})

/**
 * Cold-adopter canary — verify the offline docs channel against the PACKED
 * artifact, the way the 2026-07-23 adopter reached cascivo (npm pack, no website).
 *
 * This is the executable form of that plan's definition of done for WS-L/WS-J: a
 * fix isn't done because the repo is green — it's done when the thing an adopter
 * actually installs works. So this packs `@cascivo/docs` into a temp dir, extracts
 * it OUTSIDE the repo tree (so the CLI's dev-monorepo fallback cannot mask a
 * missing bundle), and drives the shipped CLI with the environment scrubbed —
 * proving the tarball is self-sufficient with no repo checkout and no network.
 *
 * It also asserts the registry-vs-registry freshness invariant: the bundled
 * `versions.json` names the same `@cascivo/react` version as the packed package
 * set — a check that holds even when the docs site is down (which is exactly when
 * the offline channel matters).
 *
 * Run: `pnpm cold-adopter:check` (also suitable for the release-PR CI tier).
 * Scope: the offline-docs leg. The browser leg (styled app, ThemeProvider dev
 * warning, chart clamp) is covered by the per-package unit tests; wiring a full
 * tarball-install + Playwright app is tracked as the remaining WS-J follow-up.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..')
const DOCS_PKG = join(REPO_ROOT, 'packages', 'docs')

let work: string
let extracted: string // <tmp>/package

before(() => {
  work = mkdtempSync(join(tmpdir(), 'cascivo-cold-adopter-'))
  // Build the content bundle, then pack exactly what npm would publish.
  execFileSync('pnpm', ['--filter', '@cascivo/docs', 'build'], { cwd: REPO_ROOT, stdio: 'pipe' })
  execFileSync('pnpm', ['--filter', '@cascivo/docs', 'pack', '--pack-destination', work], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  })
  const tgz = readdirSync(work).find((f) => f.endsWith('.tgz'))
  assert.ok(tgz, 'pnpm pack produced no .tgz for @cascivo/docs')
  execFileSync('tar', ['-xzf', join(work, tgz), '-C', work], { stdio: 'pipe' })
  extracted = join(work, 'package')
})

after(() => {
  if (work) rmSync(work, { recursive: true, force: true })
})

/** Run the packed CLI with the environment scrubbed of the dev-monorepo escape
 * hatch, so only the tarball's own content/ can satisfy it. */
function cli(args: string[]): { code: number; out: string } {
  const env = { ...process.env }
  delete env.CASCIVO_DOCS_CONTENT
  try {
    const out = execFileSync('node', [join(extracted, 'bin', 'cascivo-docs.mjs'), ...args], {
      cwd: work, // outside the repo — the `../../../apps/site/public` fallback cannot resolve
      env,
      encoding: 'utf8',
    })
    return { code: 0, out }
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string }
    return { code: err.status ?? 1, out: err.stdout ?? '' }
  }
}

describe('cold-adopter — the packed @cascivo/docs tarball is self-sufficient offline', () => {
  it('the tarball ships the load-bearing docs files', () => {
    for (const rel of [
      'content/llms.txt',
      'content/llms-full.txt',
      'content/registry.json',
      'content/versions.json',
      'content/guides/getting-started.md',
      'bin/cascivo-docs.mjs',
    ]) {
      assert.ok(existsSync(join(extracted, rel)), `tarball is missing ${rel}`)
    }
  })

  it('versions.json names @cascivo/react (registry-vs-registry freshness)', () => {
    const versions = JSON.parse(readFileSync(join(extracted, 'content', 'versions.json'), 'utf8'))
    assert.ok(versions.packages, 'versions.json has no `packages`')
    const reactPkg = JSON.parse(
      readFileSync(join(REPO_ROOT, 'packages', 'react', 'package.json'), 'utf8'),
    )
    assert.equal(
      versions.packages['@cascivo/react'],
      reactPkg.version,
      'bundled versions.json disagrees with the @cascivo/react package version',
    )
  })

  it('CLI prints the index with no args (scrubbed env, outside the repo)', () => {
    const r = cli([])
    assert.equal(r.code, 0)
    assert.match(r.out, /cascivo/i)
    assert.ok(r.out.length > 500, 'llms.txt index looks empty')
  })

  it('CLI prints a component reference by name', () => {
    const r = cli(['button'])
    assert.equal(r.code, 0)
    assert.match(r.out, /button/i)
  })

  it('CLI prints the full library with --full', () => {
    const r = cli(['--full'])
    assert.equal(r.code, 0)
    assert.ok(r.out.length > 10_000, 'llms-full.txt looks truncated')
  })

  it('CLI prints a guide by slug', () => {
    const r = cli(['guide', 'theming'])
    assert.equal(r.code, 0)
    assert.match(r.out, /theme/i)
  })

  it('CLI --dir points inside the extracted tarball (not a repo path)', () => {
    const r = cli(['--dir'])
    assert.equal(r.code, 0)
    assert.ok(r.out.includes(extracted), `--dir (${r.out.trim()}) is not inside the tarball`)
  })
})

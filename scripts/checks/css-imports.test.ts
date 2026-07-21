/**
 * CSS cross-package import check — every `@import '@cascivo/<pkg>'` in a package's
 * shipped CSS must resolve to a real `dependencies` entry of that package, not a
 * peer (and not absent).
 *
 * `@cascivo/themes` CSS `@import`s `@cascivo/tokens`, but tokens was only a *peer*:
 * the import resolved solely when the consumer's package manager auto-installed
 * peers. On npm/yarn-classic or with `auto-install-peers=false`, the `@import`
 * dead-ended and every component rendered unstyled with no error pointing at the
 * cause (2026-07-20 report, blocker #5). A CSS `@import` is a hard runtime edge, so
 * its target must be a direct dependency.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')

/** Strip `/* … *\/` comments so `@import` mentions inside comments are ignored. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function walkCss(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walkCss(full, out)
    else if (entry.name.endsWith('.css')) out.push(full)
  }
}

interface PkgJson {
  name?: string
  private?: boolean
  dependencies?: Record<string, string>
}

/** All `@cascivo/<pkg>` package names imported by a CSS file, excluding self. */
function importedCascadePackages(css: string, selfName: string): Set<string> {
  const targets = new Set<string>()
  const re = /@import\s+['"](@cascivo\/[a-z0-9-]+)(?:\/[^'"]*)?['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    const pkg = m[1]!
    if (pkg !== selfName) targets.add(pkg)
  }
  return targets
}

describe('css-imports — cross-package CSS @import targets are direct dependencies', () => {
  it('every @import "@cascivo/<pkg>" in shipped CSS is a dependency of the importer', () => {
    const offenders: string[] = []
    for (const dir of readdirSync(PACKAGES_DIR)) {
      const pkgDir = join(PACKAGES_DIR, dir)
      let pkg: PkgJson
      try {
        pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')) as PkgJson
      } catch {
        continue
      }
      const srcDir = join(pkgDir, 'src')
      let cssFiles: string[] = []
      try {
        if (statSync(srcDir).isDirectory()) walkCss(srcDir, cssFiles)
      } catch {
        continue
      }
      const deps = pkg.dependencies ?? {}
      const selfName = pkg.name ?? `@cascivo/${dir}`
      for (const file of cssFiles) {
        const css = stripCssComments(readFileSync(file, 'utf8'))
        for (const target of importedCascadePackages(css, selfName)) {
          if (deps[target] === undefined) {
            offenders.push(`${relative(REPO_ROOT, file)} imports ${target}, not in ${selfName}'s dependencies`)
          }
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `Cross-package CSS @import targets must be direct dependencies (peers don't ` +
        `install reliably): \n  ${offenders.join('\n  ')}`,
    )
  })
})

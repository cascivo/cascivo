/**
 * Version-pin guard (WS-11) — keeps "latest published version" true by construction.
 *
 * Install snippets in the docs are deliberately UNVERSIONED (`pnpm add @cascivo/react`),
 * so an adopter always resolves npm's `latest`. A snippet that pins a version
 * (`pnpm add @cascivo/react@0.11.0`) goes stale the moment the next release ships and
 * silently sends adopters to an old package. This guard fails if any adopter-facing
 * surface pins a `@cascivo/*` version in an install command.
 *
 * Scope: install commands only (`pnpm add` / `npm i(nstall)` / `yarn add`). Prose that
 * *mentions* a historical version ("between `@cascivo/charts@0.2.1` and current") or a
 * pnpm `patchedDependencies` key is not an install instruction and is not flagged.
 * CHANGELOGs and docs/internal/** (dated reports/plans) are out of scope by construction.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/** An install command that pins a `@cascivo/*` package to a version. */
const PINNED_INSTALL_RE = /(?:pnpm add|npm i(?:nstall)?|yarn add)\b[^\n]*@cascivo\/[a-z-]+@[0-9]/i

function collectFiles(dir: string, exts: Set<string>): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) results.push(...collectFiles(full, exts))
      else if (exts.has(extname(entry))) results.push(full)
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

function surfaces(): string[] {
  const tsx = new Set(['.ts', '.tsx'])
  const files = [
    join(REPO_ROOT, 'README.md'),
    join(REPO_ROOT, 'readme.body.md'),
    ...collectFiles(join(REPO_ROOT, 'apps/site/src/marketing'), tsx),
    ...collectFiles(join(REPO_ROOT, 'apps/site/src/pages'), tsx),
  ]
  // Top-level guides only — not docs/internal|plans|specs (historical, dated).
  for (const entry of readdirSync(join(REPO_ROOT, 'docs'))) {
    if (extname(entry) === '.md') files.push(join(REPO_ROOT, 'docs', entry))
  }
  for (const dir of readdirSync(join(REPO_ROOT, 'packages'))) {
    const body = join(REPO_ROOT, 'packages', dir, 'readme.body.md')
    try {
      if (statSync(body).isFile()) files.push(body)
    } catch {
      // package has no readme.body.md
    }
  }
  return files
}

describe('version-pins:check — install snippets stay unversioned', () => {
  it('no adopter-facing install command pins a @cascivo/* version', () => {
    const violations: string[] = []
    for (const file of surfaces()) {
      const rel = relative(REPO_ROOT, file)
      const lines = readFileSync(file, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (PINNED_INSTALL_RE.test(lines[i]!)) {
          violations.push(
            `  ${rel}:${i + 1}  pins a @cascivo/* version in an install command — drop the ` +
              `@x.y.z so adopters get npm's latest`,
          )
        }
      }
    }
    assert.deepEqual(violations, [], `Pinned install snippets found:\n${violations.join('\n')}`)
  })
})

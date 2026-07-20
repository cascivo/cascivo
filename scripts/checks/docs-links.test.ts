/**
 * Doc-link check (layer 2 of the docs freshness invariant) — every relative link
 * in a published guide (`docs/*.md`) must resolve to a file that exists in the repo.
 *
 * A guide that links `./THEMING.md` or `../apps/examples/react-vite` and then that
 * target is renamed/moved is exactly the "docs spread across hosts with 404s between
 * them" complaint (2026-07-18 report, F7). This keeps intra-repo links honest.
 *
 * Scope: top-level guides only. `docs/internal/**`, `docs/plans/**`, and
 * `docs/cookbooks/**` are excluded (working notes / illustrative narratives).
 * External (`http(s)://`), absolute (`/…` — resolved by the deploy, not the repo),
 * anchor-only (`#…`), and `mailto:` links are not checked here.
 */

import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const DOCS_DIR = join(REPO_ROOT, 'docs')

interface Link {
  file: string
  target: string
}

function guideFiles(): string[] {
  return readdirSync(DOCS_DIR)
    .filter((e) => e.endsWith('.md'))
    .map((e) => join(DOCS_DIR, e))
}

/** Markdown `[text](target)` links whose target is a repo-relative path. */
function relativeLinks(file: string): Link[] {
  const text = readFileSync(file, 'utf8')
  const out: Link[] = []
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = m[1]!.trim()
    if (/^(https?:|mailto:|#|\/)/.test(target)) continue // external / absolute / anchor
    target = target.split('#')[0]!.split('?')[0]! // drop fragment + query
    if (!target) continue
    out.push({ file, target })
  }
  return out
}

describe('docs-links — every relative link in the guides resolves', () => {
  const links = guideFiles().flatMap(relativeLinks)

  it('finds a plausible number of relative links', () => {
    assert.ok(links.length > 10, `only ${links.length} relative links found — scanner broken?`)
  })

  it('every relative link points to an existing repo file', () => {
    const broken: string[] = []
    for (const { file, target } of links) {
      const resolved = normalize(join(file, '..', target))
      if (!existsSync(resolved)) {
        broken.push(`${rel(file)} → ${target}`)
      }
    }
    assert.deepEqual(broken, [], `Broken relative links in docs guides:\n  ${broken.join('\n  ')}`)
  })
})

function rel(file: string): string {
  return file.startsWith(REPO_ROOT) ? file.slice(REPO_ROOT.length + 1) : file
}

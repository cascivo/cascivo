/**
 * docs-package-refs — the registry-delivered docs channels must be referenced on every
 * surface an unreachable-web adopter meets (WS-L). Six adopter reports in a row hit "docs
 * exist but I couldn't reach them"; the fix only holds if the pointer is present *and stays*
 * present. This is the enforcement analogue of `peer-floors`/`css-imports`: a cross-reference
 * promise rots without a gate.
 *
 * Two channels, two lists, because they answer different questions:
 *
 * - `@cascivo/docs` prints the docs. Every surface an adopter reads must point at it.
 * - `@cascivo/docspack` makes them searchable offline. It only belongs on the surfaces an
 *   agent is actually configured from, so its list is deliberately shorter — a package
 *   README is read by a human who wants to read, not to run a query.
 *
 * The two names collide by prefix: `'@cascivo/docspack'.includes('@cascivo/docs')` is true.
 * Matching the docs channel by substring would therefore let a file that mentions only
 * docspack satisfy the docs requirement, and the guard would pass while the offline-read
 * pointer had silently disappeared. Hence the negative lookahead.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/** `@cascivo/docs` as its own package name — never the `@cascivo/docspack` prefix. */
const DOCS = /@cascivo\/docs(?!pack)/
const DOCSPACK = /@cascivo\/docspack/

// Surfaces an adopter who can't reach npmjs.com/cascivo.com will actually read.
const DOCS_FILES = [
  'packages/react/readme.body.md',
  'packages/charts/readme.body.md',
  'packages/themes/readme.body.md',
  'packages/icons/readme.body.md',
  'docs/GETTING-STARTED.md',
  'docs/TROUBLESHOOTING.md',
  'scripts/llms/generate.ts', // the llms.txt / llms-full.txt template
  'packages/react/scripts/flatten-types.mjs', // the dist/index.d.ts quickstart banner
]

// Surfaces that configure an agent, where "you can search this offline" is the useful fact.
const DOCSPACK_FILES = [
  'docs/AI-RULES.md', // the copy-paste blocks an adopter puts in AGENTS.md / CLAUDE.md
  'docs/GETTING-STARTED.md', // "Searching the docs instead of reading them"
  'scripts/llms/generate.ts', // the llms.txt / llms-full.txt template
]

describe('docs-package-refs — the registry-delivered docs channels stay referenced', () => {
  for (const rel of DOCS_FILES) {
    it(`${rel} references @cascivo/docs`, () => {
      const text = readFileSync(join(REPO_ROOT, rel), 'utf8')
      assert.match(
        text,
        DOCS,
        `${rel} must reference \`@cascivo/docs\` so an adopter who can't reach the docs site ` +
          `learns they can read the docs offline via \`npx @cascivo/docs\`. ` +
          `(A mention of \`@cascivo/docspack\` alone does not count — different channel.)`,
      )
    })
  }

  for (const rel of DOCSPACK_FILES) {
    it(`${rel} references @cascivo/docspack`, () => {
      const text = readFileSync(join(REPO_ROOT, rel), 'utf8')
      assert.match(
        text,
        DOCSPACK,
        `${rel} must reference \`@cascivo/docspack\` so an agent configured from this file ` +
          `learns it can query the docs offline with \`docspack ask\` instead of guessing ` +
          `or fetching a page per question.`,
      )
    })
  }
})

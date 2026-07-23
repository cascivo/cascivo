/**
 * docs-package-refs — the `@cascivo/docs` offline-docs channel must be referenced
 * on every surface an unreachable-web adopter meets (WS-L). Six adopter reports in
 * a row hit "docs exist but I couldn't reach them"; the fix only holds if the
 * pointer to the registry-delivered docs is present *and stays* present. This is
 * the enforcement analogue of `peer-floors`/`css-imports`: a cross-reference
 * promise rots without a gate.
 *
 * Each listed file must mention `@cascivo/docs`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const NEEDLE = '@cascivo/docs'

// Surfaces an adopter who can't reach npmjs.com/cascivo.com will actually read.
const REQUIRED_FILES = [
  'packages/react/readme.body.md',
  'packages/charts/readme.body.md',
  'packages/themes/readme.body.md',
  'packages/icons/readme.body.md',
  'docs/GETTING-STARTED.md',
  'docs/TROUBLESHOOTING.md',
  'scripts/llms/generate.ts', // the llms.txt / llms-full.txt template
  'packages/react/scripts/flatten-types.mjs', // the dist/index.d.ts quickstart banner
]

describe('docs-package-refs — the offline @cascivo/docs channel is referenced everywhere', () => {
  for (const rel of REQUIRED_FILES) {
    it(`${rel} references ${NEEDLE}`, () => {
      const text = readFileSync(join(REPO_ROOT, rel), 'utf8')
      assert.ok(
        text.includes(NEEDLE),
        `${rel} must reference \`${NEEDLE}\` so an adopter who can't reach the docs site ` +
          `learns they can read the docs offline via \`npx ${NEEDLE}\`.`,
      )
    })
  }
})

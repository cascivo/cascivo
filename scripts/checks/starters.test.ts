/**
 * The committed starters are exactly what `cascivo create` writes today.
 *
 * `starters/*` is what the "Deploy to Cloudflare" button and `npm create cloudflare
 * --template` pull from GitHub. A starter that drifted from the scaffolder would ship an app
 * no current CLI produces — fixes landing in `create` would never reach the button.
 *
 * Fix a failure with `pnpm starters:generate` (after `vp run cascivo#build`) and commit.
 * Run: `pnpm scaffold:check` (and in `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { CLI, STARTERS, STARTERS_DIR, readTree, scaffoldStarter } from '../starters/starters.ts'

if (!existsSync(CLI)) {
  throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
}

describe('starters — committed copies match the scaffolder', () => {
  for (const starter of STARTERS) {
    it(`starters/${starter.name}`, () => {
      const committed = readTree(join(STARTERS_DIR, starter.name))
      const generated = scaffoldStarter(starter)
      assert.deepEqual(
        [...committed.keys()].sort(),
        [...generated.keys()].sort(),
        'File list differs. Run `pnpm starters:generate` and commit.',
      )
      for (const [path, contents] of generated) {
        assert.equal(
          committed.get(path),
          contents,
          `starters/${starter.name}/${path} is stale. Run \`pnpm starters:generate\` and commit.`,
        )
      }
    })
  }
})

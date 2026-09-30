/**
 * The landing page's app builder shows exactly what `cascivo create` writes today: its data
 * (apps/site/src/marketing/app-builder.json) is generated from the built CLI, and this fails
 * when the committed copy is stale, or when the CLI gains an example or a wrangler binding
 * the builder has no words for.
 *
 * Fix a failure with `pnpm app-builder:generate` (after `vp run cascivo#build`) and commit.
 * Run: `pnpm scaffold:check` (and in `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { CLI } from '../starters/starters.ts'
import { DATA_FILE, buildData, serialize } from '../site/app-builder.ts'

if (!existsSync(CLI)) {
  throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
}

describe('app builder — the landing page matches the scaffolder', () => {
  it('app-builder.json is current', () => {
    // Compared as data: `vp check --fix` reflows the committed file's layout.
    assert.deepEqual(
      JSON.parse(readFileSync(DATA_FILE, 'utf8')),
      JSON.parse(serialize(buildData())),
      'apps/site/src/marketing/app-builder.json is stale. Run `pnpm app-builder:generate` and commit.',
    )
  })
})

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
import type { BuilderData } from '../site/app-builder.ts'
import {
  CTA_EXAMPLE,
  CTA_SHIP_COMMANDS,
  PREVIEWABLE,
} from '../../apps/site/src/marketing/poster/ship.ts'

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

  // The call to action promises a public URL with no account. That holds only while its
  // example binds nothing a temporary account lacks and the scaffold still deploys to one.
  it("the call to action's commands still ship with no account", () => {
    const data: BuilderData = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    const example = data.examples.find((e) => e.id === CTA_EXAMPLE)
    assert.ok(example, `--example ${CTA_EXAMPLE} no longer exists`)
    const unsupported = example.services.filter((s) => !PREVIEWABLE.has(s))
    assert.deepEqual(unsupported, [], `--example ${CTA_EXAMPLE} binds ${unsupported.join(', ')}`)
    assert.match(data.previewScript, /wrangler deploy --temporary/)
    assert.match(CTA_SHIP_COMMANDS, /--framework cloudflare\b/)
    assert.ok(CTA_SHIP_COMMANDS.includes(`--example ${CTA_EXAMPLE}`))
    assert.match(CTA_SHIP_COMMANDS, /npm run deploy:preview/)
  })
})

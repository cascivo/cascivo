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
import { buildExampleStarter, EXAMPLE_STARTERS } from '../starters/examples.ts'
import { CLI, STARTERS, STARTERS_DIR, readTree, scaffoldStarter } from '../starters/starters.ts'

if (!existsSync(CLI)) {
  throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
}

/**
 * pnpm 11+ writes `minimumReleaseAgeExclude` into a starter's pnpm-workspace.yaml when
 * someone installs it in place (`cd starters/<name> && pnpm install`) while a cascivo release
 * is younger than pnpm's minimum release age. That key is pnpm's to manage, not the
 * generator's, so it does not count as drift.
 */
export function withoutPnpmManagedKeys(yaml: string): string {
  return yaml.replace(/^minimumReleaseAgeExclude:\n(?:[ \t]+-.*\n)*/m, '')
}

function assertMatches(name: string, generated: Map<string, string>): void {
  const committed = readTree(join(STARTERS_DIR, name))
  const workspace = committed.get('pnpm-workspace.yaml')
  if (workspace !== undefined)
    committed.set('pnpm-workspace.yaml', withoutPnpmManagedKeys(workspace))
  assert.deepEqual(
    [...committed.keys()].sort(),
    [...generated.keys()].sort(),
    'File list differs. Run `pnpm starters:generate` and commit.',
  )
  for (const [path, contents] of generated) {
    assert.equal(
      committed.get(path),
      contents,
      `starters/${name}/${path} is stale. Run \`pnpm starters:generate\` and commit.`,
    )
  }
}

describe('starters — committed copies match the scaffolder', () => {
  for (const starter of STARTERS) {
    it(`starters/${starter.name}`, () => assertMatches(starter.name, scaffoldStarter(starter)))
  }
})

// The example apps' standalone copies, which the Deploy to Cloudflare button deploys.
describe('starters — committed copies match their example app', () => {
  for (const starter of EXAMPLE_STARTERS) {
    it(`starters/${starter.name}`, () => assertMatches(starter.name, buildExampleStarter(starter)))
  }
})

describe('withoutPnpmManagedKeys', () => {
  it('drops the block pnpm adds, and nothing else', () => {
    const generated =
      'packages:\n  - .\nallowBuilds:\n  esbuild: true\nonlyBuiltDependencies:\n  - esbuild\n'
    const installed = generated.replace(
      'onlyBuiltDependencies:',
      "minimumReleaseAgeExclude:\n  - '@cascivo/app@1.3.1'\n  - '@cascivo/data@0.0.0'\nonlyBuiltDependencies:",
    )
    assert.equal(withoutPnpmManagedKeys(installed), generated)
    assert.equal(withoutPnpmManagedKeys(generated), generated)
  })
})

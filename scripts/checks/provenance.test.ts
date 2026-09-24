/**
 * docs/GOVERNANCE.md tells adopters every package carries npm provenance and that each release
 * attaches an SBOM. Both are true only while the config says so, and a new package copied from
 * an old template (or a workflow edit) could quietly drop either — the claim would stay in the
 * docs, unverified. This keeps the claim and the config together.
 *
 * Run: node --experimental-strip-types --test scripts/checks/provenance.test.ts
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const ROOT = join(import.meta.dirname, '..', '..')

describe('supply-chain claims in GOVERNANCE.md hold', () => {
  it('every published package publishes with provenance', () => {
    const missing: string[] = []
    for (const dir of readdirSync(join(ROOT, 'packages'))) {
      let pkg: { name?: string; private?: boolean; publishConfig?: { provenance?: boolean } }
      try {
        pkg = JSON.parse(
          readFileSync(join(ROOT, 'packages', dir, 'package.json'), 'utf8'),
        ) as typeof pkg
      } catch {
        continue
      }
      if (pkg.private === true || !pkg.name) continue
      if (pkg.publishConfig?.provenance !== true) missing.push(pkg.name)
    }
    assert.deepEqual(
      missing,
      [],
      `set "publishConfig": { "provenance": true } in: ${missing.join(', ')}`,
    )
  })

  it('the release workflow publishes through OIDC and attaches SBOMs', () => {
    const wf = readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf8')
    assert.match(wf, /id-token:\s*write/, 'trusted publishing needs `id-token: write`')
    assert.match(wf, /NPM_CONFIG_PROVENANCE:\s*true/, 'publish steps must request provenance')
    assert.match(wf, /pnpm --filter "\$name" sbom --sbom-format cyclonedx/, 'SBOM step missing')
    assert.match(wf, /gh release upload/, 'SBOMs must be attached to the GitHub release')
  })
})

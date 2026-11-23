import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CONTRACT_JSON, REPO_ROOT, type Contract } from './generate.ts'
import { cascivoRepoScopedName } from './scoped-name.ts'

const contract = JSON.parse(readFileSync(join(REPO_ROOT, CONTRACT_JSON), 'utf8')) as Contract
const src = join(REPO_ROOT, 'packages/components/src')

test('component modules get exactly the contract.json classes (same as lightningcss)', () => {
  for (const [unit, u] of Object.entries(contract.units))
    for (const [local, cls] of Object.entries(u.classes))
      assert.equal(cascivoRepoScopedName(local, join(src, unit, `${unit}.module.css`)), cls)
})

test('a local added before regen still follows the pattern', () => {
  assert.equal(cascivoRepoScopedName('new', join(src, 'button/button.module.css')), 'cv-button-new')
})

test('blocks, brand, charts and app modules stay hashed', () => {
  for (const f of [
    'packages/components/src/blocks/auth-login/auth-login.module.css',
    'packages/components/src/brand/logo/logo.module.css',
    'packages/charts/src/charts/kpi/kpi.module.css',
    'apps/site/src/button/button.module.css',
  ])
    assert.match(cascivoRepoScopedName('root', join(REPO_ROOT, f)), /^_root_[a-z0-9]{5}$/, f)
})

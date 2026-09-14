/**
 * `changeset publish` must be a no-op for an already-published version.
 *
 * The release workflow runs `changeset publish` twice over the same tree: once
 * to ship versions a previous run stranded, and once via `changesets/action`.
 * Both lean on the same contract — a version npm already has is skipped, not
 * re-sent. When that contract broke, every package 403'd with "You cannot
 * publish over the previously published versions" and the release died
 * (run 34857463319, 2026-09-14).
 *
 * It broke because `npm@latest` became npm 12, which wraps a successful
 * `npm info --json` payload in an ARRAY. Changesets read `.versions` off the
 * parsed object, got `undefined` for all 21 packages, and concluded none of
 * them had ever been published. The fix is upstream in @changesets/cli 2.31.1
 * (`normalizeInfoJson`); the second guard below is ours, because the
 * already-published escape hatch only recognised npm's `E403` payload and the
 * publish is done by pnpm, which reports `ERR_PNPM_FAILED_TO_PUBLISH`.
 *
 * Both live in the resolved CLI bundle, so this asserts on its source. A rename
 * upstream should fail here: re-verify that a stale/blind `npm info` still
 * cannot turn a republish into a failed release, then update the pattern.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'

const dist = createRequire(import.meta.url).resolve('@changesets/cli')
const source = readFileSync(dist, 'utf8')

describe('changeset publish — an already-published version is skipped', () => {
  it('unwraps the array npm >= 12 wraps `npm info --json` in', () => {
    assert.match(
      source,
      /Array\.isArray\(parsed\) \? parsed\[0\] : parsed/,
      '@changesets/cli no longer normalises array-wrapped `npm info --json` output — ' +
        'under npm >= 12 it will read no published versions and try to republish everything',
    )
  })

  it("treats pnpm's publish failure as already-published, not as a release failure", () => {
    assert.match(
      source,
      /json\.error\.code === "ERR_PNPM_FAILED_TO_PUBLISH"/,
      'patches/@changesets__cli@*.patch no longer widens the already-published skip to ' +
        "pnpm's error shape — a stale `npm info` would fail the whole release again",
    )
  })
})

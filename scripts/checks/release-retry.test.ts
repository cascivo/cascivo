/**
 * Release-retry check.
 *
 * The release build is retried only when the runner failed to *spawn* a
 * process (fork(2) EAGAIN — see scripts/release/retry-transient.mjs). Two
 * properties keep that honest, and both are asserted here: a genuine build
 * failure must still fail on the first attempt, and `changeset publish` must
 * stay outside the retried command so a partial publish is never re-driven.
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const WRAPPER = join(REPO_ROOT, 'scripts/release/retry-transient.mjs')

// The exact line vp printed when the 0.17.0 release aborted mid-build.
const TRANSIENT_LINE = '✗ Failed to spawn process: Resource temporarily unavailable (os error 11)'

const tmpDirs: string[] = []
after(() => {
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true })
})

/**
 * A fake command that prints `message` and exits 1 for its first `failures`
 * runs, then succeeds. Runs are counted in a file so the count survives the
 * wrapper re-spawning it.
 */
function fakeCommand(failures: number, message: string) {
  const dir = mkdtempSync(join(tmpdir(), 'cascivo-retry-'))
  tmpDirs.push(dir)
  const counter = join(dir, 'runs')
  const script = join(dir, 'fake.mjs')
  writeFileSync(
    script,
    [
      "import { appendFileSync, existsSync, readFileSync } from 'node:fs'",
      `const counter = ${JSON.stringify(counter)}`,
      "const runs = existsSync(counter) ? readFileSync(counter, 'utf8').length : 0",
      "appendFileSync(counter, 'x')",
      `if (runs < ${failures}) { console.error(${JSON.stringify(message)}); process.exit(1) }`,
      "console.log('ok')",
    ].join('\n'),
  )
  return {
    script,
    runs: () => (existsSync(counter) ? readFileSync(counter, 'utf8').length : 0),
  }
}

function runWrapper(script: string) {
  return spawnSync(process.execPath, [WRAPPER, process.execPath, script], {
    encoding: 'utf8',
    env: { ...process.env, RETRY_TRANSIENT_DELAY_MS: '0' },
  })
}

describe('release-retry check — retry the runner, never the build error', () => {
  it('retries a transient spawn failure and succeeds', () => {
    const fake = fakeCommand(1, TRANSIENT_LINE)
    const result = runWrapper(fake.script)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(fake.runs(), 2)
  })

  it('gives up after 3 attempts when the spawn failure persists', () => {
    const fake = fakeCommand(99, TRANSIENT_LINE)
    const result = runWrapper(fake.script)
    assert.equal(result.status, 1)
    assert.equal(fake.runs(), 3)
  })

  it('does not retry a real build failure', () => {
    const fake = fakeCommand(99, "src/button.tsx(12,3): error TS2322: Type 'x' is not assignable")
    const result = runWrapper(fake.script)
    assert.equal(result.status, 1)
    assert.equal(fake.runs(), 1)
  })

  it('retries the build but never `changeset publish`', () => {
    const { scripts } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    const release = scripts['release'] ?? ''
    const [retried = '', ...rest] = release.split('&&')

    assert.match(retried, /scripts\/release\/retry-transient\.mjs pnpm release:build/)
    assert.match(scripts['release:build'] ?? '', /build:release/)
    assert.doesNotMatch(retried, /changeset publish/)
    assert.match(rest.join('&&'), /changeset publish/)
  })
})

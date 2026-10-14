/**
 * Every blueprint block lints clean in a scaffolded app, under the config the adopter runs.
 *
 * A blueprint page renders a registry block whose source is copied into the app
 * (`src/blocks/`). That source is written for cascivo's own lint config, so this proves it is
 * also clean under the generated `eslint.config.js`. It is its own file, not a describe in
 * scaffold-lint.test.ts: typescript-eslint keeps one tsconfig root per process, and linting
 * two generated apps in one process fails every file with "multiple candidate
 * TSConfigRootDirs".
 */
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { strict as assert } from 'node:assert'
import { after, before, describe, it } from 'node:test'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const FIXTURE = join(HERE, 'host-lint', 'eslint')
const CLI = join(REPO_ROOT, 'packages/cli/dist/index.mjs')

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESLint's API is untyped here
let ESLintCtor: any

describe('scaffold-blueprint-lint — every blueprint block lints clean in a scaffolded app', () => {
  let blueprintDir: string
  let appDir: string

  before(async () => {
    if (!existsSync(CLI)) {
      throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
    }
    const requireFromFixture = createRequire(join(FIXTURE, 'package.json'))
    ;({ ESLint: ESLintCtor } = await import(
      pathToFileURL(requireFromFixture.resolve('eslint')).href
    ))
    const blocks = readdirSync(join(REPO_ROOT, 'packages/cli/recipes'))
      .filter((d) => d.startsWith('block-'))
      .map((d) => d.slice('block-'.length))
    assert.ok(blocks.length >= 10, `only ${blocks.length} block recipes`)
    blueprintDir = mkdtempSync(join(FIXTURE, 'blueprint-'))
    writeFileSync(
      join(blueprintDir, 'cascivo.app.json'),
      JSON.stringify({
        name: 'blocks-probe',
        pages: blocks.map((block, i) => ({ title: `Page ${i + 1}`, block })),
      }),
    )
    execFileSync(process.execPath, [CLI, 'create', '--from', 'cascivo.app.json'], {
      cwd: blueprintDir,
      stdio: 'pipe',
    })
    appDir = join(blueprintDir, 'blocks-probe')
  })

  after(() => {
    if (blueprintDir) rmSync(blueprintDir, { recursive: true, force: true })
  })

  it('has zero lint errors with every block on a page', async () => {
    const eslint = new ESLintCtor({
      cwd: appDir,
      overrideConfigFile: join(appDir, 'eslint.config.js'),
      errorOnUnmatchedPattern: false,
    })
    const results: Array<{
      filePath: string
      messages: Array<{ severity: number; ruleId: string | null; message: string; line: number }>
    }> = await eslint.lintFiles([join(appDir, 'src')])
    assert.ok(
      results.some((r) => r.filePath.includes(`${'src'}/blocks/`)),
      'ESLint did not reach src/blocks/',
    )
    const errors = results.flatMap((r) =>
      r.messages
        .filter((m) => m.severity === 2)
        .map(
          (m) =>
            `${r.filePath.slice(appDir.length + 1)}:${m.line}  ${m.ruleId ?? '?'}  ${m.message}`,
        ),
    )
    assert.deepEqual(errors, [], `Block pages must lint clean:\n${errors.join('\n')}`)
  })
})

/**
 * `cascivo create`'s generated app really lints — asserted by running real ESLint.
 *
 * ## Why this exists (Mechanism F, again)
 *
 * `scaffold-contract.test.ts` already had a test called "pre-wires the react-hooks/
 * immutability escape so `lint` passes on a fresh app". It string-matched the generated
 * `eslint.config.js`. It passed green on a config that registered no TypeScript parser and
 * no `files` pattern — so ESLint 9 skipped every `.ts`/`.tsx` in a TypeScript-only project
 * and `pnpm lint` exited 0 having inspected **zero files** (2026-08-08 report B).
 *
 * A green lint that inspected nothing is worse than a red one, and no amount of asserting on
 * the config's *text* can tell the two apart. Only running the tool can. That is the same
 * lesson `lint:host-eslint` was built on one plan earlier; this points it at the scaffold,
 * which is the first command a new adopter runs.
 *
 * ## What it asserts
 *
 * 1. ESLint reports on **every** `.ts`/`.tsx` file in the generated `src/` — the assertion
 *    that fails on the pre-fix template and that no text check can express.
 * 2. Zero errors on a freshly generated app.
 * 3. A `signal.value = x` write produces no `react-hooks/immutability` error, proving
 *    `@cascivo/eslint-config` is *effective* rather than merely *present*.
 * 4. An unused local DOES error, proving rules run at all — without this, assertion 3 is
 *    satisfied by a config that lints nothing, which is the exact bug.
 *
 * The scaffold is written inside this fixture directory so Node resolves the plugins the
 * generated config imports from the fixture's own `node_modules`.
 */
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { strict as assert } from 'node:assert'
import { after, before, describe, it } from 'node:test'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
// The scaffold is generated INSIDE the lint fixture so Node resolves the plugins the
// generated config imports from the fixture's own node_modules.
const FIXTURE = join(HERE, 'host-lint', 'eslint')
const CLI = join(REPO_ROOT, 'packages/cli/dist/index.mjs')

let workdir: string
let dir: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESLint's API is untyped here
let ESLintCtor: any

/** Every generated .ts/.tsx under src/, repo-relative to the app root. */
function generatedTsFiles(root: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const item of readdirSync(d)) {
      const full = join(d, item)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.tsx?$/.test(item)) out.push(relative(root, full).replaceAll('\\', '/'))
    }
  }
  walk(join(root, 'src'))
  return out
}

before(async () => {
  if (!existsSync(CLI)) {
    throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
  }
  // Resolve ESLint from the FIXTURE, not from scripts/ — the repo root deliberately does not
  // depend on the adopter's toolchain, which is the whole point of keeping it in a fixture.
  const requireFromFixture = createRequire(join(FIXTURE, 'package.json'))
  ;({ ESLint: ESLintCtor } = await import(pathToFileURL(requireFromFixture.resolve('eslint')).href))
  workdir = mkdtempSync(join(FIXTURE, 'scaffold-'))
  execFileSync(process.execPath, [CLI, 'create', 'lint-probe', '--yes', '--theme', 'dark'], {
    cwd: workdir,
    stdio: 'pipe',
  })
  dir = join(workdir, 'lint-probe')
})

after(() => {
  if (workdir) rmSync(workdir, { recursive: true, force: true })
})

/** Lint the generated app with its OWN generated config. */
async function lint(): Promise<
  Array<{ filePath: string; messages: unknown[]; errorCount: number }>
> {
  const eslint = new ESLintCtor({
    cwd: dir,
    overrideConfigFile: join(dir, 'eslint.config.js'),
    errorOnUnmatchedPattern: false,
  })
  return eslint.lintFiles([join(dir, 'src')])
}

describe('scaffold-lint — `cascivo create` produces an app whose lint actually runs', () => {
  it('ESLint inspects every TypeScript file in src/', async () => {
    const generated = generatedTsFiles(dir)
    assert.ok(generated.length >= 4, `scaffold emitted only ${generated.length} TS files?`)

    const results = await lint()
    const linted = results.map((r) => r.filePath.slice(dir.length + 1).replaceAll('\\', '/'))

    assert.deepEqual(
      [...linted].sort(),
      [...generated].sort(),
      'ESLint did not report on every generated TypeScript file. When the flat config ' +
        'registers no TS parser and no `files` pattern, ESLint 9 silently skips .ts/.tsx ' +
        '("File ignored because no matching configuration was supplied") and `lint` exits 0 ' +
        'having checked nothing. Add `...tseslint.configs.recommended` to the template.',
    )
  })

  it('a freshly generated app has zero lint errors', async () => {
    const results = await lint()
    const errors = results.flatMap((r) =>
      (
        r.messages as Array<{
          severity: number
          ruleId: string | null
          message: string
          line: number
        }>
      )
        .filter((m) => m.severity === 2)
        .map(
          (m) => `${r.filePath.slice(dir.length + 1)}:${m.line}  ${m.ruleId ?? '?'}  ${m.message}`,
        ),
    )
    assert.deepEqual(errors, [], `A freshly scaffolded app must lint clean:\n${errors.join('\n')}`)
  })

  it('signal writes do not trip react-hooks/immutability', async () => {
    // The rule `@cascivo/eslint-config` exists to switch off. If this ever errors, the
    // config is not being applied and every adopter's first `signal.value = x` is a lint
    // failure in code the docs told them to write.
    const probe = join(dir, 'src', 'signal-probe.tsx')
    writeFileSync(
      probe,
      `import { signal } from '@preact/signals-react'\n` +
        `const saved = signal(false)\n` +
        `export function Probe() {\n` +
        `  return <button onClick={() => (saved.value = true)}>{String(saved.value)}</button>\n` +
        `}\n`,
    )
    const results = await lint()
    const hits = results.flatMap((r) =>
      (r.messages as Array<{ ruleId: string | null; severity: number }>)
        .filter((m) => m.severity === 2 && m.ruleId?.includes('immutability'))
        .map((m) => `${r.filePath}: ${m.ruleId}`),
    )
    rmSync(probe, { force: true })
    assert.deepEqual(
      hits,
      [],
      'react-hooks/immutability fired — @cascivo/eslint-config is not applied',
    )
  })

  it('rules genuinely run (an unused local errors)', async () => {
    // Without this, the test above passes on a config that lints nothing — which is the
    // whole defect. This is the control.
    const probe = join(dir, 'src', 'unused-probe.ts')
    writeFileSync(probe, `export function probe() {\n  const unusedLocal = 1\n  return 2\n}\n`)
    const results = await lint()
    const reported = results
      .filter((r) => r.filePath.endsWith('unused-probe.ts'))
      .flatMap((r) => (r.messages as Array<{ ruleId: string | null }>).map((m) => m.ruleId))
    rmSync(probe, { force: true })
    assert.ok(
      reported.some((id) => id?.includes('no-unused-vars')),
      `Expected an unused-variable diagnostic, got: ${JSON.stringify(reported)}. ` +
        'If this is empty, ESLint is not applying rules to TypeScript files at all.',
    )
  })
})

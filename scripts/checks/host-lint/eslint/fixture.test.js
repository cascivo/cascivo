/**
 * Tests for the consumer-shaped ESLint fixture itself.
 *
 * The fixture asserts vendored source passes an adopter's real toolchain. These tests assert
 * the *fixture* is honest — that it cannot pass vacuously, and that every rule
 * `@cascivo/eslint-config` scopes off is a rule that genuinely fires without it.
 *
 * That second test is the point. Before the fixture, `cascivoVendoredSource()` was authored
 * from a list of rules someone had seen fire and had never been executed against the source
 * it claims to cover. A scope-off list nobody runs grows stale in both directions: it keeps
 * entries for rules that no longer fire (dead config that reads as coverage) and misses the
 * ones that do (117 errors an adopter hit and cascivo did not).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { ESLint } from 'eslint'
import { tanstackConfig } from '@tanstack/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'
import {
  cascivoPropVocabulary,
  cascivoSignals,
  cascivoVendoredSource,
} from '@cascivo/eslint-config'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', '..', '..', '..')

/** A slice broad enough to exercise every scoped-off class, small enough to stay fast. */
const SAMPLE = [
  'alert-dialog/alert-dialog.tsx',
  'app-shell/app-shell.tsx',
  'blockquote/blockquote.tsx',
  'command-menu/command-menu.tsx',
  'editable/editable.tsx',
  'menu/menu.tsx',
  'navigation-menu/navigation-menu.tsx',
  'popover/use-popover.ts',
  'shell-header/shell-header.tsx',
  'toast/toast.tsx',
].map((f) => join(ROOT, 'packages', 'components', 'src', f))

const typeAwareRoot = {
  name: 'fixture/type-aware-root',
  files: ['packages/components/src/**/*.{ts,tsx}'],
  languageOptions: {
    parserOptions: {
      projectService: false,
      project: [join(ROOT, 'packages', 'components', 'tsconfig.json')],
      tsconfigRootDir: ROOT,
    },
  },
}

/** Lint the sample with the host config, with or without the cascivo fragments. */
async function lint({ withCascivo }) {
  const eslint = new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: [
      ...tanstackConfig,
      reactHooks.configs.flat['recommended-latest'],
      ...(withCascivo ? [cascivoSignals, cascivoVendoredSource('packages/components/src/**')] : []),
      typeAwareRoot,
    ],
  })
  const results = await eslint.lintFiles(SAMPLE)
  const fired = new Set()
  for (const r of results) {
    for (const m of r.messages) {
      assert.ok(!m.fatal, `parser failed on ${r.filePath}: ${m.message}`)
      if (m.severity === 2 && m.ruleId) fired.add(m.ruleId)
    }
  }
  return fired
}

test('the fixture config lints real files (cannot pass vacuously)', async () => {
  const eslint = new ESLint({
    cwd: ROOT,
    overrideConfigFile: join(here, 'eslint.config.js'),
  })
  const results = await eslint.lintFiles(SAMPLE)
  assert.equal(results.length, SAMPLE.length, 'every sample file should be linted')
  for (const r of results) {
    const skipped = r.messages.find((m) => /outside of base path/.test(m.message))
    assert.ok(!skipped, `${r.filePath} was skipped, not linted — the run would prove nothing`)
  }
})

test('every rule cascivoVendoredSource scopes off actually fires without it', async () => {
  const withoutCascivo = await lint({ withCascivo: false })

  // The rules the fragment claims to silence, read from the fragment itself rather than
  // restated here — one owner, so this test cannot drift from the config it checks.
  const scopedOff = Object.entries(cascivoVendoredSource('packages/components/src/**').rules)
    .filter(([, level]) => level === 'off')
    .map(([rule]) => rule)

  // Rules a 10-file sample legitimately may not reach. Everything else must fire, or the
  // scope-off is dead config and should be deleted.
  const notInSample = new Set([
    '@typescript-eslint/naming-convention',
    '@typescript-eslint/method-signature-style',
    'sort-imports',
    'react/no-array-index-key',
    'no-shadow',
    'no-control-regex',
    '@typescript-eslint/array-type',
    'import/order',
  ])

  const dead = scopedOff.filter((r) => !notInSample.has(r) && !withoutCascivo.has(r))
  assert.deepEqual(
    dead,
    [],
    `these rules are scoped off but no longer fire — delete them from cascivoVendoredSource: ${dead.join(', ')}`,
  )
})

test('applying the cascivo fragments clears every error the sample produces', async () => {
  const withCascivo = await lint({ withCascivo: true })
  assert.deepEqual(
    [...withCascivo],
    [],
    'the published fragment must make vendored source pass — that is its entire claim',
  )
})

test('the published flat-config snippet matches the fixture config byte for byte', () => {
  const config = readFileSync(join(here, 'eslint.config.js'), 'utf8')
  const snippet = config
    .split('// host-lint:snippet-start')[1]
    ?.split('// host-lint:snippet-end')[0]
    ?.trim()
  assert.ok(snippet, 'snippet markers missing from eslint.config.js')

  const guide = readFileSync(join(ROOT, 'docs/USING-WITH-STRICT-ESLINT.md'), 'utf8')
  assert.ok(
    guide.includes(snippet),
    'docs/USING-WITH-STRICT-ESLINT.md must embed the fixture config verbatim — it is the ' +
      'single owner of the snippet, and it is the only copy that is executed.',
  )
})

test('no surface names the legacy eslintrc entry point as if it were flat', () => {
  // The bug this encodes: `eslint-plugin-react-hooks` exports BOTH
  // `configs['recommended-latest']` (legacy eslintrc) and `configs.flat['recommended-latest']`.
  // Naming the former in flat-config instructions produces a config that silently applies
  // nothing. llms.txt is generated and line-oriented, so it carries the fact rather than the
  // whole block — but it must carry the correct one.
  const flat = "configs.flat['recommended-latest']"
  for (const rel of [
    'apps/site/public/llms.txt',
    'scripts/llms/generate.ts',
    // The CLI's own scaffold shipped the legacy form, so `cascivo create` generated an
    // eslint.config.js whose react-hooks rules never ran.
    'packages/cli/src/commands/create.ts',
  ]) {
    const doc = readFileSync(join(ROOT, rel), 'utf8')
    if (!/recommended-latest/.test(doc)) continue
    assert.ok(
      doc.includes(flat),
      `${rel} mentions recommended-latest but never the flat entry point \`${flat}\`. ` +
        'A reader following it gets a config that applies no rules.',
    )
  }
})

/**
 * `cascivo/prop-vocabulary` is attached to the published config AND actually fires.
 *
 * A rule that silently detaches — a plugin key that stops matching, a config fragment that
 * drops out of the spread — produces zero warnings, which is indistinguishable from clean
 * code. That is the shape of the react-hooks bug this whole fixture was built around:
 * `recommended-latest` resolved, applied nothing, and looked like a pass. So the rule is
 * asserted against source that SHOULD trip it, not against source that should not.
 */
test('the prop-vocabulary rule is wired up and fires on a wrong guess', async () => {
  const eslint = new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: [
      // The default parser needs telling about JSX; an adopter's config has this from
      // whatever React preset they use.
      { files: ['**/*.jsx'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
      cascivoSignals,
      cascivoPropVocabulary,
    ],
  })
  const [result] = await eslint.lintText('const a = <Text tone="subtle">x</Text>\n', {
    filePath: join(ROOT, 'probe.jsx'),
  })
  const messages = (result?.messages ?? []).filter((m) => m.ruleId === 'cascivo/prop-vocabulary')
  assert.equal(
    messages.length,
    1,
    'The published config no longer reports a known-wrong prop. Either the rule detached ' +
      'from the config, or its data file lost the row — both look exactly like clean code.',
  )
  assert.match(messages[0].message, /it is `muted`/)
  assert.equal(messages[0].severity, 1, 'must stay a warning — an error gets the config deleted')
})

test('the prop-vocabulary rule stays quiet on the source this repo ships', async () => {
  // The other half. This rule runs on every JSX element in an adopter's app; a false
  // positive is a warning they see hundreds of times, and the rational response is to delete
  // @cascivo/eslint-config — which takes react-hooks/immutability with it.
  const eslint = new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: [cascivoSignals, cascivoPropVocabulary, typeAwareRoot],
  })
  const results = await eslint.lintFiles(SAMPLE)
  const noise = results.flatMap((r) =>
    r.messages
      .filter((m) => m.ruleId === 'cascivo/prop-vocabulary')
      .map((m) => `${r.filePath}:${m.line} ${m.message}`),
  )
  assert.deepEqual(
    noise,
    [],
    `prop-vocabulary fired on cascivo's own source:\n  ${noise.join('\n  ')}`,
  )
})

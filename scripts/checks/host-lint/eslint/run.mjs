#!/usr/bin/env node
/**
 * `pnpm lint:host-eslint` — runs the adopter's REAL toolchain over the source
 * `cascivo add` copies into their project.
 *
 * ## Why this exists (Mechanism F)
 *
 * `pnpm lint:host-strict` was written for exactly this job and runs **oxlint**. oxlint does
 * not implement the React-Compiler-backed `react-hooks/refs`, `react-hooks/purity`, or
 * `react-hooks/static-components`. So that guard covers the intersection of two toolchains
 * and is structurally blind to the difference — which is where all 13 errors in the
 * 2026-08-06 adopter report lived, across 41 render-phase ref writes and 9
 * `getLinkComponent()` sites it could never have seen.
 *
 * A re-implementation can only ever cover the intersection. This runs the real thing.
 *
 * ## What it asserts
 *
 * Zero ESLint **errors** over `packages/components/src`, using the config in
 * `eslint.config.js` — which is what the official TanStack Start scaffolder emits, plus
 * `...cascivo` spread last exactly as the docs instruct. Warnings are printed but do not
 * fail: the contract is "an adopter never inherits an *error* in code they didn't write".
 *
 * That second half matters. `@cascivo/eslint-config` claims to make vendored source pass a
 * strict host config. Before this fixture, that claim had never been executed. Any rule the
 * fragment scopes off must be a rule that actually fires here — otherwise the fragment is
 * prose wearing a guard's clothes.
 */
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', '..', '..', '..')
const TARGET = join(ROOT, 'packages', 'components', 'src')

/**
 * Files `cascivo add` never copies. Kept identical to `.oxlintrc.json`'s `ignorePatterns`
 * so the two guards agree on scope and differ only in rule coverage.
 */
const EXCLUDE = [
  /\.test\.tsx?$/,
  /\.contract\.test\.tsx$/,
  /\.stories\.tsx$/,
  /[/\\]test-utils[/\\]/,
  /_all-metas\.ts$/,
  // Vitest setup — excluded by packages/components/tsconfig.json too, so type-aware rules
  // cannot parse it, and `cascivo add` never copies it.
  /[/\\]setup\.ts$/,
]

function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collect(full, out)
      continue
    }
    if (!/\.tsx?$/.test(full)) continue
    if (EXCLUDE.some((re) => re.test(full))) continue
    out.push(full)
  }
  return out
}

const files = collect(TARGET)
if (files.length === 0) {
  console.error('lint:host-eslint: collected 0 files — the target moved. Fix the glob.')
  process.exit(1)
}

const eslint = new ESLint({
  // The repo root, not the fixture dir. ESLint 10 derives a flat config's base path from
  // the config file's location and silently *skips* files outside it — with a warning, not
  // an error. Pointed at the fixture dir this run reported "298 files, 0 errors" while
  // linting nothing at all. The canary below exists so that can never pass again.
  cwd: ROOT,
  overrideConfigFile: join(here, 'eslint.config.js'),
  // Fixture mechanics, deliberately NOT in eslint.config.js: that file is the published
  // snippet and must stay exactly what an adopter writes. An adopter's config sits beside
  // their tsconfig.json; this one sits two directories away, so type-aware rules need to be
  // told where the project root is.
  overrideConfig: [
    {
      name: 'host-lint-fixture/type-aware-root',
      files: ['packages/components/src/**/*.{ts,tsx}'],
      languageOptions: {
        parserOptions: {
          projectService: false,
          project: [join(ROOT, 'packages', 'components', 'tsconfig.json')],
          tsconfigRootDir: ROOT,
        },
      },
    },
  ],
  errorOnUnmatchedPattern: false,
})

const results = await eslint.lintFiles(files)

// Non-vacuity canary. A guard that can pass by linting nothing is worse than no guard: it
// reports coverage it does not have. Assert the run actually produced rule activity from
// the plugin this fixture is *about*, and that no file was skipped as out-of-base-path.
const skipped = results.filter((r) =>
  r.messages.some((m) => m.ruleId === null && /outside of base path/.test(m.message)),
)
if (skipped.length > 0) {
  console.error(
    `lint:host-eslint: ${skipped.length} file(s) skipped as "outside of base path" — ` +
      'the run linted nothing and would have reported success. Fix `cwd`.',
  )
  process.exit(1)
}
const fatal = results.flatMap((r) => r.messages.filter((m) => m.fatal))
if (fatal.length > 0) {
  console.error('lint:host-eslint: parser failed — the run proves nothing.\n')
  for (const m of fatal.slice(0, 5)) console.error(`  ${m.message}`)
  process.exit(1)
}

const errors = []
for (const result of results) {
  for (const m of result.messages) {
    if (m.severity !== 2) continue
    errors.push({
      file: relative(ROOT, result.filePath),
      line: m.line,
      rule: m.ruleId ?? '(parse)',
      message: m.message,
    })
  }
}

const warnCount = results.reduce((n, r) => n + r.warningCount, 0)

if (errors.length === 0) {
  console.log(
    `lint:host-eslint — ${files.length} vendored files, 0 errors` +
      (warnCount ? `, ${warnCount} warnings (not gated)` : ''),
  )
  process.exit(0)
}

// Group by rule: the rule id is the actionable unit. A class with 41 sites is a config
// decision; a class with 1 site is a source fix. Reporting file-by-file hides that.
const byRule = new Map()
for (const e of errors) {
  if (!byRule.has(e.rule)) byRule.set(e.rule, [])
  byRule.get(e.rule).push(e)
}

console.error(`\nlint:host-eslint: ${errors.length} error(s) in source \`cascivo add\` copies.\n`)
for (const [rule, list] of [...byRule].sort((a, b) => b[1].length - a[1].length)) {
  console.error(`  ${rule} — ${list.length} site(s)`)
  for (const e of list.slice(0, 8)) console.error(`      ${e.file}:${e.line}  ${e.message}`)
  if (list.length > 8) console.error(`      … and ${list.length - 8} more`)
  console.error('')
}
console.error(
  'Each class is either a source fix or a documented scope-off in @cascivo/eslint-config.\n' +
    'See docs/USING-WITH-STRICT-ESLINT.md. Do not add a scope-off without a written rationale.',
)
process.exit(1)

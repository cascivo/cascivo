import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_CONFIG,
  detectPackageManager,
  installHint,
  THEMES,
  type ThemeName,
} from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { writeFileSafe } from '../utils/fs.js'
import { flagValue, resolvePackageManagerFlag } from '../utils/args.js'

/**
 * Everything an app needs to build with copied cascivo source: the runtime
 * packages plus the `@preact/signals-react` peer of `@cascivo/core` (installed
 * explicitly rather than relying on peer auto-linking, which yarn never does and
 * npm skips when its install crashes). `@cascivo/i18n`/`@cascivo/charts` are
 * added on demand by `cascivo add` when a component or chart declares them.
 */
const RUNTIME_DEPS = [
  '@cascivo/core',
  '@cascivo/tokens',
  '@cascivo/themes',
  '@preact/signals-react',
]

/** Dev-only: `cascivo` provides the `CascadeConfig` type the generated config imports. */
const DEV_DEPS = ['cascivo']

async function promptTheme(): Promise<ThemeName> {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const answer = (await rl.question(`Theme? (${THEMES.join('/')}) [light]: `))
      .trim()
      .toLowerCase()
    return (THEMES as readonly string[]).includes(answer) ? (answer as ThemeName) : 'light'
  } finally {
    rl.close()
  }
}

function configFileContents(theme: ThemeName): string {
  return `import type { CascadeConfig } from 'cascivo'

const config: CascadeConfig = {
  registry: '${DEFAULT_CONFIG.registry}',
  outputDir: '${DEFAULT_CONFIG.outputDir}',
  theme: '${theme}',
}

export default config
`
}

const ESLINT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
]

/**
 * Copied cascivo source can trip a strict host ESLint config on stylistic rules.
 * If the project has an ESLint config, point at the scoping recipe rather than
 * editing the adopter's config for them.
 */
function hintEslintIfPresent(cwd: string): void {
  if (!ESLINT_CONFIGS.some((f) => existsSync(join(cwd, f)))) return
  console.log('\nESLint: copied cascivo source may trip a strict host config on stylistic rules.')
  console.log('  Scope them off your components dir — see docs/USING-WITH-STRICT-ESLINT.md')
}

/**
 * Write dependency entries into `package.json` so a failed install still leaves a
 * DECLARATIVE-complete project, one `install` away from working.
 *
 * The reported failure: one unrelated bad version range elsewhere in the adopter's
 * `package.json` made `pnpm add` exit non-zero. cascivo had already written
 * `cascivo.config.ts`, so the project claimed to be cascivo-configured with none of the
 * runtime present, and the printed advice ("install them yourself") was the same command
 * that had just failed. Recording the dependencies is the difference between "recoverable
 * with one command" and "figure out what was supposed to be here".
 *
 * Never overwrites an entry that already exists — the app's own pin wins.
 */
function recordDependencies(cwd: string, packages: string[], opts: { dev: boolean }): string[] {
  const pkgPath = join(cwd, 'package.json')
  if (!existsSync(pkgPath)) return []
  let pkg: Record<string, unknown>
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
  } catch {
    return []
  }
  const field = opts.dev ? 'devDependencies' : 'dependencies'
  const deps = (pkg[field] ??= {}) as Record<string, string>
  const added: string[] = []
  for (const name of packages) {
    if (deps[name] !== undefined) continue
    deps[name] = 'latest'
    added.push(name)
  }
  if (added.length === 0) return []
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  return added
}

/** Formatter ignore files, in the order a project is likely to use them. */
const FORMATTER_IGNORES = [
  {
    config: ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'],
    ignore: '.prettierignore',
  },
  { config: ['.oxfmtrc', '.oxfmtrc.json'], ignore: '.oxfmtignore' },
] as const

/**
 * Exclude the vendored components dir from the project's formatter.
 *
 * Owning the code means your formatter reformats it, and then `cascivo update` reports drift
 * on files you never touched. This ACTS rather than hints: the ESLint equivalent below only
 * prints a pointer, and an adopter ran `prettier --write .` before ever reading it.
 *
 * Idempotent, and never rewrites an existing line.
 */
function ensureFormatterIgnore(cwd: string, outputDir: string): void {
  const line = `${outputDir.replace(/\/+$/, '')}/`
  for (const { config, ignore } of FORMATTER_IGNORES) {
    const hasFormatter =
      config.some((f) => existsSync(join(cwd, f))) || hasPrettierKeyInPackageJson(cwd, ignore)
    if (!hasFormatter) continue

    const path = join(cwd, ignore)
    const current = existsSync(path) ? readFileSync(path, 'utf8') : ''
    if (current.split('\n').some((l) => l.trim() === line)) continue

    const banner = '# cascivo: vendored component source — you own it, so do not reformat it\n'
    const next =
      current === '' ? banner + line + '\n' : `${current.replace(/\n*$/, '\n')}\n${banner}${line}\n`
    writeFileSync(path, next, 'utf8')
    console.log(
      `\nAdded "${line}" to ${ignore} (so your formatter does not rewrite copied source).`,
    )
  }
}

/** `prettier` key in package.json counts as a Prettier config — only relevant to .prettierignore. */
function hasPrettierKeyInPackageJson(cwd: string, ignore: string): boolean {
  if (ignore !== '.prettierignore') return false
  const pkgPath = join(cwd, 'package.json')
  if (!existsSync(pkgPath)) return false
  try {
    return 'prettier' in (JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>)
  } catch {
    return false
  }
}

/** The "here's everything you need" summary, printed once at the end of init. */
function printDependencySummary(): void {
  console.log('\nDependencies')
  console.log(`  runtime: ${RUNTIME_DEPS.join(' ')}`)
  console.log(`  dev:     ${DEV_DEPS.join(' ')} (types for cascivo.config.ts)`)
  console.log(
    '  on demand: @cascivo/i18n, @cascivo/charts — added by `cascivo add` when a component or chart needs them',
  )
}

export async function init(args: string[] = [], cwd: string = process.cwd()): Promise<void> {
  const yes = args.includes('--yes') || args.includes('-y')
  const noInstall = args.includes('--no-install')
  const themeArg = flagValue(args, 'theme')?.toLowerCase()

  if (themeArg !== undefined && !(THEMES as readonly string[]).includes(themeArg)) {
    console.error(`Unknown theme "${themeArg}". Available: ${THEMES.join(', ')}`)
    process.exitCode = 1
    return
  }

  const pmFlag = resolvePackageManagerFlag(args)
  if ('error' in pmFlag) {
    console.error(pmFlag.error)
    process.exitCode = 1
    return
  }
  const pm = detectPackageManager(cwd, pmFlag.pm ? { override: pmFlag.pm } : {})

  // Prompt only when interactive: --yes, a valid --theme, or a non-TTY stdin
  // (CI, agents, pipes) all take the default without blocking.
  const interactive = themeArg === undefined && !yes && stdin.isTTY
  const theme: ThemeName = (themeArg as ThemeName) ?? (interactive ? await promptTheme() : 'light')

  // Write the config before installing so a failed install can never leave a
  // half-initialized project (the report's npm-in-pnpm crash left exactly this).
  const configPath = join(cwd, 'cascivo.config.ts')
  await writeFileSafe(configPath, configFileContents(theme))
  console.log(`\nCreated cascivo.config.ts (theme: ${theme})`)

  if (noInstall) {
    console.log('\nSkipped install (--no-install). Install the dependencies yourself:')
    console.log(`  ${installHint(pm, RUNTIME_DEPS)}`)
    console.log(`  ${installHint(pm, DEV_DEPS, { dev: true })}`)
  } else {
    const runtimeOk = installPackages(RUNTIME_DEPS, cwd, { pm })
    const devOk = installPackages(DEV_DEPS, cwd, { pm, dev: true })
    if (!runtimeOk || !devOk) {
      // Never leave a project "configured but not installed". Record what it needs, say
      // plainly what state it is in, and give a command that is not the one that just failed.
      const recorded = [
        ...(runtimeOk ? [] : recordDependencies(cwd, RUNTIME_DEPS, { dev: false })),
        ...(devOk ? [] : recordDependencies(cwd, DEV_DEPS, { dev: true })),
      ]
      console.error(
        '\nInstall failed — cascivo.config.ts was written but the packages are not installed.',
      )
      if (recorded.length > 0) {
        console.error(
          `Wrote ${recorded.length} dependency entries to package.json: ${recorded.join(', ')}`,
        )
        console.error(`Recover with:\n  ${pm} install`)
      } else {
        console.error(
          `Recover with:\n  ${installHint(pm, RUNTIME_DEPS)}\n  ${installHint(pm, DEV_DEPS, { dev: true })}`,
        )
      }
      process.exitCode = 1
    }
  }

  // The COMPLETE stylesheet wiring, in import order. Printing only the theme line left an
  // adopter to discover the tokens sheet by debugging a grayscale app, and the charts sheet
  // by shipping a chart whose screen-reader data table rendered visibly.
  console.log('\nStylesheets — import these once, in this order, in your entry file:')
  console.log(
    `  import '@cascivo/tokens'                 // primitive tokens — every --cascivo-* value`,
  )
  console.log(
    `  import '@cascivo/themes/${theme}.css'${' '.repeat(Math.max(1, 16 - theme.length))}// the ${theme} theme's semantic values`,
  )
  console.log(
    `  // …then your component CSS (\`cascivo add\` writes .module.css beside each component)`,
  )
  console.log('\nThen set the theme on your root element:')
  console.log(`  <html data-theme="${theme}">`)
  console.log('\nSwitching themes at runtime? Use a bundle instead of the single theme:')
  console.log("  import '@cascivo/themes/light-dark.css'  // light + dark — the common case")
  console.log("  import '@cascivo/themes/all.css'         // all twelve themes")
  console.log("  import { ThemeProvider } from '@cascivo/core'")
  // The single most likely first-day bug, and it has no error message: a component that
  // reads `signal.value` in render never re-renders without this, so handlers fire and the
  // UI just sits there. Consumer apps run no signals transform, so it is never automatic.
  console.log('\nIn YOUR components, when you read a signal during render:')
  console.log("  import { useSignals } from '@cascivo/core'")
  console.log('  function MyComponent() {')
  console.log('    useSignals()   // ← first statement, or the component never re-renders')
  console.log('    return <span>{count.value}</span>')
  console.log('  }')
  console.log('\nAdding a chart later? Charts ship as an npm package with their own stylesheet:')
  console.log("  import '@cascivo/charts/styles.css'      // `cascivo add <chart>` reminds you")

  printDependencySummary()
  ensureFormatterIgnore(cwd, DEFAULT_CONFIG.outputDir)
  hintEslintIfPresent(cwd)

  // The version spread (`@cascivo/react@0.18.x` next to `@cascivo/platform@0.0.x`) is first
  // seen HERE, in the install list this command just printed — not 249 lines into a guide.
  // A 2026-08-21 reporter flagged that it reads as "half of this is pre-alpha" and that the
  // answer, while documented, was only reachable if you already knew to look for it.
  console.log('\nPackages version independently (changesets), so a low number means fewer')
  console.log('releases, not less finished. Pin exact versions, and before upgrading run:')
  console.log('  cascivo doctor --drift    # reads breaking-changes.json, reports API drift')

  console.log('\nAdd components with: cascivo add <name>')
}

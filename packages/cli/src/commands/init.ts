import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { existsSync } from 'node:fs'
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
    if (!runtimeOk || !devOk) process.exitCode = 1
  }

  console.log('\nImport the theme in your root CSS or entry file:')
  console.log(`  import '@cascivo/themes/${theme}.css'`)
  console.log('Then set the theme on your root element:')
  console.log(`  <html data-theme="${theme}">`)

  printDependencySummary()
  hintEslintIfPresent(cwd)

  console.log('\nAdd components with: cascivo add <name>')
}

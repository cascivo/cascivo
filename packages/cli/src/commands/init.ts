import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { join } from 'node:path'
import { DEFAULT_CONFIG, THEMES, type ThemeName } from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { writeFileSafe } from '../utils/fs.js'

function flagValue(args: string[], key: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`--${key}=`))
  if (eq) return eq.slice(key.length + 3)
  const idx = args.indexOf(`--${key}`)
  const next = idx !== -1 ? args[idx + 1] : undefined
  return next && !next.startsWith('--') ? next : undefined
}

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

export async function init(args: string[] = [], cwd: string = process.cwd()): Promise<void> {
  const yes = args.includes('--yes') || args.includes('-y')
  const themeArg = flagValue(args, 'theme')?.toLowerCase()

  if (themeArg !== undefined && !(THEMES as readonly string[]).includes(themeArg)) {
    console.error(`Unknown theme "${themeArg}". Available: ${THEMES.join(', ')}`)
    process.exitCode = 1
    return
  }

  installPackages(['@cascivo/core', '@cascivo/tokens'], cwd)

  // Prompt only when interactive: --yes, a valid --theme, or a non-TTY stdin
  // (CI, agents, pipes) all take the default without blocking.
  const interactive = themeArg === undefined && !yes && stdin.isTTY
  const theme: ThemeName = (themeArg as ThemeName) ?? (interactive ? await promptTheme() : 'light')

  const configPath = join(cwd, 'cascivo.config.ts')
  await writeFileSafe(configPath, configFileContents(theme))

  console.log(`\nCreated cascivo.config.ts (theme: ${theme})`)
  console.log('Import the theme in your root CSS or entry file:')
  console.log(`  import '@cascivo/themes/${theme}.css'`)
  console.log(`Then set the theme on your root element:`)
  console.log(`  <html data-theme="${theme}">`)
  console.log('\nAdd components with: cascivo add <name>')
}

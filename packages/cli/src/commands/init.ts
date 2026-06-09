import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { join } from 'node:path'
import { DEFAULT_CONFIG, type ThemeName } from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { writeFileSafe } from '../utils/fs.js'

const THEMES: ThemeName[] = ['light', 'dark', 'warm']

async function promptTheme(): Promise<ThemeName> {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const answer = (await rl.question('Theme? (light/dark/warm) [light]: ')).trim().toLowerCase()
    return (THEMES as string[]).includes(answer) ? (answer as ThemeName) : 'light'
  } finally {
    rl.close()
  }
}

function configFileContents(theme: ThemeName): string {
  return `import type { CascadeConfig } from 'cascade'

const config: CascadeConfig = {
  registry: '${DEFAULT_CONFIG.registry}',
  outputDir: '${DEFAULT_CONFIG.outputDir}',
  theme: '${theme}',
}

export default config
`
}

export async function init(cwd: string = process.cwd()): Promise<void> {
  installPackages(['@cascade-ui/core', '@cascade-ui/tokens'], cwd)

  const theme = await promptTheme()

  const configPath = join(cwd, 'cascade.config.ts')
  await writeFileSafe(configPath, configFileContents(theme))

  console.log(`\nCreated cascade.config.ts (theme: ${theme})`)
  console.log('Import the theme in your root CSS or entry file:')
  console.log(`  import '@cascade-ui/themes/${theme}.css'`)
  console.log(`Then set the theme on your root element:`)
  console.log(`  <html data-theme="${theme}">`)
  console.log('\nAdd components with: cascade add <name>')
}

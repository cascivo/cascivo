import { argv } from 'node:process'
import { pathToFileURL } from 'node:url'
import { add } from './commands/add.js'
import { generate } from './commands/generate.js'
import { init } from './commands/init.js'
import { list } from './commands/list.js'
import { theme } from './commands/theme.js'
import { update } from './commands/update.js'
import { loadConfig } from './utils/config.js'

export const VERSION = '0.0.0'

export type { CascadeConfig, ThemeName } from './utils/config.js'

const HELP = `cascade ${VERSION} — the CSS-native, signal-driven, AI-first design system

Usage: cascade <command> [options]

Commands:
  init                     Set up cascade in the current project
  add <component...>       Add one or more components to your project
  list [--installed]       List available components
  update <component>       Update an installed component to the latest version
  theme add <name>         Install a theme (light | dark | warm)
  generate <config.json>   Generate TSX from a ViewConfig JSON file

Run "cascade <command> --help" for details.`

export async function run(args: string[]): Promise<void> {
  const [command, ...rest] = args

  switch (command) {
    case 'init':
      await init()
      break
    case 'add':
      await add(rest, await loadConfig())
      break
    case 'list':
      await list(await loadConfig(), { installed: rest.includes('--installed') })
      break
    case 'update':
      await update(rest[0], await loadConfig())
      break
    case 'theme':
      await theme(rest)
      break
    case 'generate':
      await generate(rest, await loadConfig())
      break
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      console.log(HELP)
      break
    case '--version':
    case '-v':
      console.log(VERSION)
      break
    default:
      console.error(`Unknown command: ${command}\n`)
      console.log(HELP)
      process.exitCode = 1
  }
}

const isMain = argv[1] !== undefined && import.meta.url === pathToFileURL(argv[1]).href

if (isMain) {
  run(argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}

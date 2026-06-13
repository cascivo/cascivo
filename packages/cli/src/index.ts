import { argv } from 'node:process'
import { pathToFileURL } from 'node:url'
import { add } from './commands/add.js'
import { runDoctor } from './commands/doctor.js'
import { generate } from './commands/generate.js'
import { init } from './commands/init.js'
import { list } from './commands/list.js'
import { registryBuild } from './commands/registry.js'
import { search } from './commands/search.js'
import { theme } from './commands/theme.js'
import { update } from './commands/update.js'
import { view } from './commands/view.js'
import { loadConfig } from './utils/config.js'

export const VERSION = '0.0.0'

export type { CascadeConfig, ThemeName } from './utils/config.js'

const HELP = `cascivo ${VERSION} — the CSS-native, signal-driven, AI-first design system

Usage: cascivo <command> [options]

Commands:
  init                     Set up cascivo in the current project
  add <component...>       Add one or more components to your project
  list [--installed]       List available components
  update [component]       Update installed components (--check: list outdated)
  search <query>           Search components across registries
  view <spec>              View a component before installing
  theme add <name>         Install a theme (light | dark | warm)
  generate <config.json>   Generate TSX from a ViewConfig JSON file
  doctor [--ci]            Check components for rule violations
  audit --ai <paths...>    Audit AI-generated code against the cascivo contract
  registry build           Build a static registry from a cascivo-registry.json file

Run "cascivo <command> --help" for details.`

export async function run(args: string[]): Promise<void> {
  const [command, ...rest] = args

  switch (command) {
    case 'init':
      await init()
      break
    case 'add':
      await add(rest, await loadConfig(), {
        dryRun: rest.includes('--dry-run'),
        yes: rest.includes('--yes'),
      })
      break
    case 'list':
      await list(await loadConfig(), { installed: rest.includes('--installed') })
      break
    case 'update':
      await update(rest.filter((r) => !r.startsWith('--'))[0], await loadConfig(), {
        check: rest.includes('--check'),
        yes: rest.includes('--yes'),
      })
      break
    case 'search':
      await search(rest, await loadConfig())
      break
    case 'view':
      await view(rest, await loadConfig())
      break
    case 'theme':
      await theme(rest)
      break
    case 'generate':
      await generate(rest, await loadConfig())
      break
    case 'registry':
      if (rest[0] === 'build') {
        await registryBuild(rest.slice(1))
      } else {
        console.error(`Unknown registry subcommand: ${rest[0]}`)
        process.exitCode = 1
      }
      break
    case 'doctor': {
      const ci = rest.includes('--ci')
      const drift = rest.includes('--drift')
      if (drift) {
        const { runDoctorDrift } = await import('./commands/drift.js')
        await runDoctorDrift(rest)
      } else {
        const result = await runDoctor(process.cwd())
        if (result.passed) {
          console.log('No violations found.')
        } else {
          for (const v of result.violations) {
            console.error(`[${v.rule}] ${v.detail}\n  ${v.file}`)
          }
          if (ci) process.exitCode = 1
        }
      }
      break
    }
    case 'audit': {
      const { audit } = await import('./commands/audit.js')
      await audit(rest, await loadConfig())
      break
    }
    case 'tokens':
      if (rest[0] === 'import') {
        const { tokensImport } = await import('./commands/tokens.js')
        await tokensImport(rest.slice(1))
      } else {
        console.error(`Unknown tokens subcommand: ${rest[0]}`)
        process.exitCode = 1
      }
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

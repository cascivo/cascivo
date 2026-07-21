import { createRequire } from 'node:module'
import { argv } from 'node:process'
import { pathToFileURL } from 'node:url'
import { add } from './commands/add.js'
import { create } from './commands/create.js'
import { runDoctor } from './commands/doctor.js'
import { generate } from './commands/generate.js'
import { init } from './commands/init.js'
import { list } from './commands/list.js'
import { registryBuild } from './commands/registry.js'
import { search } from './commands/search.js'
import { theme } from './commands/theme.js'
import { update } from './commands/update.js'
import { view } from './commands/view.js'
import { loadConfig, THEMES } from './utils/config.js'
import { positionalArgs, resolvePackageManagerFlag } from './utils/args.js'

// Read at runtime: this file lives one level below the package root both in
// src/ (dev, tests) and in dist/ (published bundle), so ../package.json is
// always the cascivo package manifest.
export const VERSION: string = (
  createRequire(import.meta.url)('../package.json') as { version: string }
).version

export type { CascadeConfig, ThemeName } from './utils/config.js'

const HELP = `cascivo ${VERSION} — the CSS-native, signal-driven, AI-first design system

Usage: cascivo <command> [options]

Commands:
  create [name]            Scaffold a new ready-to-run app (shell + nav + theme)
                           (--template <spec>: start from a marketplace template)
  init                     Set up cascivo in the current project
  add <component...>       Add components or a template to your project
  list [--installed]       List available components
  update [component]       Update installed components (--check: list outdated)
  search <query>           Search components across registries
  view <spec>              View a component before installing
  theme <add|create>       Install a first-party theme, or build a custom one from /create
  eject <component>        Eject specific tokens into a scoped local override file
  generate <config.json>   Generate TSX from a ViewConfig JSON file
  doctor [--ci]            Check components for rule violations
  audit --ai <paths...>    Audit AI-generated code against the cascivo contract
  registry build           Build a static registry from a cascivo-registry.json file
  template init <name>     Scaffold a new template (source + manifest + registry entry)
  tokens import <file>     Import external design tokens as cascivo overrides

Run "cascivo <command> --help" for details.`

const THEME_LIST = THEMES.join(' | ')

const COMMAND_HELP: Record<string, string> = {
  create: `Usage: cascivo create [name] [options]

Scaffold a new ready-to-run app — Vite + React + TypeScript, pre-wired with the
cascivo app shell, side navigation, header, and a theme.

Options:
  --template <spec>         Start from a marketplace template (@ns/name or owner/repo/name)
  --theme <name>            Theme to install (${THEME_LIST})
  --sections "<a, b>"       Comma-separated nav section labels (one component each)
  --package-manager <pm>    Package manager for README/next-steps (alias --pm; default: auto-detect)
  --yes, -y                 Accept defaults, never prompt`,
  init: `Usage: cascivo init [options]

Set up cascivo in the current project: writes cascivo.config.ts and installs the
runtime dependencies (@cascivo/core, @cascivo/tokens, @cascivo/themes, the
@preact/signals-react peer) plus cascivo as a dev dependency for the config's types.

Options:
  --theme <name>            Theme to configure (${THEME_LIST})
  --package-manager <pm>    Force pnpm | yarn | npm | bun (alias --pm; default: auto-detect)
  --no-install              Write files only; print the install commands to run yourself
  --yes, -y                 Accept defaults, never prompt (implied when stdin is not a TTY)`,
  add: `Usage: cascivo add <component...> [options]

Copy component source (TSX + CSS module) from the registry into your project,
resolving component dependencies. Also installs templates (@ns/name) and
third-party components (owner/repo/name).

Options:
  --dry-run                 Show what would be written without writing
  --package-manager <pm>    Force pnpm | yarn | npm | bun (alias --pm; default: auto-detect)
  --no-install              Don't install npm-distributed entries or deps; print the commands instead
  --yes, -y                 Skip confirmation prompts`,
  list: `Usage: cascivo list [options]

List components available in the configured registry.

Options:
  --installed  Only list components already installed in this project`,
  update: `Usage: cascivo update [component] [options]

Update installed components to the current registry version. Without a
component argument, updates everything in the lockfile.

Options:
  --check    List outdated components without writing
  --yes, -y  Skip confirmation prompts`,
  search: `Usage: cascivo search <query> [options]

Search components across the configured registries.

Options:
  --registry <@ns>  Restrict the search to one registry namespace`,
  view: `Usage: cascivo view <spec>

Preview a component or template (files, dependencies, description) before
installing. <spec> is a bare name, @ns/name, or owner/repo/name.`,
  theme: `Usage: cascivo theme add <name>
       cascivo theme create <name> --from <hash> [--out <path>]

add     Install @cascivo/themes and print the import + data-theme wiring.
create  Turn a theme-builder config into an owned <name>.theme.css. Get <hash>
        from https://cascivo.com/create ("Copy CLI command"). --dry-run prints
        the CSS without writing.

Themes: ${THEME_LIST}`,
  eject: `Usage: cascivo eject <component> [options]

Eject specific tokens into a scoped local override file so you can restyle a
component without forking it.

Options:
  --tokens <a,b>  Comma-separated token names to eject (default: all)
  --scope <sel>   CSS selector the overrides are scoped to
  --out <file>    Output file path
  --dry-run       Print the override file without writing`,
  generate: `Usage: cascivo generate <config.json> [options]

Generate TSX from a ViewConfig JSON file (see the MCP scaffold_view tool).

Options:
  --out <file>            Output file (default: stdout)
  --components-dir <dir>  Components import base (default: ./src/components/ui)`,
  doctor: `Usage: cascivo doctor [options]

Check components in this repo for cascivo rule violations (banned React hooks,
hardcoded strings, missing @cascivo/react exports). In an adopter project (one
with a cascivo.config), also verifies the runtime dependencies copied source
needs — @cascivo/core, @cascivo/tokens, @cascivo/themes, and the
@preact/signals-react peer — are declared in package.json.

Options:
  --ci     Exit non-zero when violations or missing runtime deps are found
  --drift  Compare installed components against the registry (copy-paste drift)`,
  audit: `Usage: cascivo audit --ai <paths...> [options]

Audit AI-generated code against the cascivo contract: hard-coded values that
should be tokens, invented props, missing required props, raw strings where
i18n is expected.

Options:
  --fix           Rewrite unambiguous CSS literals to their token equivalents
  --json          Machine-readable output
  --level <name>  Minimum finding level to report (error | warn; default error)`,
  registry: `Usage: cascivo registry build [dir]

Build a static registry (registry.json + file payloads) from a
cascivo-registry.json manifest, ready to host on any static file server.`,
  template: `Usage: cascivo template init <name> [options]

Scaffold a new template: source, manifest, and registry entry.

Options:
  --category <name>    Template category (e.g. dashboard)
  --framework <name>   Target framework (default react-vite)
  --components <a,b>   Registry components the template composes
  --repo <owner/repo>  Repository the template will be hosted in`,
  tokens: `Usage: cascivo tokens import <file>

Import external design tokens (W3C design-tokens JSON) as cascivo token
overrides.`,
}

export async function run(args: string[]): Promise<void> {
  const [command, ...rest] = args

  // Per-command help must short-circuit BEFORE any prompt, fetch, or install:
  // "cascivo add --help" must never try to install a component named --help.
  if (command !== undefined && (rest.includes('--help') || rest.includes('-h'))) {
    const commandHelp = COMMAND_HELP[command]
    if (commandHelp !== undefined) {
      console.log(commandHelp)
      return
    }
  }

  switch (command) {
    case 'create':
      await create(rest)
      break
    case 'init':
      await init(rest)
      break
    case 'add': {
      const pmFlag = resolvePackageManagerFlag(rest)
      if ('error' in pmFlag) {
        console.error(pmFlag.error)
        process.exitCode = 1
        break
      }
      await add(positionalArgs(rest, ['pm', 'package-manager']), await loadConfig(), {
        dryRun: rest.includes('--dry-run'),
        yes: rest.includes('--yes'),
        noInstall: rest.includes('--no-install'),
        ...(pmFlag.pm ? { pm: pmFlag.pm } : {}),
      })
      break
    }
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
    case 'eject': {
      const { eject } = await import('./commands/eject.js')
      const flag = (key: string): string | undefined => {
        const eq = rest.find((r) => r.startsWith(`--${key}=`))
        if (eq) return eq.slice(key.length + 3)
        const idx = rest.indexOf(`--${key}`)
        const next = idx !== -1 ? rest[idx + 1] : undefined
        // Ignore a following token that is itself a flag (e.g. `--tokens --dry-run`).
        return next && !next.startsWith('--') ? next : undefined
      }
      const tokensArg = flag('tokens')
      await eject(rest, await loadConfig(), {
        ...(tokensArg
          ? {
              tokens: tokensArg
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            }
          : {}),
        ...(flag('scope') ? { scope: flag('scope')! } : {}),
        ...(flag('out') ? { out: flag('out')! } : {}),
        dryRun: rest.includes('--dry-run'),
      })
      break
    }
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
    case 'template':
      if (rest[0] === 'init') {
        const { templateInit } = await import('./commands/template-init.js')
        await templateInit(rest.slice(1))
      } else {
        console.error(`Unknown template subcommand: ${rest[0]}`)
        process.exitCode = 1
      }
      break
    case 'doctor': {
      const ci = rest.includes('--ci')
      const drift = rest.includes('--drift')
      if (drift) {
        const { runDoctorDrift } = await import('./commands/drift.js')
        await runDoctorDrift(await loadConfig())
      } else {
        const cwd = process.cwd()
        const result = await runDoctor(cwd)
        const { checkProjectDependencies, checkSignalsCompat, isAdopterProject } = await import(
          './commands/doctor.js'
        )
        const adopter = isAdopterProject(cwd)
        const deps = adopter ? checkProjectDependencies(cwd) : []
        const missingRequired = deps.filter((d) => d.required)
        const signalsCompat = adopter ? await checkSignalsCompat(cwd) : null
        const signalsError = signalsCompat?.severity === 'error'

        if (result.passed && deps.length === 0 && signalsCompat === null) {
          console.log('No violations found.')
        } else {
          for (const v of result.violations) {
            console.error(`[${v.rule}] ${v.detail}\n  ${v.file}`)
          }
          for (const d of missingRequired) {
            console.error(
              `[missing-dependency] ${d.package} is not in package.json — copied cascivo source needs it. Install: ${d.hint}`,
            )
          }
          if (signalsCompat) {
            const tag = signalsError ? 'signals-incompatible' : 'signals-outdated'
            const log = signalsError ? console.error : console.log
            log(`[${tag}] ${signalsCompat.detail} Upgrade: ${signalsCompat.hint}`)
          }
          for (const d of deps.filter((x) => !x.required)) {
            console.log(
              `[optional] ${d.package} is not installed; add it when a component or chart needs it: ${d.hint}`,
            )
          }
          if (ci && (result.violations.length > 0 || missingRequired.length > 0 || signalsError)) {
            process.exitCode = 1
          }
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

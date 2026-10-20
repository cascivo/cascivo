/**
 * What each published arm starts from, prepared once by the harness, never by the agent
 * (spec §2). A starter is a `template` directory copied into each attempt's working directory
 * plus the installed `nodeModules` the attempt links, so no attempt pays for an install.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { PublishedArmId } from '../arms.ts'
import { CACHE, CLI, pinToTarballs, prepare, run, WITHOUT_API_KEY } from '../env.ts'

/**
 * Pinned so the control stays comparable between runs (`npm view shadcn version`, 2026-10-20).
 * Bumping it changes the shadcn arm: re-run the whole eval.
 */
export const SHADCN_VERSION = '4.22.1'

/**
 * The MCP config for the `shadcn` arm.
 *
 * Verified against shadcn 4.22.1 (2026-10-20): `shadcn --help` lists `mcp [options]` as "MCP
 * server and configuration commands", and `shadcn mcp --help` lists only `init` (it writes a
 * client's config file). `shadcn mcp` with no subcommand starts the stdio server: it answered
 * an MCP `initialize` as `serverInfo.name: "shadcn"` and `tools/list` with its registry tools.
 * That name is the `mcp__shadcn__` prefix of the tools the arm allows (SHADCN_SAFE_TOOLS).
 *
 * `--prefix` is the config's own directory: npx otherwise resolves `shadcn` from the session's
 * directory first, so a `node_modules/shadcn` the agent wrote there would run whenever the CLI
 * restarts the server (it restarts a server that exits mid-session). The server still runs in
 * the session's directory and reads its components.json.
 */
export function shadcnMcpConfig(path: string): string {
  writeFileSync(
    path,
    JSON.stringify(
      {
        mcpServers: {
          shadcn: {
            command: 'env',
            args: [
              ...WITHOUT_API_KEY,
              'npx',
              '--prefix',
              dirname(path),
              '-y',
              `shadcn@${SHADCN_VERSION}`,
              'mcp',
            ],
          },
        },
      },
      null,
      2,
    ),
  )
  return path
}

export interface Starter {
  /** A directory to copy into the attempt's working directory; null for an empty one. */
  template: string | null
  /** The installed dependency tree the attempt links as its `node_modules`. */
  nodeModules: string
}

/**
 * Starter for one arm. Idempotent: a cached starter is reused. Repacking the checkout (`prepare(true)`)
 * rebuilds the cascivo starters but keeps shadcn's, which needs no part of this checkout.
 */
export function prepareStarter(arm: PublishedArmId, log: (line: string) => void): Starter {
  switch (arm) {
    case 'cascivo':
      return { template: null, nodeModules: prepare(false, log) }
    case 'cascivo-bare':
      return bareStarter(log)
    case 'shadcn':
      return shadcnStarter(log)
  }
}

/**
 * The app `cascivo create app --yes` writes, on this checkout's packed packages. The scaffold
 * also writes AGENTS.md, CLAUDE.md and .mcp.json, which are cascivo's AI context: leaving
 * them would hand this arm what it is meant to lack, so they are removed.
 */
function bareStarter(log: (line: string) => void): Starter {
  const nodeModules = prepare(false, log)
  const dir = join(CACHE, 'bare')
  const template = join(dir, 'app')
  if (!existsSync(join(template, 'package.json'))) {
    log('scaffolding the cascivo-bare starter…')
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    run('node', [CLI, 'create', 'app', '--yes'], dir)
    pinToTarballs(join(template, 'package.json'))
    for (const file of ['AGENTS.md', 'CLAUDE.md', '.mcp.json'])
      rmSync(join(template, file), { force: true })
  }
  return { template, nodeModules }
}

/**
 * shadcn's own Vite + Tailwind v4 scaffold, then every component. `init -t vite` creates the
 * project (shadcn's current supported setup) and installs with npm; `-d -y` and CI=1 keep it
 * from prompting. Built in `build/`, then split into `template/` (sources) and `node_modules/`
 * (the install) so the build output of the scaffold never reaches an attempt.
 */
function shadcnStarter(log: (line: string) => void): Starter {
  const dir = join(CACHE, 'shadcn')
  const template = join(dir, 'template')
  const nodeModules = join(dir, 'node_modules')
  const marker = join(dir, '.version')
  const built = existsSync(marker) && readFileSync(marker, 'utf8').trim() === SHADCN_VERSION
  if (built && existsSync(template) && existsSync(nodeModules)) return { template, nodeModules }

  rmSync(dir, { recursive: true, force: true })
  const build = join(dir, 'build')
  const app = join(build, 'app')
  mkdirSync(build, { recursive: true })
  const env = { ...process.env, CI: '1' }
  const shadcn = ['-y', `shadcn@${SHADCN_VERSION}`]
  log(`creating the shadcn starter (shadcn@${SHADCN_VERSION})…`)
  run(
    'npx',
    [...shadcn, 'init', '-t', 'vite', '-b', 'radix', '-d', '-y', '--no-monorepo', '-n', 'app'],
    build,
    env,
  )
  log('adding every shadcn component…')
  run('npx', [...shadcn, 'add', '--all', '-y', '-o'], app, env)

  renameSync(join(app, 'node_modules'), nodeModules)
  rmSync(join(app, 'dist'), { recursive: true, force: true })
  renameSync(app, template)
  rmSync(build, { recursive: true, force: true })
  writeFileSync(marker, `${SHADCN_VERSION}\n`)
  return { template, nodeModules }
}

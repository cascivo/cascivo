/**
 * What each published arm starts from, prepared once by the harness, never by the agent
 * (spec §2). A starter is a `template` directory copied into each attempt's working directory
 * plus the installed `nodeModules` the attempt links, so no attempt pays for an install.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import type { PublishedArmId } from '../arms.ts'
import {
  CACHE,
  CLI,
  pinToTarballs,
  prepare,
  removeStaleBuilds,
  renameIntoPlace,
  run,
  WITHOUT_API_KEY,
} from '../env.ts'

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
 * restarts the server (it restarts a server that exits mid-session).
 *
 * `--cwd` is the same directory. In 4.22.1 `shadcn mcp` uses it only to load `.env`,
 * `.env.local`, `.env.development` and `.env.development.local` through dotenvx, which runs a
 * `$(…)` in a value: from the session's directory, an agent-written `.env` would run when the
 * server starts. The tools read components.json from the process's working directory, which is
 * still the session's.
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
              '--cwd',
              dirname(path),
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
      return { template: cascivoScaffold(log).full, nodeModules: prepare(false, log) }
    case 'cascivo-bare':
      return { template: cascivoScaffold(log).bare, nodeModules: prepare(false, log) }
    case 'shadcn':
      return shadcnStarter(log)
  }
}

/**
 * The app `cascivo create app --yes` writes, on this checkout's packed packages, in two copies:
 *
 * - `full`, for the cascivo arm, keeps the scaffold's AI context (AGENTS.md, and CLAUDE.md that
 *   imports it). Its .mcp.json goes: it names the published server, and the harness passes the
 *   one built from this checkout with `--mcp-config`.
 * - `bare`, for cascivo-bare, has none of the three: the arm measures the model without
 *   cascivo's AI context.
 *
 * One scaffold, so the two arms start from the same app and differ only in that context. Built
 * in a temporary directory and renamed into place, so a build that dies halfway is never reused.
 */
function cascivoScaffold(log: (line: string) => void): { full: string; bare: string } {
  prepare(false, log)
  const dir = join(CACHE, 'scaffold')
  const full = join(dir, 'full')
  const bare = join(dir, 'bare')
  if (existsSync(dir)) return { full, bare }

  log('scaffolding the cascivo starters…')
  removeStaleBuilds(CACHE, 'scaffold-')
  const build = mkdtempSync(join(CACHE, 'scaffold-'))
  try {
    run('node', [CLI, 'create', 'app', '--yes'], build)
    const app = join(build, 'app')
    pinToTarballs(join(app, 'package.json'))
    rmSync(join(app, '.mcp.json'), { force: true })
    cpSync(app, join(build, 'full'), { recursive: true })
    renameSync(app, join(build, 'bare'))
    for (const file of ['AGENTS.md', 'CLAUDE.md'])
      rmSync(join(build, 'bare', file), { force: true })
    renameIntoPlace(build, dir)
  } catch (error) {
    rmSync(build, { recursive: true, force: true })
    throw error
  }
  return { full, bare }
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

  // A cache for another shadcn version (or a half-written one from before builds were atomic).
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  // Built in a private directory and renamed into place: test workers and parallel runs prepare
  // concurrently on a cold cache, and a shared `build/` was deleted under a running `shadcn init`.
  mkdirSync(CACHE, { recursive: true })
  removeStaleBuilds(CACHE, 'shadcn-build-')
  const staging = mkdtempSync(join(CACHE, 'shadcn-build-'))
  const build = join(staging, 'build')
  const app = join(build, 'app')
  const env = { ...process.env, CI: '1' }
  const shadcn = ['-y', `shadcn@${SHADCN_VERSION}`]
  log(`creating the shadcn starter (shadcn@${SHADCN_VERSION})…`)
  try {
    mkdirSync(build, { recursive: true })
    run(
      'npx',
      [...shadcn, 'init', '-t', 'vite', '-b', 'radix', '-d', '-y', '--no-monorepo', '-n', 'app'],
      build,
      env,
    )
    log('adding every shadcn component…')
    run('npx', [...shadcn, 'add', '--all', '-y', '-o'], app, env)
    renameSync(join(app, 'node_modules'), join(staging, 'node_modules'))
    rmSync(join(app, 'dist'), { recursive: true, force: true })
    renameSync(app, join(staging, 'template'))
    rmSync(build, { recursive: true, force: true })
    writeFileSync(join(staging, '.version'), `${SHADCN_VERSION}\n`)
    renameIntoPlace(staging, dir)
  } catch (error) {
    rmSync(staging, { recursive: true, force: true })
    throw error
  }
  return { template, nodeModules }
}

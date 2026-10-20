/**
 * What every run needs from this build, prepared once per session:
 *
 * - the CLI and the MCP server built from this checkout, because the published ones predate
 *   blueprints (the arm under test);
 * - one installed dependency tree, from this checkout's packed packages, that a run's app links
 *   instead of installing: an install per run would be minutes of noise around the measurement.
 *
 * The tree comes from a scaffold with every registry block on a page, so it carries what any
 * blueprint app imports (`@cascivo/charts` included).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
export const CLI = join(REPO, 'packages/cli/bin/cascivo.mjs')
export const MCP = join(REPO, 'packages/mcp/dist/index.mjs')
export const CACHE = join(REPO, 'apps/bench/agent/.cache')

/** The packages a scaffold reaches, as `framework-install.test.ts` packs them. */
const PACKAGES = [
  'react',
  'charts',
  'core',
  'themes',
  'tokens',
  'i18n',
  'storage',
  'icons',
  'data',
  'app',
  'render',
  'text',
  'email',
]

export function run(cmd: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): void {
  try {
    execFileSync(cmd, args, { cwd, stdio: 'pipe', ...(env ? { env } : {}) })
  } catch (error) {
    const e = error as { stdout?: Buffer; stderr?: Buffer }
    throw new Error(
      `\`${cmd} ${args.join(' ')}\` failed in ${cwd}\n${e.stdout ?? ''}${e.stderr ?? ''}`,
    )
  }
}

export function blockNames(): string[] {
  return readdirSync(join(REPO, 'packages/cli/recipes'))
    .filter((d) => d.startsWith('block-'))
    .map((d) => d.slice('block-'.length))
    .sort()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The `file:` spec of the packed `@cascivo/<pkg>` tarball `prepare()` wrote. */
function tarball(pkg: string): string {
  const dir = join(CACHE, 'tarballs')
  const file = existsSync(dir)
    ? readdirSync(dir).find((f) => f.startsWith(`cascivo-${pkg}-`))
    : undefined
  if (!file) throw new Error(`no tarball for @cascivo/${pkg}`)
  return `file:${join(dir, file)}`
}

/**
 * Point a scaffolded app's `@cascivo/*` dependencies at this checkout's packed tarballs, since
 * the published packages predate it. Needs `prepare()` to have run.
 */
export function pinToTarballs(manifestPath: string): void {
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (
    !isRecord(manifest) ||
    !isRecord(manifest.dependencies) ||
    !isRecord(manifest.devDependencies)
  )
    throw new Error(`${manifestPath} has no dependencies and devDependencies objects`)
  for (const dep of Object.keys(manifest.dependencies)) {
    if (dep.startsWith('@cascivo/'))
      manifest.dependencies[dep] = tarball(dep.slice('@cascivo/'.length))
  }
  // Lint is not scored, and this one would install a published copy of this repo.
  delete manifest.devDependencies['@cascivo/eslint-config']
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
}

/** The installed `node_modules` every run links. Built on first use, or again with `fresh`. */
export function prepare(fresh: boolean, log: (line: string) => void): string {
  for (const file of [CLI, MCP, join(REPO, 'packages/react/dist')]) {
    if (!existsSync(file))
      throw new Error(`${file} is missing: run \`pnpm build\` at the repo root first.`)
  }
  const nodeModules = join(CACHE, 'deps', 'node_modules')
  if (!fresh && existsSync(nodeModules)) return nodeModules
  // Not the whole cache: `.cache/shadcn` is built from the network and independent of this checkout.
  // `bare` is scaffolded on these tarballs, so it goes with them.
  for (const stale of ['tarballs', 'deps', 'bare'])
    rmSync(join(CACHE, stale), { recursive: true, force: true })
  const tarballs = join(CACHE, 'tarballs')
  mkdirSync(tarballs, { recursive: true })
  log(`packing ${PACKAGES.length} packages…`)
  for (const pkg of PACKAGES) {
    run('pnpm', ['pack', '--pack-destination', tarballs], join(REPO, 'packages', pkg))
  }
  log('installing the shared dependency tree…')
  writeFileSync(
    join(CACHE, 'cascivo.app.json'),
    JSON.stringify({
      name: 'deps',
      pages: blockNames().map((block) => ({ title: block, block })),
    }),
  )
  run('node', [CLI, 'create', '--from', 'cascivo.app.json', '--pm', 'pnpm'], CACHE)
  const app = join(CACHE, 'deps')
  pinToTarballs(join(app, 'package.json'))
  // Overrides in pnpm-workspace.yaml, as framework-install.test.ts explains: the packed
  // packages ask the registry for each other otherwise.
  writeFileSync(
    join(app, 'pnpm-workspace.yaml'),
    `packages:\n  - '.'\ndangerouslyAllowAllBuilds: true\noverrides:\n` +
      PACKAGES.map((p) => `  '@cascivo/${p}': '${tarball(p)}'`).join('\n') +
      '\n',
  )
  writeFileSync(join(app, '.npmrc'), 'strict-peer-dependencies=false\n')
  run('pnpm', ['install'], app)
  return nodeModules
}

/**
 * A fresh directory for one run, where `npx cascivo` (what the MCP server spawns) resolves to
 * this checkout's CLI instead of downloading the published one.
 */
export function runDirectory(root: string, name: string): string {
  const dir = join(root, name)
  mkdirSync(join(dir, 'node_modules', '.bin'), { recursive: true })
  run('ln', ['-s', join(REPO, 'packages/cli'), join(dir, 'node_modules', 'cascivo')], dir)
  run('ln', ['-s', '../cascivo/bin/cascivo.mjs', join(dir, 'node_modules', '.bin', 'cascivo')], dir)
  return dir
}

/**
 * Prefixes an MCP server's command so it starts without the API key: only the `claude` session
 * needs it, and agent-written code can reach a server and whatever it spawns (`npx cascivo`).
 */
export const WITHOUT_API_KEY = ['-u', 'ANTHROPIC_API_KEY']

export function mcpConfig(path: string): string {
  writeFileSync(
    path,
    JSON.stringify(
      { mcpServers: { cascivo: { command: 'env', args: [...WITHOUT_API_KEY, 'node', MCP] } } },
      null,
      2,
    ),
  )
  return path
}

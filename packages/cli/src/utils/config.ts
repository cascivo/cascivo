import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Canonical (and only) host for hosted cascivo artifacts (registry.json, per-item
 * r/<name>.json, marketplace.json, /llms/*, /context/*). The legacy docs.cascivo.com
 * subdomain is retired and 301s here. Keep in sync with CASCIVO_HOST in packages/mcp.
 */
export const CASCIVO_HOST = 'https://cascivo.com'

/** All first-party themes shipped by @cascivo/themes (selectable via data-theme). */
export const THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
] as const

export type ThemeName = (typeof THEMES)[number]

export type RegistryNamespaceConfig =
  | string
  | { url: string; headers?: Record<string, string>; params?: Record<string, string> }

export interface CascadeConfig {
  /** URL of the registry.json index. */
  registry: string
  /** Directory (relative to project root) where components are written. */
  outputDir: string
  /** Default theme imported by `cascade init`. */
  theme: ThemeName
  /** Namespace → registry URL template (with {name} placeholder) or auth config. */
  registries?: Record<string, RegistryNamespaceConfig>
  /** Whether to copy test files (*.contract.test.tsx) when adding components. */
  tests?: boolean
}

export const DEFAULT_CONFIG: CascadeConfig = {
  // Canonical hosted registry index (served from the landing site, documented in
  // llms.txt). Prefer this over a branch's GitHub raw URL, which 404s for
  // unauthenticated/private-repo requests and breaks `cascivo list`/`add`.
  registry: `${CASCIVO_HOST}/registry.json`,
  outputDir: 'src/components/ui',
  theme: 'light',
}

const CONFIG_FILES = ['cascivo.config.ts', 'cascivo.config.js', 'cascivo.config.mjs']

/** Apply defaults over a (possibly partial) user config object. */
export function resolveConfig(partial: Partial<CascadeConfig> | null | undefined): CascadeConfig {
  return { ...DEFAULT_CONFIG, ...partial }
}

/** Let env vars override config — used by the MCP server to pass `outputDir`. */
export function applyEnvOverrides(
  config: CascadeConfig,
  env: NodeJS.ProcessEnv = process.env,
): CascadeConfig {
  return {
    ...config,
    ...(env.CASCIVO_REGISTRY ? { registry: env.CASCIVO_REGISTRY } : {}),
    ...(env.CASCIVO_OUTPUT_DIR ? { outputDir: env.CASCIVO_OUTPUT_DIR } : {}),
  }
}

/**
 * Locate and load `cascivo.config.{ts,js,mjs}` from `cwd`. Falls back to the
 * default config when no file is found or the file cannot be loaded. Env vars
 * (`CASCIVO_REGISTRY`, `CASCIVO_OUTPUT_DIR`) take precedence.
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<CascadeConfig> {
  for (const file of CONFIG_FILES) {
    const path = join(cwd, file)
    if (!existsSync(path)) continue
    try {
      const mod = (await import(pathToFileURL(path).href)) as {
        default?: Partial<CascadeConfig>
      }
      return applyEnvOverrides(resolveConfig(mod.default ?? (mod as Partial<CascadeConfig>)))
    } catch {
      // Unloadable config (e.g. unsupported TS syntax) — fall back to defaults.
      return applyEnvOverrides(resolveConfig(null))
    }
  }
  return applyEnvOverrides(resolveConfig(null))
}

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun'

/** Narrow an arbitrary string to a known PackageManager. */
export function isPackageManager(value: string | undefined): value is PackageManager {
  return value === 'pnpm' || value === 'yarn' || value === 'npm' || value === 'bun'
}

/**
 * Lock files in probe order. `bun.lock` (bun ≥ 1.2 text lockfile) sits beside the
 * legacy binary `bun.lockb`; `package-lock.json` is npm's marker so a walk that
 * reaches an npm workspace root still resolves to npm rather than the default.
 */
const PM_LOCKFILES: readonly [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['package-lock.json', 'npm'],
]

/** The package manager that invoked this process, from `npm_config_user_agent`. */
function pmFromUserAgent(ua: string | undefined): PackageManager | undefined {
  if (!ua) return undefined
  const name = ua.split('/')[0]
  return isPackageManager(name) ? name : undefined
}

/** The `packageManager` corepack field of a package.json, if it names a known PM. */
function pmFromPackageJson(dir: string): PackageManager | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
      packageManager?: string
    }
    const name = pkg.packageManager?.split('@')[0]
    return isPackageManager(name) ? name : undefined
  } catch {
    return undefined
  }
}

/**
 * Detect the package manager in use. Precedence, highest first:
 *   1. explicit override (the `--package-manager`/`--pm` flag)
 *   2. `CASCIVO_PACKAGE_MANAGER` env var
 *   3. `npm_config_user_agent` (the PM that spawned the CLI, e.g. `pnpm dlx`)
 *   4. an upward walk from `cwd` for a lock file or `packageManager` field —
 *      this is what makes detection work inside a workspace, where the lock
 *      file lives at the repo root, not in the app subdirectory the user runs
 *      the CLI from. The walk stops after a directory containing `.git`.
 *   5. default `npm`.
 */
export function detectPackageManager(
  cwd: string = process.cwd(),
  opts: {
    override?: string
    env?: NodeJS.ProcessEnv
    /**
     * Let a lock file found by walking up from `cwd` outrank `npm_config_user_agent`.
     *
     * For `init`/`add`, which run *inside* an existing project, the user agent is the right
     * first signal: it is the tool the developer just invoked. For `create` it is the wrong
     * one. `npx cascivo create` always reports a `npm/…` agent regardless of what the
     * surrounding workspace uses, and it short-circuited before the walk-up ever ran — so a
     * 2026-08-14 adopter scaffolding into a pnpm workspace with a root `pnpm-lock.yaml` was
     * told to run `npm install`. Where the new project LANDS is a stronger signal than which
     * launcher started the CLI.
     */
    preferLockfileOverUserAgent?: boolean
  } = {},
): PackageManager {
  const env = opts.env ?? process.env

  if (isPackageManager(opts.override)) return opts.override

  const envPm = env.CASCIVO_PACKAGE_MANAGER
  if (isPackageManager(envPm)) return envPm

  const uaPm = pmFromUserAgent(env.npm_config_user_agent)
  if (uaPm && !opts.preferLockfileOverUserAgent) return uaPm

  let current = cwd
  for (;;) {
    for (const [file, pm] of PM_LOCKFILES) {
      if (existsSync(join(current, file))) return pm
    }
    const fromField = pmFromPackageJson(current)
    if (fromField) return fromField
    // A `.git` directory marks the repo root — do not walk past it.
    if (existsSync(join(current, '.git'))) break
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }

  // No lock file anywhere up the tree: fall back to the launcher, which for a brand-new
  // project in an empty directory is the only signal there is.
  return uaPm ?? 'npm'
}

/**
 * Pin every `@cascivo/*` package to an explicit version specifier.
 *
 * A bare name lets the package manager reuse whatever it already has resolvable. In a pnpm
 * workspace a sibling package's lockfile entry won and `@cascivo/i18n` resolved to **0.2.14**
 * while latest was **0.16.0** — then cascivo warned the adopter about the version it had
 * just installed itself. `add name@latest` (or the registry's known floor) makes the intent
 * explicit instead of leaving it to resolution order.
 *
 * Non-cascivo packages (`@preact/signals-react`) keep their bare name: their version is the
 * app's business, and cascivo has no floor to assert.
 */
export function pinSpecifier(pkg: string, floors: Record<string, string> = {}): string {
  if (!pkg.startsWith('@cascivo/') && pkg !== 'cascivo') return pkg
  if (pkg.includes('@', 1)) return pkg // already carries an explicit version
  const floor = floors[pkg]
  // `>=x.y.z` is not an installable specifier on its own; widen it to a range the package
  // manager understands, so a known floor is honoured rather than silently ignored.
  if (floor?.startsWith('>=')) return `${pkg}@${floor.slice(2)} - x`
  return `${pkg}@latest`
}

/** The install subcommand each package manager uses to add dependencies. */
export function installCommand(
  pm: PackageManager,
  packages: string[],
  opts: { dev?: boolean; floors?: Record<string, string>; pin?: string } = {},
): [string, string[]] {
  const verb = pm === 'npm' ? 'install' : 'add'
  const devFlag = opts.dev ? [pm === 'npm' ? '--save-dev' : '-D'] : []
  const specs = packages.map((p) =>
    opts.pin && (p.startsWith('@cascivo/') || p === 'cascivo')
      ? `${p}@${opts.pin}`
      : pinSpecifier(p, opts.floors ?? {}),
  )
  return [pm, [verb, ...devFlag, ...specs]]
}

/** Human-readable install command a user can copy-paste, e.g. `pnpm add -D cascivo`. */
export function installHint(
  pm: PackageManager,
  packages: string[],
  opts: { dev?: boolean } = {},
): string {
  const [cmd, args] = installCommand(pm, packages, opts)
  return `${cmd} ${args.join(' ')}`
}

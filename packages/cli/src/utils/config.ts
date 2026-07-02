import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Canonical host for hosted cascivo artifacts (registry.json, per-item
 * r/<name>.json, marketplace.json). docs.cascivo.com mirrors the same tree.
 * Keep in sync with CASCIVO_HOST in packages/mcp.
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

/** Detect the package manager in use from lock files, defaulting to npm. */
export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(cwd, 'bun.lockb'))) return 'bun'
  return 'npm'
}

/** The install subcommand each package manager uses to add dependencies. */
export function installCommand(pm: PackageManager, packages: string[]): [string, string[]] {
  const verb = pm === 'npm' ? 'install' : 'add'
  return [pm, [verb, ...packages]]
}

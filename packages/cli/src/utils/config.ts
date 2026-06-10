import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export type ThemeName = 'light' | 'dark' | 'warm'

export interface CascadeConfig {
  /** URL of the registry.json index. */
  registry: string
  /** Directory (relative to project root) where components are written. */
  outputDir: string
  /** Default theme imported by `cascade init`. */
  theme: ThemeName
}

export const DEFAULT_CONFIG: CascadeConfig = {
  registry: 'https://raw.githubusercontent.com/urbanisierung/cascade-ui/main/registry.json',
  outputDir: 'src/components/ui',
  theme: 'light',
}

const CONFIG_FILES = ['cascade.config.ts', 'cascade.config.js', 'cascade.config.mjs']

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
    ...(env.CASCADE_REGISTRY ? { registry: env.CASCADE_REGISTRY } : {}),
    ...(env.CASCADE_OUTPUT_DIR ? { outputDir: env.CASCADE_OUTPUT_DIR } : {}),
  }
}

/**
 * Locate and load `cascade.config.{ts,js,mjs}` from `cwd`. Falls back to the
 * default config when no file is found or the file cannot be loaded. Env vars
 * (`CASCADE_REGISTRY`, `CASCADE_OUTPUT_DIR`) take precedence.
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

import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CascadeConfig } from '../utils/config.js'
import { fetchJson } from '../utils/http.js'

const HERE = dirname(fileURLToPath(import.meta.url))

export interface EjectToken {
  name: string
  /** Resolved starting value (light theme), or null when unknown. */
  value: string | null
}

interface RegistryComponentMeta {
  name: string
  tokens?: string[]
}
interface RegistryEntry {
  name: string
  type?: string
  meta?: RegistryComponentMeta
}
interface RegistryFile {
  components: RegistryEntry[]
}
interface CatalogEntry {
  name: string
  value?: string
  resolvedDefault?: string | null
}
interface CatalogFile {
  tokens: CatalogEntry[]
}

/**
 * Build a scoped, locally-owned token-override stylesheet. The component itself
 * stays imported from `@cascivo/react`; only the listed token values are
 * ejected so they can be tuned without copying the whole component in.
 *
 * The block is intentionally *unlayered*: unlayered declarations win over the
 * themed `@layer cascivo.theme` values, so the override always takes effect.
 */
export function buildOverrideCss(opts: {
  component: string
  scope: string
  tokens: EjectToken[]
}): string {
  const { component, scope, tokens } = opts
  const lines: string[] = []
  lines.push(`/* cascivo eject — ${component}`)
  lines.push(' *')
  lines.push(` * Locally-owned token overrides. ${component} is still imported from`)
  lines.push(' * @cascivo/react — only these token values are ejected so you can tune them')
  lines.push(' * without copying the whole component into your repo.')
  lines.push(' *')
  lines.push(' * Unlayered, so these win over the themed layer values. Apply the scope by')
  lines.push(` * adding the selector to the subtree you want to affect, e.g.`)
  lines.push(` *   <div data-cascivo-eject="${component}">…</div>`)
  lines.push(' */')
  lines.push(`${scope} {`)
  for (const t of tokens) {
    if (t.value === null) {
      lines.push(`  /* ${t.name}: set a value — resolves per theme by default */`)
    } else {
      lines.push(`  ${t.name}: ${t.value};`)
    }
  }
  lines.push('}')
  return lines.join('\n') + '\n'
}

/** Walk up from a start dir looking for a file/dir match. */
function findUp(startDir: string, rel: string): string | null {
  let dir = startDir
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, rel)
    if (existsSync(candidate)) return candidate
    dir = join(dir, '..')
  }
  return null
}

function loadRegistry(config: CascadeConfig): Promise<RegistryFile> | RegistryFile {
  const local = findUp(HERE, 'registry.json') ?? findUp(process.cwd(), 'registry.json')
  if (local) return JSON.parse(readFileSync(local, 'utf8')) as RegistryFile
  return fetchJson(config.registry) as Promise<RegistryFile>
}

function loadCatalog(config: CascadeConfig): Promise<CatalogFile> | CatalogFile {
  const local =
    findUp(HERE, join('apps', 'site', 'public', 'tokens.catalog.json')) ??
    findUp(process.cwd(), join('apps', 'site', 'public', 'tokens.catalog.json'))
  if (local) return JSON.parse(readFileSync(local, 'utf8')) as CatalogFile
  const catalogUrl = config.registry.replace(/registry\.json$/, 'tokens.catalog.json')
  return fetchJson(catalogUrl) as Promise<CatalogFile>
}

interface EjectOptions {
  tokens?: string[]
  scope?: string
  out?: string
  dryRun?: boolean
}

/**
 * `cascivo eject <component> [--tokens a,b] [--scope sel] [--out file]`
 *
 * Ejects a targeted slice of a component — specific design tokens — into a
 * scoped local override file, instead of copying the whole component.
 */
export async function eject(
  args: string[],
  config: CascadeConfig,
  options: EjectOptions = {},
): Promise<void> {
  const component = args.find((a) => !a.startsWith('--'))
  if (!component) {
    console.error(
      'Usage: cascivo eject <component> [--tokens a,b] [--scope <selector>] [--out <file>]',
    )
    process.exitCode = 1
    return
  }

  const registry = await loadRegistry(config)
  const entry = registry.components.find((c) => c.name === component)
  if (!entry) {
    console.error(`Component "${component}" not found in the registry.`)
    process.exitCode = 1
    return
  }

  const available = entry.meta?.tokens ?? []
  if (available.length === 0) {
    console.error(`Component "${component}" declares no tokens to eject.`)
    process.exitCode = 1
    return
  }

  let selected = available
  if (options.tokens && options.tokens.length > 0) {
    const unknown = options.tokens.filter((t) => !available.includes(t))
    if (unknown.length > 0) {
      console.error(
        `These tokens are not used by "${component}": ${unknown.join(', ')}\n` +
          `Available: ${available.join(', ')}`,
      )
      process.exitCode = 1
      return
    }
    selected = options.tokens
  }

  const catalog = await loadCatalog(config)
  const valueOf = new Map(
    catalog.tokens.map((t) => [t.name, t.resolvedDefault ?? t.value ?? null] as const),
  )
  const tokens: EjectToken[] = selected.map((name) => ({ name, value: valueOf.get(name) ?? null }))

  const scope = options.scope ?? `[data-cascivo-eject='${component}']`
  const css = buildOverrideCss({ component, scope, tokens })

  if (options.dryRun) {
    console.log(css)
    return
  }

  const out = options.out ?? join('src', 'styles', `cascivo-${component}.overrides.css`)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, css)
  console.log(`Ejected ${tokens.length} token(s) for "${component}" → ${out}`)
  console.log(`Import it after your theme CSS, then add the scope:`)
  console.log(`  import './${out.replace(/\\/g, '/')}'`)
  console.log(`  <div data-cascivo-eject="${component}">…</div>`)
}

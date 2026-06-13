import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface PropInfo {
  name: string
  type: string
  required: boolean
}

export interface ComponentInfo {
  props: PropInfo[]
  /** True if any prop has required: true */
  hasRequiredProps: boolean
  /** Props that have required: true */
  requiredProps: string[]
  /** True if the component declares user-facing chrome text (intent.content) */
  hasContent: boolean
}

export interface Contract {
  /** Map from normalized color/size value → token names */
  tokensByValue: Map<string, string[]>
  /** Map from component name (PascalCase) → component info */
  components: Map<string, ComponentInfo>
}

interface TokenEntry {
  name: string
  resolvedDefault: string | null
}

interface CatalogFile {
  tokens: TokenEntry[]
}

interface RegistryPropMeta {
  name: string
  type?: string
  required?: boolean
}

interface RegistryComponentMeta {
  name: string
  props?: RegistryPropMeta[]
}

interface RegistryEntry {
  meta?: RegistryComponentMeta
}

interface RegistryFile {
  components: RegistryEntry[]
}

interface ContextComponentEntry {
  name: string
  intent?: { content?: unknown }
}

interface ContextFile {
  components: ContextComponentEntry[]
}

const HERE = dirname(fileURLToPath(import.meta.url))

/** Normalize a color/size value for catalog comparison: lowercase, strip spaces. */
export function normalizeValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

/** Walk up from a start directory looking for the apps/docs/public dir. */
function findDocsPublic(startDir: string): string | null {
  let dir = startDir
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'apps', 'docs', 'public')
    if (existsSync(candidate)) return candidate
    dir = join(dir, '..')
  }
  return null
}

/** Walk up from a start directory looking for registry.json at the repo root. */
function findRegistry(startDir: string): string | null {
  let dir = startDir
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'registry.json')
    if (existsSync(candidate)) return candidate
    dir = join(dir, '..')
  }
  return null
}

export interface BuildContractInput {
  catalog: CatalogFile
  registry: RegistryFile
  context: ContextFile
}

/** Pure builder — assemble a Contract from already-parsed JSON. Testable without fs. */
export function buildContract(input: BuildContractInput): Contract {
  const tokensByValue = new Map<string, string[]>()
  for (const token of input.catalog.tokens) {
    if (token.resolvedDefault == null) continue
    const key = normalizeValue(token.resolvedDefault)
    const list = tokensByValue.get(key)
    if (list) list.push(token.name)
    else tokensByValue.set(key, [token.name])
  }

  const contentNames = new Set<string>()
  for (const c of input.context.components) {
    if (c.intent?.content) contentNames.add(c.name)
  }

  const components = new Map<string, ComponentInfo>()
  for (const entry of input.registry.components) {
    const meta = entry.meta
    if (!meta?.name) continue
    const props: PropInfo[] = (meta.props ?? []).map((p) => ({
      name: p.name,
      type: p.type ?? 'unknown',
      required: p.required === true,
    }))
    const requiredProps = props.filter((p) => p.required).map((p) => p.name)
    components.set(meta.name, {
      props,
      requiredProps,
      hasRequiredProps: requiredProps.length > 0,
      hasContent: contentNames.has(meta.name),
    })
  }

  return { tokensByValue, components }
}

/**
 * Load the published cascade contract from local generated artifacts:
 * - token catalog (apps/docs/public/tokens.catalog.json) → value→token map
 * - registry.json (repo root) → component prop index
 * - context bundle (apps/docs/public/context.json) → which components have chrome text
 */
export async function loadContract(options?: {
  catalogPath?: string
  contextPath?: string
  registryPath?: string
}): Promise<Contract> {
  const docsPublic = findDocsPublic(HERE) ?? findDocsPublic(process.cwd())
  const catalogPath =
    options?.catalogPath ?? (docsPublic ? join(docsPublic, 'tokens.catalog.json') : null)
  const contextPath = options?.contextPath ?? (docsPublic ? join(docsPublic, 'context.json') : null)
  const registryPath = options?.registryPath ?? findRegistry(HERE) ?? findRegistry(process.cwd())

  if (!catalogPath || !existsSync(catalogPath)) {
    throw new Error('token catalog not found (apps/docs/public/tokens.catalog.json)')
  }
  if (!registryPath || !existsSync(registryPath)) {
    throw new Error('registry.json not found')
  }
  if (!contextPath || !existsSync(contextPath)) {
    throw new Error('context bundle not found (apps/docs/public/context.json)')
  }

  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogFile
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as RegistryFile
  const context = JSON.parse(readFileSync(contextPath, 'utf8')) as ContextFile

  return buildContract({ catalog, registry, context })
}

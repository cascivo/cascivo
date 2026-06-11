import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface PropMeta {
  name: string
  type: string
  required?: boolean
  default?: string
  description?: string
}

export interface ComponentMeta {
  name: string
  description: string
  category: string
  props: PropMeta[]
  [key: string]: unknown
}

export interface RegistryEntry {
  name: string
  type?: string
  meta: ComponentMeta
  [key: string]: unknown
}

export interface Registry {
  version: string
  components: RegistryEntry[]
}

const HERE = dirname(fileURLToPath(import.meta.url))

function resolveRegistryPath(): string {
  const envPath = process.env['CASCADE_REGISTRY_PATH']
  const candidates = [
    ...(envPath ? [envPath] : []),
    join(HERE, 'registry.json'),
    join(HERE, '..', '..', '..', 'registry.json'),
    join(HERE, '..', '..', 'registry.json'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`registry.json not found. Checked: ${candidates.join(', ')}`)
}

let _registry: Registry | null = null

function getRegistry(): Registry {
  if (_registry) return _registry
  const path = resolveRegistryPath()
  _registry = JSON.parse(readFileSync(path, 'utf-8')) as Registry
  return _registry
}

export function componentByName(name: string): RegistryEntry | undefined {
  const target = name.toLowerCase()
  return getRegistry().components.find(
    (c) => c.name.toLowerCase() === target || c.meta.name.toLowerCase() === target,
  )
}

export function knownComponentNames(): string[] {
  return getRegistry().components.map((c) => c.meta.name)
}

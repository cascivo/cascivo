import type { ComponentMeta } from '@cascade-ui/core'

export interface RegistryFile {
  url: string
  target?: string
}

export type RegistryItemType =
  | 'component'
  | 'layout'
  | 'block'
  | 'chart'
  | 'section'
  | 'theme'
  | 'style'

export interface RegistryAdvisory {
  id: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  affectedVersions: string
  fixedIn?: string
  summary: string
  refs?: string[]
}

export interface RegistryItem {
  schemaVersion: 2
  name: string
  type: RegistryItemType
  description: string
  category?: string
  version: string
  changelog?: { version: string; note: string }[]
  author?: string
  license?: string
  homepage?: string
  files: RegistryFile[]
  install?: string
  dependencies: string[]
  registryDependencies?: string[]
  tags: string[]
  meta?: ComponentMeta
  advisories?: RegistryAdvisory[]
}

export interface RegistryIndex {
  schemaVersion: 2
  name: string
  homepage?: string
  items: RegistryItem[]
}

export interface LegacyRegistryEntry {
  name: string
  type: string
  description: string
  category: string
  version: string
  files: string[]
  install?: string
  dependencies: string[]
  tags: string[]
  meta?: ComponentMeta
}

export interface LegacyRegistry {
  version: string
  generatedAt: string
  components: LegacyRegistryEntry[]
}

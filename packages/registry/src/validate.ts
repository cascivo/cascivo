import type { RegistryIndex, RegistryItem } from './types.ts'

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const VALID_TYPES = new Set(['component', 'layout', 'block', 'chart', 'section', 'theme', 'style'])
const VALID_SEVERITIES = new Set(['low', 'moderate', 'high', 'critical'])

function ok(warnings: string[] = []): ValidationResult {
  return { ok: true, errors: [], warnings }
}

function fail(errors: string[], warnings: string[] = []): ValidationResult {
  return { ok: false, errors, warnings }
}

export function validateItem(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return fail(['Item must be an object'])
  }
  const obj = raw as Record<string, unknown>
  const errors: string[] = []
  const warnings: string[] = []

  if (obj['schemaVersion'] !== 2) {
    errors.push(`schemaVersion must be 2, got ${JSON.stringify(obj['schemaVersion'])}`)
  }
  if (typeof obj['name'] !== 'string' || !obj['name']) {
    errors.push('name is required and must be a non-empty string')
  }
  if (!VALID_TYPES.has(obj['type'] as string)) {
    errors.push(
      `type must be one of ${[...VALID_TYPES].join('|')}, got ${JSON.stringify(obj['type'])}`,
    )
  }
  if (typeof obj['description'] !== 'string') {
    errors.push('description is required and must be a string')
  }
  if (typeof obj['version'] !== 'string' || !obj['version']) {
    errors.push('version is required and must be a non-empty string')
  }
  if (!Array.isArray(obj['files'])) {
    errors.push('files is required and must be an array')
  }
  if (!Array.isArray(obj['dependencies'])) {
    errors.push('dependencies is required and must be an array')
  }
  if (!Array.isArray(obj['tags'])) {
    errors.push('tags is required and must be an array')
  }

  if (obj['advisories'] !== undefined) {
    if (!Array.isArray(obj['advisories'])) {
      errors.push('advisories must be an array')
    } else {
      const ids = new Set<string>()
      for (const adv of obj['advisories'] as unknown[]) {
        if (!adv || typeof adv !== 'object') {
          errors.push('each advisory must be an object')
          continue
        }
        const a = adv as Record<string, unknown>
        if (typeof a['id'] !== 'string') errors.push('advisory.id must be a string')
        else if (ids.has(a['id'] as string)) errors.push(`advisory id "${a['id']}" is not unique`)
        else ids.add(a['id'] as string)
        if (!VALID_SEVERITIES.has(a['severity'] as string))
          errors.push(`advisory.severity must be one of ${[...VALID_SEVERITIES].join('|')}`)
        if (typeof a['affectedVersions'] !== 'string')
          errors.push('advisory.affectedVersions must be a string')
        if (typeof a['summary'] !== 'string') errors.push('advisory.summary must be a string')
      }
    }
  }

  const knownKeys = new Set([
    'schemaVersion',
    'name',
    'type',
    'description',
    'category',
    'version',
    'changelog',
    'author',
    'license',
    'homepage',
    'files',
    'install',
    'dependencies',
    'registryDependencies',
    'tags',
    'meta',
    'advisories',
  ])
  for (const key of Object.keys(obj)) {
    if (!knownKeys.has(key)) {
      warnings.push(`Unknown field "${key}" — ignored (forward compat)`)
    }
  }

  return errors.length > 0 ? fail(errors, warnings) : ok(warnings)
}

export function validateIndex(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return fail(['Index must be an object'])
  }
  const obj = raw as Record<string, unknown>
  const errors: string[] = []
  const warnings: string[] = []

  if (obj['schemaVersion'] !== 2) {
    errors.push(`schemaVersion must be 2, got ${JSON.stringify(obj['schemaVersion'])}`)
  }
  if (typeof obj['name'] !== 'string' || !obj['name']) {
    errors.push('name is required and must be a non-empty string')
  }
  if (!Array.isArray(obj['items'])) {
    errors.push('items is required and must be an array')
  } else {
    for (let i = 0; i < obj['items'].length; i++) {
      const itemResult = validateItem(obj['items'][i])
      for (const e of itemResult.errors) errors.push(`items[${i}]: ${e}`)
      for (const w of itemResult.warnings) warnings.push(`items[${i}]: ${w}`)
    }
  }

  const knownKeys = new Set(['schemaVersion', 'name', 'homepage', 'items'])
  for (const key of Object.keys(obj)) {
    if (!knownKeys.has(key)) {
      warnings.push(`Unknown field "${key}" — ignored (forward compat)`)
    }
  }

  return errors.length > 0 ? fail(errors, warnings) : ok(warnings)
}

export function parseLegacyRegistry(raw: unknown): RegistryIndex {
  if (!raw || typeof raw !== 'object') throw new Error('Legacy registry must be an object')
  const obj = raw as Record<string, unknown>
  const topVersion = typeof obj['version'] === 'string' ? obj['version'] : '0.0.0'
  const components = Array.isArray(obj['components']) ? obj['components'] : []

  return {
    schemaVersion: 2,
    name: 'cascade',
    items: (components as Record<string, unknown>[]).map((c) => {
      const item: RegistryItem = {
        schemaVersion: 2,
        name: typeof c['name'] === 'string' ? c['name'] : '',
        type: (c['type'] as RegistryItem['type']) ?? 'component',
        description: typeof c['description'] === 'string' ? c['description'] : '',
        version: topVersion,
        files: Array.isArray(c['files']) ? (c['files'] as string[]).map((url) => ({ url })) : [],
        dependencies: Array.isArray(c['dependencies']) ? (c['dependencies'] as string[]) : [],
        tags: Array.isArray(c['tags']) ? (c['tags'] as string[]) : [],
      }
      if (typeof c['category'] === 'string') item.category = c['category']
      if (typeof c['install'] === 'string') item.install = c['install']
      if (c['meta']) item.meta = c['meta'] as RegistryItem['meta']
      return item
    }),
  }
}

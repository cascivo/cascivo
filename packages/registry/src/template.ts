import type { RegistryItem, TemplateMeta, TemplateFileRole } from './types.ts'

const VALID_FRAMEWORKS = new Set(['react-vite', 'react-next'])
const VALID_FILE_ROLES = new Set<TemplateFileRole>(['page', 'fixture', 'asset', 'config'])

/** True when an item is a template. */
export function isTemplateItem(item: RegistryItem): boolean {
  return item.type === 'template'
}

/**
 * Narrow an item's `meta` to a {@link TemplateMeta}, throwing on shape mismatch.
 * Use after {@link validateTemplate} has passed.
 */
export function asTemplateMeta(meta: unknown): TemplateMeta {
  const errors = validateTemplateMeta(meta)
  if (errors.length > 0) {
    throw new Error(`Invalid TemplateMeta: ${errors.join('; ')}`)
  }
  return meta as TemplateMeta
}

function validateTemplateMeta(meta: unknown): string[] {
  const errors: string[] = []
  if (!meta || typeof meta !== 'object') {
    return ['meta must be a TemplateMeta object']
  }
  const m = meta as Record<string, unknown>

  if (typeof m['intent'] !== 'string' || !m['intent']) {
    errors.push('meta.intent is required and must be a non-empty string')
  }
  if (!VALID_FRAMEWORKS.has(m['framework'] as string)) {
    errors.push(`meta.framework must be one of ${[...VALID_FRAMEWORKS].join('|')}`)
  }
  if (typeof m['category'] !== 'string' || !m['category']) {
    errors.push('meta.category is required and must be a non-empty string')
  }

  if (!Array.isArray(m['screenshots']) || m['screenshots'].length === 0) {
    errors.push('meta.screenshots is required and must have at least one entry')
  } else {
    for (let i = 0; i < m['screenshots'].length; i++) {
      const shot = m['screenshots'][i] as Record<string, unknown>
      if (!shot || typeof shot !== 'object') {
        errors.push(`meta.screenshots[${i}] must be an object`)
        continue
      }
      if (typeof shot['light'] !== 'string' || !shot['light'])
        errors.push(`meta.screenshots[${i}].light is required`)
      if (typeof shot['alt'] !== 'string' || !shot['alt'])
        errors.push(`meta.screenshots[${i}].alt is required`)
    }
  }

  if (m['demoUrl'] !== undefined && typeof m['demoUrl'] !== 'string') {
    errors.push('meta.demoUrl must be a string when present')
  }

  if (!m['fileRoles'] || typeof m['fileRoles'] !== 'object') {
    errors.push('meta.fileRoles is required and must be an object')
  } else {
    for (const [target, role] of Object.entries(m['fileRoles'] as Record<string, unknown>)) {
      if (!VALID_FILE_ROLES.has(role as TemplateFileRole)) {
        errors.push(`meta.fileRoles["${target}"] must be one of ${[...VALID_FILE_ROLES].join('|')}`)
      }
    }
  }

  if (m['pages'] !== undefined) {
    if (!Array.isArray(m['pages'])) {
      errors.push('meta.pages must be an array when present')
    } else {
      for (let i = 0; i < m['pages'].length; i++) {
        const page = m['pages'][i] as Record<string, unknown>
        if (!page || typeof page !== 'object') {
          errors.push(`meta.pages[${i}] must be an object`)
          continue
        }
        if (typeof page['name'] !== 'string') errors.push(`meta.pages[${i}].name is required`)
        if (typeof page['target'] !== 'string') errors.push(`meta.pages[${i}].target is required`)
      }
    }
  }

  return errors
}

/**
 * Validate a template item beyond the base item schema. Returns a list of
 * errors (empty when valid). Requires:
 * - `type === 'template'`
 * - a valid {@link TemplateMeta}
 * - at least one component (`registryDependencies`) or one `page` file
 * - a non-empty `license`
 * - every `files[].target` present in `meta.fileRoles`
 */
export function validateTemplate(item: RegistryItem): string[] {
  const errors: string[] = []

  if (item.type !== 'template') {
    errors.push(`type must be 'template', got ${JSON.stringify(item.type)}`)
    return errors
  }

  const metaErrors = validateTemplateMeta(item.meta)
  errors.push(...metaErrors)

  const meta = (item.meta ?? {}) as Partial<TemplateMeta>
  const fileRoles = (meta.fileRoles ?? {}) as Record<string, TemplateFileRole>

  const hasComponents = Array.isArray(item.registryDependencies)
    ? item.registryDependencies.length > 0
    : false
  const hasPageFile = Object.values(fileRoles).includes('page')
  if (!hasComponents && !hasPageFile) {
    errors.push(
      'a template must list at least one component in registryDependencies or one page file',
    )
  }

  if (typeof item.license !== 'string' || !item.license) {
    errors.push('license is required for a template')
  }

  for (const file of item.files ?? []) {
    if (!file.target) {
      errors.push(`template file ${JSON.stringify(file.url)} must declare a target`)
    } else if (metaErrors.length === 0 && !(file.target in fileRoles)) {
      errors.push(`file target "${file.target}" is missing from meta.fileRoles`)
    }
  }

  return errors
}

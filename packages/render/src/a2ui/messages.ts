// Wire messages of the A2UI v0.9 protocol. Everything here arrives from an agent over the
// network, so each field is narrowed from `unknown`; nothing is asserted with `as`.

export const A2UI_VERSION = 'v0.9'
export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json'
// Runtime copy of the generated catalog's `catalogId` (scripts/schema/a2ui.ts is build-only);
// messages.test.ts keeps the two equal.
export const A2UI_CATALOG_ID = 'https://cascivo.com/a2ui/v0_9/catalog.json'

const ACCEPTED_VERSIONS: ReadonlySet<string> = new Set(['v0.9', 'v0.9.1'])

export interface A2uiComponent {
  readonly id: string
  readonly component: string
  /** Every key except `id` and `component`. */
  readonly props: Readonly<Record<string, unknown>>
}

export type A2uiServerMessage =
  | {
      kind: 'createSurface'
      surfaceId: string
      catalogId: string
      theme?: Readonly<Record<string, unknown>>
      sendDataModel: boolean
    }
  | { kind: 'updateComponents'; surfaceId: string; components: readonly unknown[] }
  | { kind: 'updateDataModel'; surfaceId: string; path: string; value: unknown }
  | { kind: 'deleteSurface'; surfaceId: string }

export interface A2uiErrorMessage {
  version: 'v0.9'
  error: { code: string; surfaceId: string; message: string; path?: string }
}

export interface A2uiActionMessage {
  version: 'v0.9'
  action: {
    name: string
    surfaceId: string
    sourceComponentId: string
    timestamp: string
    context: Record<string, unknown>
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function errorMessage(
  code: string,
  surfaceId: string,
  message: string,
  path?: string,
): A2uiErrorMessage {
  return {
    version: A2UI_VERSION,
    error: path === undefined ? { code, surfaceId, message } : { code, surfaceId, message, path },
  }
}

export function actionMessage(input: {
  name: string
  surfaceId: string
  sourceComponentId: string
  context?: Record<string, unknown>
  now?: Date
}): A2uiActionMessage {
  return {
    version: A2UI_VERSION,
    action: {
      name: input.name,
      surfaceId: input.surfaceId,
      sourceComponentId: input.sourceComponentId,
      timestamp: (input.now ?? new Date()).toISOString(),
      context: input.context ?? {},
    },
  }
}

type Parsed = { ok: true; message: A2uiServerMessage } | { ok: false; error: A2uiErrorMessage }

const MESSAGE_KEYS = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface']

/** Keys of `body` outside `allowed`, so a body with an extra key can be refused. */
function unknownKey(body: Record<string, unknown>, allowed: readonly string[]): string | undefined {
  return Object.keys(body).find((key) => !allowed.includes(key))
}

export function parseServerMessage(raw: unknown): Parsed {
  let surfaceId = ''
  const fail = (message: string): Parsed => ({
    ok: false,
    error: errorMessage('INVALID_MESSAGE', surfaceId, message),
  })

  if (!isRecord(raw)) return fail('A2UI message must be a JSON object.')

  const present = MESSAGE_KEYS.filter((key) => Object.hasOwn(raw, key))
  const only = present.length === 1 ? raw[present[0]!] : undefined
  if (isRecord(only) && typeof only['surfaceId'] === 'string') surfaceId = only['surfaceId']

  const version = raw['version']
  if (typeof version !== 'string' || !ACCEPTED_VERSIONS.has(version)) {
    return fail(`Unsupported or missing "version"; expected "${A2UI_VERSION}".`)
  }
  const extra = unknownKey(raw, ['version', ...MESSAGE_KEYS])
  if (extra !== undefined) return fail(`Unknown envelope key "${extra}".`)
  if (present.length !== 1) {
    return fail(`Expected exactly one of ${MESSAGE_KEYS.join(', ')}; got ${present.length}.`)
  }

  const kind = present[0]
  if (!isRecord(only)) return fail(`"${kind}" must be an object.`)
  if (typeof only['surfaceId'] !== 'string' || only['surfaceId'] === '') {
    return fail(`"${kind}.surfaceId" must be a non-empty string.`)
  }
  const id = only['surfaceId']

  switch (kind) {
    case 'createSurface': {
      const bad = unknownKey(only, ['surfaceId', 'catalogId', 'theme', 'sendDataModel'])
      if (bad !== undefined) return fail(`Unknown key "${bad}" in createSurface.`)
      const catalogId = only['catalogId']
      if (typeof catalogId !== 'string' || catalogId === '') {
        return fail('"createSurface.catalogId" must be a non-empty string.')
      }
      const theme = only['theme']
      if (theme !== undefined && !isRecord(theme)) {
        return fail('"createSurface.theme" must be an object.')
      }
      const send = only['sendDataModel']
      if (send !== undefined && typeof send !== 'boolean') {
        return fail('"createSurface.sendDataModel" must be a boolean.')
      }
      return {
        ok: true,
        message: {
          kind,
          surfaceId: id,
          catalogId,
          ...(theme === undefined ? {} : { theme }),
          sendDataModel: send === true,
        },
      }
    }
    case 'updateComponents': {
      const bad = unknownKey(only, ['surfaceId', 'components'])
      if (bad !== undefined) return fail(`Unknown key "${bad}" in updateComponents.`)
      const components = only['components']
      if (!Array.isArray(components) || components.length === 0) {
        return fail('"updateComponents.components" must be a non-empty array.')
      }
      return { ok: true, message: { kind, surfaceId: id, components } }
    }
    case 'updateDataModel': {
      const bad = unknownKey(only, ['surfaceId', 'path', 'value'])
      if (bad !== undefined) return fail(`Unknown key "${bad}" in updateDataModel.`)
      const path = only['path']
      if (path !== undefined && typeof path !== 'string') {
        return fail('"updateDataModel.path" must be a string.')
      }
      // An absent `value` deletes the path.
      return {
        ok: true,
        message: { kind, surfaceId: id, path: path ?? '/', value: only['value'] },
      }
    }
    default: {
      const bad = unknownKey(only, ['surfaceId'])
      if (bad !== undefined) return fail(`Unknown key "${bad}" in deleteSurface.`)
      return { ok: true, message: { kind: 'deleteSurface', surfaceId: id } }
    }
  }
}

export function parseComponent(
  raw: unknown,
  index: number,
  surfaceId: string,
  maxIdLength: number,
): { ok: true; component: A2uiComponent } | { ok: false; error: A2uiErrorMessage } {
  const fail = (field: 'id' | 'component', message: string) => ({
    ok: false as const,
    error: errorMessage('VALIDATION_FAILED', surfaceId, message, `/components/${index}/${field}`),
  })
  if (!isRecord(raw)) return fail('id', `Component ${index} must be an object.`)
  const { id, component, ...props } = raw
  if (typeof id !== 'string' || id === '' || id.length > maxIdLength) {
    return fail(
      'id',
      `Component ${index} needs a non-empty string "id" of at most ${maxIdLength} characters.`,
    )
  }
  if (typeof component !== 'string' || component === '') {
    return fail('component', `Component "${id}" needs a string "component" name.`)
  }
  return { ok: true, component: { id, component, props } }
}

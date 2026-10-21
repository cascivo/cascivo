// React-free A2UI surface store: owns surfaces, their components and data models, and turns
// every wire message into state or into error messages. `apply` never throws, because the
// input comes from an agent over the network.
import { batch, computed, signal } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import type { A2uiCatalogSpec } from './catalog-spec'
import { createDataModel } from './data-model'
import type { DataModel } from './data-model'
import { A2UI_VERSION, errorMessage, parseComponent, parseServerMessage } from './messages'
import type { A2uiComponent, A2uiErrorMessage } from './messages'
import { A2uiPathError } from './pointer'

export interface A2uiLimits {
  maxSurfaces: number
  maxComponents: number
  maxIdLength: number
  maxDataNodes: number
  maxRenderDepth: number
}

export const DEFAULT_A2UI_LIMITS: A2uiLimits = {
  maxSurfaces: 16,
  maxComponents: 1000,
  maxIdLength: 256,
  maxDataNodes: 10000,
  maxRenderDepth: 64,
}

export interface A2uiSurfaceState {
  readonly id: string
  readonly catalogId: string
  readonly sendDataModel: boolean
  readonly theme: Readonly<Record<string, unknown>> | undefined
  readonly data: DataModel
  /** One stable signal per id, so a renderer can subscribe before the component arrives. */
  component(id: string): ReadonlySignal<A2uiComponent | undefined>
  readonly hasRoot: ReadonlySignal<boolean>
}

export interface A2uiStore {
  /** Applies one server message. Never throws; returns the errors to report, in input order. */
  apply(raw: unknown): A2uiErrorMessage[]
  readonly surfaceIds: ReadonlySignal<readonly string[]>
  surface(id: string): A2uiSurfaceState | undefined
  capabilities(): { 'v0.9': { supportedCatalogIds: string[] } }
  clientDataModel(): { version: 'v0.9'; surfaces: Record<string, unknown> } | undefined
  readonly limits: A2uiLimits
}

interface Surface extends A2uiSurfaceState {
  readonly catalog: A2uiCatalogSpec
  /** Ids that hold a component, for the maxComponents limit. */
  readonly stored: Set<string>
  set(component: A2uiComponent): void
}

export function createA2uiStore(options: {
  catalogs: readonly A2uiCatalogSpec[]
  limits?: Partial<A2uiLimits>
}): A2uiStore {
  const limits: A2uiLimits = { ...DEFAULT_A2UI_LIMITS, ...options.limits }
  const surfaces = new Map<string, Surface>()
  const ids = signal<readonly string[]>([])

  function makeSurface(input: {
    id: string
    catalog: A2uiCatalogSpec
    sendDataModel: boolean
    theme: Readonly<Record<string, unknown>> | undefined
  }): Surface {
    const signals = new Map<string, ReturnType<typeof signal<A2uiComponent | undefined>>>()
    const slot = (id: string) => {
      const hit = signals.get(id)
      if (hit) return hit
      const made = signal<A2uiComponent | undefined>(undefined)
      signals.set(id, made)
      return made
    }
    const root = slot('root')
    return {
      id: input.id,
      catalogId: input.catalog.id,
      catalog: input.catalog,
      sendDataModel: input.sendDataModel,
      theme: input.theme,
      // Empty on purpose: every change goes through `write`, so the node limit always applies.
      data: createDataModel(undefined, { maxNodes: limits.maxDataNodes }),
      component: (id) => slot(id),
      hasRoot: computed(() => root.value !== undefined),
      stored: new Set(),
      set(component) {
        slot(component.id).value = component
      },
    }
  }

  function applyMessage(raw: unknown): A2uiErrorMessage[] {
    const parsed = parseServerMessage(raw)
    if (!parsed.ok) return [parsed.error]
    const message = parsed.message
    const sid = message.surfaceId

    if (message.kind === 'createSurface') {
      if (surfaces.has(sid)) {
        return [errorMessage('SURFACE_EXISTS', sid, `Surface "${sid}" already exists.`)]
      }
      const catalog = options.catalogs.find((c) => c.id === message.catalogId)
      if (catalog === undefined) {
        return [
          errorMessage(
            'UNSUPPORTED_CATALOG',
            sid,
            `Catalog "${message.catalogId}" is not supported.`,
          ),
        ]
      }
      if (surfaces.size >= limits.maxSurfaces) {
        return [
          errorMessage(
            'LIMIT_EXCEEDED',
            sid,
            `At most ${limits.maxSurfaces} surfaces are allowed.`,
          ),
        ]
      }
      surfaces.set(
        sid,
        makeSurface({
          id: sid,
          catalog,
          sendDataModel: message.sendDataModel,
          theme: message.theme,
        }),
      )
      ids.value = [...ids.peek(), sid]
      return []
    }

    const surface = surfaces.get(sid)
    if (surface === undefined) {
      return [errorMessage('SURFACE_NOT_FOUND', sid, `Surface "${sid}" does not exist.`)]
    }

    if (message.kind === 'deleteSurface') {
      surfaces.delete(sid)
      ids.value = ids.peek().filter((id) => id !== sid)
      return []
    }

    if (message.kind === 'updateDataModel') {
      try {
        surface.data.write(message.path, message.value)
      } catch (error) {
        if (error instanceof A2uiPathError) {
          return [errorMessage('INVALID_PATH', sid, error.message)]
        }
        throw error
      }
      return []
    }

    const errors: A2uiErrorMessage[] = []
    batch(() => {
      for (const [index, raw] of message.components.entries()) {
        const result = parseComponent(raw, index, sid, limits.maxIdLength)
        if (!result.ok) {
          errors.push(result.error)
          continue
        }
        const component = result.component
        const issues = surface.catalog.validate(component)
        if (issues.length > 0) {
          for (const issue of issues) {
            const path =
              issue.prop === '' ? `/components/${index}` : `/components/${index}/${issue.prop}`
            errors.push(errorMessage('VALIDATION_FAILED', sid, issue.message, path))
          }
          continue
        }
        if (!surface.stored.has(component.id) && surface.stored.size >= limits.maxComponents) {
          errors.push(
            errorMessage(
              'LIMIT_EXCEEDED',
              sid,
              `At most ${limits.maxComponents} components are allowed per surface.`,
            ),
          )
          break
        }
        surface.stored.add(component.id)
        surface.set(component)
      }
    })
    return errors
  }

  return {
    apply(raw) {
      try {
        return applyMessage(raw)
      } catch (error) {
        const text = error instanceof Error ? error.message : 'unknown error'
        return [errorMessage('INVALID_MESSAGE', '', `Could not apply message: ${text}`)]
      }
    },
    surfaceIds: ids,
    surface: (id) => surfaces.get(id),
    capabilities: () => ({
      [A2UI_VERSION]: { supportedCatalogIds: options.catalogs.map((c) => c.id) },
    }),
    clientDataModel() {
      const out: Record<string, unknown> = {}
      let any = false
      for (const [id, surface] of surfaces) {
        if (!surface.sendDataModel) continue
        out[id] = surface.data.snapshot()
        any = true
      }
      return any ? { version: A2UI_VERSION, surfaces: out } : undefined
    },
    limits,
  }
}

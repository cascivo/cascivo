// WebMCP bridge: lets a browser agent read and operate an A2UI surface through
// `view_snapshot` / `view_act`. Every call is gated by the host's `allow`, there is no
// default-open mode, and every argument is untrusted: bound as `unknown`, parsed once here.
import { A2UI_VERSION, actionMessage, isRecord } from './messages'
import type { A2uiActionMessage } from './messages'
import { A2uiDataError } from './data-model'
import { A2uiPathError } from './pointer'
import type { A2uiStore } from './store'

/** One step an agent asked for, as handed to `allow`. */
export type ViewStep =
  | { kind: 'setValue'; path: string; value: unknown }
  | { kind: 'action'; componentId: string; name: string; context: Record<string, unknown> }

export type ViewGate =
  | { tool: 'view_snapshot'; surfaceId: string }
  | { tool: 'view_act'; surfaceId: string; step: ViewStep; index: number }

export interface ViewToolsOptions {
  /** Required. Return `true` to let the agent do it; a sync or async host decision. */
  allow: (request: ViewGate) => boolean | Promise<boolean>
  /** Receives `action` steps, like `<A2uiSurface onAction>`. */
  onAction?: (
    message: A2uiActionMessage,
    metadata: { a2uiClientDataModel?: ReturnType<A2uiStore['clientDataModel']> },
  ) => void
}

export interface ViewChange {
  step: number
  kind: ViewStep['kind']
  target: string
}

interface ViewResult {
  ok: boolean
  error?: { step: number; message: string }
  changes: ViewChange[]
}

interface ToolHandle {
  unregister?: () => void
}
interface ModelContext {
  registerTool(tool: {
    name: string
    description: string
    inputSchema: unknown
    execute: (args: unknown) => Promise<{ content: { type: 'text'; text: string }[] }>
  }): ToolHandle | undefined
}

const MAX_STEPS = 64

function getModelContext(): ModelContext | undefined {
  if (typeof document === 'undefined') return undefined
  const ctx: unknown = Reflect.get(document, 'modelContext')
  return isRecord(ctx) && typeof ctx['registerTool'] === 'function'
    ? // Narrowed by the checks above; registerTool is called as a method below.
      (ctx as unknown as ModelContext)
    : undefined
}

const reply = (body: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(body) }],
})

/**
 * Registers `view_snapshot` and `view_act` on `document.modelContext` for the surfaces of
 * `store`. Returns an unregister function, or `undefined` when WebMCP is absent. Throws when
 * `allow` is not a function: an agent must never operate a view nobody approved.
 */
export function registerViewTools(
  store: A2uiStore,
  options: ViewToolsOptions,
): (() => void) | undefined {
  // Checked at runtime too: a JS caller can pass anything.
  if (typeof (options as { allow?: unknown } | undefined)?.allow !== 'function') {
    throw new TypeError(
      'registerViewTools requires an `allow` function; there is no default-open mode.',
    )
  }
  const { allow, onAction } = options
  const ctx = getModelContext()
  if (ctx === undefined) return undefined
  const { limits } = store

  const idOf = (value: unknown): string | undefined =>
    typeof value === 'string' && value.length > 0 && value.length <= limits.maxIdLength
      ? value
      : undefined

  function parseStep(raw: unknown): ViewStep | string {
    if (!isRecord(raw)) return 'step must be an object'
    if (raw['kind'] === 'setValue') {
      const path = raw['path']
      if (typeof path !== 'string' || !path.startsWith('/'))
        return 'path must be an absolute JSON pointer'
      if (path.length > limits.maxIdLength * 4) return 'path is too long'
      return { kind: 'setValue', path, value: raw['value'] }
    }
    if (raw['kind'] === 'action') {
      const componentId = idOf(raw['componentId'])
      const name = idOf(raw['name'])
      if (componentId === undefined || name === undefined)
        return 'action needs componentId and name'
      const context = raw['context']
      if (context !== undefined && !isRecord(context)) return 'context must be an object'
      return { kind: 'action', componentId, name, context: context ?? {} }
    }
    return 'unknown step kind'
  }

  /** Whether `component` declares an Action named `name` on one of its props. */
  function declares(props: Readonly<Record<string, unknown>>, name: string): boolean {
    return Object.values(props).some((p) => {
      if (!isRecord(p)) return false
      const event = p['event']
      return isRecord(event) && event['name'] === name
    })
  }

  async function act(args: unknown): Promise<ViewResult> {
    const changes: ViewChange[] = []
    const fail = (step: number, message: string): ViewResult => ({
      ok: false,
      error: { step, message },
      changes,
    })
    if (!isRecord(args)) return fail(-1, 'arguments must be an object')
    const surfaceId = idOf(args['surfaceId'])
    const surface = surfaceId === undefined ? undefined : store.surface(surfaceId)
    if (surfaceId === undefined || surface === undefined) return fail(-1, 'unknown surface')
    const raw = args['steps']
    if (!Array.isArray(raw)) return fail(-1, 'steps must be an array')
    if (raw.length > MAX_STEPS) return fail(-1, `at most ${MAX_STEPS} steps are allowed`)

    for (const [index, item] of raw.entries()) {
      const step = parseStep(item)
      if (typeof step === 'string') return fail(index, step)
      let allowed = false
      try {
        allowed = (await allow({ tool: 'view_act', surfaceId, step, index })) === true
      } catch {
        allowed = false
      }
      if (!allowed) return fail(index, 'denied by the host')
      try {
        if (step.kind === 'setValue') {
          surface.data.write(step.path, step.value)
          changes.push({ step: index, kind: 'setValue', target: step.path })
        } else {
          const component = surface.component(step.componentId).peek()
          if (component === undefined) return fail(index, `unknown component "${step.componentId}"`)
          if (!declares(component.props, step.name)) {
            return fail(index, `component "${step.componentId}" has no action "${step.name}"`)
          }
          const model = surface.sendDataModel ? store.clientDataModel(surfaceId) : undefined
          onAction?.(
            actionMessage({
              name: step.name,
              surfaceId,
              sourceComponentId: step.componentId,
              context: step.context,
            }),
            model === undefined ? {} : { a2uiClientDataModel: model },
          )
          changes.push({ step: index, kind: 'action', target: step.name })
        }
      } catch (error) {
        if (error instanceof A2uiPathError || error instanceof A2uiDataError) {
          return fail(index, error.message)
        }
        return fail(index, 'step failed')
      }
    }
    return { ok: true, changes }
  }

  async function snapshot(args: unknown) {
    const wanted = isRecord(args) ? args['surfaceId'] : undefined
    if (wanted !== undefined && idOf(wanted) === undefined)
      return { ok: false, error: 'bad surfaceId' }
    const ids = wanted === undefined ? store.surfaceIds.peek() : [wanted as string]
    const surfaces: Record<string, unknown> = {}
    for (const id of ids) {
      const surface = store.surface(id)
      if (surface === undefined) continue
      let allowed = false
      try {
        allowed = (await allow({ tool: 'view_snapshot', surfaceId: id })) === true
      } catch {
        allowed = false
      }
      if (allowed) surfaces[id] = surface.data.snapshot()
    }
    return { ok: true, version: A2UI_VERSION, surfaces }
  }

  const handles = [
    ctx.registerTool({
      name: 'view_snapshot',
      description: 'Read the data model of a rendered view (optionally one surface).',
      inputSchema: { type: 'object', properties: { surfaceId: { type: 'string' } } },
      execute: async (args) => reply(await snapshot(args)),
    }),
    ctx.registerTool({
      name: 'view_act',
      description:
        'Operate a rendered view. Steps run in order and stop at the first failure: ' +
        '{kind:"setValue",path:"/json/pointer",value} or {kind:"action",componentId,name,context?}.',
      inputSchema: {
        type: 'object',
        required: ['surfaceId', 'steps'],
        properties: {
          surfaceId: { type: 'string' },
          steps: { type: 'array', maxItems: MAX_STEPS, items: { type: 'object' } },
        },
      },
      execute: async (args) => reply(await act(args)),
    }),
  ]
  return () => {
    for (const handle of handles) handle?.unregister?.()
  }
}

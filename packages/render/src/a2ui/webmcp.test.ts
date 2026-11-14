import { describe, expect, it, vi } from 'vitest'
import { basicCatalogSpec } from './basic-spec'
import { cascivoCatalogSpec } from './catalog-spec'
import { A2UI_CATALOG_ID } from './messages'
import { createA2uiStore } from './store'
import { registerViewTools } from './webmcp'

interface Tool {
  name: string
  execute(args: unknown): Promise<{ content: { type: string; text: string }[] }>
}

function stubContext() {
  const tools = new Map<string, Tool>()
  const unregister = vi.fn()
  const modelContext = {
    registerTool: (tool: Tool) => {
      tools.set(tool.name, tool)
      return { unregister }
    },
  }
  Object.defineProperty(document, 'modelContext', { value: modelContext, configurable: true })
  return { tools, unregister }
}
const clear = () => Reflect.deleteProperty(document, 'modelContext')

function makeStore(limits?: Parameters<typeof createA2uiStore>[0]['limits']) {
  const store = createA2uiStore({
    catalogs: [cascivoCatalogSpec, basicCatalogSpec],
    ...(limits ? { limits } : {}),
  })
  store.apply({ version: 'v0.9', createSurface: { surfaceId: 's', catalogId: A2UI_CATALOG_ID } })
  store.apply({ version: 'v0.9', updateDataModel: { surfaceId: 's', path: '/', value: { a: 1 } } })
  store.apply({
    version: 'v0.9',
    updateComponents: {
      surfaceId: 's',
      components: [
        {
          id: 'root',
          component: 'Button',
          children: 'Go',
          onClick: { event: { name: 'go' } },
        },
      ],
    },
  })
  return store
}

const run = async (tools: Map<string, Tool>, name: string, args: unknown) => {
  const out = await tools.get(name)!.execute(args)
  return JSON.parse(out.content[0]!.text) as Record<string, unknown>
}

describe('registerViewTools', () => {
  it('throws without allow', () => {
    stubContext()
    // @ts-expect-error allow is required
    expect(() => registerViewTools(makeStore(), {})).toThrow(/allow/)
    // @ts-expect-error allow must be a function
    expect(() => registerViewTools(makeStore(), { allow: true })).toThrow(/allow/)
    clear()
  })

  it('does nothing without WebMCP', () => {
    clear()
    expect(registerViewTools(makeStore(), { allow: () => true })).toBeUndefined()
  })

  it('registers both tools and unregisters them', () => {
    const { tools, unregister } = stubContext()
    const off = registerViewTools(makeStore(), { allow: () => true })
    expect([...tools.keys()].sort()).toEqual(['view_act', 'view_snapshot'])
    off?.()
    expect(unregister).toHaveBeenCalledTimes(2)
    clear()
  })

  it('snapshots the data model', async () => {
    const { tools } = stubContext()
    registerViewTools(makeStore(), { allow: () => true })
    expect(await run(tools, 'view_snapshot', { surfaceId: 's' })).toEqual({
      ok: true,
      version: 'v0.9',
      surfaces: { s: { a: 1 } },
    })
    clear()
  })

  it('setValue writes through the data model, in order', async () => {
    const { tools } = stubContext()
    const store = makeStore()
    registerViewTools(store, { allow: () => true })
    const r = await run(tools, 'view_act', {
      surfaceId: 's',
      steps: [
        { kind: 'setValue', path: '/b', value: 2 },
        { kind: 'setValue', path: '/a', value: 3 },
      ],
    })
    expect(r['ok']).toBe(true)
    expect(r['changes']).toHaveLength(2)
    expect(store.surface('s')!.data.snapshot()).toEqual({ a: 3, b: 2 })
    clear()
  })

  it('allow false leaves the model unchanged and reports the step', async () => {
    const { tools } = stubContext()
    const store = makeStore()
    registerViewTools(store, { allow: () => false })
    const r = await run(tools, 'view_act', {
      surfaceId: 's',
      steps: [{ kind: 'setValue', path: '/a', value: 9 }],
    })
    expect(r).toMatchObject({ ok: false, error: { step: 0 }, changes: [] })
    expect(store.surface('s')!.data.snapshot()).toEqual({ a: 1 })
    clear()
  })

  it('a bad pointer stops at that step', async () => {
    const { tools } = stubContext()
    const store = makeStore()
    registerViewTools(store, { allow: () => true })
    const r = await run(tools, 'view_act', {
      surfaceId: 's',
      steps: [
        { kind: 'setValue', path: '/ok', value: 1 },
        { kind: 'setValue', path: '/__proto__/x', value: 1 },
        { kind: 'setValue', path: '/never', value: 1 },
      ],
    })
    expect(r).toMatchObject({ ok: false, error: { step: 1 } })
    expect(r['changes']).toHaveLength(1)
    expect(store.surface('s')!.data.snapshot()).toEqual({ a: 1, ok: 1 })
    clear()
  })

  it('a relative pointer is refused', async () => {
    const { tools } = stubContext()
    registerViewTools(makeStore(), { allow: () => true })
    const r = await run(tools, 'view_act', {
      surfaceId: 's',
      steps: [{ kind: 'setValue', path: 'a', value: 1 }],
    })
    expect(r).toMatchObject({ ok: false, error: { step: 0 } })
    clear()
  })

  it('action dispatches the declared action to onAction', async () => {
    const { tools } = stubContext()
    const onAction = vi.fn()
    registerViewTools(makeStore(), { allow: () => true, onAction })
    const r = await run(tools, 'view_act', {
      surfaceId: 's',
      steps: [{ kind: 'action', componentId: 'root', name: 'go' }],
    })
    expect(r['ok']).toBe(true)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction.mock.calls[0]![0]).toMatchObject({
      action: { name: 'go', surfaceId: 's', sourceComponentId: 'root' },
    })
    clear()
  })

  it('an unknown action or component gives ok:false with the step', async () => {
    const { tools } = stubContext()
    const onAction = vi.fn()
    registerViewTools(makeStore(), { allow: () => true, onAction })
    for (const step of [
      { kind: 'action', componentId: 'root', name: 'nope' },
      { kind: 'action', componentId: 'ghost', name: 'go' },
      { kind: 'bogus' },
    ]) {
      const r = await run(tools, 'view_act', { surfaceId: 's', steps: [step] })
      expect(r).toMatchObject({ ok: false, error: { step: 0 } })
    }
    expect(onAction).not.toHaveBeenCalled()
    clear()
  })

  it('rejects payloads over the limits and malformed input', async () => {
    const { tools } = stubContext()
    const store = makeStore({ maxDataNodes: 5 })
    registerViewTools(store, { allow: () => true })
    const tooMany = Array.from({ length: 1000 }, () => ({ kind: 'setValue', path: '/a', value: 1 }))
    expect(await run(tools, 'view_act', { surfaceId: 's', steps: tooMany })).toMatchObject({
      ok: false,
    })
    const big = {
      surfaceId: 's',
      steps: [{ kind: 'setValue', path: '/big', value: [1, 2, 3, 4, 5, 6, 7, 8] }],
    }
    expect(await run(tools, 'view_act', big)).toMatchObject({ ok: false, error: { step: 0 } })
    for (const bad of [
      null,
      'x',
      { steps: 'x' },
      { surfaceId: 's' },
      { surfaceId: 'nope', steps: [] },
    ]) {
      expect(await run(tools, 'view_act', bad)).toMatchObject({ ok: false })
    }
    clear()
  })
})

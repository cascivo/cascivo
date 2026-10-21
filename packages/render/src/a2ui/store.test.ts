import { describe, expect, it } from 'vitest'
import { A2UI_CATALOG_ID, BASIC_CATALOG_ID } from './messages'
import type { A2uiCatalogSpec } from './catalog-spec'
import { cascivoCatalogSpec } from './catalog-spec'
import { createA2uiStore, DEFAULT_A2UI_LIMITS } from './store'

const fake: A2uiCatalogSpec = {
  id: 'fake',
  has: () => true,
  validate: (c) =>
    c.props['variant'] === 'bad' ? [{ prop: 'variant', message: 'bad variant' }] : [],
}
const wholeBad: A2uiCatalogSpec = {
  id: 'whole',
  has: () => true,
  validate: () => [{ prop: '', message: 'nope' }],
}

const create = (surfaceId: string, extra: Record<string, unknown> = {}, catalogId = 'fake') => ({
  version: 'v0.9',
  createSurface: { surfaceId, catalogId, ...extra },
})
const comps = (surfaceId: string, components: unknown[]) => ({
  version: 'v0.9',
  updateComponents: { surfaceId, components },
})
const data = (surfaceId: string, path: string, value?: unknown) => ({
  version: 'v0.9',
  updateDataModel: { surfaceId, path, ...(value === undefined ? {} : { value }) },
})

const make = (limits = {}) => createA2uiStore({ catalogs: [fake, wholeBad], limits })

describe('createA2uiStore', () => {
  it('has the documented default limits', () => {
    expect(DEFAULT_A2UI_LIMITS).toEqual({
      maxSurfaces: 16,
      maxComponents: 1000,
      maxIdLength: 256,
      maxDataNodes: 10000,
      maxRenderDepth: 64,
    })
  })

  it('runs the create, components, data, delete lifecycle', () => {
    const store = make()
    expect(store.apply(create('s1', { theme: { primaryColor: '#f00' } }))).toEqual([])
    expect(store.surfaceIds.value).toEqual(['s1'])
    const s = store.surface('s1')
    expect(s?.catalogId).toBe('fake')
    expect(s?.theme).toEqual({ primaryColor: '#f00' })
    expect(store.apply(comps('s1', [{ id: 'root', component: 'Text', text: 'hi' }]))).toEqual([])
    expect(s?.component('root').value?.props).toEqual({ text: 'hi' })
    expect(store.apply(data('s1', '/a/b', 5))).toEqual([])
    expect(s?.data.read('/a/b').value).toBe(5)
    expect(store.apply(data('s1', '/a/b'))).toEqual([])
    expect(s?.data.read('/a/b').value).toBeUndefined()
    expect(store.apply({ version: 'v0.9', deleteSurface: { surfaceId: 's1' } })).toEqual([])
    expect(store.surfaceIds.value).toEqual([])
    expect(store.surface('s1')).toBeUndefined()
  })

  it('re-creating a deleted surface starts fresh', () => {
    const store = make()
    store.apply(create('s1'))
    store.apply(comps('s1', [{ id: 'root', component: 'Text' }]))
    store.apply(data('s1', '/x', 1))
    store.apply({ version: 'v0.9', deleteSurface: { surfaceId: 's1' } })
    store.apply(create('s1'))
    const s = store.surface('s1')
    expect(s?.hasRoot.value).toBe(false)
    expect(s?.data.read('/x').value).toBeUndefined()
  })

  it('reports SURFACE_NOT_FOUND and tracks hasRoot', () => {
    const store = make()
    const errs = store.apply(comps('nope', [{ id: 'root', component: 'Text' }]))
    expect(errs.map((e) => e.error.code)).toEqual(['SURFACE_NOT_FOUND'])
    expect(store.apply(data('nope', '/a', 1)).map((e) => e.error.code)).toEqual([
      'SURFACE_NOT_FOUND',
    ])
    expect(
      store
        .apply({ version: 'v0.9', deleteSurface: { surfaceId: 'nope' } })
        .map((e) => e.error.code),
    ).toEqual(['SURFACE_NOT_FOUND'])
    store.apply(create('s'))
    const s = store.surface('s')
    expect(s?.hasRoot.value).toBe(false)
    store.apply(comps('s', [{ id: 'a', component: 'Text' }]))
    expect(s?.hasRoot.value).toBe(false)
    store.apply(comps('s', [{ id: 'root', component: 'Text' }]))
    expect(s?.hasRoot.value).toBe(true)
  })

  it('refuses a second createSurface and keeps the original catalog', () => {
    const store = make()
    store.apply(create('s'))
    const errs = store.apply(create('s', {}, 'whole'))
    expect(errs.map((e) => e.error.code)).toEqual(['SURFACE_EXISTS'])
    expect(store.surface('s')?.catalogId).toBe('fake')
  })

  it('refuses an unknown catalog', () => {
    const errs = make().apply(create('s', {}, 'unknown'))
    expect(errs.map((e) => e.error.code)).toEqual(['UNSUPPORTED_CATALOG'])
  })

  it('refuses the 17th surface', () => {
    const store = make()
    for (let i = 0; i < 16; i++) expect(store.apply(create(`s${i}`))).toEqual([])
    expect(store.apply(create('s16')).map((e) => e.error.code)).toEqual(['LIMIT_EXCEEDED'])
    expect(store.surfaceIds.value).toHaveLength(16)
  })

  it('stores valid components and reports invalid ones by path', () => {
    const store = make()
    store.apply(create('s'))
    const errs = store.apply(
      comps('s', [
        { id: 'a', component: 'Text' },
        { id: 'b', component: 'Text', variant: 'bad' },
        { id: 'c', component: 'Text' },
      ]),
    )
    expect(errs).toHaveLength(1)
    expect(errs[0]?.error).toMatchObject({
      code: 'VALIDATION_FAILED',
      surfaceId: 's',
      path: '/components/1/variant',
    })
    const s = store.surface('s')
    expect(s?.component('a').value).toBeDefined()
    expect(s?.component('b').value).toBeUndefined()
    expect(s?.component('c').value).toBeDefined()
  })

  it('uses the component path for a component-level issue and for parse failures', () => {
    const store = createA2uiStore({ catalogs: [wholeBad] })
    store.apply(create('s', {}, 'whole'))
    const errs = store.apply(comps('s', [{ id: 'a', component: 'X' }, 7]))
    expect(errs.map((e) => e.error.path)).toEqual(['/components/0', '/components/1/id'])
  })

  it('returns a stable signal per id that updates on arrival and replacement', () => {
    const store = make()
    store.apply(create('s'))
    const s = store.surface('s')
    const before = s?.component('x')
    expect(before?.value).toBeUndefined()
    store.apply(comps('s', [{ id: 'x', component: 'Text', text: 1 }]))
    expect(s?.component('x')).toBe(before)
    expect(before?.value?.props).toEqual({ text: 1 })
    store.apply(comps('s', [{ id: 'x', component: 'Text', text: 2 }]))
    expect(before?.value?.props).toEqual({ text: 2 })
  })

  it('stops at maxComponents, counting distinct ids only', () => {
    const store = make({ maxComponents: 2 })
    store.apply(create('s'))
    expect(
      store.apply(
        comps('s', [
          { id: 'a', component: 'T' },
          { id: 'b', component: 'T' },
        ]),
      ),
    ).toEqual([])
    expect(store.apply(comps('s', [{ id: 'a', component: 'T', n: 1 }]))).toEqual([])
    const errs = store.apply(
      comps('s', [
        { id: 'a', component: 'T', n: 2 },
        { id: 'c', component: 'T' },
        { id: 'd', component: 'T' },
      ]),
    )
    expect(errs.map((e) => e.error.code)).toEqual(['LIMIT_EXCEEDED'])
    const s = store.surface('s')
    expect(s?.component('a').value?.props).toEqual({ n: 2 })
    expect(s?.component('c').value).toBeUndefined()
  })

  it('lists capabilities in options order', () => {
    const store = createA2uiStore({ catalogs: [cascivoCatalogSpec, fake] })
    expect(store.capabilities()).toEqual({
      'v0.9': { supportedCatalogIds: [A2UI_CATALOG_ID, 'fake'] },
    })
    expect(BASIC_CATALOG_ID).toBeTruthy()
  })

  it('includes only sendDataModel surfaces in clientDataModel', () => {
    const store = make()
    store.apply(create('a'))
    expect(store.clientDataModel()).toBeUndefined()
    store.apply(create('b', { sendDataModel: true }))
    store.apply(data('b', '/k', 'v'))
    store.apply(data('a', '/k', 'w'))
    expect(store.clientDataModel()).toEqual({ version: 'v0.9', surfaces: { b: { k: 'v' } } })
  })

  it('replaces the whole model at the root path and deletes on null', () => {
    const store = make()
    store.apply(create('s'))
    const s = store.surface('s')
    store.apply(data('s', '', { a: 1 }))
    expect(s?.data.snapshot()).toEqual({ a: 1 })
    store.apply(data('s', '/', { b: 2 }))
    expect(s?.data.snapshot()).toEqual({ b: 2 })
    store.apply(data('s', '/b', null))
    expect(s?.data.read('/b').value).toBeUndefined()
  })

  it('maps path failures to INVALID_PATH', () => {
    const store = make()
    store.apply(create('s'))
    for (const path of ['/__proto__/x', 'relative']) {
      const errs = store.apply(data('s', path, 1))
      expect(errs.map((e) => e.error.code)).toEqual(['INVALID_PATH'])
    }
  })

  it('enforces the data node limit', () => {
    const store = make({ maxDataNodes: 3 })
    store.apply(create('s'))
    const errs = store.apply(data('s', '/a', [1, 2, 3, 4, 5]))
    expect(errs.map((e) => e.error.code)).toEqual(['INVALID_PATH'])
  })

  it('never throws on malformed input', () => {
    const store = make()
    for (const raw of [42, null, 'x', [], {}, { version: 'v0.9' }]) {
      const errs = store.apply(raw)
      expect(errs.map((e) => e.error.code)).toEqual(['INVALID_MESSAGE'])
    }
  })

  it('turns an unexpected exception into INVALID_MESSAGE', () => {
    const boom: A2uiCatalogSpec = {
      id: 'boom',
      has: () => true,
      validate: () => {
        throw new Error('kaboom')
      },
    }
    const store = createA2uiStore({ catalogs: [boom] })
    store.apply(create('s', {}, 'boom'))
    const errs = store.apply(comps('s', [{ id: 'a', component: 'T' }]))
    expect(errs.map((e) => e.error.code)).toEqual(['INVALID_MESSAGE'])
  })

  it('survives hostile thrown values', () => {
    const hostile = new Error('x')
    Object.defineProperty(hostile, 'message', {
      get() {
        throw new Error('nested')
      },
    })
    const raw = {
      get version(): string {
        throw hostile
      },
    }
    const store = make()
    expect(store.apply(raw).map((e) => e.error.code)).toEqual(['INVALID_MESSAGE'])

    const { proxy, revoke } = Proxy.revocable({}, {})
    revoke()
    const spec: A2uiCatalogSpec = {
      id: 'rev',
      has: () => true,
      validate: () => {
        throw proxy
      },
    }
    const s2 = createA2uiStore({ catalogs: [spec] })
    s2.apply(create('s', {}, 'rev'))
    expect(s2.apply(comps('s', [{ id: 'a', component: 'T' }])).map((e) => e.error.code)).toEqual([
      'INVALID_MESSAGE',
    ])
  })

  it('does not allocate signals for over-long ids', () => {
    const store = make({ maxIdLength: 4 })
    store.apply(create('s'))
    const s = store.surface('s')
    const a = s?.component('toolong')
    expect(a?.value).toBeUndefined()
    expect(s?.component('another-long')).toBe(a)
    expect(s?.component('ok')).toBe(s?.component('ok'))
  })

  it('caps signals for unknown ids but still stores real components', () => {
    const store = make({ maxComponents: 2 })
    store.apply(create('s'))
    const s = store.surface('s')
    // 'root' already holds one entry; fill the rest of the 2 * maxComponents allowance.
    const known = ['a', 'b', 'c'].map((id) => s?.component(id))
    const over = s?.component('d')
    expect(over).not.toBe(known[0])
    expect(s?.component('e')).toBe(over)
    expect(store.apply(comps('s', [{ id: 'd', component: 'T' }])).length).toBe(0)
    expect(s?.component('d').value?.id).toBe('d')
  })
})

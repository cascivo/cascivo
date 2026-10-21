import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  A2UI_CATALOG_ID,
  actionMessage,
  errorMessage,
  parseComponent,
  parseServerMessage,
} from './messages'

describe('A2UI_CATALOG_ID', () => {
  it('equals the generated catalog id', () => {
    const catalog: unknown = JSON.parse(
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), '../../schema/a2ui/v0_9/catalog.json'),
        'utf8',
      ),
    )
    expect(catalog).toMatchObject({ catalogId: A2UI_CATALOG_ID })
  })
})

describe('parseServerMessage', () => {
  for (const version of ['v0.9', 'v0.9.1']) {
    it(`accepts all four messages for ${version}`, () => {
      const create = parseServerMessage({
        version,
        createSurface: { surfaceId: 's', catalogId: 'c', theme: { a: 1 } },
      })
      expect(create).toEqual({
        ok: true,
        message: {
          kind: 'createSurface',
          surfaceId: 's',
          catalogId: 'c',
          theme: { a: 1 },
          sendDataModel: false,
        },
      })
      const update = parseServerMessage({
        version,
        updateComponents: { surfaceId: 's', components: [{ id: 'a' }] },
      })
      expect(update).toEqual({
        ok: true,
        message: { kind: 'updateComponents', surfaceId: 's', components: [{ id: 'a' }] },
      })
      const data = parseServerMessage({ version, updateDataModel: { surfaceId: 's', value: 1 } })
      expect(data).toEqual({
        ok: true,
        message: { kind: 'updateDataModel', surfaceId: 's', path: '/', value: 1 },
      })
      expect(parseServerMessage({ version, deleteSurface: { surfaceId: 's' } })).toEqual({
        ok: true,
        message: { kind: 'deleteSurface', surfaceId: 's' },
      })
    })
  }

  it('treats an absent value as delete and keeps an explicit path', () => {
    const r = parseServerMessage({
      version: 'v0.9',
      updateDataModel: { surfaceId: 's', path: '/a' },
    })
    expect(r).toEqual({
      ok: true,
      message: { kind: 'updateDataModel', surfaceId: 's', path: '/a', value: undefined },
    })
  })

  const bad = (raw: unknown, surfaceId: string) => {
    const r = parseServerMessage(raw)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.error.code).toBe('INVALID_MESSAGE')
      expect(r.error.error.surfaceId).toBe(surfaceId)
    }
  }

  it('rejects malformed envelopes with the right surfaceId', () => {
    bad({ deleteSurface: { surfaceId: 's' } }, 's')
    bad({ version: 'v0.8', deleteSurface: { surfaceId: 's' } }, 's')
    bad(
      {
        version: 'v0.9',
        deleteSurface: { surfaceId: 's' },
        updateDataModel: { surfaceId: 's' },
      },
      '',
    )
    bad({ version: 'v0.9', updateComponents: { surfaceId: 's', components: [] } }, 's')
    bad({ version: 'v0.9', updateComponents: { surfaceId: 's', components: 'x' } }, 's')
    bad({ version: 'v0.9', deleteSurface: { surfaceId: 's', extra: 1 } }, 's')
    bad({ version: 'v0.9', createSurface: { surfaceId: 's' } }, 's')
    bad({ version: 'v0.9', createSurface: { surfaceId: 's', catalogId: 'c', theme: [] } }, 's')
    bad({ version: 'v0.9', updateDataModel: { surfaceId: 's', path: 3 } }, 's')
    bad({ version: 'v0.9' }, '')
    bad('nope', '')
    bad(null, '')
    bad([], '')
  })
})

describe('parseComponent', () => {
  it('splits id/component from props', () => {
    expect(parseComponent({ id: 'a', component: 'Text', text: 'x' }, 0, 's', 10)).toEqual({
      ok: true,
      component: { id: 'a', component: 'Text', props: { text: 'x' } },
    })
  })

  it('reports id and component failures with their paths', () => {
    const noId = parseComponent({ component: 'Text' }, 2, 's', 10)
    const longId = parseComponent({ id: 'abcdefghijk', component: 'Text' }, 1, 's', 10)
    const noComponent = parseComponent({ id: 'a' }, 3, 's', 10)
    const notObject = parseComponent(5, 0, 's', 10)
    for (const r of [noId, longId, noComponent, notObject]) expect(r.ok).toBe(false)
    const paths = [noId, longId, noComponent, notObject].map((r) =>
      r.ok ? '' : `${r.error.error.code} ${r.error.error.path}`,
    )
    expect(paths).toEqual([
      'VALIDATION_FAILED /components/2/id',
      'VALIDATION_FAILED /components/1/id',
      'VALIDATION_FAILED /components/3/component',
      'VALIDATION_FAILED /components/0/id',
    ])
  })
})

describe('outgoing messages', () => {
  it('builds error messages', () => {
    expect(errorMessage('X', 's', 'm')).toEqual({
      version: 'v0.9',
      error: { code: 'X', surfaceId: 's', message: 'm' },
    })
    expect(errorMessage('VALIDATION_FAILED', 's', 'm', '/p').error.path).toBe('/p')
  })

  it('builds action messages with a deterministic timestamp', () => {
    expect(
      actionMessage({ name: 'n', surfaceId: 's', sourceComponentId: 'c', now: new Date(0) }),
    ).toEqual({
      version: 'v0.9',
      action: {
        name: 'n',
        surfaceId: 's',
        sourceComponentId: 'c',
        timestamp: '1970-01-01T00:00:00.000Z',
        context: {},
      },
    })
  })
})

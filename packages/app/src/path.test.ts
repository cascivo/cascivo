import { describe, expect, expectTypeOf, it } from 'vitest'
import { buildPath, compareSpecificity, compilePath, matchPath, normalizePath } from './path'
import type { PathParams } from './path'

describe('path patterns', () => {
  it('types params from the pattern', () => {
    expectTypeOf<PathParams<'/c/:id'>>().toEqualTypeOf<{ id: string }>()
    expectTypeOf<PathParams<'/org/:org/repo/:repo'>>().toEqualTypeOf<{
      org: string
      repo: string
    }>()
    expectTypeOf<PathParams<'/files/*'>>().toEqualTypeOf<{ '*': string }>()
    expectTypeOf<PathParams<'/'>>().toEqualTypeOf<{}>()
  })

  it('normalizes slashes', () => {
    expect(normalizePath('')).toBe('/')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('a/b/')).toBe('/a/b')
    expect(normalizePath('/a//')).toBe('/a')
  })

  it('matches static, param and splat segments', () => {
    expect(matchPath(compilePath('/'), '/')).toEqual({})
    expect(matchPath(compilePath('/'), '/x')).toBeNull()
    expect(matchPath(compilePath('/settings'), '/settings/')).toEqual({})
    expect(matchPath(compilePath('/c/:id'), '/c/42')).toEqual({ id: '42' })
    expect(matchPath(compilePath('/c/:id'), '/c/42/x')).toBeNull()
    expect(matchPath(compilePath('/files/*'), '/files/a/b%20c')).toEqual({ '*': 'a/b c' })
    expect(matchPath(compilePath('/files/*'), '/files')).toEqual({ '*': '' })
  })

  it('decodes params and treats a malformed escape as no match', () => {
    expect(matchPath(compilePath('/c/:id'), '/c/a%20b')).toEqual({ id: 'a b' })
    expect(matchPath(compilePath('/c/:id'), '/c/%E0')).toBeNull()
  })

  it('escapes regex characters in static segments', () => {
    expect(matchPath(compilePath('/a.b'), '/a.b')).toEqual({})
    expect(matchPath(compilePath('/a.b'), '/axb')).toBeNull()
  })

  it('rejects a splat that is not last, and invalid param names', () => {
    expect(() => compilePath('/*/x')).toThrow('must be the last segment')
    expect(() => compilePath('/c/:1d')).toThrow('Invalid param name')
  })

  it('orders patterns most specific first', () => {
    const patterns = ['/c/*', '/c/:id', '/c/new', '/', '/c/:id/edit']
    const sorted = patterns
      .map(compilePath)
      .sort(compareSpecificity)
      .map((c) => c.pattern)
    expect(sorted).toEqual(['/c/new', '/c/:id/edit', '/c/:id', '/c/*', '/'])
  })

  it('builds encoded paths and refuses a missing param', () => {
    expect(buildPath('/c/:id', { id: 'a b/c' })).toBe('/c/a%20b%2Fc')
    expect(buildPath('/files/*', { '*': 'x y/z' })).toBe('/files/x%20y/z')
    expect(buildPath('/', {})).toBe('/')
    expect(() => buildPath('/c/:id', {} as { id: string })).toThrow('Missing param "id"')
  })
})

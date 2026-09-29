// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cascivoRoutes, fileToRoutePath, generateRoutes, scanRoutes } from './vite'

describe('fileToRoutePath', () => {
  it.each([
    ['index.tsx', '/'],
    ['settings.tsx', '/settings'],
    ['settings/index.tsx', '/settings'],
    ['c/[id].tsx', '/c/:id'],
    ['c/[id]/edit.tsx', '/c/:id/edit'],
    ['files/[...path].tsx', '/files/*'],
    ['404.tsx', null],
  ])('%s → %s', (file, path) => {
    expect(fileToRoutePath(file)).toBe(path)
  })

  it.each(['_layout.tsx', '_parts/row.tsx', 'c/[id].test.tsx', 'util.ts', 'styles.css'])(
    'ignores %s',
    (file) => {
      expect(fileToRoutePath(file)).toBeUndefined()
    },
  )

  it('rejects malformed segments and a splat that is not last', () => {
    expect(() => fileToRoutePath('[...rest]/x.tsx')).toThrow('must be last')
    expect(() => fileToRoutePath('c/[id.tsx')).toThrow('malformed segment')
  })
})

describe('generateRoutes', () => {
  it('emits lazy routes, most specific first, with a typed path union', () => {
    const source = generateRoutes(
      ['index.tsx', 'c/[id].tsx', 'c/new.tsx', '404.tsx', '_util.tsx'],
      './routes',
    )
    expect(source).toContain("lazyRoute('/c/new', () => import('./routes/c/new')),")
    expect(source.indexOf("'/c/new'")).toBeLessThan(source.indexOf("'/c/:id'"))
    expect(source.indexOf("'/c/:id'")).toBeLessThan(source.indexOf("lazyRoute('/',"))
    expect(source).toContain(
      "export const notFound: Route | undefined = lazyRoute('*', () => import('./routes/404'))",
    )
    expect(source).toContain("export type AppPath = '/c/new' | '/c/:id' | '/'")
    expect(source).not.toContain('_util')
  })

  it('is deterministic regardless of input order', () => {
    const a = generateRoutes(['b.tsx', 'a.tsx', 'index.tsx'], './routes')
    const b = generateRoutes(['index.tsx', 'a.tsx', 'b.tsx'], './routes')
    expect(a).toBe(b)
  })

  it('names both files when two define the same path', () => {
    expect(() => generateRoutes(['settings.tsx', 'settings/index.tsx'], './routes')).toThrow(
      'routes/settings.tsx and routes/settings/index.tsx both define /settings',
    )
  })

  it('handles an empty routes directory', () => {
    const source = generateRoutes([], './routes')
    expect(source).toContain('export const routes: Route[] = [\n]')
    expect(source).toContain('export type AppPath = never')
  })
})

describe('cascivoRoutes plugin', () => {
  let root: string | undefined
  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true })
  })

  function touch(file: string) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, 'export default () => null\n')
  }

  it('writes routes.gen.ts on build start and rewrites it when a route is added', () => {
    root = mkdtempSync(join(tmpdir(), 'cascivo-routes-'))
    touch(join(root, 'src/routes/index.tsx'))
    const plugin = cascivoRoutes()
    plugin.configResolved({ root })
    plugin.buildStart()
    const out = join(root, 'src/routes.gen.ts')
    expect(readFileSync(out, 'utf8')).toContain("import('./routes/index')")

    const listeners: Record<string, (file: string) => void> = {}
    plugin.configureServer({
      watcher: { add: () => undefined, on: (event, listener) => (listeners[event] = listener) },
    })
    touch(join(root, 'src/routes/about.tsx'))
    listeners['add']?.(join(root, 'src/routes/about.tsx'))
    expect(readFileSync(out, 'utf8')).toContain("lazyRoute('/about'")
    expect(scanRoutes(join(root, 'src/routes'))).toEqual(['about.tsx', 'index.tsx'])
  })
})

/**
 * The plugin's generated modules are the contract between the bin and the UI. The pure
 * generators are asserted on their output; one test runs them through a real Vite server,
 * because the examples module only works if Vite compiles the JSX in it.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  blueprintPages,
  cascivoWorkbench,
  embedUrl,
  entriesModule,
  entryIndex,
  examplesModule,
  findBlueprint,
  scan,
  scopeModule,
  stylesModule,
  tagNames,
  textModule,
} from './plugin.mjs'

let dir: string

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'cascivo-workbench-'))
  // The shape `cascivo add` writes: a directory per component with a barrel and its manifest.
  mkdirSync(join(dir, 'ui', 'button'), { recursive: true })
  writeFileSync(
    join(dir, 'ui', 'button', 'button.tsx'),
    'export function Button(props: { children?: unknown }) { return null }\n',
  )
  writeFileSync(join(dir, 'ui', 'button', 'index.ts'), "export * from './button'\n")
  writeFileSync(
    join(dir, 'ui', 'button', 'button.meta.ts'),
    `export const meta = {
  name: 'Button',
  description: 'Triggers an action',
  props: [],
  tokens: [],
  examples: [
    { title: 'Primary', code: '<Button>Click me</Button>' },
    { title: 'In a card', code: '<Card><Button>OK</Button></Card>' },
  ],
}
`,
  )
  mkdirSync(join(dir, 'pages'))
  writeFileSync(
    join(dir, 'pages', 'home.preview.tsx'),
    'export default function Home() { return null }\nexport const previewProps = {}\n',
  )
  mkdirSync(join(dir, 'node_modules', 'x'), { recursive: true })
  writeFileSync(join(dir, 'node_modules', 'x', 'x.meta.ts'), 'export const meta = {}\n')
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('scan', () => {
  it('finds manifests and previews, not node_modules', () => {
    const { metas, previews } = scan(dir)
    expect(metas).toEqual([join(dir, 'ui', 'button', 'button.meta.ts')])
    expect(previews).toEqual([join(dir, 'pages', 'home.preview.tsx')])
  })
})

describe('generated modules', () => {
  it('reads every tag an example renders', () => {
    expect(tagNames('<Card><Card.Header /><Button>Hi</Button><div /></Card>')).toEqual([
      'Button',
      'Card',
    ])
  })

  it('imports each component through its barrel', () => {
    expect(scopeModule(scan(dir).metas)).toBe(
      `export * from ${JSON.stringify(join(dir, 'ui', 'button', 'index.ts'))}\n`,
    )
  })

  it('turns each example into a render function, keeping their order', async () => {
    const source = await examplesModule([
      { title: 'A', code: '<Button>A</Button>' },
      { title: 'No code' },
      { title: 'Snippet', code: 'const { toast } = useToast()' },
      { title: 'B', code: '<Card />' },
    ])
    expect(source).toContain('const { Button, Card } = names')
    expect(source).toContain('[["Button"],[],[],["Card"]]')
    expect(source.match(/\(\) => \(/g)).toHaveLength(2)
    expect(source).toMatch(/\(\) => \(\n<Button>A<\/Button>\n {2}\),\n {2}null,\n {2}null,\n/)
    expect(source).not.toContain('useToast')
  })

  it("reads a name from the component's own module before the shared scope", async () => {
    const source = await examplesModule(
      [{ title: 'A', code: '<ButtonGroup />' }],
      '/ui/bg/index.ts',
    )
    expect(source).toContain('import * as own from "/ui/bg/index.ts"')
    expect(source).toContain('const names = { ...scope, ...own }')
    expect(source).toContain('const { ButtonGroup } = names')
  })

  it('lists components by path and previews with their props', () => {
    const source = entriesModule(dir, scan(dir))
    expect(source).toContain('id: "ui/button/button"')
    expect(source).toContain('id: "pages/home"')
    expect(source).toContain('previewProps ?? {}')
  })

  it('imports the stylesheets the project installed and names the ones it did not', () => {
    const project = join(dir, 'project')
    const tokens = join(project, 'node_modules', '@cascivo', 'tokens')
    mkdirSync(join(tokens, 'src'), { recursive: true })
    writeFileSync(
      join(tokens, 'package.json'),
      JSON.stringify({ name: '@cascivo/tokens', exports: { '.': './src/index.css' } }),
    )
    writeFileSync(join(tokens, 'src', 'index.css'), '')
    // A themes package that does not export all.css stands in for one that is not there:
    // a missing package would resolve from wherever this repo installed it.
    const themes = join(project, 'node_modules', '@cascivo', 'themes')
    mkdirSync(themes, { recursive: true })
    writeFileSync(
      join(themes, 'package.json'),
      JSON.stringify({ name: '@cascivo/themes', exports: { './light.css': './light.css' } }),
    )
    const source = stylesModule(project, ['/app/reset.css'])
    expect(source).toContain(`import ${JSON.stringify(join(tokens, 'src', 'index.css'))}`)
    expect(source).toContain('import "/app/reset.css"')
    expect(source).toContain('export const missing = ["@cascivo/themes/all.css"]')
  })
})

describe('the entry index', () => {
  it('lists one entry per example, with the URL that renders it alone', async () => {
    const index = await entryIndex(dir, scan(dir), async () => ({
      meta: {
        name: 'Button',
        examples: [
          { title: 'Primary', code: '<Button>Click me</Button>' },
          { title: 'Snippet', code: 'const x = useThing()' },
        ],
      },
    }))
    expect(index.entries).toEqual([
      {
        id: 'ui/button/button/0',
        kind: 'component',
        component: 'Button',
        title: 'Primary',
        renders: true,
        url: '/?embed&theme=light#component/ui/button/button/0',
      },
      expect.objectContaining({ id: 'ui/button/button/1', renders: false }),
      expect.objectContaining({
        id: 'pages/home',
        kind: 'preview',
        url: embedUrl('#preview/pages/home'),
      }),
    ])
  })

  it("re-exports the project's elementToMarkdown", () => {
    const text = join(dir, 'with-text', 'node_modules', '@cascivo', 'text')
    mkdirSync(text, { recursive: true })
    writeFileSync(
      join(text, 'package.json'),
      JSON.stringify({ name: '@cascivo/text', exports: { '.': './index.js' } }),
    )
    writeFileSync(join(text, 'index.js'), 'export const elementToMarkdown = () => ""\n')
    expect(textModule(join(dir, 'with-text'))).toBe(
      `export { elementToMarkdown } from ${JSON.stringify(join(text, 'index.js'))}\n`,
    )
  })
})

describe('blueprint pages', () => {
  /** The shape `cascivo create --from` writes: the blueprint beside `src/`, blocks in `src/blocks/`. */
  function app(pages: unknown): string {
    const root = mkdtempSync(join(dir, 'app-'))
    mkdirSync(join(root, 'src', 'blocks'), { recursive: true })
    writeFileSync(
      join(root, 'src', 'blocks', 'auth-login.tsx'),
      'export function AuthLogin() { return null }\n',
    )
    writeFileSync(join(root, 'cascivo.app.json'), JSON.stringify({ name: 'demo', pages }))
    return root
  }

  it('finds the blueprint beside the scanned directory, then in the project', () => {
    const root = app([])
    expect(findBlueprint(join(root, 'src'), dir)).toBe(join(root, 'cascivo.app.json'))
    expect(findBlueprint(join(dir, 'ui'), root)).toBe(join(root, 'cascivo.app.json'))
    expect(findBlueprint(join(dir, 'ui'), dir)).toBeNull()
  })

  it('makes an entry of each page that renders a block the app has', () => {
    const root = app([
      { title: 'Sign in', block: 'auth-login' },
      { title: 'Reports' },
      { title: 'Users', block: 'users-table-page' },
    ])
    expect(blueprintPages(join(root, 'cascivo.app.json'))).toEqual([
      {
        id: 'app/0-sign-in',
        title: 'Sign in',
        file: join(root, 'src', 'blocks', 'auth-login.tsx'),
        name: 'AuthLogin',
      },
    ])
  })

  it('never turns a block name into a path outside src/blocks', () => {
    const root = app([
      { title: 'Escape', block: '../../auth-login' },
      { title: 'Absolute', block: '/etc/passwd' },
      { title: 'Not a string', block: 42 },
    ])
    writeFileSync(join(root, 'auth-login.tsx'), 'export function AuthLogin() { return null }\n')
    expect(blueprintPages(join(root, 'cascivo.app.json'))).toEqual([])
  })

  it('names the file when it is not JSON', () => {
    const root = app([])
    writeFileSync(join(root, 'cascivo.app.json'), '{ "pages": [')
    expect(() => blueprintPages(join(root, 'cascivo.app.json'))).toThrow(
      `${join(root, 'cascivo.app.json')} is not valid JSON`,
    )
  })

  it('renders each page as its block, with no props, and indexes it', async () => {
    const root = app([{ title: 'Sign in', block: 'auth-login' }])
    const pages = blueprintPages(join(root, 'cascivo.app.json'))
    const found = { metas: [], previews: [], pages }
    const source = entriesModule(join(root, 'src'), found)
    expect(source).toContain(
      `import * as page0 from ${JSON.stringify(join(root, 'src', 'blocks', 'auth-login.tsx'))}`,
    )
    expect(source).toContain(`kind: 'page', title: "Sign in", Component: page0["AuthLogin"]`)
    const index = await entryIndex(join(root, 'src'), found, async () => ({}))
    expect(index.entries).toEqual([
      {
        id: 'app/0-sign-in',
        kind: 'page',
        component: 'AuthLogin',
        title: 'Sign in',
        renders: true,
        url: embedUrl('#preview/app/0-sign-in'),
      },
    ])
  })
})

describe('in Vite', () => {
  it('compiles the examples of a real manifest', async () => {
    const server = await createServer({
      configFile: false,
      // The package directory, as the bin sets it: the UI's React resolves from there.
      root: fileURLToPath(new URL('..', import.meta.url)),
      logLevel: 'silent',
      server: { middlewareMode: true, hmr: false, watch: null },
      plugins: [cascivoWorkbench({ dir })],
    })
    try {
      const result = await server.transformRequest('/@cascivo-workbench/examples/0.tsx')
      expect(result?.code).toContain('Click me')
      expect(result?.code).not.toContain('<Button>')
    } finally {
      await server.close()
    }
  })

  it('serves the entry index', async () => {
    const server = await createServer({
      configFile: false,
      root: fileURLToPath(new URL('..', import.meta.url)),
      logLevel: 'silent',
      server: { port: 0, hmr: false, watch: null },
      plugins: [cascivoWorkbench({ dir })],
    })
    try {
      await server.listen()
      const url = server.resolvedUrls?.local[0]
      const index: unknown = await (await fetch(new URL('/index.json', url))).json()
      expect(index).toMatchObject({
        v: 1,
        entries: [{ id: 'ui/button/button/0' }, { id: 'ui/button/button/1' }, { id: 'pages/home' }],
      })
    } finally {
      await server.close()
    }
  })
})

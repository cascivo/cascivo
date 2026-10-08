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
  cascivoWorkbench,
  entriesModule,
  examplesModule,
  scan,
  scopeModule,
  stylesModule,
  tagNames,
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
})

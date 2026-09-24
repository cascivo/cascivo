import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { INSTALL_HINT, loadViewToMarkdown } from './view-markdown.js'

describe('loadViewToMarkdown', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cascivo-mcp-view-md-'))
    await writeFile(join(dir, 'package.json'), '{ "name": "app", "type": "module" }')
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function fakeRender(body: string): Promise<void> {
    const pkg = join(dir, 'node_modules', '@cascivo', 'render')
    await mkdir(pkg, { recursive: true })
    await writeFile(
      join(pkg, 'package.json'),
      JSON.stringify({
        name: '@cascivo/render',
        type: 'module',
        exports: { './text': { import: './text.mjs', default: './text.mjs' } },
      }),
    )
    await writeFile(join(pkg, 'text.mjs'), body)
  }

  it('explains how to install @cascivo/render when the project lacks it', async () => {
    expect(await loadViewToMarkdown(dir)).toEqual({ ok: false, reason: INSTALL_HINT })
  })

  it("loads viewToMarkdown from the project's own @cascivo/render", async () => {
    await fakeRender(
      'export function viewToMarkdown(config, o) { return `# ${config.title} ${o?.data?.n ?? ""}` }',
    )
    const loaded = await loadViewToMarkdown(dir)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.viewToMarkdown({ title: 'Deploys' }, { data: { n: 3 } })).toBe('# Deploys 3')
  })

  it('reports an installed package without the export', async () => {
    await fakeRender('export const other = 1')
    const loaded = await loadViewToMarkdown(dir)
    expect(loaded.ok).toBe(false)
  })
})

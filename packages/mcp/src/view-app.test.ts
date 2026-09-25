import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it } from 'vitest'
import { createServer } from './server.js'
import { MCP_APP_MIME_TYPE, VIEW_APP_URI, loadViewApp } from './view-app.js'

async function connect() {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  await createServer().connect(serverSide)
  const client = new Client({ name: 'test', version: '1.0.0' })
  await client.connect(clientSide)
  return client
}

const valid = {
  view: { regions: { main: [{ component: 'Button', props: { variant: 'primary' } }] } },
}

describe('show_view (MCP App)', () => {
  it('links the tool to the ui:// view resource', async () => {
    const client = await connect()
    const { tools } = await client.listTools()
    const tool = tools.find((t) => t.name === 'show_view')
    expect(tool?._meta).toMatchObject({ ui: { resourceUri: VIEW_APP_URI } })
    const { resources } = await client.listResources()
    expect(resources).toContainEqual(
      expect.objectContaining({ uri: VIEW_APP_URI, mimeType: MCP_APP_MIME_TYPE }),
    )
  })

  it('returns a valid view as structured content for the app to render', async () => {
    const client = await connect()
    const result = await client.callTool({
      name: 'show_view',
      arguments: { config: valid, data: { n: 1 } },
    })
    expect(result.isError).toBeFalsy()
    expect(result.structuredContent).toEqual({ config: valid, data: { n: 1 } })
  })

  it('returns validation errors instead of a view', async () => {
    const client = await connect()
    const result = await client.callTool({
      name: 'show_view',
      arguments: { config: { view: { regions: { main: [{ component: 'Buton' }] } } } },
    })
    const { errors } = result.structuredContent as { errors: { message: string }[] }
    expect(errors[0]!.message).toMatch(/Unknown component "Buton"/)
  })

  it('reads the built page from next to the server', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cascivo-view-'))
    expect(loadViewApp(dir)).toBeUndefined()
    writeFileSync(join(dir, 'view.html'), '<!doctype html>')
    expect(loadViewApp(dir)).toBe('<!doctype html>')
  })
})

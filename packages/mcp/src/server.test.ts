import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it } from 'vitest'
import { loadRegistry } from './registry.js'
import { createServer } from './server.js'

async function connect(): Promise<Client> {
  const [serverSide, clientSide] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test', version: '0' })
  await Promise.all([createServer().connect(serverSide), client.connect(clientSide)])
  return client
}

function textOf(result: Awaited<ReturnType<Client['callTool']>>): string {
  const [first] = result.content as { type: string; text?: string }[]
  return first?.text ?? ''
}

describe('loadRegistry (real registry.json)', () => {
  it('resolves the monorepo registry and includes enriched meta', () => {
    const registry = loadRegistry()
    expect(registry.components.length).toBeGreaterThanOrEqual(20)
    const button = registry.components.find((c) => c.name === 'button')
    expect(button?.meta.props.length).toBeGreaterThan(0)
    expect(button?.meta.accessibility.role).toBe('button')
  })
})

describe('createServer', () => {
  it('builds without throwing and is connectable', () => {
    const server = createServer()
    expect(typeof server.connect).toBe('function')
  })
})

// Every tool's name, description and schema is sent to the model on every turn, so this surface is
// paid for many times per session. Raising the budget should be a decision, not an accident:
// - 2026-10-07: the trim took it from 22.9 KB to 19.8 KB.
// - 2026-10-08: compose_app + list_blocks added 2.2 KB. compose_app replaces create_app, then
//   reading every page's components, then writing every page by hand: far more than 2 KB a turn.
const TOOL_LIST_BUDGET = 22_500

describe('token budget', () => {
  it('keeps the tool list within its byte budget', async () => {
    const { tools } = await (await connect()).listTools()
    expect(JSON.stringify(tools).length).toBeLessThanOrEqual(TOOL_LIST_BUDGET)
  })

  it('returns the view grammar once, not three times', async () => {
    const client = await connect()
    const scoped = textOf(
      await client.callTool({ name: 'get_view_grammar', arguments: { components: ['Badge'] } }),
    )
    expect(Object.keys(JSON.parse(scoped))).toEqual(['prompt'])
    expect(scoped.split('Badge(').length - 1).toBe(1)
    const detailed = textOf(
      await client.callTool({
        name: 'get_view_grammar',
        arguments: { components: ['Badge'], detail: true },
      }),
    )
    expect(Object.keys(JSON.parse(detailed))).toEqual(['prompt', 'grammar', 'components'])
  })

  it('serves a compact manifest a fraction of the full one', async () => {
    const client = await connect()
    const full = textOf(
      await client.callTool({ name: 'get_component', arguments: { name: 'data-table' } }),
    )
    const compact = textOf(
      await client.callTool({
        name: 'get_component',
        arguments: { name: 'data-table', compact: true },
      }),
    )
    expect(compact.length).toBeLessThan(full.length / 2)
    const parsed: unknown = JSON.parse(compact)
    expect(parsed).toMatchObject({
      name: 'DataTable',
      props: expect.any(Array),
      example: expect.any(String),
    })
  })
})

describe('validate_view targets', () => {
  const view = { view: { regions: { main: [{ component: 'Stat' }] } } }

  it('refuses a component <CascivoView> cannot render by default', async () => {
    const result = textOf(
      await (await connect()).callTool({ name: 'validate_view', arguments: { config: view } }),
    )
    expect(JSON.parse(result)).toMatchObject({ valid: false })
  })

  it('accepts it for a view that becomes TSX', async () => {
    const result = textOf(
      await (
        await connect()
      ).callTool({ name: 'validate_view', arguments: { config: view, target: 'tsx' } }),
    )
    expect(JSON.parse(result)).toMatchObject({ valid: true })
  })
})

describe('blueprint tools', () => {
  it('lists every block a blueprint page can render, one line each', async () => {
    const listed = textOf(await (await connect()).callTool({ name: 'list_blocks', arguments: {} }))
    const lines = listed.split('\n')
    expect(lines.length).toBeGreaterThan(10)
    expect(lines.find((l) => l.startsWith('dashboard-overview — '))).toBeDefined()
  })

  it('refuses a block that does not exist before running anything', async () => {
    const result = await (
      await connect()
    ).callTool({
      name: 'compose_app',
      arguments: { name: 'acme', pages: [{ title: 'Charts', block: 'kpi-charts' }] },
    })
    expect(result.isError).toBe(true)
  })
})

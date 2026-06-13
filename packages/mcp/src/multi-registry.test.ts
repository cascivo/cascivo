import { describe, expect, it } from 'vitest'
import {
  fetchDirectory,
  fetchRegistryIndex,
  getEnvRegistries,
  mergeRegistries,
  type Registry,
  type RegistryDirectoryEntry,
} from './registry.js'
import { createServer } from './server.js'

// ---------------------------------------------------------------------------
// Minimal fixtures
// ---------------------------------------------------------------------------

const DIRECTORY: RegistryDirectoryEntry[] = [
  {
    namespace: '@acme',
    name: 'Acme UI',
    description: 'Acme component library',
    registryUrl: 'https://acme.dev/r',
    verified: true,
    homepage: 'https://acme.dev',
  },
]

const REMOTE_REGISTRY: Registry = {
  version: '1.0.0',
  generatedAt: '2026-06-12',
  components: [
    {
      name: 'widget',
      description: 'A sample widget',
      category: 'display',
      version: '1.0.0',
      files: ['https://acme.dev/r/widget.tsx'],
      dependencies: [],
      tags: ['sample'],
      meta: {
        name: 'Widget',
        description: 'A sample widget',
        category: 'display',
        states: [],
        variants: [],
        sizes: [],
        props: [],
        tokens: [],
        accessibility: { role: 'region', wcag: 'AA', keyboard: [] },
        examples: [],
        dependencies: [],
        tags: ['sample'],
      },
    },
  ],
}

/** Fake fetch that serves directory and remote registry index. */
function makeFetch(
  overrides: Record<string, unknown> = {},
): (url: string, init?: RequestInit) => Promise<Response> {
  const defaults: Record<string, unknown> = {
    'https://cascivo.com/r/registries.json': DIRECTORY,
    'https://acme.dev/r/registry.json': REMOTE_REGISTRY,
    ...overrides,
  }
  return async (url: string) => {
    const body = defaults[url]
    if (body === undefined) {
      return new Response(null, { status: 404 })
    }
    return new Response(JSON.stringify(body), { status: 200 })
  }
}

// ---------------------------------------------------------------------------
// fetchDirectory
// ---------------------------------------------------------------------------

describe('fetchDirectory', () => {
  it('returns parsed entries from the directory URL', async () => {
    const result = await fetchDirectory(makeFetch())
    expect(result).toHaveLength(1)
    expect(result[0]?.namespace).toBe('@acme')
  })

  it('returns empty array on HTTP failure', async () => {
    const result = await fetchDirectory(async () => new Response(null, { status: 500 }))
    expect(result).toEqual([])
  })

  it('returns empty array when body is not an array', async () => {
    const result = await fetchDirectory(
      async () => new Response(JSON.stringify({ not: 'array' }), { status: 200 }),
    )
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// fetchRegistryIndex
// ---------------------------------------------------------------------------

describe('fetchRegistryIndex', () => {
  it('fetches registry.json by appending to registryUrl', async () => {
    const result = await fetchRegistryIndex('https://acme.dev/r', makeFetch())
    expect(result?.components).toHaveLength(1)
    expect(result?.components[0]?.name).toBe('widget')
  })

  it('returns null on HTTP failure', async () => {
    const result = await fetchRegistryIndex(
      'https://acme.dev/r',
      async () => new Response(null, { status: 404 }),
    )
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// mergeRegistries — env wins on namespace collision
// ---------------------------------------------------------------------------

describe('mergeRegistries', () => {
  it('merges directory and env, env overrides on collision', () => {
    const env: RegistryDirectoryEntry[] = [
      {
        namespace: '@acme',
        name: 'Acme Override',
        registryUrl: 'https://override.dev/r',
      },
    ]
    const merged = mergeRegistries(DIRECTORY, env)
    expect(merged).toHaveLength(1)
    expect(merged[0]?.name).toBe('Acme Override')
  })

  it('keeps all unique namespaces', () => {
    const env: RegistryDirectoryEntry[] = [
      { namespace: '@other', name: 'Other', registryUrl: 'https://other.dev/r' },
    ]
    const merged = mergeRegistries(DIRECTORY, env)
    expect(merged).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// getEnvRegistries
// ---------------------------------------------------------------------------

describe('getEnvRegistries', () => {
  it('returns empty array when env var is not set', () => {
    const orig = process.env['CASCADE_REGISTRIES']
    delete process.env['CASCADE_REGISTRIES']
    expect(getEnvRegistries()).toEqual([])
    if (orig !== undefined) process.env['CASCADE_REGISTRIES'] = orig
  })

  it('parses valid JSON array from env var', () => {
    const entry = { namespace: '@env', name: 'Env', registryUrl: 'https://env.dev/r' }
    process.env['CASCADE_REGISTRIES'] = JSON.stringify([entry])
    expect(getEnvRegistries()).toHaveLength(1)
    expect(getEnvRegistries()[0]?.namespace).toBe('@env')
    delete process.env['CASCADE_REGISTRIES']
  })
})

// ---------------------------------------------------------------------------
// MCP server — list_registries tool
// ---------------------------------------------------------------------------

type ToolRecord = Record<string, { handler: (args: unknown) => Promise<unknown> }>

function getTools(server: ReturnType<typeof createServer>): ToolRecord {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (server as any)._registeredTools as ToolRecord
}

describe('list_registries tool', () => {
  it('returns directory entries via injected fetch', async () => {
    const server = createServer({ fetchFn: makeFetch() })
    const tool = getTools(server)['list_registries']
    expect(tool).toBeDefined()
    if (!tool) return
    const result = await tool.handler({})
    const txt = (result as { content: [{ text: string }] }).content[0]?.text ?? ''
    const parsed = JSON.parse(txt) as RegistryDirectoryEntry[]
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.namespace).toBe('@acme')
  })
})

// ---------------------------------------------------------------------------
// MCP server — get_component with registry param
// ---------------------------------------------------------------------------

describe('get_component with registry param', () => {
  it('fetches from remote registry when registry param is provided', async () => {
    const server = createServer({ fetchFn: makeFetch() })
    const tool = getTools(server)['get_component']
    expect(tool).toBeDefined()
    if (!tool) return
    const result = await tool.handler({ name: 'widget', registry: '@acme' })
    const txt = (result as { content: [{ text: string }] }).content[0]?.text ?? ''
    const parsed = JSON.parse(txt) as { name: string }
    expect(parsed.name).toBe('Widget')
  })

  it('returns error when registry namespace is not found', async () => {
    const server = createServer({ fetchFn: makeFetch() })
    const tool = getTools(server)['get_component']
    if (!tool) return
    const result = await tool.handler({ name: 'widget', registry: '@unknown' })
    expect((result as { isError?: boolean }).isError).toBe(true)
  })

  it('default behavior unchanged when no registry param', async () => {
    const server = createServer({ fetchFn: makeFetch() })
    const tool = getTools(server)['get_component']
    if (!tool) return
    // 'button' is in the real bundled registry
    const result = await tool.handler({ name: 'button' })
    const txt = (result as { content: [{ text: string }] }).content[0]?.text ?? ''
    const parsed = JSON.parse(txt) as { name: string }
    expect(parsed.name).toBe('Button')
  })
})

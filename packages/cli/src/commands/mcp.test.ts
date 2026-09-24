import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mcp, mergeMcpConfig } from './mcp.js'

describe('mergeMcpConfig', () => {
  it('creates the server list when there is no file', () => {
    const r = mergeMcpConfig(undefined, 'claude')
    expect(r).toEqual({
      kind: 'added',
      config: { mcpServers: { cascivo: { command: 'npx', args: ['-y', '@cascivo/mcp'] } } },
    })
  })

  it('keeps every other server and top-level key', () => {
    const r = mergeMcpConfig({ other: 1, mcpServers: { github: { command: 'gh' } } }, 'cursor')
    expect(r.kind).toBe('added')
    if (r.kind !== 'added') return
    expect(r.config['other']).toBe(1)
    expect(r.config['mcpServers']).toMatchObject({ github: { command: 'gh' } })
  })

  it('uses VS Code’s `servers` key and stdio type', () => {
    const r = mergeMcpConfig(undefined, 'vscode')
    expect(r).toEqual({
      kind: 'added',
      config: {
        servers: { cascivo: { type: 'stdio', command: 'npx', args: ['-y', '@cascivo/mcp'] } },
      },
    })
  })

  it('leaves an existing cascivo entry alone', () => {
    expect(mergeMcpConfig({ mcpServers: { cascivo: { command: 'custom' } } }, 'claude')).toEqual({
      kind: 'unchanged',
    })
  })

  it('refuses shapes it cannot merge into', () => {
    expect(mergeMcpConfig([], 'claude').kind).toBe('error')
    expect(mergeMcpConfig({ mcpServers: [] }, 'claude').kind).toBe('error')
  })
})

describe('cascivo mcp init', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cascivo-mcp-test-'))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.exitCode = undefined
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  it('writes .mcp.json for Claude Code by default', async () => {
    await mcp(['init'], dir)
    const written = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf8')) as unknown
    expect(written).toEqual({
      mcpServers: { cascivo: { command: 'npx', args: ['-y', '@cascivo/mcp'] } },
    })
  })

  it('writes .cursor/mcp.json, creating the directory', async () => {
    await mcp(['init', '--client', 'cursor'], dir)
    const written = JSON.parse(await readFile(join(dir, '.cursor', 'mcp.json'), 'utf8')) as {
      mcpServers: Record<string, unknown>
    }
    expect(Object.keys(written.mcpServers)).toEqual(['cascivo'])
  })

  it('does not touch a file that is not valid JSON', async () => {
    await writeFile(join(dir, '.mcp.json'), '{ broken')
    await mcp(['init'], dir)
    expect(await readFile(join(dir, '.mcp.json'), 'utf8')).toBe('{ broken')
    expect(process.exitCode).toBe(1)
  })

  it('writes nothing on --dry-run', async () => {
    await mkdir(join(dir, '.vscode'))
    await mcp(['init', '--client=vscode', '--dry-run'], dir)
    await expect(readFile(join(dir, '.vscode', 'mcp.json'), 'utf8')).rejects.toThrow()
  })

  it('rejects an unknown client', async () => {
    await mcp(['init', '--client', 'emacs'], dir)
    expect(process.exitCode).toBe(1)
  })
})

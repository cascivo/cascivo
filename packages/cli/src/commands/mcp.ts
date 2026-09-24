import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** MCP clients whose project-level config file this command knows how to write. */
export const MCP_CLIENTS = ['claude', 'cursor', 'vscode'] as const
export type McpClient = (typeof MCP_CLIENTS)[number]

const SERVER_NAME = 'cascivo'
const SERVER = { command: 'npx', args: ['-y', '@cascivo/mcp'] }

/**
 * Where each client reads a project-scoped server list, and under which key.
 * VS Code nests servers under `servers` and wants an explicit `type`; the others share
 * the `mcpServers` shape the MCP reference clients established.
 */
const TARGETS: Record<McpClient, { file: string; key: string; entry: Record<string, unknown> }> = {
  claude: { file: '.mcp.json', key: 'mcpServers', entry: SERVER },
  cursor: { file: join('.cursor', 'mcp.json'), key: 'mcpServers', entry: SERVER },
  vscode: {
    file: join('.vscode', 'mcp.json'),
    key: 'servers',
    entry: { type: 'stdio', ...SERVER },
  },
}

export type MergeResult =
  | { kind: 'added'; config: Record<string, unknown> }
  | { kind: 'unchanged' }
  | { kind: 'error'; message: string }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Add the cascivo server to an existing client config without touching anything else in
 * it. `existing` is whatever JSON.parse returned (or `undefined` for no file), so every
 * shape is checked before it is trusted.
 */
export function mergeMcpConfig(existing: unknown, client: McpClient): MergeResult {
  const { key, entry } = TARGETS[client]
  let config: Record<string, unknown> = {}
  if (existing !== undefined) {
    if (!isRecord(existing)) return { kind: 'error', message: 'the file is not a JSON object' }
    config = { ...existing }
  }
  const servers = config[key]
  if (servers !== undefined && !isRecord(servers)) {
    return { kind: 'error', message: `"${key}" is not an object` }
  }
  if (servers !== undefined && SERVER_NAME in servers) return { kind: 'unchanged' }
  config[key] = { ...servers, [SERVER_NAME]: entry }
  return { kind: 'added', config }
}

function parseClient(args: string[]): McpClient | { error: string } {
  const eq = args.find((a) => a.startsWith('--client='))
  const idx = args.indexOf('--client')
  const value = eq ? eq.slice('--client='.length) : idx !== -1 ? args[idx + 1] : 'claude'
  if (value !== undefined && (MCP_CLIENTS as readonly string[]).includes(value)) {
    return value as McpClient
  }
  return { error: `Unknown --client "${value ?? ''}". Use one of: ${MCP_CLIENTS.join(', ')}.` }
}

/** `cascivo mcp init [--client claude|cursor|vscode] [--dry-run]` */
export async function mcp(args: string[], cwd: string = process.cwd()): Promise<void> {
  const [sub, ...rest] = args
  if (sub !== 'init') {
    console.error(`Unknown mcp subcommand: ${sub ?? '(none)'}. Did you mean "cascivo mcp init"?`)
    process.exitCode = 1
    return
  }
  const client = parseClient(rest)
  if (typeof client !== 'string') {
    console.error(client.error)
    process.exitCode = 1
    return
  }

  const file = join(cwd, TARGETS[client].file)
  let existing: unknown
  if (existsSync(file)) {
    try {
      existing = JSON.parse(readFileSync(file, 'utf8')) as unknown
    } catch (err) {
      console.error(
        `${TARGETS[client].file} is not valid JSON (${(err as Error).message}). Fix or remove it, then run this again — it was left untouched.`,
      )
      process.exitCode = 1
      return
    }
  }

  const result = mergeMcpConfig(existing, client)
  if (result.kind === 'error') {
    console.error(
      `${TARGETS[client].file}: ${result.message}. It was left untouched — add the server by hand.`,
    )
    process.exitCode = 1
    return
  }
  if (result.kind === 'unchanged') {
    console.log(`${TARGETS[client].file} already configures the cascivo MCP server.`)
    return
  }

  const body = `${JSON.stringify(result.config, null, 2)}\n`
  if (rest.includes('--dry-run')) {
    console.log(`Would write ${TARGETS[client].file}:\n\n${body}`)
    return
  }
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, body)
  console.log(
    `Added the cascivo MCP server to ${TARGETS[client].file}. Restart ${client === 'claude' ? 'Claude Code' : client === 'cursor' ? 'Cursor' : 'VS Code'} to load it.`,
  )
}

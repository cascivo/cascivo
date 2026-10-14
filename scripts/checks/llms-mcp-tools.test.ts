/**
 * Every MCP tool is named in the published llms.txt.
 *
 * llms.txt is where an agent without the MCP server connected learns what the server can do. Its
 * tool list was hand-written and had fallen behind: `create_app`, `add_template`, `list_templates`
 * and `get_view_grammar` — the one-call paths — were missing, so an agent following llms.txt
 * built by hand what one call would have scaffolded (2026-10-07 research, §1.4 defect 5).
 *
 * This reads the `registerTool` names from packages/mcp/src/server.ts and the PUBLISHED
 * apps/site/public/llms.txt (not the generator's constant, which would make the check compare
 * a list with itself), so it fails on a new tool, a hand-edit, and a missing `pnpm regen`.
 *
 * Run with: `pnpm llms:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const ROOT = join(import.meta.dirname, '../..')

function registeredTools(): string[] {
  const source = readFileSync(join(ROOT, 'packages/mcp/src/server.ts'), 'utf8')
  return [...source.matchAll(/registerTool\(\s*'([a-z_]+)'/g)].map((m) => m[1]!)
}

function documentedTools(): Set<string> {
  const llms = readFileSync(join(ROOT, 'apps/site/public/llms.txt'), 'utf8')
  const section = /## MCP server[^\n]*\n([\s\S]*?)\n## /.exec(llms)?.[1] ?? ''
  return new Set([...section.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]!))
}

describe('llms.txt MCP tool list', () => {
  it('reads both sides', () => {
    assert.ok(registeredTools().length > 20, String(registeredTools()))
    assert.ok(documentedTools().size > 0, 'No MCP section found in llms.txt')
  })

  it('names every registered tool', () => {
    const documented = documentedTools()
    const missing = registeredTools().filter((tool) => !documented.has(tool))
    assert.deepEqual(
      missing,
      [],
      `llms.txt does not name these MCP tools: ${missing.join(', ')}. Add them to MCP_TOOL_GROUPS ` +
        'in scripts/llms/generate.ts and run `pnpm regen`.',
    )
  })
})

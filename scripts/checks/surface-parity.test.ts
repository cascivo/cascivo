/**
 * Every CLI command and every MCP tool is either paired with its counterpart, or says why not.
 *
 * ## Why
 *
 * A human reaches cascivo through the CLI and an agent through the MCP server. A capability
 * that exists on one surface only is invisible from the other: `cascivo email lint` shipped
 * with no MCP tool, so an agent writing a password-reset mail could render it but never check
 * it, and would hand-roll a worse check or skip it. Nothing flagged the gap, because nothing
 * listed the two surfaces side by side.
 *
 * This is that list. It does not demand that every capability exist twice — some genuinely
 * belong to one surface (`mcp init` configures the agent; `get_view_grammar` is a prompt) —
 * but it makes a one-sided addition a written decision rather than an accident: a new
 * command or tool fails here until it is paired or given a reason.
 *
 * Both sides are read from source, not hand-copied: CLI commands from the `HELP` text in
 * `packages/cli/src/index.ts` (what a user is told exists), MCP tools from the
 * `registerTool` calls in `packages/mcp/src/server.ts`.
 */
import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

interface Surface {
  capability: string
  /** The CLI command as `HELP` names it: `add`, `email lint`. */
  cli?: string
  mcp?: string[]
  /** Required when `cli` or `mcp` is absent: why this capability lives on one surface. */
  oneSided?: string
}

const SURFACES: Surface[] = [
  // Paired
  // `compose_app` is `create --from <blueprint>`.
  { capability: 'scaffold an app', cli: 'create', mcp: ['create_app', 'compose_app'] },
  { capability: 'install components', cli: 'add', mcp: ['add_to_project', 'add_template'] },
  { capability: 'list components', cli: 'list', mcp: ['list_components'] },
  { capability: 'search components', cli: 'search', mcp: ['search_components'] },
  { capability: 'read one component', cli: 'view', mcp: ['get_component'] },
  { capability: 'build a theme', cli: 'theme', mcp: ['create_theme'] },
  { capability: 'check generated code', cli: 'audit', mcp: ['validate_component'] },
  { capability: 'check a rendered email', cli: 'email lint', mcp: ['lint_email'] },

  // CLI only
  {
    capability: 'project setup',
    cli: 'init',
    oneSided: 'One-time, writes config interactively; create_app covers the agent case.',
  },
  {
    capability: 'update installed components',
    cli: 'update',
    oneSided: 'Rewrites files the user owns; a human reviews that diff.',
  },
  {
    capability: 'eject tokens',
    cli: 'eject',
    oneSided: 'Rewrites files the user owns; a human reviews that diff.',
  },
  {
    capability: 'render a ViewConfig to TSX',
    cli: 'generate',
    oneSided: 'An agent writes the TSX itself from scaffold_view / validate_view output.',
  },
  {
    capability: 'project health',
    cli: 'doctor',
    oneSided: 'A CI gate over the whole project; validate_component covers one file for agents.',
  },
  {
    capability: 'configure the agent',
    cli: 'mcp init',
    oneSided: 'Installs this MCP server — it cannot run before the server exists.',
  },
  {
    capability: 'build a registry',
    cli: 'registry build',
    oneSided: 'A publisher build step run in CI, not a per-task action.',
  },
  {
    capability: 'author a template',
    cli: 'template init',
    oneSided: 'A publisher authoring step; agents consume templates via list/get/add_template.',
  },
  {
    capability: 'import design tokens',
    cli: 'tokens import',
    oneSided: 'Reads a file from a design tool export; get_tokens serves the catalog to agents.',
  },

  // MCP only
  {
    capability: 'list registries',
    mcp: ['list_registries'],
    oneSided: 'The CLI searches every registry implicitly (`search`, `add owner/repo/name`).',
  },
  {
    capability: 'pick a component by need',
    mcp: ['select_component', 'get_context'],
    oneSided: 'Ranking for a model; a human reads the docs site.',
  },
  {
    capability: 'read the guides',
    mcp: ['list_guides', 'get_guide'],
    oneSided: 'Humans have `npx @cascivo/docs` and cascivo.com.',
  },
  {
    capability: 'look up tokens and icons',
    mcp: ['get_tokens', 'search_icons', 'get_variant_matrix'],
    oneSided: 'Closed-set catalogs to stop a model inventing names; humans read the docs.',
  },
  {
    capability: 'generate a view',
    mcp: ['scaffold_view', 'scaffold_page', 'scaffold_flow', 'get_view_grammar'],
    oneSided: 'Natural language → config is a model task; `generate` is the CLI half.',
  },
  {
    capability: 'check a view',
    mcp: ['validate_view', 'render_view_as_markdown'],
    oneSided: 'Lets a model read back what it generated; a human looks at the page.',
  },
  {
    capability: 'preview a deploy',
    mcp: ['deploy_preview'],
    oneSided: 'Shells out to wrangler, which a human runs directly.',
  },
  {
    capability: 'browse templates',
    mcp: ['list_templates', 'get_template'],
    oneSided: 'Humans browse the marketplace site; `add` installs.',
  },
  {
    capability: 'browse blueprint blocks',
    mcp: ['list_blocks'],
    oneSided:
      'An agent needs the catalog before writing a blueprint; on the CLI, `create --from` names every block when one is wrong.',
  },
]

function cliCommands(): string[] {
  const source = readFileSync(`${ROOT}/packages/cli/src/index.ts`, 'utf8')
  const help = /const HELP = `[\s\S]*?\nCommands:\n([\s\S]*?)\n\n/.exec(source)
  assert.ok(help, 'Could not find the Commands block in the CLI HELP text.')
  // `  email lint <file...>  …` → `email lint`; `  theme <add|create>` → `theme`. Indented
  // continuation lines start with more than two spaces and are skipped.
  return [...help[1]!.matchAll(/^ {2}([a-z]+(?: [a-z]+)?)(?= |$)/gm)].map((m) => m[1]!)
}

function mcpTools(): string[] {
  const source = readFileSync(`${ROOT}/packages/mcp/src/server.ts`, 'utf8')
  return [...source.matchAll(/registerTool\(\s*'([a-z_]+)'/g)].map((m) => m[1]!)
}

describe('surface parity (CLI ↔ MCP)', () => {
  it('reads both surfaces', () => {
    assert.ok(cliCommands().includes('email lint'), String(cliCommands()))
    assert.ok(mcpTools().includes('lint_email'), String(mcpTools()))
  })

  it('every CLI command is listed exactly once', () => {
    for (const command of cliCommands()) {
      const rows = SURFACES.filter((s) => s.cli === command)
      assert.equal(
        rows.length,
        1,
        `CLI command "${command}" is listed ${rows.length} times in SURFACES. Pair it with its ` +
          'MCP tool, or add it with a `oneSided` reason.',
      )
    }
  })

  it('every MCP tool is listed exactly once', () => {
    for (const tool of mcpTools()) {
      const rows = SURFACES.filter((s) => s.mcp?.includes(tool))
      assert.equal(
        rows.length,
        1,
        `MCP tool "${tool}" is listed ${rows.length} times in SURFACES. Pair it with its CLI ` +
          'command, or add it with a `oneSided` reason.',
      )
    }
  })

  it('names nothing that does not exist', () => {
    const commands = new Set(cliCommands())
    const tools = new Set(mcpTools())
    for (const s of SURFACES) {
      if (s.cli) assert.ok(commands.has(s.cli), `"${s.cli}" is not a CLI command (${s.capability})`)
      for (const tool of s.mcp ?? []) {
        assert.ok(tools.has(tool), `"${tool}" is not an MCP tool (${s.capability})`)
      }
    }
  })

  it('a one-sided capability says why, and a paired one does not', () => {
    for (const s of SURFACES) {
      const paired = s.cli !== undefined && (s.mcp?.length ?? 0) > 0
      if (paired) {
        assert.equal(s.oneSided, undefined, `"${s.capability}" is paired; drop its stale reason.`)
      } else {
        assert.ok(s.oneSided?.trim(), `"${s.capability}" exists on one surface only; say why.`)
      }
    }
  })
})

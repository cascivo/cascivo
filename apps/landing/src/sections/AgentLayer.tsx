import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascade-ui/components/tabs'
import { CascadeView } from '@cascade-ui/render'
import type { ViewConfig } from '@cascade-ui/render'
import buttonMetaSource from '../../../../packages/components/src/button/button.meta.ts?raw'
import { CopyCommand } from './CopyCommand'

function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightJSON(code: string): string {
  const tokenRe = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|./gs
  let result = ''
  for (const m of code.matchAll(tokenRe)) {
    const token = m[0]
    if (token.startsWith('"')) {
      const after = code.slice((m.index ?? 0) + token.length).trimStart()
      const escaped = escapeHTML(token)
      result += after.startsWith(':')
        ? `<span class="hl-key">${escaped}</span>`
        : `<span class="hl-string">${escaped}</span>`
    } else if (/^-?\d/.test(token)) {
      result += `<span class="hl-number">${token}</span>`
    } else if (token === 'true' || token === 'false' || token === 'null') {
      result += `<span class="hl-keyword">${token}</span>`
    } else {
      result += escapeHTML(token)
    }
  }
  return result
}

const TS_KEYWORDS = new Set([
  'export',
  'const',
  'let',
  'var',
  'type',
  'interface',
  'function',
  'import',
  'from',
  'as',
  'default',
  'return',
  'true',
  'false',
  'null',
  'undefined',
  'string',
  'number',
  'boolean',
  'readonly',
  'object',
  'any',
])

function highlightTS(code: string): string {
  const tokenRe =
    /\/\/[^\n]*|`[^`]*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?|[a-zA-Z_$][a-zA-Z0-9_$]*|./gs
  let result = ''
  for (const m of code.matchAll(tokenRe)) {
    const token = m[0]
    if (token.startsWith('//')) {
      result += `<span class="hl-comment">${escapeHTML(token)}</span>`
    } else if (token[0] === '"' || token[0] === "'" || token[0] === '`') {
      result += `<span class="hl-string">${escapeHTML(token)}</span>`
    } else if (/^-?\d/.test(token)) {
      result += `<span class="hl-number">${token}</span>`
    } else if (TS_KEYWORDS.has(token)) {
      result += `<span class="hl-keyword">${token}</span>`
    } else {
      result += escapeHTML(token)
    }
  }
  return result
}

const manifestExcerpt = `${buttonMetaSource.split('\n').slice(0, 14).join('\n')}\n  // …\n}`

const MCP_CLIENTS = [
  {
    id: 'claude',
    label: 'Claude Code',
    command: 'claude mcp add cascade -- npx -y @cascade-ui/mcp',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    command: '"cascade": { "command": "npx", "args": ["-y", "@cascade-ui/mcp"] }',
  },
  {
    id: 'vscode',
    label: 'VS Code',
    command:
      'code --add-mcp \'{"name":"cascade","command":"npx","args":["-y","@cascade-ui/mcp"]}\'',
  },
]

const RELAY_SLICE: ViewConfig = {
  version: 1,
  view: {
    regions: {
      incident: [
        {
          component: 'Alert',
          props: { variant: 'warning', title: 'Elevated 5xx on notifications' },
          children: 'Deploy 2f9b3aa rolled back automatically. Retry queue draining.',
        },
      ],
      status: [
        { component: 'Badge', props: { variant: 'success' }, children: 'live' },
        { component: 'Badge', props: { variant: 'outline' }, children: '0.42% errors' },
      ],
      actions: [
        { component: 'Button', props: { variant: 'primary' }, children: 'New deploy' },
        { component: 'Button', props: { variant: 'secondary' }, children: 'View logs' },
      ],
    },
  },
}

const RELAY_SLICE_JSON = JSON.stringify(RELAY_SLICE, null, 2)

export function AgentLayer() {
  return (
    <section className="agents" id="agents" data-reveal="">
      <h2>Your agent already knows cascade</h2>
      <p className="agents-sub">
        Every component ships a machine-readable manifest. The MCP server, the Claude Code skills,
        the docs, and <a href="/llms.txt">llms.txt</a> are all generated from it — what your agent
        reads is what you ship.
      </p>

      <div className="agents-grid">
        <article className="agent-artifact">
          <h3>The manifest is the source of truth</h3>
          <pre
            className="agent-code"
            tabIndex={0}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: highlightTS(manifestExcerpt) }}
          />
          <p className="agent-caption">
            button.meta.ts — real file, imported into this page at build time.
          </p>
        </article>

        <article className="agent-artifact">
          <h3>Connect the MCP server</h3>
          <Tabs defaultValue="claude">
            <TabsList>
              {MCP_CLIENTS.map((c) => (
                <TabsTrigger key={c.id} value={c.id}>
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {MCP_CLIENTS.map((c) => (
              <TabsContent key={c.id} value={c.id}>
                <CopyCommand command={c.command} />
              </TabsContent>
            ))}
          </Tabs>
          <p className="agent-caption">
            Six tools: list_components, get_component, search_components, add_to_project,
            create_theme, scaffold_page.
          </p>
        </article>

        <article className="agent-artifact agent-prompt">
          <h3>Then just ask</h3>
          <blockquote className="agent-prompt-text">
            &ldquo;Add a deploys table with status badges and a new-deploy dialog to my settings
            page — use cascade components.&rdquo;
          </blockquote>
          <p className="agent-caption">
            The agent resolves components via MCP, copies owned code via the CLI, and validates
            against the manifest — the same flow as <code>npx cascade add</code>.
          </p>
        </article>

        <article className="agent-artifact agent-render">
          <h3>Agents don&apos;t screenshot. They render.</h3>
          <div className="agent-render-panes">
            <pre
              className="agent-code"
              tabIndex={0}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: highlightJSON(RELAY_SLICE_JSON) }}
            />
            <div className="agent-render-preview">
              <CascadeView config={RELAY_SLICE} onInvalid="render" />
            </div>
          </div>
          <p className="agent-caption">
            CascadeView renders <code>view.v1.json</code> configs straight to live cascade UI — the
            JSON on the left is the source of the panel on the right.{' '}
            <a href="/docs/playground">Edit it in the playground →</a>
          </p>
        </article>
      </div>
    </section>
  )
}

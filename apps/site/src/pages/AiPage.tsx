import { CodeBlock } from './components/CodeBlock'
import { StreamingText, AiLabel, Terminal, AiChat } from '@cascivo/ai'

const MCP_SETUP = `// .claude/settings.json
{
  "mcpServers": {
    "cascivo": {
      "command": "npx",
      "args": ["@cascivo/mcp"]
    }
  }
}`

const AGENT_SESSION = `# An illustrative agent session — select, scaffold, validate.

User: "Add a searchable table of invoices with status badges, keyboard accessible."

agent → select_component { needs: "tabular data · sortable · filterable · a11y" }
      ← data-table   (sort · filter · pagination · row selection · WCAG 2.2 AA · ⌘-nav)

agent → scaffold_view "invoices table with a status column and a search box"
      ← view.json { regions: [ search, data-table ] }

agent → validate_view view.json
      ← ⚠ data-table.columns[2] hard-codes "#16a34a"
         → render a <status> or use --cascivo-color-success (see get_tokens)

agent (fixes the column, re-runs) → validate_view view.json
      ← ✓ 0 invented props · 0 raw values · all required wiring present`

const VIEW_QUICKSTART = `// view.json — describe a page in JSON, generate owned React code
{
  "version": "1",
  "layout": "sidebar-content",
  "regions": {
    "sidebar": [{ "component": "accordion", "props": { "type": "single" } }],
    "content": [
      { "component": "card", "props": { "title": "Welcome" } },
      { "component": "data-table", "props": { "columns": [] } }
    ]
  }
}

// Generate owned code:
// npx cascivo generate view.json --out src/pages/Dashboard.tsx`

export function AiPage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">For AI agents</div>
        <h1>Machine-readable endpoints</h1>
        <p class="doc-lede">
          cascivo is built AI-first. Every component ships a machine-readable manifest. The MCP
          server, llms.txt, and registry.json give agents everything needed to add, generate, and
          validate cascivo usage without hallucination.
        </p>
      </header>

      <section class="doc-section">
        <h2>Not just install — select, scaffold, validate</h2>
        <p>
          Most component MCP servers browse a registry and install items. cascivo does that too (
          <code>list_components</code>, <code>search_components</code>, <code>get_component</code>,{' '}
          <code>add_to_project</code>) — and then goes further, because every component ships a
          manifest and every token is a closed set. An agent can{' '}
          <strong>select by constraint</strong> (<code>select_component</code>),{' '}
          <strong>scaffold a whole view</strong> from a grammar (<code>scaffold_view</code> ·{' '}
          <code>get_view_grammar</code>), and <strong>validate its own output</strong> against the
          manifests and tokens (<code>validate_view</code> · <code>validate_component</code>). The
          agent doesn&rsquo;t just get code — it gets told when the code is wrong.
        </p>
        <CodeBlock code={AGENT_SESSION} lang="bash" />
        <p class="muted">
          The same checks run in your codebase with <code>cascivo audit --ai</code> — it flags
          hard-coded values, invented props, and missing required wiring in generated code.
        </p>
      </section>

      <section class="doc-section">
        <h2>MCP server setup</h2>
        <p>Add the cascivo MCP server to your Claude Code (or any MCP-compatible agent) config:</p>
        <CodeBlock code={MCP_SETUP} lang="bash" />
        <p>Key MCP tools (20 in total — browse, select, scaffold, validate, theme, install):</p>
        <ul>
          <li>
            <code>list_components</code> / <code>search_components</code> — browse by category, tag,
            or query
          </li>
          <li>
            <code>get_component</code> — full manifest: props, tokens, states, a11y, examples
          </li>
          <li>
            <code>select_component</code> — pick the right component from a described constraint
          </li>
          <li>
            <code>scaffold_view</code> / <code>get_view_grammar</code> — description → validated
            JSON view config
          </li>
          <li>
            <code>validate_view</code> / <code>validate_component</code> — check generated output
            against the manifests and closed token set
          </li>
          <li>
            <code>get_tokens</code> / <code>get_context</code> / <code>create_theme</code> — tokens,
            intent/boundaries, and brand themes
          </li>
          <li>
            <code>add_to_project</code> — install components into the user project
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>View config quickstart</h2>
        <p>
          Describe a page in JSON, validate it against the schema, then generate owned React code:
        </p>
        <CodeBlock code={VIEW_QUICKSTART} lang="bash" />
      </section>

      <section class="doc-section">
        <h2>Agent endpoints</h2>
        <ul>
          <li>
            <a href="/llms.txt">
              <code>/llms.txt</code>
            </a>{' '}
            — project overview, authoring rules, full component index
          </li>
          <li>
            <a href="/llms/">
              <code>/llms/&lt;name&gt;.md</code>
            </a>{' '}
            — per-component markdown: props table, examples, tokens, a11y notes
          </li>
          <li>
            <a href="/registry.json">
              <code>/registry.json</code>
            </a>{' '}
            — machine-readable component registry (source of truth for CLI + MCP + docs)
          </li>
          <li>
            <a href="/view.v1.json">
              <code>/view.v1.json</code>
            </a>{' '}
            — JSON Schema for cascivo view configs
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>Claude Code skills</h2>
        <p>
          Install the cascivo skills from the{' '}
          <a href="https://github.com/cascivo/cascivo/tree/main/skills">skills/ directory</a>:
        </p>
        <ul>
          <li>
            <code>cascivo:add</code> — add components, resolve fuzzy names, verify imports compile
          </li>
          <li>
            <code>cascivo:design-page</code> — natural language → scaffold_view → validate →
            generate
          </li>
          <li>
            <code>cascivo:create-theme</code> — brand colors → semantic token overrides → WCAG AA
            check
          </li>
          <li>
            <code>cascivo:extend</code> — scaffold a new component following cascivo authoring rules
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>AI components</h2>
        <p>
          The <code>@cascivo/ai</code> package ships four AI-native components.
        </p>

        <h3>StreamingText</h3>
        <p>Animates text character-by-character, mimicking token-by-token LLM output.</p>
        <StreamingText text="Hello, I am cascivo — the AI-first design system." speed={3} />

        <h3>AiLabel</h3>
        <p>Status badge for AI operations.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBlock: '0.75rem' }}>
          <AiLabel variant="generating" />
          <AiLabel variant="done" />
          <AiLabel variant="error" />
        </div>

        <h3>Terminal</h3>
        <p>Animated terminal output for showing CLI commands.</p>
        <Terminal
          lines={[
            { text: 'npx cascivo add button', prefix: '$', type: 'command' },
            { text: '✓ Button added to src/components/Button.tsx', type: 'output' },
            { text: '✓ Done in 0.12s', type: 'output' },
          ]}
          speed={4}
        />

        <h3>AiChat</h3>
        <p>A minimal chat interface for AI assistant interactions.</p>
        <div style={{ height: '400px', maxWidth: '640px' }}>
          <AiChat
            messages={[
              { id: '1', role: 'user', content: 'How do I add a Button component?' },
              { id: '2', role: 'assistant', content: 'Run: npx cascivo add button' },
            ]}
            onSend={() => {}}
          />
        </div>
      </section>
    </article>
  )
}

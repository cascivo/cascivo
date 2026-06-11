import { CodeBlock } from './components/CodeBlock'
import { StreamingText, AiLabel, Terminal, AiChat } from '@cascade-ui/ai'

const MCP_SETUP = `// .claude/settings.json
{
  "mcpServers": {
    "cascade": {
      "command": "npx",
      "args": ["@cascade-ui/mcp"]
    }
  }
}`

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
// npx cascade generate view.json --out src/pages/Dashboard.tsx`

export function AiPage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">For AI agents</div>
        <h1>Machine-readable endpoints</h1>
        <p class="doc-lede">
          cascade is built AI-first. Every component ships a machine-readable manifest. The MCP
          server, llms.txt, and registry.json give agents everything needed to add, generate, and
          validate cascade usage without hallucination.
        </p>
      </header>

      <section class="doc-section">
        <h2>MCP server setup</h2>
        <p>Add the cascade MCP server to your Claude Code (or any MCP-compatible agent) config:</p>
        <CodeBlock code={MCP_SETUP} lang="bash" />
        <p>Available MCP tools:</p>
        <ul>
          <li>
            <code>list_components</code> — list all components with category and tags
          </li>
          <li>
            <code>get_component</code> — full component manifest with props, tokens, examples
          </li>
          <li>
            <code>scaffold_view</code> — natural language description → JSON view config
          </li>
          <li>
            <code>validate_view</code> — validate a view config against the schema
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
            — JSON Schema for cascade view configs
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>Claude Code skills</h2>
        <p>
          Install the cascade skills from the{' '}
          <a href="https://github.com/urbanisierung/cascade-ui/tree/main/skills">
            skills/ directory
          </a>
          :
        </p>
        <ul>
          <li>
            <code>cascade:add</code> — add components, resolve fuzzy names, verify imports compile
          </li>
          <li>
            <code>cascade:design-page</code> — natural language → scaffold_view → validate →
            generate
          </li>
          <li>
            <code>cascade:create-theme</code> — brand colors → semantic token overrides → WCAG AA
            check
          </li>
          <li>
            <code>cascade:extend</code> — scaffold a new component following cascade authoring rules
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>AI components</h2>
        <p>
          The <code>@cascade-ui/ai</code> package ships four AI-native components.
        </p>

        <h3>StreamingText</h3>
        <p>Animates text character-by-character, mimicking token-by-token LLM output.</p>
        <StreamingText text="Hello, I am cascade — the AI-first design system." speed={3} />

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
            { text: 'npx cascade add button', prefix: '$', type: 'command' },
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
              { id: '2', role: 'assistant', content: 'Run: npx cascade add button' },
            ]}
            onSend={() => {}}
          />
        </div>
      </section>
    </article>
  )
}

import { CodeBlock } from './components/CodeBlock'
import { AiChat } from '@cascivo/ai'
import { AiStatus } from '@cascivo/components/ai-status'
import { ChainOfThought } from '@cascivo/components/chain-of-thought'
import { Reasoning } from '@cascivo/components/reasoning'

/** The AI registry components, grouped the way a reply uses them. */
const AI_COMPONENTS: Record<'progress' | 'agent' | 'provenance', [string, string][]> = {
  progress: [
    [
      'ai-status',
      'what the AI is doing: thinking, generating, done, failed, stopped; optional Stop',
    ],
    ['shimmer-text', 'the “Thinking…” sweep for a label'],
    ['typing-indicator', 'three dots before the first token'],
    ['reasoning', 'a collapsible reasoning trace: “Thinking…”, then “Thought for 12 seconds”'],
    ['streaming-text', 'reveals a streamed reply character by character'],
    ['skeleton', 'set ai to tint the placeholder for content an AI is generating'],
    ['context-meter', 'how much of the context window is used'],
  ],
  agent: [
    ['chain-of-thought', 'the steps an agent takes, each with its status and optional detail'],
    ['tool-call', 'one tool invocation: status, input, output, approval actions'],
    ['terminal', 'an animated transcript for demos and agent runs'],
  ],
  provenance: [
    ['ai-badge', 'the “AI” marker, with an optional explanation and revert-to-AI'],
    ['ai-disclaimer', '“AI-generated content may be incorrect”'],
    ['sources', 'a numbered “Used N sources” list'],
    ['inline-citation', 'numbered citation markers that preview their source'],
    ['message-actions', 'copy, good / bad feedback, regenerate'],
    ['prompt-suggestions', 'starter prompts as pill buttons'],
  ],
}

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
        <p>
          From your project root, <code>npx cascivo mcp init</code> writes the config for Claude
          Code (<code>--client cursor</code> or <code>--client vscode</code> for those editors). Or
          add the server to any MCP-compatible agent&apos;s config by hand:
        </p>
        <CodeBlock code={MCP_SETUP} lang="bash" />
        <p>Key MCP tools (24 in total — browse, select, scaffold, validate, theme, install):</p>
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
            <code>render_view_as_markdown</code> — render a view with the real components and read
            back what it says (needs <code>@cascivo/render</code> in the project)
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
          Install the cascivo skills in one command — <code>npx skills add cascivo/cascivo</code> —
          or copy them from the{' '}
          <a href="https://github.com/cascivo/cascivo/tree/main/skills">skills/ directory</a>:
        </p>
        <ul>
          <li>
            <code>cascivo-add</code> — add components, resolve fuzzy names, verify imports compile
          </li>
          <li>
            <code>cascivo-design-page</code> — natural language → scaffold_view → validate →
            generate
          </li>
          <li>
            <code>cascivo-create-theme</code> — brand colors → semantic token overrides → WCAG AA
            check
          </li>
          <li>
            <code>cascivo-extend</code> — scaffold a new component following cascivo authoring rules
          </li>
          <li>
            <code>cascivo-migrate-from-shadcn</code> — move a shadcn/ui app over one file at a time,
            each file checked with <code>cascivo audit --ai</code>
          </li>
          <li>
            <code>cascivo-share-preview</code> — put an app on a public URL with no Cloudflare
            account: a temporary account with a claim link, or Cloudflare Drop for static builds
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>AI components</h2>
        <p>
          The UI for AI features ships in the registry, like every other component, so each one has
          a manifest, a docs page and <code>cascivo add</code>. They share one accessibility
          contract: phase changes are announced once (through <code>AiStatus</code> or{' '}
          <code>announce()</code> from <code>@cascivo/core</code>) and streamed tokens never are.
          Every loop stops under reduced motion. One AI hue, <code>--cascivo-color-ai</code>, runs
          through all twelve themes.
        </p>

        <h3>Work in progress</h3>
        <AiStatus status="generating" onStop={() => {}} />
        <Reasoning streaming>Checking the refund window and the cancellation terms…</Reasoning>
        <ul>
          {AI_COMPONENTS.progress.map(([name, what]) => (
            <li key={name}>
              <a href={`/docs/components/${name}`}>
                <code>{name}</code>
              </a>{' '}
              — {what}
            </li>
          ))}
        </ul>

        <h3>Agent steps</h3>
        <ChainOfThought
          items={[
            { id: 'search', title: 'Searched the help center', status: 'complete' },
            { id: 'read', title: 'Reading the refund policy', status: 'active' },
            { id: 'write', title: 'Write the answer', status: 'pending' },
          ]}
        />
        <ul>
          {AI_COMPONENTS.agent.map(([name, what]) => (
            <li key={name}>
              <a href={`/docs/components/${name}`}>
                <code>{name}</code>
              </a>{' '}
              — {what}
            </li>
          ))}
        </ul>

        <h3>Provenance and the finished reply</h3>
        <ul>
          {AI_COMPONENTS.provenance.map(([name, what]) => (
            <li key={name}>
              <a href={`/docs/components/${name}`}>
                <code>{name}</code>
              </a>{' '}
              — {what}
            </li>
          ))}
        </ul>
        <p>
          <code>Card</code>, <code>Modal</code>, <code>Input</code> and <code>Textarea</code> take{' '}
          <code>ai</code> for an AI-tinted edge (<code>Card</code> and <code>Modal</code> also take{' '}
          <code>ai="generating"</code>), and <code>Skeleton</code> takes <code>ai</code> for an
          AI-tinted placeholder. The tint is visual only, so pair it with an <code>AiBadge</code>.
        </p>

        <h3>
          <code>@cascivo/ai</code>
        </h3>
        <p>
          <code>AiChat</code> is a complete, controlled chat surface built from the components
          above. It shows a typing indicator before the first token, an optional Stop button, and
          announces the finished reply once. <code>StreamingText</code> and <code>Terminal</code>{' '}
          are re-exported from the registry. <code>AiLabel</code> is deprecated in favour of{' '}
          <code>AiStatus</code> and is removed in 2.0.
        </p>
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

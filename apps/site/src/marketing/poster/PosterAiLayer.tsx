import { CodeSnippet } from '@cascivo/components/code-snippet'
import { StructuredList } from '@cascivo/components/structured-list'
import { Tag } from '@cascivo/components/tag'

const MCP_CONFIG = `{
  "mcpServers": {
    "cascivo": { "command": "npx",
      "args": ["-y", "@cascivo/mcp"] }
  }
}`

const AI_TAGS = [
  'llms.txt',
  'context.json',
  'tokens.catalog.json',
  'cascivo audit --ai',
  '@cascivo/mcp',
  'claude code skills',
]

const PRIMITIVES = [
  {
    id: 'reactivity',
    title: 'Reactivity & state',
    api: 'useSignal · useComputed · useScope',
    line: 'The signal is the state — not useState or useContext. Scopes dispose on unmount, so state never leaks across routes.',
  },
  {
    id: 'forms',
    title: 'Forms',
    api: 'createForm · useForm · field()',
    line: 'A signal-backed store with Standard Schema validation and keystroke validation at zero re-renders. No separate form library.',
  },
  {
    id: 'theming',
    title: 'Theming',
    api: 'ThemeProvider · themePreloadScript',
    line: 'Persist a theme and pre-paint on SSR with no flash of the wrong theme — not a useEffect toggling a class.',
  },
]

export function PosterAiLayer() {
  return (
    <section className="pg-section pg-cols" id="ai" aria-label="The AI and primitive layers">
      <div className="pg-pad pg-invert">
        <p className="pg-eyebrow pg-eyebrow--quiet">08 / ai layer</p>
        <h2 className="pg-display pg-display--section pg-ai-head">
          Your agent
          <br />
          reads the specs
        </h2>
        <p className="pg-body pg-ai-body">
          Every component ships a machine-readable manifest, so agents select from closed sets
          instead of guessing prop names — and <code>cascivo audit --ai</code> flags hard-coded
          values and invented props in what they wrote.
        </p>
        <CodeSnippet
          className="pg-ai-code"
          variant="multi"
          language="ts"
          code={MCP_CONFIG}
          title="MCP server config"
        />
        <p className="pg-ai-tags">
          {AI_TAGS.map((tag) => (
            <Tag key={tag} className="pg-ai-tag">
              {tag}
            </Tag>
          ))}
        </p>
        <a className="pg-link" href="/ai">
          See the AI layer →
        </a>
      </div>

      <div className="pg-pad">
        <p className="pg-eyebrow">09 / primitives</p>
        <h2 className="pg-display pg-display--section pg-ai-head">
          State is a
          <br />
          primitive
        </h2>
        <p className="pg-body pg-ai-body">
          Under the components sits a signal-native layer, so you never reach for a React state
          hook, a form library, or a theme hack.
        </p>
        <StructuredList
          className="pg-primitives"
          ariaLabel="Signal-native primitives"
          items={PRIMITIVES.map((p) => ({
            id: p.id,
            cells: [
              <span key="t" className="pg-display pg-display--sub">
                {p.title}
              </span>,
              <span key="a" className="pg-primitive-api">
                {p.api}
              </span>,
              <span key="l" className="pg-primitive-line">
                {p.line}
              </span>,
            ],
          }))}
        />
      </div>
    </section>
  )
}

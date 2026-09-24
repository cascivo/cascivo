import { CodeSnippet } from '@cascivo/components/code-snippet'
import { Tag } from '@cascivo/components/tag'

const MCP_CONFIG = `{
  "mcpServers": {
    "cascivo": { "command": "npx",
      "args": ["-y", "@cascivo/mcp"] }
  }
}`

// A realistic first draft from an agent trained mostly on other libraries: a guessed prop
// (`tone`), a Tooltip without its required `content`, and a raw colour in unlayered CSS.
const AGENT_WROTE = `<Card className="deploy-card">
  <Badge tone="success">Ready</Badge>
  <Tooltip>Redeploy the latest commit</Tooltip>
  <Button variant="primary">Redeploy</Button>
</Card>

.deploy-card {
  background: oklch(0.623 0.214 250);
}`

// Output of `cascivo audit --ai` over the draft above, verbatim except that the `src/`
// prefix is trimmed and long hints wrap to fit a phone. Re-run the audit after changing
// the draft; this block must stay real output.
const AUDIT_OUTPUT = `DeployCard.tsx:7   error  unknown-prop     <Badge tone>
DeployCard.tsx:8   error  missing-prop     <Tooltip> requires "content"
DeployCard.tsx:8   warn   raw-string       "Redeploy the latest commit"
                                           → use labels prop / i18n
deploy-card.css:2  info   hardcoded-value  oklch(0.623 0.214 250)
                                           → --cascivo-blue-500
                                             | --cascivo-color-focus-ring
deploy-card.css:1  warn   unlayered-css    .deploy-card { … }
                                           → wrap in @layer
---
2 errors, 2 warnings, 1 info`

const AGENT_FIXED = `<Card className="deploy-card">
  <Badge variant="success">Ready</Badge>
  <Tooltip content={hint}>
    <Button variant="primary">Redeploy</Button>
  </Tooltip>
</Card>

@layer cascivo.override {
  .deploy-card {
    background: var(--cascivo-color-accent);
  }
}`

const AI_TAGS = [
  'llms.txt',
  'per-component manifests',
  'tokens.catalog.json',
  'cascivo audit --ai',
  '@cascivo/mcp',
  'claude code skills',
]

export function PosterAiLayer() {
  return (
    <section className="pg-section pg-cols" id="ai" aria-label="The AI loop">
      <div className="pg-pad pg-invert">
        <p className="pg-eyebrow pg-eyebrow--quiet">06 / the ai loop</p>
        <h2 className="pg-display pg-display--section pg-ai-head">
          Your agent&apos;s code,
          <br />
          checked
        </h2>
        <p className="pg-body pg-ai-body">
          Most design systems now give agents docs. cascivo also checks what the agent wrote:{' '}
          <code>cascivo audit --ai</code> knows every real prop, required prop and token, and says
          what to use instead.
        </p>
        <p className="pg-ai-caption pg-mono">what the agent wrote</p>
        <pre className="pg-pre pg-pre--tight">
          <code>{AGENT_WROTE}</code>
        </pre>
        <p className="pg-ai-caption pg-mono">$ cascivo audit --ai src</p>
        <pre className="pg-pre pg-pre--tight">
          <code>{AUDIT_OUTPUT}</code>
        </pre>
      </div>

      <div className="pg-pad">
        <p className="pg-eyebrow">after one round</p>
        <h2 className="pg-display pg-display--section pg-ai-head">
          Fixed from
          <br />
          the output
        </h2>
        <p className="pg-ai-caption pg-mono">what the agent wrote next</p>
        <pre className="pg-pre pg-pre--tight">
          <code>{AGENT_FIXED}</code>
        </pre>
        <p className="pg-ai-caption pg-mono">$ cascivo audit --ai src → no findings</p>
        <p className="pg-body pg-ai-body">
          The agent gets the same closed sets up front: an MCP server with tools to select, scaffold
          and validate, a manifest per component, and a token catalog.
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
    </section>
  )
}

import { AiBadge } from '@cascivo/components/ai-badge'
import { AiDisclaimer } from '@cascivo/components/ai-disclaimer'
import { AiStatus } from '@cascivo/components/ai-status'
import { Card, CardContent } from '@cascivo/components/card'
import { ChainOfThought } from '@cascivo/components/chain-of-thought'
import { ContextMeter } from '@cascivo/components/context-meter'
import { InlineCitation } from '@cascivo/components/inline-citation'
import { MessageActions } from '@cascivo/components/message-actions'
import { PromptSuggestions } from '@cascivo/components/prompt-suggestions'
import { Reasoning } from '@cascivo/components/reasoning'
import { Skeleton } from '@cascivo/components/skeleton'
import { Sources } from '@cascivo/components/sources'
import { ToolCall } from '@cascivo/components/tool-call'

const REFUNDS = { title: 'Refund policy', url: 'https://example.com/refunds' }
const TERMS = { title: 'Terms of service', url: 'https://example.com/terms' }

/** Every AI component, in the order a reply uses them. Each links to its docs page. */
const COMPONENTS = [
  'ai-status',
  'shimmer-text',
  'typing-indicator',
  'reasoning',
  'chain-of-thought',
  'tool-call',
  'streaming-text',
  'inline-citation',
  'sources',
  'ai-badge',
  'ai-disclaimer',
  'message-actions',
  'prompt-suggestions',
  'context-meter',
  'skeleton',
  'terminal',
]

export function AiComponentsShowcase() {
  return (
    <section className="agents ai-showcase" id="ai-components" data-reveal="">
      <h2>AI components, for the moment the model is working</h2>
      <p className="agents-sub">
        Thinking, reasoning, tool calls, sources, feedback. Each one is a registry component with a
        manifest. Each announces phase changes once and never streamed tokens, and each loop stops
        under reduced motion. One AI hue runs through all twelve themes.
      </p>

      <div className="ai-showcase-grid">
        <Card ai="generating">
          <CardContent>
            <p className="ai-showcase-caption">While it works</p>
            <div className="ai-showcase-stack">
              <AiStatus status="thinking" label="Searching 2 documents…" onStop={() => {}} />
              <Reasoning streaming>
                The user asks about annual plans, so I need the refund window and the cancellation
                terms…
              </Reasoning>
              <ChainOfThought
                items={[
                  { id: 'search', title: 'Searched the help center', status: 'complete' },
                  { id: 'read', title: 'Reading the refund policy', status: 'active' },
                  { id: 'write', title: 'Write the answer', status: 'pending' },
                ]}
              />
              <ToolCall
                name="search_docs"
                status="running"
                input={'{ "query": "annual plan refund" }'}
              />
              <Skeleton ai lines={3} />
              <ContextMeter value={41200} max={200000} />
            </div>
          </CardContent>
        </Card>

        <Card ai>
          <CardContent>
            <p className="ai-showcase-caption">
              When it’s done <AiBadge>Answered by an AI model from 2 help-center pages.</AiBadge>
            </p>
            <div className="ai-showcase-stack">
              <Reasoning duration={4}>
                The user asks about annual plans, so I checked the refund window and the
                cancellation terms.
              </Reasoning>
              <p className="ai-showcase-answer">
                Annual plans can be refunded within 30 days of purchase
                <InlineCitation index={1} source={REFUNDS} />, and you can cancel at any time to
                stop the next renewal
                <InlineCitation index={2} source={TERMS} />.
              </p>
              <Sources items={[REFUNDS, TERMS]} />
              <MessageActions
                copyValue="Annual plans can be refunded within 30 days of purchase."
                onFeedbackChange={() => {}}
                onRegenerate={() => {}}
              />
              <PromptSuggestions
                items={['How do I cancel?', 'Can I switch to monthly?']}
                onSelect={() => {}}
              />
              <AiDisclaimer />
            </div>
          </CardContent>
        </Card>
      </div>

      <ul className="ai-showcase-links" aria-label="AI component docs">
        {COMPONENTS.map((name) => (
          <li key={name}>
            <a href={`/docs/components/${name}`}>{name}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

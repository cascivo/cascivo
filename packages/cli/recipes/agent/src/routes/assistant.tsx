import type { FormEvent } from 'react'
import { CascivoView } from '@cascivo/render'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Text,
  Textarea,
  useSignalState,
} from '@cascivo/react'
import { useAgentChat } from '@cloudflare/ai-chat/react'
import { useAgent } from 'agents/react'
import type { UIMessage } from 'ai'
import { AGENT, checkView } from '../assistant'
import styles from '../assistant.module.css'

const STORAGE_KEY = 'assistant-conversation'

/**
 * The conversation this browser continues: its Durable Object's name. Kept in localStorage
 * so a reload picks the conversation back up; a new one each visit where storage is blocked.
 */
function conversationName(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
    const created = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

const conversation = conversationName()

function MessagePart({ part }: { part: UIMessage['parts'][number] }) {
  if (part.type === 'text') return <Text>{part.text}</Text>
  if (part.type !== 'tool-show_view') return null
  if (part.state !== 'output-available') {
    return (
      <Badge variant="neutral">
        {part.state === 'output-error' ? 'View failed' : 'Building a view…'}
      </Badge>
    )
  }
  // The stored message came over the network: check it again rather than trusting it.
  const output: unknown = part.output
  const shown =
    typeof output === 'object' && output !== null && 'title' in output && 'view' in output
      ? checkView(output.title, output.view)
      : null
  if (!shown || 'errors' in shown) {
    // The model saw these errors as the tool result and tries again in the next step.
    return (
      <Badge variant="warning">Rejected a view with {shown?.errors.length ?? 1} problems</Badge>
    )
  }
  return (
    <Card>
      <CardContent>
        <Flex gap={3}>
          <Heading level={3}>{shown.title}</Heading>
          <CascivoView config={shown.view} onInvalid="render" />
        </Flex>
      </CardContent>
    </Card>
  )
}

export default function Assistant() {
  const agent = useAgent({ agent: AGENT, name: conversation })
  const { messages, sendMessage, status, clearHistory } = useAgentChat({ agent })
  const [draft, setDraft] = useSignalState('')
  const busy = status === 'submitted' || status === 'streaming'

  const send = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.value.trim()
    if (!text || busy) return
    void sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
    setDraft('')
  }

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Assistant</Heading>
          <Text muted>
            Ask for an overview, a status page or a list: the agent answers with real components,
            checked against their manifests before they reach you.
          </Text>
        </Flex>
        <Button variant="secondary" onClick={clearHistory} disabled={messages.length === 0}>
          New conversation
        </Button>
      </Flex>
      <ol className={styles['messages']} aria-live="polite">
        {messages.map((message) => (
          <li key={message.id} className={styles[message.role === 'user' ? 'user' : 'assistant']}>
            <Flex gap={2}>
              {message.parts.map((part, index) => (
                <MessagePart key={index} part={part} />
              ))}
            </Flex>
          </li>
        ))}
      </ol>
      <form className={styles['composer']} onSubmit={send}>
        <Textarea
          aria-label="Message"
          rows={2}
          value={draft.value}
          placeholder="Show me the team's status"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) send(event)
          }}
        />
        <Button type="submit" loading={busy}>
          Send
        </Button>
      </form>
    </Flex>
  )
}

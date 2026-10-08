import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Input,
  ProgressBar,
  Text,
  useSignals,
} from '@cascivo/react'
import type { FormEvent } from 'react'
import {
  connected,
  error,
  history,
  interim,
  level,
  muted,
  status,
  transcript,
  voice,
} from '../voice'
import type { Line } from '../voice'

const STATUS_LABEL = {
  idle: 'Not in a call',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
} as const

function sendTyped(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault()
  const form = event.currentTarget
  const text = new FormData(form).get('message')
  if (typeof text !== 'string' || text.trim() === '') return
  voice().sendText(text.trim())
  form.reset()
}

export default function VoicePage() {
  useSignals()
  const client = voice()
  const inCall = status.value !== 'idle'
  const lines: Line[] = [
    ...history.value,
    ...transcript.value.map((m) => ({ role: m.role, text: m.text })),
  ]

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Voice</Heading>
        <Text muted>
          Talk to an assistant on Workers AI: speech to text, a model, and text to speech, all in a
          Durable Object. Speak over a reply to interrupt it.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={3}>
            <Flex direction="horizontal" align="center" wrap gap={3}>
              {inCall ? (
                <Button variant="destructive" onClick={() => client.endCall()}>
                  End call
                </Button>
              ) : (
                <Button disabled={!connected.value} onClick={() => void client.startCall()}>
                  Start call
                </Button>
              )}
              <Button variant="secondary" disabled={!inCall} onClick={() => client.toggleMute()}>
                {muted.value ? 'Unmute' : 'Mute'}
              </Button>
              <Badge variant={status.value === 'idle' ? 'secondary' : 'success'}>
                {connected.value ? STATUS_LABEL[status.value] : 'Connecting'}
              </Badge>
            </Flex>
            {inCall ? (
              <ProgressBar label="Microphone" value={Math.round(level.value * 100)} max={100} />
            ) : null}
            {error.value ? <Text muted>{error.value}</Text> : null}
          </Flex>
        </CardContent>
      </Card>
      <Flex gap={2} role="log" aria-live="polite" aria-label="Conversation">
        {lines.length === 0 && !interim.value ? (
          <EmptyState
            title="Start a call and say something"
            description="Or type below: a typed message gets a reply too, spoken if you are in a call."
          />
        ) : null}
        {lines.map((message, index) => (
          // The conversation only grows, so a line's position is a stable key.
          <Flex key={index} gap={1}>
            <Text size="sm" muted>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </Text>
            <Text>{message.text}</Text>
          </Flex>
        ))}
        {interim.value ? <Text muted>{interim.value}…</Text> : null}
      </Flex>
      <form onSubmit={sendTyped}>
        <Flex direction="horizontal" align="end" gap={2}>
          <Input name="message" label="Or type" placeholder="Ask something" autoComplete="off" />
          <Button type="submit" variant="secondary" disabled={!connected.value}>
            Send
          </Button>
        </Flex>
      </form>
    </Flex>
  )
}

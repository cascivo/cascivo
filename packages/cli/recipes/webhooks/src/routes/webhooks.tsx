import { createClient } from '@cascivo/app/api'
import { connectRoom } from '@cascivo/app/sync'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Kbd,
  Text,
  computed,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { parseDelivery } from '../webhooks'
import type { Delivery } from '../webhooks'

const client = createClient(api)
const stored = signal<Delivery[]>([])
const failure = signal<string | null>(null)

// The Worker writes each new delivery here; the browser may only watch.
const room = connectRoom('/api/webhooks/live')
const latest = room.signal<Delivery | null>('latest', null, (raw) =>
  raw === null ? null : parseDelivery(raw),
)
/** Stored deliveries, with the newest pushed one on top when it is not in the list yet. */
const deliveries = computed(() => {
  const pushed = latest.value
  return pushed && !stored.value.some((d) => d.id === pushed.id)
    ? [pushed, ...stored.value]
    : stored.value
})

async function load(): Promise<void> {
  stored.value = await client.listDeliveries().catch(() => stored.peek())
}
void load()

async function sendTest(): Promise<void> {
  failure.value = null
  try {
    await client.sendTestDelivery()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'The test delivery failed'
  }
}

export default function Webhooks() {
  useSignals()
  const url = `${location.origin}/api/webhooks/github`

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Webhooks</Heading>
        <Text muted>
          GitHub deliveries, checked against their signature, stored once each, and shown here as
          they arrive.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={2}>
            <Text>
              In the repository's settings, add a webhook with the payload URL <Kbd>{url}</Kbd>,
              content type application/json, and the secret you set as WEBHOOK_SECRET.
            </Text>
            <Flex direction="horizontal">
              <Button variant="secondary" onClick={() => void sendTest()}>
                Send a test delivery
              </Button>
            </Flex>
            {failure.value ? (
              <Alert variant="destructive" title="Not delivered">
                {failure.value}
              </Alert>
            ) : null}
          </Flex>
        </CardContent>
      </Card>
      {deliveries.value.length === 0 ? (
        <EmptyState
          title="No deliveries yet"
          description="Send a test delivery, or push to the repository."
        />
      ) : (
        <Flex gap={2} role="log" aria-label="Deliveries">
          {deliveries.value.map((delivery) => (
            <Flex key={delivery.id} direction="horizontal" align="center" gap={2} wrap>
              <Badge variant="secondary">{delivery.event}</Badge>
              <Text>{delivery.summary}</Text>
              <Text size="sm" muted>
                {new Date(delivery.receivedAt).toLocaleTimeString()}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}

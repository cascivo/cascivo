import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Flex,
  Heading,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import type { DigestRun } from '../digest'

const client = createClient(api)
const runs = signal<DigestRun[]>([])
const sending = signal(false)
const failure = signal<string | null>(null)

async function load(): Promise<void> {
  runs.value = await client.digestRuns().catch(() => runs.peek())
}
void load()

async function sendNow(): Promise<void> {
  sending.value = true
  failure.value = null
  try {
    await client.runDigest()
    await load()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not send'
  } finally {
    sending.value = false
  }
}

const VARIANT = { sent: 'success', skipped: 'warning', failed: 'destructive' } as const

export default function Digest() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Weekly digest</Heading>
        <Text muted>
          Every Monday at 08:00 UTC, the Worker renders /report to a PDF and emails it. Each run is
          listed here, including the ones that could not send.
        </Text>
      </Flex>
      <Flex direction="horizontal">
        <Button loading={sending.value} onClick={() => void sendNow()}>
          Send now
        </Button>
      </Flex>
      {failure.value ? (
        <Alert variant="destructive" title="Not sent">
          {failure.value}
        </Alert>
      ) : null}
      {runs.value.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="The first runs on Monday, or press Send now."
        />
      ) : (
        <Flex gap={2}>
          {runs.value.map((run) => (
            <Flex key={run.id} direction="horizontal" align="center" gap={2} wrap>
              <Badge variant={VARIANT[run.status]}>{run.status}</Badge>
              <Text>{run.detail}</Text>
              <Text size="sm" muted>
                {new Date(run.startedAt).toLocaleString()} · {run.trigger}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}

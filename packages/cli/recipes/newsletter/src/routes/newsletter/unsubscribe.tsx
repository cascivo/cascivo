import { Alert, Button, Flex, Heading, Text, signal, useSignals } from '@cascivo/react'
import { router } from '../../router'

const done = signal(false)
const failure = signal<string | null>(null)
const busy = signal(false)

/**
 * The footer link of every issue. Like the confirmation, it acts on a button press, never on
 * opening the page. Mail clients that support one-click unsubscribe skip this page and POST
 * to the same endpoint from the List-Unsubscribe header.
 */
async function unsubscribe(): Promise<void> {
  const token = new URLSearchParams(router.search.value).get('token') ?? ''
  busy.value = true
  failure.value = null
  try {
    const response = await fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    })
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
    done.value = true
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not unsubscribe'
  } finally {
    busy.value = false
  }
}

export default function Unsubscribe() {
  useSignals()
  return (
    <Flex gap={4}>
      <Heading level={1}>Unsubscribe</Heading>
      {done.value ? (
        <Alert variant="success" title="You are unsubscribed">
          You will get no more issues. Sign up again any time.
        </Alert>
      ) : (
        <Flex gap={2}>
          <Text muted>Stop getting the newsletter at this address.</Text>
          <Flex direction="horizontal">
            <Button variant="destructive" loading={busy.value} onClick={() => void unsubscribe()}>
              Unsubscribe
            </Button>
          </Flex>
        </Flex>
      )}
      {failure.value ? (
        <Alert variant="destructive" title="Not unsubscribed">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}

import { createClient } from '@cascivo/app/api'
import { Alert, Button, Flex, Heading, Text, signal, useSignals } from '@cascivo/react'
import { api } from '../../api'
import { router } from '../../router'

const client = createClient(api)
const confirmed = signal<string | null>(null)
const failure = signal<string | null>(null)
const busy = signal(false)

/**
 * The page a confirmation link opens. It confirms only when you press the button: mail
 * scanners open every link in a message, and would otherwise subscribe whoever was typed in.
 */
async function confirm(): Promise<void> {
  const token = new URLSearchParams(router.search.value).get('token')
  if (!token) {
    failure.value = 'This link has no token. Sign up again.'
    return
  }
  busy.value = true
  failure.value = null
  try {
    confirmed.value = (await client.confirmSubscription({ body: { token } })).email
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not confirm'
  } finally {
    busy.value = false
  }
}

export default function ConfirmSubscription() {
  useSignals()
  return (
    <Flex gap={4}>
      <Heading level={1}>Confirm your subscription</Heading>
      {confirmed.value ? (
        <Alert variant="success" title="You are on the list">
          The next issue goes to {confirmed.value}.
        </Alert>
      ) : (
        <Flex gap={2}>
          <Text muted>One click and you get the newsletter.</Text>
          <Flex direction="horizontal">
            <Button loading={busy.value} onClick={() => void confirm()}>
              Yes, subscribe me
            </Button>
          </Flex>
        </Flex>
      )}
      {failure.value ? (
        <Alert variant="destructive" title="Not confirmed">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}

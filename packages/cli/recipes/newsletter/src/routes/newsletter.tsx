import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Input,
  Link,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import type { FormEvent } from 'react'
import { api } from '../api'

const client = createClient(api)
const sentTo = signal<string | null>(null)
/** Set only in `vite dev` without SES: the confirmation link, to open instead of an email. */
const devLink = signal<string | null>(null)
const failure = signal<string | null>(null)
const sending = signal(false)

async function signUp(event: FormEvent<HTMLFormElement>): Promise<void> {
  event.preventDefault()
  const email = new FormData(event.currentTarget).get('email')
  if (typeof email !== 'string') return
  failure.value = null
  sending.value = true
  try {
    const { devLink: link } = await client.subscribe({ body: { email } })
    sentTo.value = email
    devLink.value = link
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not sign you up'
  } finally {
    sending.value = false
  }
}

export default function Newsletter() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Newsletter</Heading>
        <Text muted>
          An email now and then. We send a link first: you are on the list only once you open it,
          and every issue has a one-click unsubscribe.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <form onSubmit={(event) => void signUp(event)}>
            <Flex direction="horizontal" align="end" gap={2} wrap>
              <Input name="email" type="email" label="Email" autoComplete="email" required />
              <Button type="submit" loading={sending.value}>
                Subscribe
              </Button>
            </Flex>
          </form>
        </CardContent>
      </Card>
      {sentTo.value ? (
        <Alert variant="success" title="Check your inbox">
          If {sentTo.value} is not on the list yet, a confirmation link is on its way.
        </Alert>
      ) : null}
      {devLink.value ? (
        <Alert variant="info" title="vite dev sends no email without SES">
          <Link href={devLink.value}>Open the confirmation link</Link>
        </Alert>
      ) : null}
      {failure.value ? (
        <Alert variant="destructive" title="Not signed up">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}

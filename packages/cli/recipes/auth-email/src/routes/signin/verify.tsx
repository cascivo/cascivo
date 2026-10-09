import { Alert, Button, Flex, Heading, Text, signal, useSignals } from '@cascivo/react'
import { auth } from '../../auth'
import { router } from '../../router'

const failure = signal<string | null>(null)
const busy = signal(false)

/**
 * The page a sign-in link opens. It signs in only when you press the button: mail scanners
 * open every link in a message, and a link that signed in on open would be used up by them.
 */
async function signIn(): Promise<void> {
  const token = new URLSearchParams(router.search.value).get('token')
  if (!token) {
    failure.value = 'This link has no token. Request a new one.'
    return
  }
  busy.value = true
  failure.value = null
  try {
    await auth.verify(token)
    router.navigate('/account', { replace: true })
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not sign in'
  } finally {
    busy.value = false
  }
}

export default function VerifySignIn() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Sign in</Heading>
        <Text muted>Finish signing in on this device.</Text>
      </Flex>
      {failure.value ? (
        <Alert variant="destructive" title="Not signed in">
          {failure.value}
        </Alert>
      ) : null}
      <Flex direction="horizontal">
        <Button loading={busy.value} onClick={() => void signIn()}>
          Sign in
        </Button>
      </Flex>
    </Flex>
  )
}

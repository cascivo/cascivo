// Auth flow canary (cascivo): a sign-in page, a sign-up page and a dashboard after login, as
// state-driven pages switched by buttons (no router, the starter's pattern).
import {
  Button,
  Card,
  Field,
  Flex,
  Heading,
  Input,
  PasswordInput,
  Text,
  useSignalState,
} from '@cascivo/react'
import '@cascivo/themes/light.css'
import type { FormEvent } from 'react'

type Page = 'sign-in' | 'sign-up' | 'dashboard'

function fieldValue(event: FormEvent<HTMLFormElement>, name: string): string {
  const value = new FormData(event.currentTarget).get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export default function App() {
  const [page, setPage] = useSignalState<Page>('sign-in')
  const [user, setUser] = useSignalState('')
  const [error, setError] = useSignalState('')

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = fieldValue(event, 'email')
    if (email === '' || fieldValue(event, 'password') === '') {
      setError('Enter your email and password.')
      return
    }
    setError('')
    setUser(email)
    setPage('dashboard')
  }

  const signUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setUser(fieldValue(event, 'email'))
    setPage('dashboard')
  }

  return (
    <main>
      <Flex gap={6} align="center">
        {page.value === 'sign-in' && (
          <Card>
            <Flex gap={4}>
              <Heading level={1}>Sign in</Heading>
              <form noValidate onSubmit={signIn}>
                <Flex gap={4}>
                  <Input label="Email" name="email" type="email" autoComplete="email" />
                  <Field label="Password">
                    <PasswordInput name="password" autoComplete="current-password" />
                  </Field>
                  {error.value !== '' && <Text role="alert">{error.value}</Text>}
                  <Button type="submit">Sign in</Button>
                </Flex>
              </form>
              <Text>
                No account yet?{' '}
                <Button variant="ghost" onClick={() => setPage('sign-up')}>
                  Create an account
                </Button>
              </Text>
            </Flex>
          </Card>
        )}
        {page.value === 'sign-up' && (
          <Card>
            <Flex gap={4}>
              <Heading level={1}>Create your account</Heading>
              <form onSubmit={signUp}>
                <Flex gap={4}>
                  <Input label="Full name" name="name" required />
                  <Input label="Email" name="email" type="email" required />
                  <Field label="Password">
                    <PasswordInput name="password" autoComplete="new-password" required />
                  </Field>
                  <Button type="submit">Sign up</Button>
                </Flex>
              </form>
              <Text>
                Already registered?{' '}
                <Button variant="ghost" onClick={() => setPage('sign-in')}>
                  Sign in instead
                </Button>
              </Text>
            </Flex>
          </Card>
        )}
        {page.value === 'dashboard' && (
          <Flex gap={4}>
            <Heading level={1}>Dashboard</Heading>
            <Text>Welcome back, {user.value}.</Text>
            <Button variant="secondary" onClick={() => setPage('sign-in')}>
              Sign out
            </Button>
          </Flex>
        )}
      </Flex>
    </main>
  )
}

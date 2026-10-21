// Form validation canary (cascivo): a contact form validated on submit. Each error is the
// control's own `error` prop, so it renders beside the field and is wired to it with
// aria-describedby and aria-invalid.
import { Alert, Button, Flex, Heading, Input, Textarea, useSignalState } from '@cascivo/react'
import '@cascivo/themes/light.css'
import type { FormEvent } from 'react'

interface Errors {
  name?: string
  email?: string
  message?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(name: string, email: string, message: string): Errors {
  const errors: Errors = {}
  if (name === '') errors.name = 'Enter your name.'
  if (email === '') errors.email = 'Enter your email address.'
  else if (!EMAIL.test(email)) errors.email = 'Enter a valid email address, like you@example.com.'
  if (message === '') errors.message = 'Enter a message.'
  return errors
}

function text(data: FormData, key: string): string {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export default function App() {
  const [errors, setErrors] = useSignalState<Errors>({})
  const [sent, setSent] = useSignalState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = validate(text(data, 'name'), text(data, 'email'), text(data, 'message'))
    setErrors(next)
    setSent(Object.keys(next).length === 0)
  }

  return (
    <main>
      <Flex gap={6}>
        <Heading level={1}>Contact us</Heading>
        {sent.value && (
          <Alert variant="success" title="Message sent">
            Thanks for getting in touch. We will reply within two working days.
          </Alert>
        )}
        <form noValidate onSubmit={submit}>
          <Flex gap={4}>
            <Input label="Name" name="name" autoComplete="name" error={errors.value.name} />
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              hint="We only use it to reply."
              error={errors.value.email}
            />
            <Textarea label="Message" name="message" rows={5} error={errors.value.message} />
            <Button type="submit">Send message</Button>
          </Flex>
        </form>
      </Flex>
    </main>
  )
}

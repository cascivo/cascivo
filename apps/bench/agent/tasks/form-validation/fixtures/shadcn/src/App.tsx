// Form validation canary (shadcn): a contact form validated on submit. Each error is a paragraph
// in the field's own wrapper and the control gets aria-invalid, as in the shadcn docs; nothing
// sets aria-describedby, so the eval must also accept an error placed next to its field.
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type FieldName = 'name' | 'email' | 'message'
type Errors = Partial<Record<FieldName, string>>

function validate(values: Record<FieldName, string>): Errors {
  const errors: Errors = {}
  if (!values.name) errors.name = 'Name is required'
  if (!values.email) errors.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'That email does not look valid'
  if (!values.message) errors.message = 'Message is required'
  return errors
}

export function App() {
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  const change = (field: FieldName, value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    // A field the user is fixing stops shouting; submit checks it again.
    setErrors(({ [field]: _fixed, ...rest }) => rest)
    setSent(false)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    }
    const next = validate(trimmed)
    setErrors(next)
    if (Object.keys(next).length === 0) {
      setSent(true)
      setValues({ name: '', email: '', message: '' })
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Get in touch</h1>
      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={values.name}
            aria-invalid={errors.name ? true : undefined}
            onChange={(e) => change('name', e.target.value)}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            aria-invalid={errors.email ? true : undefined}
            onChange={(e) => change('email', e.target.value)}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            rows={5}
            value={values.message}
            aria-invalid={errors.message ? true : undefined}
            onChange={(e) => change('message', e.target.value)}
          />
          {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
        </div>
        <Button type="submit" className="self-start">
          Send
        </Button>
        {sent && (
          <p role="status" className="text-sm text-green-700">
            Thank you! Your message is on its way.
          </p>
        )}
      </form>
    </main>
  )
}

export default App

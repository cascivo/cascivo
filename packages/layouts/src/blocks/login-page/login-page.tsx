'use client'
import { Button, Form, Input, useForm } from '@cascade-ui/react'
import { AuthLayout } from '../../auth-layout/auth-layout'

interface LoginValues {
  email: string
  password: string
}

export interface LoginPageProps {
  onSubmit?: (values: LoginValues) => void
}

export function LoginPage({ onSubmit }: LoginPageProps) {
  const form = useForm<LoginValues>({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof LoginValues, string>> = {}
      if (!values.email) errors.email = 'Email is required.'
      if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.'
      return errors
    },
  })

  const emailField = form.field('email')
  const passwordField = form.field('password')

  return (
    <AuthLayout>
      <h1>Sign in</h1>
      <Form form={form} onValid={(v) => onSubmit?.(v)}>
        <Input
          label="Email"
          type="email"
          value={String(emailField.value)}
          onChange={(e) => emailField.onChange(e.target.value)}
          onBlur={emailField.onBlur}
          error={emailField.error}
        />
        <Input
          label="Password"
          type="password"
          value={String(passwordField.value)}
          onChange={(e) => passwordField.onChange(e.target.value)}
          onBlur={passwordField.onBlur}
          error={passwordField.error}
        />
        <Button type="submit">Sign in</Button>
      </Form>
    </AuthLayout>
  )
}

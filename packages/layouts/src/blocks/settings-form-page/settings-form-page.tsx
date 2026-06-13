'use client'
import { Button, Form, Input, Select, Toggle, useForm } from '@cascivo/react'
import { SettingsLayout } from '../../settings-layout/settings-layout'

interface SettingsValues extends Record<string, unknown> {
  displayName: string
  email: string
  language: string
  notifications: boolean
}

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
]

export interface SettingsFormPageProps {
  onSave?: (values: SettingsValues) => void
}

export function SettingsFormPage({ onSave }: SettingsFormPageProps) {
  const form = useForm<SettingsValues>({
    initialValues: { displayName: '', email: '', language: 'en', notifications: true },
    validate: (values) => {
      const errors: Partial<Record<keyof SettingsValues, string>> = {}
      if (!values.displayName) errors.displayName = 'Display name is required.'
      if (!values.email.includes('@')) errors.email = 'Enter a valid email address.'
      return errors
    },
  })

  const dnField = form.field('displayName')
  const emailField = form.field('email')
  const langField = form.field('language')
  const notifField = form.field('notifications')

  return (
    <SettingsLayout
      menu={
        <nav aria-label="Settings sections">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <a href="#profile">Profile</a>
            </li>
            <li>
              <a href="#notifications">Notifications</a>
            </li>
          </ul>
        </nav>
      }
    >
      <h1>Profile settings</h1>
      <Form form={form} onValid={(v) => onSave?.(v)}>
        <Input
          label="Display name"
          value={String(dnField.value)}
          onChange={(e) => dnField.onChange(e.target.value)}
          onBlur={dnField.onBlur}
          {...(dnField.error !== undefined ? { error: dnField.error } : {})}
        />
        <Input
          label="Email"
          type="email"
          value={String(emailField.value)}
          onChange={(e) => emailField.onChange(e.target.value)}
          onBlur={emailField.onBlur}
          {...(emailField.error !== undefined ? { error: emailField.error } : {})}
        />
        <Select
          label="Language"
          options={languageOptions}
          value={String(langField.value)}
          onChange={(e) => langField.onChange(e.target.value)}
          onBlur={langField.onBlur}
        />
        <Toggle
          label="Email notifications"
          checked={Boolean(notifField.value)}
          onChange={(checked) => notifField.onChange(checked)}
        />
        <Button type="submit">Save changes</Button>
      </Form>
    </SettingsLayout>
  )
}

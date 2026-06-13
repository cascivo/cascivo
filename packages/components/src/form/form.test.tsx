import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as v from 'valibot'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { Input } from '../input/input'
import { Form, createForm, useForm } from './form'

interface Values {
  email: string
  age: number
}

describe('createForm', () => {
  it('holds initial values', () => {
    const form = createForm<Values>({ initialValues: { email: '', age: 0 } })
    expect(form.values.value).toEqual({ email: '', age: 0 })
  })

  it('setValue updates one field and marks nothing touched', () => {
    const form = createForm<Values>({ initialValues: { email: '', age: 0 } })
    form.setValue('email', 'a@b.c')
    expect(form.values.value.email).toBe('a@b.c')
    expect(form.touched.value.email).toBeUndefined()
  })

  it('field() wires value/onChange/onBlur and blur marks touched', () => {
    const form = createForm<Values>({ initialValues: { email: '', age: 0 } })
    const field = form.field('email')
    field.onChange('x@y.z')
    field.onBlur()
    expect(form.values.value.email).toBe('x@y.z')
    expect(form.touched.value.email).toBe(true)
  })

  it('sync validation populates errors on submit and blocks onValid', async () => {
    const onValid = vi.fn()
    const form = createForm<Values>({
      initialValues: { email: '', age: 0 },
      validate: (v) => (v.email.includes('@') ? {} : { email: 'Invalid email' }),
    })
    await form.submit(onValid)
    expect(form.errors.value.email).toBe('Invalid email')
    expect(onValid).not.toHaveBeenCalled()
    form.setValue('email', 'a@b.c')
    await form.submit(onValid)
    expect(onValid).toHaveBeenCalledWith({ email: 'a@b.c', age: 0 })
  })

  it('async validation works', async () => {
    const form = createForm<Values>({
      initialValues: { email: 'taken@x.y', age: 1 },
      validate: async (v) => (v.email === 'taken@x.y' ? { email: 'Already taken' } : {}),
    })
    await form.submit(vi.fn())
    expect(form.errors.value.email).toBe('Already taken')
  })

  it('reset restores initial values and clears errors/touched', async () => {
    const form = createForm<Values>({
      initialValues: { email: '', age: 0 },
      validate: () => ({ email: 'nope' }),
    })
    form.setValue('email', 'x')
    await form.submit(vi.fn())
    form.reset()
    expect(form.values.value).toEqual({ email: '', age: 0 })
    expect(form.errors.value).toEqual({})
    expect(form.touched.value).toEqual({})
  })
})

describe('Standard Schema validation', () => {
  it('zod schema — reports field errors on invalid submit', async () => {
    const schema = z.object({
      email: z.string().email('Invalid email address'),
      age: z.number().min(18, 'Must be 18 or older'),
    })
    const onValid = vi.fn()
    const form = createForm<Values>({ initialValues: { email: '', age: 0 }, schema })
    await form.submit(onValid)
    expect(form.errors.value.email).toBe('Invalid email address')
    expect(form.errors.value.age).toBe('Must be 18 or older')
    expect(onValid).not.toHaveBeenCalled()
  })

  it('zod schema — calls onValid when all fields pass', async () => {
    const schema = z.object({
      email: z.string().email('Invalid email address'),
      age: z.number().min(18, 'Must be 18 or older'),
    })
    const onValid = vi.fn()
    const form = createForm<Values>({
      initialValues: { email: 'user@example.com', age: 21 },
      schema,
    })
    await form.submit(onValid)
    expect(form.errors.value).toEqual({})
    expect(onValid).toHaveBeenCalledWith({ email: 'user@example.com', age: 21 })
  })

  it('valibot schema — reports field errors on invalid submit', async () => {
    const schema = v.object({
      email: v.pipe(v.string(), v.email('Invalid email address')),
      age: v.pipe(v.number(), v.minValue(18, 'Must be 18 or older')),
    })
    const onValid = vi.fn()
    const form = createForm<Values>({ initialValues: { email: '', age: 0 }, schema })
    await form.submit(onValid)
    expect(form.errors.value.email).toBe('Invalid email address')
    expect(form.errors.value.age).toBe('Must be 18 or older')
    expect(onValid).not.toHaveBeenCalled()
  })

  it('valibot schema — calls onValid when all fields pass', async () => {
    const schema = v.object({
      email: v.pipe(v.string(), v.email('Invalid email address')),
      age: v.pipe(v.number(), v.minValue(18, 'Must be 18 or older')),
    })
    const onValid = vi.fn()
    const form = createForm<Values>({
      initialValues: { email: 'user@example.com', age: 21 },
      schema,
    })
    await form.submit(onValid)
    expect(form.errors.value).toEqual({})
    expect(onValid).toHaveBeenCalledWith({ email: 'user@example.com', age: 21 })
  })

  it('async schema — awaits async validate result', async () => {
    // Build a manual async Standard Schema to test Promise path
    const asyncSchema = {
      '~standard': {
        version: 1 as const,
        vendor: 'test',
        validate: async (value: unknown) => {
          await Promise.resolve()
          const v = value as { email: string }
          if (!v.email.includes('@')) {
            return { issues: [{ message: 'Async: invalid email', path: ['email'] }] }
          }
          return { value }
        },
      },
    }
    const onValid = vi.fn()
    const form = createForm<Values>({
      initialValues: { email: 'notanemail', age: 0 },
      schema: asyncSchema,
    })
    await form.submit(onValid)
    expect(form.errors.value.email).toBe('Async: invalid email')
    expect(onValid).not.toHaveBeenCalled()
    form.setValue('email', 'user@example.com')
    await form.submit(onValid)
    expect(onValid).toHaveBeenCalledWith({ email: 'user@example.com', age: 0 })
  })

  it('schema errors take precedence; validate() is skipped when schema fails', async () => {
    const schema = z.object({
      email: z.string().email('Schema error'),
      age: z.number(),
    })
    const validate = vi.fn().mockReturnValue({})
    const form = createForm<Values>({
      initialValues: { email: 'bad', age: 0 },
      schema,
      validate,
    })
    await form.submit(vi.fn())
    expect(form.errors.value.email).toBe('Schema error')
    expect(validate).not.toHaveBeenCalled()
  })

  it('validate() runs when schema passes', async () => {
    const schema = z.object({ email: z.string().email(), age: z.number() })
    const validate = vi.fn().mockReturnValue({ age: 'Too young' })
    const form = createForm<Values>({
      initialValues: { email: 'user@example.com', age: 0 },
      schema,
      validate,
    })
    await form.submit(vi.fn())
    expect(validate).toHaveBeenCalled()
    expect(form.errors.value.age).toBe('Too young')
  })
})

describe('<Form> + useForm with cascade inputs', () => {
  function Demo({ onValid }: { onValid: (v: { email: string }) => void }) {
    const form = useForm<{ email: string }>({
      initialValues: { email: '' },
      validate: (v) => (v.email.includes('@') ? {} : { email: 'Invalid email' }),
    })
    const email = form.field('email')
    return (
      <Form form={form} onValid={onValid}>
        <Input
          label="Email"
          value={email.value}
          onChange={(e) => email.onChange(e.currentTarget.value)}
          onBlur={email.onBlur}
          {...(email.error ? { error: email.error } : {})}
        />
        <button type="submit">Save</button>
      </Form>
    )
  }

  it('submits valid values and shows errors for invalid ones', async () => {
    const onValid = vi.fn()
    render(<Demo onValid={onValid} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Invalid email')).toBeInTheDocument()
    expect(onValid).not.toHaveBeenCalled()
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.c')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onValid).toHaveBeenCalledWith({ email: 'a@b.c' })
  })
})

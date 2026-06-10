'use client'
import { batch, cn, signal, useSignal, useSignals } from '@cascade-ui/core'
import type { Signal } from '@cascade-ui/core'
import type { FormHTMLAttributes, ReactNode } from 'react'
import styles from './form.module.css'

type Errors<T> = Partial<Record<keyof T, string>>
type Touched<T> = Partial<Record<keyof T, boolean>>

export interface FormConfig<T extends Record<string, unknown>> {
  initialValues: T
  /** Sync or async; return a (partial) field→message map. Empty map = valid. */
  validate?: (values: T) => Errors<T> | Promise<Errors<T>>
}

export interface FormStore<T extends Record<string, unknown>> {
  values: Signal<T>
  errors: Signal<Errors<T>>
  touched: Signal<Touched<T>>
  submitting: Signal<boolean>
  field<K extends keyof T>(
    name: K,
  ): {
    value: T[K]
    onChange: (value: T[K]) => void
    onBlur: () => void
    error: string | undefined
  }
  setValue<K extends keyof T>(name: K, value: T[K]): void
  submit(onValid: (values: T) => void | Promise<void>): Promise<void>
  reset(): void
}

export function createForm<T extends Record<string, unknown>>(config: FormConfig<T>): FormStore<T> {
  const values = signal<T>({ ...config.initialValues })
  const errors = signal<Errors<T>>({})
  const touched = signal<Touched<T>>({})
  const submitting = signal(false)

  const setValue = <K extends keyof T>(name: K, value: T[K]) => {
    values.value = { ...values.value, [name]: value }
  }

  return {
    values,
    errors,
    touched,
    submitting,
    setValue,
    field(name) {
      return {
        get value() {
          return values.value[name]
        },
        onChange: (value) => setValue(name, value),
        onBlur: () => {
          touched.value = { ...touched.value, [name]: true }
        },
        get error() {
          return errors.value[name]
        },
      }
    },
    async submit(onValid) {
      submitting.value = true
      try {
        const result = (await config.validate?.(values.value)) ?? {}
        const allTouched = Object.fromEntries(
          Object.keys(config.initialValues).map((k) => [k, true]),
        ) as Touched<T>
        batch(() => {
          errors.value = result
          touched.value = allTouched
        })
        if (Object.keys(result).length === 0) await onValid(values.value)
      } finally {
        submitting.value = false
      }
    },
    reset() {
      batch(() => {
        values.value = { ...config.initialValues }
        errors.value = {}
        touched.value = {}
      })
    },
  }
}

/** Stable per-mount form store. Config is captured on first render. */
export function useForm<T extends Record<string, unknown>>(config: FormConfig<T>): FormStore<T> {
  useSignals()
  const store = useSignal<FormStore<T> | null>(null)
  if (store.peek() === null) store.value = createForm(config)
  return store.peek() as FormStore<T>
}

export interface FormProps<T extends Record<string, unknown>> extends Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
> {
  form: FormStore<T>
  onValid: (values: T) => void | Promise<void>
  children: ReactNode
}

export function Form<T extends Record<string, unknown>>({
  form,
  onValid,
  children,
  className,
  ...props
}: FormProps<T>) {
  return (
    <form
      noValidate
      className={cn(styles['form'], className)}
      onSubmit={(e) => {
        e.preventDefault()
        void form.submit(onValid)
      }}
      {...props}
    >
      {children}
    </form>
  )
}

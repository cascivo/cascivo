import { classes as c } from '@cascivo/css'
import { type JSX, Show, splitProps } from 'solid-js'

// Typed Solid wrappers over the `cv-*` contract: markup and `data-*` values match
// `@cascivo/css/contract.json`, so they style and pass the same gates as the server markup.

type Html<T extends keyof JSX.IntrinsicElements> = Omit<JSX.IntrinsicElements[T], 'children'>

export interface ButtonProps extends Html<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children?: JSX.Element
}

export function Button(props: ButtonProps): JSX.Element {
  const [l, rest] = splitProps(props, ['variant', 'size', 'loading', 'children', 'class'])
  return (
    <button
      type="button"
      {...rest}
      class={l.class ? `${c.button.button} ${l.class}` : c.button.button}
      data-variant={l.variant ?? 'primary'}
      data-size={l.size ?? 'md'}
      data-state={l.loading ? 'loading' : 'idle'}
      aria-busy={l.loading || undefined}
      disabled={rest.disabled || l.loading}
    >
      <span class={c.button.label}>{l.children}</span>
    </button>
  )
}

export interface BadgeProps {
  variant?:
    | 'default'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'destructive'
    | 'outline'
    | 'info'
    | 'primary'
  size?: 'sm' | 'md'
  children?: JSX.Element
}

export function Badge(props: BadgeProps): JSX.Element {
  return (
    <span
      class={c.badge.badge}
      data-variant={props.variant ?? 'default'}
      data-size={props.size ?? 'md'}
    >
      {props.children}
    </span>
  )
}

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  title?: JSX.Element
  footer?: JSX.Element
  children?: JSX.Element
}

export function Card(props: CardProps): JSX.Element {
  return (
    <div
      class={c.card.card}
      data-cascivo-card=""
      data-variant={props.variant ?? 'default'}
      data-padding={props.padding ?? 'md'}
    >
      <Show when={props.title}>
        <div class={c.card.header}>
          <h3 class={c.card.title}>{props.title}</h3>
        </div>
      </Show>
      <div class={c.card.content}>{props.children}</div>
      <Show when={props.footer}>
        <div class={c.card.footer}>{props.footer}</div>
      </Show>
    </div>
  )
}

export interface AlertProps {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
  title?: JSX.Element
  children?: JSX.Element
}

export function Alert(props: AlertProps): JSX.Element {
  return (
    <div
      class={c.alert.alert}
      role={props.variant === 'destructive' ? 'alert' : 'status'}
      data-variant={props.variant ?? 'default'}
    >
      <div class={c.alert.body}>
        <Show when={props.title}>
          <div class={c.alert.title}>{props.title}</div>
        </Show>
        <div class={c.alert.content}>{props.children}</div>
      </div>
    </div>
  )
}

export interface FieldProps {
  /** Server/validation message; presence flips the field to `invalid` and renders `role="alert"`. */
  error?: string | undefined
  description?: JSX.Element
  disabled?: boolean
  children?: JSX.Element
}

export function Field(props: FieldProps): JSX.Element {
  return (
    <div
      class={c.field.field}
      data-state={props.disabled ? 'disabled' : props.error ? 'invalid' : 'default'}
      data-disabled={props.disabled ? '' : undefined}
    >
      {props.children}
      <Show when={props.description}>
        <p class={c.field.description}>{props.description}</p>
      </Show>
      <Show when={props.error}>
        <p class={c.field.error} role="alert">
          {props.error}
        </p>
      </Show>
    </div>
  )
}

interface TextControlProps {
  label: JSX.Element
  error?: string | undefined
  hint?: JSX.Element
  size?: 'sm' | 'md' | 'lg'
}

export type InputProps = TextControlProps & Omit<Html<'input'>, 'size'>

export function Input(props: InputProps): JSX.Element {
  const [l, rest] = splitProps(props, ['label', 'error', 'hint', 'size', 'id'])
  const id = () => l.id ?? rest.name ?? ''
  return (
    <div class={c.input.wrapper} data-state={l.error ? 'error' : 'idle'} data-size={l.size ?? 'md'}>
      <label class={c.input.label} for={id()}>
        {l.label}
      </label>
      <input
        {...rest}
        id={id()}
        class={c.input.input}
        aria-invalid={l.error ? true : undefined}
        aria-describedby={l.error ? `${id()}-error` : undefined}
      />
      <Show when={l.error}>
        <p class={c.input.error} id={`${id()}-error`} role="alert">
          {l.error}
        </p>
      </Show>
      <Show when={l.hint}>
        <p class={c.input.hint}>{l.hint}</p>
      </Show>
    </div>
  )
}

export type TextareaProps = Omit<TextControlProps, 'size'> & Html<'textarea'>

export function Textarea(props: TextareaProps): JSX.Element {
  const [l, rest] = splitProps(props, ['label', 'error', 'hint', 'id'])
  const id = () => l.id ?? rest.name ?? ''
  return (
    <div class={c.textarea.wrapper} data-state={l.error ? 'error' : 'idle'}>
      <label class={c.textarea.label} for={id()}>
        {l.label}
      </label>
      <textarea
        {...rest}
        id={id()}
        class={c.textarea.textarea}
        aria-invalid={l.error ? true : undefined}
        aria-describedby={l.error ? `${id()}-error` : undefined}
      />
      <Show when={l.error}>
        <p class={c.textarea.error} id={`${id()}-error`} role="alert">
          {l.error}
        </p>
      </Show>
      <Show when={l.hint}>
        <p class={c.textarea.hint}>{l.hint}</p>
      </Show>
    </div>
  )
}

export type SelectProps = TextControlProps &
  Omit<Html<'select'>, 'size'> & { children?: JSX.Element }

export function Select(props: SelectProps): JSX.Element {
  const [l, rest] = splitProps(props, ['label', 'error', 'hint', 'size', 'id', 'children'])
  const id = () => l.id ?? rest.name ?? ''
  return (
    <div
      class={c.select.wrapper}
      data-state={l.error ? 'error' : 'idle'}
      data-size={l.size ?? 'md'}
    >
      <label class={c.select.label} for={id()}>
        {l.label}
      </label>
      <div class={c.select.field}>
        <select
          {...rest}
          id={id()}
          class={c.select.select}
          aria-invalid={l.error ? true : undefined}
          aria-describedby={l.error ? `${id()}-error` : undefined}
        >
          {l.children}
        </select>
      </div>
      <Show when={l.error}>
        <p class={c.select.error} id={`${id()}-error`} role="alert">
          {l.error}
        </p>
      </Show>
      <Show when={l.hint}>
        <p class={c.select.hint}>{l.hint}</p>
      </Show>
    </div>
  )
}

import type { ComponentChildren } from 'preact'

export declare function User(props: {
  name: ComponentChildren
  description?: ComponentChildren
  avatarProps?: Record<string, unknown>
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element

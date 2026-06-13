// Type shims for cascade components — avoids cross-package TSC boundary issues.
// Vite resolves the actual source at build time via the package exports map.

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '@cascivo/components/button' {
  import type { ComponentChildren } from 'preact'
  export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    className?: string
    onClick?: (e: MouseEvent) => void
    children?: ComponentChildren
    [key: string]: unknown
  }
  export function Button(props: ButtonProps): JSX.Element
}

declare module '@cascivo/components/input' {
  export interface InputProps {
    label?: string
    hint?: string
    error?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    className?: string
    id?: string
    placeholder?: string
    defaultValue?: string
    value?: string
    onFocus?: (e: FocusEvent) => void
    onBlur?: (e: FocusEvent) => void
    onChange?: (e: Event) => void
    [key: string]: unknown
  }
  export function Input(props: InputProps): JSX.Element
}

declare module '@cascivo/components/card' {
  import type { ComponentChildren } from 'preact'
  export interface CardProps {
    variant?: 'default' | 'outlined' | 'elevated'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    className?: string
    children?: ComponentChildren
    [key: string]: unknown
  }
  export interface CardHeaderProps {
    className?: string
    children?: ComponentChildren
    [key: string]: unknown
  }
  export interface CardTitleProps {
    className?: string
    children?: ComponentChildren
    [key: string]: unknown
  }
  export interface CardContentProps {
    className?: string
    children?: ComponentChildren
    [key: string]: unknown
  }
  export interface CardFooterProps {
    className?: string
    children?: ComponentChildren
    [key: string]: unknown
  }
  export function Card(props: CardProps): JSX.Element
  export function CardHeader(props: CardHeaderProps): JSX.Element
  export function CardTitle(props: CardTitleProps): JSX.Element
  export function CardContent(props: CardContentProps): JSX.Element
  export function CardFooter(props: CardFooterProps): JSX.Element
}

declare module '@cascivo/components/badge' {
  import type { ComponentChildren } from 'preact'
  export interface BadgeProps {
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
    size?: 'sm' | 'md'
    className?: string
    children?: ComponentChildren
    [key: string]: unknown
  }
  export function Badge(props: BadgeProps): JSX.Element
}

declare module '@cascivo/components/modal' {
  import type { ComponentChildren } from 'preact'
  export interface ModalProps {
    open?: boolean
    onClose?: () => void
    title?: string
    description?: string
    children?: ComponentChildren
    className?: string
    size?: 'sm' | 'md' | 'lg'
  }
  export function Modal(props: ModalProps): JSX.Element
}

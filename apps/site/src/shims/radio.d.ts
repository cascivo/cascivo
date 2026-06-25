import type { ComponentChildren } from 'preact'

export interface RadioProps {
  label?: string
  value: string
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

export interface RadioGroupProps {
  name: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
  children?: ComponentChildren
}

export declare function Radio(props: RadioProps): JSX.Element
export declare function RadioGroup(props: RadioGroupProps): JSX.Element

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

export declare function Input(props: InputProps): JSX.Element

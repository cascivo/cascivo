export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  options: SelectOption[]
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

export declare function Select(props: SelectProps): JSX.Element

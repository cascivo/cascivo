export interface NumberInputProps {
  value?: number | null
  defaultValue?: number
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  formatOptions?: Intl.NumberFormatOptions
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  incrementLabel?: string
  decrementLabel?: string
  className?: string
  id?: string
  [key: string]: unknown
}

export declare function NumberInput(props: NumberInputProps): JSX.Element

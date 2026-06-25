export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}
export interface ComboboxLabels {
  placeholder?: string
  empty?: string
  clear?: string
}
export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string | undefined) => void
  clearable?: boolean
  searchable?: boolean
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  labels?: ComboboxLabels
  className?: string
}
export declare function Combobox(props: ComboboxProps): JSX.Element

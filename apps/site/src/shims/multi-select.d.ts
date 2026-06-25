export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export declare function MultiSelect(props: {
  options: MultiSelectOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  className?: string
  [key: string]: unknown
}): JSX.Element

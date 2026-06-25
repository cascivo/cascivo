export interface SearchProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  debounceMs?: number
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
  disabled?: boolean
  clearLabel?: string
  id?: string
  className?: string
}

export declare function Search(props: SearchProps): JSX.Element

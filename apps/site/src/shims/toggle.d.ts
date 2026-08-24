export interface ToggleProps {
  checked?: boolean
  defaultChecked?: boolean
  onValueChange?: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

export declare function Toggle(props: ToggleProps): JSX.Element

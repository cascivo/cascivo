export interface ToggleProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

export declare function Toggle(props: ToggleProps): JSX.Element

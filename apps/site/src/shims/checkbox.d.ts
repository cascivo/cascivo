export interface CheckboxProps {
  label?: string
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

export declare function Checkbox(props: CheckboxProps): JSX.Element

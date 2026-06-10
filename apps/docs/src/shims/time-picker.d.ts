export interface TimePickerProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  min?: string
  max?: string
  step?: number
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  [key: string]: unknown
}
export declare function TimePicker(props: TimePickerProps): JSX.Element

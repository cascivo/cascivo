export interface DatePickerLabels {
  placeholder?: string
  previousMonth?: string
  nextMonth?: string
  clear?: string
}
export interface DatePickerProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string | undefined) => void
  min?: string
  max?: string
  clearable?: boolean
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  labels?: DatePickerLabels
  className?: string
  id?: string
}
export declare function DatePicker(props: DatePickerProps): JSX.Element

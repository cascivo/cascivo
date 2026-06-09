export interface SliderProps {
  label?: string
  min?: number
  max?: number
  step?: number
  value?: number
  defaultValue?: number
  onChange?: (e: Event) => void
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

export declare function Slider(props: SliderProps): JSX.Element

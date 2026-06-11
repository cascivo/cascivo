export interface SegmentedControlOption {
  value: string
  label: string
  disabled?: boolean
}

export declare function SegmentedControl(props: {
  options: SegmentedControlOption[]
  value?: string
  onChange?: (value: string) => void
  className?: string
  [key: string]: unknown
}): JSX.Element
